'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import apiClient from '@/lib/api'
import { toast } from 'sonner'
import {
  ArrowLeft, ArrowRight, Mail, Clock, Users, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, Zap, TrendingUp, Eye, Calendar, Brain,
  RefreshCw, Play, Pause, Target, Filter, Search, BarChart3,
  AlertTriangle, CheckCheck, Send, Settings, ExternalLink, Sparkles,
  Timer, CalendarClock, Wand2, LayoutDashboard
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface RecipientFollowupData {
  id: number
  recipient_id: number
  email: string
  name: string | null
  company: string | null
  position: string | null
  email_status: string
  sent_at: string | null
  opened_at: string | null
  replied_at: string | null
  bounced_at: string | null
  days_since_sent: number | null
  has_followup: boolean
  followup_id: number | null
  followup_status: string | null
  followup_current_step: number | null
  followup_total_steps: number | null
  followup_next_send: string | null
  followup_emails_sent: number
  recommendation: string | null
}

interface FollowupSequence {
  id: number
  name: string
  description: string | null
  is_system_preset: boolean
  num_steps: number
  total_delay_days: number
  times_used: number
  reply_rate: number
  is_current: boolean
  steps_preview: Array<{
    step: number
    delay_days: number
    strategy: string
    tone: string
  }>
}

interface CampaignFollowupStatus {
  campaign_id: number
  campaign_name: string
  campaign_status: string
  enable_follow_up: boolean
  follow_up_sequence_id: number | null
  summary: {
    total_recipients: number
    total_sent: number
    total_opened: number
    total_replied: number
    total_with_followup: number
    total_needing_followup: number
    open_rate: number
    reply_rate: number
    followup_coverage: number
  }
  recipients: RecipientFollowupData[]
  pagination: {
    page: number
    page_size: number
    total: number
    total_pages: number
  }
}

type ScheduleMode = 'smart' | 'immediate' | 'custom'
type FilterOption = 'all' | 'sent' | 'has_followup' | 'no_followup' | 'needs_attention'

export default function Step5FollowUpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const campaignId = searchParams.get('campaignId')

  // Data state
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<CampaignFollowupStatus | null>(null)
  const [sequences, setSequences] = useState<FollowupSequence[]>([])
  const [error, setError] = useState<string | null>(null)

  // Selection state
  const [selectedRecipients, setSelectedRecipients] = useState<Set<number>>(new Set())
  const [selectAll, setSelectAll] = useState(false)

  // Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [filterOption, setFilterOption] = useState<FilterOption>('all')

  // Scheduling state
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('smart')
  const [customDelayDays, setCustomDelayDays] = useState(3)
  const [selectedSequenceId, setSelectedSequenceId] = useState<number | null>(null)
  const [scheduling, setScheduling] = useState(false)

  // UI state
  const [expandedRecipient, setExpandedRecipient] = useState<number | null>(null)
  const [page, setPage] = useState(1)

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!campaignId) return

    try {
      setLoading(true)
      setError(null)

      const [statusRes, sequencesRes] = await Promise.all([
        apiClient.get(`/campaigns/${campaignId}/followup-status`, {
          params: { page, page_size: 50, filter_status: filterOption === 'all' ? undefined : filterOption }
        }),
        apiClient.get(`/campaigns/${campaignId}/followup-sequences`)
      ])

      setData(statusRes.data)
      setSequences(sequencesRes.data.sequences)
      setSelectedSequenceId(sequencesRes.data.current_sequence_id)

    } catch (err: any) {
      console.error('Failed to fetch data:', err)
      setError(err.response?.data?.detail || 'Failed to load campaign data')
    } finally {
      setLoading(false)
    }
  }, [campaignId, page, filterOption])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Selection handlers
  const handleSelectRecipient = (id: number) => {
    const newSelected = new Set(selectedRecipients)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedRecipients(newSelected)
    setSelectAll(false)
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRecipients(new Set())
    } else {
      const eligibleIds = data?.recipients
        .filter(r => r.email_status === 'sent' && !r.has_followup)
        .map(r => r.id) || []
      setSelectedRecipients(new Set(eligibleIds))
    }
    setSelectAll(!selectAll)
  }

  const handleSelectNeedsAttention = () => {
    const needsAttention = data?.recipients
      .filter(r => r.recommendation && ['opened_high_priority', 'no_response_followup_recommended'].includes(r.recommendation))
      .map(r => r.id) || []
    setSelectedRecipients(new Set(needsAttention))
  }

  // Schedule follow-ups
  const handleScheduleFollowups = async () => {
    if (selectedRecipients.size === 0) {
      toast.error('Please select recipients to schedule follow-ups')
      return
    }

    if (!selectedSequenceId) {
      toast.error('Please select a follow-up sequence')
      return
    }

    try {
      setScheduling(true)

      const params = new URLSearchParams()
      selectedRecipients.forEach(id => params.append('recipient_ids', id.toString()))
      params.append('schedule_mode', scheduleMode)
      params.append('sequence_id', selectedSequenceId.toString())
      if (scheduleMode === 'custom') {
        params.append('delay_days', customDelayDays.toString())
      }

      const response = await apiClient.post(
        `/campaigns/${campaignId}/schedule-followups?${params.toString()}`
      )

      toast.success(response.data.message)
      setShowScheduleModal(false)
      setSelectedRecipients(new Set())
      fetchData()

    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to schedule follow-ups')
    } finally {
      setScheduling(false)
    }
  }

  // Cancel follow-ups
  const handleCancelFollowups = async () => {
    const withFollowups = data?.recipients.filter(r =>
      selectedRecipients.has(r.id) && r.has_followup
    ) || []

    if (withFollowups.length === 0) {
      toast.error('No follow-ups to cancel in selection')
      return
    }

    try {
      const params = new URLSearchParams()
      withFollowups.forEach(r => params.append('recipient_ids', r.id.toString()))

      await apiClient.post(`/campaigns/${campaignId}/cancel-followups?${params.toString()}`)
      toast.success(`Cancelled ${withFollowups.length} follow-ups`)
      setSelectedRecipients(new Set())
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to cancel follow-ups')
    }
  }

  // Filter recipients
  const filteredRecipients = data?.recipients.filter(r => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      if (!r.email?.toLowerCase().includes(search) &&
          !r.name?.toLowerCase().includes(search) &&
          !r.company?.toLowerCase().includes(search)) {
        return false
      }
    }
    if (filterOption === 'needs_attention') {
      return r.recommendation && ['opened_high_priority', 'no_response_followup_recommended'].includes(r.recommendation)
    }
    return true
  }) || []

  // Get status badge
  const getStatusBadge = (recipient: RecipientFollowupData) => {
    if (recipient.replied_at) {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/50">Replied</Badge>
    }
    if (recipient.bounced_at) {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/50">Bounced</Badge>
    }
    if (recipient.opened_at) {
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">Opened</Badge>
    }
    if (recipient.email_status === 'sent') {
      return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/50">Sent</Badge>
    }
    return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">Pending</Badge>
  }

  // Get recommendation badge
  const getRecommendationBadge = (recommendation: string | null) => {
    switch (recommendation) {
      case 'opened_high_priority':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50">High Priority</Badge>
      case 'no_response_followup_recommended':
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">Follow-up Recommended</Badge>
      case 'replied_no_followup':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/50">Replied - Skip</Badge>
      case 'waiting':
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/50">Waiting</Badge>
      default:
        return null
    }
  }

  if (!campaignId) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Campaign Selected</h2>
          <p className="text-slate-400 mb-4">Please select a campaign to manage follow-ups</p>
          <Button onClick={() => router.push('/campaigns')}>
            Go to Campaigns
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-slate-400">Loading follow-up data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Data</h2>
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={fetchData}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/70 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/campaigns')}
                className="flex items-center gap-2 text-slate-200 hover:text-white hover:bg-slate-800/60"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Campaigns
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/pipeline')}
              className="flex items-center gap-2 border-blue-600 text-blue-400 hover:bg-blue-600/20"
            >
              <LayoutDashboard className="w-4 h-4" />
              Follow-Up Dashboard
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Mail className="w-8 h-8 text-blue-500" />
              Follow-Up Management
            </h1>
            <p className="text-slate-400 mt-1">
              Step 5 of 5: {data?.campaign_name} - Schedule and manage follow-up emails
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-slate-900/60 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                    step === 5
                      ? 'bg-blue-600 text-white shadow-[0_0_0_4px_rgba(59,130,246,0.2)]'
                      : 'bg-green-600 text-white'
                  }`}
                >
                  {step < 5 ? <CheckCircle2 className="w-5 h-5" /> : step}
                </div>
                {step < 5 && (
                  <div className="flex-1 h-1 w-8 mx-2 rounded-full bg-green-600" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <Send className="w-4 h-4" />
                <span className="text-xs">Total Sent</span>
              </div>
              <p className="text-2xl font-bold text-white">{data?.summary.total_sent}</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <Eye className="w-4 h-4" />
                <span className="text-xs">Opened</span>
              </div>
              <p className="text-2xl font-bold text-blue-400">{data?.summary.total_opened}</p>
              <p className="text-xs text-slate-500">{data?.summary.open_rate}% rate</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <CheckCheck className="w-4 h-4" />
                <span className="text-xs">Replied</span>
              </div>
              <p className="text-2xl font-bold text-green-400">{data?.summary.total_replied}</p>
              <p className="text-xs text-slate-500">{data?.summary.reply_rate}% rate</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <Timer className="w-4 h-4" />
                <span className="text-xs">With Follow-up</span>
              </div>
              <p className="text-2xl font-bold text-purple-400">{data?.summary.total_with_followup}</p>
              <p className="text-xs text-slate-500">{data?.summary.followup_coverage}% coverage</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <Target className="w-4 h-4" />
                <span className="text-xs">Need Follow-up</span>
              </div>
              <p className="text-2xl font-bold text-orange-400">{data?.summary.total_needing_followup}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-lg p-4 border border-blue-500/30">
              <div className="flex items-center gap-2 text-blue-300 mb-2">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs">AI Recommendation</span>
              </div>
              <p className="text-sm font-medium text-white">
                {data?.summary.total_needing_followup && data.summary.total_needing_followup > 0
                  ? `Schedule ${data.summary.total_needing_followup} follow-ups`
                  : 'All caught up!'}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={handleSelectNeedsAttention}
                variant="outline"
                size="sm"
                className="border-orange-500/50 text-orange-400 hover:bg-orange-500/20"
              >
                <Target className="w-4 h-4 mr-2" />
                Select High Priority ({data?.summary.total_needing_followup || 0})
              </Button>
              <Button
                onClick={() => {
                  const noFollowup = data?.recipients.filter(r => r.email_status === 'sent' && !r.has_followup).map(r => r.id) || []
                  setSelectedRecipients(new Set(noFollowup))
                }}
                variant="outline"
                size="sm"
                className="border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
              >
                <Clock className="w-4 h-4 mr-2" />
                Select Without Follow-up ({(data?.summary.total_sent || 0) - (data?.summary.total_with_followup || 0)})
              </Button>
              {selectedRecipients.size > 0 && (
                <>
                  <div className="h-6 w-px bg-slate-600" />
                  <Badge variant="secondary" className="bg-blue-600/20 text-blue-400">
                    {selectedRecipients.size} selected
                  </Badge>
                  <Button
                    onClick={() => setShowScheduleModal(true)}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    Smart Schedule
                  </Button>
                  <Button
                    onClick={handleCancelFollowups}
                    variant="outline"
                    size="sm"
                    className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel Follow-ups
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by email, name, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              {(['all', 'sent', 'has_followup', 'no_followup', 'needs_attention'] as FilterOption[]).map((option) => (
                <Button
                  key={option}
                  variant={filterOption === option ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterOption(option)}
                  className={filterOption === option ? 'bg-blue-600' : 'border-slate-600 text-slate-300'}
                >
                  {option.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Button>
              ))}
            </div>
          </div>

          {/* Recipients Table */}
          <div className="bg-slate-800/30 rounded-lg border border-slate-700 overflow-hidden">
            {/* Table Header */}
            <div className="bg-slate-800/50 px-4 py-3 border-b border-slate-700">
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded bg-slate-700 border-slate-600"
                />
                <span className="text-sm font-medium text-slate-300">
                  {filteredRecipients.length} recipients
                </span>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-slate-700/50 max-h-[600px] overflow-y-auto">
              {filteredRecipients.map((recipient) => (
                <div
                  key={recipient.id}
                  className={`px-4 py-3 hover:bg-slate-800/30 transition-colors ${
                    selectedRecipients.has(recipient.id) ? 'bg-blue-600/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={selectedRecipients.has(recipient.id)}
                      onChange={() => handleSelectRecipient(recipient.id)}
                      className="w-4 h-4 rounded bg-slate-700 border-slate-600"
                    />

                    {/* Recipient Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white truncate">
                          {recipient.name || recipient.email}
                        </span>
                        {getStatusBadge(recipient)}
                        {getRecommendationBadge(recipient.recommendation)}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span>{recipient.email}</span>
                        {recipient.company && (
                          <>
                            <span>•</span>
                            <span>{recipient.company}</span>
                          </>
                        )}
                        {recipient.days_since_sent !== null && (
                          <>
                            <span>•</span>
                            <span>{recipient.days_since_sent}d ago</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Follow-up Status */}
                    <div className="text-right min-w-[200px]">
                      {recipient.has_followup ? (
                        <div>
                          <div className="flex items-center gap-2 justify-end">
                            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">
                              <Play className="w-3 h-3 mr-1" />
                              Step {recipient.followup_current_step}/{recipient.followup_total_steps}
                            </Badge>
                          </div>
                          {recipient.followup_next_send && (
                            <p className="text-xs text-slate-400 mt-1">
                              Next: {new Date(recipient.followup_next_send).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-500">No follow-up scheduled</span>
                      )}
                    </div>

                    {/* Expand Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedRecipient(expandedRecipient === recipient.id ? null : recipient.id)}
                    >
                      {expandedRecipient === recipient.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {/* Expanded Details */}
                  {expandedRecipient === recipient.id && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-slate-400 text-xs">Sent At</p>
                        <p className="text-white">{recipient.sent_at ? new Date(recipient.sent_at).toLocaleString() : 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs">Opened At</p>
                        <p className="text-white">{recipient.opened_at ? new Date(recipient.opened_at).toLocaleString() : 'Not opened'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs">Replied At</p>
                        <p className="text-white">{recipient.replied_at ? new Date(recipient.replied_at).toLocaleString() : 'No reply'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs">Follow-up Emails Sent</p>
                        <p className="text-white">{recipient.followup_emails_sent}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {filteredRecipients.length === 0 && (
                <div className="px-4 py-12 text-center text-slate-400">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No recipients match your filters</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {data && data.pagination.total_pages > 1 && (
              <div className="bg-slate-800/50 px-4 py-3 border-t border-slate-700 flex items-center justify-between">
                <span className="text-sm text-slate-400">
                  Page {data.pagination.page} of {data.pagination.total_pages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === data.pagination.total_pages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Sequence Selection */}
          <div className="bg-slate-800/30 rounded-lg border border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-500" />
              Follow-Up Sequences
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sequences.map((seq) => (
                <div
                  key={seq.id}
                  onClick={() => setSelectedSequenceId(seq.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedSequenceId === seq.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-600 hover:border-slate-500 bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-white">{seq.name}</h4>
                    {seq.is_current && (
                      <Badge className="bg-green-500/20 text-green-400">Current</Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 mb-3">{seq.description || 'No description'}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span>{seq.num_steps} steps</span>
                    <span>•</span>
                    <span>{seq.total_delay_days} days total</span>
                    <span>•</span>
                    <span>{seq.reply_rate}% reply rate</span>
                  </div>
                  {seq.steps_preview.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-700">
                      <div className="flex gap-2">
                        {seq.steps_preview.map((step, i) => (
                          <div key={i} className="text-xs bg-slate-700/50 rounded px-2 py-1">
                            {step.delay_days}d - {step.strategy}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-800">
            <Button
              variant="outline"
              onClick={() => router.push('/campaigns')}
              className="border-slate-600"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Campaigns
            </Button>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.push('/pipeline')}
                className="border-blue-500/50 text-blue-400 hover:bg-blue-500/20"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                View Follow-Up Dashboard
              </Button>
              <Button
                onClick={() => setShowScheduleModal(true)}
                disabled={selectedRecipients.size === 0}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Schedule Follow-ups ({selectedRecipients.size})
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl border border-slate-700 p-6 w-full max-w-lg mx-4">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <CalendarClock className="w-6 h-6 text-blue-500" />
              Schedule Follow-ups
            </h3>

            <p className="text-slate-400 mb-6">
              Schedule follow-ups for {selectedRecipients.size} recipients
            </p>

            {/* Schedule Mode Selection */}
            <div className="space-y-3 mb-6">
              <label className="text-sm font-medium text-slate-300">Scheduling Mode</label>

              <div
                onClick={() => setScheduleMode('smart')}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  scheduleMode === 'smart'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-600 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Brain className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-white">Smart AI Schedule</p>
                    <p className="text-sm text-slate-400">
                      ML-optimized timing based on engagement patterns
                    </p>
                  </div>
                </div>
              </div>

              <div
                onClick={() => setScheduleMode('immediate')}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  scheduleMode === 'immediate'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-600 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="font-medium text-white">Immediate</p>
                    <p className="text-sm text-slate-400">
                      Start sending within the next hour
                    </p>
                  </div>
                </div>
              </div>

              <div
                onClick={() => setScheduleMode('custom')}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  scheduleMode === 'custom'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-600 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-purple-500" />
                  <div className="flex-1">
                    <p className="font-medium text-white">Custom Delay</p>
                    <p className="text-sm text-slate-400">
                      Set specific days from original send
                    </p>
                  </div>
                </div>
                {scheduleMode === 'custom' && (
                  <div className="mt-3 flex items-center gap-2">
                    <Input
                      type="number"
                      value={customDelayDays}
                      onChange={(e) => setCustomDelayDays(parseInt(e.target.value) || 3)}
                      min={1}
                      max={30}
                      className="w-20 bg-slate-800 border-slate-600"
                    />
                    <span className="text-slate-400">days after original email</span>
                  </div>
                )}
              </div>
            </div>

            {/* Selected Sequence */}
            <div className="mb-6">
              <label className="text-sm font-medium text-slate-300 block mb-2">
                Using Sequence
              </label>
              <div className="bg-slate-800 rounded-lg p-3 border border-slate-600">
                <p className="font-medium text-white">
                  {sequences.find(s => s.id === selectedSequenceId)?.name || 'Select a sequence'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowScheduleModal(false)}
                className="border-slate-600"
              >
                Cancel
              </Button>
              <Button
                onClick={handleScheduleFollowups}
                disabled={scheduling || !selectedSequenceId}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {scheduling ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Schedule {selectedRecipients.size} Follow-ups
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
