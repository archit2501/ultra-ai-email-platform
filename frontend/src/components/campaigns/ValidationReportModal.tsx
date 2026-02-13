'use client'

import { useState } from 'react'
import { CampaignRecipient } from '@/types'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CheckCircle, Info, X, ChevronDown, ChevronUp } from 'lucide-react'
import { ValidationReport, mergeDuplicates, deduplicateRecipients } from '@/utils/recipientValidation'

interface ValidationReportModalProps {
  report: ValidationReport
  onConfirm: (cleanedRecipients: CampaignRecipient[]) => void
  onCancel: () => void
}

export function ValidationReportModal({
  report,
  onConfirm,
  onCancel,
}: ValidationReportModalProps) {
  const [showInvalid, setShowInvalid] = useState(false)
  const [showDuplicates, setShowDuplicates] = useState(false)
  const [autoMerge, setAutoMerge] = useState(true)
  const [excludeInvalid, setExcludeInvalid] = useState(true)

  const hasIssues = report.stats.invalid > 0 || report.stats.duplicateEmails > 0

  const handleConfirm = () => {
    let cleanedRecipients = [...report.validRecipients]

    // Remove invalid emails if excludeInvalid is true
    if (excludeInvalid) {
      // Already filtered in report.validRecipients
    } else {
      // Include invalid emails (not recommended)
      cleanedRecipients = [...cleanedRecipients, ...report.invalidRecipients]
    }

    // Deduplicate if autoMerge is true
    if (autoMerge && report.duplicates.length > 0) {
      cleanedRecipients = deduplicateRecipients(cleanedRecipients)
    }

    onConfirm(cleanedRecipients)
  }

  const finalCount = autoMerge
    ? report.stats.valid - report.stats.duplicateRecipients + report.stats.duplicateEmails
    : report.stats.valid

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg border border-slate-800 max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Recipient Validation Report</h2>
            <button
              onClick={onCancel}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-white">{report.totalRecipients}</div>
              <div className="text-sm text-slate-400">Total</div>
            </div>
            <div className="bg-green-900/40 border border-green-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-400">{report.stats.valid}</div>
              <div className="text-sm text-green-300">Valid</div>
            </div>
            <div className="bg-red-900/40 border border-red-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-400">{report.stats.invalid}</div>
              <div className="text-sm text-red-300">Invalid</div>
            </div>
            <div className="bg-yellow-900/40 border border-yellow-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-400">{report.stats.duplicateEmails}</div>
              <div className="text-sm text-yellow-300">Duplicates</div>
            </div>
          </div>

          {/* Issues Alert */}
          {hasIssues && (
            <div className="bg-yellow-900/40 border border-yellow-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-300 mb-1">Issues Detected</h3>
                  <p className="text-sm text-yellow-200">
                    {report.stats.invalid > 0 && `${report.stats.invalid} invalid email(s) found. `}
                    {report.stats.duplicateEmails > 0 && `${report.stats.duplicateEmails} duplicate email(s) found (${report.stats.duplicateRecipients} total records). `}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Invalid Emails Section */}
          {report.stats.invalid > 0 && (
            <div className="bg-slate-800 rounded-lg border border-slate-700">
              <button
                onClick={() => setShowInvalid(!showInvalid)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <h3 className="font-semibold text-white">
                    Invalid Emails ({report.stats.invalid})
                  </h3>
                </div>
                {showInvalid ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </button>

              {showInvalid && (
                <div className="border-t border-slate-700 p-4 space-y-2 max-h-64 overflow-y-auto">
                  {report.invalidRecipients.map((recipient, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-slate-900 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-white">{recipient.email}</div>
                        {recipient.name && (
                          <div className="text-sm text-slate-400">{recipient.name}</div>
                        )}
                        <div className="text-xs text-red-400 mt-1">
                          ❌ {recipient.validationError}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Duplicates Section */}
          {report.stats.duplicateEmails > 0 && (
            <div className="bg-slate-800 rounded-lg border border-slate-700">
              <button
                onClick={() => setShowDuplicates(!showDuplicates)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Info className="w-5 h-5 text-yellow-400" />
                  <h3 className="font-semibold text-white">
                    Duplicate Emails ({report.stats.duplicateEmails})
                  </h3>
                </div>
                {showDuplicates ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </button>

              {showDuplicates && (
                <div className="border-t border-slate-700 p-4 space-y-3 max-h-64 overflow-y-auto">
                  {report.duplicates.map((dupGroup, idx) => (
                    <div key={idx} className="bg-slate-900 rounded-lg p-3">
                      <div className="font-medium text-yellow-400 mb-2">
                        {dupGroup.email} ({dupGroup.count} occurrences)
                      </div>
                      <div className="space-y-1 ml-4">
                        {dupGroup.recipients.map((recipient, ridx) => (
                          <div key={ridx} className="text-sm text-slate-300">
                            • {recipient.name || 'No name'} {recipient.company && `@ ${recipient.company}`}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Options */}
          <div className="bg-slate-800 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-white mb-3">Cleanup Options</h3>

            {report.stats.invalid > 0 && (
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={excludeInvalid}
                  onChange={(e) => setExcludeInvalid(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-slate-600 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-white">Exclude invalid emails</div>
                  <div className="text-sm text-slate-400">
                    Remove {report.stats.invalid} invalid email(s) from the list
                  </div>
                </div>
              </label>
            )}

            {report.stats.duplicateEmails > 0 && (
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoMerge}
                  onChange={(e) => setAutoMerge(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-slate-600 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-white">Auto-merge duplicates</div>
                  <div className="text-sm text-slate-400">
                    Merge {report.stats.duplicateRecipients} duplicate records into {report.stats.duplicateEmails} unique recipient(s)
                  </div>
                </div>
              </label>
            )}
          </div>

          {/* Final Count */}
          <div className="bg-blue-900/40 border border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-blue-400" />
              <div>
                <div className="font-semibold text-blue-300">
                  Final recipient count: {finalCount}
                </div>
                <div className="text-sm text-blue-200">
                  {excludeInvalid && report.stats.invalid > 0 && `${report.stats.invalid} invalid removed. `}
                  {autoMerge && report.stats.duplicateEmails > 0 && `${report.stats.duplicateRecipients - report.stats.duplicateEmails} duplicates merged.`}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-slate-800 flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            Continue with {finalCount} Recipients
          </Button>
        </div>
      </div>
    </div>
  )
}
