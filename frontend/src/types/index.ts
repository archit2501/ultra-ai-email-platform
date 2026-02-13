// ============================================
// Campaign Workflow Types
// ============================================

export interface CampaignRecipient {
  id?: number;
  email: string;
  name?: string;
  company?: string;
  position?: string;
  linkedinUrl?: string;
  website?: string;
}

// ============================================
// User & Authentication Types
// ============================================

export type UserRole = "super_admin" | "pragya" | "aniruddh";

export interface NotificationSettings {
  email_responses: boolean;
  email_opens: boolean;
  daily_digest: boolean;
  weekly_summary: boolean;
  interview_reminders: boolean;
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  email_account?: string;
  title?: string;
  is_active: boolean;
  notification_settings?: NotificationSettings;
  created_at?: string;
  updated_at?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

// ============================================
// Application Types
// ============================================

export type ApplicationStatus =
  | "draft"
  | "sent"
  | "opened"
  | "responded"
  | "replied"
  | "interview"
  | "waiting"
  | "offer"
  | "rejected"
  | "accepted"
  | "declined";

export type ApplicationType = "initial" | "follow_up" | "reapplication" | "referral";

export interface Application {
  id: number;
  candidate_id?: number;
  company_id?: number;
  company_name?: string;
  resume_version_id?: number;
  email_template_id?: number;

  // Recruiter info
  recruiter_name?: string;
  recruiter_email: string;
  recruiter_country?: string;
  recruiter_language?: string;

  // Position info
  position_title?: string;
  position_level?: string;
  position_country?: string;
  position_language?: string;
  job_posting_url?: string;

  // Email content
  email_subject?: string;
  email_body_html?: string;
  alignment_text?: string;
  alignment_score?: number;

  // Status & tracking
  status: ApplicationStatus;
  application_type?: ApplicationType;
  tracking_id?: string;

  // Timestamps
  sent_at?: string;
  opened_at?: string;
  replied_at?: string;
  created_at: string;
  updated_at?: string;

  // Interview details
  interview_date?: string;
  interview_type?: string;
  interview_notes?: string;

  // Metadata
  notes?: string;
  tags?: string;
  priority?: number;
}

// ============================================
// Recipient Groups Types
// ============================================

export type GroupType = "static" | "dynamic";
export type CampaignStatus = "draft" | "scheduled" | "sending" | "completed" | "failed" | "paused" | "cancelled";
export type RecipientStatus = "pending" | "sent" | "failed" | "opened" | "replied" | "bounced" | "unsubscribed";

export interface Recipient {
  id: number;
  candidate_id: number;
  email: string;
  name?: string;
  company?: string;
  position?: string;
  country?: string;
  language?: string;
  tags?: string;
  custom_fields?: Record<string, any>;
  source?: string;
  is_active: boolean;
  unsubscribed: boolean;
  total_emails_sent: number;
  total_emails_opened: number;
  total_emails_replied: number;
  engagement_score: number;
  last_contacted_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface RecipientCreate {
  email: string;
  name?: string;
  company?: string;
  position?: string;
  country?: string;
  language?: string;
  tags?: string;
  custom_fields?: Record<string, any>;
  source?: string;
}

export interface RecipientUpdate {
  name?: string;
  company?: string;
  position?: string;
  country?: string;
  language?: string;
  tags?: string;
  custom_fields?: Record<string, any>;
  is_active?: boolean;
  unsubscribed?: boolean;
}

export interface DynamicFilterCriteria {
  companies?: string[];
  tags?: string[];
  countries?: string[];
  positions?: string[];
  min_engagement_score?: number;
  is_active?: boolean;
  exclude_unsubscribed?: boolean;
}

export interface RecipientGroup {
  id: number;
  candidate_id: number;
  name: string;
  description?: string;
  group_type: GroupType;
  color?: string;
  filter_criteria?: DynamicFilterCriteria;
  auto_refresh: boolean;
  last_refreshed_at?: string;
  total_recipients: number;
  active_recipients: number;
  created_at: string;
  updated_at?: string;
}

export interface RecipientGroupCreate {
  name: string;
  description?: string;
  group_type: GroupType;
  color?: string;
  filter_criteria?: DynamicFilterCriteria;
  auto_refresh?: boolean;
}

export interface RecipientGroupUpdate {
  name?: string;
  description?: string;
  color?: string;
  filter_criteria?: DynamicFilterCriteria;
  auto_refresh?: boolean;
}

export interface GroupCampaign {
  id: number;
  candidate_id: number;
  group_id: number;
  template_id?: number;
  campaign_name: string;
  subject_template?: string;
  body_template?: string;
  status: CampaignStatus;
  send_delay_seconds: number;
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  opened_count: number;
  replied_count: number;
  bounced_count: number;
  current_progress: number;
  error_details?: string;
  created_at: string;
  updated_at?: string;
  // Populated relationships
  group?: RecipientGroup;
}

export interface GroupCampaignCreate {
  group_id: number;
  campaign_name: string;
  template_id?: number;
  subject_template?: string;
  body_template?: string;
  send_delay_seconds?: number;
  scheduled_at?: string;
}

export interface GroupCampaignRecipient {
  id: number;
  campaign_id: number;
  recipient_id: number;
  status: RecipientStatus;
  rendered_subject?: string;
  rendered_body?: string;
  sent_at?: string;
  opened_at?: string;
  replied_at?: string;
  bounced_at?: string;
  error_message?: string;
  // Populated relationships
  recipient?: Recipient;
}

export interface RecipientStatistics {
  total: number;
  active: number;
  unsubscribed: number;
  avg_engagement_score: number;
  top_companies: Array<{ company: string; count: number }>;
  by_country: Array<{ country: string; count: number }>;
  by_tag: Array<{ tag: string; count: number }>;
}

export interface ApplicationCreate {
  company_name: string;
  recruiter_name?: string;
  recruiter_email: string;
  position_title?: string;
  notes?: string;
}

export interface ApplicationUpdate {
  recruiter_name?: string;
  recruiter_email?: string;
  position_title?: string;
  status?: ApplicationStatus;
  notes?: string;
  email_subject?: string;
  email_body_html?: string;
  priority?: number;
  is_starred?: boolean;
}

// ============================================
// Company Types
// ============================================

export interface Company {
  id: number;
  name: string;
  domain?: string;
  industry?: string;
  description?: string;
  headquarters_country?: string;
  headquarters_city?: string;
  primary_language?: string;
  tech_stack?: string[];
  company_size?: string;
  website_url?: string;
  linkedin_url?: string;
  careers_url?: string;
  alignment_pragya_text?: string;
  alignment_pragya_score: number;
  alignment_aniruddh_text?: string;
  alignment_aniruddh_score: number;
  job_postings_pragya?: JobPosting[];
  job_postings_aniruddh?: JobPosting[];
  total_applications: number;
  total_responses: number;
  created_at: string;
  updated_at?: string;
}

export interface JobPosting {
  title: string;
  url?: string;
  location?: string;
  posted_date?: string;
}

// ============================================
// Resume Types
// ============================================

export type ResumeLanguage =
  | "english" | "hindi" | "spanish" | "french"
  | "german" | "chinese" | "japanese" | "korean";

export interface ResumeVersion {
  id: number;
  candidate_id: number;
  name: string;
  description?: string;
  language: ResumeLanguage;
  filename: string;
  file_path: string;
  file_size?: number;
  target_position?: string;
  target_industry?: string;
  target_country?: string;
  is_default: boolean;
  is_active: boolean;
  times_used: number;
  last_used_at?: string;
  created_at: string;
  updated_at?: string;
}

// ============================================
// Email Template Types
// ============================================

export type EmailLanguage =
  | "english" | "hindi" | "spanish" | "french"
  | "german" | "chinese" | "japanese" | "korean";

export type TemplateCategory =
  // New frontend-aligned categories
  | "application" | "reply" | "followup" | "outreach" | "custom"
  // Legacy categories (backwards compatibility)
  | "initial_application" | "follow_up" | "thank_you"
  | "inquiry" | "networking" | "referral" | "reapplication" | "ai_generated";

export interface EmailTemplate {
  id: number;
  candidate_id: number;
  name: string;
  description?: string;
  category: TemplateCategory;
  language: EmailLanguage;
  tone?: string;
  subject_template: string;
  body_template_html: string;
  body_template_text?: string;
  target_position?: string;
  target_industry?: string;
  target_country?: string;
  target_company_size?: string;
  available_variables?: string;
  is_default: boolean;
  is_active: boolean;
  times_used: number;
  last_used_at?: string;
  created_at: string;
  updated_at?: string;
}

// ============================================
// Dashboard & Analytics Types
// ============================================

export interface DashboardStats {
  total_applications: number;
  total_sent: number;
  total_opened: number;
  total_replied: number;
  total_interviews: number;
  total_offers: number;
  total_accepted: number;
  total_rejected: number;
  response_rate: number;
  open_rate: number;
  interview_rate: number;
}

export interface ApplicationsByStatus {
  status: ApplicationStatus;
  count: number;
}

export interface ApplicationsByCompany {
  company_name: string;
  count: number;
}

export interface DailyApplications {
  date: string;
  count: number;
}

export interface WeeklyStats {
  week: string;
  sent: number;
  opened: number;
  replied: number;
}

// ============================================
// Email Warming Types
// ============================================

export type WarmingStrategy = "conservative" | "moderate" | "aggressive" | "custom";
export type WarmingStatus = "not_started" | "active" | "paused" | "completed" | "failed";

export interface WarmingConfig {
  id: number;
  candidate_id: number;
  strategy: WarmingStrategy;
  status: WarmingStatus;
  current_day: number;
  emails_sent_today: number;
  total_emails_sent: number;
  success_rate: number;
  bounce_rate: number;
  start_date?: string;
  completion_date?: string;
  created_at: string;
}

export interface WarmingProgress {
  enabled: boolean;
  status: WarmingStatus;
  strategy: WarmingStrategy;
  current_day: number;
  max_day: number;
  progress_percentage: number;
  daily_limit: number;
  emails_sent_today: number;
  remaining_today: number;
  total_emails_sent: number;
  success_rate: number;
  bounce_rate: number;
  start_date: string | null;
  completion_date: string | null;
}

// ============================================
// Rate Limiting Types
// ============================================

export type RateLimitPreset =
  | "conservative" | "moderate" | "aggressive"
  | "gmail_free" | "gmail_workspace" | "outlook" | "custom";

export interface RateLimitConfig {
  id: number;
  candidate_id: number;
  preset: RateLimitPreset;
  daily_limit: number;
  hourly_limit: number;
  weekly_limit?: number;
  monthly_limit?: number;
  enabled: boolean;
  emails_sent_today: number;
  emails_sent_this_hour: number;
  created_at: string;
}

export interface RateLimitUsage {
  enabled: boolean;
  preset: string;
  limits: {
    daily: number;
    hourly: number;
    weekly: number | null;
    monthly: number | null;
  };
  usage: {
    today: number;
    this_hour: number;
    this_week: number;
    this_month: number;
  };
  remaining: {
    daily: number;
    hourly: number;
    weekly: number | null;
    monthly: number | null;
  };
  percentage_used: {
    daily: number;
    hourly: number;
  };
  next_reset: {
    hourly: string | null;
    daily: string | null;
  };
}

// ============================================
// API Response Types
// ============================================

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface APIError {
  detail: string;
  status_code?: number;
  error_code?: string;
}

// ============================================
// Email Log Types
// ============================================

export type EmailStatus = "pending" | "sent" | "failed" | "bounced";

export interface EmailLog {
  id: number;
  candidate_id: number;
  application_id?: number;
  from_email: string;
  to_email: string;
  subject?: string;
  status: EmailStatus;
  error_message?: string;
  opened: boolean;
  clicked: boolean;
  sent_at?: string;
  opened_at?: string;
  created_at: string;
}

// ============================================
// Application History Types
// ============================================

export interface ApplicationHistory {
  id: number;
  application_id: number;
  changed_by?: number;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  note?: string;
  change_type: "status_change" | "field_update" | "note_added";
  created_at: string;
}

export interface ApplicationNote {
  id: number;
  application_id: number;
  candidate_id: number;
  content: string;
  note_type: "general" | "interview" | "follow_up";
  created_at: string;
  updated_at?: string;
  author?: {
    id: number;
    full_name: string;
  };
}

// ============================================
// Template Analytics Types
// ============================================

export type TemplateAnalyticsEventType = "view" | "clone" | "use" | "rate" | "favorite" | "share" | "report";
export type SnapshotPeriodType = "daily" | "weekly" | "monthly";

export interface TemplateAnalyticsEvent {
  id: number;
  template_id: number;
  user_id?: number;
  event_type: TemplateAnalyticsEventType;
  event_metadata?: Record<string, any>;
  session_id?: string;
  referrer?: string;
  created_at: string;
}

export interface TemplatePerformanceSnapshot {
  id: number;
  template_id: number;
  period_type: SnapshotPeriodType;
  period_start: string;
  period_end: string;
  snapshot_date: string;
  total_views: number;
  unique_viewers: number;
  total_clones: number;
  total_uses: number;
  total_favorites: number;
  avg_rating?: number;
  total_ratings: number;
  view_to_clone_rate: number;
  clone_to_use_rate: number;
  views_growth_pct?: number;
  clones_growth_pct?: number;
  uses_growth_pct?: number;
  created_at: string;
}

export interface TrendingTemplate {
  template_id: number;
  name: string;
  category: string;
  total_events_7d: number;
  unique_users_7d: number;
  growth_rate_7d: number;
  average_rating?: number;
}

export interface EventTrackRequest {
  template_id: number;
  event_type: TemplateAnalyticsEventType;
  event_metadata?: Record<string, any>;
  session_id?: string;
  referrer?: string;
}

// ============================================
// Document Management Types (Resume & Info Docs)
// ============================================

export interface WorkExperience {
  company: string;
  position: string;
  start_date: string;
  end_date?: string;
  description?: string;
  achievements?: string[];
}

export interface Education {
  institution: string;
  degree: string;
  graduation_year?: number;
  gpa?: number;
}

export interface Project {
  name: string;
  description?: string;
  technologies?: string[];
  url?: string;
}

export interface LanguageProficiency {
  language: string;
  proficiency: string;
}

export interface Certification {
  name: string;
  year?: number;
}

export interface ParsedResume {
  id: number;
  candidate_id: number;
  resume_version_id?: number;

  // Basic Info
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;

  // Summary
  professional_summary?: string;
  years_of_experience?: number;

  // Skills
  technical_skills?: string[];
  soft_skills?: string[];
  languages_spoken?: LanguageProficiency[];
  certifications?: Certification[];

  // Experience & Education
  work_experience?: WorkExperience[];
  education?: Education[];
  projects?: Project[];

  // Publications & Patents
  publications?: any[];
  patents?: any[];
  achievements?: any[];
  awards?: any[];

  // Metadata
  parsing_confidence_score?: number;
  total_pages?: number;
  word_count?: number;
  parsed_at?: string;
  last_updated_at?: string;
}

export interface ProductService {
  name: string;
  description?: string;
  pricing?: string;
  features?: string[];
}

export interface IdealCustomerProfile {
  company_size?: string;
  industries?: string[];
  pain_points?: string[];
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  website?: string;
}

export interface PricingTier {
  name: string;
  price: string;
  features: string[];
}

export interface CompanyInfoDoc {
  id: number;
  candidate_id: number;

  // Document Info
  name: string;
  description?: string;
  doc_type?: string;

  // File Info
  filename: string;
  file_path: string;
  file_size?: number;

  // Company/Service Details
  company_name?: string;
  tagline?: string;
  industry?: string;
  target_market?: string;

  // JSON Fields
  products_services?: ProductService[];
  key_benefits?: string[];
  unique_selling_points?: string[];
  problem_solved?: string;
  ideal_customer_profile?: IdealCustomerProfile;
  case_studies?: any[];
  testimonials?: any[];
  client_logos?: string[];
  pricing_tiers?: PricingTier[];
  contact_info?: ContactInfo;
  team_members?: any[];
  competitors?: string[];
  differentiators?: string[];

  // Metadata
  parsing_confidence_score?: number;
  total_pages?: number;
  word_count?: number;
  is_active?: boolean;
  is_default?: boolean;
  times_used?: number;
  last_used_at?: string;
  parsed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DocumentListResponse {
  resumes?: Array<{
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
  }>;
  info_docs?: Array<{
    id: number;
    candidate_id: number;
    name: string;
    description?: string;
    filename: string;
    doc_type?: string;
    is_default: boolean;
    is_active: boolean;
    times_used: number;
    last_used_at?: string;
    created_at?: string;
  }>;
}
