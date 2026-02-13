/**
 * Email Cache Utility - God-Tier Email History System
 * Handles caching of generated emails with batch tracking and favorites
 */

export interface EmailHistory {
  id: string;
  recipientId: number;
  batchId: string;
  generatedAt: string;
  emails: EmailVariation[];
  selectedTone?: string;
  sentAt?: string;
}

export interface EmailVariation {
  id: string;
  tone: string;
  subject: string;
  body: string;
  personalizationScore: number;
  matchedSkills: string[];
  estimatedResponseRate: string;
  favorite: boolean;
  used: boolean;
  usedAt?: string;
}

const CACHE_PREFIX = 'ultra-emails-';
const MAX_HISTORY_BATCHES = 10;

/**
 * Generate unique cache key for a recipient
 */
export function generateCacheKey(recipientId: number): string {
  return `${CACHE_PREFIX}${recipientId}`;
}

/**
 * Generate unique batch ID
 */
export function generateBatchId(): string {
  return `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate age text for email batch
 */
export function calculateAgeText(generatedAt: string): string {
  const now = new Date();
  const generated = new Date(generatedAt);
  const diffMs = now.getTime() - generated.getTime();
  const ageInMinutes = diffMs / (1000 * 60);
  const ageInHours = ageInMinutes / 60;
  const ageInDays = ageInHours / 24;

  if (ageInMinutes < 1) {
    return 'Just now';
  } else if (ageInMinutes < 60) {
    return `${Math.round(ageInMinutes)} minutes ago`;
  } else if (ageInHours < 24) {
    return `${Math.round(ageInHours)} hours ago`;
  } else if (ageInDays < 7) {
    return `${Math.round(ageInDays)} days ago`;
  } else if (ageInDays < 30) {
    const weeks = Math.round(ageInDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else {
    const months = Math.round(ageInDays / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }
}

/**
 * Save email batch to cache
 */
export function saveEmailBatchToCache(
  recipientId: number,
  emails: any[]
): EmailHistory {
  const now = new Date();
  const batchId = generateBatchId();

  const emailVariations: EmailVariation[] = emails.map((email) => ({
    id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    tone: email.tone || 'professional',
    subject: email.subject,
    body: email.body,
    personalizationScore: email.personalization_score || 0,
    matchedSkills: email.matched_skills || [],
    estimatedResponseRate: email.estimated_response_rate || '10-15%',
    favorite: false,
    used: false,
  }));

  const emailHistory: EmailHistory = {
    id: `history-${recipientId}-${now.getTime()}`,
    recipientId,
    batchId,
    generatedAt: now.toISOString(),
    emails: emailVariations,
  };

  try {
    // Get existing history
    const allHistory = getAllEmailHistory(recipientId);

    // Add new batch at the beginning
    allHistory.unshift(emailHistory);

    // Keep only last MAX_HISTORY_BATCHES batches
    const trimmedHistory = allHistory.slice(0, MAX_HISTORY_BATCHES);

    // Save to localStorage
    const cacheKey = generateCacheKey(recipientId);
    localStorage.setItem(cacheKey, JSON.stringify(trimmedHistory));

    console.log(`✅ [EmailCache] Saved ${emails.length} emails for recipient ${recipientId}`);
    return emailHistory;
  } catch (error) {
    console.error('❌ [EmailCache] Failed to save emails:', error);
    throw error;
  }
}

/**
 * Get latest email batch from cache
 */
export function getLatestEmailBatch(recipientId: number): EmailHistory | null {
  try {
    const allHistory = getAllEmailHistory(recipientId);

    if (allHistory.length === 0) {
      console.log(`ℹ️ [EmailCache] No cached emails for recipient ${recipientId}`);
      return null;
    }

    const latest = allHistory[0];
    console.log(`✅ [EmailCache] Loaded latest email batch for recipient ${recipientId} (${calculateAgeText(latest.generatedAt)})`);
    return latest;
  } catch (error) {
    console.error('❌ [EmailCache] Failed to load latest batch:', error);
    return null;
  }
}

/**
 * Get all email history for a recipient
 */
export function getAllEmailHistory(recipientId: number): EmailHistory[] {
  try {
    const cacheKey = generateCacheKey(recipientId);
    const cached = localStorage.getItem(cacheKey);

    if (!cached) {
      return [];
    }

    const history: EmailHistory[] = JSON.parse(cached);
    console.log(`✅ [EmailCache] Loaded ${history.length} email batches for recipient ${recipientId}`);
    return history;
  } catch (error) {
    console.error('❌ [EmailCache] Failed to load email history:', error);
    return [];
  }
}

/**
 * Toggle favorite status for an email
 */
export function toggleEmailFavorite(
  recipientId: number,
  batchId: string,
  emailId: string
): boolean {
  try {
    const allHistory = getAllEmailHistory(recipientId);
    const batch = allHistory.find((b) => b.batchId === batchId);

    if (!batch) {
      console.error(`❌ [EmailCache] Batch ${batchId} not found`);
      return false;
    }

    const email = batch.emails.find((e) => e.id === emailId);

    if (!email) {
      console.error(`❌ [EmailCache] Email ${emailId} not found`);
      return false;
    }

    // Toggle favorite
    email.favorite = !email.favorite;

    // Save updated history
    const cacheKey = generateCacheKey(recipientId);
    localStorage.setItem(cacheKey, JSON.stringify(allHistory));

    console.log(`✅ [EmailCache] Toggled favorite for email ${emailId}: ${email.favorite}`);
    return email.favorite;
  } catch (error) {
    console.error('❌ [EmailCache] Failed to toggle favorite:', error);
    return false;
  }
}

/**
 * Mark email as used
 */
export function markEmailAsUsed(
  recipientId: number,
  batchId: string,
  emailId: string
): void {
  try {
    const allHistory = getAllEmailHistory(recipientId);
    const batch = allHistory.find((b) => b.batchId === batchId);

    if (!batch) {
      console.error(`❌ [EmailCache] Batch ${batchId} not found`);
      return;
    }

    const email = batch.emails.find((e) => e.id === emailId);

    if (!email) {
      console.error(`❌ [EmailCache] Email ${emailId} not found`);
      return;
    }

    // Mark as used
    email.used = true;
    email.usedAt = new Date().toISOString();

    // Save updated history
    const cacheKey = generateCacheKey(recipientId);
    localStorage.setItem(cacheKey, JSON.stringify(allHistory));

    console.log(`✅ [EmailCache] Marked email ${emailId} as used`);
  } catch (error) {
    console.error('❌ [EmailCache] Failed to mark as used:', error);
  }
}

/**
 * Get favorite emails
 */
export function getFavoriteEmails(recipientId: number): EmailVariation[] {
  try {
    const allHistory = getAllEmailHistory(recipientId);
    const favorites: EmailVariation[] = [];

    allHistory.forEach((batch) => {
      batch.emails.forEach((email) => {
        if (email.favorite) {
          favorites.push(email);
        }
      });
    });

    console.log(`✅ [EmailCache] Found ${favorites.length} favorite emails for recipient ${recipientId}`);
    return favorites;
  } catch (error) {
    console.error('❌ [EmailCache] Failed to get favorites:', error);
    return [];
  }
}

/**
 * Clear all email history for a recipient
 */
export function clearAllEmailHistory(recipientId: number): void {
  try {
    const cacheKey = generateCacheKey(recipientId);
    localStorage.removeItem(cacheKey);
    console.log(`🗑️ [EmailCache] Cleared all email history for recipient ${recipientId}`);
  } catch (error) {
    console.error('❌ [EmailCache] Failed to clear history:', error);
  }
}

/**
 * Get email count statistics
 */
export function getEmailStatistics(recipientId: number): {
  totalBatches: number;
  totalEmails: number;
  totalFavorites: number;
  totalUsed: number;
  latestBatchAge: string | null;
} {
  try {
    const allHistory = getAllEmailHistory(recipientId);

    let totalEmails = 0;
    let totalFavorites = 0;
    let totalUsed = 0;

    allHistory.forEach((batch) => {
      totalEmails += batch.emails.length;
      batch.emails.forEach((email) => {
        if (email.favorite) totalFavorites++;
        if (email.used) totalUsed++;
      });
    });

    const latestBatchAge = allHistory.length > 0 ? calculateAgeText(allHistory[0].generatedAt) : null;

    return {
      totalBatches: allHistory.length,
      totalEmails,
      totalFavorites,
      totalUsed,
      latestBatchAge,
    };
  } catch (error) {
    console.error('❌ [EmailCache] Failed to get statistics:', error);
    return {
      totalBatches: 0,
      totalEmails: 0,
      totalFavorites: 0,
      totalUsed: 0,
      latestBatchAge: null,
    };
  }
}
