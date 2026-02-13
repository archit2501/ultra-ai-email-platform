'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Plus, Zap, Users, Calendar, Trash2, Play } from 'lucide-react'
import { getAllDrafts, getDraft, deleteDraft, calculateProgress, getSourceDisplayName, type DraftCampaignListItem } from '@/utils/draftCampaigns'
import { useCampaignDraft } from '@/hooks/useCampaignDraft'

export default function CampaignsDashboard() {
  const router = useRouter()
  const { draft, resetDraft, loadDraft } = useCampaignDraft()
  const [drafts, setDrafts] = useState<DraftCampaignListItem[]>([])

  const loadDrafts = () => {
    const allDrafts = getAllDrafts()
    setDrafts(allDrafts)
  }

  useEffect(() => {
    loadDrafts()
  }, [])

  const handleNewCampaign = () => {
    resetDraft()
    router.push('/campaigns/create/step1-source')
  }

  const handleContinueDraft = (draftId: string) => {
    const selectedDraft = drafts.find(d => d.id === draftId)
    if (!selectedDraft) return

    // Load the full draft from localStorage
    const fullDraft = getDraft(draftId)
    if (fullDraft) {
      loadDraft(fullDraft)
    }

    // Navigate to the appropriate step
    const stepRoutes = [
      '/campaigns/create/step1-source',
      '/campaigns/create/step2-enrich',
      '/campaigns/create/step3-template',
      '/campaigns/create/step4-send',
    ]
    
    router.push(stepRoutes[selectedDraft.step - 1])
  }

  const handleDeleteDraft = (draftId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this draft?')) {
      deleteDraft(draftId)
      loadDrafts()
      
      // Reset current draft if it's the one being deleted
      if (draft.id === draftId) {
        resetDraft()
      }
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Campaigns</h1>
              <p className="text-slate-400 mt-1">Create and manage bulk outreach campaigns</p>
            </div>
            <Button onClick={handleNewCampaign} className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              Create Campaign
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {drafts.length > 0 ? (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-white">Draft Campaigns</h2>
              <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                {drafts.length}
              </Badge>
            </div>

            <div className="grid gap-4">
              {drafts.map((draft) => {
                const progress = calculateProgress(draft)
                const sourceDisplay = getSourceDisplayName(draft.source)

                return (
                  <Card 
                    key={draft.id} 
                    className="bg-slate-900 border-slate-800 hover:border-blue-600 transition-colors cursor-pointer"
                    onClick={() => handleContinueDraft(draft.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-white">
                              {draft.campaignName || 'Untitled Campaign'}
                            </CardTitle>
                            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
                              Draft
                            </Badge>
                            {draft.goal && (
                              <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                                {draft.goal === 'jobs' ? 'Job Seeker' : 'Client Acquisition'}
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="text-slate-400">
                            Last updated {formatDate(draft.updatedAt)}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleContinueDraft(draft.id)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Play className="mr-1 h-3 w-3" />
                            Continue
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => handleDeleteDraft(draft.id, e)}
                            className="text-slate-400 hover:text-red-500 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Progress */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400">Progress</span>
                            <span className="text-white font-medium">Step {draft.step} of 4</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-slate-500" />
                            <span className="text-slate-400">
                              {draft.recipientCount || 0} recipient{draft.recipientCount !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Zap className="h-4 w-4 text-slate-500" />
                            <span className="text-slate-400">{sourceDisplay}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-slate-500" />
                            <span className="text-slate-400">
                              {new Date(draft.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center text-center space-y-6 py-16">
            <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center">
              <Zap className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">No campaigns yet</h2>
              <p className="text-slate-400 max-w-md">
                Create your first campaign to start managing bulk outreach. Select your data source, enrich recipients, choose templates, and send.
              </p>
            </div>
            <Button 
              onClick={handleNewCampaign} 
              size="lg"
              className="gap-2 mt-4 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              Create Your First Campaign
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
