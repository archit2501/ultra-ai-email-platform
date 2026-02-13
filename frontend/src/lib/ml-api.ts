/**
 * ML Analytics API
 *
 * Frontend API client for the ULTRA Follow-Up System V2.0 - Sprint 2
 * Provides ML-powered reply prediction, send time optimization, and insights
 */

import axios, { AxiosError } from "axios";

// Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// ============= TYPES =============

export interface ReplyPrediction {
  campaign_id: number;
  probability: number;
  probability_percent: string;
  confidence: "high" | "medium" | "low";
  priority_score: number;
  recommended_action: string;
  top_factors: Record<string, number>;
  is_ml_prediction: boolean;
  model_version: string;
}

export interface BatchPrediction {
  campaign_id: number;
  application_id: number;
  probability: number;
  probability_percent: string;
  confidence: "high" | "medium" | "low";
  priority_score: number;
  recommended_action: string;
  status: string;
  current_step: number;
  next_send_date: string | null;
}

export interface BatchPredictionResponse {
  campaigns: BatchPrediction[];
  total: number;
}

export interface SendTimeRecommendation {
  recommended_day: number;
  recommended_day_name: string;
  recommended_hour: number;
  confidence: "high" | "medium" | "low";
  expected_boost: number;
  data_source: string;
  sample_size: number;
}

export interface HeatmapData {
  heatmap: Record<string, Record<string, number>>;
  best_day: number;
  best_day_name: string;
  best_hour: number;
  confidence: "high" | "medium" | "low";
  data_source: string;
  sample_size: number;
  expected_boost: number;
}

export interface AccuracyStats {
  total_predictions: number;
  evaluated_predictions: number;
  accurate_predictions: number;
  overall_accuracy: number;
  overall_accuracy_percent: string;
  accuracy_by_confidence: Record<string, {
    total: number;
    evaluated: number;
    accurate: number;
    accuracy: number;
  }>;
  avg_probability_when_replied: number;
  avg_probability_when_not_replied: number;
}

export interface MLInsights {
  accuracy_stats: {
    total_predictions: number;
    evaluated: number;
    accurate: number;
    overall_accuracy_percent: string;
    by_confidence: Record<string, {
      total: number;
      evaluated: number;
      accurate: number;
      accuracy: number;
    }>;
  };
  top_campaigns: Array<{
    campaign_id: number;
    application_id: number;
    probability_percent: string;
    priority_score: number;
    confidence: string;
    recommended_action: string;
  }>;
  send_time_recommendation: {
    day: number;
    day_name: string;
    hour: number;
    time_display: string;
    confidence: string;
    expected_boost: string;
    data_source: string;
    sample_size: number;
  };
  model_status: {
    trained: boolean;
    last_trained: string | null;
    version: string;
    using_ml: boolean;
    fallback_mode: string | null;
  };
}

export interface TrainingResult {
  success: boolean;
  message: string;
  samples_used: number;
  positive_samples: number;
  negative_samples: number;
  validation_accuracy?: number;
  validation_precision?: number;
  validation_recall?: number;
  training_time_ms?: number;
  model_version?: string;
}

// ============= API FUNCTIONS =============

/**
 * Get auth header from localStorage
 */
function getAuthHeader(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Predict reply probability for a single campaign
 */
export async function predictReply(
  campaignId: number,
  storePrediction: boolean = true
): Promise<ReplyPrediction> {
  const response = await axios.post<ReplyPrediction>(
    `${API_BASE_URL}/ml/predict-reply`,
    {
      campaign_id: campaignId,
      store_prediction: storePrediction,
    },
    { headers: getAuthHeader() }
  );
  return response.data;
}

/**
 * Predict reply probability for multiple campaigns
 */
export async function predictBatch(
  campaignIds?: number[],
  limit: number = 50
): Promise<BatchPredictionResponse> {
  const response = await axios.post<BatchPredictionResponse>(
    `${API_BASE_URL}/ml/predict-batch`,
    {
      campaign_ids: campaignIds,
      limit,
    },
    { headers: getAuthHeader() }
  );
  return response.data;
}

/**
 * Get optimal send time recommendation
 */
export async function getOptimalSendTime(options?: {
  recipientDomain?: string;
  recipientIndustry?: string;
  recipientTimezone?: string;
}): Promise<SendTimeRecommendation> {
  const response = await axios.post<SendTimeRecommendation>(
    `${API_BASE_URL}/ml/optimal-send-time`,
    {
      recipient_domain: options?.recipientDomain,
      recipient_industry: options?.recipientIndustry,
      recipient_timezone: options?.recipientTimezone || "UTC",
    },
    { headers: getAuthHeader() }
  );
  return response.data;
}

/**
 * Get send time heatmap data
 */
export async function getSendTimeHeatmap(
  recipientDomain?: string
): Promise<HeatmapData> {
  const params = recipientDomain ? { recipient_domain: recipientDomain } : {};
  const response = await axios.get<HeatmapData>(
    `${API_BASE_URL}/ml/send-time-heatmap`,
    {
      headers: getAuthHeader(),
      params,
    }
  );
  return response.data;
}

/**
 * Get prediction accuracy statistics
 */
export async function getAccuracyStats(): Promise<AccuracyStats> {
  const response = await axios.get<AccuracyStats>(
    `${API_BASE_URL}/ml/accuracy-stats`,
    { headers: getAuthHeader() }
  );
  return response.data;
}

/**
 * Get unified ML insights for dashboard
 */
export async function getMLInsights(): Promise<MLInsights> {
  const response = await axios.get<MLInsights>(
    `${API_BASE_URL}/ml/ml-insights`,
    { headers: getAuthHeader() }
  );
  return response.data;
}

/**
 * Trigger model training
 */
export async function trainModel(
  lookbackDays: number = 90
): Promise<TrainingResult> {
  const response = await axios.post<TrainingResult>(
    `${API_BASE_URL}/ml/train-model`,
    { lookback_days: lookbackDays },
    { headers: getAuthHeader() }
  );
  return response.data;
}

/**
 * Update prediction accuracy from campaign outcomes
 */
export async function updateAccuracy(): Promise<{ success: boolean; predictions_updated: number }> {
  const response = await axios.post(
    `${API_BASE_URL}/ml/update-accuracy`,
    {},
    { headers: getAuthHeader() }
  );
  return response.data;
}

/**
 * Update send time analytics
 */
export async function updateSendTimeAnalytics(): Promise<{ success: boolean; analytics_records_updated: number }> {
  const response = await axios.post(
    `${API_BASE_URL}/ml/update-send-time-analytics`,
    {},
    { headers: getAuthHeader() }
  );
  return response.data;
}

// ============= HELPER FUNCTIONS =============

/**
 * Get confidence color for badges
 */
export function getConfidenceColor(confidence: string): string {
  switch (confidence.toLowerCase()) {
    case "high":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "medium":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "low":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
  }
}

/**
 * Get recommended action display text
 */
export function getActionDisplay(action: string): { text: string; color: string } {
  switch (action) {
    case "prioritize_send":
      return { text: "Prioritize Send", color: "text-green-600" };
    case "send_at_optimal_time":
      return { text: "Send at Optimal Time", color: "text-blue-600" };
    case "consider_different_approach":
      return { text: "Consider Different Approach", color: "text-yellow-600" };
    case "review_campaign_strategy":
      return { text: "Review Strategy", color: "text-red-600" };
    default:
      return { text: action, color: "text-gray-600" };
  }
}

/**
 * Get heatmap cell color based on score
 */
export function getHeatmapColor(score: number): string {
  if (score >= 0.7) return "bg-green-500";
  if (score >= 0.5) return "bg-green-400";
  if (score >= 0.3) return "bg-yellow-400";
  if (score >= 0.15) return "bg-orange-400";
  if (score > 0) return "bg-red-400";
  return "bg-gray-200 dark:bg-gray-700";
}
