/**
 * Warmup Pool API Client - ULTRA PREMIUM EDITION
 *
 * Complete API client for the Email Warmup System
 * Connects to all Phase 1, 2, 3, and 4 (ML/DL Engine) backend endpoints
 *
 * @version 4.0.0 - GOD TIER EDITION with ML/DL Intelligence
 *
 * Phase 4 Features:
 * - Deep Q-Network (DQN) for optimal action selection
 * - LSTM Neural Networks for engagement prediction
 * - Multi-Armed Bandits (Thompson Sampling + UCB1)
 * - Isolation Forest for anomaly detection
 * - Gradient Boosting for deliverability prediction
 * - Holt-Winters time series forecasting
 * - Adaptive control with throttling and reputation protection
 */

import { API_BASE_URL } from "./api";

// ============================================================================
// Types
// ============================================================================

export interface EnrollRequest {
  tier?: string;
  settings?: Record<string, unknown>;
}

export interface EnrollResponse {
  success: boolean;
  message: string;
  member_id?: number;
  tier?: string;
  warnings: string[];
}

export interface MemberStatus {
  id: number;
  candidate_id: number;
  pool_tier: string;
  tier_info: Record<string, unknown>;
  status: string;
  is_active: boolean;
  quality_score: number;
  health_status: string;
  statistics: Record<string, unknown>;
  rates: Record<string, number>;
  daily_usage: Record<string, number>;
  joined_at: string;
  last_activity_at?: string;
}

export interface PoolTier {
  id: string;
  name: string;
  daily_send_limit: number;
  daily_receive_limit: number;
  priority_matching: boolean;
  premium_partners_only: boolean;
  ai_content_optimization: boolean;
  advanced_analytics: boolean;
}

export interface Schedule {
  timezone: string;
  active_hours: Record<string, number>;
  active_days: Record<string, boolean>;
  delays: Record<string, Record<string, number>>;
  preferences: Record<string, boolean>;
}

export interface Conversation {
  id: number;
  thread_id: string;
  sender_id: number;
  receiver_id: number;
  subject: string;
  status: string;
  scheduled_at?: string;
  sent_at?: string;
  engagement_score: number;
}

export interface PlacementTest {
  test_id: number;
  status: string;
  overall_score?: number;
  inbox_rate?: number;
  spam_rate?: number;
  by_provider?: Record<string, unknown>;
  issues?: Array<Record<string, unknown>>;
  recommendations?: Array<Record<string, unknown>>;
}

export interface BlacklistStatus {
  check_date: string;
  is_listed: boolean;
  severity: string;
  total_checked: number;
  total_listings: number;
  major_blacklists: Record<string, Record<string, unknown>>;
  new_listings: string[];
  removed_listings: string[];
}

export interface PoolStats {
  total_members: number;
  active_members: number;
  by_tier: Record<string, number>;
  by_provider: Record<string, number>;
  avg_quality_score: number;
  activity_today: Record<string, number>;
  spam_rescue_rate: number;
}

export interface AIInsight {
  id: string;
  type: "recommendation" | "warning" | "prediction" | "achievement";
  title: string;
  description: string;
  impact: "low" | "medium" | "high" | "critical";
  action_required: boolean;
  suggested_action?: string;
  confidence: number;
  generated_at: string;
}

export interface AIInsightsResponse {
  insights: AIInsight[];
  summary: {
    recommendations: number;
    warnings: number;
    predictions: number;
    achievements: number;
    average_confidence: number;
    action_required_count: number;
  };
  neural_engine_version: string;
  processing_time_ms: number;
}

export interface NeuralNetworkStatus {
  status: string;
  nodes: Record<string, unknown>;
  connections: number;
  active_signals: number;
  health_score: number;
  last_optimization: string;
  model_version: string;
}

export interface Prediction {
  metric: string;
  current_value: number;
  predicted_value: number;
  confidence: number;
  trend: string;
  time_horizon: string;
  factors: Array<{ name: string; impact: string; weight: number }>;
}

export interface PredictionsResponse {
  predictions: Prediction[];
  time_horizon: string;
  generated_at: string;
  model_info: {
    name: string;
    type: string;
    algorithms: string[];
    training_samples: number;
    last_retrained: string;
  };
}

export interface RealtimeStats {
  timestamp: string;
  member: {
    quality_score: number;
    health_status: string;
    tier: string;
    is_active: boolean;
  };
  today: {
    emails_sent: number;
    emails_received: number;
    remaining_sends: number;
    remaining_receives: number;
  };
  rates: {
    response_rate: number;
    open_rate: number;
    bounce_rate: number;
    spam_rate: number;
  };
  pool: {
    total_members: number;
    active_members: number;
    avg_quality_score: number;
    conversations_today: number;
  };
  predictions: {
    health_7d: number;
    inbox_rate: number;
    growth_trend: string;
  };
}

export interface DNSVerificationRequest {
  domain: string;
  check_spf?: boolean;
  check_dkim?: boolean;
  check_dmarc?: boolean;
}

export interface DNSVerificationResponse {
  domain: string;
  overall_status: string;
  spf: Record<string, unknown>;
  dkim: Record<string, unknown>;
  dmarc: Record<string, unknown>;
  recommendations: string[];
  score: number;
}

export interface WarmupPreset {
  id: string;
  name: string;
  description: string;
  settings: {
    daily_volume_start: number;
    daily_volume_max: number;
    ramp_up_days: number;
    ramp_increment: number;
    reply_rate_target: number;
    send_hours_start: number;
    send_hours_end: number;
    weekdays_only: boolean;
  };
  recommended_for: string[];
  requires_tier?: string;
}

export interface DashboardData {
  enrolled: boolean;
  timestamp: string;
  message?: string;
  member?: {
    id: number;
    tier: string;
    tier_config: Record<string, unknown>;
    status: string;
    is_active: boolean;
    quality_score: number;
    health_status: string;
  };
  daily_usage?: {
    sends_today: number;
    receives_today: number;
    send_limit: number;
    receive_limit: number;
    remaining_sends: number;
    remaining_receives: number;
  };
  rates?: {
    response_rate: number;
    open_rate: number;
    bounce_rate: number;
  };
  placement_test?: {
    test_date: string;
    overall_score: number;
    inbox_rate: number;
    spam_rate: number;
    issues_count: number;
  };
  blacklist_status?: {
    check_date: string;
    is_listed: boolean;
    severity: string;
    total_listings: number;
  };
  spam_statistics?: {
    spam_rate: number;
    rescue_rate: number;
    alert_level: string;
  };
  alerts?: Array<{
    severity: string;
    type: string;
    title: string;
    message: string;
    recommendations?: string[];
  }>;
  alert_count?: number;
  pool_stats?: {
    total_members: number;
    active_members: number;
    avg_quality_score: number;
  };
}

// ============================================================================
// Phase 4: ML/DL Engine Types
// ============================================================================

export interface MLPredictionRequest {
  account_id: string;
  provider?: string;
  current_volume?: number;
  health_score?: number;
  days_active?: number;
  bounce_rate?: number;
  spam_rate?: number;
  open_rate?: number;
  reply_rate?: number;
}

export interface MLPredictionResponse {
  account_id: string;
  predictions: {
    optimal_action: {
      action: string;
      confidence: number;
      q_values: Record<string, number>;
      exploration_rate: number;
    };
    engagement: {
      predicted_open_rate: number;
      predicted_reply_rate: number;
      confidence_intervals: {
        open_rate: [number, number];
        reply_rate: [number, number];
      };
      trend: string;
    };
    deliverability: {
      score: number;
      risk_level: string;
      contributing_factors: Array<{
        factor: string;
        impact: number;
        direction: string;
      }>;
    };
    anomaly_detection: {
      is_anomaly: boolean;
      anomaly_score: number;
      anomaly_type?: string;
      recommendation?: string;
    };
  };
  generated_at: string;
  model_versions: Record<string, string>;
}

export interface TrainingStats {
  dqn: {
    total_experiences: number;
    training_iterations: number;
    average_loss: number;
    exploration_rate: number;
    last_trained: string;
  };
  lstm: {
    sequences_processed: number;
    prediction_accuracy: number;
    last_trained: string;
  };
  bandits: {
    content_bandit: {
      total_pulls: number;
      arm_stats: Array<{
        arm: number;
        pulls: number;
        reward_rate: number;
      }>;
    };
    timing_bandit: {
      total_pulls: number;
      arm_stats: Array<{
        arm: number;
        pulls: number;
        average_reward: number;
      }>;
    };
  };
  anomaly_detector: {
    samples_fitted: number;
    anomalies_detected: number;
    false_positive_rate: number;
  };
  deliverability_model: {
    samples_trained: number;
    feature_importance: Record<string, number>;
    validation_r2: number;
  };
  overall_health: string;
  last_full_training: string;
}

export interface BanditRecommendation {
  bandit_type: string;
  recommended_arm: number;
  confidence: number;
  arm_probabilities: number[];
  recommendation_reason: string;
  expected_reward: number;
}

export interface AdaptiveSendDecision {
  account_id: string;
  should_send: boolean;
  confidence: number;
  recommended_time?: string;
  throttle_status: {
    is_throttled: boolean;
    throttle_level: number;
    reason?: string;
    resume_time?: string;
  };
  optimization: {
    volume_multiplier: number;
    provider_timing: Record<string, string>;
    content_recommendation: number;
    batch_size: number;
  };
  risk_assessment: {
    reputation_risk: string;
    spam_risk: string;
    deliverability_risk: string;
    overall_risk: string;
  };
  fallback_active: boolean;
  fallback_reason?: string;
}

export interface AdaptiveHealthUpdate {
  account_id: string;
  health_signals: {
    bounce_detected: boolean;
    spam_detected: boolean;
    reputation_drop: boolean;
    engagement_decline: boolean;
  };
  signal_strengths: Record<string, number>;
  recommendations: string[];
}

export interface AdaptiveDashboard {
  timestamp: string;
  system_health: {
    overall_score: number;
    ml_engine_status: string;
    optimizer_status: string;
    adaptive_engine_status: string;
  };
  active_accounts: number;
  total_signals_today: number;
  throttled_accounts: number;
  fallback_active_accounts: number;
  ml_predictions_today: number;
  optimization_adjustments_today: number;
  reputation_alerts: Array<{
    account_id: string;
    alert_type: string;
    severity: string;
    message: string;
    timestamp: string;
  }>;
  top_performing_accounts: Array<{
    account_id: string;
    health_score: number;
    deliverability_score: number;
    trend: string;
  }>;
  learning_progress: {
    dqn_convergence: number;
    bandit_exploration_balance: number;
    anomaly_detection_accuracy: number;
  };
}

export interface OptimizerStatistics {
  time_series: {
    trend: string;
    seasonality_detected: boolean;
    forecast_7d: number[];
    confidence_intervals: Array<[number, number]>;
  };
  provider_stats: Record<string, {
    optimal_hours: number[];
    volume_multiplier: number;
    success_rate: number;
  }>;
  volume_optimization: {
    current_daily_volume: number;
    recommended_daily_volume: number;
    ramp_rate: number;
    volume_ceiling: number;
  };
  load_balancing: {
    active_accounts: number;
    average_load: number;
    max_load_account: string;
    rebalancing_needed: boolean;
  };
}

export interface ProviderPattern {
  provider: string;
  patterns: {
    best_send_hours: number[];
    worst_send_hours: number[];
    best_days: string[];
    avg_open_rate_by_hour: Record<string, number>;
    avg_reply_rate_by_hour: Record<string, number>;
  };
  recommendations: string[];
}

export interface OptimalTiming {
  provider: string;
  optimal_windows: Array<{
    start_hour: number;
    end_hour: number;
    expected_engagement: number;
    confidence: number;
  }>;
  avoid_windows: Array<{
    start_hour: number;
    end_hour: number;
    reason: string;
  }>;
  timezone_adjusted: boolean;
  user_timezone: string;
}

export interface ContentOptimization {
  original_subject?: string;
  original_body?: string;
  optimized: {
    subject_variations: Array<{
      text: string;
      predicted_open_rate: number;
      confidence: number;
    }>;
    body_suggestions: Array<{
      suggestion: string;
      impact: string;
      priority: number;
    }>;
    tone_analysis: {
      current_tone: string;
      recommended_tone: string;
      adjustment_needed: boolean;
    };
    spam_risk: {
      score: number;
      triggers: string[];
      recommendations: string[];
    };
  };
  bandit_recommendation: {
    content_style: number;
    confidence: number;
    historical_performance: number;
  };
}

export interface SystemDiagnostics {
  timestamp: string;
  services: {
    ml_engine: {
      status: string;
      memory_usage_mb: number;
      model_load_times_ms: Record<string, number>;
      prediction_latency_ms: number;
    };
    optimizer: {
      status: string;
      cache_hit_rate: number;
      time_series_data_points: number;
      last_optimization_ms: number;
    };
    adaptive_engine: {
      status: string;
      signal_queue_size: number;
      active_throttles: number;
      fallback_count: number;
    };
  };
  database: {
    connection_pool_size: number;
    active_connections: number;
    avg_query_time_ms: number;
  };
  performance: {
    requests_per_minute: number;
    average_response_time_ms: number;
    error_rate: number;
  };
  recommendations: string[];
}

// ============================================================================
// API Client Class
// ============================================================================

class WarmupAPIClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/warmup-pool`;
  }

  private getHeaders(): HeadersInit {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // =============================================
  // Pool Membership
  // =============================================

  async enroll(request: EnrollRequest = {}): Promise<EnrollResponse> {
    return this.request("/enroll", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async getStatus(): Promise<MemberStatus> {
    return this.request("/status");
  }

  async updateStatus(action: "pause" | "resume", reason?: string): Promise<{ success: boolean; action: string; new_status: string; message: string }> {
    return this.request("/status", {
      method: "POST",
      body: JSON.stringify({ action, reason }),
    });
  }

  async getTiers(): Promise<{ tiers: PoolTier[] }> {
    return this.request("/tiers");
  }

  // =============================================
  // Schedule
  // =============================================

  async getSchedule(): Promise<Schedule> {
    return this.request("/schedule");
  }

  async updateSchedule(updates: Partial<Schedule>): Promise<Schedule> {
    return this.request("/schedule", {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  // =============================================
  // Conversations
  // =============================================

  async scheduleConversations(count: number = 10, category: string = "business"): Promise<{
    success: boolean;
    scheduled_count: number;
    remaining_today: number;
    conversations: Array<{ id: number; receiver_id: number; scheduled_at: string }>;
  }> {
    return this.request("/conversations/schedule", {
      method: "POST",
      body: JSON.stringify({ count, category }),
    });
  }

  async getConversations(statusFilter?: string, limit: number = 20): Promise<{
    conversations: Conversation[];
    total: number;
  }> {
    const params = new URLSearchParams();
    if (statusFilter) params.append("status_filter", statusFilter);
    params.append("limit", limit.toString());
    return this.request(`/conversations?${params}`);
  }

  // =============================================
  // Placement Testing
  // =============================================

  async runPlacementTest(testType: string = "standard", emailsPerProvider: number = 3): Promise<PlacementTest> {
    return this.request("/placement-test", {
      method: "POST",
      body: JSON.stringify({ test_type: testType, emails_per_provider: emailsPerProvider }),
    });
  }

  async getLatestPlacementTest(): Promise<PlacementTest> {
    return this.request("/placement-test/latest");
  }

  async getPlacementTestHistory(days: number = 30): Promise<{
    tests: PlacementTest[];
    trends: Record<string, unknown>;
  }> {
    return this.request(`/placement-test/history?days=${days}`);
  }

  // =============================================
  // Spam Rescue
  // =============================================

  async getSpamStatistics(hours: number = 24): Promise<{
    period_hours: number;
    total_received: number;
    spam_detected: number;
    spam_rescued: number;
    spam_rate: number;
    rescue_rate: number;
    consecutive_spam: number;
    last_spam_at?: string;
    alert_level: string;
  }> {
    return this.request(`/spam/statistics?hours=${hours}`);
  }

  async getSpamRescueHistory(limit: number = 20): Promise<{
    rescues: Array<Record<string, unknown>>;
    total: number;
  }> {
    return this.request(`/spam/history?limit=${limit}`);
  }

  // =============================================
  // Blacklist Monitoring
  // =============================================

  async runBlacklistCheck(ipAddress?: string, domain?: string): Promise<BlacklistStatus> {
    return this.request("/blacklist/check", {
      method: "POST",
      body: JSON.stringify({ ip_address: ipAddress, domain }),
    });
  }

  async getBlacklistStatus(): Promise<BlacklistStatus> {
    return this.request("/blacklist/status");
  }

  async getBlacklistHistory(days: number = 30): Promise<{
    checks: BlacklistStatus[];
    total: number;
  }> {
    return this.request(`/blacklist/history?days=${days}`);
  }

  async getBlacklistInfo(): Promise<Record<string, unknown>> {
    return this.request("/blacklist/info");
  }

  // =============================================
  // Statistics
  // =============================================

  async getPoolStatistics(): Promise<PoolStats> {
    return this.request("/statistics/pool");
  }

  async getMemberStatistics(): Promise<{
    quality_score: number;
    pool_tier: string;
    health_status: string;
    activity: Record<string, unknown>;
    rates: Record<string, number>;
    lifetime: Record<string, number>;
  }> {
    return this.request("/statistics/member");
  }

  async recalculateQualityScore(): Promise<{
    success: boolean;
    old_score: number;
    new_score: number;
    score_change: number;
    old_tier: string;
    new_tier: string;
    tier_changed: boolean;
  }> {
    return this.request("/statistics/recalculate", { method: "POST" });
  }

  // =============================================
  // Dashboard
  // =============================================

  async getDashboard(): Promise<DashboardData> {
    return this.request("/dashboard");
  }

  // =============================================
  // Phase 3: AI Insights
  // =============================================

  async getAIInsights(limit: number = 10, includePredictions: boolean = true): Promise<AIInsightsResponse> {
    const params = new URLSearchParams();
    params.append("limit", limit.toString());
    params.append("include_predictions", includePredictions.toString());
    return this.request(`/ai-insights?${params}`);
  }

  // =============================================
  // Phase 3: Neural Network
  // =============================================

  async getNeuralNetworkStatus(): Promise<NeuralNetworkStatus> {
    return this.request("/neural-network/status");
  }

  // =============================================
  // Phase 3: ML Predictions
  // =============================================

  async getPredictions(timeHorizon: string = "7d", metrics?: string[]): Promise<PredictionsResponse> {
    const params = new URLSearchParams();
    params.append("time_horizon", timeHorizon);
    if (metrics) params.append("metrics", metrics.join(","));
    return this.request(`/predictions?${params}`);
  }

  // =============================================
  // Phase 3: Real-time
  // =============================================

  async getRealtimeStats(): Promise<RealtimeStats> {
    return this.request("/realtime/stats");
  }

  connectToRealtimeEvents(
    onEvent: (event: Record<string, unknown>) => void,
    onError?: (error: Error) => void
  ): EventSource | null {
    if (typeof window === "undefined") return null;

    const token = localStorage.getItem("token");
    const eventSource = new EventSource(
      `${this.baseUrl}/realtime/events?token=${token}`
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onEvent(data);
      } catch (e) {
        console.error("[WarmupAPI] Failed to parse event:", e);
      }
    };

    eventSource.onerror = (error) => {
      console.error("[WarmupAPI] SSE error:", error);
      onError?.(new Error("SSE connection error"));
    };

    return eventSource;
  }

  // =============================================
  // Phase 3: Enrollment
  // =============================================

  async verifyDNS(request: DNSVerificationRequest): Promise<DNSVerificationResponse> {
    return this.request("/enrollment/verify-dns", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async getPresets(): Promise<{
    presets: WarmupPreset[];
    custom_ranges: Record<string, { min: number; max: number; default: number }>;
  }> {
    return this.request("/enrollment/presets");
  }

  // =============================================
  // Phase 4: ML/DL Engine
  // =============================================

  private advancedBaseUrl = `${API_BASE_URL}/warmup-advanced`;

  private async advancedRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.advancedBaseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get ML predictions for an account using DQN, LSTM, and ensemble models
   */
  async getMLPredictions(request: MLPredictionRequest): Promise<MLPredictionResponse> {
    return this.advancedRequest("/ml/predict", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  /**
   * Get training statistics for all ML models
   */
  async getTrainingStats(): Promise<TrainingStats> {
    return this.advancedRequest("/ml/training-stats");
  }

  /**
   * Update bandit with reward feedback (for online learning)
   */
  async updateBandit(
    banditType: "content" | "timing",
    arm: number,
    reward: number
  ): Promise<{ success: boolean; bandit_type: string; arm: number; new_stats: Record<string, unknown> }> {
    return this.advancedRequest("/ml/bandit/update", {
      method: "POST",
      body: JSON.stringify({ bandit_type: banditType, arm, reward }),
    });
  }

  /**
   * Get bandit recommendation for content or timing
   */
  async getBanditRecommendation(banditType: "content" | "timing"): Promise<BanditRecommendation> {
    return this.advancedRequest(`/ml/bandit/recommend?bandit_type=${banditType}`);
  }

  // =============================================
  // Phase 4: Adaptive Engine
  // =============================================

  /**
   * Get adaptive send decision with throttling and risk assessment
   */
  async getAdaptiveSendDecision(
    accountId: string,
    provider?: string,
    currentHealth?: number
  ): Promise<AdaptiveSendDecision> {
    const params = new URLSearchParams({ account_id: accountId });
    if (provider) params.append("provider", provider);
    if (currentHealth !== undefined) params.append("current_health", currentHealth.toString());
    return this.advancedRequest(`/adaptive/send-decision?${params}`);
  }

  /**
   * Emit a signal to the adaptive engine (bounce, spam, engagement, etc.)
   */
  async emitAdaptiveSignal(
    accountId: string,
    signalType: string,
    signalValue: number,
    metadata?: Record<string, unknown>
  ): Promise<{ success: boolean; signal_processed: boolean; actions_triggered: string[] }> {
    return this.advancedRequest("/adaptive/emit-signal", {
      method: "POST",
      body: JSON.stringify({
        account_id: accountId,
        signal_type: signalType,
        signal_value: signalValue,
        metadata,
      }),
    });
  }

  /**
   * Update account health and get recommendations
   */
  async updateAdaptiveHealth(
    accountId: string,
    healthMetrics: Record<string, number>
  ): Promise<AdaptiveHealthUpdate> {
    return this.advancedRequest("/adaptive/health-update", {
      method: "POST",
      body: JSON.stringify({ account_id: accountId, health_metrics: healthMetrics }),
    });
  }

  /**
   * Get the adaptive engine dashboard with system health and alerts
   */
  async getAdaptiveDashboard(): Promise<AdaptiveDashboard> {
    return this.advancedRequest("/adaptive/dashboard");
  }

  /**
   * Apply manual override to adaptive engine (emergency controls)
   */
  async applyAdaptiveOverride(
    accountId: string,
    overrideType: "pause" | "resume" | "throttle" | "boost",
    duration?: number,
    reason?: string
  ): Promise<{ success: boolean; override_applied: string; expires_at?: string }> {
    return this.advancedRequest("/adaptive/override", {
      method: "POST",
      body: JSON.stringify({
        account_id: accountId,
        override_type: overrideType,
        duration_minutes: duration,
        reason,
      }),
    });
  }

  // =============================================
  // Phase 4: Optimizer
  // =============================================

  /**
   * Get optimizer statistics including time series analysis
   */
  async getOptimizerStatistics(): Promise<OptimizerStatistics> {
    return this.advancedRequest("/optimizer/statistics");
  }

  /**
   * Get provider-specific patterns and recommendations
   */
  async getProviderPatterns(provider?: string): Promise<{ patterns: ProviderPattern[] }> {
    const params = provider ? `?provider=${provider}` : "";
    return this.advancedRequest(`/optimizer/patterns${params}`);
  }

  /**
   * Get optimal timing windows for a provider
   */
  async getOptimalTiming(provider: string, timezone?: string): Promise<OptimalTiming> {
    const params = new URLSearchParams({ provider });
    if (timezone) params.append("timezone", timezone);
    return this.advancedRequest(`/optimizer/timing?${params}`);
  }

  // =============================================
  // Phase 4: Content Optimization
  // =============================================

  /**
   * Optimize email content using ML models
   */
  async optimizeContent(
    subject?: string,
    body?: string,
    targetProvider?: string
  ): Promise<ContentOptimization> {
    return this.advancedRequest("/content/optimize", {
      method: "POST",
      body: JSON.stringify({ subject, body, target_provider: targetProvider }),
    });
  }

  // =============================================
  // Phase 4: Real-time Adaptive Events (SSE)
  // =============================================

  /**
   * Connect to real-time adaptive events stream
   */
  connectToAdaptiveEvents(
    onEvent: (event: {
      type: string;
      data: Record<string, unknown>;
      timestamp: string;
    }) => void,
    onError?: (error: Error) => void
  ): EventSource | null {
    if (typeof window === "undefined") return null;

    const token = localStorage.getItem("token");
    const eventSource = new EventSource(
      `${this.advancedBaseUrl}/realtime/adaptive-events?token=${token}`
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onEvent(data);
      } catch (e) {
        console.error("[WarmupAPI] Failed to parse adaptive event:", e);
      }
    };

    eventSource.onerror = (error) => {
      console.error("[WarmupAPI] Adaptive SSE error:", error);
      onError?.(new Error("Adaptive SSE connection error"));
    };

    return eventSource;
  }

  // =============================================
  // Phase 4: Model Management
  // =============================================

  /**
   * Export ML model state for backup/transfer
   */
  async exportMLModels(): Promise<{
    export_id: string;
    models: Record<string, unknown>;
    exported_at: string;
    checksum: string;
  }> {
    return this.advancedRequest("/ml/export");
  }

  /**
   * Import ML model state
   */
  async importMLModels(modelData: Record<string, unknown>): Promise<{
    success: boolean;
    models_imported: string[];
    warnings: string[];
  }> {
    return this.advancedRequest("/ml/import", {
      method: "POST",
      body: JSON.stringify(modelData),
    });
  }

  // =============================================
  // Phase 4: Health & Diagnostics
  // =============================================

  /**
   * Get advanced system health status
   */
  async getAdvancedHealth(): Promise<{
    status: string;
    ml_engine: string;
    optimizer: string;
    adaptive_engine: string;
    uptime_seconds: number;
    last_health_check: string;
  }> {
    return this.advancedRequest("/health");
  }

  /**
   * Get detailed system diagnostics
   */
  async getDiagnostics(): Promise<SystemDiagnostics> {
    return this.advancedRequest("/diagnostics");
  }

  // =============================================
  // Phase 5: Orchestration API
  // =============================================

  private orchestrationBaseUrl = `${API_BASE_URL}/warmup-orchestration`;

  private async orchestrationRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.orchestrationBaseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // =============================================
  // Phase 5: Campaign Management
  // =============================================

  /**
   * Create a new warmup campaign
   */
  async createCampaign(request: {
    name?: string;
    template?: string;
    target_volume?: number;
    description?: string;
    tags?: string[];
  }): Promise<{ success: boolean; campaign: Campaign; message: string }> {
    return this.orchestrationRequest("/campaigns", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  /**
   * List all campaigns
   */
  async listCampaigns(statusFilter?: string): Promise<{ campaigns: Campaign[]; total: number }> {
    const params = statusFilter ? `?status_filter=${statusFilter}` : "";
    return this.orchestrationRequest(`/campaigns${params}`);
  }

  /**
   * Get campaign details
   */
  async getCampaign(campaignId: string): Promise<{ campaign: Campaign; health: CampaignHealth }> {
    return this.orchestrationRequest(`/campaigns/${campaignId}`);
  }

  /**
   * Perform campaign action
   */
  async campaignAction(
    campaignId: string,
    action: "start" | "pause" | "resume" | "complete" | "cancel" | "advance_stage",
    reason?: string,
    force?: boolean
  ): Promise<{ success: boolean; campaign: Campaign; message: string }> {
    return this.orchestrationRequest(`/campaigns/${campaignId}/action`, {
      method: "POST",
      body: JSON.stringify({ action, reason, force }),
    });
  }

  /**
   * Update campaign metrics
   */
  async updateCampaignMetrics(
    campaignId: string,
    metrics: CampaignMetricsUpdate
  ): Promise<{ success: boolean; campaign: Campaign; actions_triggered: unknown[] }> {
    return this.orchestrationRequest(`/campaigns/${campaignId}/metrics`, {
      method: "POST",
      body: JSON.stringify(metrics),
    });
  }

  /**
   * Delete a campaign
   */
  async deleteCampaign(campaignId: string): Promise<{ success: boolean; message: string }> {
    return this.orchestrationRequest(`/campaigns/${campaignId}`, {
      method: "DELETE",
    });
  }

  /**
   * List campaign templates
   */
  async listCampaignTemplates(): Promise<{ templates: CampaignTemplate[] }> {
    return this.orchestrationRequest("/campaigns/templates/list");
  }

  // =============================================
  // Phase 5: A/B Testing
  // =============================================

  /**
   * Create a new A/B test
   */
  async createABTest(request: CreateABTestRequest): Promise<{ success: boolean; test: ABTest; message: string }> {
    return this.orchestrationRequest("/ab-tests", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  /**
   * List all A/B tests
   */
  async listABTests(statusFilter?: string): Promise<{ tests: ABTest[]; total: number }> {
    const params = statusFilter ? `?status_filter=${statusFilter}` : "";
    return this.orchestrationRequest(`/ab-tests${params}`);
  }

  /**
   * Get A/B test details with analysis
   */
  async getABTest(testId: string): Promise<{ test: ABTest; analysis: ABTestAnalysis }> {
    return this.orchestrationRequest(`/ab-tests/${testId}`);
  }

  /**
   * Start an A/B test
   */
  async startABTest(testId: string): Promise<{ success: boolean; test: ABTest; message: string }> {
    return this.orchestrationRequest(`/ab-tests/${testId}/start`, { method: "POST" });
  }

  /**
   * Pause an A/B test
   */
  async pauseABTest(testId: string): Promise<{ success: boolean; test: ABTest; message: string }> {
    return this.orchestrationRequest(`/ab-tests/${testId}/pause`, { method: "POST" });
  }

  /**
   * Complete an A/B test
   */
  async completeABTest(
    testId: string,
    winnerId?: string
  ): Promise<{ success: boolean; test: ABTest; message: string; conclusion: string }> {
    const params = winnerId ? `?winner_id=${winnerId}` : "";
    return this.orchestrationRequest(`/ab-tests/${testId}/complete${params}`, { method: "POST" });
  }

  /**
   * Get variant assignment
   */
  async assignVariant(testId: string): Promise<{ variant_id: string; variant_name: string; config: Record<string, unknown> }> {
    return this.orchestrationRequest(`/ab-tests/${testId}/assign`);
  }

  /**
   * Record test result
   */
  async recordTestResult(
    testId: string,
    variantId: string,
    converted: boolean,
    segmentIds?: string[]
  ): Promise<{ success: boolean; test: ABTest | null }> {
    return this.orchestrationRequest(`/ab-tests/${testId}/record`, {
      method: "POST",
      body: JSON.stringify({ variant_id: variantId, converted, segment_ids: segmentIds || [] }),
    });
  }

  // =============================================
  // Phase 5: Analytics
  // =============================================

  /**
   * Record a metric
   */
  async recordAnalyticsMetric(
    metricId: string,
    value: number,
    timestamp?: string,
    metadata?: Record<string, unknown>
  ): Promise<{ success: boolean; message: string }> {
    return this.orchestrationRequest("/analytics/metrics", {
      method: "POST",
      body: JSON.stringify({ metric_id: metricId, value, timestamp, metadata }),
    });
  }

  /**
   * Record multiple metrics
   */
  async recordBulkMetrics(
    metrics: Record<string, number>,
    timestamp?: string
  ): Promise<{ success: boolean; message: string }> {
    return this.orchestrationRequest("/analytics/metrics/bulk", {
      method: "POST",
      body: JSON.stringify({ metrics, timestamp }),
    });
  }

  /**
   * Get KPI snapshot
   */
  async getKPISnapshot(): Promise<{ snapshot: KPISnapshot }> {
    return this.orchestrationRequest("/analytics/kpi");
  }

  /**
   * Get time series data
   */
  async getTimeSeries(
    metricId: string,
    startDate?: string,
    endDate?: string,
    granularity?: "hourly" | "daily" | "weekly" | "monthly"
  ): Promise<{ metric_id: string; granularity: string; data: TimeSeriesData[] }> {
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    if (granularity) params.append("granularity", granularity);
    return this.orchestrationRequest(`/analytics/time-series/${metricId}?${params}`);
  }

  /**
   * Get benchmarks
   */
  async getBenchmarks(): Promise<{ benchmarks: Benchmark[] }> {
    return this.orchestrationRequest("/analytics/benchmarks");
  }

  /**
   * Get funnel analysis
   */
  async getFunnelAnalysis(): Promise<{ funnel: FunnelAnalysis }> {
    return this.orchestrationRequest("/analytics/funnel");
  }

  /**
   * Get analytics alerts
   */
  async getAnalyticsAlerts(
    severity?: string,
    acknowledged?: boolean
  ): Promise<{ alerts: AnalyticsAlert[]; total: number }> {
    const params = new URLSearchParams();
    if (severity) params.append("severity", severity);
    if (acknowledged !== undefined) params.append("acknowledged", String(acknowledged));
    return this.orchestrationRequest(`/analytics/alerts?${params}`);
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string): Promise<{ success: boolean; message: string }> {
    return this.orchestrationRequest(`/analytics/alerts/${alertId}/acknowledge`, { method: "POST" });
  }

  /**
   * Generate analytics report
   */
  async generateReport(
    periodDays?: number,
    name?: string
  ): Promise<{ report: AnalyticsReport }> {
    const params = new URLSearchParams();
    if (periodDays) params.append("period_days", String(periodDays));
    if (name) params.append("name", name);
    return this.orchestrationRequest(`/analytics/reports/generate?${params}`, { method: "POST" });
  }

  /**
   * Get orchestration dashboard
   */
  async getOrchestrationDashboard(): Promise<OrchestrationDashboard> {
    return this.orchestrationRequest("/dashboard/overview");
  }

  /**
   * Get Phase 5 health
   */
  async getPhase5Health(): Promise<{
    status: string;
    phase: number;
    services: Record<string, string>;
    statistics: Record<string, number>;
    timestamp: string;
  }> {
    return this.orchestrationRequest("/health");
  }
}

// ============================================================================
// Phase 5: Additional Types
// ============================================================================

export interface Campaign {
  id: string;
  name: string;
  description: string;
  account_id: string;
  goal: string;
  status: string;
  stages: CampaignStage[];
  milestones: CampaignMilestone[];
  current_stage_id: string | null;
  current_stage: CampaignStage | null;
  metrics: CampaignMetrics;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  days_in_current_stage: number;
  total_days_running: number;
  progress_percentage: number;
  target_inbox_rate: number;
  target_daily_volume: number;
  current_daily_volume: number;
  tags: string[];
}

export interface CampaignStage {
  id: string;
  name: string;
  stage_type: string;
  duration_days: number;
  target_volume: number;
  volume_increment: number;
  next_stage_id: string | null;
}

export interface CampaignMilestone {
  id: string;
  name: string;
  description: string;
  target_metric: string;
  target_value: number;
  achieved: boolean;
  achieved_at: string | null;
  reward_points: number;
}

export interface CampaignMetrics {
  emails_sent: number;
  emails_received: number;
  opens: number;
  replies: number;
  bounces: number;
  spam_reports: number;
  open_rate: number;
  reply_rate: number;
  bounce_rate: number;
  spam_rate: number;
  inbox_rate: number;
  health_score: number;
}

export interface CampaignHealth {
  campaign_id: string;
  status: string;
  health_score: number;
  progress_percentage: number;
  current_stage: string | null;
  days_running: number;
  recommendations: string[];
  risks: Array<{ level: string; type: string; message: string; metric: number }>;
}

export interface CampaignMetricsUpdate {
  emails_sent?: number;
  emails_received?: number;
  opens?: number;
  replies?: number;
  bounces?: number;
  spam_reports?: number;
  inbox_placements?: number;
  spam_placements?: number;
}

export interface CampaignTemplate {
  id: string;
  name: string;
  description: string;
  stages: number;
  estimated_duration: string;
  recommended_for: string[];
}

export interface ABTest {
  id: string;
  name: string;
  description: string;
  test_type: string;
  metric: string;
  allocation_strategy: string;
  variants: ABTestVariant[];
  status: string;
  min_sample_size: number;
  max_sample_size: number;
  confidence_level: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  winner_id: string | null;
  conclusion: string | null;
  total_impressions: number;
  is_significant: boolean;
  required_sample_size: number;
}

export interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  config: Record<string, unknown>;
  weight: number;
  impressions: number;
  conversions: number;
  conversion_rate: number;
  confidence_interval: { lower: number; upper: number };
}

export interface ABTestAnalysis {
  test_id: string;
  status: string;
  total_impressions: number;
  required_sample_size: number;
  progress_percentage: number;
  frequentist: {
    z_score: number;
    p_value: number;
    is_significant: boolean;
    confidence_level: number;
  };
  bayesian: {
    probability_b_better: number;
    probability_a_better: number;
  };
  sequential: {
    decision: string;
    reason: string;
    p_value?: number;
    winner?: string;
  };
  lift: {
    relative: number;
    absolute: number;
  };
  recommendation: string;
}

export interface CreateABTestRequest {
  name: string;
  test_type: string;
  metric: string;
  variants: Array<{
    name: string;
    description?: string;
    config?: Record<string, unknown>;
    weight?: number;
  }>;
  allocation_strategy?: string;
  min_sample_size?: number;
  max_sample_size?: number;
  confidence_level?: number;
  early_stopping_enabled?: boolean;
}

export interface KPISnapshot {
  timestamp: string;
  metrics: Record<string, number>;
  trends: Record<string, string>;
  anomalies: string[];
  score: number;
}

export interface TimeSeriesData {
  period: string;
  value: number;
  count: number;
}

export interface Benchmark {
  metric_id: string;
  your_value: number;
  industry_average: number;
  industry_top_10: number;
  industry_bottom_10: number;
  percentile: number;
}

export interface FunnelAnalysis {
  funnel_id: string;
  name: string;
  stages: Array<{
    name: string;
    count: number;
    conversion_rate: number;
  }>;
  overall_conversion: number;
  bottleneck_stage: string;
  recommendations: string[];
}

export interface AnalyticsAlert {
  id: string;
  severity: string;
  metric_id: string;
  message: string;
  current_value: number;
  threshold: number;
  created_at: string;
  acknowledged: boolean;
}

export interface AnalyticsReport {
  id: string;
  name: string;
  period_start: string;
  period_end: string;
  generated_at: string;
  kpi_snapshot: KPISnapshot;
  benchmarks: Benchmark[];
  alerts: AnalyticsAlert[];
  executive_summary: string;
  detailed_insights: string[];
  recommendations: string[];
}

export interface OrchestrationDashboard {
  timestamp: string;
  summary: {
    total_campaigns: number;
    active_campaigns: number;
    total_ab_tests: number;
    active_ab_tests: number;
    health_score: number;
    unacknowledged_alerts: number;
  };
  campaigns: Campaign[];
  ab_tests: ABTest[];
  kpi: KPISnapshot;
  alerts: AnalyticsAlert[];
  benchmarks: Benchmark[];
  statistics: {
    orchestrator: Record<string, unknown>;
    ab_testing: Record<string, unknown>;
    analytics: Record<string, unknown>;
  };
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const warmupAPI = new WarmupAPIClient();
export default warmupAPI;
