/**
 * Campus Connect — AWS Lambda Function
 * 
 * Handles multiple API Gateway routes:
 *   POST /api/moderate       → Content moderation (checks post text)
 *   POST /api/analytics      → Log post engagement events
 *   GET  /api/analytics      → Retrieve post engagement stats
 *   POST /api/announcements  → Create campus-wide announcement
 *   GET  /api/health         → Health check
 *
 * Runtime: Node.js 18.x (ES Modules)
 */

// ─── In-memory store (use DynamoDB for production persistence) ────────────
const analyticsStore = {};   // { postId: { views: N, likes: N, shares: N } }
const announcements  = [];   // [{ id, title, body, authorName, createdAt }]

// ─── Banned / Flagged Words List ─────────────────────────────────────────
const BANNED_WORDS = [
  'spam', 'scam', 'hack', 'cheat', 'abuse',
  'violence', 'drugs', 'gambling', 'xxx',
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
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
    },
  });
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
