import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CampaignRecipient } from '@/types'

export type DataSource = 'csv' | 'ultra' | 'mobiadz' | 'group' | 'applications' | 'manual' | 'campaign'
export type CampaignGoal = 'jobs' | 'clients'

export interface CampaignDraft {
  id: string
  step: 1 | 2 | 3 | 4 | 5
  goal?: CampaignGoal
  campaignName?: string
  createdAt: string
  updatedAt: string

  // STEP 1: Get Data
  step1: {
    source?: DataSource
    
    // CSV
    csvFile?: File
    csvMapping?: { [column: string]: string }
    csvColumnNames?: string[]
    
    // Extraction (ULTRA or MobiAdz)
    extractionJobId?: string
    extractionProgress?: number
    extractionType?: 'ultra' | 'mobiadz'
    extractionUrl?: string
    lastView?: 'goal-selection' | 'data-source' | 'source-specific' | 'summary'
    
    // Groups
    selectedGroupId?: number
    
    // Applications
    selectedApplicationIds?: number[]
    applicationFilters?: {
      status?: string[]
      startDate?: string
      endDate?: string
      recruiter?: string
      company?: string
    }
    
    // Manual
    manualRecipients?: CampaignRecipient[]
    
    // Final selected recipients (same for all sources)
    recipients: CampaignRecipient[]
    recipientCount: number
  }

  // STEP 2: Enrich (placeholder for future)
  step2: {
    enableCompanyIntelligence?: boolean
    enablePersonIntelligence?: boolean
    enrichmentDepth?: 'quick' | 'standard' | 'deep'
    enrichedRecipients?: CampaignRecipient[]
    enableEmailValidation?: boolean
    enableFraudDetection?: boolean
    enableDuplicateRemoval?: boolean
    enableEntityResolution?: boolean
    enableCrossReference?: boolean
    enableExternalLinks?: boolean
    enableTechStackMatching?: boolean
    enableSkillMatching?: boolean
    enableEmailPreview?: boolean
    enableSendTimeOptimization?: boolean
    enableGoogleSearch?: boolean
    
    // Enrichment results data (NEW - for Step 3 integration)
    enrichmentJobId?: string
    enrichmentCompleted?: boolean
    enrichedData?: Record<number, any> // Map recipient ID -> enriched fields
    enrichmentStats?: {
      total: number
      successful: number
      failed: number
      completedAt?: string
    }
  }

  // STEP 3: Template (placeholder for future)
  step3: {
    templateSource?: 'marketplace' | 'my_templates' | 'ai_generate' | 'create_new'
    templateId?: number
    selectedTone?: string
    preview?: Record<number, string>
  }

  // STEP 4: Send (placeholder for future)
  step4: {
    campaignTitle?: string
    sendMethod?: 'immediate' | 'scheduled' | 'rate_limited'
    enableFollowUp?: boolean
    enableOpenTracking?: boolean
    followUpSequenceId?: number
    followUpStopOnReply?: boolean
    followUpStopOnBounce?: boolean
  }

  // STEP 5: Follow-Up Management
  step5: {
    followUpEnabled?: boolean
    sequenceId?: number
    customSequence?: boolean
  }
}

interface CampaignDraftStore {
  draft: CampaignDraft
  updateDraft: (updates: Partial<CampaignDraft>) => void
  updateStep1: (updates: Partial<CampaignDraft['step1']>) => void
  updateStep2: (updates: Partial<CampaignDraft['step2']>) => void
  updateStep3: (updates: Partial<CampaignDraft['step3']>) => void
  updateStep4: (updates: Partial<CampaignDraft['step4']>) => void
  updateStep5: (updates: Partial<CampaignDraft['step5']>) => void
  setStep: (step: 1 | 2 | 3 | 4 | 5) => void
  setGoal: (goal: CampaignGoal) => void
  resetDraft: () => void
  getDraft: () => CampaignDraft
  loadDraft: (draft: CampaignDraft) => void
}

const defaultDraft: CampaignDraft = {
  id: '',
  step: 1,
  createdAt: '',
  updatedAt: '',
  step1: {
    recipients: [],
    recipientCount: 0,
  },
  step2: {},
  step3: {},
  step4: {},
  step5: {},
}

export const useCampaignDraft = create<CampaignDraftStore>()(
  persist(
    (set, get) => ({
      draft: defaultDraft,

      updateDraft: (updates) => {
        const now = new Date().toISOString()
        set((state) => ({
          draft: { 
            ...state.draft, 
            ...updates,
            id: state.draft.id || `draft-${Date.now()}`,
            createdAt: state.draft.createdAt || now,
            updatedAt: now,
          },
        }))
      },

      updateStep1: (updates) => {
        const now = new Date().toISOString()
        set((state) => ({
          draft: {
            ...state.draft,
            id: state.draft.id || `draft-${Date.now()}`,
            createdAt: state.draft.createdAt || now,
            updatedAt: now,
            step1: { ...state.draft.step1, ...updates },
          },
        }))
      },

      updateStep2: (updates) => {
        const now = new Date().toISOString()
        set((state) => ({
          draft: {
            ...state.draft,
            updatedAt: now,
            step2: { ...state.draft.step2, ...updates },
          },
        }))
      },

      updateStep3: (updates) => {
        const now = new Date().toISOString()
        set((state) => ({
          draft: {
            ...state.draft,
            updatedAt: now,
            step3: { ...state.draft.step3, ...updates },
          },
        }))
      },

      updateStep4: (updates) => {
        const now = new Date().toISOString()
        set((state) => ({
          draft: {
            ...state.draft,
            updatedAt: now,
            step4: { ...state.draft.step4, ...updates },
          },
        }))
      },

      updateStep5: (updates) => {
        const now = new Date().toISOString()
        set((state) => ({
          draft: {
            ...state.draft,
            updatedAt: now,
            step5: { ...state.draft.step5, ...updates },
          },
        }))
      },

      setStep: (step) => {
        const now = new Date().toISOString()
        set((state) => ({
          draft: { 
            ...state.draft, 
            step,
            updatedAt: now,
          },
        }))
      },

      setGoal: (goal) => {
        const now = new Date().toISOString()
        set((state) => ({
          draft: { 
            ...state.draft, 
            goal,
            updatedAt: now,
          },
        }))
      },

      resetDraft: () => {
        set({ draft: defaultDraft })
      },

      getDraft: () => {
        return get().draft
      },

      loadDraft: (draftToLoad) => {
        set({ draft: draftToLoad })
      },
    }),
    {
      name: 'campaign-draft',
      skipHydration: false,
    }
  )
)
