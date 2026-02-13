'use client'

import { useState } from 'react'
import { BarChart3, TrendingUp, Users, DollarSign, Globe, Smartphone, Mail, ChevronDown, ChevronUp } from 'lucide-react'

export interface AdvancedAnalytics {
  roiMetrics: {
    totalSpent: number
    totalRevenue: number
    roi: number
    costPerLeadMQL: number
    costPerLeadSQL: number
    costPerLeadCustomer: number
  }
  funnelMetrics: {
    sent: number
    opened: number
    clicked: number
    replied: number
    meetings: number
    customers: number
  }
  demographicBreakdown: {
    byCountry: Array<{ country: string; count: number; conversionRate: number }>
    byIndustry: Array<{ industry: string; count: number; conversionRate: number }>
    byCompanySize: Array<{ size: string; count: number; conversionRate: number }>
  }
  deviceBreakdown: {
    desktop: number
    mobile: number
    tablet: number
  }
  clientBreakdown: {
    gmail: number
    outlook: number
    apple: number
    other: number
  }
  timeMetrics: {
    bestTimeToSend: string
    bestDayToSend: string
    avgOpenTime: number // minutes
    avgClickTime: number // minutes
    avgReplyTime: number // hours
  }
}

interface AdvancedAnalyticsDashboardProps {}

function generateAdvancedAnalytics(): AdvancedAnalytics {
  const sent = Math.floor(Math.random() * 500) + 500
  const opened = Math.floor(sent * (Math.random() * 0.3 + 0.2))
  const clicked = Math.floor(opened * (Math.random() * 0.15 + 0.05))
  const replied = Math.floor(clicked * (Math.random() * 0.2 + 0.05))
  const meetings = Math.floor(replied * (Math.random() * 0.6 + 0.2))
  const customers = Math.floor(meetings * (Math.random() * 0.4 + 0.15))

  return {
    roiMetrics: {
      totalSpent: 5000,
      totalRevenue: 45000,
      roi: 800,
      costPerLeadMQL: 12.5,
      costPerLeadSQL: 50,
      costPerLeadCustomer: 250,
    },
    funnelMetrics: {
      sent,
      opened,
      clicked,
      replied,
      meetings,
      customers,
    },
    demographicBreakdown: {
      byCountry: [
        { country: 'USA', count: Math.floor(sent * 0.4), conversionRate: 2.5 },
        { country: 'UK', count: Math.floor(sent * 0.15), conversionRate: 2.1 },
        { country: 'Canada', count: Math.floor(sent * 0.12), conversionRate: 2.3 },
        { country: 'Germany', count: Math.floor(sent * 0.08), conversionRate: 1.9 },
        { country: 'France', count: Math.floor(sent * 0.08), conversionRate: 1.8 },
        { country: 'Other', count: Math.floor(sent * 0.17), conversionRate: 1.5 },
      ],
      byIndustry: [
        { industry: 'Technology', count: Math.floor(sent * 0.35), conversionRate: 3.2 },
        { industry: 'Finance', count: Math.floor(sent * 0.2), conversionRate: 2.8 },
        { industry: 'Healthcare', count: Math.floor(sent * 0.15), conversionRate: 2.1 },
        { industry: 'Retail', count: Math.floor(sent * 0.15), conversionRate: 1.8 },
        { industry: 'Manufacturing', count: Math.floor(sent * 0.1), conversionRate: 1.5 },
        { industry: 'Other', count: Math.floor(sent * 0.05), conversionRate: 1.2 },
      ],
      byCompanySize: [
        { size: '1-50', count: Math.floor(sent * 0.25), conversionRate: 3.5 },
        { size: '51-200', count: Math.floor(sent * 0.3), conversionRate: 2.8 },
        { size: '201-1000', count: Math.floor(sent * 0.25), conversionRate: 2.0 },
        { size: '1000+', count: Math.floor(sent * 0.2), conversionRate: 1.5 },
      ],
    },
    deviceBreakdown: {
      desktop: Math.floor(opened * 0.55),
      mobile: Math.floor(opened * 0.35),
      tablet: Math.floor(opened * 0.1),
    },
    clientBreakdown: {
      gmail: Math.floor(opened * 0.45),
      outlook: Math.floor(opened * 0.3),
      apple: Math.floor(opened * 0.15),
      other: Math.floor(opened * 0.1),
    },
    timeMetrics: {
      bestTimeToSend: '10:00 AM',
      bestDayToSend: 'Tuesday',
      avgOpenTime: 15,
      avgClickTime: 45,
      avgReplyTime: 24,
    },
  }
}

export function AdvancedAnalyticsDashboard({}: AdvancedAnalyticsDashboardProps) {
  const [expanded, setExpanded] = useState(true)
  const [expandedSection, setExpandedSection] = useState<string | null>('roi')
  const [analytics] = useState<AdvancedAnalytics>(generateAdvancedAnalytics())

  const conversionRate = analytics.funnelMetrics.sent > 0
    ? Math.round((analytics.funnelMetrics.customers / analytics.funnelMetrics.sent) * 10000) / 100
    : 0

  return (
    <div className="rounded-lg border-2 border-slate-800 bg-slate-900 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-6 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-cyan-400" />
          <h4 className="text-lg font-bold text-white">Advanced Analytics Dashboard</h4>
          <span className="text-sm text-slate-400 ml-2">
            {conversionRate}% conversion • {analytics.roiMetrics.roi}% ROI
          </span>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>

      {expanded && (
        <div className="px-6 pb-6 space-y-6">
          {/* ROI Metrics Section */}
          <div className="space-y-3">
            <button
              onClick={() => setExpandedSection(expandedSection === 'roi' ? null : 'roi')}
              className="flex items-center gap-2 text-sm font-semibold text-white hover:text-cyan-400 transition-colors"
            >
              {expandedSection === 'roi' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <DollarSign className="w-4 h-4" />
              ROI & Revenue Metrics
            </button>

            {expandedSection === 'roi' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <p className="text-xs text-slate-400 mb-1">Total Spent</p>
                  <p className="text-2xl font-bold text-white">${analytics.roiMetrics.totalSpent.toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <p className="text-xs text-slate-400 mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-400">${analytics.roiMetrics.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <p className="text-xs text-slate-400 mb-1">ROI</p>
                  <p className="text-2xl font-bold text-cyan-400">{analytics.roiMetrics.roi}%</p>
                </div>

                <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700">
                  <p className="text-xs text-slate-400 mb-1">Cost/Lead (MQL)</p>
                  <p className="text-xl font-bold text-white">${analytics.roiMetrics.costPerLeadMQL}</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700">
                  <p className="text-xs text-slate-400 mb-1">Cost/Lead (SQL)</p>
                  <p className="text-xl font-bold text-white">${analytics.roiMetrics.costPerLeadSQL}</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700">
                  <p className="text-xs text-slate-400 mb-1">Cost/Customer</p>
                  <p className="text-xl font-bold text-white">${analytics.roiMetrics.costPerLeadCustomer}</p>
                </div>
              </div>
            )}
          </div>

          {/* Funnel Metrics */}
          <div className="space-y-3">
            <button
              onClick={() => setExpandedSection(expandedSection === 'funnel' ? null : 'funnel')}
              className="flex items-center gap-2 text-sm font-semibold text-white hover:text-cyan-400 transition-colors"
            >
              {expandedSection === 'funnel' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <TrendingUp className="w-4 h-4" />
              Conversion Funnel
            </button>

            {expandedSection === 'funnel' && (
              <div className="space-y-3">
                {[
                  { label: 'Sent', value: analytics.funnelMetrics.sent, color: 'from-blue-500 to-blue-400' },
                  { label: 'Opened', value: analytics.funnelMetrics.opened, color: 'from-green-500 to-emerald-400' },
                  { label: 'Clicked', value: analytics.funnelMetrics.clicked, color: 'from-cyan-500 to-blue-400' },
                  { label: 'Replied', value: analytics.funnelMetrics.replied, color: 'from-purple-500 to-pink-400' },
                  { label: 'Meetings', value: analytics.funnelMetrics.meetings, color: 'from-orange-500 to-yellow-400' },
                  { label: 'Customers', value: analytics.funnelMetrics.customers, color: 'from-green-500 to-lime-400' },
                ].map((stage) => {
                  const percent = (stage.value / analytics.funnelMetrics.sent) * 100
                  return (
                    <div key={stage.label} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-300">{stage.label}</span>
                        <span className="text-sm font-bold text-white">
                          {stage.value} ({percent.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${stage.color} transition-all`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Geographic Breakdown */}
          <div className="space-y-3">
            <button
              onClick={() => setExpandedSection(expandedSection === 'geo' ? null : 'geo')}
              className="flex items-center gap-2 text-sm font-semibold text-white hover:text-cyan-400 transition-colors"
            >
              {expandedSection === 'geo' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <Globe className="w-4 h-4" />
              Geographic Breakdown
            </button>

            {expandedSection === 'geo' && (
              <div className="space-y-2">
                {analytics.demographicBreakdown.byCountry.map((item) => (
                  <div key={item.country} className="p-3 rounded-lg bg-slate-800/30 border border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-white">{item.country}</span>
                      <div className="text-right">
                        <p className="text-sm font-bold text-cyan-400">{item.count}</p>
                        <p className="text-xs text-slate-500">{item.conversionRate}% conversion</p>
                      </div>
                    </div>
                    <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-400"
                        style={{ width: `${Math.min((item.count / analytics.funnelMetrics.sent) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Industry Breakdown */}
          <div className="space-y-3">
            <button
              onClick={() => setExpandedSection(expandedSection === 'industry' ? null : 'industry')}
              className="flex items-center gap-2 text-sm font-semibold text-white hover:text-cyan-400 transition-colors"
            >
              {expandedSection === 'industry' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <Users className="w-4 h-4" />
              Industry Breakdown
            </button>

            {expandedSection === 'industry' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {analytics.demographicBreakdown.byIndustry.map((item) => (
                  <div key={item.industry} className="p-3 rounded-lg bg-slate-800/30 border border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-white">{item.industry}</span>
                      <span className="text-xs font-bold text-purple-400">{item.conversionRate}%</span>
                    </div>
                    <p className="text-sm text-slate-400">{item.count} leads</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Device & Client Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <button
                onClick={() => setExpandedSection(expandedSection === 'device' ? null : 'device')}
                className="flex items-center gap-2 text-sm font-semibold text-white hover:text-cyan-400 transition-colors"
              >
                {expandedSection === 'device' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                <Smartphone className="w-4 h-4" />
                Device Breakdown
              </button>

              {expandedSection === 'device' && (
                <div className="space-y-2">
                  {[
                    { name: 'Desktop', count: analytics.deviceBreakdown.desktop, color: 'bg-blue-500' },
                    { name: 'Mobile', count: analytics.deviceBreakdown.mobile, color: 'bg-green-500' },
                    { name: 'Tablet', count: analytics.deviceBreakdown.tablet, color: 'bg-purple-500' },
                  ].map((device) => {
                    const total = analytics.deviceBreakdown.desktop + analytics.deviceBreakdown.mobile + analytics.deviceBreakdown.tablet
                    const percent = (device.count / total) * 100
                    return (
                      <div key={device.name} className="text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-slate-400">{device.name}</span>
                          <span className="font-semibold text-white">{percent.toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full ${device.color}`} style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setExpandedSection(expandedSection === 'client' ? null : 'client')}
                className="flex items-center gap-2 text-sm font-semibold text-white hover:text-cyan-400 transition-colors"
              >
                {expandedSection === 'client' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                <Mail className="w-4 h-4" />
                Email Client Breakdown
              </button>

              {expandedSection === 'client' && (
                <div className="space-y-2">
                  {[
                    { name: 'Gmail', count: analytics.clientBreakdown.gmail, color: 'bg-red-500' },
                    { name: 'Outlook', count: analytics.clientBreakdown.outlook, color: 'bg-blue-600' },
                    { name: 'Apple Mail', count: analytics.clientBreakdown.apple, color: 'bg-gray-400' },
                    { name: 'Other', count: analytics.clientBreakdown.other, color: 'bg-slate-500' },
                  ].map((client) => {
                    const total =
                      analytics.clientBreakdown.gmail +
                      analytics.clientBreakdown.outlook +
                      analytics.clientBreakdown.apple +
                      analytics.clientBreakdown.other
                    const percent = (client.count / total) * 100
                    return (
                      <div key={client.name} className="text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-slate-400">{client.name}</span>
                          <span className="font-semibold text-white">{percent.toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full ${client.color}`} style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Time Metrics */}
          <div className="space-y-3">
            <button
              onClick={() => setExpandedSection(expandedSection === 'time' ? null : 'time')}
              className="flex items-center gap-2 text-sm font-semibold text-white hover:text-cyan-400 transition-colors"
            >
              {expandedSection === 'time' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <TrendingUp className="w-4 h-4" />
              Timing Insights
            </button>

            {expandedSection === 'time' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700">
                  <p className="text-xs text-slate-400 mb-2">Best Time to Send</p>
                  <p className="text-2xl font-bold text-cyan-400">{analytics.timeMetrics.bestTimeToSend}</p>
                  <p className="text-xs text-slate-500 mt-1">Average open time: {analytics.timeMetrics.avgOpenTime}m</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700">
                  <p className="text-xs text-slate-400 mb-2">Best Day to Send</p>
                  <p className="text-2xl font-bold text-emerald-400">{analytics.timeMetrics.bestDayToSend}</p>
                  <p className="text-xs text-slate-500 mt-1">Average click time: {analytics.timeMetrics.avgClickTime}m</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700 md:col-span-2">
                  <p className="text-xs text-slate-400 mb-2">Average Reply Time</p>
                  <p className="text-2xl font-bold text-purple-400">{analytics.timeMetrics.avgReplyTime}h</p>
                  <p className="text-xs text-slate-500 mt-1">Time from sent to first reply</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
