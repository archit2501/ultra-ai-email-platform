'use client'

import React from 'react'
import { Info, AlertTriangle, CheckCircle2, Clock, Mail, TrendingUp, Shield } from 'lucide-react'
import { SimpleTooltip } from '@/components/ui/tooltip'

/**
 * 2026 Email Deliverability Best Practices
 *
 * Based on Instantly.ai Benchmark Report & industry standards:
 * - Daily send limit: 50 emails/day max for new accounts
 * - Warmup period: 4-6 weeks gradual increase
 * - Follow-up count: 3-5 maximum
 * - Email length: Under 100 words
 * - Minimum delay: 30 seconds between emails
 * - Business hours: 9 AM - 6 PM recipient timezone
 */

export interface BestPractice {
  key: string
  label: string
  value: string | number
  icon: React.ReactNode
  status: 'optimal' | 'warning' | 'critical'
  description: string
  recommendation: string
  source: string
}

export const BEST_PRACTICES_2026: Record<string, BestPractice> = {
  dailyLimit: {
    key: 'dailyLimit',
    label: 'Daily Send Limit',
    value: '50',
    icon: <Mail className="w-4 h-4" />,
    status: 'optimal',
    description: 'Maximum emails per day for new email accounts. Exceeding this limit significantly increases spam risk.',
    recommendation: 'Start with 5-10 emails/day and gradually increase to 50 over 4-6 weeks.',
    source: 'Instantly.ai 2026 Benchmark Report',
  },
  warmupPeriod: {
    key: 'warmupPeriod',
    label: 'Warmup Period',
    value: '4-6 weeks',
    icon: <TrendingUp className="w-4 h-4" />,
    status: 'optimal',
    description: 'Time required to build sender reputation before sending at full volume.',
    recommendation: 'Week 1: 5/day, Week 2: 15/day, Week 3: 30/day, Week 4: 50/day, Week 5: 75/day, Week 6: 100/day',
    source: 'Instantly.ai 2026 Benchmark Report',
  },
  followUpCount: {
    key: 'followUpCount',
    label: 'Follow-up Count',
    value: '3-5',
    icon: <Clock className="w-4 h-4" />,
    status: 'optimal',
    description: 'Maximum number of follow-up emails before stopping. More than 5 leads to spam complaints.',
    recommendation: 'Send 3 follow-ups spaced 3-5 days apart. Stop immediately on reply or unsubscribe.',
    source: 'Industry best practice',
  },
  emailLength: {
    key: 'emailLength',
    label: 'Email Length',
    value: '<100 words',
    icon: <Mail className="w-4 h-4" />,
    status: 'optimal',
    description: 'Optimal email body length. Shorter emails have higher engagement and lower spam scores.',
    recommendation: 'Keep emails under 100 words. Use clear subject lines under 50 characters.',
    source: 'Instantly.ai 2026 Benchmark Report',
  },
  delayBetweenEmails: {
    key: 'delayBetweenEmails',
    label: 'Delay Between Emails',
    value: '30 seconds',
    icon: <Clock className="w-4 h-4" />,
    status: 'optimal',
    description: 'Minimum delay between sending emails to avoid rate limiting and spam detection.',
    recommendation: 'Wait at least 30 seconds between emails. 60+ seconds is even better for new accounts.',
    source: 'Industry best practice',
  },
  businessHours: {
    key: 'businessHours',
    label: 'Business Hours',
    value: '9 AM - 6 PM',
    icon: <Clock className="w-4 h-4" />,
    status: 'optimal',
    description: 'Sending during business hours increases open rates by 23% and reduces spam complaints.',
    recommendation: 'Send between 9 AM and 6 PM in the recipient\'s local timezone.',
    source: 'Instantly.ai 2026 Benchmark Report',
  },
}

interface BestPracticeTooltipProps {
  practiceKey: keyof typeof BEST_PRACTICES_2026
  children: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
}

/**
 * Tooltip wrapper for displaying 2026 best practice information on hover.
 */
export function BestPracticeTooltip({ practiceKey, children, side = 'top' }: BestPracticeTooltipProps) {
  const practice = BEST_PRACTICES_2026[practiceKey]

  if (!practice) {
    return <>{children}</>
  }

  return (
    <SimpleTooltip
      side={side}
      content={
        <div className="max-w-xs p-2 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-white">
            {practice.icon}
            <span>{practice.label}</span>
            <span className="text-blue-400 font-bold">{practice.value}</span>
          </div>
          <p className="text-xs text-slate-300">{practice.description}</p>
          <div className="pt-2 border-t border-slate-600">
            <p className="text-xs text-emerald-400 font-medium">Recommendation:</p>
            <p className="text-xs text-slate-300">{practice.recommendation}</p>
          </div>
          <p className="text-[10px] text-slate-500 italic">Source: {practice.source}</p>
        </div>
      }
      variant="dark"
    >
      {children}
    </SimpleTooltip>
  )
}

interface BestPracticeIndicatorProps {
  currentValue: number
  practiceKey: keyof typeof BEST_PRACTICES_2026
  showIcon?: boolean
}

/**
 * Visual indicator showing if a value meets 2026 best practices.
 */
export function BestPracticeIndicator({ currentValue, practiceKey, showIcon = true }: BestPracticeIndicatorProps) {
  const practice = BEST_PRACTICES_2026[practiceKey]

  if (!practice) return null

  let status: 'optimal' | 'warning' | 'critical' = 'optimal'
  let statusColor = 'text-emerald-400'
  let statusIcon = <CheckCircle2 className="w-4 h-4" />

  // Evaluate status based on practice
  switch (practiceKey) {
    case 'dailyLimit':
      if (currentValue > 100) {
        status = 'critical'
        statusColor = 'text-red-400'
        statusIcon = <AlertTriangle className="w-4 h-4" />
      } else if (currentValue > 50) {
        status = 'warning'
        statusColor = 'text-amber-400'
        statusIcon = <AlertTriangle className="w-4 h-4" />
      }
      break

    case 'delayBetweenEmails':
      if (currentValue < 30) {
        status = 'critical'
        statusColor = 'text-red-400'
        statusIcon = <AlertTriangle className="w-4 h-4" />
      } else if (currentValue < 60) {
        status = 'warning'
        statusColor = 'text-amber-400'
        statusIcon = <AlertTriangle className="w-4 h-4" />
      }
      break

    case 'followUpCount':
      if (currentValue > 5) {
        status = 'critical'
        statusColor = 'text-red-400'
        statusIcon = <AlertTriangle className="w-4 h-4" />
      } else if (currentValue > 4) {
        status = 'warning'
        statusColor = 'text-amber-400'
        statusIcon = <AlertTriangle className="w-4 h-4" />
      }
      break

    case 'emailLength':
      if (currentValue > 150) {
        status = 'critical'
        statusColor = 'text-red-400'
        statusIcon = <AlertTriangle className="w-4 h-4" />
      } else if (currentValue > 100) {
        status = 'warning'
        statusColor = 'text-amber-400'
        statusIcon = <AlertTriangle className="w-4 h-4" />
      }
      break
  }

  return (
    <BestPracticeTooltip practiceKey={practiceKey}>
      <div className={`flex items-center gap-1 cursor-help ${statusColor}`}>
        {showIcon && statusIcon}
        <Info className="w-3 h-3 opacity-60" />
      </div>
    </BestPracticeTooltip>
  )
}

/**
 * Card component showing all 2026 best practices at a glance.
 */
export function BestPracticesCard() {
  return (
    <div className="p-4 rounded-lg border border-blue-600/30 bg-blue-900/10">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-5 h-5 text-blue-400" />
        <h3 className="font-semibold text-white text-sm">2026 Email Deliverability Best Practices</h3>
      </div>
      <p className="text-xs text-slate-400 mb-4">
        Follow these guidelines to maximize deliverability and avoid spam filters.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {Object.values(BEST_PRACTICES_2026).map((practice) => (
          <BestPracticeTooltip key={practice.key} practiceKey={practice.key as keyof typeof BEST_PRACTICES_2026}>
            <div className="p-2 rounded bg-slate-800/50 border border-slate-700 cursor-help hover:border-blue-500/50 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <div className="text-blue-400">{practice.icon}</div>
                <span className="text-xs font-medium text-slate-300">{practice.label}</span>
              </div>
              <p className="text-sm font-bold text-white">{practice.value}</p>
            </div>
          </BestPracticeTooltip>
        ))}
      </div>

      <p className="text-[10px] text-slate-500 mt-3 text-center">
        Based on Instantly.ai 2026 Benchmark Report & industry standards
      </p>
    </div>
  )
}

/**
 * Inline info icon with tooltip for adding to form labels.
 */
export function BestPracticeInfo({ practiceKey }: { practiceKey: keyof typeof BEST_PRACTICES_2026 }) {
  return (
    <BestPracticeTooltip practiceKey={practiceKey}>
      <Info className="w-3.5 h-3.5 text-slate-400 hover:text-blue-400 cursor-help transition-colors" />
    </BestPracticeTooltip>
  )
}
