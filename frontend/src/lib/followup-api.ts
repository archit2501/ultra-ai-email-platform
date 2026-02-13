/**
 * Follow-Up AI Copilot API
 *
 * Frontend API client for the ULTRA Follow-Up System V2.0
 * Provides AI-powered sequence generation, email content, and optimization
 */

import axios, { AxiosError } from "axios";

// Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// Types
export interface CopilotContext {
  company_name?: string;
  position?: string;
  industry?: string;
  original_subject?: string;
  original_body?: string;
}

export interface GenerateSequenceRequest {
  user_request: string;
  num_steps?: number;
  default_tone?: string;
  context?: CopilotContext;
}

export interface GenerateEmailRequest {
  step_number: number;
  strategy?: string;
  tone?: string;
  context?: CopilotContext;
  previous_emails?: Array<{ subject: string; body: string }>;
}

export interface SuggestImprovementsRequest {
  sequence_id: number;
}

export interface GenerateABVariantsRequest {
  original_subject: string;
  original_body: string;
  num_variants?: number;
}

export interface SequenceStep {
  id?: number;
  step_number: number;
  delay_days: number;
  delay_hours?: number;
  strategy: string;
  tone: string;
  subject_template?: string;
  body_template?: string;
  subject?: string;
  body?: string;
  generation_hints?: Record<string, any>;
  include_original_context?: boolean;
  include_value_proposition?: boolean;
  include_portfolio_link?: boolean;
  include_call_to_action?: boolean;
}

export interface Sequence {
  id: number;
  candidate_id: number;
  name: string;
  description?: string;
  status: string;
  is_system_preset: boolean;
  stop_on_reply: boolean;
  stop_on_bounce: boolean;
  use_threading: boolean;
  respect_business_hours: boolean;
  business_hours_start: number;
  business_hours_end: number;
  include_candidate_links: boolean;
  include_portfolio: boolean;
  include_signature: boolean;
  custom_signature?: string;
  preferred_send_hour: number;
  preferred_timezone: string;
  times_used: number;
  total_campaigns: number;
  successful_replies: number;
  reply_rate: number;
  has_branches?: boolean;
  ai_copilot_generated?: boolean;
  ai_generation_prompt?: string;
  performance_score?: number;
  created_at: string;
  updated_at?: string;
  steps: SequenceStep[];
}

export interface AIMetadata {
  model_used: string;
  tokens_used: number;
  generation_time_ms?: number;
  quality_score?: number;
  personalization_score?: number;
}

export interface GeneratedEmail {
  subject: string;
  body: string;
  html?: string;
  spintax_subject?: string;
  spintax_body?: string;
}

export interface SequenceSuggestion {
  type: string;
  priority: string;
  title: string;
  description: string;
  current_value?: string;
  suggested_value?: string;
  expected_improvement?: string;
}

export interface ABVariant {
  subject: string;
  body: string;
  predicted_open_rate?: number;
  variant_type?: string;
}

export interface CopilotStatus {
  available: boolean;
  model?: string;
  features: {
    sequence_generation: boolean;
    email_generation: boolean;
    improvement_suggestions: boolean;
    ab_variant_generation: boolean;
    spintax_support: boolean;
  };
  error?: string;
}

// Response types
export interface GenerateSequenceResponse {
  success: boolean;
  sequence: Sequence;
  ai_metadata: AIMetadata;
}

export interface GenerateEmailResponse {
  success: boolean;
  email: GeneratedEmail;
  ai_metadata: AIMetadata;
}

export interface SuggestImprovementsResponse {
  success: boolean;
  sequence_id: number;
  sequence_name: string;
  suggestions: SequenceSuggestion[];
}

export interface GenerateABVariantsResponse {
  success: boolean;
  original: {
    subject: string;
    body: string;
  };
  variants: ABVariant[];
}

export interface ListSequencesResponse {
  items: Sequence[];
  count: number;
}

// API Error handling
class FollowUpAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: any
  ) {
    super(message);
    this.name = "FollowUpAPIError";
  }

  static fromAxiosError(error: AxiosError): FollowUpAPIError {
    const status = error.response?.status || 0;
    const data = error.response?.data as any;
    const message = data?.detail || error.message || "Unknown error";
    return new FollowUpAPIError(message, status, data);
  }
}

// Create axios instance
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/follow-up`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor for logging
apiClient.interceptors.request.use((config) => {
  console.log(`[FollowUp API] ${config.method?.toUpperCase()} ${config.url}`, {
    params: config.params,
    data: config.data,
  });
  return config;
});

// Response interceptor for logging
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[FollowUp API] Response ${response.status}`, response.data);
    return response;
  },
  (error: AxiosError) => {
    console.error(`[FollowUp API] Error ${error.response?.status}`, error.response?.data);
    throw FollowUpAPIError.fromAxiosError(error);
  }
);

/**
 * Follow-Up Sequences API
 */
export const followUpAPI = {
  /**
   * List all sequences for the current user
   */
  async listSequences(includePresets: boolean = true): Promise<ListSequencesResponse> {
    const response = await apiClient.get<ListSequencesResponse>("/sequences", {
      params: { include_presets: includePresets },
    });
    return response.data;
  },
};

/**
 * AI Copilot API
 */
export const followUpCopilotAPI = {
  /**
   * Check if AI Copilot is available
   */
  async getStatus(): Promise<CopilotStatus> {
    const response = await apiClient.get<CopilotStatus>("/copilot/status");
    return response.data;
  },

  /**
   * Generate a complete follow-up sequence using AI
   */
  async generateSequence(request: GenerateSequenceRequest): Promise<GenerateSequenceResponse> {
    const response = await apiClient.post<GenerateSequenceResponse>(
      "/copilot/generate-sequence",
      request
    );
    return response.data;
  },

  /**
   * Generate a single follow-up email using AI
   */
  async generateEmail(request: GenerateEmailRequest): Promise<GenerateEmailResponse> {
    const response = await apiClient.post<GenerateEmailResponse>(
      "/copilot/generate-email",
      request
    );
    return response.data;
  },

  /**
   * Get AI-powered improvement suggestions for a sequence
   */
  async suggestImprovements(request: SuggestImprovementsRequest): Promise<SuggestImprovementsResponse> {
    const response = await apiClient.post<SuggestImprovementsResponse>(
      "/copilot/suggest-improvements",
      request
    );
    return response.data;
  },

  /**
   * Generate A/B test variants for an email
   */
  async generateABVariants(request: GenerateABVariantsRequest): Promise<GenerateABVariantsResponse> {
    const response = await apiClient.post<GenerateABVariantsResponse>(
      "/copilot/generate-ab-variants",
      request
    );
    return response.data;
  },
};

// Export default for convenience
export default {
  ...followUpAPI,
  copilot: followUpCopilotAPI,
};
