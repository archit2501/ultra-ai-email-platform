'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Mail, AlertCircle, Eye, ChevronDown, ChevronUp, MousePointer, Reply } from 'lucide-react'

export interface CampaignStats {
  totalSent: number
  totalOpens: number
  totalClicks: number
  totalReplies: number
  totalBounces: number
  totalErrors: number
  openRate: number
  clickRate: number
  replyRate: number
  bounceRate: number
  errorRate: number
}

interface PerformanceMonitorProps {
  campaignActive?: boolean
}

function generateStats(baseStats?: Partial<CampaignStats>): CampaignStats {
  const totalSent = baseStats?.totalSent || Math.floor(Math.random() * 500) + 100
  return {
    totalSent,
    totalOpens: baseStats?.totalOpens || Math.floor(totalSent * (Math.random() * 0.4 + 0.15)),
    totalClicks: baseStats?.totalClicks || Math.floor(totalSent * (Math.random() * 0.1 + 0.02)),
    totalReplies: baseStats?.totalReplies || Math.floor(totalSent * (Math.random() * 0.07 + 0.01)),
    totalBounces: baseStats?.totalBounces || Math.floor(totalSent * (Math.random() * 0.05 + 0.01)),
    totalErrors: baseStats?.totalErrors || Math.floor(totalSent * (Math.random() * 0.02)),
    openRate: baseStats?.openRate || Math.floor((Math.random() * 0.4 + 0.15) * 100),
    clickRate: baseStats?.clickRate || Math.floor((Math.random() * 0.1 + 0.02) * 100),
    replyRate: baseStats?.replyRate || Math.floor((Math.random() * 0.07 + 0.01) * 100),
    bounceRate: baseStats?.bounceRate || Math.floor((Math.random() * 0.05 + 0.01) * 100),
    errorRate: baseStats?.errorRate || Math.floor((Math.random() * 0.02) * 100),
  }
}

export function CampaignPerformanceMonitor({ campaignActive = false }: PerformanceMonitorProps) {
  const [expanded, setExpanded] = useState(true)
  const [stats, setStats] = useState<CampaignStats>(generateStats())
  const [liveData, setLiveData] = useState<CampaignStats[]>([stats])

  // Simulate live updates
  useEffect(() => {
    if (!campaignActive) return

    const interval = setInterval(() => {
      const newStats = generateStats({
        totalSent: stats.totalSent + Math.floor(Math.random() * 20) + 5,
        totalOpens: stats.totalOpens + Math.floor(Math.random() * 5),
        totalClicks: stats.totalClicks + Math.floor(Math.random() * 2),
        totalReplies: stats.totalReplies + (Math.random() > 0.7 ? 1 : 0),
      })
      setStats(newStats)
      setLiveData((prev) => [...prev.slice(-19), newStats])
    }, 3000)

    return () => clearInterval(interval)
  }, [campaignActive, stats])

  const conversionRate = stats.totalSent > 0 ? Math.round((stats.totalReplies / stats.totalSent) * 10000) / 100 : 0

  return (
    <div className="rounded-lg border-2 border-slate-800 bg-slate-900 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-6 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-emerald-400" />
          <h4 className="text-lg font-bold text-white">Performance Monitor</h4>
          {campaignActive && (
            <div className="ml-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-green-400 font-semibold">LIVE</span>
            </div>
          )}
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>

      {expanded && (
        <div className="px-6 pb-6 space-y-6">
          {/* Primary Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-400">Total Sent</p>
                <Mail className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-3xl font-bold text-white">{stats.totalSent}</p>
              <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '75%' }} />
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-400">Opens</p>
                <MousePointer className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-3xl font-bold text-green-400">{stats.totalOpens}</p>
              <p className="text-xs text-slate-500 mt-1">{stats.openRate}% open rate</p>
            </div>

            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-400">Replies</p>
                <Reply className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-3xl font-bold text-purple-400">{stats.totalReplies}</p>
              <p className="text-xs text-slate-500 mt-1">{conversionRate}% conversion</p>
            </div>
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-white">Clicks</p>
                <MousePointer className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-cyan-400">{stats.totalClicks}</p>
                <p className="text-xs text-slate-500">{stats.clickRate}% CTR</p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-white">Bounces & Errors</p>
                <AlertCircle className="w-4 h-4 text-red-400" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Bounces:</span>
                  <span className="font-semibold text-orange-400">
                    {stats.totalBounces} ({stats.bounceRate}%)
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Errors:</span>
                  <span className="font-semibold text-red-400">
                    {stats.totalErrors} ({stats.errorRate}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Rate Distribution */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-white">Engagement Breakdown</p>
            {[
              { label: 'Open Rate', value: stats.openRate, color: 'from-green-500 to-emerald-400', icon: Eye },
              { label: 'Click Rate', value: stats.clickRate, color: 'from-cyan-500 to-blue-400', icon: MousePointer },
              { label: 'Reply Rate', value: stats.replyRate, color: 'from-purple-500 to-pink-400', icon: Reply },
            ].map((metric) => (
              <div key={metric.label} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <metric.icon className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-400">{metric.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-white">{metric.value}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${metric.color} transition-all`}
                    style={{ width: `${Math.min(metric.value * 5, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Live Trend Chart Mockup */}
          {campaignActive && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">Live Send Trend (Last 20 updates)</p>
              <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700 h-24 flex items-end gap-1">
                {liveData.map((stat, idx) => (
                  <div
                    key={idx}
                    className="flex-1 bg-gradient-to-t from-green-500 to-emerald-400 rounded-t opacity-70 hover:opacity-100 transition-opacity"
                    style={{ height: `${(stat.totalSent / 100) * 100}%`, minHeight: '4px' }}
                    title={`${stat.totalSent} sent`}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-500">Updates every 3 seconds</p>
            </div>
          )}

          {/* Summary Card */}
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-emerald-300">Campaign Summary</p>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
              <p>
                <span className="font-semibold text-emerald-300">{Math.round((stats.totalSent / 1000) * 100)}%</span> of target
                reached
              </p>
              <p>
                <span className="font-semibold text-green-300">{stats.openRate}%</span> average open rate
              </p>
              <p>
                <span className="font-semibold text-purple-300">{stats.totalReplies}</span> responses so far
              </p>
              <p>
                <span className="font-semibold text-emerald-300">{conversionRate}%</span> conversion rate
              </p>
            </div>
          </div>

          {!campaignActive && (
            <div className="p-4 rounded-lg bg-slate-800/30 border border-dashed border-slate-700 text-center">
              <p className="text-sm text-slate-400">
                Stats will update in real-time once you start the campaign
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
