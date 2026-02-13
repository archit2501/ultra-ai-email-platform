'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCampaignDraft } from '@/hooks/useCampaignDraft'
import apiClient, { groupCampaignsAPI } from '@/lib/api'
import { toast } from 'sonner'
import { 
  ArrowLeft, Send, Calendar, Clock, Mail, AlertCircle, CheckCircle2,
  ChevronDown, ChevronUp, Zap, TrendingUp, Users, Eye, Filter,
  Briefcase, Target, Brain, Code2, Gauge, Radio, AlertTriangle,
  Edit2, Trash2, Globe
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { syncDraftToList } from '@/utils/draftCampaigns'
import { SendTimeOptimization } from '@/components/campaigns/SendTimeOptimization'
import { BatchConfiguration } from '@/components/campaigns/BatchConfiguration'
import { CampaignRules } from '@/components/campaigns/CampaignRules'
import { CampaignControls, type CampaignState } from '@/components/campaigns/CampaignControls'
import { CampaignPerformanceMonitor } from '@/components/campaigns/CampaignPerformanceMonitor'
import { FraudAccountReviewModal, type FraudAccount } from '@/components/campaigns/FraudAccountReviewModal'
import { EmailAuthVerification } from '@/components/campaigns/EmailAuthVerification'
import { AdvancedAnalyticsDashboard } from '@/components/campaigns/AdvancedAnalyticsDashboard'
import { BestPracticeInfo, BestPracticesCard, BestPracticeIndicator } from '@/components/campaigns/BestPractices2026'
import { OptimalSendTimeDialog } from '@/components/ml-analytics'

type SendMethod = 'immediate' | 'scheduled' | 'rate_limited'

interface PreSendCheck {
  category: string
  passed: boolean
  message: string
  icon: React.ReactNode
}

export default function Step4Page() {
  const router = useRouter()
  const { draft, updateDraft, updateStep4, setStep } = useCampaignDraft()
  const [loading, setLoading] = useState(false)

  // Form state
  const [campaignTitle, setCampaignTitle] = useState('')
  const [sendMethod, setSendMethod] = useState<SendMethod | null>(null)
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('09:00')
  const [dailyLimit, setDailyLimit] = useState('100')
  const [delaySeconds, setDelaySeconds] = useState('30')
  const [useBusinessHours, setUseBusinessHours] = useState(true)
  const [useRecipientTimezone, setUseRecipientTimezone] = useState(true)

  // Advanced options
  const [expandAdvanced, setExpandAdvanced] = useState(false)
  const [enableFollowUp, setEnableFollowUp] = useState(false)
  const [enableOpenTracking, setEnableOpenTracking] = useState(true)
  const [enableSendTimeOpt, setEnableSendTimeOpt] = useState(draft.step2.enableSendTimeOptimization || false)

  // Follow-up configuration state
  const [followUpSequenceId, setFollowUpSequenceId] = useState<number | null>(null)
  const [followUpSequences, setFollowUpSequences] = useState<any[]>([])
  const [selectedSequence, setSelectedSequence] = useState<any>(null)
  const [followUpStopOnReply, setFollowUpStopOnReply] = useState(true)
  const [followUpStopOnBounce, setFollowUpStopOnBounce] = useState(false)
  const [loadingSequences, setLoadingSequences] = useState(false)

  // UI state
  const [expandEnrichment, setExpandEnrichment] = useState(false)
  const [expandRecipients, setExpandRecipients] = useState(false)
  const [showAllRecipients, setShowAllRecipients] = useState(false)
  const [expandFollowUp, setExpandFollowUp] = useState(false)

  // New component states
  const [batchConfig, setBatchConfig] = useState({ batchSize: 50, totalBatches: 0, interBatchDelay: 5, totalRecipients: 0, estimatedDuration: 0 })
  const [campaignRules, setCampaignRules] = useState<any[]>([])
  const [campaignState, setCampaignState] = useState<CampaignState>('draft')
  const [showFraudReview, setShowFraudReview] = useState(false)
  const [campaignActive, setCampaignActive] = useState(false)

  // Group analytics state
  const [groupAnalytics, setGroupAnalytics] = useState<any>(null)

  // ML optimal send time dialog
  const [showOptimalTimeDialog, setShowOptimalTimeDialog] = useState(false)
  const [groupAnalyticsLoading, setGroupAnalyticsLoading] = useState(false)
  const [groupAnalyticsError, setGroupAnalyticsError] = useState<string | null>(null)

  // Initialize from draft
  useEffect(() => {
    if (draft.campaignName) {
      setCampaignTitle(draft.campaignName)
    }
    if (draft.step4.sendMethod) {
      setSendMethod(draft.step4.sendMethod)
    }
    if (draft.step4.enableFollowUp !== undefined) {
      setEnableFollowUp(draft.step4.enableFollowUp)
    }
    if (draft.step4.enableOpenTracking !== undefined) {
      setEnableOpenTracking(draft.step4.enableOpenTracking)
    }
  }, [draft])

  // Sync to draft
  useEffect(() => {
    if (draft.id && draft.createdAt) {
      syncDraftToList(draft)
    }
  }, [draft])

  // Sync form state to draft
  useEffect(() => {
    if (sendMethod || campaignTitle || enableFollowUp !== undefined) {
      updateStep4({
        campaignTitle: campaignTitle || undefined,
        sendMethod: sendMethod || undefined,
        enableFollowUp,
        enableOpenTracking,
        followUpSequenceId: enableFollowUp && followUpSequenceId ? followUpSequenceId : undefined,
        followUpStopOnReply,
        followUpStopOnBounce,
      })
    }
  }, [campaignTitle, sendMethod, enableFollowUp, enableOpenTracking, followUpSequenceId, followUpStopOnReply, followUpStopOnBounce, updateStep4])

  // Fetch group campaigns when source is 'group'
  useEffect(() => {
    if (draft.step1.source === 'group' && draft.step1.selectedGroupId) {
      const fetchGroupCampaigns = async () => {
        try {
          setGroupAnalyticsLoading(true)
          setGroupAnalyticsError(null)
          const response = await groupCampaignsAPI.getGroupCampaigns(
            draft.step1.selectedGroupId!,
            { limit: 5 }
          )
          setGroupAnalytics(response.data)
        } catch (error: any) {
          console.error('Failed to fetch group campaigns:', error)
          setGroupAnalyticsError('Could not load group campaign history')
        } finally {
          setGroupAnalyticsLoading(false)
        }
      }
      fetchGroupCampaigns()
    }
  }, [draft.step1.source, draft.step1.selectedGroupId])

  // Fetch follow-up sequences when enableFollowUp is enabled
  useEffect(() => {
    if (enableFollowUp) {
      const fetchSequences = async () => {
        try {
          setLoadingSequences(true)
          const response = await apiClient.get('/follow-up/sequences')
          if (response.data?.items) {
            setFollowUpSequences(response.data.items)
            // Auto-select the first one if available
            if (response.data.items.length > 0 && !followUpSequenceId) {
              const firstSequence = response.data.items[0]
              setFollowUpSequenceId(firstSequence.id)
              setSelectedSequence(firstSequence)
            }
          }
        } catch (error: any) {
          console.error('Failed to fetch follow-up sequences:', error)
          toast.error('Could not load follow-up sequences')
        } finally {
          setLoadingSequences(false)
        }
      }
      fetchSequences()
    }
  }, [enableFollowUp])

  const handleBack = () => {
    setStep(3)
    router.push('/campaigns/create/step3-template')
  }

  const calculateQualityScore = (): number => {
    let score = 50 // Base
    const recipientCount = draft.step1.recipientCount || 0
    
    // Email validation bonus
    if (draft.step2.enableEmailValidation) score += 15
    // Enrichment bonus
    if (draft.step2.enrichmentDepth === 'deep') score += 15
    else if (draft.step2.enrichmentDepth === 'standard') score += 10
    
    // Features enabled bonus
    let featuresEnabled = 0
    if (draft.step2.enableCompanyIntelligence) featuresEnabled++
    if (draft.step2.enablePersonIntelligence) featuresEnabled++
    if (draft.step2.enableSkillMatching) featuresEnabled++
    if (draft.step2.enableTechStackMatching) featuresEnabled++
    
    score += Math.min(featuresEnabled * 3, 10)
    return Math.min(score, 100)
  }

  const calculateEstimatedCompletion = (): string => {
    const recipientCount = draft.step1.recipientCount || 0
    
    if (sendMethod === 'immediate') {
      const minutes = Math.ceil(recipientCount / 100)
      const completion = new Date(Date.now() + minutes * 60000)
      return `~${minutes} min (${completion.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
    } else if (sendMethod === 'scheduled' && scheduledDate && scheduledTime) {
      const [hours, mins] = scheduledTime.split(':')
      const scheduledDateTime = new Date(scheduledDate)
      scheduledDateTime.setHours(parseInt(hours), parseInt(mins))
      return scheduledDateTime.toLocaleString()
    } else if (sendMethod === 'rate_limited') {
      const limit = parseInt(dailyLimit) || 100
      const days = Math.ceil(recipientCount / limit)
      const completion = new Date(Date.now() + days * 24 * 60000)
      return `${days} days (${completion.toLocaleDateString()})`
    }
    return 'Not configured'
  }

  const getPreSendChecks = (): PreSendCheck[] => {
    const recipientCount = draft.step1.recipientCount || 0
    const hasTemplate = !!(draft.step3.templateId || draft.step3.selectedTone)
    const hasSendMethod = !!sendMethod
    
    return [
      {
        category: 'Recipients',
        passed: recipientCount > 0,
        message: recipientCount > 0 ? `✅ ${recipientCount} recipients loaded` : '❌ No recipients selected',
        icon: <Users className="w-4 h-4" />
      },
      {
        category: 'Template',
        passed: hasTemplate,
        message: hasTemplate ? `✅ ${draft.step3.selectedTone || 'Template'} template selected` : '❌ No template selected',
        icon: <Mail className="w-4 h-4" />
      },
      {
        category: 'Send Configuration',
        passed: hasSendMethod,
        message: hasSendMethod ? `✅ Send method: ${sendMethod}` : '❌ Send method not selected',
        icon: <Send className="w-4 h-4" />
      },
      {
        category: 'Enrichment',
        passed: !!draft.step2.enrichmentDepth,
        message: `✅ Enrichment: ${draft.step2.enrichmentDepth || 'standard'}`,
        icon: <Zap className="w-4 h-4" />
      }
    ]
  }

  const handleLaunch = async () => {
    const checks = getPreSendChecks()
    const allPassed = checks.every(c => c.passed)
    
    if (!allPassed) {
      toast.error('Please complete all required fields before launching')
      return
    }

    setLoading(true)
    try {
      const campaignName = campaignTitle || draft.campaignName || 'Untitled Campaign'
      
      // If source is 'group', use the group campaign creation endpoint
      if (draft.step1.source === 'group' && draft.step1.selectedGroupId) {
        const response = await apiClient.post('/campaigns/from-group', {
          group_id: draft.step1.selectedGroupId,
          campaign_name: campaignName,
          template_id: draft.step3.templateId,
          template_tone: draft.step3.selectedTone,
          send_method: sendMethod,
          scheduled_at: sendMethod === 'scheduled' && scheduledDate ? 
            new Date(`${scheduledDate}T${scheduledTime}`).toISOString() : undefined,
          daily_limit: sendMethod === 'rate_limited' ? parseInt(dailyLimit) : undefined,
          delay_seconds: sendMethod === 'rate_limited' ? parseInt(delaySeconds) : undefined,
          use_business_hours: useBusinessHours,
          use_recipient_timezone: useRecipientTimezone,
          enable_follow_up: enableFollowUp,
          follow_up_sequence_id: enableFollowUp && followUpSequenceId ? followUpSequenceId : undefined,
          follow_up_stop_on_reply: followUpStopOnReply,
          follow_up_stop_on_bounce: followUpStopOnBounce,
          enable_open_tracking: enableOpenTracking,
          enrichment_config: draft.step2,
        })
        
        if (response.data?.campaign_id) {
          toast.success(`🚀 Group campaign "${response.data.campaign_name}" created with ${response.data.total_recipients} recipients!`)
          setStep(5)
          // Redirect to Step 5 (Follow-Up Management) after a short delay
          setTimeout(() => {
            router.push(`/campaigns/create/step5-followup?campaignId=${response.data.campaign_id}`)
          }, 1500)
        }
      } else {
        // Use the standard campaign creation endpoint for other sources
        const payload = {
          campaign_name: campaignName,
          recipients: draft.step1.recipients || [],
          template_id: draft.step3.templateId,
          template_tone: draft.step3.selectedTone,
          send_method: sendMethod,
          scheduled_at: sendMethod === 'scheduled' && scheduledDate ? 
            new Date(`${scheduledDate}T${scheduledTime}`).toISOString() : undefined,
          daily_limit: sendMethod === 'rate_limited' ? parseInt(dailyLimit) : undefined,
          delay_seconds: sendMethod === 'rate_limited' ? parseInt(delaySeconds) : undefined,
          use_business_hours: useBusinessHours,
          use_recipient_timezone: useRecipientTimezone,
          enable_follow_up: enableFollowUp,
          follow_up_sequence_id: enableFollowUp && followUpSequenceId ? followUpSequenceId : undefined,
          follow_up_stop_on_reply: followUpStopOnReply,
          follow_up_stop_on_bounce: followUpStopOnBounce,
          enable_open_tracking: enableOpenTracking,
          enrichment_config: draft.step2,
        }

        const response = await apiClient.post('/campaigns', payload)
        
        if (response.data?.id) {
          toast.success('🚀 Campaign launched successfully!')
          setStep(5)
          // Redirect to Step 5 (Follow-Up Management) after a short delay
          setTimeout(() => {
            router.push(`/campaigns/create/step5-followup?campaignId=${response.data.id}`)
          }, 1500)
        }
      }
    } catch (error: any) {
      console.error('Launch error:', error)
      toast.error(error.response?.data?.detail || 'Failed to launch campaign')
    } finally {
      setLoading(false)
    }
  }

  const recipientCount = draft.step1.recipientCount || 0
  const qualityScore = calculateQualityScore()
  const estimatedCompletion = calculateEstimatedCompletion()
  const checks = getPreSendChecks()
  const allChecksPassed = checks.every(c => c.passed)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/70 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="flex items-center gap-2 text-slate-200 hover:text-white hover:bg-slate-800/60"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Create Campaign</h1>
            <p className="text-slate-400 mt-1">Step 4 of 5: Send Options</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-slate-900/60 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-3">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                    step === 4
                      ? 'bg-blue-600 text-white shadow-[0_0_0_4px_rgba(59,130,246,0.2)]'
                      : step < 4
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {step}
                </div>
                {step < 5 && (
                  <div className={`flex-1 h-1 mx-2 rounded-full ${step < 4 ? 'bg-green-600' : 'bg-slate-800'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Campaign Summary Panel */}
          <div className="p-6 rounded-lg border-2 border-slate-800 bg-slate-900">
            <h3 className="text-lg font-semibold text-white mb-4">📊 Campaign Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm mb-4">
              <div>
                <p className="text-slate-400">Recipients</p>
                <p className="text-white font-semibold">{recipientCount}</p>
              </div>
              <div>
                <p className="text-slate-400">Goal</p>
                <p className="text-white font-semibold capitalize">{draft.goal || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-400">Source</p>
                <p className="text-white font-semibold text-xs capitalize">{draft.step1.source?.replace('_', ' ') || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-400">Enrichment</p>
                <p className="text-white font-semibold capitalize">{draft.step2.enrichmentDepth || 'Standard'}</p>
              </div>
              <div>
                <p className="text-slate-400">Template</p>
                <p className="text-white font-semibold capitalize">{draft.step3.selectedTone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-400">Send Method</p>
                <p className="text-white font-semibold capitalize">{sendMethod?.replace('_', ' ') || 'TBD'}</p>
              </div>
            </div>

            {/* Quality Score & Duration */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
              <div>
                <p className="text-xs text-slate-400 mb-2">Quality Score</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all"
                      style={{ width: `${qualityScore}%` }}
                    />
                  </div>
                  <span className="text-white font-bold text-sm">{qualityScore}%</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-2">Estimated Duration</p>
                <p className="text-white font-semibold text-sm">{estimatedCompletion}</p>
              </div>
            </div>

            {/* Group Information (if source is group) */}
            {draft.step1.source === 'group' && draft.step1.selectedGroupId && (
              <div className="mt-4 pt-4 border-t border-slate-700 space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-blue-400" />
                  <h4 className="text-sm font-semibold text-white">Group Campaign Details</h4>
                </div>
                
                {/* Group Basic Info */}
                <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Group ID:</span>
                    <span className="text-white font-mono">{draft.step1.selectedGroupId}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">All recipients from group:</span>
                    <span className="text-blue-400 font-semibold">Auto-populated on send</span>
                  </div>
                </div>

                {/* Group Analytics History */}
                {groupAnalyticsLoading ? (
                  <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                    <p className="text-sm text-slate-400">Loading group analytics...</p>
                  </div>
                ) : groupAnalytics ? (
                  <div className="space-y-3">
                    {/* Group Name & Overview */}
                    {groupAnalytics.group_name && (
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <p className="text-xs text-slate-400 mb-1">Group Name</p>
                        <p className="text-sm font-semibold text-white">{groupAnalytics.group_name}</p>
                      </div>
                    )}

                    {/* Aggregated Metrics */}
                    {groupAnalytics.aggregated_metrics && (
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <p className="text-xs text-slate-400 mb-2 font-semibold uppercase">Aggregated Metrics</p>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <p className="text-slate-400">Total Sent</p>
                            <p className="text-white font-semibold">{groupAnalytics.aggregated_metrics.total_sent}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Opened</p>
                            <p className="text-white font-semibold">{groupAnalytics.aggregated_metrics.total_opened}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Replied</p>
                            <p className="text-white font-semibold">{groupAnalytics.aggregated_metrics.total_replied}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                          <div>
                            <p className="text-slate-400">Open Rate</p>
                            <p className="text-blue-400 font-semibold">{(groupAnalytics.aggregated_metrics.combined_open_rate * 100).toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Reply Rate</p>
                            <p className="text-green-400 font-semibold">{(groupAnalytics.aggregated_metrics.combined_reply_rate * 100).toFixed(1)}%</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Recent Campaigns */}
                    {groupAnalytics.campaigns && groupAnalytics.campaigns.length > 0 && (
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <p className="text-xs text-slate-400 mb-2 font-semibold uppercase">Recent Campaigns ({groupAnalytics.campaigns.length})</p>
                        <div className="space-y-1 max-h-24 overflow-y-auto">
                          {groupAnalytics.campaigns.map((campaign: any, idx: number) => (
                            <div key={idx} className="text-xs p-1.5 bg-slate-700/50 rounded flex justify-between items-center">
                              <span className="text-slate-300 truncate">{campaign.campaign_name}</span>
                              <span className="text-slate-500 ml-2">{campaign.sent_count}/{campaign.total_recipients}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : groupAnalyticsError ? (
                  <div className="bg-slate-800/50 rounded-lg p-3 text-sm text-slate-400">
                    {groupAnalyticsError}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Send Strategy Selection */}
          {!sendMethod ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2 text-white">⚙️  Choose Send Strategy</h2>
                <p className="text-slate-400">How would you like to send your campaign?</p>
              </div>

              <div className="space-y-3">
                {/* Immediate Send */}
                <div 
                  onClick={() => setSendMethod('immediate')}
                  className="p-4 rounded-lg border-2 border-slate-700 bg-slate-800/50 hover:border-blue-500 hover:bg-slate-800 cursor-pointer transition-all"
                >
                  <div className="flex items-start gap-3">
                    <Radio className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">Immediate Send</h3>
                      <p className="text-slate-400 text-sm mt-1">Send all emails right now to all recipients</p>
                      <p className="text-emerald-400 text-xs mt-2">Estimated: {Math.ceil(recipientCount / 100)} minutes</p>
                    </div>
                  </div>
                </div>

                {/* Scheduled Send */}
                <div 
                  onClick={() => setSendMethod('scheduled')}
                  className="p-4 rounded-lg border-2 border-slate-700 bg-slate-800/50 hover:border-blue-500 hover:bg-slate-800 cursor-pointer transition-all"
                >
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-amber-500 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">Schedule for Later</h3>
                      <p className="text-slate-400 text-sm mt-1">Pick a specific date and time to start sending</p>
                    </div>
                  </div>
                </div>

                {/* Rate Limited */}
                <div 
                  onClick={() => setSendMethod('rate_limited')}
                  className="p-4 rounded-lg border-2 border-slate-700 bg-slate-800/50 hover:border-blue-500 hover:bg-slate-800 cursor-pointer transition-all"
                >
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-purple-500 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">Rate Limited</h3>
                      <p className="text-slate-400 text-sm mt-1">Spread sends over multiple days with rate limiting</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Selected Strategy Details */}
              <div className="p-6 rounded-lg border-2 border-blue-800 bg-blue-900/20">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">
                    {sendMethod === 'immediate' && '🚀 Immediate Send'}
                    {sendMethod === 'scheduled' && '📅 Scheduled Send'}
                    {sendMethod === 'rate_limited' && '⏱️  Rate Limited Send'}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSendMethod(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    Change
                  </Button>
                </div>

                {sendMethod === 'scheduled' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-400 mb-2">Date</label>
                        <Input
                          type="date"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          className="bg-slate-800 border-slate-700 text-white"
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-2">Time</label>
                        <Input
                          type="time"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {sendMethod === 'rate_limited' && (
                  <div className="space-y-4">
                    {/* 2026 Best Practices Card */}
                    <BestPracticesCard />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                          Daily Limit
                          <BestPracticeInfo practiceKey="dailyLimit" />
                        </label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={dailyLimit}
                            onChange={(e) => setDailyLimit(e.target.value)}
                            min="1"
                            max="100"
                            className="bg-slate-800 border-slate-700 text-white flex-1"
                          />
                          <BestPracticeIndicator
                            currentValue={parseInt(dailyLimit) || 0}
                            practiceKey="dailyLimit"
                          />
                        </div>
                        {parseInt(dailyLimit) > 50 && (
                          <p className="text-xs text-amber-400 mt-1">
                            Exceeds 2026 recommended limit of 50/day
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                          Delay Between Emails (seconds)
                          <BestPracticeInfo practiceKey="delayBetweenEmails" />
                        </label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={delaySeconds}
                            onChange={(e) => setDelaySeconds(e.target.value)}
                            min="30"
                            className="bg-slate-800 border-slate-700 text-white flex-1"
                          />
                          <BestPracticeIndicator
                            currentValue={parseInt(delaySeconds) || 0}
                            practiceKey="delayBetweenEmails"
                          />
                        </div>
                        {parseInt(delaySeconds) < 30 && (
                          <p className="text-xs text-red-400 mt-1">
                            Minimum 30 seconds required for deliverability
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-slate-300">
                          <Zap className="w-4 h-4" />
                          Only business hours (9 AM - 6 PM)
                        </label>
                        <Switch 
                          checked={useBusinessHours}
                          onCheckedChange={setUseBusinessHours}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-slate-300">
                          <Globe className="w-4 h-4" />
                          Use recipient's local timezone
                        </label>
                        <Switch 
                          checked={useRecipientTimezone}
                          onCheckedChange={setUseRecipientTimezone}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Advanced Options */}
              <div className="border border-slate-700 rounded-lg bg-slate-900/30">
                <button
                  onClick={() => setExpandAdvanced(!expandAdvanced)}
                  className="w-full p-4 flex items-center justify-between hover:bg-slate-800/50 transition"
                >
                  <h3 className="text-lg font-semibold text-white">🔧 Advanced Options</h3>
                  {expandAdvanced ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>

                {expandAdvanced && (
                  <div className="p-4 border-t border-slate-700 space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-slate-300">
                        <Zap className="w-4 h-4" />
                        Send-Time Optimization
                        <span className="text-xs text-slate-500">(from Step 2)</span>
                      </label>
                      <Switch 
                        checked={enableSendTimeOpt && draft.step2.enableSendTimeOptimization}
                        onCheckedChange={setEnableSendTimeOpt}
                        disabled={!draft.step2.enableSendTimeOptimization}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-slate-300">
                        <Eye className="w-4 h-4" />
                        Open Tracking
                      </label>
                      <Switch 
                        checked={enableOpenTracking}
                        onCheckedChange={setEnableOpenTracking}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-slate-300">
                        <Zap className="w-4 h-4" />
                        Enable Follow-Ups
                        <BestPracticeInfo practiceKey="followUpCount" />
                      </label>
                      <Switch
                        checked={enableFollowUp}
                        onCheckedChange={setEnableFollowUp}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Follow-Up Configuration */}
              {enableFollowUp && (
                <div className="border border-slate-700 rounded-lg bg-slate-900/30">
                  <button
                    onClick={() => setExpandFollowUp(!expandFollowUp)}
                    className="w-full p-4 flex items-center justify-between hover:bg-slate-800/50 transition"
                  >
                    <h3 className="text-lg font-semibold text-white">
                      ⚡ Follow-Up Sequence Configuration
                    </h3>
                    {expandFollowUp ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>

                  {expandFollowUp && (
                    <div className="p-4 border-t border-slate-700 space-y-4">
                      {loadingSequences ? (
                        <div className="p-4 text-center text-slate-400">
                          Loading follow-up sequences...
                        </div>
                      ) : followUpSequences.length === 0 ? (
                        <div className="p-4 bg-amber-900/20 border border-amber-600 rounded text-amber-400 text-sm">
                          No follow-up sequences available. Create one first.
                        </div>
                      ) : (
                        <>
                          {/* Sequence Selection */}
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-300">Select Follow-Up Sequence</label>
                            <select
                              value={followUpSequenceId || ''}
                              onChange={(e) => {
                                const seqId = parseInt(e.target.value)
                                setFollowUpSequenceId(seqId)
                                const seq = followUpSequences.find(s => s.id === seqId)
                                setSelectedSequence(seq)
                              }}
                              className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-600 text-white text-sm"
                            >
                              <option value="">Choose a sequence...</option>
                              {followUpSequences.map((seq) => (
                                <option key={seq.id} value={seq.id}>
                                  {seq.name} {seq.is_system_preset ? '(System)' : ''} - {seq.steps?.length || 0} steps
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Sequence Details */}
                          {selectedSequence && (
                            <div className="p-3 rounded bg-slate-800/50 border border-slate-600 space-y-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-300">{selectedSequence.name}</p>
                                {selectedSequence.description && (
                                  <p className="text-xs text-slate-400 mt-1">{selectedSequence.description}</p>
                                )}
                              </div>

                              {/* Sequence Steps Preview */}
                              {selectedSequence.steps && selectedSequence.steps.length > 0 && (
                                <div className="space-y-2">
                                  <p className="text-xs font-semibold text-slate-300">Steps Preview</p>
                                  <div className="space-y-1">
                                    {selectedSequence.steps.map((step: any, idx: number) => (
                                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/50 p-2 rounded">
                                        <span className="font-semibold text-slate-300 w-6">{step.step_number}.</span>
                                        <span>Delay: {step.delay_days}d {step.delay_hours}h</span>
                                        <span className="text-slate-500">•</span>
                                        <span className="capitalize">{step.tone || 'default'} tone</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Stop Conditions */}
                              <div className="border-t border-slate-600 pt-3 space-y-2">
                                <p className="text-xs font-semibold text-slate-300">Stop Conditions</p>
                                <div className="flex items-center justify-between">
                                  <label className="text-xs text-slate-400">Stop if recipient replies</label>
                                  <Switch
                                    checked={followUpStopOnReply}
                                    onCheckedChange={setFollowUpStopOnReply}
                                  />
                                </div>
                                <div className="flex items-center justify-between">
                                  <label className="text-xs text-slate-400">Stop if email bounces</label>
                                  <Switch
                                    checked={followUpStopOnBounce}
                                    onCheckedChange={setFollowUpStopOnBounce}
                                  />
                                </div>
                              </div>

                              {/* Performance Stats */}
                              {selectedSequence.reply_rate !== null && (
                                <div className="border-t border-slate-600 pt-3">
                                  <div className="grid grid-cols-3 gap-2 text-xs">
                                    <div className="bg-emerald-900/20 rounded p-2 text-center">
                                      <p className="text-emerald-400 font-semibold">{selectedSequence.reply_rate}%</p>
                                      <p className="text-slate-400">Reply Rate</p>
                                    </div>
                                    <div className="bg-blue-900/20 rounded p-2 text-center">
                                      <p className="text-blue-400 font-semibold">{selectedSequence.times_used || 0}</p>
                                      <p className="text-slate-400">Times Used</p>
                                    </div>
                                    <div className="bg-cyan-900/20 rounded p-2 text-center">
                                      <p className="text-cyan-400 font-semibold">{selectedSequence.successful_replies || 0}</p>
                                      <p className="text-slate-400">Replies</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Enrichment Summary */}
              {(draft.step2.enableEmailValidation || 
                draft.step2.enableFraudDetection || 
                draft.step2.enableDuplicateRemoval || 
                draft.step2.enableSkillMatching || 
                draft.step2.enableTechStackMatching) && (
                <div className="border border-slate-700 rounded-lg bg-slate-900/30">
                  <button
                    onClick={() => setExpandEnrichment(!expandEnrichment)}
                    className="w-full p-4 flex items-center justify-between hover:bg-slate-800/50 transition"
                  >
                    <h3 className="text-lg font-semibold text-white">📚 Enrichment Summary</h3>
                    {expandEnrichment ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>

                  {expandEnrichment && (
                    <div className="p-4 border-t border-slate-700 space-y-3">
                      {draft.step2.enableEmailValidation && (
                        <div className="p-3 rounded bg-emerald-900/20 border-l-2 border-emerald-600">
                          <p className="font-semibold text-emerald-400 text-sm">✅ Email Validation Enabled</p>
                          <p className="text-xs text-slate-400 mt-1">Invalid emails will be excluded from send</p>
                        </div>
                      )}
                      {draft.step2.enableFraudDetection && (
                        <div className="p-3 rounded bg-red-900/20 border-l-2 border-red-600">
                          <p className="font-semibold text-red-400 text-sm">🚨 Fraud Detection Enabled</p>
                          <p className="text-xs text-slate-400 mt-1">Suspicious accounts will be flagged for review</p>
                        </div>
                      )}
                      {draft.step2.enableDuplicateRemoval && (
                        <div className="p-3 rounded bg-amber-900/20 border-l-2 border-amber-600">
                          <p className="font-semibold text-amber-400 text-sm">⚠️  Duplicate Removal Enabled</p>
                          <p className="text-xs text-slate-400 mt-1">Duplicate recipients will be automatically removed</p>
                        </div>
                      )}
                      {draft.step2.enableSkillMatching && (
                        <div className="p-3 rounded bg-cyan-900/20 border-l-2 border-cyan-600">
                          <p className="font-semibold text-cyan-400 text-sm">🎯 Skill Matching Enabled</p>
                          <p className="text-xs text-slate-400 mt-1">Emails personalized based on skill matches</p>
                        </div>
                      )}
                      {draft.step2.enableTechStackMatching && (
                        <div className="p-3 rounded bg-green-900/20 border-l-2 border-green-600">
                          <p className="font-semibold text-green-400 text-sm">💻 Tech Stack Matching Enabled</p>
                          <p className="text-xs text-slate-400 mt-1">Company tech stack detection active</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Recipients Preview */}
              <div className="border border-slate-700 rounded-lg bg-slate-900/30">
                <button
                  onClick={() => setExpandRecipients(!expandRecipients)}
                  className="w-full p-4 flex items-center justify-between hover:bg-slate-800/50 transition"
                >
                  <h3 className="text-lg font-semibold text-white">👥 Recipients Preview ({recipientCount})</h3>
                  {expandRecipients ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>

                {expandRecipients && (
                  <div className="p-4 border-t border-slate-700 space-y-2">
                    {draft.step1.recipients?.slice(0, showAllRecipients ? undefined : 5).map((recipient, idx) => (
                      <div key={recipient.id || idx} className="p-3 rounded bg-slate-800/50 flex items-center justify-between text-sm">
                        <div>
                          <p className="text-white font-semibold">{recipient.name || 'N/A'}</p>
                          <p className="text-slate-400 text-xs">{recipient.email}</p>
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      </div>
                    ))}
                    {recipientCount > 5 && !showAllRecipients && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAllRecipients(true)}
                        className="w-full text-blue-400 hover:text-blue-300"
                      >
                        Show {recipientCount - 5} more recipients
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Pre-Send Checklist */}
              <div className="border border-slate-700 rounded-lg bg-slate-900/30 p-4">
                <h3 className="text-lg font-semibold text-white mb-4">✅ Pre-Send Checklist</h3>
                <div className="space-y-3">
                  {checks.map((check) => (
                    <div key={check.category} className="flex items-start gap-3 p-3 rounded bg-slate-800/50">
                      <div className={check.passed ? 'text-emerald-400' : 'text-red-400'}>
                        {check.icon}
                      </div>
                      <div>
                        <p className={check.passed ? 'text-emerald-400' : 'text-red-400'} style={{fontSize: '0.875rem'}}>
                          {check.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* New Components Section */}
              <div className="space-y-6 pt-6">
                {/* ML-Powered Send Time Analysis */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10 border border-purple-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/20">
                        <Brain className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white">ML-Powered Send Time</h4>
                        <p className="text-sm text-slate-400">Get AI recommendations based on engagement data</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => setShowOptimalTimeDialog(true)}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Analyze Optimal Time
                    </Button>
                  </div>
                </div>

                {/* Send Time Optimization */}
                <SendTimeOptimization 
                  recipients={draft.step1.recipients?.map((r, idx) => ({
                    recipientId: r.id || idx,
                    recipientName: r.name || 'Unknown',
                    email: r.email,
                    timezone: 'UTC',
                    optimalTime: `${9 + Math.floor(Math.random() * 8)}:00 AM`,
                    confidence: Math.floor(Math.random() * 40) + 60,
                    engagementScore: Math.floor(Math.random() * 100),
                    businessHours: true,
                  })) || []}
                  onOverrideTime={() => {}}
                />

                {/* Batch Configuration */}
                <BatchConfiguration
                  totalRecipients={recipientCount}
                  onBatchConfigChange={setBatchConfig}
                  defaultBatchSize={50}
                />

                {/* Campaign Rules */}
                <CampaignRules
                  onRulesChange={(rules) => setCampaignRules(rules)}
                />

                {/* Campaign Controls */}
                <CampaignControls
                  onStateChange={(state) => {
                    setCampaignState(state)
                    if (state === 'running') {
                      setCampaignActive(true)
                      setShowFraudReview(true)
                    } else if (state === 'cancelled' || state === 'completed') {
                      setCampaignActive(false)
                    }
                  }}
                  campaignData={{
                    state: campaignState,
                    totalRecipients: recipientCount,
                    totalBatches: batchConfig.totalBatches,
                    currentBatch: 0,
                    totalSent: 0,
                  }}
                />

                {/* Campaign Performance Monitor */}
                <CampaignPerformanceMonitor campaignActive={campaignActive} />

                {/* Email Authentication */}
                <EmailAuthVerification domain="yourdomain.com" />

                {/* Advanced Analytics Dashboard */}
                <AdvancedAnalyticsDashboard />
              </div>
            </>
          )}

          {/* Fraud Review Modal - shown when campaign starts */}
          {showFraudReview && (
            <FraudAccountReviewModal
              open={showFraudReview}
              onReview={(account, action) => {
                console.log(`Account ${account.email}: ${action}`)
              }}
            />
          )}

          {/* Footer Navigation */}
          <div className="flex gap-4 pt-6">
            <Button
              onClick={handleBack}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Back to Template
            </Button>
            {sendMethod && (
              <Button
                onClick={handleLaunch}
                disabled={!allChecksPassed || loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Launching...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    🚀 Launch Campaign
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ML Optimal Send Time Dialog */}
      <OptimalSendTimeDialog
        open={showOptimalTimeDialog}
        onOpenChange={setShowOptimalTimeDialog}
        onApply={(recommendation) => {
          // Apply the recommended send time
          if (recommendation.recommended_hour !== undefined) {
            const hour = recommendation.recommended_hour
            const ampm = hour >= 12 ? 'PM' : 'AM'
            const h = hour % 12 || 12
            setScheduledTime(`${h.toString().padStart(2, '0')}:00`)
            toast.success(`Applied ML recommendation: ${h}:00 ${ampm}`)
          }
        }}
      />
    </div>
  )
}
