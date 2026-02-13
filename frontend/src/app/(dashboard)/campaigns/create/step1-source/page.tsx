'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCampaignDraft, type DataSource } from '@/hooks/useCampaignDraft'
import { CampaignRecipient } from '@/types'
import { DataSourceSelector } from '@/components/campaigns/DataSourceSelector'
import { Summary } from '@/components/campaigns/Summary'
import { CSVImportFlow } from './components/CSVImportFlow'
import { RecipientGroupSelector } from './components/RecipientGroupSelector'
import { ApplicationSelector } from './components/ApplicationSelector'
import { ManualEntry } from './components/ManualEntry'
import { ULTRAExtraction } from './components/ULTRAExtraction'
import { MobiAdzExtraction } from './components/MobiAdzExtraction'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { syncDraftToList } from '@/utils/draftCampaigns'

type ViewType = 'goal-selection' | 'data-source' | 'source-specific' | 'summary'

export default function Step1Page() {
  const router = useRouter()
  const { draft, updateDraft, updateStep1, setGoal, setStep } = useCampaignDraft()
  const [view, setView] = useState<ViewType>('goal-selection')
  const [isLoading, setIsLoading] = useState(false)
  const [campaignName, setCampaignName] = useState('')

  // Initialize campaign name from draft
  useEffect(() => {
    if (draft.campaignName) {
      setCampaignName(draft.campaignName)
    }
  }, [draft.campaignName])

  // Load saved data if available
  useEffect(() => {
    if (draft.step1.lastView) {
      setView(draft.step1.lastView)
      return
    }
    if (draft.goal && draft.step1.source) {
      setView('source-specific')
    }
  }, [draft.goal, draft.step1.source, draft.step1.lastView])

  // Sync draft to localStorage whenever it changes
  useEffect(() => {
    if (draft.id && draft.createdAt) {
      syncDraftToList(draft)
    }
  }, [draft])

  // Persist the current view for resume
    const setViewAndPersist = (nextView: ViewType) => {
      setView(nextView)
      if (draft.step1.lastView !== nextView) {
        updateStep1({ lastView: nextView })
      }
    }

  const handleGoalSelect = (goal: 'jobs' | 'clients') => {
    setGoal(goal)
      setViewAndPersist('data-source')
  }

  const handleDataSourceSelect = (source: DataSource) => {
    updateStep1({ source })
      setViewAndPersist('source-specific')
  }

  const handleBack = () => {
    if (view === 'source-specific') {
        setViewAndPersist('data-source')
    } else if (view === 'data-source') {
        setViewAndPersist('goal-selection')
    }
  }

  const handleRecipientSelected = (recipients: any[], count: number, autoAdvance: boolean = false) => {
    updateStep1({ 
      recipients,
      recipientCount: count 
    })
    
    // Auto-advance to Step 2 if requested (for extraction workflows)
    if (autoAdvance && recipients.length > 0) {
      setStep(2)
      router.push('/campaigns/create/step2-enrich')
    } else {
        setViewAndPersist('summary')
    }
  }

  const handleSummaryNext = () => {
    setStep(2)
    router.push('/campaigns/create/step2-enrich')
  }

  const handleRecipientsValidated = (validatedRecipients: CampaignRecipient[]) => {
    // Update draft with validated recipients
    updateStep1({ 
      recipients: validatedRecipients,
      recipientCount: validatedRecipients.length 
    })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/70 backdrop-blur">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3 mb-4">
            {view !== 'goal-selection' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="flex items-center gap-2 text-slate-200 hover:text-white hover:bg-slate-800/60"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            )}
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <label className="block text-xs text-slate-400 mb-2">Campaign Name</label>
              <Input
                placeholder="Enter campaign name (e.g., Q1 2026 Outreach)"
                value={campaignName}
                onChange={(e) => {
                  const value = e.target.value
                  setCampaignName(value)
                  updateDraft({ campaignName: value || undefined })
                }}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 mb-3"
              />
              <div>
                <h1 className="text-3xl font-bold text-white">Create Campaign</h1>
                <p className="text-slate-400 mt-1">Step 1 of 4: Get Data</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-slate-900/60 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-6 py-3">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                    step === 1
                      ? 'bg-blue-600 text-white shadow-[0_0_0_4px_rgba(59,130,246,0.2)]'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {step}
                </div>
                {step < 4 && (
                  <div className="flex-1 h-1 mx-2 bg-slate-800 rounded-full" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-12">
        {view === 'goal-selection' && (
          <GoalSelection onSelect={handleGoalSelect} />
        )}

        {view === 'data-source' && (
          <DataSourceSelector
            selectedSource={draft.step1.source}
            onSelect={handleDataSourceSelect}
          />
        )}

        {view === 'source-specific' && draft.step1.source && (
          <SourceSpecificComponent
            source={draft.step1.source}
            goal={draft.goal || 'jobs'}
            onRecipientSelected={handleRecipientSelected}
            isLoading={isLoading}
            extractionJobId={draft.step1.extractionJobId}
            extractionType={draft.step1.extractionType}
            onJobCreated={(jobId, type) => updateStep1({ extractionJobId: jobId, extractionType: type })}
          />
        )}

        {view === 'summary' && draft.step1.source && (
          <Summary
            source={draft.step1.source}
            recipientCount={draft.step1.recipientCount}
            recipients={draft.step1.recipients}
            onBack={() => setViewAndPersist('source-specific')}
            onNext={handleSummaryNext}
            isLoading={isLoading}
            onRecipientsValidated={handleRecipientsValidated}
          />
        )}
      </div>
    </div>
  )
}

// Goal Selection Component
function GoalSelection({ onSelect }: { onSelect: (goal: 'jobs' | 'clients') => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-white">What's your goal?</h2>
        <p className="text-slate-400">This helps us tailor the workflow for your needs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Jobs Card */}
        <button
          onClick={() => onSelect('jobs')}
          className="p-8 rounded-lg border-2 border-slate-800 bg-slate-900 hover:border-blue-500 hover:bg-slate-800 transition-all text-left text-slate-100"
        >
          <div className="text-4xl mb-3">💼</div>
          <h3 className="text-xl font-bold text-white mb-2">Looking for Jobs</h3>
          <p className="text-slate-300 mb-4">
            Extract recruiters, research companies, send tailored applications
          </p>
          <ul className="text-sm text-slate-300 space-y-2">
            <li>✓ Extract recruiters from LinkedIn</li>
            <li>✓ Research company culture & tech stack</li>
            <li>✓ Send personalized applications</li>
          </ul>
        </button>

        {/* Clients Card */}
        <button
          onClick={() => onSelect('clients')}
          className="p-8 rounded-lg border-2 border-slate-800 bg-slate-900 hover:border-blue-500 hover:bg-slate-800 transition-all text-left text-slate-100"
        >
          <div className="text-4xl mb-3">🎯</div>
          <h3 className="text-xl font-bold text-white mb-2">Looking for Clients</h3>
          <p className="text-slate-300 mb-4">
            Extract companies, research their needs, send targeted pitches
          </p>
          <ul className="text-sm text-slate-300 space-y-2">
            <li>✓ Extract companies & decision makers</li>
            <li>✓ Research hiring & tech needs</li>
            <li>✓ Send warm outreach sequences</li>
          </ul>
        </button>
      </div>
    </div>
  )
}

// Source-Specific Component
function SourceSpecificComponent({
  source,
  goal,
  onRecipientSelected,
  isLoading,
  extractionJobId,
  extractionType,
  onJobCreated,
}: {
  source: DataSource
  goal: string
  onRecipientSelected: (recipients: any[], count: number) => void
  isLoading: boolean
  extractionJobId?: string
  extractionType?: 'ultra' | 'mobiadz'
  onJobCreated: (jobId: string, type: 'ultra' | 'mobiadz') => void
}) {
  if (source === 'csv') {
    return <CSVImportFlow onRecipientSelected={onRecipientSelected} />
  }

  if (source === 'group') {
    return <RecipientGroupSelector onGroupSelected={onRecipientSelected} isLoading={isLoading} />
  }

  if (source === 'applications') {
    return <ApplicationSelector onApplicationsSelected={onRecipientSelected} isLoading={isLoading} />
  }

  if (source === 'manual') {
    return <ManualEntry onRecipientSelected={onRecipientSelected} />
  }

  if (source === 'ultra') {
    return (
      <ULTRAExtraction
        onRecipientSelected={onRecipientSelected}
        goal={goal}
        initialJobId={extractionType === 'ultra' ? extractionJobId : undefined}
        onJobCreated={(jobId) => onJobCreated(jobId, 'ultra')}
      />
    )
  }

  if (source === 'mobiadz') {
    return (
      <MobiAdzExtraction
        onRecipientSelected={onRecipientSelected}
        goal={goal}
        initialJobId={extractionType === 'mobiadz' ? extractionJobId : undefined}
        onJobCreated={(jobId) => onJobCreated(jobId, 'mobiadz')}
      />
    )
  }

  return null
}
