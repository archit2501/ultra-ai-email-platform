'use client'

import { useState, useEffect } from 'react'
import { CampaignRecipient } from '@/types'
import { CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { validateRecipients, ValidationReport } from '@/utils/recipientValidation'
import { ValidationReportModal } from './ValidationReportModal'

interface SummaryProps {
  source: string
  recipientCount: number
  recipients: CampaignRecipient[]
  onBack: () => void
  onNext: () => void
  isLoading?: boolean
  onRecipientsValidated?: (validatedRecipients: CampaignRecipient[]) => void
}

export function Summary({ 
  source, 
  recipientCount, 
  recipients, 
  onBack, 
  onNext, 
  isLoading,
  onRecipientsValidated 
}: SummaryProps) {
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null)
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [validatedRecipients, setValidatedRecipients] = useState<CampaignRecipient[]>([])
  const [isValidating, setIsValidating] = useState(false)

  useEffect(() => {
    // Auto-validate on mount
    if (recipients.length > 0) {
      performValidation()
    }
  }, [recipients])

  const performValidation = () => {
    setIsValidating(true)
    try {
      const report = validateRecipients(recipients)
      setValidationReport(report)
      
      // If there are issues, show modal
      if (report.stats.invalid > 0 || report.stats.duplicateEmails > 0) {
        setShowValidationModal(true)
      } else {
        // No issues, set validated recipients
        setValidatedRecipients(report.validRecipients)
      }
    } finally {
      setIsValidating(false)
    }
  }

  const handleValidationConfirm = (cleanedRecipients: CampaignRecipient[]) => {
    setValidatedRecipients(cleanedRecipients)
    setShowValidationModal(false)
    if (onRecipientsValidated) {
      onRecipientsValidated(cleanedRecipients)
    }
  }

  const handleNext = () => {
    if (validatedRecipients.length > 0 && onRecipientsValidated) {
      onRecipientsValidated(validatedRecipients)
    }
    onNext()
  }
  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      csv: 'CSV Upload',
      ultra: 'ULTRA Extraction',
      mobiadz: 'MobiAdz Extraction',
      group: 'Recipient Group',
      applications: 'Pipeline Applications',
      manual: 'Manual Entry',
      campaign: 'Previous Campaign',
    }
    return labels[source] || source
  }

  const displayRecipients = validatedRecipients.length > 0 ? validatedRecipients : recipients
  const displayCount = validatedRecipients.length > 0 ? validatedRecipients.length : recipientCount
  const preview = displayRecipients.slice(0, 3)

  const hasIssues = validationReport && (validationReport.stats.invalid > 0 || validationReport.stats.duplicateEmails > 0)
  const isClean = validationReport && !hasIssues

  return (
    <>
      <div className="space-y-6 text-slate-100">
        <div>
          <h2 className="text-2xl font-bold mb-2 text-white">Review Your Data Source</h2>
          <p className="text-slate-400">Make sure everything looks correct before proceeding</p>
        </div>

        {/* Source Info Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Source:</span>
              <span className="font-semibold text-white">{getSourceLabel(source)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Recipients Found:</span>
              <span className="font-semibold text-lg text-blue-300">{displayCount}</span>
            </div>
          </div>
        </div>

        {/* Validation Status */}
        {isValidating && (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-start gap-3">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-100">Validating recipients...</p>
              <p className="text-sm text-slate-400">Checking email formats and detecting duplicates</p>
            </div>
          </div>
        )}

        {isClean && (
          <div className="bg-green-900/30 border border-green-800 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-300 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-100">Data validated ✓</p>
              <p className="text-sm text-green-200">
                All {validationReport.stats.valid} recipients have valid email addresses with no duplicates
              </p>
            </div>
          </div>
        )}

        {hasIssues && validationReport && (
          <div className="bg-yellow-900/30 border border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3 mb-3">
              <AlertTriangle className="w-5 h-5 text-yellow-300 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-yellow-100">Validation issues found</p>
                <p className="text-sm text-yellow-200">
                  {validationReport.stats.invalid > 0 && `${validationReport.stats.invalid} invalid email(s). `}
                  {validationReport.stats.duplicateEmails > 0 && `${validationReport.stats.duplicateEmails} duplicate(s).`}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowValidationModal(true)}
              className="bg-yellow-900/40 border-yellow-700 text-yellow-200 hover:bg-yellow-800/40"
            >
              Review Issues
            </Button>
          </div>
        )}

        {/* Preview Section */}
        {preview.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-white">Preview (First 3)</h3>
            <div className="space-y-2">
              {preview.map((recipient, idx) => (
                <div key={idx} className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <p className="font-medium text-white">{recipient.name || 'Unknown'}</p>
                  <p className="text-sm text-slate-300">{recipient.email}</p>
                  {recipient.company && (
                    <p className="text-sm text-slate-400">{recipient.company}</p>
                  )}
                </div>
              ))}
            </div>
            {displayCount > 3 && (
              <p className="text-sm text-slate-400">... and {displayCount - 3} more recipients</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button 
            onClick={handleNext} 
            disabled={isLoading || isValidating || displayCount === 0} 
            className="flex-1"
          >
            {isLoading ? 'Processing...' : `Next: Enrich (${displayCount})`}
          </Button>
        </div>
      </div>

      {/* Validation Modal */}
      {showValidationModal && validationReport && (
        <ValidationReportModal
          report={validationReport}
          onConfirm={handleValidationConfirm}
          onCancel={() => setShowValidationModal(false)}
        />
      )}
    </>
  )
}
