'use client'

import { useState } from 'react'
import { Clock, Globe, AlertCircle, CheckCircle, Edit2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface OptimalSendTime {
  recipientId: number | string
  recipientName: string
  email: string
  timezone: string
  optimalTime: string
  confidence: number
  engagementScore: number
  businessHours: boolean
  customOverride?: string
}

interface SendTimeOptimizationProps {
  recipients: OptimalSendTime[]
  onOverrideTime: (recipientId: number | string, time: string) => void
}

export function SendTimeOptimization({ recipients, onOverrideTime }: SendTimeOptimizationProps) {
  const [expanded, setExpanded] = useState(true)
  const [editingId, setEditingId] = useState<number | string | null>(null)
  const [customTime, setCustomTime] = useState('')
  const [showAll, setShowAll] = useState(false)

  const displayedRecipients = showAll ? recipients : recipients.slice(0, 5)

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-400'
    if (confidence >= 60) return 'text-blue-400'
    return 'text-yellow-400'
  }

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 80) return 'High'
    if (confidence >= 60) return 'Medium'
    return 'Low'
  }

  const totalOptimized = recipients.length
  const avgConfidence = (recipients.reduce((sum, r) => sum + r.confidence, 0) / recipients.length).toFixed(0)

  // Group by optimal time for timeline
  const timeGroups = recipients.reduce((groups: Record<string, number>, r) => {
    const time = r.customOverride || r.optimalTime
    groups[time] = (groups[time] || 0) + 1
    return groups
  }, {})

  const sortedTimes = Object.entries(timeGroups).sort(([a], [b]) => a.localeCompare(b))

  return (
    <div className="rounded-lg border-2 border-slate-800 bg-slate-900 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-6 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-blue-400" />
          <h4 className="text-lg font-bold text-white">Send-Time Optimization</h4>
          <span className="text-sm text-slate-400 ml-2">
            {totalOptimized} recipients optimized (avg confidence: {avgConfidence}%)
          </span>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>

      {expanded && (
        <div className="px-6 pb-6 space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <p className="text-xs text-slate-400 mb-1">Total Recipients</p>
              <p className="text-2xl font-bold text-white">{totalOptimized}</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <p className="text-xs text-slate-400 mb-1">Avg Confidence</p>
              <p className={`text-2xl font-bold ${getConfidenceColor(parseInt(avgConfidence))}`}>
                {avgConfidence}%
              </p>
            </div>
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <p className="text-xs text-slate-400 mb-1">Send Windows</p>
              <p className="text-2xl font-bold text-white">{sortedTimes.length}</p>
            </div>
          </div>

          {/* Timeline Visualization */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-white">Send Timeline</p>
            <div className="space-y-2">
              {sortedTimes.map(([time, count]) => {
                const percentage = (count / recipients.length) * 100
                return (
                  <div key={time}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-300">{time}</span>
                      <span className="text-xs text-slate-400">{count} recipients ({percentage.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recipients List */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-white">Recipient Schedule</p>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {displayedRecipients.map((recipient) => (
                <div
                  key={recipient.recipientId}
                  className="p-3 rounded-lg bg-slate-800/30 border border-slate-700 hover:border-slate-600 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-white text-sm">{recipient.recipientName}</p>
                      <p className="text-xs text-slate-400">{recipient.email}</p>
                    </div>
                    {editingId !== recipient.recipientId ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(recipient.recipientId)}
                        className="text-xs text-slate-400 hover:text-slate-200"
                      >
                        <Edit2 className="w-3 h-3 mr-1" />
                        Override
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (customTime) {
                            onOverrideTime(recipient.recipientId, customTime)
                            setEditingId(null)
                            setCustomTime('')
                          }
                        }}
                        className="text-xs text-green-400 hover:text-green-300"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Save
                      </Button>
                    )}
                  </div>

                  {editingId === recipient.recipientId ? (
                    <input
                      type="time"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm mb-2"
                    />
                  ) : (
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-slate-500">Optimal</p>
                        <p className="text-white font-semibold">{recipient.customOverride || recipient.optimalTime}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Timezone</p>
                        <p className="text-slate-300">{recipient.timezone}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Confidence</p>
                        <p className={`font-semibold ${getConfidenceColor(recipient.confidence)}`}>
                          {recipient.confidence}%
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-700">
                    <Globe className="w-3 h-3 text-slate-500" />
                    <span className="text-xs text-slate-400">Business hours: {recipient.businessHours ? '✓' : '✗'}</span>
                    <span className="text-xs text-slate-400">|</span>
                    <span className="text-xs text-slate-400">Engagement: {recipient.engagementScore}/100</span>
                  </div>
                </div>
              ))}
            </div>

            {recipients.length > 5 && !showAll && (
              <button
                onClick={() => setShowAll(true)}
                className="w-full py-2 text-sm text-blue-400 hover:text-blue-300 mt-2"
              >
                Show {recipients.length - 5} more
              </button>
            )}
          </div>

          {/* Info Box */}
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-1" />
            <div className="text-sm">
              <p className="text-blue-300 font-semibold mb-1">Optimization Details</p>
              <p className="text-slate-400 text-xs">
                Send times are optimized based on recipient timezone, historical engagement patterns, and business hours preferences. You can override individual recipient times.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
