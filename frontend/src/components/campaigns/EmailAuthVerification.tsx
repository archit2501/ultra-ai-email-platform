'use client'

import { useState } from 'react'
import { Shield, CheckCircle, AlertCircle, Copy, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type AuthStatus = 'verified' | 'partial' | 'not_verified' | 'error'

export interface AuthRecord {
  type: 'SPF' | 'DKIM' | 'DMARC'
  status: AuthStatus
  record: string
  implementation: string
  setupSteps: string[]
  verifiedAt?: Date
  warnings?: string[]
}

interface EmailAuthVerificationProps {
  domain?: string
}

function generateAuthRecords(domain = 'yourdomain.com'): AuthRecord[] {
  return [
    {
      type: 'SPF',
      status: 'verified',
      record: `v=spf1 include:sendgrid.net include:_spf.google.com ~all`,
      implementation: `In your DNS, add: v=spf1 include:sendgrid.net include:_spf.google.com ~all`,
      setupSteps: [
        'Log into your domain registrar',
        'Navigate to DNS settings',
        'Add TXT record with above value',
        'Wait 24-48 hours for DNS propagation',
        'Run verification test',
      ],
      verifiedAt: new Date(),
    },
    {
      type: 'DKIM',
      status: 'partial',
      record: `v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...`,
      implementation: `Add DKIM key in your email service provider settings and point DNS CNAME to their servers`,
      setupSteps: [
        'Generate DKIM key in your email service',
        'Copy the DKIM record',
        'Add to DNS as TXT or CNAME record',
        'Enable DKIM signing in mail provider',
        'Verify authentication status',
      ],
      warnings: ['DKIM record is valid but may need rotation', 'Ensure key rotation is configured'],
    },
    {
      type: 'DMARC',
      status: 'not_verified',
      record: `v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com`,
      implementation: `Add DMARC policy to aggregate reports and handle authentication failures`,
      setupSteps: [
        'Create DMARC TXT record with policy',
        'Set up email for aggregate reports',
        'Monitor reports for authentication results',
        'Adjust policy based on results (p=none → p=quarantine → p=reject)',
      ],
      warnings: [
        'DMARC not configured - recommended for protection',
        'Start with p=none to monitor before enforcement',
      ],
    },
  ]
}

export function EmailAuthVerification({ domain = 'yourdomain.com' }: EmailAuthVerificationProps) {
  const [expanded, setExpanded] = useState(true)
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null)
  const [records, setRecords] = useState<AuthRecord[]>(generateAuthRecords(domain))
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const getStatusIcon = (status: AuthStatus) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'partial':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />
      case 'not_verified':
        return <AlertCircle className="w-5 h-5 text-orange-400" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />
      default:
        return <AlertCircle className="w-5 h-5 text-slate-400" />
    }
  }

  const getStatusColor = (status: AuthStatus) => {
    switch (status) {
      case 'verified':
        return { bg: 'bg-green-900', text: 'text-green-300', badge: 'bg-green-500/20' }
      case 'partial':
        return { bg: 'bg-yellow-900', text: 'text-yellow-300', badge: 'bg-yellow-500/20' }
      case 'not_verified':
        return { bg: 'bg-orange-900', text: 'text-orange-300', badge: 'bg-orange-500/20' }
      case 'error':
        return { bg: 'bg-red-900', text: 'text-red-300', badge: 'bg-red-500/20' }
      default:
        return { bg: 'bg-slate-900', text: 'text-slate-300', badge: 'bg-slate-500/20' }
    }
  }

  const handleCopy = (recordId: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(recordId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const verifiedCount = records.filter((r) => r.status === 'verified').length
  const overallStatus = verifiedCount === 3 ? 'All verified' : verifiedCount > 0 ? 'Partially verified' : 'Not verified'

  return (
    <div className="rounded-lg border-2 border-slate-800 bg-slate-900 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-6 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-blue-400" />
          <h4 className="text-lg font-bold text-white">Email Authentication</h4>
          <span className="text-sm text-slate-400 ml-2">
            {verifiedCount}/3 verified • {overallStatus}
          </span>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>

      {expanded && (
        <div className="px-6 pb-6 space-y-6">
          {/* Domain Info */}
          <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <p className="text-xs text-slate-400 mb-1">Authenticating Domain</p>
            <p className="text-lg font-semibold text-white">{domain}</p>
            <p className="text-xs text-slate-500 mt-2">
              Configure these records in your domain's DNS settings to improve email deliverability
            </p>
          </div>

          {/* Overall Status */}
          <div className="grid grid-cols-3 gap-3">
            {records.map((record) => {
              const colors = getStatusColor(record.status)
              const statusLabel = record.status === 'verified' 
                ? 'Verified' 
                : record.status === 'partial'
                  ? 'Partial'
                  : record.status === 'not_verified'
                    ? 'Not Setup'
                    : 'Error'
              
              return (
                <div
                  key={record.type}
                  className={`p-4 rounded-lg border ${colors.badge} border-slate-700`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(record.status)}
                    <span className={`text-xs font-semibold ${colors.text}`}>{statusLabel}</span>
                  </div>
                  <p className="text-sm font-semibold text-white">{record.type}</p>
                </div>
              )
            })}
          </div>

          {/* Records */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-white">DNS Records</p>
            {records.map((record) => {
              const colors = getStatusColor(record.status)
              const isExpanded = expandedRecord === record.type

              return (
                <div
                  key={record.type}
                  className={`rounded-lg border transition-colors ${
                    record.status === 'verified'
                      ? 'bg-slate-800/30 border-slate-700'
                      : 'bg-slate-800/50 border-slate-700'
                  }`}
                >
                  <button
                    onClick={() => setExpandedRecord(isExpanded ? null : record.type)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {getStatusIcon(record.status)}
                      <div>
                        <p className="font-semibold text-white">{record.type} Record</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {record.status === 'verified' && 'Verified and active'}
                          {record.status === 'partial' && 'Configured but needs review'}
                          {record.status === 'not_verified' && 'Not yet configured'}
                          {record.status === 'error' && 'Configuration error'}
                        </p>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-slate-700 space-y-4">
                      {/* Record Value */}
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-300">DNS Record Value</p>
                        <div className="relative">
                          <code className="block p-3 rounded bg-slate-900 border border-slate-700 text-xs text-slate-300 overflow-x-auto">
                            {record.record}
                          </code>
                          <button
                            onClick={() => handleCopy(record.type, record.record)}
                            className="absolute top-2 right-2 p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                            title="Copy to clipboard"
                          >
                            {copiedId === record.type ? (
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Setup Instructions */}
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-300">Setup Instructions</p>
                        <ol className="space-y-2">
                          {record.setupSteps.map((step, idx) => (
                            <li key={idx} className="text-xs text-slate-400 flex items-start gap-2">
                              <span className="text-blue-400 font-semibold flex-shrink-0">{idx + 1}.</span>
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Warnings */}
                      {record.warnings && record.warnings.length > 0 && (
                        <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 space-y-1">
                          <p className="text-xs font-semibold text-orange-300">Warnings</p>
                          {record.warnings.map((warning, idx) => (
                            <p key={idx} className="text-xs text-slate-400">• {warning}</p>
                          ))}
                        </div>
                      )}

                      {/* Verification Status */}
                      {record.verifiedAt && (
                        <div className="text-xs text-green-400">✓ Verified on {record.verifiedAt.toLocaleDateString()}</div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2 border-t border-slate-700">
                        <Button
                          onClick={() => handleCopy(record.type, record.record)}
                          className="flex-1 bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center gap-2"
                        >
                          <Copy className="w-4 h-4" />
                          Copy Record
                        </Button>
                        <Button
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Guide
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Deliverability Impact */}
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 space-y-2">
            <p className="text-sm font-semibold text-blue-300">Deliverability Impact</p>
            <ul className="space-y-1 text-xs text-slate-400">
              <li>
                <span className="text-blue-300 font-semibold">SPF:</span> Prevents email spoofing, improves inbox placement
              </li>
              <li>
                <span className="text-blue-300 font-semibold">DKIM:</span> Digitally signs emails, increases trust score
              </li>
              <li>
                <span className="text-blue-300 font-semibold">DMARC:</span> Policy enforcement, reduces phishing/spoofing attacks
              </li>
            </ul>
            <p className="text-xs text-blue-400 pt-2 border-t border-blue-500/20">
              All three records together significantly improve email deliverability and sender reputation
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
