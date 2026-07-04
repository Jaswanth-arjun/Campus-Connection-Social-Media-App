/**
 * Campus Connect — AWS Lambda Function
 * 
 * Handles multiple API Gateway routes:
 *   POST /api/moderate          → Content moderation (checks post text)
 *   POST /api/analyze-image     → Amazon Rekognition AI (image moderation + auto-tags + OCR)
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

// ─── AWS Clients ────────────────────────────────────────────────────────
const REGION = process.env.AWS_REGION || 'us-east-1';

const rekognitionClient = new RekognitionClient({ region: REGION });
const snsClient = new SNSClient({ region: REGION });

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
 * POST /api/moderate
 * Body: { content: string }
 * Returns: { safe: boolean, flaggedWords: string[], message: string }
 */
function moderateContent(body) {
  const { content } = body;

  if (!content || typeof content !== 'string') {
    return respond(400, { error: 'Missing required field: content' });
  }

  const lowerContent = content.toLowerCase();
  const flaggedWords = BANNED_WORDS.filter((word) => lowerContent.includes(word));

  if (flaggedWords.length > 0) {
    return respond(200, {
      safe: false,
      flaggedWords,
      message: `Your post contains restricted words: ${flaggedWords.join(', ')}. Please revise before posting.`,
    });
  }

  // Additional checks
  if (content.length > 5000) {
    return respond(200, {
      safe: false,
      flaggedWords: [],
      message: 'Post exceeds the maximum character limit of 5000.',
    });
  }

  // Check for excessive caps (shouting)
  const capsRatio = (content.replace(/[^A-Z]/g, '').length) / content.length;
  if (content.length > 20 && capsRatio > 0.7) {
    return respond(200, {
      safe: false,
      flaggedWords: [],
      message: 'Please avoid using excessive capital letters.',
    });
  }

  return respond(200, {
    safe: true,
    flaggedWords: [],
    message: 'Content is appropriate.',
  });
}

/**
 * POST /api/analytics
 * Body: { postId: string, event: 'view' | 'like' | 'share', userId: string }
 * Returns: { success: true }
 */
function logAnalyticsEvent(body) {
  const { postId, event, userId } = body;

  if (!postId || !event) {
    return respond(400, { error: 'Missing required fields: postId, event' });
  }

  if (!['view', 'like', 'share'].includes(event)) {
    return respond(400, { error: 'Invalid event type. Must be: view, like, or share' });
  }

  if (!analyticsStore[postId]) {
    analyticsStore[postId] = { views: 0, likes: 0, shares: 0, uniqueViewers: [] };
  }

  const stats = analyticsStore[postId];

  switch (event) {
    case 'view':
      stats.views += 1;
      if (userId && !stats.uniqueViewers.includes(userId)) {
        stats.uniqueViewers.push(userId);
      }
      break;
    case 'like':
      stats.likes += 1;
      break;
    case 'share':
      stats.shares += 1;
      break;
  }

  return respond(200, {
    success: true,
    postId,
    event,
    currentStats: {
      views: stats.views,
      likes: stats.likes,
      shares: stats.shares,
      uniqueViewers: stats.uniqueViewers.length,
    },
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
    version: '2.0.0',
    features: ['text-moderation', 'image-moderation-rekognition', 'auto-tagging', 'ocr', 'analytics', 'announcements'],
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

    // --- /api/analyze-image (Rekognition AI) ---
    if (path.endsWith('/analyze-image')) {
      if (method === 'POST') return await analyzeImage(body);
      return respond(405, { error: 'Method not allowed. Use POST.' });
    }

    // --- /api/moderate ---
    if (path.endsWith('/moderate')) {
      if (method === 'POST') return moderateContent(body);
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
        'POST /api/analyze-image            ← Rekognition AI',
        'POST /api/moderate',
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
