import axios, { AxiosError, AxiosRequestConfig, CancelTokenSource } from "axios";
import type {
  Application,
  ApplicationCreate,
  ApplicationUpdate,
  ResumeVersion,
  EmailTemplate,
  User,
  PaginatedResponse,
  DashboardStats,
  WarmingProgress,
  RateLimitUsage,
  Recipient,
  RecipientCreate,
  RecipientUpdate,
  RecipientGroup,
  RecipientGroupCreate,
  RecipientGroupUpdate,
  GroupCampaign,
  GroupCampaignCreate,
  GroupCampaignRecipient,
  RecipientStatistics,
  ParsedResume,
  CompanyInfoDoc,
  DocumentListResponse,
} from "@/types";
import {
  apiLogger,
  extractCorrelationIdFromResponse,
  setCorrelationId,
} from "./logger";

// ============================================
// Configuration
// ============================================

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// ============================================
// Error Types and Codes
// ============================================

export enum APIErrorCode {
  // Network errors
  NETWORK_ERROR = "NETWORK_ERROR",
  TIMEOUT = "TIMEOUT",
  CANCELLED = "CANCELLED",

  // Authentication errors
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  SESSION_EXPIRED = "SESSION_EXPIRED",

  // Client errors
  BAD_REQUEST = "BAD_REQUEST",
  NOT_FOUND = "NOT_FOUND",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  RATE_LIMITED = "RATE_LIMITED",
  CONFLICT = "CONFLICT",

  // Server errors
  SERVER_ERROR = "SERVER_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",

  // Unknown
  UNKNOWN = "UNKNOWN",
}

export interface APIErrorDetails {
  field?: string;
  constraint?: string;
  validationErrors?: Array<{ field: string; message: string }>;
  retryAfter?: number;
  [key: string]: unknown;
}

// ============================================
// Custom Error Class
// ============================================

export class APIError extends Error {
  public readonly isAPIError = true;
  public readonly timestamp: Date;

  constructor(
    message: string,
    public status: number,
    public code: APIErrorCode = APIErrorCode.UNKNOWN,
    public details?: APIErrorDetails
  ) {
    super(message);
    this.name = "APIError";
    this.timestamp = new Date();
  }

  static fromAxiosError(error: AxiosError): APIError {
    const status = error.response?.status || 0;
    const data = error.response?.data as Record<string, unknown> | undefined;
    const detail = (data?.detail as string) || error.message || "Unknown error";

    // Determine error code based on status and error type
    let code: APIErrorCode = APIErrorCode.UNKNOWN;
    let details: APIErrorDetails = {};

    // Check for cancellation
    if (axios.isCancel(error)) {
      return new APIError("Request was cancelled", 0, APIErrorCode.CANCELLED);
    }

    // Check for network/timeout errors
    if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
      return new APIError("Request timed out", 0, APIErrorCode.TIMEOUT);
    }

    if (!error.response) {
      return new APIError("Network error - please check your connection", 0, APIErrorCode.NETWORK_ERROR);
    }

    // Map HTTP status codes to error codes
    switch (status) {
      case 400:
        code = APIErrorCode.BAD_REQUEST;
        if (data?.errors) {
          details.validationErrors = data.errors as Array<{ field: string; message: string }>;
          code = APIErrorCode.VALIDATION_ERROR;
        }
        break;
      case 401:
        code = APIErrorCode.UNAUTHORIZED;
        break;
      case 403:
        code = APIErrorCode.FORBIDDEN;
        break;
      case 404:
        code = APIErrorCode.NOT_FOUND;
        break;
      case 409:
        code = APIErrorCode.CONFLICT;
        break;
      case 429:
        code = APIErrorCode.RATE_LIMITED;
        if (error.response.headers["retry-after"]) {
          details.retryAfter = parseInt(error.response.headers["retry-after"], 10);
        }
        break;
      case 500:
      case 502:
      case 504:
        code = APIErrorCode.SERVER_ERROR;
        break;
      case 503:
        code = APIErrorCode.SERVICE_UNAVAILABLE;
        break;
    }

    if (data) {
      details = { ...details, ...(data as Record<string, unknown>) };
    }

    return new APIError(detail, status, code, details);
  }

  // Helper methods for checking error types
  isNetworkError(): boolean {
    return this.code === APIErrorCode.NETWORK_ERROR || this.code === APIErrorCode.TIMEOUT;
  }

  isAuthError(): boolean {
    return this.code === APIErrorCode.UNAUTHORIZED || this.code === APIErrorCode.FORBIDDEN;
  }

  isValidationError(): boolean {
    return this.code === APIErrorCode.VALIDATION_ERROR || this.code === APIErrorCode.BAD_REQUEST;
  }

  isServerError(): boolean {
    return this.code === APIErrorCode.SERVER_ERROR || this.code === APIErrorCode.SERVICE_UNAVAILABLE;
  }

  isCancelled(): boolean {
    return this.code === APIErrorCode.CANCELLED;
  }

  isRetryable(): boolean {
    return (
      this.code === APIErrorCode.NETWORK_ERROR ||
      this.code === APIErrorCode.TIMEOUT ||
      this.code === APIErrorCode.SERVER_ERROR ||
      this.code === APIErrorCode.SERVICE_UNAVAILABLE ||
      this.code === APIErrorCode.RATE_LIMITED
    );
  }
}

// Type guard for APIError
export function isAPIError(error: unknown): error is APIError {
  return error instanceof APIError || (error as APIError)?.isAPIError === true;
}

// ============================================
// Request Cancellation Support
// ============================================

export interface CancellableRequest<T> {
  promise: Promise<T>;
  cancel: () => void;
  isCancelled: () => boolean;
}

// Map to store active requests by key for deduplication
const activeRequests = new Map<string, AbortController>();

/**
 * Create a cancellable request wrapper
 */
export function createCancellableRequest<T>(
  requestFn: (signal: AbortSignal) => Promise<T>,
  requestKey?: string
): CancellableRequest<T> {
  const controller = new AbortController();
  let cancelled = false;

  // If a request key is provided, cancel any existing request with the same key
  if (requestKey) {
    const existingController = activeRequests.get(requestKey);
    if (existingController) {
      existingController.abort();
    }
    activeRequests.set(requestKey, controller);
  }

  const promise = requestFn(controller.signal)
    .finally(() => {
      // Clean up the active requests map
      if (requestKey) {
        activeRequests.delete(requestKey);
      }
    });

  return {
    promise,
    cancel: () => {
      if (!cancelled) {
        cancelled = true;
        controller.abort();
      }
    },
    isCancelled: () => cancelled,
  };
}

/**
 * Cancel all active requests (useful for cleanup on unmount)
 */
export function cancelAllRequests(): void {
  activeRequests.forEach((controller) => {
    controller.abort();
  });
  activeRequests.clear();
}

/**
 * Cancel a specific request by key
 */
export function cancelRequest(requestKey: string): boolean {
  const controller = activeRequests.get(requestKey);
  if (controller) {
    controller.abort();
    activeRequests.delete(requestKey);
    return true;
  }
  return false;
}

// ============================================
// Retry Logic
// ============================================

interface RetryConfig {
  retries?: number;
  delay?: number;
  retryOn?: number[];
}

async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const { retries = 3, delay = 1000, retryOn = [408, 429, 500, 502, 503, 504] } = config;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on final attempt
      if (attempt === retries) break;

      // Only retry on specific status codes
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status && !retryOn.includes(status)) {
          throw error;
        }
      }

      // Exponential backoff
      const waitTime = delay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  throw lastError;
}

// ============================================
// API Client Setup
// ============================================

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
apiClient.interceptors.request.use((config) => {
  // Add auth token
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  // Log outgoing request
  apiLogger.debug(`→ ${config.method?.toUpperCase()} ${config.url}`, {
    method: config.method,
    url: config.url,
    params: config.params,
  });

  return config;
});

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Extract and store correlation ID from response headers
    extractCorrelationIdFromResponse(response);

    // Log successful response
    apiLogger.debug(`✓ ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      url: response.config.url,
    });

    return response;
  },
  (error: AxiosError) => {
    const status = error.response?.status || 0;

    // Extract correlation ID from error response if available
    if (error.response) {
      extractCorrelationIdFromResponse(error.response);
    }

    // Log error
    apiLogger.error(
      `✗ ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${status}`,
      error,
      {
        status,
        url: error.config?.url,
        message: (error.response?.data as Record<string, unknown>)?.detail || error.message,
      }
    );

    // Handle 401 - redirect to login if session expired
    if (status === 401) {
      const isAuthEndpoint = error.config?.url?.includes("/auth/");
      if (!isAuthEndpoint && typeof window !== "undefined") {
        localStorage.removeItem("token");
        // Clear auth store state to prevent stale data
        try {
          // Dynamic import to avoid circular dependency
          import("@/store/authStore").then(({ useAuthStore }) => {
            useAuthStore.getState().logout();
          });
        } catch (e) {
          // Ignore if store not available
        }
        setTimeout(() => {
          window.location.href = "/login";
        }, 100);
      }
    }

    return Promise.reject(APIError.fromAxiosError(error));
  }
);

// ============================================
// Export API Client
// ============================================

export default apiClient;

// ============================================
// Auth API
// ============================================

export const authAPI = {
  login: (data: { username: string; password: string }) =>
    apiClient.post<{ access_token: string; token_type: string }>("/auth/login/json", data),

  register: (data: {
    username: string;
    password: string;
    email: string;
    full_name: string;
    email_account: string;
    email_password: string;
    smtp_host?: string;
    smtp_port?: number;
    title?: string;
  }) => apiClient.post<User>("/auth/register", data),

  getMe: () => apiClient.get<User>("/auth/me"),

  changePassword: (data: { current_password: string; new_password: string }) =>
    apiClient.post("/auth/change-password", data),
};

// ============================================
// Applications API
// ============================================

export const applicationsAPI = {
  list: (params?: { page?: number; limit?: number; status?: string; search?: string; candidate_id?: number }) => {
    // Convert page to skip for backend compatibility
    const { page, limit = 20, ...rest } = params || {};
    const skip = page ? (page - 1) * limit : 0;
    return apiClient.get<PaginatedResponse<Application>>("/applications", {
      params: { skip, limit, ...rest }
    });
  },

  getAll: () =>
    apiClient
      .get<PaginatedResponse<Application>>("/applications", { params: { limit: 100 } })
      .then((res) => res.data.items || []),

  getById: (id: number) => apiClient.get<Application>(`/applications/${id}`),

  create: (data: ApplicationCreate) => apiClient.post<Application>("/applications", data),

  update: (id: number, data: ApplicationUpdate) => apiClient.patch<Application>(`/applications/${id}`, data),

  delete: (id: number) => apiClient.delete(`/applications/${id}`),

  getStats: (candidateId?: number) =>
    apiClient.get<DashboardStats>("/applications/stats/summary", {
      params: candidateId ? { candidate_id: candidateId } : {},
    }),

  updateStatus: (id: number, data: { status: string; note?: string }) =>
    apiClient.patch<Application>(`/applications/${id}/status`, data),

  getHistory: (id: number) => apiClient.get(`/applications/${id}/history`),

  addNote: (id: number, data: { content: string; note_type?: string }) =>
    apiClient.post(`/applications/${id}/notes`, data),

  getNotes: (id: number) => apiClient.get(`/applications/${id}/notes`),

  // Email sending with retry
  sendEmail: (id: number, data?: { resume_version_id?: number; template_id?: number; force_send?: boolean }) =>
    withRetry(() => apiClient.post(`/applications/${id}/send`, data || {}), { retries: 2 }),

  sendBulk: (data: {
    application_ids: number[];
    resume_version_id?: number;
    template_id?: number;
    delay_seconds?: number;
  }) => apiClient.post("/applications/send-bulk", data),

  // CSV import - returns import results with created applications
  importCSV: (file: File, candidateId?: number): Promise<{ data: { imported: number; failed: number; errors: string[] } }> => {
    const formData = new FormData();
    formData.append("file", file);
    if (candidateId) formData.append("candidate_id", candidateId.toString());
    return apiClient.post<{ imported: number; failed: number; errors: string[] }>("/applications/import-csv", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

// ============================================
// Resumes API
// ============================================

export const resumesAPI = {
  list: (params?: { page?: number; limit?: number }) => {
    const { page, limit = 20 } = params || {};
    const skip = page ? (page - 1) * limit : 0;
    return apiClient.get<PaginatedResponse<ResumeVersion>>("/resumes", {
      params: { skip, limit }
    });
  },

  getById: (id: number) => apiClient.get<ResumeVersion>(`/resumes/${id}`),

  create: (formData: FormData) =>
    apiClient.post<ResumeVersion>("/resumes", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  update: (id: number, data: Partial<ResumeVersion>) => apiClient.patch<ResumeVersion>(`/resumes/${id}`, data),

  delete: (id: number) => apiClient.delete<{ success: boolean; message: string }>(`/resumes/${id}`),

  setDefault: (id: number) => apiClient.post<ResumeVersion>(`/resumes/${id}/set-default`),

  download: (id: number) =>
    apiClient.get<Blob>(`/resumes/${id}/download`, {
      responseType: "blob",
    }),

  // Parsed resume endpoints
  parse: (formData: FormData) =>
    apiClient.post<{ success: boolean; parsed_data: any; saved_to_profile: boolean }>("/resumes/parse", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  getMyParsedResume: () =>
    apiClient.get<{ success: boolean; parsed_data: any }>("/resumes/me/parsed"),

  updateMyParsedResume: (data: any) =>
    apiClient.patch<{ success: boolean; parsed_data: any; message: string }>("/resumes/me/parsed", data),
};

// ============================================
// Email Templates API
// ============================================

export const templatesAPI = {
  list: (params?: { page?: number; limit?: number; category?: string }) => {
    const { page, limit = 20, ...rest } = params || {};
    const skip = page ? (page - 1) * limit : 0;
    // Use new unified endpoint that shows both EmailTemplate and PersonalizedEmailDraft
    return apiClient.get<PaginatedResponse<EmailTemplate>>("/templates", {
      params: { skip, limit, ...rest }
    });
  },

  getById: (id: number) => apiClient.get<EmailTemplate>(`/email-templates/${id}`),

  create: (data: Partial<EmailTemplate>) => apiClient.post<EmailTemplate>("/email-templates", data),

  update: (id: number, data: Partial<EmailTemplate>) =>
    apiClient.patch<EmailTemplate>(`/email-templates/${id}`, data),

  delete: (id: number) => apiClient.delete<{ success: boolean; message: string }>(`/email-templates/${id}`),

  preview: (data: { template_id?: number; body_template_html: string; variables?: Record<string, string> }) =>
    apiClient.post<{ html: string }>("/email-templates/preview", data),

  setDefault: (id: number) => apiClient.post<EmailTemplate>(`/email-templates/${id}/set-default`),
};

// ============================================
// Users API (Admin only)
// ============================================

export const usersAPI = {
  list: (params?: { page?: number; limit?: number }) => {
    const { page, limit = 20 } = params || {};
    const skip = page ? (page - 1) * limit : 0;
    return apiClient.get<PaginatedResponse<User>>("/users", {
      params: { skip, limit }
    });
  },

  getById: (id: number) => apiClient.get<User>(`/users/${id}`),

  create: (data: {
    username: string;
    password: string;
    email: string;
    full_name: string;
    role?: string;
    email_account?: string;
    email_password?: string;
    smtp_host?: string;
    smtp_port?: number;
    title?: string;
    is_active?: boolean;
  }) => apiClient.post<User>("/users", data),

  update: (id: number, data: Partial<User>) => apiClient.patch<User>(`/users/${id}`, data),

  delete: (id: number) => apiClient.delete<{ success: boolean; message: string }>(`/users/${id}`),
};

// ============================================
// Email Warming API
// ============================================

// Warming preset structure from API
interface WarmingPresetResponse {
  id: string;
  name: string;
  description: string;
  duration_days: number;
  final_limit: number;
  recommended_for: string;
  schedule: Record<number, number>;
}

export const emailWarmingAPI = {
  getPresets: () =>
    apiClient.get<{ presets: WarmingPresetResponse[] }>("/warming/presets"),

  getConfig: () => apiClient.get("/warming/config"),

  createConfig: (data: { strategy: string; custom_schedule?: Record<number, number>; auto_progress?: boolean }) =>
    apiClient.post("/warming/config", data),

  updateConfig: (data: { strategy?: string; custom_schedule?: Record<number, number>; auto_progress?: boolean }) =>
    apiClient.put("/warming/config", data),

  start: () => apiClient.post("/warming/start"),

  pause: () => apiClient.post("/warming/pause"),

  resume: () => apiClient.post("/warming/resume"),

  getProgress: () => apiClient.get<{ progress: WarmingProgress }>("/warming/progress"),

  getDailyLogs: () => apiClient.get("/warming/daily-logs"),

  deleteConfig: () => apiClient.delete("/warming/config"),
};

// ============================================
// Rate Limiting API
// ============================================

// Rate limit preset structure from API
interface RateLimitPresetResponse {
  id: string;
  name: string;
  daily_limit: number | null;
  hourly_limit: number | null;
  description: string;
  recommended_for: string;
}

export const rateLimitingAPI = {
  getPresets: () =>
    apiClient.get<{ presets: RateLimitPresetResponse[] }>("/rate-limits/presets"),

  getConfig: () => apiClient.get("/rate-limits/config"),

  createConfig: (data: { preset: string; daily_limit?: number; hourly_limit?: number }) =>
    apiClient.post("/rate-limits/config", data),

  updateConfig: (data: {
    preset?: string;
    daily_limit?: number;
    hourly_limit?: number;
    weekly_limit?: number;
    monthly_limit?: number;
    enabled?: boolean;
  }) => apiClient.put("/rate-limits/config", data),

  checkCanSend: () => apiClient.get<{ can_send: boolean; reason: string }>("/rate-limits/check"),

  getUsageStats: () => apiClient.get<{ stats: RateLimitUsage }>("/rate-limits/usage"),

  enable: () => apiClient.post("/rate-limits/enable"),

  disable: () => apiClient.post("/rate-limits/disable"),

  getUsageLogs: (limit?: number) => apiClient.get("/rate-limits/usage-logs", { params: { limit } }),

  deleteConfig: () => apiClient.delete("/rate-limits/config"),
};

// ============================================
// Warmup Health API
// ============================================

export interface HealthScoreComponent {
  score: number;
  rate?: number;
}

export interface HealthScore {
  overall_score: number;
  health_status: string;
  status_color: string;
  components: {
    delivery: HealthScoreComponent;
    bounce: HealthScoreComponent;
    open: HealthScoreComponent;
    spam: HealthScoreComponent;
    consistency: HealthScoreComponent;
  };
  trends: {
    score: number;
    delivery: number;
    bounce: number;
  };
  averages_7day: {
    score?: number;
    delivery?: number;
    bounce?: number;
  };
  recommendations: Array<{
    priority: number;
    action: string;
    reason: string;
    impact: string;
    icon: string;
  }>;
  updated_at: string;
}

export interface HealthAlert {
  id: number;
  type: string;
  severity: string;
  severity_color: string;
  title: string;
  message: string;
  context?: Record<string, unknown>;
  recommended_actions?: Array<{ action: string; priority: number }>;
  is_read: boolean;
  triggered_at: string;
}

export interface HealthMilestone {
  id: number;
  type: string;
  title: string;
  description?: string;
  badge_icon?: string;
  badge_color?: string;
  achieved_at: string;
  is_achieved?: boolean;
}

export interface WarmingStatus {
  status: string;
  strategy: string;
  current_day: number;
  max_day: number;
  progress_percent: number;
  daily_limit: number;
  sent_today: number;
  remaining_today: number;
  total_sent: number;
  start_date?: string;
}

export interface DomainReputation {
  domain: string;
  overall_reputation: number;
  authentication: {
    spf: boolean;
    dkim: boolean;
    dmarc: boolean;
    score: number;
  };
  blacklist: {
    is_blacklisted: boolean;
    sources?: string[];
    last_check?: string;
  };
  lifetime_stats: {
    emails_sent: number;
    delivery_rate: number;
    bounce_rate: number;
  };
}

export interface HealthDashboard {
  health_score?: HealthScore;
  warming_status?: WarmingStatus;
  alerts: HealthAlert[];
  alert_counts: {
    critical: number;
    warning: number;
    info: number;
  };
  milestones: HealthMilestone[];
  score_history: Array<{
    date: string;
    score: number;
    delivery_rate: number;
    bounce_rate: number;
  }>;
  domain_reputation?: DomainReputation;
  quick_stats: {
    health_emoji: string;
    health_label: string;
    tip: string;
    score?: number;
    trend_emoji?: string;
  };
}

export const warmupHealthAPI = {
  // Dashboard
  getDashboard: () =>
    apiClient.get<HealthDashboard>("/warmup-health/dashboard"),

  // Health Score
  calculateScore: () =>
    apiClient.post<HealthScore>("/warmup-health/calculate-score"),

  getScoreHistory: (days?: number) =>
    apiClient.get<{
      history: Array<{
        date: string;
        overall_score: number;
        health_status: string;
        delivery_rate: number;
        bounce_rate: number;
        open_rate: number;
        emails_sent: number;
        trend: number;
      }>;
      summary: {
        avg_score: number;
        best_score: number;
        worst_score: number;
        total_days: number;
      };
    }>("/warmup-health/score/history", { params: { days } }),

  getLatestScore: () =>
    apiClient.get<{
      has_score: boolean;
      score?: number;
      status?: string;
      trend?: number;
      updated_at?: string;
      message?: string;
    }>("/warmup-health/score/latest"),

  // Alerts
  getAlerts: (includeResolved?: boolean, severity?: string) =>
    apiClient.get<HealthAlert[]>("/warmup-health/alerts", {
      params: { include_resolved: includeResolved, severity },
    }),

  getAlertCounts: () =>
    apiClient.get<{
      total: number;
      unread: number;
      by_severity: { critical: number; warning: number; info: number };
    }>("/warmup-health/alerts/count"),

  markAlertRead: (alertId: number) =>
    apiClient.put(`/warmup-health/alerts/${alertId}/read`),

  resolveAlert: (alertId: number, note?: string) =>
    apiClient.put(`/warmup-health/alerts/${alertId}/resolve`, { note }),

  markAllAlertsRead: () =>
    apiClient.put("/warmup-health/alerts/read-all"),

  // Milestones
  getMilestones: () =>
    apiClient.get<HealthMilestone[]>("/warmup-health/milestones"),

  getAvailableMilestones: () =>
    apiClient.get<{
      milestones: HealthMilestone[];
      achieved_count: number;
      total_count: number;
    }>("/warmup-health/milestones/available"),

  // Domain Reputation
  getDomainReputation: () =>
    apiClient.get<DomainReputation>("/warmup-health/domain-reputation"),

  checkDomainAuthentication: () =>
    apiClient.post<{
      domain: string;
      authentication: {
        spf: { configured: boolean; status: string };
        dkim: { configured: boolean; status: string };
        dmarc: { configured: boolean; status: string };
      };
      authentication_score: number;
      overall_reputation: number;
      recommendations: Array<{ issue: string; action: string; impact: string }>;
    }>("/warmup-health/domain-reputation/check-authentication"),

  // Quick Actions
  quickCheck: () =>
    apiClient.get<{
      quick_stats: { health_emoji: string; health_label: string; tip: string };
      alert_count: number;
      has_critical: boolean;
      warming_active: boolean;
    }>("/warmup-health/quick-check"),

  getRecommendations: () =>
    apiClient.get<{
      recommendations: Array<{
        priority: number;
        action: string;
        reason: string;
        impact: string;
        icon: string;
      }>;
      health_score?: number;
      health_status?: string;
    }>("/warmup-health/recommendations"),

  // Analytics
  getAnalytics: (days?: number) =>
    apiClient.get<{
      period_days: number;
      has_data: boolean;
      summary?: {
        average_score: number;
        average_delivery_rate: number;
        average_bounce_rate: number;
        total_emails_sent: number;
        total_delivered: number;
        total_bounced: number;
        delivery_success_rate: number;
      };
      best_day?: { date: string; score: number };
      worst_day?: { date: string; score: number };
      trend?: string;
      data_points?: number;
      message?: string;
    }>("/warmup-health/analytics/summary", { params: { days } }),
};

// ============================================
// Dashboard API
// ============================================

export const dashboardAPI = {
  getStats: (candidateId?: number) =>
    applicationsAPI.getStats(candidateId),

  getRecentApplications: (limit = 5) =>
    apiClient.get<Application[]>("/applications", { params: { limit, sort: "-created_at" } }),
};

// ============================================
// Notifications API
// ============================================

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  application_id?: number;
  company_id?: number;
  action_url?: string;
  action_text?: string;
  is_read: boolean;
  is_archived: boolean;
  icon?: string;
  priority: number;
  created_at: string;
  read_at?: string;
  expires_at?: string;
  is_expired: boolean;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  unread_count: number;
}

export interface NotificationStats {
  total: number;
  unread: number;
  by_type: Record<string, number>;
}

export const notificationsAPI = {
  getAll: (params?: {
    include_read?: boolean;
    include_archived?: boolean;
    notification_type?: string;
    limit?: number;
    offset?: number;
  }) => apiClient.get<NotificationListResponse>("/notifications", { params }),

  getUnreadCount: () =>
    apiClient.get<{ unread_count: number }>("/notifications/unread-count"),

  getStats: () =>
    apiClient.get<NotificationStats>("/notifications/stats"),

  create: (data: {
    title: string;
    message: string;
    notification_type?: string;
    application_id?: number;
    company_id?: number;
    action_url?: string;
    action_text?: string;
    priority?: number;
  }) => apiClient.post("/notifications", data),

  markAsRead: (id: number) =>
    apiClient.post(`/notifications/${id}/read`),

  markAllAsRead: () =>
    apiClient.post("/notifications/read-all"),

  archive: (id: number) =>
    apiClient.post(`/notifications/${id}/archive`),

  delete: (id: number) =>
    apiClient.delete(`/notifications/${id}`),

  cleanup: () =>
    apiClient.post("/notifications/cleanup"),
};

// ============================================
// Send Time Optimization API
// ============================================

export interface OptimalTimeResponse {
  send_at: string;
  send_at_local: string;
  day_name: string;
  hour: number;
  minute: number;
  timezone: string;
  reason: string;
  expected_boost: string;
  is_now_optimal: boolean;
  wait_hours: number;
  industry: string;
  strategy: string;
}

export interface ScheduledEmail {
  id: number;
  application_id: number;
  scheduled_for: string;
  timezone: string;
  industry?: string;
  expected_boost?: string;
  reason?: string;
  status: string;
  created_at: string;
}

export interface IndustryInfo {
  value: string;
  label: string;
  best_days: string[];
  best_hours: number[];
  reason: string;
}

export interface WeeklySlot {
  datetime: string;
  datetime_local: string;
  day: string;
  date: string;
  time: string;
  hour: number;
  is_primary: boolean;
  expected_boost: string;
  timezone: string;
}

export interface SendTimePreferences {
  default_industry: string;
  default_timezone: string;
  auto_schedule_enabled: boolean;
  tolerance_hours: number;
  prefer_morning: boolean;
  prefer_afternoon: boolean;
  avoid_mondays: boolean;
  avoid_fridays: boolean;
  use_custom_schedule: boolean;
  custom_days: number[];
  custom_hours: number[];
  total_scheduled?: number;
  total_sent_optimal?: number;
  average_boost_achieved?: string;
}

export interface CountryInfo {
  name: string;
  flag: string;
  timezone: string;
  best_days: string[];
  primary_hours: number[];
  secondary_hours: number[];
  avoid_hours: number[];
  lunch_time: string;
  work_hours: string;
  work_culture: string;
  email_culture: string;
  best_days_note: string;
  expected_boost: string;
  response_time: string;
}

export interface CountryOptimalTimeResponse {
  send_at: string;
  send_at_local: string;
  day_name: string;
  hour: number;
  minute: number;
  timezone: string;
  country: string;
  flag: string;
  is_now_optimal: boolean;
  wait_hours: number;
  expected_boost: string;
  is_primary_hour?: boolean;
  work_culture: string;
  email_culture: string;
  lunch_time: string;
  work_hours: string;
  best_days_note: string;
  response_time: string;
  primary_hours?: number[];
  secondary_hours?: number[];
  avoid_hours?: number[];
  best_days?: string[];
}

export interface CountryWeeklySlot {
  datetime: string;
  datetime_local: string;
  day: string;
  date: string;
  time: string;
  hour: number;
  is_primary: boolean;
  expected_boost: string;
  timezone: string;
  slot_type?: string;
}

export interface CountryQuickCheckResponse {
  should_send_now: boolean;
  recommendation: string;
  reason: string;
  expected_boost: string;
  country: string;
  flag: string;
  optimal_time?: string;
  wait_hours?: number;
}

export const sendTimeAPI = {
  // Get all supported industries
  getIndustries: () =>
    apiClient.get<IndustryInfo[]>("/send-time/industries"),

  // Get all timezone mappings
  getTimezones: () =>
    apiClient.get<{ timezones: Record<string, string>; total: number }>("/send-time/timezones"),

  // Get optimal send time
  getOptimalTime: (data: {
    industry?: string;
    recipient_country?: string;
    recipient_timezone?: string;
  }) => apiClient.post<OptimalTimeResponse>("/send-time/optimal", data),

  // Quick check if now is a good time
  quickCheck: (params: {
    industry?: string;
    recipient_country?: string;
    tolerance_hours?: number;
  }) => apiClient.get<{ should_send_now: boolean; reason: string }>("/send-time/optimal/quick", { params }),

  // Get industry info
  getIndustryInfo: (industry: string) =>
    apiClient.get<{
      industry: string;
      best_days: string[];
      best_hours: number[];
      best_hours_formatted: string[];
      avoid_hours: number[];
      reason: string;
      expected_boost_range: [number, number];
    }>(`/send-time/industry/${industry}`),

  // Get weekly schedule
  getWeeklySchedule: (params: {
    industry?: string;
    recipient_country?: string;
    max_slots?: number;
  }) => apiClient.get<WeeklySlot[]>("/send-time/schedule/week", { params }),

  // Schedule an email
  scheduleEmail: (data: {
    application_id: number;
    industry?: string;
    recipient_country?: string;
    use_optimal_time?: boolean;
    custom_schedule_time?: string;
    send_immediately_if_optimal?: boolean;
  }) => apiClient.post<ScheduledEmail>("/send-time/schedule", data),

  // Get all scheduled emails
  getScheduledEmails: (params?: { status_filter?: string }) =>
    apiClient.get<ScheduledEmail[]>("/send-time/scheduled", { params }),

  // Get single scheduled email
  getScheduledEmail: (id: number) =>
    apiClient.get<ScheduledEmail>(`/send-time/scheduled/${id}`),

  // Cancel scheduled email
  cancelScheduledEmail: (id: number) =>
    apiClient.delete<{ success: boolean; message: string; id: number }>(`/send-time/scheduled/${id}`),

  // Reschedule email
  rescheduleEmail: (id: number, params: { new_time?: string; use_optimal?: boolean }) =>
    apiClient.put<ScheduledEmail>(`/send-time/scheduled/${id}/reschedule`, {}, { params }),

  // Get stats
  getStats: () =>
    apiClient.get<{
      user_stats: {
        pending: number;
        sent: number;
        cancelled: number;
        failed: number;
      };
      system_stats: {
        pending: number;
        due_now: number;
        sent_today: number;
        failed_today: number;
      };
    }>("/send-time/stats"),

  // Get preferences
  getPreferences: () =>
    apiClient.get<SendTimePreferences>("/send-time/preferences"),

  // Update preferences
  updatePreferences: (data: Partial<SendTimePreferences>) =>
    apiClient.put<{ success: boolean; message: string; preferences: SendTimePreferences }>(
      "/send-time/preferences",
      data
    ),

  // ============== Country-Specific Endpoints ==============

  // Get all supported countries with detailed info
  getCountries: () =>
    apiClient.get<CountryInfo[]>("/send-time/countries"),

  // Get simplified country list for dropdowns
  getCountryList: () =>
    apiClient.get<{
      countries: { name: string; flag: string; timezone: string; expected_boost: string }[];
      total: number;
    }>("/send-time/countries/list"),

  // Get optimal send time for a specific country
  getCountryOptimalTime: (data: { country: string; industry?: string }) =>
    apiClient.post<CountryOptimalTimeResponse>("/send-time/countries/optimal", data),

  // Get detailed info about a specific country
  getCountryInfo: (country: string) =>
    apiClient.get<CountryInfo>(`/send-time/countries/${country}/info`),

  // Get weekly schedule for a specific country
  getCountrySchedule: (country: string, maxSlots?: number) =>
    apiClient.get<CountryWeeklySlot[]>(`/send-time/countries/${country}/schedule`, {
      params: { max_slots: maxSlots },
    }),

  // Quick check if now is a good time for a specific country
  countryQuickCheck: (country: string, toleranceHours?: number) =>
    apiClient.get<CountryQuickCheckResponse>(`/send-time/countries/${country}/quick-check`, {
      params: { tolerance_hours: toleranceHours },
    }),
};

// ============================================
// Company Intelligence API
// ============================================

export interface SkillProfile {
  id: number;
  programming_languages: string[];
  frameworks: string[];
  databases: string[];
  cloud_devops: string[];
  tools: string[];
  soft_skills: string[];
  domain_knowledge: string[];
  primary_expertise: string[];
  secondary_skills: string[];
  projects: Array<{ name: string; technologies: string[]; description?: string }>;
  work_experience: Array<{ company: string; technologies: string[]; role?: string }>;
  education: Array<{ degree: string; field?: string; institution?: string }>;
  achievements: string[];
  skill_levels?: Record<string, number>;
  years_experience?: number;
  completeness_score: number;
  last_analyzed?: string;
}

export interface CompanyResearch {
  id: number;
  company_id: number;
  company_name?: string;
  research_depth: string;
  about_summary?: string;
  mission_statement?: string;
  company_culture?: { keywords?: string[]; remote_friendly?: boolean; diversity_focus?: boolean };
  recent_news: Array<{ title: string; date?: string }>;
  job_openings: Array<{ title: string; description?: string; skills_mentioned?: string[] }>;
  key_people: Array<{ name: string; title?: string }>;
  funding_info?: { stage?: string; amount?: string; investors?: string[] };
  tech_stack?: string[];
  tech_stack_detailed?: { detected?: string[]; languages?: Record<string, number> };
  github_repos: Array<{ name: string; description?: string; language?: string; stars?: number; url?: string; topics?: string[] }>;
  blog_posts: Array<{ title: string; tech_mentioned?: string[] }>;
  social_links?: Record<string, string>;
  employee_count_estimate?: number;
  growth_signals: string[];
  completeness_score: number;
  data_sources: string[];
  created_at?: string;
  last_refreshed?: string;
  expires_at?: string;
}

export interface CompanyProject {
  id: number;
  name: string;
  description?: string;
  project_type: string;
  url?: string;
  technologies: string[];
  skills_required: string[];
  is_active: boolean;
  confidence_score: number;
  source_url?: string;
  discovered_at?: string;
}

export interface SkillMatch {
  id: number;
  company_id: number;
  company_name: string;
  industry?: string;
  match_strength: string;
  overall_score: number;
  matched_skills: string[];
  candidate_skills_used?: string[];
  company_needs?: string[];
  category_scores: Record<string, number>;
  match_context: string;
  talking_points: string[];
  calculated_at?: string;
}

export interface EmailDraft {
  id: number;
  company_id: number;
  company_name: string;
  subject_line: string;
  subject_alternatives: string[];
  email_body: string;
  email_html?: string;
  opening?: string;
  skill_highlights?: string;
  company_specific?: string;
  call_to_action?: string;
  closing?: string;
  tone: string;
  confidence_score: number;
  relevance_score: number;
  personalization_level: number;
  generation_params?: Record<string, unknown>;
  is_favorite: boolean;
  is_used: boolean;
  used_at?: string;
  created_at?: string;
}

export interface IntelligenceDashboard {
  skill_profile: {
    exists: boolean;
    completeness: number;
    primary_expertise: string[];
    total_skills: number;
  };
  matches: {
    total: number;
    strong: number;
    top_matches: Array<{
      company_id: number;
      company_name: string;
      match_strength: string;
      overall_score: number;
    }>;
  };
  drafts: {
    total: number;
    used: number;
    favorites: number;
    recent: Array<{
      id: number;
      company_name: string;
      subject_line: string;
      tone: string;
      created_at?: string;
    }>;
  };
}

export const companyIntelligenceAPI = {
  // Company Research
  researchCompany: (data: { company_id: number; depth?: string; force_refresh?: boolean }) =>
    apiClient.post<{ success: boolean; data: CompanyResearch }>("/company-intelligence/research", data),

  getCompanyResearch: (companyId: number) =>
    apiClient.get<{ success: boolean; data: CompanyResearch; from_cache: boolean }>(`/company-intelligence/research/${companyId}`),

  getCompanyProjects: (companyId: number) =>
    apiClient.get<{ success: boolean; count: number; projects: CompanyProject[] }>(`/company-intelligence/projects/${companyId}`),

  // Skill Profile
  extractSkills: (resumeText?: string) =>
    apiClient.post<{ success: boolean; profile: SkillProfile }>("/company-intelligence/skills/extract", { resume_text: resumeText }),

  getSkillProfile: () =>
    apiClient.get<{ success: boolean; profile: SkillProfile }>("/company-intelligence/skills/profile"),

  // Skill Matching
  matchToCompany: (data: { company_id: number; force_refresh?: boolean }) =>
    apiClient.post<{ success: boolean; match: SkillMatch }>("/company-intelligence/match", data),

  batchMatch: (companyIds: number[]) =>
    apiClient.post<{ success: boolean; count: number; matches: SkillMatch[] }>("/company-intelligence/match/batch", { company_ids: companyIds }),

  getAllMatches: (params?: { limit?: number; min_score?: number }) =>
    apiClient.get<{ success: boolean; count: number; matches: SkillMatch[] }>("/company-intelligence/matches", { params }),

  getBestMatches: (limit?: number) =>
    apiClient.get<{ success: boolean; count: number; best_matches: SkillMatch[] }>("/company-intelligence/matches/best", { params: { limit } }),

  // Email Drafts
  generateEmailDraft: (data: {
    company_id: number;
    skill_match_id?: number;
    tone?: string;
    include_projects?: boolean;
    include_achievements?: boolean;
    custom_opening?: string;
    job_title?: string;
  }) => apiClient.post<{ success: boolean; draft: EmailDraft }>("/company-intelligence/email/generate", data),

  quickDraft: (companyId: number) =>
    apiClient.post<{ success: boolean; draft_id: number; subject: string; body: string; html: string; confidence: number }>(`/company-intelligence/email/quick-draft/${companyId}`),

  generateVariations: (companyId: number, count?: number) =>
    apiClient.post<{ success: boolean; count: number; variations: Array<{ id: number; tone: string; subject_line: string; email_body: string; confidence_score: number }> }>(`/company-intelligence/email/variations/${companyId}`, {}, { params: { count } }),

  getAllDrafts: (params?: { limit?: number; favorites_only?: boolean }) =>
    apiClient.get<{ success: boolean; count: number; drafts: EmailDraft[] }>("/company-intelligence/email/drafts", { params }),

  getCompanyDrafts: (companyId: number) =>
    apiClient.get<{ success: boolean; company_name: string; count: number; drafts: EmailDraft[] }>(`/company-intelligence/email/drafts/${companyId}`),

  getDraft: (draftId: number) =>
    apiClient.get<{ success: boolean; draft: EmailDraft }>(`/company-intelligence/email/draft/${draftId}`),

  toggleFavorite: (draftId: number) =>
    apiClient.put<{ success: boolean; draft_id: number; is_favorite: boolean }>(`/company-intelligence/email/draft/${draftId}/favorite`),

  markDraftUsed: (draftId: number) =>
    apiClient.put<{ success: boolean; draft_id: number; is_used: boolean; used_at?: string }>(`/company-intelligence/email/draft/${draftId}/used`),

  regenerateDraft: (draftId: number, tone?: string) =>
    apiClient.post<{ success: boolean; draft: EmailDraft }>(`/company-intelligence/email/draft/${draftId}/regenerate`, {}, { params: { tone } }),

  deleteDraft: (draftId: number) =>
    apiClient.delete<{ success: boolean; message: string }>(`/company-intelligence/email/draft/${draftId}`),

  // Dashboard
  getDashboard: () =>
    apiClient.get<{ success: boolean; dashboard: IntelligenceDashboard }>("/company-intelligence/dashboard"),
};

// ============================================
// Intelligence API (Simplified Research View)
// ============================================

export interface CompanyResearchData {
  id: number;
  company_id: number;
  company_name: string;
  company_website: string;
  research_depth: string;
  about_summary: string;
  company_culture: Record<string, unknown>;
  recent_news: Array<unknown>;
  job_openings: Array<unknown>;
  blog_posts: Array<unknown>;
  tech_stack: Record<string, unknown>;
  completeness_score: number;
  data_sources: string[];
  created_at: string;
  last_refreshed: string;
  expires_at: string;
}

export const intelligenceAPI = {
  listResearch: (limit?: number) =>
    apiClient.get<{ research_cache: CompanyResearchData[]; total: number }>("/intelligence", {
      params: { limit }
    }),
};

// ============================================
// Follow-Up Sequences API
// ============================================

export type FollowUpTone = 'professional' | 'friendly' | 'persistent' | 'value_add' | 'breakup' | 'urgent';
export type FollowUpStrategy = 'soft_bump' | 'add_value' | 'social_proof' | 'question' | 'breakup';
export type CampaignStatus = 'pending_approval' | 'active' | 'paused' | 'completed' | 'cancelled' | 'replied';
export type FollowUpEmailStatus = 'draft' | 'scheduled' | 'sent' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'failed' | 'skipped' | 'cancelled';

export interface FollowUpStep {
  id: number;
  step_number: number;
  delay_days: number;
  tone: FollowUpTone;
  strategy: FollowUpStrategy;
  custom_template?: string;
  include_original_context: boolean;
  include_company_news: boolean;
  include_skills_match: boolean;
  is_active: boolean;
  created_at: string;
}

export interface FollowUpSequence {
  id: number;
  name: string;
  description?: string;
  max_follow_ups: number;
  stop_on_reply: boolean;
  stop_on_bounce: boolean;
  use_threading: boolean;
  respect_business_hours: boolean;
  business_hours_start: number;
  business_hours_end: number;
  is_preset: boolean;
  status: string;
  steps: FollowUpStep[];
  created_at: string;
  updated_at?: string;
}

export interface FollowUpEmail {
  id: number;
  campaign_id: number;
  step_number: number;
  subject: string;
  body: string;
  body_html: string;
  tone: FollowUpTone;
  strategy: FollowUpStrategy;
  status: FollowUpEmailStatus;
  scheduled_at?: string;
  sent_at?: string;
  opened_at?: string;
  clicked_at?: string;
  replied_at?: string;
  bounced_at?: string;
  is_auto_generated: boolean;
  is_user_edited: boolean;
  is_custom_written: boolean;
  original_subject?: string;
  original_body?: string;
  created_at: string;
}

export interface FollowUpCampaign {
  id: number;
  application_id: number;
  sequence_id: number;
  status: CampaignStatus;
  is_auto_mode: boolean;
  auto_mode_approved: boolean;
  current_step: number;
  total_emails_sent: number;
  total_emails_opened: number;
  total_replies: number;
  last_reply_at?: string;
  next_email_at?: string;
  started_at: string;
  completed_at?: string;
  original_email_context: Record<string, unknown>;
  company_context: Record<string, unknown>;
  candidate_context: Record<string, unknown>;
}

export interface EmailPreview {
  step_number: number;
  scheduled_date: string;
  subject: string;
  body: string;
  body_html: string;
  tone: string;
  strategy: string;
  email_id?: number;
}

export interface CampaignWithPreviews {
  campaign: FollowUpCampaign;
  previews: EmailPreview[];
}

export interface CandidateFollowUpProfile {
  id: number;
  candidate_id: number;
  linkedin_url?: string;
  github_url?: string;
  twitter_url?: string;
  website_url?: string;
  portfolio_url?: string;
  phone_number?: string;
  alternative_email?: string;
  current_title?: string;
  years_experience?: number;
  key_skills: string[];
  portfolio_projects: Array<{ name: string; url?: string; description?: string }>;
  achievements: string[];
  value_propositions: string[];
  preferred_tone?: FollowUpTone;
  signature_style: string;
  custom_signature?: string;
  created_at: string;
  updated_at?: string;
}

export interface FollowUpLog {
  id: number;
  campaign_id: number;
  email_id?: number;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface FollowUpStats {
  total_campaigns: number;
  active_campaigns: number;
  completed_campaigns: number;
  replied_campaigns: number;
  total_emails_sent: number;
  total_replies: number;
  reply_rate: number;
  average_response_time_hours?: number;
  most_effective_tone?: string;
  most_effective_strategy?: string;
  campaigns_by_status: Record<string, number>;
}

export interface PipelineFollowUpSummary {
  has_campaign: boolean;
  status?: CampaignStatus;
  current_step: number;
  total_steps: number;
  next_email_at?: string;
  is_auto_mode: boolean;
  needs_approval: boolean;
  total_sent?: number;
  total_replies?: number;
}

export interface SequencePreset {
  name: string;
  description: string;
  steps: Array<{
    delay_days: number;
    tone: FollowUpTone;
    strategy: FollowUpStrategy;
  }>;
}

export const followUpAPI = {
  // ============== Sequences ==============

  createSequence: (data: {
    name: string;
    description?: string;
    max_follow_ups?: number;
    stop_on_reply?: boolean;
    stop_on_bounce?: boolean;
    use_threading?: boolean;
    respect_business_hours?: boolean;
    business_hours_start?: number;
    business_hours_end?: number;
    steps?: Array<{
      step_number: number;
      delay_days: number;
      tone: FollowUpTone;
      strategy: FollowUpStrategy;
      custom_template?: string;
      include_original_context?: boolean;
      include_company_news?: boolean;
      include_skills_match?: boolean;
    }>;
  }) => apiClient.post<FollowUpSequence>("/follow-up/sequences", data),

  createPresetSequences: () =>
    apiClient.post<FollowUpSequence[]>("/follow-up/sequences/presets"),

  getSequences: (includePresets?: boolean) =>
    apiClient.get<FollowUpSequence[]>("/follow-up/sequences", {
      params: { include_presets: includePresets },
    }),

  getAvailablePresets: () =>
    apiClient.get<SequencePreset[]>("/follow-up/sequences/presets/available"),

  getSequence: (sequenceId: number) =>
    apiClient.get<FollowUpSequence>(`/follow-up/sequences/${sequenceId}`),

  updateSequence: (sequenceId: number, data: Partial<{
    name: string;
    description: string;
    max_follow_ups: number;
    stop_on_reply: boolean;
    stop_on_bounce: boolean;
    use_threading: boolean;
    respect_business_hours: boolean;
    business_hours_start: number;
    business_hours_end: number;
  }>) => apiClient.put<FollowUpSequence>(`/follow-up/sequences/${sequenceId}`, data),

  deleteSequence: (sequenceId: number) =>
    apiClient.delete(`/follow-up/sequences/${sequenceId}`),

  // ============== Steps ==============

  addStep: (sequenceId: number, data: {
    step_number: number;
    delay_days: number;
    tone: FollowUpTone;
    strategy: FollowUpStrategy;
    custom_template?: string;
    include_original_context?: boolean;
    include_company_news?: boolean;
    include_skills_match?: boolean;
  }) => apiClient.post<FollowUpStep>(`/follow-up/sequences/${sequenceId}/steps`, data),

  updateStep: (sequenceId: number, stepId: number, data: Partial<{
    delay_days: number;
    tone: FollowUpTone;
    strategy: FollowUpStrategy;
    custom_template: string;
    include_original_context: boolean;
    include_company_news: boolean;
    include_skills_match: boolean;
  }>) => apiClient.put<FollowUpStep>(`/follow-up/sequences/${sequenceId}/steps/${stepId}`, data),

  deleteStep: (sequenceId: number, stepId: number) =>
    apiClient.delete(`/follow-up/sequences/${sequenceId}/steps/${stepId}`),

  // ============== Campaigns ==============

  startCampaign: (data: {
    application_id: number;
    sequence_id: number;
    auto_mode?: boolean;
    original_email_context?: Record<string, unknown>;
  }) => apiClient.post<CampaignWithPreviews>("/follow-up/campaigns/start", data),

  approveAutoMode: (campaignId: number, data: {
    approved: boolean;
    edited_emails?: Array<{
      email_id: number;
      subject: string;
      body: string;
    }>;
  }) => apiClient.post<FollowUpCampaign>(`/follow-up/campaigns/${campaignId}/approve-auto-mode`, data),

  getCampaigns: (params?: {
    status?: CampaignStatus;
    application_id?: number;
  }) => apiClient.get<FollowUpCampaign[]>("/follow-up/campaigns", { params }),

  getCampaign: (campaignId: number) =>
    apiClient.get<FollowUpCampaign>(`/follow-up/campaigns/${campaignId}`),

  getCampaignEmails: (campaignId: number) =>
    apiClient.get<FollowUpEmail[]>(`/follow-up/campaigns/${campaignId}/emails`),

  getCampaignLogs: (campaignId: number) =>
    apiClient.get<FollowUpLog[]>(`/follow-up/campaigns/${campaignId}/logs`),

  pauseCampaign: (campaignId: number) =>
    apiClient.post<FollowUpCampaign>(`/follow-up/campaigns/${campaignId}/pause`),

  resumeCampaign: (campaignId: number) =>
    apiClient.post<FollowUpCampaign>(`/follow-up/campaigns/${campaignId}/resume`),

  cancelCampaign: (campaignId: number, reason?: string) =>
    apiClient.post<FollowUpCampaign>(`/follow-up/campaigns/${campaignId}/cancel`, { reason }),

  markReplyReceived: (campaignId: number, source?: string) =>
    apiClient.post<FollowUpCampaign>(`/follow-up/campaigns/${campaignId}/mark-reply`, { source }),

  // ============== Emails ==============

  getEmail: (emailId: number) =>
    apiClient.get<FollowUpEmail>(`/follow-up/emails/${emailId}`),

  updateEmail: (emailId: number, data: {
    subject: string;
    body: string;
    is_custom_written?: boolean;
  }) => apiClient.put<FollowUpEmail>(`/follow-up/emails/${emailId}`, data),

  regenerateEmail: (emailId: number, data?: {
    new_tone?: FollowUpTone;
    new_strategy?: FollowUpStrategy;
    custom_hints?: string;
  }) => apiClient.post<FollowUpEmail>(`/follow-up/emails/${emailId}/regenerate`, data || {}),

  approveEmail: (emailId: number) =>
    apiClient.post<FollowUpEmail>(`/follow-up/emails/${emailId}/approve`),

  skipEmail: (emailId: number) =>
    apiClient.post<FollowUpEmail>(`/follow-up/emails/${emailId}/skip`),

  sendEmailNow: (emailId: number) =>
    apiClient.post<FollowUpEmail>(`/follow-up/emails/${emailId}/send-now`),

  restoreOriginalEmail: (emailId: number) =>
    apiClient.post<FollowUpEmail>(`/follow-up/emails/${emailId}/restore-original`),

  // ============== Candidate Profile ==============

  getProfile: () =>
    apiClient.get<CandidateFollowUpProfile>("/follow-up/profile"),

  updateProfile: (data: Partial<{
    linkedin_url: string;
    github_url: string;
    twitter_url: string;
    website_url: string;
    portfolio_url: string;
    phone_number: string;
    alternative_email: string;
    current_title: string;
    years_experience: number;
    key_skills: string[];
    portfolio_projects: Array<{ name: string; url?: string; description?: string }>;
    achievements: string[];
    value_propositions: string[];
    preferred_tone: FollowUpTone;
    signature_style: string;
    custom_signature: string;
  }>) => apiClient.put<CandidateFollowUpProfile>("/follow-up/profile", data),

  // ============== Statistics ==============

  getStats: () =>
    apiClient.get<FollowUpStats>("/follow-up/stats"),

  // ============== Pipeline Integration ==============

  getPipelineFollowUp: (applicationId: number) =>
    apiClient.get<FollowUpCampaign | null>(`/follow-up/pipeline/${applicationId}`),

  getPipelineFollowUpSummary: (applicationId: number) =>
    apiClient.get<PipelineFollowUpSummary>(`/follow-up/pipeline/${applicationId}/summary`),

  // ============== Quick Actions ==============

  quickStart: (applicationId: number, params?: {
    preset_type?: string;
    auto_mode?: boolean;
  }) => apiClient.post<{
    campaign: FollowUpCampaign;
    previews: EmailPreview[];
    sequence_used: string;
  }>(`/follow-up/quick-start/${applicationId}`, {}, { params }),
};

// ============================================
// TheMobiAdz Extraction API
// ============================================

export interface MobiAdzDemographic {
  value: string;
  label: string;
  countries: string[];
}

export interface MobiAdzCategory {
  value: string;
  label: string;
  keywords: string[];
}

export interface MobiAdzExtractionRequest {
  demographics: string[];
  categories: string[];
  use_paid_apis: boolean;
  max_companies: number;
  max_apps_per_category: number;
  website_scrape_depth: number;
  hunter_api_key?: string;
  clearbit_api_key?: string;
  apollo_api_key?: string;
}

export interface MobiAdzJob {
  job_id: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  progress: {
    stage: string;
    stage_progress: number;
    total_progress: number;
    message: string;
  };
  stats: {
    apps_found?: number;
    companies_found?: number;
    emails_found?: number;
    pages_scraped?: number;
    api_calls?: number;
  };
  created_at: string;
  completed_at?: string;
  results_count: number;
}

export interface MobiAdzResult {
  company_name: string;
  app_or_product: string | null;
  product_category: string | null;
  demographic: string | null;
  company_website: string | null;
  company_domain: string | null;
  company_description: string | null;
  company_linkedin: string | null;
  contact_email: string | null;
  marketing_email: string | null;
  sales_email: string | null;
  support_email: string | null;
  playstore_url: string | null;
  appstore_url: string | null;
  people: Array<{ name: string; title?: string; linkedin?: string }>;
  confidence_score: number;
  data_sources: string[];
}

export const mobeAdzAPI = {
  // Get available demographics
  getDemographics: () =>
    apiClient.get<MobiAdzDemographic[]>("/mobiadz/demographics"),

  // Get available categories
  getCategories: () =>
    apiClient.get<MobiAdzCategory[]>("/mobiadz/categories"),

  // Start extraction
  startExtraction: (data: MobiAdzExtractionRequest) =>
    apiClient.post<MobiAdzJob>("/mobiadz/extract", data),

  // Get job status
  getJobStatus: (jobId: string) =>
    apiClient.get<MobiAdzJob>(`/mobiadz/jobs/${jobId}`),

  // Get job results
  getJobResults: (jobId: string, params?: { page?: number; limit?: number }) =>
    apiClient.get<MobiAdzResult[]>(`/mobiadz/jobs/${jobId}/results`, { params }),

  // Cancel job
  cancelJob: (jobId: string) =>
    apiClient.delete<{ message: string }>(`/mobiadz/jobs/${jobId}`),

  // Export results
  exportResults: (jobId: string, format: "json" | "csv" = "json") =>
    apiClient.post<{ content?: string; results?: MobiAdzResult[]; format: string }>(
      `/mobiadz/jobs/${jobId}/export`,
      {},
      { params: { format } }
    ),

  // Quick extraction (synchronous, limited results)
  quickExtract: (demographics: string[], categories: string[], maxResults: number = 20) =>
    apiClient.post<{ success: boolean; count: number; results: MobiAdzResult[] }>(
      "/mobiadz/quick-extract",
      { demographics, categories, max_results: maxResults }
    ),

  // Export results to recipients
  exportToRecipients: (recipients: {
    email: string;
    name?: string;
    company?: string;
    position?: string;
    country?: string;
    source?: string;
    tags?: string;
    custom_fields?: Record<string, unknown>;
  }[], options?: { skip_duplicates?: boolean; create_group?: boolean; group_name?: string }) =>
    apiClient.post<{ created: number; skipped: number; errors: number; group_id?: number }>(
      "/recipients/bulk-import-mobiadz",
      { recipients, ...options }
    ),
};

// ============================================
// Utility: Request with Loading State
// ============================================

export interface ApiRequestOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: APIError) => void;
  onFinally?: () => void;
  ignoreCancelled?: boolean;
}

export async function apiRequest<T>(
  request: () => Promise<{ data: T }>,
  options?: ApiRequestOptions<T>
): Promise<{ data: T | null; error: APIError | null }> {
  try {
    const response = await request();
    options?.onSuccess?.(response.data);
    return { data: response.data, error: null };
  } catch (error) {
    const apiError = isAPIError(error) ? error : new APIError("Unknown error", 0, APIErrorCode.UNKNOWN);

    // Optionally ignore cancelled requests
    if (options?.ignoreCancelled && apiError.isCancelled()) {
      return { data: null, error: null };
    }

    options?.onError?.(apiError);
    return { data: null, error: apiError };
  } finally {
    options?.onFinally?.();
  }
}

// ============================================
// Utility: Cancellable API Request
// ============================================

export interface CancellableApiRequest<T> {
  promise: Promise<{ data: T | null; error: APIError | null }>;
  cancel: () => void;
}

/**
 * Create a cancellable API request with built-in error handling
 *
 * @example
 * const request = createCancellableApiRequest(
 *   (signal) => apiClient.get('/data', { signal }),
 *   'fetch-data'
 * );
 *
 * // Later, if needed:
 * request.cancel();
 *
 * // Or use the promise:
 * const { data, error } = await request.promise;
 */
export function createCancellableApiRequest<T>(
  requestFn: (signal: AbortSignal) => Promise<{ data: T }>,
  requestKey?: string,
  options?: ApiRequestOptions<T>
): CancellableApiRequest<T> {
  const cancellable = createCancellableRequest(requestFn, requestKey);

  const promise = apiRequest(() => cancellable.promise, {
    ...options,
    ignoreCancelled: true,
  });

  return {
    promise,
    cancel: cancellable.cancel,
  };
}

// ============================================
// React Hook Helper: Use Cancellable Request
// ============================================

/**
 * Helper for creating request cleanup functions in React useEffect
 *
 * @example
 * useEffect(() => {
 *   const { request, cleanup } = createEffectRequest(
 *     (signal) => apiClient.get('/data', { signal }),
 *     'my-data-request'
 *   );
 *
 *   request.promise.then(({ data }) => {
 *     if (data) setData(data);
 *   });
 *
 *   return cleanup;
 * }, []);
 */
export function createEffectRequest<T>(
  requestFn: (signal: AbortSignal) => Promise<{ data: T }>,
  requestKey?: string
): { request: CancellableApiRequest<T>; cleanup: () => void } {
  const request = createCancellableApiRequest(requestFn, requestKey);
  return {
    request,
    cleanup: request.cancel,
  };
}

// ============================================
// Email Inbox API
// ============================================

export interface EmailAccount {
  id: number;
  email_address: string;
  account_type: 'gmail' | 'outlook' | 'yahoo' | 'imap' | 'other';
  display_name: string;
  sync_enabled: boolean;
  sync_status: 'pending' | 'syncing' | 'synced' | 'failed';
  last_sync_at: string | null;
  total_emails_synced: number;
  is_primary: boolean;
  created_at: string;
}

export interface EmailMessage {
  id: number;
  direction: 'sent' | 'received';
  from_email: string;
  from_name: string | null;
  to_email: string;
  to_name: string | null;
  subject: string | null;
  snippet: string | null;
  is_read: boolean;
  is_starred: boolean;
  is_important: boolean;
  sent_at: string | null;
  received_at: string | null;
  thread_id: string;
  size_bytes: number | null;
}

export interface EmailMessageDetail extends EmailMessage {
  body_text: string | null;
  body_html: string | null;
  file_path: string | null;
}

export interface EmailThread {
  id: number;
  thread_id: string;
  subject: string | null;
  message_count: number;
  unread_count: number;
  is_starred: boolean;
  latest_message_at: string;
  latest_snippet: string | null;
}

export interface StorageQuota {
  candidate_id: number;
  quota_limit: number;
  used_bytes: number;
  resumes_bytes: number;
  emails_bytes: number;
  documents_bytes: number;
  templates_bytes: number;
  total_files: number;
  usage_percentage: number;
  remaining_bytes: number;
  is_over_quota: boolean;
}

export interface EmailAccountCreate {
  email_address: string;
  account_type: 'gmail' | 'outlook' | 'yahoo' | 'imap' | 'other';
  imap_host?: string;
  imap_port?: number;
  imap_username?: string;
  imap_password: string;
  display_name?: string;
}

export interface SyncResponse {
  account_id: number;
  emails_fetched: number;
  emails_saved: number;
  threads_created: number;
  errors: string[];
}

export const emailInboxApi = {
  // Email Accounts
  connectEmailAccount: (data: EmailAccountCreate) =>
    apiClient.post<EmailAccount>('/inbox/accounts', data),

  listEmailAccounts: () =>
    apiClient.get<EmailAccount[]>('/inbox/accounts'),

  disconnectEmailAccount: (accountId: number) =>
    apiClient.delete(`/inbox/accounts/${accountId}`),

  // Inbox Sync
  syncInbox: (accountId: number, limit = 50) =>
    apiClient.post<SyncResponse>(`/inbox/accounts/${accountId}/sync`, null, {
      params: { limit },
    }),

  // Threads & Messages
  listThreads: (params?: { skip?: number; limit?: number; unread_only?: boolean }) =>
    apiClient.get<EmailThread[]>('/inbox/threads', { params }),

  getThreadMessages: (threadId: string) =>
    apiClient.get<EmailMessageDetail[]>(`/inbox/threads/${threadId}/messages`),

  getMessageDetail: (messageId: number) =>
    apiClient.get<EmailMessageDetail>(`/inbox/messages/${messageId}`),

  // Message Actions
  markAsRead: (messageId: number) =>
    apiClient.patch(`/inbox/messages/${messageId}/read`),

  toggleStar: (messageId: number) =>
    apiClient.patch<{ is_starred: boolean }>(`/inbox/messages/${messageId}/star`),

  // Storage
  getStorageQuota: () =>
    apiClient.get<StorageQuota>('/inbox/storage/quota'),
};

// ============================================
// Template Marketplace API
// ============================================

export interface PublicTemplate {
  id: number;
  creator_id: number | null;
  creator_name: string;
  title: string;
  description: string | null;
  category: string;
  language: string;
  subject_template: string;
  preview_text: string | null;
  tags: string[];
  variables: string[];
  target_industry: string | null;
  target_position_level: string | null;
  target_role: string | null;
  visibility: 'public' | 'private' | 'unlisted';
  is_featured: boolean;
  is_verified: boolean;
  total_clones: number;
  total_uses: number;
  total_views: number;
  avg_response_rate: number;
  avg_rating: number;
  total_ratings: number;
  created_at: string;
  published_at: string | null;
}

export interface PublicTemplateDetail extends PublicTemplate {
  body_template_text: string;
  body_template_html: string | null;
  successful_uses: number;
  total_opens: number;
  total_clicks: number;
  total_replies: number;
}

export interface TemplateReview {
  id: number;
  template_id: number;
  candidate_id: number;
  review_text: string;
  pros: string | null;
  cons: string | null;
  emails_sent: number | null;
  responses_received: number | null;
  helpful_count: number;
  not_helpful_count: number;
  is_verified_use: boolean;
  created_at: string;
}

export interface TemplateCollection {
  id: number;
  creator_id: number | null;
  creator_name: string;
  name: string;
  description: string | null;
  total_templates: number;
  total_views: number;
  total_followers: number;
  is_public: boolean;
  is_featured: boolean;
  created_at: string;
}

export interface MarketplaceStats {
  total_templates: number;
  total_creators: number;
  total_clones: number;
  total_ratings: number;
  total_reviews: number;
  avg_rating: number;
}

export interface TemplatePublishRequest {
  personal_template_id?: number;
  title: string;
  description: string;
  category: string;
  language?: string;
  subject_template?: string;
  body_template_text?: string;
  body_template_html?: string;
  tags?: string[];
  target_industry?: string;
  target_position_level?: string;
  target_role?: string;
  visibility?: 'public' | 'private' | 'unlisted';
}

export interface TemplateRatingRequest {
  rating: number;
  was_successful?: boolean;
  response_time_hours?: number;
  used_for_industry?: string;
  used_for_role?: string;
}

export interface TemplateReviewRequest {
  review_text: string;
  pros?: string;
  cons?: string;
  emails_sent?: number;
  responses_received?: number;
}

export const templateMarketplaceApi = {
  // Publishing
  publishTemplate: (data: TemplatePublishRequest) =>
    apiClient.post<PublicTemplate>('/marketplace/publish', data),

  unpublishTemplate: (templateId: number) =>
    apiClient.delete(`/marketplace/templates/${templateId}`),

  // Browsing & Search
  browseTemplates: (params?: {
    skip?: number;
    limit?: number;
    category?: string;
    language?: string;
    search?: string;
    sort_by?: 'popular' | 'newest' | 'top_rated';
    tags?: string;
    target_industry?: string;
  }) => apiClient.get<PublicTemplate[]>('/marketplace/browse', { params }),

  searchTemplates: (data: {
    search_query?: string;
    category?: string;
    language?: string;
    tags?: string[];
    target_industry?: string;
    target_role?: string;
    min_rating?: number;
    sort_by?: 'popular' | 'newest' | 'top_rated' | 'most_used';
    skip?: number;
    limit?: number;
  }) => apiClient.post<PublicTemplate[]>('/marketplace/search', data),

  getFeaturedTemplates: (limit = 10) =>
    apiClient.get<PublicTemplate[]>('/marketplace/featured', {
      params: { limit },
    }),

  getTemplateDetail: (templateId: number) =>
    apiClient.get<PublicTemplateDetail>(`/marketplace/templates/${templateId}`),

  // Cloning
  cloneTemplate: (templateId: number, customName?: string) =>
    apiClient.post<EmailTemplate>(`/marketplace/templates/${templateId}/clone`, null, {
      params: { custom_name: customName },
    }),

  // Ratings & Reviews
  rateTemplate: (templateId: number, data: TemplateRatingRequest) =>
    apiClient.post(`/marketplace/templates/${templateId}/rate`, data),

  addReview: (templateId: number, data: TemplateReviewRequest) =>
    apiClient.post<TemplateReview>(`/marketplace/templates/${templateId}/review`, data),

  getTemplateReviews: (templateId: number, params?: { skip?: number; limit?: number }) =>
    apiClient.get<TemplateReview[]>(`/marketplace/templates/${templateId}/reviews`, { params }),

  markReviewHelpful: (reviewId: number, isHelpful = true) =>
    apiClient.post(`/marketplace/reviews/${reviewId}/helpful`, null, {
      params: { is_helpful: isHelpful },
    }),

  // Favorites
  toggleFavorite: (templateId: number, notes?: string) =>
    apiClient.post<{ is_favorited: boolean }>(`/marketplace/templates/${templateId}/favorite`, null, {
      params: { notes },
    }),

  getFavorites: () =>
    apiClient.get<PublicTemplate[]>('/marketplace/favorites'),

  // Collections
  createCollection: (data: {
    name: string;
    description: string;
    template_ids: number[];
    is_public?: boolean;
  }) => apiClient.post<TemplateCollection>('/marketplace/collections', data),

  browseCollections: (params?: { skip?: number; limit?: number }) =>
    apiClient.get<TemplateCollection[]>('/marketplace/collections', { params }),

  // Stats
  getMarketplaceStats: () =>
    apiClient.get<MarketplaceStats>('/marketplace/stats'),

  getMyPublishedTemplates: () =>
    apiClient.get<PublicTemplate[]>('/marketplace/my-templates'),
};

// ============================================
// Recipients API
// ============================================

export const recipientsAPI = {
  // CRUD Operations
  list: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    company?: string;
    country?: string;
    tags?: string;
    is_active?: boolean;
    sort_by?: string;
  }) => {
    const { page, limit = 20, ...rest } = params || {};
    const skip = page ? (page - 1) * limit : 0;
    return apiClient.get<PaginatedResponse<Recipient>>("/recipients", {
      params: { skip, limit, ...rest }
    });
  },

  getById: (id: number) =>
    apiClient.get<Recipient>(`/recipients/${id}`),

  create: (data: RecipientCreate) =>
    apiClient.post<Recipient>("/recipients", data),

  update: (id: number, data: RecipientUpdate) =>
    apiClient.patch<Recipient>(`/recipients/${id}`, data),

  delete: (id: number) =>
    apiClient.delete(`/recipients/${id}`),

  // Bulk Operations
  bulkDelete: (ids: number[]) =>
    apiClient.post("/recipients/bulk-delete", { recipient_ids: ids }),

  bulkAddToGroup: (recipientIds: number[], groupId: number) =>
    apiClient.post(`/recipient-groups/${groupId}/recipients/add`, { recipient_ids: recipientIds }),

  // CSV Import
  importCSV: async (file: File): Promise<{
    data: {
      created: number;
      skipped: number;
      errors: string[]
    }
  }> => {
    // Read file content as text
    const csvContent = await file.text();

    // Send as JSON with csv_content field
    return apiClient.post<{
      created: number;
      skipped: number;
      errors: string[]
    }>("/recipients/import-csv", {
      csv_content: csvContent,
      source: "web_ui_csv_import",
      skip_duplicates: true
    });
  },

  // Search & Filter
  search: (params: {
    query?: string;
    companies?: string[];
    countries?: string[];
    tags?: string[];
    min_engagement_score?: number;
    limit?: number;
  }) => apiClient.post<Recipient[]>("/recipients/search", params),

  // Statistics
  getStatistics: () =>
    apiClient.get<RecipientStatistics>("/recipients/statistics/overview"),

  // Engagement
  updateEngagement: (id: number, data: {
    emails_sent?: number;
    emails_opened?: number;
    emails_replied?: number;
  }) => apiClient.post(`/recipients/${id}/engagement`, data),

  // ULTRA AI Email Generation & Deep OSINT Research
  researchRecipient: (recipientId: number, mode: "job" | "market" | "themobiadz" = "job") =>
    apiClient.post(`/recipients/${recipientId}/research?mode=${mode}`, {}, { timeout: 120000 }),

  generateEmails: (recipientId: number) =>
    apiClient.post(`/recipients/${recipientId}/generate-emails`, {}, { timeout: 60000 }),

  sendUltraEmail: (recipientId: number, data: {
    tone: string;
    subject: string;
    body: string;
    schedule_at?: string;
    resume_id?: number;
    position_title?: string;
  }) => apiClient.post(`/recipients/${recipientId}/send-ultra-email`, data),

  // Follow-up Queue & Automation
  getFollowUpQueue: (daysSinceContact: number = 5) =>
    apiClient.get<{
      success: boolean;
      count: number;
      days_threshold: number;
      queue: Array<{
        recipient_id: number;
        name: string;
        email: string;
        company: string;
        position: string;
        country: string;
        last_contacted_at: string;
        days_waiting: number;
        total_emails_sent: number;
        application: {
          id: number;
          position_title: string;
          status: string;
          sent_at: string;
        } | null;
        follow_up_count: number;
      }>;
    }>(`/recipients/follow-up/queue?days_since_contact=${daysSinceContact}`),

  getFollowUpSettings: () =>
    apiClient.get<{
      auto_follow_up_enabled: boolean;
      days_before_follow_up: number;
      max_follow_ups: number;
      follow_up_interval_days: number;
      stop_on_reply: boolean;
      excluded_statuses: string[];
    }>("/recipients/follow-up/settings"),

  updateFollowUpSettings: (settings: {
    auto_follow_up_enabled?: boolean;
    days_before_follow_up?: number;
    max_follow_ups?: number;
    follow_up_interval_days?: number;
    stop_on_reply?: boolean;
  }) => apiClient.put("/recipients/follow-up/settings", settings),

  sendFollowUp: (recipientId: number, data: {
    subject: string;
    body: string;
    follow_up_number?: number;
    reference_original?: boolean;
  }) => apiClient.post(`/recipients/${recipientId}/send-follow-up`, data),

  bulkSendFollowUps: (recipientIds: number[], template: {
    subject_template: string;
    body_template: string;
  }) => apiClient.post("/recipients/follow-up/bulk-send", {
    recipient_ids: recipientIds,
    follow_up_template: template
  }),

  // Batch Enrichment
  batchEnrich: (recipientIds: number[], config: {
    enable_email_validation?: boolean;
    enable_phone_enrichment?: boolean;
    enable_linkedin_enrichment?: boolean;
    enable_job_title_enrichment?: boolean;
    enable_company_enrichment?: boolean;
    async_mode?: boolean;
  }) => apiClient.post("/recipients/batch-enrich", {
    recipient_ids: recipientIds,
    ...config
  }, { timeout: 300000 }), // 5 minute timeout for batch operations

  // Async enrichment with progress tracking
  startEnrichment: (recipientIds: number[], config: {
    enable_email_validation?: boolean;
    enable_phone_enrichment?: boolean;
    enable_linkedin_enrichment?: boolean;
    enable_job_title_enrichment?: boolean;
    enable_company_enrichment?: boolean;
  }) => apiClient.post("/recipients/batch-enrich", {
    recipient_ids: recipientIds,
    async_mode: true,
    ...config
  }, { timeout: 10000 }),

  getEnrichmentStatus: (jobId: string) =>
    apiClient.get(`/recipients/batch-enrich/status/${jobId}`),

  // Entity Resolution / Deduplication
  deduplicateRecipients: (recipientIds: number[], options?: {
    match_threshold?: number;
    high_confidence_threshold?: number;
  }) => apiClient.post("/recipients/deduplicate", {
    recipient_ids: recipientIds,
    match_threshold: options?.match_threshold || 0.8,
    high_confidence_threshold: options?.high_confidence_threshold || 0.95
  }, { timeout: 120000 }), // 2 minute timeout

  // Merge Duplicate Recipients
  mergeDuplicates: (recipientIds: number[], keepRecipientId: number, options?: {
    merge_strategy?: "keep_first" | "keep_most_complete" | "custom";
    custom_data?: Record<string, any>;
  }) => apiClient.post("/recipients/merge-duplicates", {
    recipient_ids: recipientIds,
    keep_recipient_id: keepRecipientId,
    merge_strategy: options?.merge_strategy || "keep_most_complete",
    custom_data: options?.custom_data
  }),

  // Execute Merge with Full Tracking
  executeMerge: (recipientIds: number[], keepRecipientId: number, options?: {
    merge_strategy?: "keep_first" | "keep_most_complete" | "custom";
    custom_data?: Record<string, any>;
  }) => apiClient.post("/recipients/merge-execute", {
    recipient_ids: recipientIds,
    keep_recipient_id: keepRecipientId,
    merge_strategy: options?.merge_strategy || "keep_most_complete",
    custom_data: options?.custom_data
  }),

  // Rollback a Merge Operation
  rollbackMerge: (mergeId: string) => apiClient.post(`/recipients/merge/${mergeId}/rollback`),

  // Get Merge History
  getMergeHistory: (mergeId: string) => apiClient.get(`/recipients/merge/${mergeId}/history`),
};

// ============================================
// Recipient Groups API
// ============================================

export const recipientGroupsAPI = {
  // CRUD Operations
  list: (params?: { page?: number; limit?: number; group_type?: string }) => {
    const { page, limit = 20, ...rest } = params || {};
    const skip = page ? (page - 1) * limit : 0;
    return apiClient.get<PaginatedResponse<RecipientGroup>>("/recipient-groups", {
      params: { skip, limit, ...rest }
    });
  },

  getById: (id: number) =>
    apiClient.get<RecipientGroup>(`/recipient-groups/${id}`),

  create: (data: RecipientGroupCreate) =>
    apiClient.post<RecipientGroup>("/recipient-groups", data),

  update: (id: number, data: RecipientGroupUpdate) =>
    apiClient.patch<RecipientGroup>(`/recipient-groups/${id}`, data),

  delete: (id: number) =>
    apiClient.delete(`/recipient-groups/${id}`),

  // Group Members
  getRecipients: (groupId: number, params?: { page?: number; limit?: number }) => {
    const { page, limit = 50, ...rest } = params || {};
    const skip = page ? (page - 1) * limit : 0;
    return apiClient.get<PaginatedResponse<Recipient>>(`/recipient-groups/${groupId}/recipients`, {
      params: { skip, limit, ...rest }
    });
  },

  addRecipients: (groupId: number, recipientIds: number[]) =>
    apiClient.post(`/recipient-groups/${groupId}/recipients/add`, { recipient_ids: recipientIds }),

  removeRecipients: (groupId: number, recipientIds: number[]) =>
    apiClient.post(`/recipient-groups/${groupId}/recipients/remove`, { recipient_ids: recipientIds }),

  // Dynamic Groups
  refreshDynamicGroup: (groupId: number) =>
    apiClient.post<{ recipients_added: number; recipients_removed: number }>(
      `/recipient-groups/${groupId}/refresh`
    ),

  previewDynamicFilters: (filters: any) =>
    apiClient.post<{ count: number; sample: Recipient[] }>("/recipient-groups/preview-filters", filters),

  // Statistics
  getStatistics: (groupId: number) =>
    apiClient.get<{
      total_recipients: number;
      active_recipients: number;
      avg_engagement_score: number;
      total_emails_sent: number;
      total_emails_opened: number;
      total_emails_replied: number;
    }>(`/recipient-groups/${groupId}/statistics`),
};

// ============================================
// Group Campaigns API
// ============================================

export const groupCampaignsAPI = {
  // CRUD Operations
  list: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    group_id?: number;
  }) => {
    const { page, limit = 20, ...rest } = params || {};
    const skip = page ? (page - 1) * limit : 0;
    return apiClient.get<PaginatedResponse<GroupCampaign>>("/group-campaigns", {
      params: { skip, limit, ...rest }
    });
  },

  getById: (id: number) =>
    apiClient.get<GroupCampaign>(`/group-campaigns/${id}`),

  create: (data: GroupCampaignCreate) =>
    apiClient.post<GroupCampaign>("/group-campaigns", data),

  update: (id: number, data: Partial<GroupCampaignCreate>) =>
    apiClient.patch<GroupCampaign>(`/group-campaigns/${id}`, data),

  delete: (id: number) =>
    apiClient.delete(`/group-campaigns/${id}`),

  // Campaign Management
  send: (campaignId: number) =>
    withRetry(
      () => apiClient.post<{ message: string; campaign: GroupCampaign }>(
        `/group-campaigns/${campaignId}/send`
      ),
      { retries: 2 }
    ),

  pause: (campaignId: number) =>
    apiClient.post<GroupCampaign>(`/group-campaigns/${campaignId}/pause`),

  resume: (campaignId: number) =>
    apiClient.post<GroupCampaign>(`/group-campaigns/${campaignId}/resume`),

  cancel: (campaignId: number) =>
    apiClient.post<GroupCampaign>(`/group-campaigns/${campaignId}/cancel`),

  // Campaign Recipients
  getRecipients: (campaignId: number, params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => {
    const { page, limit = 50, ...rest } = params || {};
    const skip = page ? (page - 1) * limit : 0;
    return apiClient.get<PaginatedResponse<GroupCampaignRecipient>>(
      `/group-campaigns/${campaignId}/recipients`,
      { params: { skip, limit, ...rest } }
    );
  },

  // Preview & Testing
  preview: (data: {
    group_id: number;
    template_id?: number;
    subject_template?: string;
    body_template?: string;
    sample_recipient_id?: number;
  }) => apiClient.post<{
    rendered_subject: string;
    rendered_body: string;
    sample_recipient?: Recipient;
  }>("/group-campaigns/preview", data),

  // Statistics
  getProgress: (campaignId: number) =>
    apiClient.get<{
      campaign_id: number;
      status: string;
      total_recipients: number;
      sent_count: number;
      failed_count: number;
      opened_count: number;
      replied_count: number;
      bounced_count: number;
      progress_percentage: number;
      estimated_completion?: string;
    }>(`/group-campaigns/${campaignId}/progress`),

  getStatistics: (campaignId: number) =>
    apiClient.get<{
      sent: number;
      opened: number;
      replied: number;
      failed: number;
      bounced: number;
      open_rate: number;
      reply_rate: number;
      bounce_rate: number;
      avg_response_time_hours?: number;
    }>(`/group-campaigns/${campaignId}/statistics`),

  // Group Campaign Creation & Analytics
  createFromGroup: (groupId: number, campaignData?: {
    campaign_name?: string;
    template_id?: number;
  }) =>
    apiClient.post<{
      success: boolean;
      campaign_id: number;
      campaign_name: string;
      total_recipients: number;
      status: string;
      message: string;
    }>("/campaigns/from-group", { group_id: groupId, ...campaignData }),

  getGroupAnalytics: (campaignId: number) =>
    apiClient.get<{
      campaign_id: number;
      campaign_name: string;
      group_id: number;
      group_name: string;
      overall_metrics: {
        total_recipients: number;
        sent: number;
        failed: number;
        skipped: number;
        opened: number;
        replied: number;
        bounced: number;
        open_rate: number;
        reply_rate: number;
      };
      status_breakdown: {
        pending: number;
        sent: number;
        opened: number;
        replied: number;
        bounced: number;
        failed: number;
      };
      timing: {
        created_at: string;
        started_at?: string;
        completed_at?: string;
        last_updated: string;
      };
    }>(`/campaigns/${campaignId}/group-analytics`),

  getGroupCampaigns: (groupId: number, params?: { status?: string; limit?: number }) =>
    apiClient.get<{
      group_id: number;
      group_name: string;
      total_campaigns: number;
      aggregated_metrics: {
        total_sent: number;
        total_opened: number;
        total_replied: number;
        total_failed: number;
        combined_open_rate: number;
        combined_reply_rate: number;
      };
      campaigns: Array<{
        campaign_id: number;
        campaign_name: string;
        status: string;
        total_recipients: number;
        sent_count: number;
        opened_count: number;
        replied_count: number;
        created_at: string;
      }>;
    }>(`/campaigns/group/${groupId}/campaigns`, { params }),

  // Campaign Status & Events
  getStatus: (campaignId: number) =>
    apiClient.get<{
      campaign_id: number;
      campaign_name: string;
      status: string;
      progress: {
        total_recipients: number;
        sent_count: number;
        failed_count: number;
        skipped_count: number;
        opened_count: number;
        replied_count: number;
        bounced_count: number;
      };
      rates: {
        success_rate: number;
        open_rate: number;
        reply_rate: number;
        bounce_rate: number;
      };
      timing: {
        created_at: string;
        started_at: string | null;
        completed_at: string | null;
        duration_seconds: number | null;
      };
      error_message: string | null;
    }>(`/group-campaigns/${campaignId}/status`),

  streamEvents: (campaignId: number, onEvent: (event: any) => void, onError?: (error: Error) => void) => {
    const eventSource = new EventSource(`${API_BASE_URL}/group-campaigns/${campaignId}/events`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onEvent(data);
      } catch (e) {
        console.error("Failed to parse SSE event:", e);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE connection error:", error);
      eventSource.close();
      if (onError) onError(new Error("SSE connection failed"));
    };

    // Return cleanup function
    return () => eventSource.close();
  },
};

// ============================================
// Enrichment API
// ============================================

export const enrichmentApi = {
  // Execute enrichment
  execute: (data: {
    recipient_ids: number[];
    config?: {
      email_verification?: boolean;
      phone_discovery?: boolean;
      linkedin_profile?: boolean;
      job_title_validation?: boolean;
      company_info?: boolean;
      social_profiles?: boolean;
      use_cache?: boolean;
      fraud_detection?: boolean;
    };
    async_mode?: boolean;
    depth?: "quick" | "standard" | "deep";
  }) =>
    apiClient.post<{
      success: boolean;
      job_id: string;
      status: string;
      total_recipients: number;
      progress_url: string | null;
      results_url: string | null;
      message: string;
    }>("/enrichment/execute", data),

  // Get status
  getStatus: (jobId: string) =>
    apiClient.get<{
      job_id: string;
      status: string;
      progress: {
        total: number;
        processed: number;
        successful: number;
        failed: number;
        percentage: number;
      };
      results: any[] | null;
      error: string | null;
      created_at: string;
      completed_at: string | null;
    }>(`/enrichment/status/${jobId}`),

  // Get results
  getResults: (jobId: string) =>
    apiClient.get<{
      job_id: string;
      status: string;
      total_recipients: number;
      successful_enrichments: number;
      failed_enrichments: number;
      results: any[];
      completed_at: string | null;
    }>(`/enrichment/results/${jobId}`),
};

// ============================================
// Template Analytics API
// ============================================

export const templateAnalyticsApi = {
  // Event Tracking
  trackEvent: (data: any) =>
    apiClient.post<any>('/template-analytics/events', data),

  // Snapshots
  generateSnapshot: (data: {
    template_id: number;
    period_type: string;
    snapshot_date?: string;
  }) => apiClient.post<any>('/template-analytics/snapshots/generate', data),

  generateAllSnapshots: (periodType: string, snapshotDate?: string) =>
    apiClient.post<any>('/template-analytics/snapshots/generate-all', null, {
      params: { period_type: periodType, snapshot_date: snapshotDate },
    }),

  getSnapshots: (templateId: number, periodType?: string, limit?: number) =>
    apiClient.get<any[]>('/template-analytics/snapshots', {
      params: { template_id: templateId, period_type: periodType, limit },
    }),

  // Template Performance
  getPerformance: (templateId: number, periodType: 'daily' | 'weekly' | 'monthly' = 'daily', limit: number = 30) =>
    apiClient.get<any>(`/template-analytics/templates/${templateId}/performance`, {
      params: { period_type: periodType, limit },
    }),

  getTrending: (category?: string, limit: number = 10) =>
    apiClient.get<any[]>('/template-analytics/templates/trending', {
      params: { category, limit },
    }),

  compareTemplates: (templateIds: number[], periodDays: number = 30) =>
    apiClient.get<any>('/template-analytics/templates/compare', {
      params: {
        template_ids: templateIds.join(','),
        period_days: periodDays,
      },
    }),

  getRankings: (category?: string, metric: string = 'total_score', limit: number = 20) =>
    apiClient.get<any[]>('/template-analytics/rankings', {
      params: { category, metric, limit },
    }),

  // Growth Tracking
  getGrowthMetrics: (templateId: number, periodType: string = 'daily', periods: number = 30) =>
    apiClient.get<any>(`/template-analytics/templates/${templateId}/growth`, {
      params: { period_type: periodType, periods },
    }),

  // User Engagement
  getUserEngagement: (templateId: number, periodDays: number = 30) =>
    apiClient.get<any>(`/template-analytics/templates/${templateId}/engagement`, {
      params: { period_days: periodDays },
    }),
};

// ============================================
// Data Extraction API
// ============================================

export type ExtractionSector = 'clients' | 'companies' | 'recruiters' | 'customers';
export type ExtractionJobStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed';
export type ExtractionStage = 'discovery' | 'fetching' | 'rendering' | 'parsing' | 'enrichment' | 'validation' | 'storage';

export interface ExtractionSources {
  urls?: string[];
  files?: File[];
  directories?: Array<{
    source: string;
    query: string;
    filters?: Record<string, any>;
  }>;
  api_keys?: Record<string, string>;
}

export interface ExtractionFilters {
  basic?: {
    job_titles?: string[];
    locations?: string[];
    industries?: string[];
    keywords?: string[];
  };
  advanced?: {
    tech_stack?: string[];
    funding_status?: string[];
    company_size?: string;
    revenue_range?: string;
    years_in_business?: number;
  };
}

export interface ExtractionOptions {
  depth: number;
  follow_external: boolean;
  use_playwright: boolean;
  rate_limit: number;
  max_records: number;
  enable_enrichment?: boolean;
  use_cache?: boolean;
}

export interface ExtractionJob {
  id: number;
  candidate_id: number;
  sector: ExtractionSector;
  status: ExtractionJobStatus;
  sources: ExtractionSources;
  filters: ExtractionFilters;
  options: ExtractionOptions;
  total_sources: number;
  processed_sources: number;
  total_records: number;
  success_count: number;
  error_count: number;
  started_at?: string;
  completed_at?: string;
  estimated_completion?: string;
  result_file_path?: string;
  created_at: string;
  // Extended properties for UI compatibility
  config?: {
    use_paid_apis?: boolean;
    sector?: string;
  };
  progress?: number;
}

export interface ExtractionResult {
  id: number;
  job_id: number;
  data: {
    name?: string;
    email?: string;
    company?: string;
    title?: string;
    phone?: string;
    location?: string;
    linkedin_url?: string;
    website?: string;
    [key: string]: any;
  };
  source_url: string;
  extraction_layer: number;
  quality_score: number;
  confidence_score: number;
  completeness_score?: number;
  is_duplicate: boolean;
  is_validated: boolean;
  enriched_via_api: boolean;
  api_source?: string;
  created_at: string;
}

export interface ExtractionProgress {
  job_id: number;
  stage: ExtractionStage;
  message: string;
  progress_percent: number;
  current_source?: string;
  records_extracted: number;
  records_validated: number;
  errors_count: number;
  created_at: string;
}

export interface ProgressUpdate {
  type: 'progress' | 'complete' | 'error';
  job_id: number;
  stage?: ExtractionStage;
  progress_percent: number;
  message?: string;
  current_source?: string;
  total_records?: number;
  success_count?: number;
  error_count?: number;
  estimated_completion?: string;
}

export interface ExtractionJobCreate {
  sector: ExtractionSector;
  sources: ExtractionSources;
  filters?: ExtractionFilters;
  options?: Partial<ExtractionOptions>;
}

export interface ExtractionExportRequest {
  format: 'excel' | 'csv' | 'json';
  include_metadata?: boolean;
  filters?: {
    min_quality?: number;
    validated_only?: boolean;
  };
}

export interface ExtractionImportRequest {
  filter_duplicates: boolean;
  min_quality: number;
  create_group: boolean;
  group_name?: string;
  send_welcome_email: boolean;
}

export const extractionAPI = {
  // Job Management
  createJob: (data: ExtractionJobCreate) =>
    apiClient.post<ExtractionJob>('/extraction/jobs', data),

  getJob: (jobId: number) =>
    apiClient.get<ExtractionJob>(`/extraction/jobs/${jobId}`),

  listJobs: (params?: {
    page?: number;
    limit?: number;
    status?: ExtractionJobStatus;
    sector?: ExtractionSector;
  }) => {
    const { page, limit = 20, ...rest } = params || {};
    const skip = page ? (page - 1) * limit : 0;
    return apiClient.get<PaginatedResponse<ExtractionJob>>('/extraction/jobs', {
      params: { skip, limit, ...rest }
    });
  },

  // Job Control
  startJob: (jobId: number) =>
    apiClient.post<{ message: string; job: ExtractionJob }>(`/extraction/jobs/${jobId}/start`),

  pauseJob: (jobId: number) =>
    apiClient.post<ExtractionJob>(`/extraction/jobs/${jobId}/pause`),

  resumeJob: (jobId: number) =>
    apiClient.post<ExtractionJob>(`/extraction/jobs/${jobId}/resume`),

  stopJob: (jobId: number) =>
    apiClient.post<ExtractionJob>(`/extraction/jobs/${jobId}/stop`),

  // Progress & Results
  getResults: (jobId: number, params?: {
    page?: number;
    limit?: number;
    min_quality?: number;
    validated_only?: boolean;
  }) => {
    const { page, limit = 50, ...rest } = params || {};
    const skip = page ? (page - 1) * limit : 0;
    return apiClient.get<PaginatedResponse<ExtractionResult>>(`/extraction/jobs/${jobId}/results`, {
      params: { skip, limit, ...rest }
    });
  },

  getProgress: (jobId: number) =>
    apiClient.get<ExtractionProgress[]>(`/extraction/jobs/${jobId}/progress`),

  // Export
  exportResults: (jobId: number, data: ExtractionExportRequest) =>
    apiClient.post<{
      success: boolean;
      download_url: string;
      file_path: string;
      total_records: number;
    }>(`/extraction/jobs/${jobId}/export`, data),

  // Import to Recipients
  importToRecipients: (jobId: number, data: ExtractionImportRequest) =>
    apiClient.post<{
      success: boolean;
      imported_count: number;
      skipped_count: number;
      group_id?: number;
      message: string;
    }>(`/extraction/jobs/${jobId}/import-recipients`, data),

  // Statistics
  getStatistics: (jobId: number) =>
    apiClient.get<{
      total_records: number;
      quality_breakdown: {
        high: number;
        medium: number;
        low: number;
      };
      layer_breakdown: Record<number, number>;
      source_breakdown: Array<{
        url: string;
        records: number;
        success_rate: number;
      }>;
      completion_percentage: number;
      avg_quality_score: number;
    }>(`/extraction/jobs/${jobId}/statistics`),
};

// ============================================
// Documents API (Resume & Info Docs Management)
// ============================================

export const documentsAPI = {
  // Resume endpoints
  uploadResume: (file: File, data?: {
    name?: string;
    description?: string;
    target_position?: string;
  }) => {
    const formData = new FormData();
    formData.append('file', file);
    if (data?.name) formData.append('name', data.name);
    if (data?.description) formData.append('description', data.description);
    if (data?.target_position) formData.append('target_position', data.target_position);

    return apiClient.post<{
      success: boolean;
      message: string;
      resume: {
        id: number;
        name: string;
        filename: string;
        file_path: string;
        is_default: boolean;
        created_at: string;
      };
      parsed_data?: ParsedResume;
    }>("/documents/resumes/upload", formData, {
      timeout: 60000, // 60s for parsing
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  listResumes: (params?: {
    include_parsed?: boolean;
  }) => {
    return apiClient.get<DocumentListResponse>("/documents/resumes", {
      params: params || { include_parsed: true },
    });
  },

  getResume: (id: number) => {
    return apiClient.get<{
      id: number;
      candidate_id: number;
      name: string;
      description?: string;
      filename: string;
      file_path: string;
      file_size?: number;
      target_position?: string;
      is_default: boolean;
      is_active: boolean;
      times_used: number;
      last_used_at?: string;
      created_at: string;
      updated_at?: string;
      parsed_data?: ParsedResume;
    }>(`/documents/resumes/${id}`);
  },

  deleteResume: (id: number) => {
    return apiClient.delete<{
      success: boolean;
      message: string;
    }>(`/documents/resumes/${id}`);
  },

  setDefaultResume: (id: number) => {
    return apiClient.patch<{
      success: boolean;
      message: string;
    }>(`/documents/resumes/${id}/set-default`);
  },

  // Info Doc endpoints
  uploadInfoDoc: (file: File, data: {
    name: string;
    description?: string;
    doc_type?: string;
  }) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', data.name);
    if (data.description) formData.append('description', data.description);
    if (data.doc_type) formData.append('doc_type', data.doc_type);

    return apiClient.post<{
      success: boolean;
      message: string;
      info_doc: {
        id: number;
        name: string;
        filename: string;
        file_path: string;
        doc_type?: string;
        is_default: boolean;
        created_at: string;
      };
    }>("/documents/info-docs/upload", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  listInfoDocs: () => {
    return apiClient.get<DocumentListResponse>("/documents/info-docs");
  },

  getInfoDoc: (id: number) => {
    return apiClient.get<CompanyInfoDoc>(`/documents/info-docs/${id}`);
  },

  deleteInfoDoc: (id: number) => {
    return apiClient.delete<{
      success: boolean;
      message: string;
    }>(`/documents/info-docs/${id}`);
  },

  setDefaultInfoDoc: (id: number) => {
    return apiClient.patch<{
      success: boolean;
      message: string;
    }>(`/documents/info-docs/${id}/set-default`);
  },

  // Download endpoints - returns blob for file download
  downloadResume: async (id: number): Promise<{ blob: Blob; filename: string }> => {
    const response = await apiClient.get(`/documents/resumes/${id}/download`, {
      responseType: 'blob',
    });
    const contentDisposition = response.headers?.['content-disposition'];
    let filename = 'resume';
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?(.+)"?/);
      if (match) filename = match[1];
    }
    return { blob: response.data, filename };
  },

  downloadInfoDoc: async (id: number): Promise<{ blob: Blob; filename: string }> => {
    const response = await apiClient.get(`/documents/info-docs/${id}/download`, {
      responseType: 'blob',
    });
    const contentDisposition = response.headers?.['content-disposition'];
    let filename = 'document';
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?(.+)"?/);
      if (match) filename = match[1];
    }
    return { blob: response.data, filename };
  },

  // Get resume download URL (for iframe/preview)
  getResumeDownloadUrl: (id: number) => {
    return `${apiClient.defaults.baseURL}/documents/resumes/${id}/download`;
  },

  getInfoDocDownloadUrl: (id: number) => {
    return `${apiClient.defaults.baseURL}/documents/info-docs/${id}/download`;
  },

  // Update resume parsed data
  updateResume: (id: number, data: {
    name?: string;
    description?: string;
    parsed_data?: ParsedResume;
  }) => {
    return apiClient.put<{
      success: boolean;
      message: string;
      resume: {
        id: number;
        name: string;
        parsed_data?: ParsedResume;
      };
    }>(`/documents/resumes/${id}`, data);
  },

  // Update info doc data
  updateInfoDoc: (id: number, data: {
    name?: string;
    description?: string;
    company_name?: string;
    tagline?: string;
    industry?: string;
    products_services?: any[];
    key_benefits?: string[];
    unique_selling_points?: string[];
    problem_solved?: string;
    pricing_tiers?: any[];
    contact_info?: any;
    team_members?: any[];
  }) => {
    return apiClient.put<{
      success: boolean;
      message: string;
      info_doc: CompanyInfoDoc;
    }>(`/documents/info-docs/${id}`, data);
  },

  // Re-parse resume with AI
  reparseResume: (id: number) => {
    return apiClient.post<{
      success: boolean;
      message: string;
      parsed_data: ParsedResume;
    }>(`/documents/resumes/${id}/reparse`);
  },

  // Re-parse info doc with AI
  reparseInfoDoc: (id: number) => {
    return apiClient.post<{
      success: boolean;
      message: string;
      parsed_data: {
        company_name: string;
        tagline: string;
        industry: string;
        products_services_count: number;
        benefits_count: number;
        usp_count: number;
        pricing_tiers_count: number;
        team_members_count: number;
        confidence_score: number;
        warnings: string[];
      };
    }>(`/documents/info-docs/${id}/reparse`);
  },
};

// ============================================
// NOTIFICATIONS API
// ============================================

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  application_id?: number;
  company_id?: number;
  group_campaign_id?: number;
  action_url?: string;
  action_text?: string;
  is_read: boolean;
  is_archived: boolean;
  icon?: string;
  priority: number;
  created_at: string;
  read_at?: string;
  expires_at?: string;
  is_expired: boolean;
}

export interface NotificationStats {
  total: number;
  unread: number;
  by_type: Record<string, number>;
}

export interface NotificationPreferences {
  notifications_enabled: boolean;
  email_notifications_enabled: boolean;
  push_notifications_enabled: boolean;
  enabled_types: Record<string, boolean>;
  delivery_preferences: Record<string, string>;
  quiet_hours_enabled: boolean;
  quiet_start_time?: string;
  quiet_end_time?: string;
  dnd_enabled: boolean;
  dnd_until?: string;
  digest_enabled: boolean;
  digest_frequency: string;
}

export const notificationApi = {
  // Get all notifications
  getNotifications: (params?: {
    include_read?: boolean;
    include_archived?: boolean;
    notification_type?: string;
    limit?: number;
    offset?: number;
  }) => {
    return apiClient.get<{
      notifications: Notification[];
      total: number;
      unread_count: number;
    }>('/notifications', { params });
  },

  // Get notification stats
  getStats: () => {
    return apiClient.get<NotificationStats>('/notifications/stats');
  },

  // Mark notification as read
  markAsRead: (notificationId: number) => {
    return apiClient.post(`/notifications/${notificationId}/read`);
  },

  // Mark all notifications as read
  markAllAsRead: () => {
    return apiClient.post('/notifications/read-all');
  },

  // Archive notification
  archive: (notificationId: number) => {
    return apiClient.post(`/notifications/${notificationId}/archive`);
  },

  // Delete notification
  delete: (notificationId: number) => {
    return apiClient.delete(`/notifications/${notificationId}`);
  },

  // Get notification preferences
  getPreferences: () => {
    return apiClient.get<NotificationPreferences>('/notifications/preferences');
  },

  // Update notification preferences
  updatePreferences: (data: Partial<NotificationPreferences>) => {
    return apiClient.put<NotificationPreferences>('/notifications/preferences', data);
  },

  // Cleanup expired notifications
  cleanupExpired: () => {
    return apiClient.post<{ message: string; count: number }>('/notifications/cleanup');
  },
};
