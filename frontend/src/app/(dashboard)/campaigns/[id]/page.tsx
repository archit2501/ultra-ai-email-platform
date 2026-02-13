'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft, Pause, Play, X, RefreshCw, 
  Mail, MailOpen, Reply, XCircle, Clock,
  TrendingUp, Users, CheckCircle, AlertCircle
} from 'lucide-react'
import { groupCampaignsAPI } from '@/lib/api'
import { toast } from 'sonner'

interface CampaignStatus {
  campaign_id: number
  campaign_name?: string
  status: string
  total_recipients?: number
  progress?: {
    total_recipients: number
    sent_count: number
    failed_count: number
    skipped_count: number
    opened_count: number
    replied_count: number
    bounced_count: number
  }
  rates?: {
    success_rate: number
    open_rate: number
    reply_rate: number
    bounce_rate: number
  }
  timing?: {
    duration_seconds: number | null
    started_at: string | null
    completed_at: string | null
  }
  error_message?: string | null
}

interface CampaignEvent {
  timestamp: string
  event_type: string
  recipient_email: string
  message: string
  status: 'success' | 'failed' | 'pending'
}

export default function CampaignMonitorPage() {
  const router = useRouter()
  const params = useParams()
  const campaignId = params?.id as string
  
  const [status, setStatus] = useState<CampaignStatus | null>(null)
  const [events, setEvents] = useState<CampaignEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const eventSourceRef = useRef<EventSource | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Fetch campaign status
  const fetchStatus = async () => {
    if (!campaignId) return
    
    try {
      const { data } = await groupCampaignsAPI.getStatus(parseInt(campaignId))
      setStatus(data)
      setIsLoading(false)
    } catch (error: any) {
      console.error('Failed to fetch campaign status:', error)
      setError(error?.response?.data?.detail || 'Failed to load campaign')
      setIsLoading(false)
    }
  }

  // Connect to SSE event stream
  const connectEventStream = () => {
    if (!campaignId) return
    
    const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '')
    const eventSource = new EventSource(`${apiBaseUrl}/campaigns/${campaignId}/events`)
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        // Add event to timeline
        if (data.event) {
          setEvents(prev => [data.event, ...prev].slice(0, 50)) // Keep last 50 events
        }
        
        // Update status if included
        if (data.status) {
          setStatus(data.status)
        }
      } catch (err) {
        console.error('Failed to parse SSE event:', err)
      }
    }

    eventSource.onerror = () => {
      console.error('SSE connection error, falling back to polling')
      eventSource.close()
      startPolling()
    }

    eventSourceRef.current = eventSource
  }

  // Fallback polling
  const startPolling = () => {
    if (pollingRef.current) return
    
    pollingRef.current = setInterval(() => {
      fetchStatus()
    }, 3000) // Poll every 3 seconds
  }

  // Cleanup
  useEffect(() => {
    fetchStatus()
    connectEventStream()
    
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [campaignId])

  // Action handlers
  const handlePause = async () => {
    if (!campaignId) return
    
    try {
      await groupCampaignsAPI.pause(parseInt(campaignId))
      toast.success('Campaign paused')
      fetchStatus()
    } catch (error: any) {
      toast.error('Failed to pause campaign', { description: error?.response?.data?.detail })
    }
  }

  const handleResume = async () => {
    if (!campaignId) return
    
    try {
      await groupCampaignsAPI.resume(parseInt(campaignId))
      toast.success('Campaign resumed')
      fetchStatus()
    } catch (error: any) {
      toast.error('Failed to resume campaign', { description: error?.response?.data?.detail })
    }
  }

  const handleCancel = async () => {
    if (!campaignId) return
    if (!confirm('Are you sure you want to cancel this campaign? This cannot be undone.')) return
    
    try {
      await groupCampaignsAPI.cancel(parseInt(campaignId))
      toast.success('Campaign cancelled')
      fetchStatus()
    } catch (error: any) {
      toast.error('Failed to cancel campaign', { description: error?.response?.data?.detail })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading campaign...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Error Loading Campaign</h2>
          <p className="text-slate-400 mb-4">{error}</p>
          <Button onClick={() => router.push('/campaigns')}>
            Back to Campaigns
          </Button>
        </div>
      </div>
    )
  }

  if (!status) return null

  const progress = status.progress && status.progress.total_recipients > 0 
    ? ((status.progress.sent_count + status.progress.failed_count + status.progress.skipped_count) / status.progress.total_recipients) * 100 
    : 0

  const isActive = status.status === 'sending'
  const isPaused = status.status === 'paused'
  const isCompleted = status.status === 'completed'
  const isFailed = status.status === 'failed'
  
  // Safe data extraction
  const totalRecipients = status.progress?.total_recipients || 0
  const sentCount = status.progress?.sent_count || 0
  const failedCount = status.progress?.failed_count || 0
  const skippedCount = status.progress?.skipped_count || 0
  const openedCount = status.progress?.opened_count || 0
  const repliedCount = status.progress?.replied_count || 0
  const bouncedCount = status.progress?.bounced_count || 0
  
  const successRate = status.rates?.success_rate || 0
  const openRate = status.rates?.open_rate || 0
  const replyRate = status.rates?.reply_rate || 0

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/campaigns')}
              className="gap-2 text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Campaigns
            </Button>
            
            <div className="flex gap-2">
              {isActive && (
                <Button onClick={handlePause} variant="outline" className="gap-2">
                  <Pause className="w-4 h-4" />
                  Pause
                </Button>
              )}
              {isPaused && (
                <Button onClick={handleResume} className="gap-2 bg-green-600 hover:bg-green-700">
                  <Play className="w-4 h-4" />
                  Resume
                </Button>
              )}
              {(isActive || isPaused) && (
                <Button onClick={handleCancel} variant="destructive" className="gap-2">
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              )}
              <Button onClick={fetchStatus} variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Campaign #{campaignId}</h1>
              <div className="flex items-center gap-3 mt-2">
                <Badge className={
                  isActive ? 'bg-blue-500' :
                  isPaused ? 'bg-yellow-500' :
                  isCompleted ? 'bg-green-500' :
                  isFailed ? 'bg-red-500' :
                  'bg-slate-500'
                }>
                  {status.status.toUpperCase()}
                </Badge>
                {status.timing && status.timing.duration_seconds !== null && status.timing.duration_seconds > 0 && (
                  <span className="text-slate-400 text-sm flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {Math.floor((status.timing.duration_seconds as number) / 60)}m {(status.timing.duration_seconds as number) % 60}s
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Progress Overview */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Progress</CardTitle>
            <CardDescription>Real-time campaign sending progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">
                  {sentCount + failedCount + skippedCount} / {totalRecipients} recipients
                </span>
                <span className="text-white font-semibold">{progress.toFixed(1)}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-slate-400">Sent</span>
                </div>
                <div className="text-2xl font-bold text-white">{sentCount}</div>
                <div className="text-xs text-green-400">{successRate.toFixed(1)}%</div>
              </div>

              <div className="p-4 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MailOpen className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-slate-400">Opened</span>
                </div>
                <div className="text-2xl font-bold text-white">{openedCount}</div>
                <div className="text-xs text-blue-400">{openRate.toFixed(1)}%</div>
              </div>

              <div className="p-4 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Reply className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-slate-400">Replied</span>
                </div>
                <div className="text-2xl font-bold text-white">{repliedCount}</div>
                <div className="text-xs text-purple-400">{replyRate.toFixed(1)}%</div>
              </div>

              <div className="p-4 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span className="text-xs text-slate-400">Failed</span>
                </div>
                <div className="text-2xl font-bold text-white">{failedCount + bouncedCount}</div>
                <div className="text-xs text-red-400">{((failedCount + bouncedCount) / totalRecipients * 100).toFixed(1)}%</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Event Timeline */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Live Event Timeline</CardTitle>
            <CardDescription>Real-time campaign events (last 50)</CardDescription>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No events yet. Events will appear as the campaign progresses.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {events.map((event, idx) => (
                  <div 
                    key={idx} 
                    className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {event.event_type === 'sent' && <Mail className="w-4 h-4 text-green-400" />}
                          {event.event_type === 'opened' && <MailOpen className="w-4 h-4 text-blue-400" />}
                          {event.event_type === 'replied' && <Reply className="w-4 h-4 text-purple-400" />}
                          {event.event_type === 'failed' && <XCircle className="w-4 h-4 text-red-400" />}
                          <span className="text-sm font-medium text-white">{event.event_type.toUpperCase()}</span>
                          <Badge className={
                            event.status === 'success' ? 'bg-green-500/20 text-green-400' :
                            event.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }>
                            {event.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-300">{event.message}</p>
                        <p className="text-xs text-slate-500 mt-1">{event.recipient_email}</p>
                      </div>
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
