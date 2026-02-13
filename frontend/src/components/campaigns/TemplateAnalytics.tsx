'use client'

import { useState } from 'react'
import { TrendingUp, BarChart3, Eye, Mouse, Reply, Zap, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface TemplateAnalyticsData {
  templateId: number | string
  templateName: string
  openRate: number
  clickRate: number
  replyRate: number
  conversionRate: number
  totalSent: number
  opens: number
  clicks: number
  replies: number
  conversions: number
  performanceTrend: { date: string; rate: number }[]
  similarTemplates: TemplateComparison[]
}

export interface TemplateComparison {
  id: number | string
  name: string
  openRate: number
  clickRate: number
  replyRate: number
  conversionRate: number
  similarity: number // 0-100% how similar
}

interface TemplateAnalyticsProps {
  analytics: TemplateAnalyticsData
}

export function TemplateAnalytics({ analytics }: TemplateAnalyticsProps) {
  const [showTrends, setShowTrends] = useState(true)
  const [showComparison, setShowComparison] = useState(true)

  // Determine performance rating
  const getPerformanceRating = (rate: number) => {
    if (rate >= 40) return { label: 'Excellent', color: 'text-green-400', bgColor: 'bg-green-500/10' }
    if (rate >= 25) return { label: 'Good', color: 'text-blue-400', bgColor: 'bg-blue-500/10' }
    if (rate >= 10) return { label: 'Average', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' }
    return { label: 'Below Average', color: 'text-red-400', bgColor: 'bg-red-500/10' }
  }

  // Get performance color based on rate
  const getMetricColor = (rate: number, type: 'open' | 'click' | 'reply' | 'conversion') => {
    const thresholds = {
      open: { excellent: 40, good: 25, average: 10 },
      click: { excellent: 15, good: 8, average: 3 },
      reply: { excellent: 8, good: 4, average: 1 },
      conversion: { excellent: 5, good: 2.5, average: 1 },
    }

    const t = thresholds[type]
    if (rate >= t.excellent) return 'text-green-400'
    if (rate >= t.good) return 'text-blue-400'
    if (rate >= t.average) return 'text-yellow-400'
    return 'text-red-400'
  }

  const avgOpenRate = analytics.similarTemplates.length > 0
    ? (analytics.similarTemplates.reduce((sum, t) => sum + t.openRate, 0) / analytics.similarTemplates.length)
    : 0

  const avgClickRate = analytics.similarTemplates.length > 0
    ? (analytics.similarTemplates.reduce((sum, t) => sum + t.clickRate, 0) / analytics.similarTemplates.length)
    : 0

  const avgReplyRate = analytics.similarTemplates.length > 0
    ? (analytics.similarTemplates.reduce((sum, t) => sum + t.replyRate, 0) / analytics.similarTemplates.length)
    : 0

  const avgConversionRate = analytics.similarTemplates.length > 0
    ? (analytics.similarTemplates.reduce((sum, t) => sum + t.conversionRate, 0) / analytics.similarTemplates.length)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400">
          <BarChart3 className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white">Template Analytics</h3>
          <p className="text-sm text-slate-400 mt-1">Performance metrics for {analytics.templateName}</p>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Open Rate */}
        <div className={`p-6 rounded-lg border-2 border-slate-800 ${getPerformanceRating(analytics.openRate).bgColor}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Eye className={`w-5 h-5 ${getMetricColor(analytics.openRate, 'open')}`} />
              <label className="text-xs text-slate-400 uppercase tracking-wide">Open Rate</label>
            </div>
          </div>
          <p className={`text-3xl font-bold ${getMetricColor(analytics.openRate, 'open')} mb-2`}>
            {analytics.openRate.toFixed(1)}%
          </p>
          <div className="text-xs text-slate-400">
            <p>{analytics.opens.toLocaleString()} of {analytics.totalSent.toLocaleString()} sent</p>
            {avgOpenRate > 0 && (
              <p className={analytics.openRate > avgOpenRate ? 'text-green-400' : 'text-red-400'}>
                {analytics.openRate > avgOpenRate ? '↑' : '↓'} {Math.abs((analytics.openRate - avgOpenRate)).toFixed(1)}% vs avg
              </p>
            )}
          </div>
        </div>

        {/* Click Rate */}
        <div className={`p-6 rounded-lg border-2 border-slate-800 ${getPerformanceRating(analytics.clickRate * 5).bgColor}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Mouse className={`w-5 h-5 ${getMetricColor(analytics.clickRate, 'click')}`} />
              <label className="text-xs text-slate-400 uppercase tracking-wide">Click Rate</label>
            </div>
          </div>
          <p className={`text-3xl font-bold ${getMetricColor(analytics.clickRate, 'click')} mb-2`}>
            {analytics.clickRate.toFixed(2)}%
          </p>
          <div className="text-xs text-slate-400">
            <p>{analytics.clicks.toLocaleString()} clicks</p>
            {avgClickRate > 0 && (
              <p className={analytics.clickRate > avgClickRate ? 'text-green-400' : 'text-red-400'}>
                {analytics.clickRate > avgClickRate ? '↑' : '↓'} {Math.abs((analytics.clickRate - avgClickRate)).toFixed(2)}% vs avg
              </p>
            )}
          </div>
        </div>

        {/* Reply Rate */}
        <div className={`p-6 rounded-lg border-2 border-slate-800 ${getPerformanceRating(analytics.replyRate * 5).bgColor}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Reply className={`w-5 h-5 ${getMetricColor(analytics.replyRate, 'reply')}`} />
              <label className="text-xs text-slate-400 uppercase tracking-wide">Reply Rate</label>
            </div>
          </div>
          <p className={`text-3xl font-bold ${getMetricColor(analytics.replyRate, 'reply')} mb-2`}>
            {analytics.replyRate.toFixed(2)}%
          </p>
          <div className="text-xs text-slate-400">
            <p>{analytics.replies.toLocaleString()} replies</p>
            {avgReplyRate > 0 && (
              <p className={analytics.replyRate > avgReplyRate ? 'text-green-400' : 'text-red-400'}>
                {analytics.replyRate > avgReplyRate ? '↑' : '↓'} {Math.abs((analytics.replyRate - avgReplyRate)).toFixed(2)}% vs avg
              </p>
            )}
          </div>
        </div>

        {/* Conversion Rate */}
        <div className={`p-6 rounded-lg border-2 border-slate-800 ${getPerformanceRating(analytics.conversionRate * 10).bgColor}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className={`w-5 h-5 ${getMetricColor(analytics.conversionRate, 'conversion')}`} />
              <label className="text-xs text-slate-400 uppercase tracking-wide">Conversion</label>
            </div>
          </div>
          <p className={`text-3xl font-bold ${getMetricColor(analytics.conversionRate, 'conversion')} mb-2`}>
            {analytics.conversionRate.toFixed(2)}%
          </p>
          <div className="text-xs text-slate-400">
            <p>{analytics.conversions.toLocaleString()} conversions</p>
            {avgConversionRate > 0 && (
              <p className={analytics.conversionRate > avgConversionRate ? 'text-green-400' : 'text-red-400'}>
                {analytics.conversionRate > avgConversionRate ? '↑' : '↓'} {Math.abs((analytics.conversionRate - avgConversionRate)).toFixed(2)}% vs avg
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Performance Trends */}
      <div className="rounded-lg border-2 border-slate-800 bg-slate-900 overflow-hidden">
        <button
          onClick={() => setShowTrends(!showTrends)}
          className="w-full p-6 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <h4 className="text-lg font-bold text-white">Performance Trends</h4>
          </div>
          {showTrends ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>

        {showTrends && (
          <div className="px-6 pb-6 space-y-4">
            {/* Trend Chart (Simple bar representation) */}
            <div className="space-y-3">
              {analytics.performanceTrend.map((point, idx) => {
                const maxRate = Math.max(...analytics.performanceTrend.map(p => p.rate), 50)
                const percentage = (point.rate / maxRate) * 100

                return (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">{point.date}</span>
                      <span className="text-sm font-semibold text-white">{point.rate.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Trend Summary */}
            <div className="pt-3 border-t border-slate-800 text-sm">
              {analytics.performanceTrend.length > 1 && (
                <>
                  <p className="text-slate-400">
                    <span className="text-white font-semibold">
                      {analytics.performanceTrend[analytics.performanceTrend.length - 1].rate > analytics.performanceTrend[0].rate ? '↑' : '↓'}
                      {Math.abs(analytics.performanceTrend[analytics.performanceTrend.length - 1].rate - analytics.performanceTrend[0].rate).toFixed(1)}%
                    </span>
                    {' '}from first to last measurement
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    Avg: {(analytics.performanceTrend.reduce((sum, p) => sum + p.rate, 0) / analytics.performanceTrend.length).toFixed(1)}%
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Comparison with Similar Templates */}
      <div className="rounded-lg border-2 border-slate-800 bg-slate-900 overflow-hidden">
        <button
          onClick={() => setShowComparison(!showComparison)}
          className="w-full p-6 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            <h4 className="text-lg font-bold text-white">
              Comparison ({analytics.similarTemplates.length} Similar Templates)
            </h4>
          </div>
          {showComparison ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>

        {showComparison && (
          <div className="px-6 pb-6">
            {analytics.similarTemplates.length === 0 ? (
              <p className="text-slate-400 py-4">No similar templates to compare</p>
            ) : (
              <div className="space-y-4">
                {/* Comparison Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="p-4 rounded-lg bg-slate-800/50">
                    <p className="text-xs text-slate-400 mb-1">Your Open Rate</p>
                    <p className="text-2xl font-bold text-blue-400">{analytics.openRate.toFixed(1)}%</p>
                    <p className="text-xs text-slate-500 mt-1">
                      vs avg: <span className={analytics.openRate > avgOpenRate ? 'text-green-400' : 'text-red-400'}>
                        {(analytics.openRate - avgOpenRate).toFixed(1)}%
                      </span>
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-800/50">
                    <p className="text-xs text-slate-400 mb-1">Your Click Rate</p>
                    <p className="text-2xl font-bold text-blue-400">{analytics.clickRate.toFixed(2)}%</p>
                    <p className="text-xs text-slate-500 mt-1">
                      vs avg: <span className={analytics.clickRate > avgClickRate ? 'text-green-400' : 'text-red-400'}>
                        {(analytics.clickRate - avgClickRate).toFixed(2)}%
                      </span>
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-800/50">
                    <p className="text-xs text-slate-400 mb-1">Your Reply Rate</p>
                    <p className="text-2xl font-bold text-blue-400">{analytics.replyRate.toFixed(2)}%</p>
                    <p className="text-xs text-slate-500 mt-1">
                      vs avg: <span className={analytics.replyRate > avgReplyRate ? 'text-green-400' : 'text-red-400'}>
                        {(analytics.replyRate - avgReplyRate).toFixed(2)}%
                      </span>
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-800/50">
                    <p className="text-xs text-slate-400 mb-1">Your Conversion</p>
                    <p className="text-2xl font-bold text-blue-400">{analytics.conversionRate.toFixed(2)}%</p>
                    <p className="text-xs text-slate-500 mt-1">
                      vs avg: <span className={analytics.conversionRate > avgConversionRate ? 'text-green-400' : 'text-red-400'}>
                        {(analytics.conversionRate - avgConversionRate).toFixed(2)}%
                      </span>
                    </p>
                  </div>
                </div>

                {/* Individual Template Comparisons */}
                <div className="space-y-3 pt-4 border-t border-slate-800">
                  {analytics.similarTemplates.slice(0, 5).map((template) => (
                    <div
                      key={template.id}
                      className="p-4 rounded-lg bg-slate-800/30 border border-slate-700 hover:border-slate-600 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-white">{template.name}</p>
                          <p className="text-xs text-slate-400 mt-1">{template.similarity}% similarity</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold ${
                            template.conversionRate > analytics.conversionRate ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {template.conversionRate > analytics.conversionRate ? '+' : ''}{(template.conversionRate - analytics.conversionRate).toFixed(2)}%
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div>
                          <p className="text-slate-500">Open</p>
                          <p className={`font-semibold ${getMetricColor(template.openRate, 'open')}`}>
                            {template.openRate.toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Click</p>
                          <p className={`font-semibold ${getMetricColor(template.clickRate, 'click')}`}>
                            {template.clickRate.toFixed(2)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Reply</p>
                          <p className={`font-semibold ${getMetricColor(template.replyRate, 'reply')}`}>
                            {template.replyRate.toFixed(2)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Conv</p>
                          <p className={`font-semibold ${getMetricColor(template.conversionRate, 'conversion')}`}>
                            {template.conversionRate.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {analytics.similarTemplates.length > 5 && (
                    <p className="text-center text-xs text-slate-500 pt-2">
                      +{analytics.similarTemplates.length - 5} more templates
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Performance Summary */}
      <div className="p-6 rounded-lg border-2 border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800">
        <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-400" />
          Performance Summary
        </h4>
        <div className="space-y-2 text-sm">
          {analytics.openRate >= 30 && (
            <p className="text-green-400">✓ Excellent open rate - This template engages recipients well</p>
          )}
          {analytics.replyRate >= 5 && (
            <p className="text-green-400">✓ Strong reply rate - Recipients are responding</p>
          )}
          {analytics.conversionRate >= 2 && (
            <p className="text-green-400">✓ Good conversion rate - Effective at driving desired actions</p>
          )}
          {analytics.openRate >= avgOpenRate && (
            <p className="text-blue-400">• Outperforming similar templates on open rate</p>
          )}
          {analytics.clickRate >= avgClickRate && (
            <p className="text-blue-400">• Outperforming similar templates on click rate</p>
          )}
          {analytics.replyRate >= avgReplyRate && (
            <p className="text-blue-400">• Outperforming similar templates on reply rate</p>
          )}
          {analytics.openRate < 15 && (
            <p className="text-yellow-400">⚠ Consider testing different subject lines or send times</p>
          )}
          {analytics.replyRate < 2 && (
            <p className="text-yellow-400">⚠ Low reply rate - Consider refining your call-to-action</p>
          )}
        </div>
      </div>
    </div>
  )
}
