'use client'

import { useState } from 'react'
import { CampaignRecipient } from '@/types'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Mail, 
  Shield, 
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface EmailValidationResult {
  email: string
  recipientName?: string
  isValid: boolean
  deliverability: 'valid' | 'risky' | 'invalid'
  reason?: string
  mx_records_found: boolean
  is_disposable: boolean
  is_role_based: boolean
  score: number // 0-100
}

export interface FraudDetectionResult {
  email: string
  recipientName?: string
  isFraudulent: boolean
  riskScore: number // 0-100
  flags: string[]
  confidence: number // 0-100
}

interface EnrichmentResultsProps {
  emailValidationResults?: EmailValidationResult[]
  fraudDetectionResults?: FraudDetectionResult[]
  onRemoveInvalid?: () => void
  onRemoveFraudulent?: () => void
}

export function EnrichmentResults({
  emailValidationResults = [],
  fraudDetectionResults = [],
  onRemoveInvalid,
  onRemoveFraudulent,
}: EnrichmentResultsProps) {
  const [showEmailDetails, setShowEmailDetails] = useState(false)
  const [showFraudDetails, setShowFraudDetails] = useState(false)

  // Email validation stats
  const validEmails = emailValidationResults.filter(r => r.deliverability === 'valid').length
  const riskyEmails = emailValidationResults.filter(r => r.deliverability === 'risky').length
  const invalidEmails = emailValidationResults.filter(r => r.deliverability === 'invalid').length

  // Fraud detection stats
  const fraudulentAccounts = fraudDetectionResults.filter(r => r.isFraudulent).length
  const cleanAccounts = fraudDetectionResults.filter(r => !r.isFraudulent).length

  const hasEmailResults = emailValidationResults.length > 0
  const hasFraudResults = fraudDetectionResults.length > 0

  if (!hasEmailResults && !hasFraudResults) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Email Validation Results */}
      {hasEmailResults && (
        <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-5 h-5 text-green-400" />
                  <h3 className="text-lg font-semibold text-white">Email Validation Results</h3>
                </div>
                <p className="text-sm text-slate-400">
                  Checked {emailValidationResults.length} email addresses
                </p>
              </div>
              <button
                onClick={() => setShowEmailDetails(!showEmailDetails)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                {showEmailDetails ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 p-6 border-b border-slate-800 bg-slate-900/50">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">{validEmails}</div>
              <div className="text-xs text-slate-400 mt-1">Valid</div>
              <div className="text-xs text-slate-500">Ready to send</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400">{riskyEmails}</div>
              <div className="text-xs text-slate-400 mt-1">Risky</div>
              <div className="text-xs text-slate-500">May bounce</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-400">{invalidEmails}</div>
              <div className="text-xs text-slate-400 mt-1">Invalid</div>
              <div className="text-xs text-slate-500">Will bounce</div>
            </div>
          </div>

          {/* Detailed List */}
          {showEmailDetails && (
            <div className="p-6 space-y-2 max-h-96 overflow-y-auto">
              {/* Invalid Emails First */}
              {invalidEmails > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-red-400 mb-2">❌ Invalid Emails ({invalidEmails})</h4>
                  {emailValidationResults
                    .filter(r => r.deliverability === 'invalid')
                    .map((result, idx) => (
                      <div key={idx} className="p-3 bg-red-900/20 border border-red-800/30 rounded-lg mb-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="font-medium text-white text-sm">{result.email}</div>
                            {result.recipientName && (
                              <div className="text-xs text-slate-400">{result.recipientName}</div>
                            )}
                            <div className="text-xs text-red-400 mt-1">{result.reason}</div>
                          </div>
                          <div className="text-xs text-red-400 font-semibold">
                            {result.score}% score
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Risky Emails */}
              {riskyEmails > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-yellow-400 mb-2">⚠️ Risky Emails ({riskyEmails})</h4>
                  {emailValidationResults
                    .filter(r => r.deliverability === 'risky')
                    .map((result, idx) => (
                      <div key={idx} className="p-3 bg-yellow-900/20 border border-yellow-800/30 rounded-lg mb-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="font-medium text-white text-sm">{result.email}</div>
                            {result.recipientName && (
                              <div className="text-xs text-slate-400">{result.recipientName}</div>
                            )}
                            <div className="text-xs text-yellow-400 mt-1">
                              {result.is_disposable && '🗑️ Disposable email • '}
                              {result.is_role_based && '👥 Role-based email • '}
                              {result.reason}
                            </div>
                          </div>
                          <div className="text-xs text-yellow-400 font-semibold">
                            {result.score}% score
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Valid Emails (collapsed by default) */}
              {validEmails > 0 && validEmails <= 5 && (
                <div>
                  <h4 className="text-sm font-semibold text-green-400 mb-2">✓ Valid Emails ({validEmails})</h4>
                  {emailValidationResults
                    .filter(r => r.deliverability === 'valid')
                    .map((result, idx) => (
                      <div key={idx} className="p-3 bg-green-900/20 border border-green-800/30 rounded-lg mb-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="font-medium text-white text-sm">{result.email}</div>
                            {result.recipientName && (
                              <div className="text-xs text-slate-400">{result.recipientName}</div>
                            )}
                          </div>
                          <div className="text-xs text-green-400 font-semibold">
                            {result.score}% score
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          {invalidEmails > 0 && onRemoveInvalid && (
            <div className="p-4 bg-slate-900/50 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={onRemoveInvalid}
                className="w-full bg-red-900/20 border-red-800 text-red-300 hover:bg-red-900/40"
              >
                Remove {invalidEmails} Invalid Email{invalidEmails !== 1 ? 's' : ''}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Fraud Detection Results */}
      {hasFraudResults && (
        <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-semibold text-white">Fraud Detection Results</h3>
                </div>
                <p className="text-sm text-slate-400">
                  Analyzed {fraudDetectionResults.length} accounts for fraud signals
                </p>
              </div>
              <button
                onClick={() => setShowFraudDetails(!showFraudDetails)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                {showFraudDetails ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 p-6 border-b border-slate-800 bg-slate-900/50">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">{cleanAccounts}</div>
              <div className="text-xs text-slate-400 mt-1">Clean Accounts</div>
              <div className="text-xs text-slate-500">No fraud signals</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-400">{fraudulentAccounts}</div>
              <div className="text-xs text-slate-400 mt-1">Flagged</div>
              <div className="text-xs text-slate-500">Suspicious activity</div>
            </div>
          </div>

          {/* Detailed List */}
          {showFraudDetails && (
            <div className="p-6 space-y-2 max-h-96 overflow-y-auto">
              {/* Fraudulent Accounts */}
              {fraudulentAccounts > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-red-400 mb-2">
                    🚨 Flagged Accounts ({fraudulentAccounts})
                  </h4>
                  {fraudDetectionResults
                    .filter(r => r.isFraudulent)
                    .map((result, idx) => (
                      <div key={idx} className="p-3 bg-red-900/20 border border-red-800/30 rounded-lg mb-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="font-medium text-white text-sm">{result.email}</div>
                            {result.recipientName && (
                              <div className="text-xs text-slate-400">{result.recipientName}</div>
                            )}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {result.flags.map((flag, fidx) => (
                                <span
                                  key={fidx}
                                  className="text-xs px-2 py-0.5 rounded-full bg-red-900/40 text-red-300"
                                >
                                  {flag}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-red-400 font-semibold">
                              {result.riskScore}% risk
                            </div>
                            <div className="text-xs text-slate-500">
                              {result.confidence}% confidence
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          {fraudulentAccounts > 0 && onRemoveFraudulent && (
            <div className="p-4 bg-slate-900/50 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={onRemoveFraudulent}
                className="w-full bg-amber-900/20 border-amber-800 text-amber-300 hover:bg-amber-900/40"
              >
                Review & Remove {fraudulentAccounts} Flagged Account{fraudulentAccounts !== 1 ? 's' : ''}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
