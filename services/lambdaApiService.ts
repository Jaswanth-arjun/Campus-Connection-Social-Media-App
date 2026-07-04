/**
 * Campus Connect — Lambda API Gateway Service
 *
 * Client-side service that communicates with the AWS Lambda
 * functions via API Gateway REST endpoints.
 *
 * Endpoints:
 *   POST /api/moderate       → Content moderation
 *   POST /api/analytics      → Log engagement events
 *   GET  /api/analytics      → Get engagement stats
 *   POST /api/announcements  → Create announcement (admin)
 *   GET  /api/announcements  → Fetch announcements
 *   GET  /api/health         → Health check
 */

const API_BASE_URL = process.env.EXPO_PUBLIC_LAMBDA_API_URL || '';

/**
 * Check if Lambda API is configured.
 */
export const isLambdaConfigured = (): boolean => {
  return !!API_BASE_URL && API_BASE_URL.length > 0;
};

/**
 * Generic fetch wrapper with error handling and timeout.
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (!isLambdaConfigured()) {
    throw new Error('Lambda API URL is not configured. Set EXPO_PUBLIC_LAMBDA_API_URL in your .env file.');
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `API request failed with status ${response.status}`);
    }

    return data as T;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('API request timed out');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── Type Definitions ───────────────────────────────────────────────────

export interface ModerationResult {
  safe: boolean;
  flaggedWords: string[];
  message: string;
}

export interface AnalyticsStats {
  postId: string;
  views: number;
  likes: number;
  shares: number;
  uniqueViewers: number;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  authorName: string;
  createdAt: string;
}

export interface HealthStatus {
  status: string;
  service: string;
  version: string;
  timestamp: string;
  uptime: number;
  memory: { used: string; total: string };
}

// ─── API Methods ────────────────────────────────────────────────────────

export const lambdaApiService = {
  /**
   * Moderate post content before publishing.
   * Returns whether the content is safe and any flagged words.
   */
  async moderateContent(content: string): Promise<ModerationResult> {
    return apiRequest<ModerationResult>('/api/moderate', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  /**
   * Log a post engagement event (view, like, share).
   */
  async logEvent(
    postId: string,
    event: 'view' | 'like' | 'share',
    userId?: string
  ): Promise<{ success: boolean }> {
    return apiRequest('/api/analytics', {
      method: 'POST',
      body: JSON.stringify({ postId, event, userId }),
    });
  },

  /**
   * Get analytics stats for a specific post or all posts.
   */
  async getAnalytics(postId?: string): Promise<AnalyticsStats> {
    const query = postId ? `?postId=${encodeURIComponent(postId)}` : '';
    return apiRequest<AnalyticsStats>(`/api/analytics${query}`, {
      method: 'GET',
    });
  },

  /**
   * Create a campus-wide announcement (admin only).
   */
  async createAnnouncement(
    title: string,
    body: string,
    authorName: string,
    apiKey: string
  ): Promise<{ success: boolean; announcement: Announcement }> {
    return apiRequest('/api/announcements', {
      method: 'POST',
      body: JSON.stringify({ title, body, authorName, apiKey }),
    });
  },

  /**
   * Fetch all campus announcements.
   */
  async getAnnouncements(): Promise<{ announcements: Announcement[]; count: number }> {
    return apiRequest('/api/announcements', {
      method: 'GET',
    });
  },

  /**
   * Check if the Lambda API is healthy and reachable.
   */
  async healthCheck(): Promise<HealthStatus> {
    return apiRequest<HealthStatus>('/api/health', {
      method: 'GET',
    });
  },
};
