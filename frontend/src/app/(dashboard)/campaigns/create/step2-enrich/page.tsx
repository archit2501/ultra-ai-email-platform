'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useCampaignDraft } from '@/hooks/useCampaignDraft'
import { ArrowLeft, Sparkles, Zap, Rocket, Shield, Users, Building2, GitBranch, Search, Clock, ChevronDown, ChevronUp, Mail, AlertTriangle, Copy, Network, ExternalLink, Wrench, Calendar, Globe, Briefcase } from 'lucide-react'
import { recipientsAPI } from '@/lib/api'
import apiClient from '@/lib/api'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { syncDraftToList } from '@/utils/draftCampaigns'
import { EnrichmentResults, EmailValidationResult, FraudDetectionResult } from '@/components/campaigns/EnrichmentResults'
import { SkillMatchingPreview, SkillMatchData, SkillCategoryBreakdown } from '@/components/campaigns/SkillMatchingPreview'
import { TechStackPreview, CompanyTechStack, TechCategoryBreakdown, TechRecipientMatch } from '@/components/campaigns/TechStackPreview'
import { CompanyIntelligencePreview, CompanyIntelligenceData, IndustryBreakdown, CompanySizeDistribution } from '@/components/campaigns/CompanyIntelligencePreview'
import { PersonIntelligencePreview, PersonIntelligenceData } from '@/components/campaigns/PersonIntelligencePreview'

type EnrichmentDepth = 'quick' | 'standard' | 'deep'

export default function Step2Page() {
  const router = useRouter()
  const { draft, updateDraft, updateStep2, setStep } = useCampaignDraft()
  const [campaignName, setCampaignName] = useState('')

  // Core enrichment options
  const [enrichmentDepth, setEnrichmentDepth] = useState<EnrichmentDepth>('standard')
  const [enableCompanyIntelligence, setEnableCompanyIntelligence] = useState(true)
  const [enablePersonIntelligence, setEnablePersonIntelligence] = useState(true)

  // Advanced data quality options
  const [enableEmailValidation, setEnableEmailValidation] = useState(true)
  const [enableFraudDetection, setEnableFraudDetection] = useState(true)
  const [enableDuplicateRemoval, setEnableDuplicateRemoval] = useState(true)
  const [enableEntityResolution, setEnableEntityResolution] = useState(false)
  
  // Multi-source validation
  const [enableCrossReference, setEnableCrossReference] = useState(false)
  const [enableExternalLinks, setEnableExternalLinks] = useState(false)

  // Job seeker specific
  const [enableTechStackMatching, setEnableTechStackMatching] = useState(false)
  const [enableSkillMatching, setEnableSkillMatching] = useState(false)
  const [enableEmailPreview, setEnableEmailPreview] = useState(false)

  // Send optimization
  const [enableSendTimeOptimization, setEnableSendTimeOptimization] = useState(true)

  // Paid options
  const [enableGoogleSearch, setEnableGoogleSearch] = useState(false)

  // UI state
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [isEnriching, setIsEnriching] = useState(false)
  const [enrichProgress, setEnrichProgress] = useState<{ done: number; total: number; failed: number }>({ done: 0, total: 0, failed: 0 })
  const [enrichmentJobId, setEnrichmentJobId] = useState<string | null>(null)
  const [enrichmentStatus, setEnrichmentStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle')
  const [enrichmentError, setEnrichmentError] = useState<string | null>(null)
  
  // Enrichment results
  const [emailValidationResults, setEmailValidationResults] = useState<EmailValidationResult[]>([])
  const [fraudDetectionResults, setFraudDetectionResults] = useState<FraudDetectionResult[]>([])
  const [enrichmentCompleted, setEnrichmentCompleted] = useState(false)
  
  // Preview results
  const [skillMatchData, setSkillMatchData] = useState<SkillMatchData[]>([])
  const [skillCategoryBreakdown, setSkillCategoryBreakdown] = useState<SkillCategoryBreakdown[]>([])
  const [overallSkillCoverage, setOverallSkillCoverage] = useState(0)
  
  const [companyTechStacks, setCompanyTechStacks] = useState<CompanyTechStack[]>([])
  const [techCategoryBreakdown, setTechCategoryBreakdown] = useState<TechCategoryBreakdown[]>([])
  const [techRecipientMatches, setTechRecipientMatches] = useState<TechRecipientMatch[]>([])
  
  const [companyIntelligence, setCompanyIntelligence] = useState<CompanyIntelligenceData[]>([])
  const [industryBreakdown, setIndustryBreakdown] = useState<IndustryBreakdown[]>([])
  const [sizeDistribution, setSizeDistribution] = useState<CompanySizeDistribution[]>([])
  const [cacheHitRate, setCacheHitRate] = useState(0)
  
  // Job history and retry tracking
  const [jobAttempt, setJobAttempt] = useState(1)
  const [jobHistory, setJobHistory] = useState<Array<{timestamp: string; status: string; duration?: number}>>([])
  const [nextRetryTime, setNextRetryTime] = useState<string | null>(null)
  
  const [personIntelligence, setPersonIntelligence] = useState<PersonIntelligenceData[]>([])
  // Deduplication state
  const [isDeduplicating, setIsDeduplicating] = useState(false)
  const [duplicateGroups, setDuplicateGroups] = useState<any[]>([])
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [selectedDuplicateGroup, setSelectedDuplicateGroup] = useState<any | null>(null)
  const [deduplicationCompleted, setDeduplicationCompleted] = useState(false)
  const [mergeStrategy, setMergeStrategy] = useState('keep_most_complete')
  const [isMerging, setIsMerging] = useState(false)
  const [mergedOperations, setMergedOperations] = useState<Array<{merge_id: string; timestamp: string; status: 'completed' | 'rolled_back'}>>([])
  const [selectedMergeIdForRollback, setSelectedMergeIdForRollback] = useState<string | null>(null)

  // Enriched data preview modal
  const [showEnrichedDataPreview, setShowEnrichedDataPreview] = useState(false)

  const runDeduplication = async () => {
    const recipients = draft.step1.recipients || []
    const ids = recipients.map(r => r.id).filter(Boolean) as number[]
    if (ids.length < 2) {
      toast.error('Need at least 2 recipients', { description: 'Deduplication requires at least 2 recipients to compare.' })
      return
    }

    setIsDeduplicating(true)
    setDuplicateGroups([])
    setDeduplicationCompleted(false)

    try {
      toast.info('Finding duplicates...', { description: `Analyzing ${ids.length} recipients` })

      const response = await recipientsAPI.deduplicateRecipients(ids, {
        match_threshold: 0.8,
        high_confidence_threshold: 0.95,
      })

      const groups = response.data.duplicate_groups || []
      setDuplicateGroups(groups)
      setDeduplicationCompleted(true)
      setIsDeduplicating(false)

      if (groups.length === 0) {
        toast.success('No duplicates found', {
          description: `All ${ids.length} recipients are unique`
        })
      } else {
        const totalDupes = groups.reduce((sum: number, g: any) => sum + g.recipients.length - 1, 0)
        toast.success(`Found ${groups.length} duplicate groups`, {
          description: `${totalDupes} potential duplicates detected. Review and merge them below.`
        })
        setShowDuplicateModal(true)
      }

    } catch (error: any) {
      setIsDeduplicating(false)
      console.error('Deduplication error:', error)
      toast.error('Deduplication failed', {
        description: error?.response?.data?.detail || error.message || 'An unknown error occurred'
      })
    }
  }

  const mergeDuplicates = async (group: any, keepRecipientId: number) => {
    try {
      setIsMerging(true)
      const recipientIds = group.recipients.map((r: any) => r.id)
      
      console.log(`🔀 [MERGE] Merging ${recipientIds.length} recipients, keeping ${keepRecipientId}`)

      const response = await recipientsAPI.executeMerge(recipientIds, keepRecipientId, {
        merge_strategy: mergeStrategy as 'keep_first' | 'keep_most_complete' | 'custom'
      })

      const merge_id = response.data.merge_id
      const confidence = response.data.confidence_score

      toast.success('Duplicates merged', {
        description: `Merged ${recipientIds.length - 1} duplicates (${confidence}% confidence)`
      })

      // Track merge for potential rollback
      setMergedOperations(prev => [...prev, {
        merge_id,
        timestamp: new Date().toLocaleString(),
        status: 'completed'
      }])

      setDuplicateGroups(prev => prev.filter(g => g.group_id !== group.group_id))

      const updatedRecipients = (draft.step1.recipients || []).filter(
        r => !response.data.deleted_recipient_ids.includes(r.id)
      )
      updateStep2({ enrichedRecipients: updatedRecipients })
      setShowDuplicateModal(false)
      setSelectedDuplicateGroup(null)

    } catch (error: any) {
      console.error('Merge error:', error)
      toast.error('Merge failed', {
        description: error?.response?.data?.detail || error.message
      })
    } finally {
      setIsMerging(false)
    }
  }

  const rollbackMerge = async (merge_id: string) => {
    try {
      setIsMerging(true)
      
      console.log(`↩️  [ROLLBACK] Rolling back merge ${merge_id}`)

      await recipientsAPI.rollbackMerge(merge_id)

      toast.success('Merge rolled back', {
        description: 'Duplicate recipients have been restored'
      })

      // Update merge status
      setMergedOperations(prev => prev.map(op => 
        op.merge_id === merge_id ? {...op, status: 'rolled_back'} : op
      ))

      // Refresh recipients from backend
      const recipients = draft.step1.recipients || []
      const ids = recipients.map(r => r.id).filter(Boolean) as number[]
      if (ids.length > 0) {
        await runDeduplication()
      }

      setSelectedMergeIdForRollback(null)

    } catch (error: any) {
      console.error('Rollback error:', error)
      toast.error('Rollback failed', {
        description: error?.response?.data?.detail || error.message
      })
    } finally {
      setIsMerging(false)
    }
  }

  const keepAllDuplicates = (group: any) => {
    setDuplicateGroups(prev => prev.filter(g => g.group_id !== group.group_id))
    toast.info('Keeping all as separate recipients', {
      description: 'These recipients will remain separate in your list'
    })
  }


  /**
   * Recover persisted enrichment data on page load.
   *
   * **Critical Fix**: Enrichment data is now persisted to database,
   * so it survives page refresh. This effect loads any previously
   * enriched data for the selected recipients.
   */
  const recoverPersistedEnrichment = async () => {
    const recipients = draft.step1.recipients || []
    const ids = recipients.map(r => r.id).filter(Boolean) as number[]

    if (ids.length === 0) return

    // Check if we already have enriched data in draft (local state)
    if (draft.step2.enrichedData && Object.keys(draft.step2.enrichedData).length > 0) {
      console.log('✅ [ENRICHMENT] Using cached enrichment data from draft')
      return
    }

    try {
      console.log('🔄 [ENRICHMENT] Checking for persisted enrichment data...')

      const response = await apiClient.post('/enrichment/get-persisted', ids)

      if (response.data.enriched_count > 0) {
        console.log(`✅ [ENRICHMENT] Recovered ${response.data.enriched_count} enriched recipients`)

        // Update draft with recovered data
        updateStep2({
          enrichmentCompleted: true,
          enrichedData: response.data.enrichment_data,
          enrichmentStats: {
            total: response.data.total_requested,
            successful: response.data.enriched_count,
            failed: response.data.total_requested - response.data.enriched_count,
            completedAt: new Date().toISOString()
          }
        })

        setEnrichmentCompleted(true)
        setEnrichmentStatus('completed')

        toast.info('Recovered enrichment data', {
          description: `Found ${response.data.enriched_count} previously enriched recipients`
        })
      }
    } catch (error) {
      console.log('📝 [ENRICHMENT] No persisted enrichment data found (this is normal for new campaigns)')
    }
  }

  // Recover persisted enrichment on mount
  useEffect(() => {
    recoverPersistedEnrichment()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.step1.recipients])

  // Initialize from draft
  useEffect(() => {
    if (draft.campaignName) {
      setCampaignName(draft.campaignName)
    }

    if (draft.step2.enrichmentDepth) {
      setEnrichmentDepth(draft.step2.enrichmentDepth)
    }
    if (draft.step2.enableCompanyIntelligence !== undefined) {
      setEnableCompanyIntelligence(draft.step2.enableCompanyIntelligence)
    }
    if (draft.step2.enablePersonIntelligence !== undefined) {
      setEnablePersonIntelligence(draft.step2.enablePersonIntelligence)
    }
    if (draft.step2.enableEmailValidation !== undefined) {
      setEnableEmailValidation(draft.step2.enableEmailValidation)
    }
    if (draft.step2.enableFraudDetection !== undefined) {
      setEnableFraudDetection(draft.step2.enableFraudDetection)
    }
    if (draft.step2.enableDuplicateRemoval !== undefined) {
      setEnableDuplicateRemoval(draft.step2.enableDuplicateRemoval)
    }
    if (draft.step2.enableEntityResolution !== undefined) {
      setEnableEntityResolution(draft.step2.enableEntityResolution)
    }
    if (draft.step2.enableCrossReference !== undefined) {
      setEnableCrossReference(draft.step2.enableCrossReference)
    }
    if (draft.step2.enableExternalLinks !== undefined) {
      setEnableExternalLinks(draft.step2.enableExternalLinks)
    }
    if (draft.step2.enableTechStackMatching !== undefined) {
      setEnableTechStackMatching(draft.step2.enableTechStackMatching)
    }
    if (draft.step2.enableSkillMatching !== undefined) {
      setEnableSkillMatching(draft.step2.enableSkillMatching)
    }
    if (draft.step2.enableEmailPreview !== undefined) {
      setEnableEmailPreview(draft.step2.enableEmailPreview)
    }
    if (draft.step2.enableSendTimeOptimization !== undefined) {
      setEnableSendTimeOptimization(draft.step2.enableSendTimeOptimization)
    }
    if (draft.step2.enableGoogleSearch !== undefined) {
      setEnableGoogleSearch(draft.step2.enableGoogleSearch)
    }
  }, [draft])

  // Sync draft to localStorage
  useEffect(() => {
    if (draft.id && draft.createdAt) {
      syncDraftToList(draft)
    }
  }, [draft])

  // Save all selections to draft
  useEffect(() => {
    updateStep2({
      enrichmentDepth,
      enableCompanyIntelligence,
      enablePersonIntelligence,
      enableEmailValidation,
      enableFraudDetection,
      enableDuplicateRemoval,
      enableEntityResolution,
      enableCrossReference,
      enableExternalLinks,
      enableTechStackMatching,
      enableSkillMatching,
      enableEmailPreview,
      enableSendTimeOptimization,
      enableGoogleSearch,
    })
  }, [
    enrichmentDepth,
    enableCompanyIntelligence,
    enablePersonIntelligence,
    enableEmailValidation,
    enableFraudDetection,
    enableDuplicateRemoval,
    enableEntityResolution,
    enableCrossReference,
    enableExternalLinks,
    enableTechStackMatching,
    enableSkillMatching,
    enableEmailPreview,
    enableSendTimeOptimization,
    enableGoogleSearch,
    updateStep2
  ])

  const handleBack = () => {
    setStep(1)
    router.push('/campaigns/create/step1-source')
  }

  const handleNext = () => {
    setStep(3)
    router.push('/campaigns/create/step3-template')
  }

  const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '')

  const progressSourceRef = useRef<EventSource | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const cleanupProgressChannels = () => {
    if (progressSourceRef.current) {
      progressSourceRef.current.close()
      progressSourceRef.current = null
    }
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }

  const applyEnrichmentResults = (payload: any) => {
    const validationResults = payload?.email_validation_results || []
    const mappedValidation: EmailValidationResult[] = validationResults.map((r: any) => ({
      email: r.email,
      recipientName: r.recipient_name,
      isValid: r.is_valid,
      deliverability: r.deliverability,
      reason: r.reason,
      mx_records_found: r.mx_records_found,
      is_disposable: r.is_disposable,
      is_role_based: r.is_role_based,
      score: r.score,
    }))

    setEmailValidationResults(mappedValidation)

    if (enableFraudDetection && validationResults.length > 0) {
      const fraudResults: FraudDetectionResult[] = validationResults
        .filter((r: any) => r.is_disposable || r.score < 30)
        .map((r: any) => ({
          email: r.email,
          recipientName: r.recipient_name,
          isFraudulent: r.is_disposable || r.score < 30,
          riskScore: r.is_disposable ? 85 : (100 - r.score),
          flags: [
            ...(r.is_disposable ? ['Disposable email'] : []),
            ...(r.score < 30 ? ['Low deliverability score'] : []),
            ...(r.is_role_based ? ['Role-based email'] : []),
          ],
          confidence: 90,
        }))
      setFraudDetectionResults(fraudResults)
    } else {
      setFraudDetectionResults([])
    }

    const stats = payload?.statistics || {}
    if (stats.cache_hit_rate !== undefined) {
      setCacheHitRate(Math.round(stats.cache_hit_rate))
    }

    setEnrichProgress(payload?.progress || {
      done: payload?.enriched_count || mappedValidation.length,
      total: payload?.total_recipients || (draft.step1.recipientCount || 0),
      failed: payload?.failed_count || 0,
    })

    setEnrichmentCompleted(payload?.status === 'completed')
    setEnrichmentStatus(payload?.status === 'failed' ? 'failed' : 'completed')
    setIsEnriching(false)
    setEnrichmentJobId(null)
    cleanupProgressChannels()

    updateStep2({ enrichedRecipients: draft.step1.recipients || [] })
  }

  const fetchJobStatus = async (jobId: string) => {
    try {
      const { data } = await apiClient.get(`/enrichment/status/${jobId}`)
      if (data?.progress) {
        setEnrichProgress({
          done: data.progress.processed || 0,
          total: data.progress.total || 0,
          failed: data.progress.failed || 0,
        })
      }

      // Update job attempt and retry info
      if (data?.status === 'completed') {
        const duration = data.created_at && data.completed_at 
          ? Math.round((new Date(data.completed_at).getTime() - new Date(data.created_at).getTime()) / 1000)
          : undefined
        setJobHistory(prev => [...prev, {
          timestamp: new Date().toLocaleString(),
          status: 'completed',
          duration
        }])
        
        setEnrichmentStatus('completed')
        setIsEnriching(false)
        setEnrichmentCompleted(true)
        cleanupProgressChannels()
        
        // Fetch and display results from new API
        await fetchEnrichmentResults(jobId)
        
        toast.success('Enrichment complete!', {
          description: `Enriched ${data.progress.successful || 0} recipients (${data.progress.failed || 0} failed)`
        })
      } else if (data?.status === 'failed') {
        setEnrichmentStatus('failed')
        setEnrichmentError(data?.error || 'Enrichment failed')
        setIsEnriching(false)
        cleanupProgressChannels()
        setJobHistory(prev => [...prev, {
          timestamp: new Date().toLocaleString(),
          status: 'failed'
        }])
        toast.error('Enrichment failed', { description: data?.error || 'Unknown error' })
      }

      return data?.status
    } catch (error: any) {
      console.error('Status polling failed', error)
      return null
    }
  }

  const fetchEnrichmentResults = async (jobId: string) => {
    try {
      const { data } = await apiClient.get(`/enrichment/results/${jobId}`)
      
      // Apply results to UI (parse and set state)
      if (data.results && Array.isArray(data.results)) {
        applyEnrichmentResults({ enrichment_results: data.results })
        
        // Store enriched data in draft for Step 3 to use
        const enrichedDataMap: Record<number, any> = {}
        data.results.forEach((result: any) => {
          if (result.recipient_id) {
            enrichedDataMap[result.recipient_id] = result.enriched_fields || result
          }
        })
        
        updateStep2({
          enrichmentJobId: jobId,
          enrichmentCompleted: true,
          enrichedData: enrichedDataMap,
          enrichmentStats: {
            total: data.total_recipients,
            successful: data.successful_enrichments,
            failed: data.failed_enrichments,
            completedAt: data.completed_at || new Date().toISOString()
          }
        })
      }
      
      toast.info('Results loaded', { 
        description: `${data.successful_enrichments} successful, ${data.failed_enrichments} failed` 
      })
    } catch (error: any) {
      console.error('Failed to fetch enrichment results:', error)
      toast.error('Failed to load results', { 
        description: error?.response?.data?.detail || error.message 
      })
    }
  }

  /**
   * Start SSE stream for real-time enrichment progress updates.
   *
   * **2026 Best Practice**: Use SSE instead of polling for:
   * - Lower server load (no repeated requests)
   * - Faster updates (push vs pull)
   * - Better UX with real-time feedback
   *
   * Falls back to polling if SSE fails.
   */
  const startSSEStream = (jobId: string) => {
    cleanupProgressChannels()

    const sseUrl = `${apiBaseUrl}/enrichment/stream/${jobId}`
    console.log('📡 [SSE] Connecting to enrichment stream:', sseUrl)

    try {
      const eventSource = new EventSource(sseUrl, { withCredentials: true })
      progressSourceRef.current = eventSource

      eventSource.onopen = () => {
        console.log('📡 [SSE] Connected to enrichment stream')
        toast.info('Connected to progress stream', {
          description: 'Receiving real-time updates'
        })
      }

      eventSource.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('📡 [SSE] Received event:', data.type, data)

          switch (data.type) {
            case 'connected':
              console.log('📡 [SSE] Initial connection confirmed')
              break

            case 'progress':
              setEnrichProgress({
                done: data.processed || 0,
                total: data.total || 0,
                failed: data.failed || 0,
              })
              break

            case 'status_changed':
              console.log('📡 [SSE] Status changed:', data.previous_status, '→', data.status)
              if (data.status === 'running') {
                setEnrichmentStatus('running')
              }
              break

            case 'completed':
              console.log('📡 [SSE] Enrichment completed')
              setEnrichmentStatus('completed')
              setIsEnriching(false)
              setEnrichmentCompleted(true)

              const duration = data.duration || 0
              setJobHistory(prev => [...prev, {
                timestamp: new Date().toLocaleString(),
                status: 'completed',
                duration
              }])

              // Fetch and display results
              await fetchEnrichmentResults(jobId)

              toast.success('Enrichment complete!', {
                description: `Enriched ${data.successful || 0} recipients (${data.failed || 0} failed)`
              })

              cleanupProgressChannels()
              break

            case 'error':
              console.error('📡 [SSE] Error from server:', data.message)
              setEnrichmentStatus('failed')
              setEnrichmentError(data.message || 'Enrichment failed')
              setIsEnriching(false)

              setJobHistory(prev => [...prev, {
                timestamp: new Date().toLocaleString(),
                status: 'failed'
              }])

              toast.error('Enrichment failed', {
                description: data.message || 'Unknown error'
              })

              cleanupProgressChannels()
              break

            case 'heartbeat':
              // Just a keepalive, no action needed
              console.log('📡 [SSE] Heartbeat received')
              break

            default:
              console.log('📡 [SSE] Unknown event type:', data.type)
          }
        } catch (parseError) {
          console.error('📡 [SSE] Failed to parse event:', parseError)
        }
      }

      eventSource.onerror = (error) => {
        console.error('📡 [SSE] Connection error:', error)

        // If SSE fails, fall back to polling
        if (eventSource.readyState === EventSource.CLOSED) {
          console.log('📡 [SSE] Connection closed, falling back to polling')
          cleanupProgressChannels()
          startPollingFallback(jobId)
        }
      }

    } catch (error) {
      console.error('📡 [SSE] Failed to create EventSource:', error)
      // Fall back to polling
      startPollingFallback(jobId)
    }
  }

  /**
   * Polling fallback for browsers/environments where SSE doesn't work.
   */
  const startPollingFallback = (jobId: string) => {
    console.log('🔄 [POLLING] Starting polling fallback')
    cleanupProgressChannels()

    // Poll every 2 seconds for status
    pollingRef.current = setInterval(async () => {
      const status = await fetchJobStatus(jobId)
      if (status === 'completed' || status === 'failed') {
        cleanupProgressChannels()
      }
    }, 2000)
  }

  useEffect(() => {
    return () => {
      cleanupProgressChannels()
    }
  }, [])

  const runEnrichment = async () => {
    const recipients = draft.step1.recipients || []
    const ids = recipients.map(r => r.id).filter(Boolean) as number[]
    if (ids.length === 0) {
      toast.error('No recipient IDs found', { description: 'Go back to Step 1 and ensure recipients were saved to your workspace.' })
      return
    }

    cleanupProgressChannels()
    setIsEnriching(true)
    setEnrichmentStatus('running')
    setEnrichmentError(null)
    setEnrichProgress({ done: 0, total: ids.length, failed: 0 })
    setJobAttempt(1)
    setJobHistory([])
    setNextRetryTime(null)
    setEmailValidationResults([])
    setFraudDetectionResults([])
    setEnrichmentCompleted(false)
    setSkillMatchData([])
    setSkillCategoryBreakdown([])
    setCompanyTechStacks([])
    setTechCategoryBreakdown([])
    setTechRecipientMatches([])
    setCompanyIntelligence([])
    setIndustryBreakdown([])
    setSizeDistribution([])
    setPersonIntelligence([])

    try {
      toast.info('Starting enrichment...', { description: `Processing ${ids.length} recipients with ${enrichmentDepth} depth` })

      // Use new enrichment API instead of old batch-enrich
      const response = await apiClient.post('/enrichment/execute', {
        recipient_ids: ids,
        config: {
          email_verification: enableEmailValidation,
          phone_discovery: enablePersonIntelligence,
          linkedin_profile: enablePersonIntelligence,
          job_title_validation: enablePersonIntelligence,
          company_info: enableCompanyIntelligence,
          social_profiles: enableExternalLinks,
          use_cache: true,
          fraud_detection: enableFraudDetection,
        },
        async_mode: true,
        depth: enrichmentDepth, // Use the depth level from UI
      })

      const jobId = response.data.job_id
      setEnrichmentJobId(jobId)

      toast.success('Enrichment started', {
        description: `Job ID: ${jobId.substring(0, 8)}... - Streaming progress`
      })

      // Start SSE stream for real-time progress (falls back to polling if SSE fails)
      startSSEStream(jobId)

    } catch (error: any) {
      setIsEnriching(false)
      setEnrichmentStatus('failed')
      setEnrichmentError(error?.response?.data?.detail || error.message || 'Enrichment failed')
      console.error('Enrichment error:', error)
      toast.error('Enrichment failed', {
        description: error?.response?.data?.detail || error.message || 'An unknown error occurred'
      })
    }
  }

  const handleRemoveInvalidEmails = () => {
    const invalidEmails = new Set(
      emailValidationResults
        .filter(r => r.deliverability === 'invalid')
        .map(r => r.email)
    )
    
    const filteredRecipients = (draft.step1.recipients || []).filter(
      r => !invalidEmails.has(r.email)
    )
    
    updateStep2({ enrichedRecipients: filteredRecipients })
    toast.success(`Removed ${invalidEmails.size} invalid emails`)
    
    // Remove from validation results
    setEmailValidationResults(prev => prev.filter(r => r.deliverability !== 'invalid'))
  }

  const handleRemoveFraudulentAccounts = () => {
    const fraudulentEmails = new Set(
      fraudDetectionResults
        .filter(r => r.isFraudulent)
        .map(r => r.email)
    )
    
    const filteredRecipients = (draft.step1.recipients || []).filter(
      r => !fraudulentEmails.has(r.email)
    )
    
    updateStep2({ enrichedRecipients: filteredRecipients })
    toast.success(`Removed ${fraudulentEmails.size} flagged accounts`)
    
    // Remove from fraud results
    setFraudDetectionResults(prev => prev.filter(r => !r.isFraudulent))
  }

  const isJobSeeker = draft.goal === 'jobs'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/70 backdrop-blur">
        <div className="max-w-4xl mx-auto px-6 py-4">
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

                {/* Duplicate Merge Modal - Enhanced */}
                {showDuplicateModal && selectedDuplicateGroup && (
                  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                      {/* Header */}
                      <div className="p-6 border-b border-slate-700 sticky top-0 bg-slate-900/95">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-xl font-bold text-white">Merge Duplicate Recipients</h3>
                            <p className="text-sm text-slate-400 mt-1">
                              Select which recipient to keep and configure merge strategy
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setShowDuplicateModal(false)
                              setSelectedDuplicateGroup(null)
                            }}
                            className="text-slate-400 hover:text-white text-2xl leading-none"
                          >
                            ×
                          </button>
                        </div>
                        
                        {/* Confidence Score Bar */}
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-semibold text-slate-300">Confidence:</div>
                          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all ${
                                selectedDuplicateGroup.confidence >= 0.95 ? 'bg-green-500' :
                                selectedDuplicateGroup.confidence >= 0.8 ? 'bg-blue-500' :
                                'bg-amber-500'
                              }`}
                              style={{width: `${selectedDuplicateGroup.confidence * 100}%`}}
                            />
                          </div>
                          <div className="text-sm font-bold text-white min-w-fit">
                            {Math.round(selectedDuplicateGroup.confidence * 100)}%
                          </div>
                        </div>
                      </div>

                      {/* Merge Strategy Selector */}
                      <div className="p-6 border-b border-slate-700 bg-slate-800/50">
                        <label className="block text-sm font-semibold text-white mb-3">Merge Strategy</label>
                        <div className="space-y-2">
                          <label className="flex items-center gap-3 p-3 border border-slate-600 rounded-lg cursor-pointer hover:bg-slate-700/50"
                            style={{borderColor: mergeStrategy === 'keep_first' ? '#3b82f6' : ''}}
                          >
                            <input
                              type="radio"
                              name="strategy"
                              value="keep_first"
                              checked={mergeStrategy === 'keep_first'}
                              onChange={(e) => setMergeStrategy(e.target.value)}
                              className="w-4 h-4"
                            />
                            <div className="flex-1">
                              <div className="font-semibold text-white text-sm">Keep First</div>
                              <div className="text-xs text-slate-400">Keep data from the first selected recipient</div>
                            </div>
                          </label>
                          <label className="flex items-center gap-3 p-3 border border-slate-600 rounded-lg cursor-pointer hover:bg-slate-700/50"
                            style={{borderColor: mergeStrategy === 'keep_most_complete' ? '#3b82f6' : ''}}
                          >
                            <input
                              type="radio"
                              name="strategy"
                              value="keep_most_complete"
                              checked={mergeStrategy === 'keep_most_complete'}
                              onChange={(e) => setMergeStrategy(e.target.value)}
                              className="w-4 h-4"
                            />
                            <div className="flex-1">
                              <div className="font-semibold text-white text-sm">Keep Most Complete</div>
                              <div className="text-xs text-slate-400">Use the recipient with the most complete data</div>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* Recipients List */}
                      <div className="p-6 space-y-3">
                        <h4 className="font-semibold text-white text-sm">Duplicate Recipients ({selectedDuplicateGroup.recipients.length})</h4>
                        {selectedDuplicateGroup.recipients.map((recipient: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-4 rounded-lg border-2 border-slate-700 bg-slate-800/30 hover:border-slate-600 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-semibold text-white text-base">{recipient.name || 'Unknown'}</h4>
                                <p className="text-sm text-slate-400 mt-1">{recipient.email}</p>
                              </div>
                              <Button
                                size="sm"
                                disabled={isMerging}
                                className="bg-blue-600 hover:bg-blue-700 text-xs whitespace-nowrap"
                                onClick={() => mergeDuplicates(selectedDuplicateGroup, recipient.id)}
                              >
                                {isMerging ? 'Merging...' : 'Keep This'}
                              </Button>
                            </div>
                  
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                              {recipient.company && (
                                <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
                                  <div className="text-xs text-slate-500">Company</div>
                                  <div className="text-slate-300 font-medium truncate">{recipient.company}</div>
                                </div>
                              )}
                              {recipient.position && (
                                <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
                                  <div className="text-xs text-slate-500">Position</div>
                                  <div className="text-slate-300 font-medium truncate">{recipient.position}</div>
                                </div>
                              )}
                              {recipient.phone && (
                                <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
                                  <div className="text-xs text-slate-500">Phone</div>
                                  <div className="text-slate-300 font-medium">{recipient.phone}</div>
                                </div>
                              )}
                              {recipient.country && (
                                <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
                                  <div className="text-xs text-slate-500">Country</div>
                                  <div className="text-slate-300 font-medium">{recipient.country}</div>
                                </div>
                              )}
                            </div>
                  
                            {recipient.tags && recipient.tags.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-1">
                                {recipient.tags.map((tag: string, tidx: number) => (
                                  <span key={tidx} className="px-2 py-1 bg-slate-700/50 text-slate-300 rounded text-xs border border-slate-600">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Merge History */}
                      {mergedOperations.length > 0 && (
                        <div className="p-6 border-t border-slate-700 bg-slate-800/50">
                          <h4 className="font-semibold text-white text-sm mb-3">Recent Merges</h4>
                          <div className="space-y-2">
                            {mergedOperations.slice(-3).reverse().map((op) => (
                              <div key={op.merge_id} className="flex items-center justify-between p-2 bg-slate-900/50 rounded border border-slate-700">
                                <div>
                                  <div className="text-xs text-slate-400">{op.timestamp}</div>
                                  <div className={`text-xs font-semibold ${op.status === 'completed' ? 'text-green-400' : 'text-amber-400'}`}>
                                    {op.status === 'completed' ? '✓ Completed' : '↩️ Rolled Back'}
                                  </div>
                                </div>
                                {op.status === 'completed' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={isMerging}
                                    className="border-red-600 text-red-400 hover:bg-red-800/20 text-xs"
                                    onClick={() => rollbackMerge(op.merge_id)}
                                  >
                                    {isMerging ? '...' : 'Undo'}
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="p-6 border-t border-slate-700 flex gap-3 sticky bottom-0 bg-slate-900/95">
                        <Button
                          variant="outline"
                          disabled={isMerging}
                          onClick={() => {
                            setShowDuplicateModal(false)
                            setSelectedDuplicateGroup(null)
                          }}
                          className="border-slate-600 text-slate-300 hover:bg-slate-800"
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="outline"
                          disabled={isMerging}
                          onClick={() => {
                            keepAllDuplicates(selectedDuplicateGroup)
                            setShowDuplicateModal(false)
                            setSelectedDuplicateGroup(null)
                          }}
                          className="border-amber-600 text-amber-300 hover:bg-amber-800/50"
                        >
                          Keep All Separate
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
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
                <p className="text-slate-400 mt-1">Step 2 of 4: Enrich Data</p>
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
                    step === 2
                      ? 'bg-blue-600 text-white shadow-[0_0_0_4px_rgba(59,130,246,0.2)]'
                      : step < 2
                      ? 'bg-green-600 text-white'
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
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Recipient Summary */}
          <div className="p-6 rounded-lg border-2 border-slate-800 bg-slate-900">
            <h3 className="text-lg font-semibold text-white mb-2">Recipients from Step 1</h3>
            <p className="text-slate-400 text-sm mb-4">
              You've selected <span className="text-blue-400 font-semibold">{draft.step1.recipientCount || 0}</span> recipients
              {draft.step1.source && ` from ${draft.step1.source}`}
            </p>
          </div>

          {/* Enrichment Status */}
          <div className="p-4 rounded-lg border border-slate-800 bg-slate-900/70 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-300">Status</div>
              <div className={`text-sm font-semibold ${enrichmentStatus === 'failed' ? 'text-rose-400' : enrichmentStatus === 'completed' ? 'text-green-400' : 'text-amber-300'}`}>
                {isEnriching ? 'Running' : enrichmentStatus.charAt(0).toUpperCase() + enrichmentStatus.slice(1)}
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span>Progress</span>
              <span>{enrichProgress.done}/{enrichProgress.total} ({enrichProgress.failed} failed)</span>
            </div>
            {jobAttempt > 1 && (
              <div className="flex items-center justify-between text-sm text-slate-400">
                <span>Attempt</span>
                <span className="text-amber-300 font-semibold">{jobAttempt}/3</span>
              </div>
            )}
            {nextRetryTime && (
              <div className="flex items-center justify-between text-sm text-slate-400">
                <span>Next retry</span>
                <span className="text-amber-300">{nextRetryTime}</span>
              </div>
            )}
            {cacheHitRate > 0 && (
              <div className="flex items-center justify-between text-sm text-slate-400">
                <span>Cache hit rate</span>
                <span className="text-blue-300 font-semibold">{cacheHitRate}%</span>
              </div>
            )}
            {jobHistory.length > 0 && (
              <div className="pt-2 border-t border-slate-700">
                <div className="text-xs text-slate-500 font-semibold mb-2">Recent History</div>
                <div className="space-y-1">
                  {jobHistory.slice(-3).reverse().map((entry, idx) => (
                    <div key={idx} className="text-xs text-slate-400 flex items-center justify-between">
                      <span>{entry.timestamp}</span>
                      <span className={entry.status === 'completed' ? 'text-green-400' : 'text-rose-400'}>
                        {entry.status}{entry.duration ? ` (${entry.duration}s)` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {enrichmentError && (
              <div className="text-xs text-rose-300">{enrichmentError}</div>
            )}
          </div>

          {/* Enrichment Depth Selection */}
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2 text-white">Choose Enrichment Depth</h2>
              <p className="text-slate-400">
                {isJobSeeker 
                  ? "How much research should we do on each company and hiring manager?"
                  : "How much research should we do on each company and decision maker?"
                }
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Quick */}
              <button
                onClick={() => setEnrichmentDepth('quick')}
                className={`p-6 rounded-lg border-2 transition-all text-left ${
                  enrichmentDepth === 'quick'
                    ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20'
                    : 'border-slate-800 bg-slate-900 hover:border-blue-500/50 hover:bg-blue-500/5'
                }`}
              >
                <div className="text-3xl mb-3">⚡</div>
                <h3 className="text-lg font-bold text-white mb-2">Quick</h3>
                <p className="text-sm text-slate-300 mb-3">
                  {isJobSeeker 
                    ? "Basic company lookup and contact validation"
                    : "Basic business research and decision maker lookup"
                  }
                </p>
                <ul className="text-xs text-slate-400 space-y-1">
                  <li>✓ {isJobSeeker ? "Company overview" : "Business overview"}</li>
                  <li>✓ Email verification</li>
                  <li>✓ {isJobSeeker ? "Open positions" : "Contact details"}</li>
                </ul>
              </button>

              {/* Standard */}
              <button
                onClick={() => setEnrichmentDepth('standard')}
                className={`p-6 rounded-lg border-2 transition-all text-left ${
                  enrichmentDepth === 'standard'
                    ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20'
                    : 'border-slate-800 bg-slate-900 hover:border-blue-500/50 hover:bg-blue-500/5'
                }`}
              >
                <div className="text-3xl mb-3">🎯</div>
                <h3 className="text-lg font-bold text-white mb-2">Standard</h3>
                <p className="text-sm text-slate-300 mb-3">
                  {isJobSeeker 
                    ? "In-depth company + hiring manager research"
                    : "In-depth business intelligence + decision maker profiles"
                  }
                </p>
                <ul className="text-xs text-slate-400 space-y-1">
                  <li>✓ Everything in Quick</li>
                  <li>✓ {isJobSeeker ? "Tech stack & culture" : "Business needs & pain points"}</li>
                  <li>✓ Social profiles</li>
                  <li>✓ Recent news</li>
                </ul>
              </button>

              {/* Deep */}
              <button
                onClick={() => setEnrichmentDepth('deep')}
                className={`p-6 rounded-lg border-2 transition-all text-left ${
                  enrichmentDepth === 'deep'
                    ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20'
                    : 'border-slate-800 bg-slate-900 hover:border-blue-500/50 hover:bg-blue-500/5'
                }`}
              >
                <div className="text-3xl mb-3">🚀</div>
                <h3 className="text-lg font-bold text-white mb-2">Deep</h3>
                <p className="text-sm text-slate-300 mb-3">
                  Maximum intelligence gathering with OSINT
                </p>
                <ul className="text-xs text-slate-400 space-y-1">
                  <li>✓ Everything in Standard</li>
                  <li>✓ Multi-source verification</li>
                  <li>✓ {isJobSeeker ? "Team analysis" : "Buying signals"}</li>
                  <li>✓ Competitor research</li>
                </ul>
              </button>
            </div>
          </div>

          {/* Core Intelligence Toggles */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Intelligence Options</h2>

            {/* Company Intelligence */}
            <div className="p-6 rounded-lg border-2 border-slate-800 bg-slate-900">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-5 h-5 text-blue-400" />
                    <h4 className="font-semibold text-white">
                      {isJobSeeker ? "Company Intelligence" : "Business Intelligence"}
                    </h4>
                  </div>
                  <p className="text-sm text-slate-400">
                    {isJobSeeker 
                      ? "Research company tech stack, culture, projects, and hiring patterns"
                      : "Research business model, revenue, pain points, and buying signals"
                    }
                  </p>
                </div>
                <Switch
                  checked={enableCompanyIntelligence}
                  onCheckedChange={setEnableCompanyIntelligence}
                />
              </div>
            </div>

            {/* Person Intelligence */}
            <div className="p-6 rounded-lg border-2 border-slate-800 bg-slate-900">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-purple-400" />
                    <h4 className="font-semibold text-white">
                      {isJobSeeker ? "Hiring Manager Intelligence" : "Decision Maker Intelligence"}
                    </h4>
                  </div>
                  <p className="text-sm text-slate-400">
                    {isJobSeeker 
                      ? "Research hiring managers, recruiters, and team leads (LinkedIn, GitHub, etc.)"
                      : "Research decision makers, procurement officers, and key stakeholders"
                    }
                  </p>
                </div>
                <Switch
                  checked={enablePersonIntelligence}
                  onCheckedChange={setEnablePersonIntelligence}
                />
              </div>
            </div>
          </div>

          {/* Advanced Options (Collapsible) */}
          <div className="space-y-4">
            <button
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="w-full flex items-center justify-between p-4 rounded-lg border-2 border-slate-800 bg-slate-900 hover:bg-slate-800/60 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-slate-400" />
                <h2 className="text-xl font-bold text-white">Advanced Options</h2>
              </div>
              {showAdvancedOptions ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>

            {showAdvancedOptions && (
              <div className="space-y-4 pl-4 border-l-2 border-slate-800">
                {/* Data Quality Section */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-400" />
                    Data Quality & Validation
                  </h3>

                  {/* Email Validation */}
                  <div className="p-4 rounded-lg border border-slate-800 bg-slate-900/50 mb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Mail className="w-4 h-4 text-green-400" />
                          <h4 className="font-medium text-white text-sm">Email Validation & Verification</h4>
                        </div>
                        <p className="text-xs text-slate-400">
                          Validate email formats, check MX records, detect disposable emails
                        </p>
                      </div>
                      <Switch
                        checked={enableEmailValidation}
                        onCheckedChange={setEnableEmailValidation}
                      />
                    </div>
                  </div>

                  {/* Fraud Detection */}
                  <div className="p-4 rounded-lg border border-slate-800 bg-slate-900/50 mb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                          <h4 className="font-medium text-white text-sm">Fraud & Spam Detection (90-95% accuracy)</h4>
                        </div>
                        <p className="text-xs text-slate-400">
                          ML-powered fake profile detection, honeypot filtering, anomaly detection
                        </p>
                      </div>
                      <Switch
                        checked={enableFraudDetection}
                        onCheckedChange={setEnableFraudDetection}
                      />
                    </div>
                  </div>

                  {/* Duplicate Removal */}
                  <div className="p-4 rounded-lg border border-slate-800 bg-slate-900/50 mb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Copy className="w-4 h-4 text-blue-400" />
                          <h4 className="font-medium text-white text-sm">Remove Duplicates (Fuzzy Matching)</h4>
                        </div>
                        <p className="text-xs text-slate-400">
                          Intelligent duplicate detection with fuzzy matching (John Smith = Jon Smyth)
                        </p>
                      </div>
                      <Switch
                        checked={enableDuplicateRemoval}
                        onCheckedChange={setEnableDuplicateRemoval}
                      />
                    </div>
                  </div>

                  {/* Entity Resolution */}
                  <div className="p-4 rounded-lg border border-slate-800 bg-slate-900/50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Network className="w-4 h-4 text-purple-400" />
                          <h4 className="font-medium text-white text-sm">Entity Resolution & Profile Merging</h4>
                        </div>
                        <p className="text-xs text-slate-400">
                          Match and merge same person across LinkedIn, GitHub, company websites
                        </p>
                      </div>
                      <Switch
                        checked={enableEntityResolution}
                        onCheckedChange={setEnableEntityResolution}
                      />
                    </div>
                  </div>
                </div>

                {/* Multi-Source Intelligence */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <GitBranch className="w-5 h-5 text-cyan-400" />
                    Multi-Source Intelligence
                  </h3>

                  {/* Cross-Reference Validation */}
                  <div className="p-4 rounded-lg border border-slate-800 bg-slate-900/50 mb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Shield className="w-4 h-4 text-green-400" />
                          <h4 className="font-medium text-white text-sm">Cross-Reference Validation (95%+ accuracy)</h4>
                        </div>
                        <p className="text-xs text-slate-400">
                          Verify data consistency across multiple sources, resolve conflicts intelligently
                        </p>
                      </div>
                      <Switch
                        checked={enableCrossReference}
                        onCheckedChange={setEnableCrossReference}
                      />
                    </div>
                  </div>

                  {/* External Link Following */}
                  <div className="p-4 rounded-lg border border-slate-800 bg-slate-900/50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <ExternalLink className="w-4 h-4 text-blue-400" />
                          <h4 className="font-medium text-white text-sm">Follow External Links</h4>
                        </div>
                        <p className="text-xs text-slate-400">
                          Discover additional profiles and contact info by following external links
                        </p>
                      </div>
                      <Switch
                        checked={enableExternalLinks}
                        onCheckedChange={setEnableExternalLinks}
                      />
                    </div>
                  </div>
                </div>

                {/* Job Seeker Features (Conditional) */}
                {isJobSeeker && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-amber-400" />
                      Job Seeker Features
                    </h3>

                    {/* Tech Stack Matching */}
                    <div className="p-4 rounded-lg border border-slate-800 bg-slate-900/50 mb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Zap className="w-4 h-4 text-yellow-400" />
                            <h4 className="font-medium text-white text-sm">Tech Stack Matching</h4>
                          </div>
                          <p className="text-xs text-slate-400">
                            Match your skills to company technologies, identify learning opportunities
                          </p>
                        </div>
                        <Switch
                          checked={enableTechStackMatching}
                          onCheckedChange={setEnableTechStackMatching}
                        />
                      </div>
                    </div>

                    {/* Skill Matching */}
                    <div className="p-4 rounded-lg border border-slate-800 bg-slate-900/50 mb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                            <h4 className="font-medium text-white text-sm">Skill Gap Analysis & Talking Points</h4>
                          </div>
                          <p className="text-xs text-slate-400">
                            Analyze skill gaps, generate personalized talking points for interviews
                          </p>
                        </div>
                        <Switch
                          checked={enableSkillMatching}
                          onCheckedChange={setEnableSkillMatching}
                        />
                      </div>
                    </div>

                    {/* Email Preview */}
                    <div className="p-4 rounded-lg border border-slate-800 bg-slate-900/50">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Mail className="w-4 h-4 text-blue-400" />
                            <h4 className="font-medium text-white text-sm">Generate Email Previews</h4>
                          </div>
                          <p className="text-xs text-slate-400">
                            AI-powered personalized email drafts with multiple tones
                          </p>
                        </div>
                        <Switch
                          checked={enableEmailPreview}
                          onCheckedChange={setEnableEmailPreview}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Send Optimization */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-green-400" />
                    Send Optimization
                  </h3>

                  {/* Send Time Optimization */}
                  <div className="p-4 rounded-lg border border-slate-800 bg-slate-900/50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-4 h-4 text-green-400" />
                          <h4 className="font-medium text-white text-sm">Calculate Best Send Times</h4>
                        </div>
                        <p className="text-xs text-slate-400">
                          Industry-specific optimal send times with timezone adjustment (70% response rate)
                        </p>
                      </div>
                      <Switch
                        checked={enableSendTimeOptimization}
                        onCheckedChange={setEnableSendTimeOptimization}
                      />
                    </div>
                  </div>
                </div>

                {/* Paid Options */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-amber-400" />
                    Paid Options
                  </h3>

                  {/* Google Search */}
                  <div className="p-4 rounded-lg border border-amber-600/30 bg-amber-900/10">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Search className="w-4 h-4 text-amber-400" />
                          <h4 className="font-medium text-white text-sm">Google Search Discovery</h4>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-600/20 text-amber-400 font-semibold">PAID</span>
                        </div>
                        <p className="text-xs text-slate-400 mb-2">
                          Enhanced profile discovery using Google Custom Search API
                        </p>
                        <p className="text-xs text-amber-400">
                          💰 Cost: 100 queries/day FREE, then $5 per 1,000 queries
                        </p>
                      </div>
                      <Switch
                        checked={enableGoogleSearch}
                        onCheckedChange={setEnableGoogleSearch}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Enrichment Results */}
          {enrichmentCompleted && (emailValidationResults.length > 0 || fraudDetectionResults.length > 0) && (
            <EnrichmentResults
              emailValidationResults={emailValidationResults}
              fraudDetectionResults={fraudDetectionResults}
              onRemoveInvalid={handleRemoveInvalidEmails}
              onRemoveFraudulent={handleRemoveFraudulentAccounts}
            />
          )}

          {/* Skill Matching Preview */}
          {enrichmentCompleted && enableSkillMatching && skillMatchData.length > 0 && (
            <SkillMatchingPreview
              skillMatches={skillMatchData}
              categoryBreakdown={skillCategoryBreakdown}
              overallCoveragePercentage={overallSkillCoverage}
            />
          )}

          {/* Tech Stack Preview */}
          {enrichmentCompleted && enableTechStackMatching && companyTechStacks.length > 0 && (
            <TechStackPreview
              companyTechStacks={companyTechStacks}
              categoryBreakdown={techCategoryBreakdown}
              techRecipientMatches={techRecipientMatches}
            />
          )}

          {/* Company Intelligence Preview */}
          {enrichmentCompleted && enableCompanyIntelligence && companyIntelligence.length > 0 && (
            <CompanyIntelligencePreview
              companies={companyIntelligence}
              industryBreakdown={industryBreakdown}
              sizeDistribution={sizeDistribution}
              cacheHitRate={cacheHitRate}
            />
          )}

          {/* Person Intelligence Preview */}
          {enrichmentCompleted && enablePersonIntelligence && personIntelligence.length > 0 && (
            <PersonIntelligencePreview personData={personIntelligence} />
          )}

          {/* Duplicate Groups Display */}
          {deduplicationCompleted && duplicateGroups.length > 0 && (
            <div className="p-6 rounded-lg border-2 border-amber-800 bg-amber-900/20">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">⚠️</span>
                Found {duplicateGroups.length} Duplicate Group{duplicateGroups.length !== 1 ? 's' : ''}
              </h3>
              <p className="text-sm text-slate-300 mb-6">
                Review these potential duplicates and choose to merge or keep them separate.
              </p>
      
              <div className="space-y-4">
                {duplicateGroups.map((group: any, idx: number) => (
                  <div key={group.group_id} className="p-4 rounded-lg border border-amber-700 bg-slate-900/50">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-white mb-1">
                          Group {idx + 1} - {group.recipients.length} Recipients
                        </h4>
                        <p className="text-xs text-slate-400">
                          Confidence: {Math.round(group.confidence * 100)}% | Strategy: {group.suggested_merge_strategy}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedDuplicateGroup(group)
                            setShowDuplicateModal(true)
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-xs"
                        >
                          Review & Merge
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => keepAllDuplicates(group)}
                          className="border-slate-600 text-slate-300 hover:bg-slate-800 text-xs"
                        >
                          Keep Separate
                        </Button>
                      </div>
                    </div>
          
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {group.recipients.map((recipient: any, ridx: number) => (
                        <div key={ridx} className="p-3 rounded border border-slate-700 bg-slate-800/50 text-sm">
                          <div className="font-medium text-white">{recipient.name || 'Unknown'}</div>
                          <div className="text-xs text-slate-400">{recipient.email}</div>
                          {recipient.company && (
                            <div className="text-xs text-slate-500">{recipient.company}</div>
                          )}
                          {recipient.phone && (
                            <div className="text-xs text-slate-500">📞 {recipient.phone}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 pt-8">
            <Button
              onClick={handleBack}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Back to Step 1
            </Button>
            <Button
              onClick={runEnrichment}
              variant="secondary"
              disabled={isEnriching}
              className="border-slate-700 text-slate-200 bg-slate-800 hover:bg-slate-700"
            >
              {isEnriching ? `Enriching ${enrichProgress.done}/${enrichProgress.total} (${enrichProgress.failed} failed)` : 'Run Enrichment'}
            </Button>
            {enrichmentCompleted && draft.step2.enrichedData && Object.keys(draft.step2.enrichedData).length > 0 && (
              <Button
                onClick={() => setShowEnrichedDataPreview(true)}
                variant="outline"
                className="border-green-700 text-green-300 hover:bg-green-900/20"
              >
                <Search className="w-4 h-4 mr-2" />
                View Enriched Data
              </Button>
            )}
            <Button
              onClick={runDeduplication}
              variant="secondary"
              disabled={isDeduplicating || !enrichmentCompleted}
              className="border-amber-700 text-amber-200 bg-amber-800/50 hover:bg-amber-700/50"
            >
              {isDeduplicating ? 'Finding Duplicates...' : 'Find Duplicates'}
            </Button>
            <Button
              onClick={handleNext}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Continue to Templates
            </Button>
          </div>
        </div>
      </div>

      {/* Enriched Data Preview Modal */}
      <Dialog open={showEnrichedDataPreview} onOpenChange={setShowEnrichedDataPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Enriched Data Preview</DialogTitle>
            <DialogDescription className="text-slate-400">
              View enriched data for your recipients before proceeding to template selection
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {draft.step2.enrichmentStats && (
              <div className="grid grid-cols-3 gap-4 p-4 bg-slate-800 rounded-lg border border-slate-700">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{draft.step2.enrichmentStats.successful}</div>
                  <div className="text-xs text-slate-400">Successful</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">{draft.step2.enrichmentStats.failed}</div>
                  <div className="text-xs text-slate-400">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{draft.step2.enrichmentStats.total}</div>
                  <div className="text-xs text-slate-400">Total</div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="font-semibold text-white text-sm">Sample Enriched Recipients (First 5)</h3>
              {draft.step1.recipients.slice(0, 5).map((recipient) => {
                const enrichedData = draft.step2.enrichedData?.[recipient.id || 0]
                if (!enrichedData) return null

                return (
                  <div key={recipient.id} className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-semibold text-white">{recipient.name}</div>
                        <div className="text-sm text-slate-400">{recipient.email}</div>
                      </div>
                      <span className="px-2 py-1 bg-green-900/30 text-green-400 rounded text-xs border border-green-700">
                        Enriched
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {enrichedData.company_name && (
                        <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
                          <div className="text-xs text-slate-500">Company</div>
                          <div className="text-slate-300 font-medium">{enrichedData.company_name}</div>
                        </div>
                      )}
                      {enrichedData.job_title && (
                        <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
                          <div className="text-xs text-slate-500">Job Title</div>
                          <div className="text-slate-300 font-medium">{enrichedData.job_title}</div>
                        </div>
                      )}
                      {enrichedData.industry && (
                        <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
                          <div className="text-xs text-slate-500">Industry</div>
                          <div className="text-slate-300 font-medium">{enrichedData.industry}</div>
                        </div>
                      )}
                      {enrichedData.company_size && (
                        <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
                          <div className="text-xs text-slate-500">Company Size</div>
                          <div className="text-slate-300 font-medium">{enrichedData.company_size}</div>
                        </div>
                      )}
                      {enrichedData.linkedin_url && (
                        <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
                          <div className="text-xs text-slate-500">LinkedIn</div>
                          <a 
                            href={enrichedData.linkedin_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                          >
                            View Profile <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                      {enrichedData.phone_number && (
                        <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
                          <div className="text-xs text-slate-500">Phone</div>
                          <div className="text-slate-300 font-medium">{enrichedData.phone_number}</div>
                        </div>
                      )}
                    </div>

                    {enrichedData.tech_stack && Array.isArray(enrichedData.tech_stack) && enrichedData.tech_stack.length > 0 && (
                      <div className="mt-3">
                        <div className="text-xs text-slate-500 mb-1">Tech Stack</div>
                        <div className="flex flex-wrap gap-1">
                          {enrichedData.tech_stack.slice(0, 10).map((tech: string, idx: number) => (
                            <span key={idx} className="px-2 py-1 bg-blue-900/30 text-blue-300 rounded text-xs border border-blue-700">
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={() => setShowEnrichedDataPreview(false)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Close Preview
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
