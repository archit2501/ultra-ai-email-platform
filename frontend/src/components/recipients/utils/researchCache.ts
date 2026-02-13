/**
 * Research Cache Utility - God-Tier Caching System
 * Handles caching of company research with expiration and freshness tracking
 */

export interface ResearchHistory {
  id: string;
  recipientId: number;
  companyName: string;
  research: CompanyIntelligence;
  generatedAt: string;
  expiresAt: string;
  version: number;
  fresh: boolean;
  stale: boolean;
}

export interface CompanyIntelligence {
  companyName: string;
  techStack: string[];
  culture: string;
  recentProjects: string[];
  newsItems: string[];
  confidenceScore: number;
  scrapedPages: number;
  generatedAt: string;
}

const CACHE_PREFIX = 'ultra-research-';
const CACHE_EXPIRATION_DAYS = 7;
const FRESH_THRESHOLD_HOURS = 24;
const STALE_THRESHOLD_DAYS = 30;

/**
 * Generate unique cache key for a recipient
 */
export function generateCacheKey(recipientId: number): string {
  return `${CACHE_PREFIX}${recipientId}`;
}

/**
 * Calculate freshness of cached research
 */
export function calculateFreshness(generatedAt: string): {
  fresh: boolean;
  stale: boolean;
  ageInHours: number;
  ageInDays: number;
  ageText: string;
  colorClass: string;
} {
  const now = new Date();
  const generated = new Date(generatedAt);
  const diffMs = now.getTime() - generated.getTime();
  const ageInHours = diffMs / (1000 * 60 * 60);
  const ageInDays = ageInHours / 24;

  const fresh = ageInHours < FRESH_THRESHOLD_HOURS;
  const stale = ageInDays > STALE_THRESHOLD_DAYS;

  let ageText = '';
  let colorClass = '';

  if (ageInHours < 1) {
    ageText = `${Math.round(diffMs / (1000 * 60))} minutes ago`;
    colorClass = 'text-green-400 bg-green-500/20 border-green-500/30';
  } else if (ageInHours < 24) {
    ageText = `${Math.round(ageInHours)} hours ago`;
    colorClass = 'text-green-400 bg-green-500/20 border-green-500/30';
  } else if (ageInDays < 7) {
    ageText = `${Math.round(ageInDays)} days ago`;
    colorClass = 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
  } else if (ageInDays < 30) {
    ageText = `${Math.round(ageInDays)} days ago`;
    colorClass = 'text-orange-400 bg-orange-500/20 border-orange-500/30';
  } else {
    ageText = `${Math.round(ageInDays)} days ago`;
    colorClass = 'text-red-400 bg-red-500/20 border-red-500/30';
  }

  return {
    fresh,
    stale,
    ageInHours,
    ageInDays,
    ageText,
    colorClass,
  };
}

/**
 * Save research to cache
 */
export function saveResearchToCache(
  recipientId: number,
  companyName: string,
  research: CompanyIntelligence
): ResearchHistory {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CACHE_EXPIRATION_DAYS * 24 * 60 * 60 * 1000);

  // Get existing version number
  const existing = getResearchFromCache(recipientId);
  const version = existing ? existing.version + 1 : 1;

  const researchHistory: ResearchHistory = {
    id: `research-${recipientId}-${now.getTime()}`,
    recipientId,
    companyName,
    research: {
      ...research,
      generatedAt: now.toISOString(),
    },
    generatedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    version,
    fresh: true,
    stale: false,
  };

  try {
    const cacheKey = generateCacheKey(recipientId);
    localStorage.setItem(cacheKey, JSON.stringify(researchHistory));

    // Also save to history array
    const historyKey = `${CACHE_PREFIX}history-${recipientId}`;
    const history = getAllResearchHistory(recipientId);
    history.unshift(researchHistory);
    // Keep only last 10 versions
    const trimmedHistory = history.slice(0, 10);
    localStorage.setItem(historyKey, JSON.stringify(trimmedHistory));

    console.log(`✅ [ResearchCache] Saved research for recipient ${recipientId} (v${version})`);
    return researchHistory;
  } catch (error) {
    console.error('❌ [ResearchCache] Failed to save research:', error);
    throw error;
  }
}

/**
 * Get research from cache (checks localStorage ONLY - synchronous)
 * For backend cache check, use getResearchFromCacheAsync()
 */
export function getResearchFromCache(recipientId: number): ResearchHistory | null {
  try {
    const cacheKey = generateCacheKey(recipientId);
    const cached = localStorage.getItem(cacheKey);

    if (!cached) {
      console.log(`ℹ️ [ResearchCache] No cached research for recipient ${recipientId}`);
      return null;
    }

    const researchHistory: ResearchHistory = JSON.parse(cached);

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(researchHistory.expiresAt);

    if (now > expiresAt) {
      console.log(`⚠️ [ResearchCache] Cached research expired for recipient ${recipientId}`);
      clearResearchCache(recipientId);
      return null;
    }

    // Update freshness
    const freshness = calculateFreshness(researchHistory.generatedAt);
    researchHistory.fresh = freshness.fresh;
    researchHistory.stale = freshness.stale;

    console.log(`✅ [ResearchCache] Loaded research for recipient ${recipientId} (${freshness.ageText})`);
    return researchHistory;
  } catch (error) {
    console.error('❌ [ResearchCache] Failed to load research:', error);
    return null;
  }
}

/**
 * GOD-TIER: Get research from cache with backend fallback (async)
 * Checks localStorage first, then backend database
 * This is the SMART way - hybrid caching!
 */
export async function getResearchFromCacheAsync(
  recipientId: number,
  companyId?: number
): Promise<ResearchHistory | null> {
  // STEP 1: Check localStorage first (fastest)
  const localCache = getResearchFromCache(recipientId);
  if (localCache) {
    console.log(`⚡ [ResearchCache] Found in localStorage (${localCache.fresh ? 'FRESH' : 'CACHED'})`);
    return localCache;
  }

  // STEP 2: Check backend database (if companyId provided)
  if (companyId) {
    try {
      console.log(`🔍 [ResearchCache] Checking backend database for company ${companyId}...`);
      const { companyIntelligenceAPI } = await import('@/lib/api');

      const response = await companyIntelligenceAPI.getCompanyResearch(companyId);

      if (response.data.from_cache && response.data.data) {
        console.log(`✨ [ResearchCache] Found in BACKEND DATABASE! Converting to local format...`);

        // Convert backend format to our ResearchHistory format
        const backendData = response.data.data;
        const now = new Date();
        const expiresAt = new Date(now.getTime() + CACHE_EXPIRATION_DAYS * 24 * 60 * 60 * 1000);

        const researchHistory: ResearchHistory = {
          id: `research-${recipientId}-${now.getTime()}`,
          recipientId,
          companyName: backendData.company_name || 'Unknown Company',
          research: {
            companyName: backendData.company_name || 'Unknown Company',
            techStack: backendData.tech_stack || [],
            culture: backendData.about_summary || (typeof backendData.company_culture === 'string' ? backendData.company_culture : backendData.company_culture?.keywords?.join(', ')) || 'No culture data',
            recentProjects: backendData.github_repos?.map((r: any) => r.name || r.url) || [],
            newsItems: backendData.recent_news?.map((n: any) => n.title || String(n)) || [],
            confidenceScore: backendData.completeness_score || 0,
            scrapedPages: backendData.data_sources?.length || 0,
            generatedAt: backendData.created_at || new Date().toISOString(),
          },
          generatedAt: backendData.created_at || new Date().toISOString(),
          expiresAt: expiresAt.toISOString(),
          version: 1,
          fresh: true,
          stale: false,
        };

        // Save to localStorage for future fast access
        saveResearchToCache(recipientId, researchHistory.companyName, researchHistory.research);

        console.log(`💾 [ResearchCache] Saved backend data to localStorage for future use`);
        return researchHistory;
      }
    } catch (error) {
      console.warn(`⚠️ [ResearchCache] Backend check failed (will trigger new research):`, error);
    }
  }

  console.log(`❌ [ResearchCache] No cache found anywhere - need fresh research`);
  return null;
}

/**
 * Get all research history for a recipient
 */
export function getAllResearchHistory(recipientId: number): ResearchHistory[] {
  try {
    const historyKey = `${CACHE_PREFIX}history-${recipientId}`;
    const cached = localStorage.getItem(historyKey);

    if (!cached) {
      return [];
    }

    const history: ResearchHistory[] = JSON.parse(cached);
    console.log(`✅ [ResearchCache] Loaded ${history.length} research versions for recipient ${recipientId}`);
    return history;
  } catch (error) {
    console.error('❌ [ResearchCache] Failed to load research history:', error);
    return [];
  }
}

/**
 * Clear research cache for a recipient
 */
export function clearResearchCache(recipientId: number): void {
  try {
    const cacheKey = generateCacheKey(recipientId);
    localStorage.removeItem(cacheKey);
    console.log(`🗑️ [ResearchCache] Cleared cache for recipient ${recipientId}`);
  } catch (error) {
    console.error('❌ [ResearchCache] Failed to clear cache:', error);
  }
}

/**
 * Clear all research history for a recipient
 */
export function clearAllResearchHistory(recipientId: number): void {
  try {
    clearResearchCache(recipientId);
    const historyKey = `${CACHE_PREFIX}history-${recipientId}`;
    localStorage.removeItem(historyKey);
    console.log(`🗑️ [ResearchCache] Cleared all history for recipient ${recipientId}`);
  } catch (error) {
    console.error('❌ [ResearchCache] Failed to clear history:', error);
  }
}

/**
 * Check if research needs regeneration
 */
export function shouldRegenerateResearch(recipientId: number): {
  shouldRegenerate: boolean;
  reason: string;
} {
  const cached = getResearchFromCache(recipientId);

  if (!cached) {
    return {
      shouldRegenerate: true,
      reason: 'No cached research found',
    };
  }

  const freshness = calculateFreshness(cached.generatedAt);

  if (freshness.stale) {
    return {
      shouldRegenerate: true,
      reason: `Research is stale (${freshness.ageText})`,
    };
  }

  return {
    shouldRegenerate: false,
    reason: `Research is fresh (${freshness.ageText})`,
  };
}
