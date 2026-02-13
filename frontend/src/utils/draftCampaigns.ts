import { CampaignDraft } from '@/hooks/useCampaignDraft'

const DRAFTS_KEY = 'campaign-drafts'

export interface DraftCampaignListItem {
  id: string
  campaignName?: string
  goal?: string
  step: number
  recipientCount: number
  source?: string
  createdAt: string
  updatedAt: string
}

/**
 * Get all saved draft campaigns
 */
export function getAllDrafts(): DraftCampaignListItem[] {
  if (typeof window === 'undefined') return []
  
  try {
    const draftsJson = localStorage.getItem(DRAFTS_KEY)
    if (!draftsJson) return []
    
    const drafts = JSON.parse(draftsJson) as Record<string, CampaignDraft>
    
    return Object.values(drafts).map(draft => ({
      id: draft.id,
      campaignName: draft.campaignName,
      goal: draft.goal,
      step: draft.step,
      recipientCount: draft.step1?.recipientCount || 0,
      source: draft.step1?.source,
      createdAt: draft.createdAt,
      updatedAt: draft.updatedAt,
    }))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  } catch (error) {
    console.error('Error loading drafts:', error)
    return []
  }
}

/**
 * Get a specific draft by ID
 */
export function getDraft(id: string): CampaignDraft | null {
  if (typeof window === 'undefined') return null
  
  try {
    const draftsJson = localStorage.getItem(DRAFTS_KEY)
    if (!draftsJson) return null
    
    const drafts = JSON.parse(draftsJson) as Record<string, CampaignDraft>
    return drafts[id] || null
  } catch (error) {
    console.error('Error loading draft:', error)
    return null
  }
}

/**
 * Save or update a draft campaign
 */
export function saveDraft(draft: CampaignDraft): void {
  if (typeof window === 'undefined') return
  if (!draft.id) return
  
  try {
    const draftsJson = localStorage.getItem(DRAFTS_KEY)
    const drafts = draftsJson ? JSON.parse(draftsJson) : {}
    
    drafts[draft.id] = draft
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts))
  } catch (error) {
    console.error('Error saving draft:', error)
  }
}

/**
 * Delete a draft campaign
 */
export function deleteDraft(id: string): void {
  if (typeof window === 'undefined') return
  
  try {
    const draftsJson = localStorage.getItem(DRAFTS_KEY)
    if (!draftsJson) return
    
    const drafts = JSON.parse(draftsJson) as Record<string, CampaignDraft>
    delete drafts[id]
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts))
  } catch (error) {
    console.error('Error deleting draft:', error)
  }
}

/**
 * Sync current draft from Zustand to the drafts list
 */
export function syncDraftToList(draft: CampaignDraft): void {
  if (!draft.id || !draft.createdAt) return
  saveDraft(draft)
}

/**
 * Calculate progress percentage for a draft
 */
export function calculateProgress(draft: CampaignDraft | DraftCampaignListItem): number {
  const stepValue = typeof draft.step === 'number' ? draft.step : 1
  return Math.round((stepValue / 4) * 100)
}

/**
 * Get user-friendly source name
 */
export function getSourceDisplayName(source?: string): string {
  const sourceMap: Record<string, string> = {
    ultra: 'ULTRA',
    mobiadz: 'MobiAdz',
    csv: 'CSV Upload',
    group: 'Existing Group',
    applications: 'Applications',
    manual: 'Manual Entry',
    campaign: 'Campaign',
  }
  return source ? sourceMap[source] || source : 'Not selected'
}
