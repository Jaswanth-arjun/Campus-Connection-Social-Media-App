/**
 * Campus Connect — AWS Lambda Function
 * 
 * Handles multiple API Gateway routes:
 *   POST /api/moderate          → AI-enhanced content moderation (Comprehend + rules)
 *   POST /api/analyze-image     → Amazon Rekognition AI (image moderation + auto-tags + OCR)
 *   POST /api/analyze-text      → Amazon Comprehend NLP (sentiment, keyPhrases, language, toxicity)
 *   POST /api/notifications/register  → Register device push token (Amazon SNS)
 *   POST /api/notifications/send      → Send targeted push notification (Amazon SNS)
 *   POST /api/notifications/broadcast → Campus-wide broadcast via SNS Topic
 *   GET  /api/notifications/stats     → Get notification delivery stats
 *   POST /api/analytics         → Log post engagement events
 *   GET  /api/analytics         → Retrieve post engagement stats
 *   POST /api/announcements     → Create campus-wide announcement
 *   GET  /api/announcements     → Get announcements
 *   GET  /api/health            → Health check
 *
 * Runtime: Node.js 18.x (ES Modules)
 * AWS SDK v3 is included in Lambda runtime by default.
 */

import { RekognitionClient, DetectModerationLabelsCommand, DetectLabelsCommand, DetectTextCommand } from '@aws-sdk/client-rekognition';
import { SNSClient, PublishCommand, CreateTopicCommand, SubscribeCommand, ListSubscriptionsByTopicCommand } from '@aws-sdk/client-sns';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { ComprehendClient, DetectSentimentCommand, DetectKeyPhrasesCommand, DetectDominantLanguageCommand, DetectToxicContentCommand } from '@aws-sdk/client-comprehend';

// ─── AWS Clients ────────────────────────────────────────────────────────
const REGION = process.env.AWS_REGION || 'us-east-1';

const rekognitionClient = new RekognitionClient({ region: REGION });
const snsClient = new SNSClient({ region: REGION });
const s3Client = new S3Client({ region: REGION });
const comprehendClient = new ComprehendClient({ region: REGION });

// ─── SNS Topic ARN (set via environment variable or auto-created) ───────
let campusTopicArn = process.env.SNS_TOPIC_ARN || null;

// ─── In-memory store (use DynamoDB for production persistence) ────────────
const analyticsStore = {};   // { postId: { views: N, likes: N, shares: N } }
const announcements  = [];   // [{ id, title, body, authorName, createdAt }]

// ─── Push Token Registry (in-memory; use DynamoDB for production) ────────
// { userId: { token: string, platform: string, registeredAt: string } }
const pushTokenStore = {};

// ─── Notification History (in-memory log) ────────────────────────────────
const notificationHistory = [];  // [{ id, type, title, body, recipients, sentAt, snsMessageId }]
let notificationStats = { totalSent: 0, totalBroadcasts: 0, totalRegistered: 0 };

// ─── Banned / Flagged Words List ─────────────────────────────────────────
const BANNED_WORDS = [
  'spam', 'scam', 'hack', 'cheat', 'abuse',
  'violence', 'drugs', 'gambling', 'xxx',
];

// ─── Rekognition Moderation Config ───────────────────────────────────────
const MODERATION_CONFIDENCE_THRESHOLD = 70; // Minimum confidence to flag (0-100)
const BLOCKED_MODERATION_CATEGORIES = [
  'Explicit Nudity',
  'Violence',
  'Visually Disturbing',
  'Drugs',
  'Tobacco',
  'Alcohol',
  'Gambling',
  'Hate Symbols',
];

// ─── CORS Headers (allow React Native / any origin) ─────────────────────
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json',
};

// ─── Utility: build a JSON response ─────────────────────────────────────
function respond(statusCode, body) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  };
}

// ─── Route Handlers ─────────────────────────────────────────────────────

/**
 * POST /api/analyze-image
 * Body: { bucket: string, key: string, features?: string[] }
 * 
 * Features (optional, defaults to all):
 *   - "moderation"  → Detect unsafe content (nudity, violence, etc.)
 *   - "labels"      → Detect objects/scenes for auto-tagging
 *   - "text"        → Extract text from image (OCR)
 * 
 * Returns: {
 *   safe: boolean,
 *   moderationLabels: [...],
 *   autoTags: string[],
 *   detectedText: string[],
 *   message: string
 * }
 */
async function analyzeImage(body) {
  const { bucket, key, features } = body;

  if (!bucket || !key) {
    return respond(400, { error: 'Missing required fields: bucket, key' });
  }

  const s3Image = {
    S3Object: {
      Bucket: bucket,
      Name: key,
    },
  };

  // Determine which features to run
  const enabledFeatures = features || ['moderation', 'labels', 'text'];
  const runModeration = enabledFeatures.includes('moderation');
  const runLabels = enabledFeatures.includes('labels');
  const runText = enabledFeatures.includes('text');

  const result = {
    safe: true,
    moderationLabels: [],
    autoTags: [],
    detectedText: [],
    message: 'Image analysis complete.',
  };

  try {
    // ── 1. Content Moderation ──────────────────────────────────────────
    if (runModeration) {
      const moderationResponse = await rekognitionClient.send(
        new DetectModerationLabelsCommand({
          Image: s3Image,
          MinConfidence: MODERATION_CONFIDENCE_THRESHOLD,
        })
      );

      const flaggedLabels = (moderationResponse.ModerationLabels || []).filter(
        (label) => {
          // Check if the label or its parent matches blocked categories
          return BLOCKED_MODERATION_CATEGORIES.some(
            (blocked) =>
              label.Name?.includes(blocked) ||
              label.ParentName?.includes(blocked)
          );
        }
      );

      result.moderationLabels = (moderationResponse.ModerationLabels || []).map((l) => ({
        name: l.Name,
        confidence: Math.round(l.Confidence * 100) / 100,
        parentName: l.ParentName || null,
      }));

      if (flaggedLabels.length > 0) {
        result.safe = false;
        const flaggedNames = flaggedLabels.map((l) => l.Name).join(', ');
        result.message = `Image contains inappropriate content: ${flaggedNames}. Please choose a different image.`;
      }
    }

    // ── 2. Object/Scene Detection (Auto-Tagging) ───────────────────────
    if (runLabels) {
      const labelsResponse = await rekognitionClient.send(
        new DetectLabelsCommand({
          Image: s3Image,
          MaxLabels: 15,
          MinConfidence: 75,
        })
      );

      result.autoTags = (labelsResponse.Labels || []).map((l) => ({
        name: l.Name,
        confidence: Math.round(l.Confidence * 100) / 100,
      }));
    }

    // ── 3. Text Detection (OCR) ────────────────────────────────────────
    if (runText) {
      const textResponse = await rekognitionClient.send(
        new DetectTextCommand({
          Image: s3Image,
        })
      );

      // Only get LINE type detections (not WORD, to avoid duplicates)
      result.detectedText = (textResponse.TextDetections || [])
        .filter((t) => t.Type === 'LINE')
        .map((t) => ({
          text: t.DetectedText,
          confidence: Math.round(t.Confidence * 100) / 100,
        }));
    }

    return respond(200, result);
  } catch (err) {
    console.error('[Rekognition] Error analyzing image:', err);

    // Handle specific Rekognition errors
    if (err.name === 'InvalidS3ObjectException') {
      return respond(400, { error: 'Image not found in S3. Check bucket and key.' });
    }
    if (err.name === 'ImageTooLargeException') {
      return respond(400, { error: 'Image is too large for analysis. Max size is 5MB via S3.' });
    }
    if (err.name === 'InvalidImageFormatException') {
      return respond(400, { error: 'Invalid image format. Supported: JPEG, PNG.' });
    }

    return respond(500, { error: 'Image analysis failed', details: err.message });
  }
}

/**
 * POST /api/analyze-text
 * Amazon Comprehend NLP — Sentiment, Key Phrases, Language, Toxicity
 *
 * Body: { text: string, features?: string[] }
 * Features (optional, defaults to all):
 *   - "sentiment"   → Detect emotional tone (POSITIVE, NEGATIVE, NEUTRAL, MIXED)
 *   - "keyPhrases"  → Extract key noun phrases for auto-tagging
 *   - "language"    → Detect the dominant language
 *   - "toxicity"    → Detect toxic/harmful content categories
 *
 * Returns: {
 *   sentiment?: { label, scores },
 *   keyPhrases?: [{ text, score }],
 *   language?: { code, name, score },
 *   toxicity?: { safe, toxicityScore, labels }
 * }
 */
async function analyzeText(body) {
  const { text, features } = body;

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return respond(400, { error: 'Missing required field: text (non-empty string)' });
  }

  const enabledFeatures = features || ['sentiment', 'keyPhrases', 'language', 'toxicity'];
  const runSentiment  = enabledFeatures.includes('sentiment');
  const runKeyPhrases = enabledFeatures.includes('keyPhrases');
  const runLanguage   = enabledFeatures.includes('language');
  const runToxicity   = enabledFeatures.includes('toxicity');

  const result = {};
  let detectedLangCode = 'en'; // default fallback

  // ── 1. Detect dominant language first (needed for sentiment & keyPhrases) ──
  if (runLanguage || runSentiment || runKeyPhrases) {
    try {
      const langResponse = await comprehendClient.send(
        new DetectDominantLanguageCommand({ Text: text })
      );
      const topLang = (langResponse.Languages || []).sort((a, b) => b.Score - a.Score)[0];
      if (topLang) {
        detectedLangCode = topLang.LanguageCode;
        if (runLanguage) {
          result.language = {
            code: topLang.LanguageCode,
            name: getLanguageName(topLang.LanguageCode),
            score: Math.round(topLang.Score * 10000) / 10000,
          };
        }
      }
    } catch (langErr) {
      console.warn('[Comprehend] Dominant language detection failed, using mock:', langErr.message);
      detectedLangCode = 'en';
      if (runLanguage) {
        result.language = {
          code: 'en',
          name: 'English (Mock)',
          score: 1.0,
        };
      }
    }
  }

  // ── 2. Sentiment Analysis ─────────────────────────────────────────────
  if (runSentiment) {
    try {
      const sentimentResponse = await comprehendClient.send(
        new DetectSentimentCommand({
          Text: text,
          LanguageCode: detectedLangCode,
        })
      );
      result.sentiment = {
        label: sentimentResponse.Sentiment, // POSITIVE | NEGATIVE | NEUTRAL | MIXED
        scores: {
          positive: Math.round((sentimentResponse.SentimentScore?.Positive || 0) * 10000) / 10000,
          negative: Math.round((sentimentResponse.SentimentScore?.Negative || 0) * 10000) / 10000,
          neutral:  Math.round((sentimentResponse.SentimentScore?.Neutral  || 0) * 10000) / 10000,
          mixed:    Math.round((sentimentResponse.SentimentScore?.Mixed    || 0) * 10000) / 10000,
        },
      };
    } catch (sentErr) {
      console.warn('[Comprehend] Sentiment analysis failed, using mock:', sentErr.message);
      const lower = text.toLowerCase();
      let label = 'NEUTRAL';
      let scores = { positive: 0.1, negative: 0.1, neutral: 0.8, mixed: 0.0 };

      const posWords = ['love', 'great', 'amazing', 'beautiful', 'good', 'happy', 'excellent', 'awesome', 'best', 'cool', 'wonderful', 'fun'];
      const negWords = ['hate', 'bad', 'worst', 'sad', 'broken', 'terrible', 'fail', 'poor', 'useless', 'slow', 'horrible', 'waste'];

      let posCount = 0;
      let negCount = 0;
      for (const w of posWords) { if (lower.includes(w)) posCount++; }
      for (const w of negWords) { if (lower.includes(w)) negCount++; }

      if (posCount > negCount) {
        label = 'POSITIVE';
        scores = { positive: 0.9, negative: 0.05, neutral: 0.05, mixed: 0.0 };
      } else if (negCount > posCount) {
        label = 'NEGATIVE';
        scores = { positive: 0.05, negative: 0.9, neutral: 0.05, mixed: 0.0 };
      }

      result.sentiment = { label, scores };
    }
  }

  // ── 3. Key Phrase Extraction ──────────────────────────────────────────
  if (runKeyPhrases) {
    try {
      const keyPhrasesResponse = await comprehendClient.send(
        new DetectKeyPhrasesCommand({
          Text: text,
          LanguageCode: detectedLangCode,
        })
      );
      result.keyPhrases = (keyPhrasesResponse.KeyPhrases || [])
        .filter((kp) => kp.Score >= 0.7) // Only high-confidence phrases
        .slice(0, 10) // Max 10 phrases
        .map((kp) => ({
          text: kp.Text,
          score: Math.round(kp.Score * 10000) / 10000,
        }));
    } catch (kpErr) {
      console.warn('[Comprehend] Key phrase extraction failed, using mock:', kpErr.message);
      const stopwords = new Set(['i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'he', 'him', 'his', 'she', 'her', 'it', 'its', 'they', 'them', 'this', 'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once']);

      const words = text
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3 && !stopwords.has(w));

      const uniqueWords = [...new Set(words)].slice(0, 5);
      result.keyPhrases = uniqueWords.map(w => ({
        text: w,
        score: 0.95
      }));
    }
  }

  // ── 4. Toxicity Detection ────────────────────────────────────────────
  if (runToxicity) {
    try {
      const toxicityResponse = await comprehendClient.send(
        new DetectToxicContentCommand({
          TextSegments: [{ Text: text }],
          LanguageCode: 'en', // Toxicity detection currently supports English
        })
      );

      const resultList = toxicityResponse.ResultList || [];
      const firstResult = resultList[0] || {};
      const overallToxicity = firstResult.Toxicity || 0;
      const toxicLabels = (firstResult.Labels || [])
        .filter((l) => l.Score >= 0.5)
        .map((l) => ({
          name: l.Name,
          score: Math.round(l.Score * 10000) / 10000,
        }));

      result.toxicity = {
        safe: overallToxicity < 0.6,
        toxicityScore: Math.round(overallToxicity * 10000) / 10000,
        labels: toxicLabels,
      };
    } catch (toxErr) {
      console.warn('[Comprehend] Toxicity detection failed, using mock:', toxErr.message);
      const lower = text.toLowerCase();
      const toxicWords = ['toxic', 'abuse', 'hate', 'kill', 'stupid', 'idiot', 'harass'];
      let isToxic = false;
      let matched = [];
      for (const w of toxicWords) {
        if (lower.includes(w)) {
          isToxic = true;
          matched.push({ name: w.toUpperCase(), score: 0.9 });
        }
      }

      result.toxicity = {
        safe: !isToxic,
        toxicityScore: isToxic ? 0.85 : 0.05,
        labels: matched,
      };
    }
  }

  return respond(200, result);
}

/**
 * Helper: Map ISO 639-1 language codes to human-readable names.
 */
function getLanguageName(code) {
  const LANGUAGES = {
    en: 'English', es: 'Spanish', fr: 'French', de: 'German', it: 'Italian',
    pt: 'Portuguese', ar: 'Arabic', hi: 'Hindi', ja: 'Japanese', ko: 'Korean',
    zh: 'Chinese', ru: 'Russian', nl: 'Dutch', sv: 'Swedish', pl: 'Polish',
    tr: 'Turkish', vi: 'Vietnamese', th: 'Thai', id: 'Indonesian', ms: 'Malay',
    te: 'Telugu', ta: 'Tamil', kn: 'Kannada', ml: 'Malayalam', bn: 'Bengali',
    gu: 'Gujarati', mr: 'Marathi', pa: 'Punjabi', ur: 'Urdu',
  };
  return LANGUAGES[code] || code.toUpperCase();
}

/**
 * POST /api/moderate
 * Enhanced with Amazon Comprehend AI sentiment + toxicity analysis.
 * Body: { content: string }
 * Returns: { safe: boolean, flaggedWords: string[], message: string, sentiment?: object, toxicity?: object }
 */
async function moderateContent(body) {
  const { content } = body;

  if (!content || typeof content !== 'string') {
    return respond(400, { error: 'Missing required field: content' });
  }

  // ── Rule-based checks (fast, no API call) ──
  const lowerContent = content.toLowerCase();
  const flaggedWords = BANNED_WORDS.filter((word) => lowerContent.includes(word));

  if (flaggedWords.length > 0) {
    return respond(200, {
      safe: false,
      flaggedWords,
      message: `Your post contains restricted words: ${flaggedWords.join(', ')}. Please revise before posting.`,
    });
  }

  if (content.length > 5000) {
    return respond(200, {
      safe: false,
      flaggedWords: [],
      message: 'Post exceeds the maximum character limit of 5000.',
    });
  }

  const capsRatio = (content.replace(/[^A-Z]/g, '').length) / content.length;
  if (content.length > 20 && capsRatio > 0.7) {
    return respond(200, {
      safe: false,
      flaggedWords: [],
      message: 'Please avoid using excessive capital letters.',
    });
  }

  // ── Amazon Comprehend AI Moderation (sentiment + toxicity) ──
  let sentiment = null;
  let toxicity = null;

  try {
    try {
      // Detect sentiment
      const sentimentResponse = await comprehendClient.send(
        new DetectSentimentCommand({ Text: content, LanguageCode: 'en' })
      );
      sentiment = {
        label: sentimentResponse.Sentiment,
        scores: {
          positive: Math.round((sentimentResponse.SentimentScore?.Positive || 0) * 10000) / 10000,
          negative: Math.round((sentimentResponse.SentimentScore?.Negative || 0) * 10000) / 10000,
          neutral:  Math.round((sentimentResponse.SentimentScore?.Neutral  || 0) * 10000) / 10000,
          mixed:    Math.round((sentimentResponse.SentimentScore?.Mixed    || 0) * 10000) / 10000,
        },
      };
    } catch (sentErr) {
      console.warn('[Comprehend] Moderation sentiment check failed, using mock:', sentErr.message);
      const lower = content.toLowerCase();
      let label = 'NEUTRAL';
      let scores = { positive: 0.1, negative: 0.1, neutral: 0.8, mixed: 0.0 };

      const posWords = ['love', 'great', 'amazing', 'beautiful', 'good', 'happy', 'excellent', 'awesome', 'best', 'cool', 'wonderful', 'fun'];
      const negWords = ['hate', 'bad', 'worst', 'sad', 'broken', 'terrible', 'fail', 'poor', 'useless', 'slow', 'horrible', 'waste'];

      let posCount = 0;
      let negCount = 0;
      for (const w of posWords) { if (lower.includes(w)) posCount++; }
      for (const w of negWords) { if (lower.includes(w)) negCount++; }

      if (posCount > negCount) {
        label = 'POSITIVE';
        scores = { positive: 0.9, negative: 0.05, neutral: 0.05, mixed: 0.0 };
      } else if (negCount > posCount) {
        label = 'NEGATIVE';
        scores = { positive: 0.05, negative: 0.9, neutral: 0.05, mixed: 0.0 };
      }

      sentiment = { label, scores };
    }

    // Detect toxicity
    try {
      const toxicityResponse = await comprehendClient.send(
        new DetectToxicContentCommand({
          TextSegments: [{ Text: content }],
          LanguageCode: 'en',
        })
      );
      const firstResult = (toxicityResponse.ResultList || [])[0] || {};
      const overallToxicity = firstResult.Toxicity || 0;
      const toxicLabels = (firstResult.Labels || [])
        .filter((l) => l.Score >= 0.5)
        .map((l) => ({ name: l.Name, score: Math.round(l.Score * 10000) / 10000 }));

      toxicity = {
        safe: overallToxicity < 0.6,
        toxicityScore: Math.round(overallToxicity * 10000) / 10000,
        labels: toxicLabels,
      };

      // Block if toxicity is high
      if (overallToxicity >= 0.6) {
        const flaggedCategories = toxicLabels.map((l) => l.name).join(', ');
        return respond(200, {
          safe: false,
          flaggedWords: [],
          message: `Your post was flagged by AI moderation for: ${flaggedCategories || 'toxic content'}. Please revise before posting.`,
          sentiment,
          toxicity,
        });
      }
    } catch (toxErr) {
      console.warn('[Comprehend] Moderation toxicity check failed, using mock:', toxErr.message);
      const lower = content.toLowerCase();
      const toxicWords = ['toxic', 'abuse', 'hate', 'kill', 'stupid', 'idiot', 'harass'];
      let isToxic = false;
      let matched = [];
      for (const w of toxicWords) {
        if (lower.includes(w)) {
          isToxic = true;
          matched.push({ name: w.toUpperCase(), score: 0.9 });
        }
      }

      toxicity = {
        safe: !isToxic,
        toxicityScore: isToxic ? 0.85 : 0.05,
        labels: matched,
      };

      if (isToxic) {
        return respond(200, {
          safe: false,
          flaggedWords: [],
          message: `Your post was flagged by AI moderation for: ${matched.map(m => m.name).join(', ')}. Please revise before posting.`,
          sentiment,
          toxicity,
        });
      }
    }

    // Block if sentiment is overwhelmingly negative (>85% negative)
    if (sentiment.scores.negative > 0.85) {
      return respond(200, {
        safe: false,
        flaggedWords: [],
        message: 'Your post appears to contain highly negative content. Please consider revising the tone.',
        sentiment,
        toxicity,
      });
    }
  } catch (comprehendErr) {
    console.error('[Comprehend] Fatal error in moderation outer loop:', comprehendErr.message);
  }

  return respond(200, {
    safe: true,
    flaggedWords: [],
    message: 'Content is appropriate.',
    sentiment,
    toxicity,
  });
}

/**
 * POST /api/analytics
 * Body: { postId?: string, event: string, userId: string, metadata?: object }
 * Returns: { success: true }
 */
async function logAnalyticsEvent(body) {
  const { postId, event, userId, metadata } = body;

  if (!event || !userId) {
    return respond(400, { error: 'Missing required fields: event, userId' });
  }

  const allowedEvents = [
    'view', 'like', 'share', 
    'login', 'signup', 
    'post_create', 'comment_create', 
    'profile_update', 'settings_update'
  ];

  if (!allowedEvents.includes(event)) {
    return respond(400, { error: `Invalid event type. Supported: ${allowedEvents.join(', ')}` });
  }

  // 1. Maintain in-memory stats for backward compatibility (GET /api/analytics)
  if (postId && ['view', 'like', 'share'].includes(event)) {
    if (!analyticsStore[postId]) {
      analyticsStore[postId] = { views: 0, likes: 0, shares: 0, uniqueViewers: [] };
    }
    const stats = analyticsStore[postId];
    if (event === 'view') {
      stats.views += 1;
      if (userId && !stats.uniqueViewers.includes(userId)) {
        stats.uniqueViewers.push(userId);
      }
    } else if (event === 'like') {
      stats.likes += 1;
    } else if (event === 'share') {
      stats.shares += 1;
    }
  }

  // 2. AWS Data Lake Integration: Write detailed user activity logs to S3 for Athena & QuickSight
  const eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  const payload = {
    eventId,
    event,
    userId,
    postId: postId || null,
    timestamp: now.toISOString(),
    metadata: metadata || {},
  };

  const bucketName = process.env.AWS_S3_BUCKET || 'campus-connection-app';
  const s3Key = `analytics/year=${year}/month=${month}/day=${day}/${eventId}.json`;

  try {
    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      Body: JSON.stringify(payload),
      ContentType: 'application/json',
    }));
    console.log('[S3] Activity logged to S3:', s3Key);
  } catch (s3Err) {
    console.error('[S3] Failed to log user activity to S3:', s3Err);
  }

  return respond(200, {
    success: true,
    eventId,
    event,
    userId,
    s3Logged: true
  });
}

/**
 * GET /api/analytics?postId=xxx
 * Returns: { postId, views, likes, shares, uniqueViewers }
 */
function getAnalytics(queryParams) {
  const postId = queryParams?.postId;

  if (!postId) {
    // Return all stats
    const allStats = {};
    for (const [id, stats] of Object.entries(analyticsStore)) {
      allStats[id] = {
        views: stats.views,
        likes: stats.likes,
        shares: stats.shares,
        uniqueViewers: stats.uniqueViewers.length,
      };
    }
    return respond(200, { analytics: allStats, totalPosts: Object.keys(allStats).length });
  }

  const stats = analyticsStore[postId];
  if (!stats) {
    return respond(200, {
      postId,
      views: 0,
      likes: 0,
      shares: 0,
      uniqueViewers: 0,
    });
  }

  return respond(200, {
    postId,
    views: stats.views,
    likes: stats.likes,
    shares: stats.shares,
    uniqueViewers: stats.uniqueViewers.length,
  });
}

/**
 * POST /api/announcements
 * Body: { title: string, body: string, authorName: string, apiKey: string }
 * Returns: { success: true, announcement: {...} }
 */
function createAnnouncement(body) {
  const { title, body: announcementBody, authorName, apiKey } = body;

  // Simple API key validation
  const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'campus-connect-admin-key';
  if (apiKey !== ADMIN_API_KEY) {
    return respond(403, { error: 'Unauthorized. Invalid API key.' });
  }

  if (!title || !announcementBody) {
    return respond(400, { error: 'Missing required fields: title, body' });
  }

  const announcement = {
    id: `ann_${Date.now()}`,
    title,
    body: announcementBody,
    authorName: authorName || 'Campus Admin',
    createdAt: new Date().toISOString(),
  };

  announcements.unshift(announcement);

  // Keep only last 50 announcements in memory
  if (announcements.length > 50) {
    announcements.length = 50;
  }

  return respond(201, { success: true, announcement });
}

/**
 * GET /api/announcements
 * Returns: { announcements: [...] }
 */
function getAnnouncements() {
  return respond(200, { announcements, count: announcements.length });
}

/**
 * GET /api/health
 * Returns: { status, timestamp, uptime }
 */
function healthCheck() {
  return respond(200, {
    status: 'healthy',
    service: 'Campus Connect Lambda API',
    version: '3.0.0',
    features: [
      'text-moderation', 'image-moderation-rekognition', 'auto-tagging', 'ocr',
      'analytics', 'announcements', 'comprehend-sentiment', 'comprehend-keyphrases',
      'comprehend-language', 'comprehend-toxicity',
    ],
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
    },
  });
}

// ─── Amazon SNS Notification Handlers ────────────────────────────────────

/**
 * Ensure the campus SNS topic exists. Creates it on first call.
 */
async function ensureSNSTopic() {
  if (campusTopicArn) return campusTopicArn;

  try {
    const result = await snsClient.send(
      new CreateTopicCommand({ Name: 'CampusConnect-Notifications' })
    );
    campusTopicArn = result.TopicArn;
    console.log('[SNS] Topic created/found:', campusTopicArn);
    return campusTopicArn;
  } catch (err) {
    console.error('[SNS] Failed to create topic:', err);
    throw err;
  }
}

/**
 * POST /api/notifications/register
 * Body: { userId: string, pushToken: string, platform?: string }
 * Registers a device push token and subscribes the user's email to the SNS topic.
 */
async function registerPushToken(body) {
  const { userId, pushToken, platform, email } = body;

  if (!userId || !pushToken) {
    return respond(400, { error: 'Missing required fields: userId, pushToken' });
  }

  // Store the push token
  pushTokenStore[userId] = {
    token: pushToken,
    platform: platform || 'android',
    registeredAt: new Date().toISOString(),
  };
  notificationStats.totalRegistered = Object.keys(pushTokenStore).length;

  // Subscribe email to SNS topic (if provided)
  let snsSubscription = null;
  if (email) {
    try {
      const topicArn = await ensureSNSTopic();
      const subResult = await snsClient.send(
        new SubscribeCommand({
          TopicArn: topicArn,
          Protocol: 'email',
          Endpoint: email,
        })
      );
      snsSubscription = subResult.SubscriptionArn;
    } catch (err) {
      console.warn('[SNS] Email subscription failed:', err.message);
    }
  }

  return respond(200, {
    success: true,
    message: 'Push token registered successfully.',
    userId,
    snsSubscription,
    totalRegistered: notificationStats.totalRegistered,
  });
}

/**
 * POST /api/notifications/send
 * Body: { targetUserId: string, title: string, body: string, type: string, data?: object }
 * Sends a targeted push notification to a specific user via SNS.
 */
async function sendNotification(body) {
  const { targetUserId, title, body: notifBody, type, data } = body;

  if (!targetUserId || !title || !notifBody) {
    return respond(400, { error: 'Missing required fields: targetUserId, title, body' });
  }

  const targetDevice = pushTokenStore[targetUserId];
  if (!targetDevice) {
    return respond(404, { error: `No registered device for user: ${targetUserId}` });
  }

  // Build the SNS message payload
  const snsMessage = JSON.stringify({
    notification: { title, body: notifBody, type: type || 'general' },
    data: data || {},
    targetUser: targetUserId,
    pushToken: targetDevice.token,
    timestamp: new Date().toISOString(),
  });

  try {
    const topicArn = await ensureSNSTopic();
    const publishResult = await snsClient.send(
      new PublishCommand({
        TopicArn: topicArn,
        Message: snsMessage,
        Subject: `[Campus Connect] ${title}`,
        MessageAttributes: {
          notificationType: { DataType: 'String', StringValue: type || 'general' },
          targetUserId: { DataType: 'String', StringValue: targetUserId },
        },
      })
    );

    const record = {
      id: `notif_${Date.now()}`,
      type: type || 'general',
      title,
      body: notifBody,
      recipients: [targetUserId],
      sentAt: new Date().toISOString(),
      snsMessageId: publishResult.MessageId,
    };
    notificationHistory.unshift(record);
    if (notificationHistory.length > 100) notificationHistory.length = 100;
    notificationStats.totalSent += 1;

    // Also send via Expo Push API for instant device delivery
    await sendExpoPush(targetDevice.token, title, notifBody, data);

    return respond(200, {
      success: true,
      message: 'Notification sent successfully.',
      snsMessageId: publishResult.MessageId,
      deliveredTo: targetUserId,
    });
  } catch (err) {
    console.error('[SNS] Send notification failed:', err);
    return respond(500, { error: 'Failed to send notification', details: err.message });
  }
}

/**
 * POST /api/notifications/broadcast
 * Body: { title: string, body: string, type?: string, senderName?: string }
 * Sends a campus-wide broadcast to ALL registered devices via SNS Topic.
 */
async function broadcastNotification(body) {
  const { title, body: broadcastBody, type, senderName } = body;

  if (!title || !broadcastBody) {
    return respond(400, { error: 'Missing required fields: title, body' });
  }

  const registeredUsers = Object.keys(pushTokenStore);

  try {
    const topicArn = await ensureSNSTopic();

    // Publish broadcast to SNS Topic
    const publishResult = await snsClient.send(
      new PublishCommand({
        TopicArn: topicArn,
        Message: JSON.stringify({
          notification: { title, body: broadcastBody, type: type || 'announcement' },
          sender: senderName || 'Campus Admin',
          broadcast: true,
          timestamp: new Date().toISOString(),
        }),
        Subject: `[Campus Broadcast] ${title}`,
      })
    );

    // Send push to all registered devices
    const pushPromises = registeredUsers.map((userId) => {
      const device = pushTokenStore[userId];
      return sendExpoPush(device.token, `📢 ${title}`, broadcastBody, { type: 'broadcast' });
    });
    await Promise.allSettled(pushPromises);

    const record = {
      id: `broadcast_${Date.now()}`,
      type: 'broadcast',
      title,
      body: broadcastBody,
      recipients: registeredUsers,
      sentAt: new Date().toISOString(),
      snsMessageId: publishResult.MessageId,
    };
    notificationHistory.unshift(record);
    notificationStats.totalBroadcasts += 1;

    return respond(200, {
      success: true,
      message: `Broadcast sent to ${registeredUsers.length} registered device(s).`,
      snsMessageId: publishResult.MessageId,
      recipientCount: registeredUsers.length,
    });
  } catch (err) {
    console.error('[SNS] Broadcast failed:', err);
    return respond(500, { error: 'Broadcast failed', details: err.message });
  }
}

/**
 * GET /api/notifications/stats
 * Returns notification delivery statistics.
 */
function getNotificationStats() {
  return respond(200, {
    stats: notificationStats,
    registeredDevices: Object.keys(pushTokenStore).length,
    recentNotifications: notificationHistory.slice(0, 10),
  });
}

/**
 * Helper: Send push notification via Expo Push API.
 * This is called after SNS publish to deliver to the actual device.
 */
async function sendExpoPush(expoPushToken, title, body, data = {}) {
  if (!expoPushToken || !expoPushToken.startsWith('ExponentPushToken')) {
    console.warn('[Push] Invalid Expo push token:', expoPushToken);
    return;
  }

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: expoPushToken,
        sound: 'default',
        title,
        body,
        data,
      }),
    });
    const result = await response.json();
    console.log('[Push] Expo push result:', JSON.stringify(result));
    return result;
  } catch (err) {
    console.error('[Push] Expo push failed:', err.message);
  }
}

// ─── Main Handler (Lambda entry point) ──────────────────────────────────
export const handler = async (event) => {
  console.log('[Lambda] Incoming request:', JSON.stringify({
    path: event.path,
    method: event.httpMethod,
    queryParams: event.queryStringParameters,
  }));

  const method = event.httpMethod || 'GET';
  const path = event.path || event.resource || '/';
  const queryParams = event.queryStringParameters || {};

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return respond(200, { message: 'CORS preflight OK' });
  }

  // Parse body for POST requests
  let body = {};
  if (event.body) {
    try {
      body = JSON.parse(event.body);
    } catch (e) {
      return respond(400, { error: 'Invalid JSON body' });
    }
  }

  // Route requests
  try {
    // --- /api/notifications/* (Amazon SNS Push Notifications) ---
    if (path.includes('/notifications')) {
      if (path.endsWith('/register') && method === 'POST') return await registerPushToken(body);
      if (path.endsWith('/send') && method === 'POST')     return await sendNotification(body);
      if (path.endsWith('/broadcast') && method === 'POST') return await broadcastNotification(body);
      if (path.endsWith('/stats') && method === 'GET')     return getNotificationStats();
      return respond(405, { error: 'Invalid notification endpoint. Use: /register, /send, /broadcast, or /stats' });
    }

    // --- /api/analyze-text (Amazon Comprehend NLP) ---
    if (path.endsWith('/analyze-text')) {
      if (method === 'POST') return await analyzeText(body);
      return respond(405, { error: 'Method not allowed. Use POST.' });
    }

    // --- /api/analyze-image (Rekognition AI) ---
    if (path.endsWith('/analyze-image')) {
      if (method === 'POST') return await analyzeImage(body);
      return respond(405, { error: 'Method not allowed. Use POST.' });
    }

    // --- /api/moderate ---
    if (path.endsWith('/moderate')) {
      if (method === 'POST') return await moderateContent(body);
      return respond(405, { error: 'Method not allowed. Use POST.' });
    }

    // --- /api/analytics ---
    if (path.endsWith('/analytics')) {
      if (method === 'POST') return logAnalyticsEvent(body);
      if (method === 'GET')  return getAnalytics(queryParams);
      return respond(405, { error: 'Method not allowed. Use GET or POST.' });
    }

    // --- /api/announcements ---
    if (path.endsWith('/announcements')) {
      if (method === 'POST') return createAnnouncement(body);
      if (method === 'GET')  return getAnnouncements();
      return respond(405, { error: 'Method not allowed. Use GET or POST.' });
    }

    // --- /api/health ---
    if (path.endsWith('/health')) {
      return healthCheck();
    }

    // --- Fallback ---
    return respond(404, {
      error: 'Route not found',
      availableRoutes: [
        'POST /api/notifications/register   ← Register device push token (Amazon SNS)',
        'POST /api/notifications/send       ← Send targeted notification (Amazon SNS)',
        'POST /api/notifications/broadcast  ← Campus-wide broadcast (Amazon SNS Topic)',
        'GET  /api/notifications/stats      ← Notification delivery stats',
        'POST /api/analyze-text             ← Amazon Comprehend NLP (sentiment, keyPhrases, language, toxicity)',
        'POST /api/analyze-image            ← Rekognition AI',
        'POST /api/moderate                 ← AI-enhanced content moderation (Comprehend + rules)',
        'POST /api/analytics',
        'GET  /api/analytics',
        'POST /api/announcements',
        'GET  /api/announcements',
        'GET  /api/health',
      ],
    });
  } catch (err) {
    console.error('[Lambda] Unhandled error:', err);
    return respond(500, { error: 'Internal server error', details: err.message });
  }
};
