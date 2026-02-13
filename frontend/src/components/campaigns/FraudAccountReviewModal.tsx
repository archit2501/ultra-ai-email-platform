'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp, Shield, Mail, Globe, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface FraudAccount {
  id: string
  email: string
  name: string
  company: string
  riskScore: number // 0-100
  reasons: string[]
  flags: ('disposable' | 'invalid' | 'suspicious_pattern' | 'high_bounce' | 'honeypot' | 'role_based')[]
  lastActivity?: Date
  reviewed: boolean
  action?: 'approve' | 'reject'
}

interface FraudReviewModalProps {
  fraudAccounts?: FraudAccount[]
  onReview: (account: FraudAccount, action: 'approve' | 'reject') => void
  open?: boolean
}

function generateFraudAccounts(): FraudAccount[] {
  const companies = ['TechCorp', 'InnovateLabs', 'GlobalTech', 'StartupXYZ', 'Enterprise Inc']
  const reasons = [
    'Disposable email domain detected',
    'High bounce history',
    'Email format suspicious',
    'Honeypot pattern detected',
    'Role-based address',
    'Invalid domain',
    'Duplicate email address',
    'Flagged by third-party verification',
  ]

  const flags = ['disposable', 'invalid', 'suspicious_pattern', 'high_bounce', 'honeypot', 'role_based'] as const

  return Array.from({ length: 5 }, (_, i) => ({
    id: `fraud-${i}`,
    email: ['noreply@example.com', 'abuse@domain.com', 'test.email@temp.com', 'bounced@invalid.com', 'catch.all@company.com'][i],
    name: ['No Reply Account', 'Abuse Address', 'Test Account', 'Unknown User', 'Catch-All'][i],
    company: companies[i % companies.length],
    riskScore: Math.floor(Math.random() * 40) + 70,
    reasons: reasons.slice(0, Math.floor(Math.random() * 3) + 2),
    flags: [flags[Math.floor(Math.random() * flags.length)]],
    reviewed: false,
    action: undefined,
  }))
}

export function FraudAccountReviewModal({ fraudAccounts, onReview, open = true }: FraudReviewModalProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [accounts, setAccounts] = useState<FraudAccount[]>(fraudAccounts || generateFraudAccounts())
  const [showReviewComplete, setShowReviewComplete] = useState(false)

  const pendingReview = accounts.filter((a) => !a.reviewed)
  const reviewed = accounts.filter((a) => a.reviewed)
  const approved = reviewed.filter((a) => a.action === 'approve').length
  const rejected = reviewed.filter((a) => a.action === 'reject').length

  const handleReview = (account: FraudAccount, action: 'approve' | 'reject') => {
    const updated = accounts.map((a) =>
      a.id === account.id
        ? { ...a, reviewed: true, action }
        : a
    )
    setAccounts(updated)
    onReview(account, action)

    if (updated.every((a) => a.reviewed)) {
      setShowReviewComplete(true)
    }
  }

  if (!open) return null

  const getRiskColor = (score: number) => {
    if (score >= 80) return { bg: 'bg-red-900', text: 'text-red-400', label: 'Critical' }
    if (score >= 60) return { bg: 'bg-orange-900', text: 'text-orange-400', label: 'High' }
    return { bg: 'bg-yellow-900', text: 'text-yellow-400', label: 'Medium' }
  }

  const getFlagColor = (flag: string) => {
    switch (flag) {
      case 'disposable':
        return 'bg-red-500/20 text-red-300'
      case 'honeypot':
        return 'bg-red-500/20 text-red-300'
      case 'invalid':
        return 'bg-orange-500/20 text-orange-300'
      case 'high_bounce':
        return 'bg-orange-500/20 text-orange-300'
      case 'suspicious_pattern':
        return 'bg-yellow-500/20 text-yellow-300'
      case 'role_based':
        return 'bg-blue-500/20 text-blue-300'
      default:
        return 'bg-slate-500/20 text-slate-300'
    }
  }

  const getFlagLabel = (flag: string) => {
    return flag
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-900 rounded-lg border border-slate-700 max-w-3xl w-full my-8">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Fraud Account Review</h3>
              <p className="text-xs text-slate-400 mt-1">
                {pendingReview.length} pending • {approved} approved • {rejected} rejected
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {showReviewComplete && (
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-green-300 font-semibold">Review Complete</p>
                <p className="text-sm text-slate-400 mt-1">
                  All {accounts.length} flagged accounts have been reviewed. {approved} approved, {rejected} rejected.
                </p>
              </div>
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 text-center">
              <p className="text-xs text-slate-400 mb-1">Total Flagged</p>
              <p className="text-2xl font-bold text-white">{accounts.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
              <p className="text-xs text-green-400 mb-1">Approved</p>
              <p className="text-2xl font-bold text-green-400">{approved}</p>
            </div>
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
              <p className="text-xs text-red-400 mb-1">Rejected</p>
              <p className="text-2xl font-bold text-red-400">{rejected}</p>
            </div>
          </div>

          {/* Account List */}
          <div className="space-y-3">
            {accounts.map((account) => {
              const risk = getRiskColor(account.riskScore)
              const isExpanded = expandedId === account.id
              const isReviewed = account.reviewed

              return (
                <div
                  key={account.id}
                  className={`rounded-lg border transition-colors ${
                    isReviewed
                      ? account.action === 'approve'
                        ? 'bg-slate-800/30 border-green-500/30'
                        : 'bg-slate-800/20 border-red-500/30 opacity-60'
                      : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : account.id)}
                    className="w-full p-4 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {/* Status Icon */}
                      <div className="flex-shrink-0">
                        {isReviewed ? (
                          account.action === 'approve' ? (
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-400" />
                          )
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-orange-400" />
                        )}
                      </div>

                      {/* Account Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-white">{account.name}</p>
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${risk.bg} ${risk.text}`}>
                            {risk.label} Risk
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {account.email}
                          </div>
                          <div className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {account.company}
                          </div>
                        </div>
                      </div>

                      {/* Risk Score */}
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className={`text-lg font-bold ${risk.text}`}>{account.riskScore}</p>
                          <p className="text-xs text-slate-500">risk score</p>
                        </div>
                        {!isReviewed && (
                          <div className="text-slate-400 pl-2">
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && !isReviewed && (
                    <div className="px-4 pb-4 border-t border-slate-700 space-y-4">
                      {/* Flags */}
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-300">Risk Flags</p>
                        <div className="flex flex-wrap gap-2">
                          {account.flags.map((flag) => (
                            <span key={flag} className={`px-2 py-1 rounded text-xs font-semibold ${getFlagColor(flag)}`}>
                              {getFlagLabel(flag)}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Reasons */}
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-300">Detection Reasons</p>
                        <ul className="space-y-1">
                          {account.reasons.map((reason, idx) => (
                            <li key={idx} className="text-xs text-slate-400 flex items-start gap-2">
                              <span className="text-orange-400 mt-1">•</span>
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2 border-t border-slate-700">
                        <Button
                          onClick={() => handleReview(account, 'approve')}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve & Include
                        </Button>
                        <Button
                          onClick={() => handleReview(account, 'reject')}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject & Remove
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Reviewed State */}
                  {isReviewed && (
                    <div className="px-4 pb-3 text-xs">
                      <span className="text-slate-400">Status: </span>
                      <span className={account.action === 'approve' ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
                        {account.action === 'approve' ? 'Approved & Included' : 'Rejected & Removed'}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Shield className="w-4 h-4" />
            <span>Review helps prevent fraud and maintain sender reputation</span>
          </div>
          <Button
            disabled={pendingReview.length > 0}
            className={`${
              pendingReview.length > 0
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {pendingReview.length > 0 ? `${pendingReview.length} Pending` : 'Done'}
          </Button>
        </div>
      </div>
    </div>
  )
}
