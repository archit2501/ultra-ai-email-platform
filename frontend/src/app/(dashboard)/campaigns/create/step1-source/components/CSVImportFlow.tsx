'use client'

import { useCallback, useState } from 'react'
import axios from 'axios'
import { CampaignRecipient } from '@/types'
import * as XLSX from 'xlsx'
import { CSVUploader } from './CSVUploader'
import { ColumnMapper } from './ColumnMapper'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import { recipientsAPI } from '@/lib/api'
import apiClient from '@/lib/api'
import { toast } from 'sonner'

interface CSVImportFlowProps {
  onRecipientSelected: (recipients: CampaignRecipient[], count: number) => void
}

type Step = 'upload' | 'map' | 'review'

export function CSVImportFlow({ onRecipientSelected }: CSVImportFlowProps) {
  const [step, setStep] = useState<Step>('upload')
  const [csvData, setCSVData] = useState<string[][]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [columnNames, setColumnNames] = useState<string[]>([])
  const [parsedRecipients, setParsedRecipients] = useState<CampaignRecipient[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)

  const handleFileSelected = async (file: File) => {
    try {
      setErrors([])
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const parsed = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 })

      if (parsed.length < 2) {
        setErrors(['CSV file must have at least 2 rows (header + 1 data row)'])
        return
      }

      setCSVData(parsed)
      setStep('map')
    } catch (error) {
      setErrors(['Failed to parse CSV file. Please check the file format.'])
    }
  }

  const handleMappingConfirmed = (newMapping: Record<string, string>, cols: string[]) => {
    setMapping(newMapping)
    setColumnNames(cols)

    // Parse recipients based on mapping
    const headers = csvData[0]
    const recipients: CampaignRecipient[] = []
    const parseErrors: string[] = []

    csvData.slice(1).forEach((row, rowIdx) => {
      const recipient: CampaignRecipient = {
        name: '',
        email: '',
        company: '',
        position: '',
      }

      let hasEmail = false

      Object.entries(newMapping).forEach(([csvHeader, fieldKey]) => {
        const colIdx = headers.indexOf(csvHeader)
        const value = row[colIdx]?.trim() || ''

        if (fieldKey === 'email') {
          if (value && isValidEmail(value)) {
            recipient.email = value
            hasEmail = true
          } else if (value) {
            parseErrors.push(`Row ${rowIdx + 2}: Invalid email "${value}"`)
          }
        } else if (fieldKey === 'name') {
          recipient.name = value
        } else if (fieldKey === 'company') {
          recipient.company = value
        } else if (fieldKey === 'job_title') {
          recipient.position = value
        }
      })

      if (hasEmail) {
        recipients.push(recipient)
      }
    })

    if (parseErrors.length > 0) {
      setErrors(parseErrors.slice(0, 5)) // Show first 5 errors
    }

    setParsedRecipients(recipients)
    setStep('review')
  }

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const createOrFetchRecipient = useCallback(async (recipient: CampaignRecipient) => {
    const payload = {
      email: recipient.email,
      name: recipient.name || recipient.email,
      company: recipient.company || undefined,
      position: recipient.position || undefined,
    }

    try {
      const { data } = await recipientsAPI.create(payload)
      return {
        ...recipient,
        id: data.id,
        name: data.name || recipient.name || recipient.email,
        company: data.company || recipient.company,
        position: data.position || recipient.position,
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        const { data } = await apiClient.get('/recipients', {
          params: {
            page: 1,
            page_size: 1,
            search_term: recipient.email,
          },
        })

        const existing = data?.recipients?.[0]
        if (existing) {
          return {
            ...recipient,
            id: existing.id,
            name: existing.name || recipient.name || recipient.email,
            company: existing.company || recipient.company,
            position: existing.position || recipient.position,
          }
        }
      }

      throw error
    }
  }, [])

  const handleProceed = async () => {
    if (parsedRecipients.length === 0) return

    setIsSaving(true)
    const created: CampaignRecipient[] = []
    const failed: string[] = []

    for (const recipient of parsedRecipients) {
      try {
        const saved = await createOrFetchRecipient(recipient)
        if (saved) created.push(saved)
      } catch (error: any) {
        failed.push(`${recipient.email} (${error?.response?.data?.detail || error?.message || 'unknown error'})`)
      }
    }

    setIsSaving(false)

    if (created.length > 0) {
      onRecipientSelected(created, created.length)
      toast.success(`Saved ${created.length} recipients from CSV`)
    }

    if (failed.length > 0) {
      toast.error(`Failed to save ${failed.length} recipients`, {
        description: failed.slice(0, 3).join('\n'),
      })
    }
  }

  return (
    <div className="space-y-6 text-slate-100">
      {step === 'upload' && <CSVUploader onFileSelected={handleFileSelected} />}

      {step === 'map' && csvData.length > 0 && (
        <ColumnMapper
          csvData={csvData}
          onMappingConfirmed={handleMappingConfirmed}
        />
      )}

      {step === 'review' && (
        <CSVReview
          recipients={parsedRecipients}
          errors={errors}
          onConfirm={handleProceed}
          isSaving={isSaving}
          onBack={() => setStep('map')}
        />
      )}
    </div>
  )
}

function CSVReview({
  recipients,
  errors,
  onConfirm,
  isSaving,
  onBack,
}: {
  recipients: CampaignRecipient[]
  errors: string[]
  onConfirm: () => void
  isSaving: boolean
  onBack: () => void
}) {
  const preview = recipients.slice(0, 5)

  return (
    <div className="space-y-6 text-slate-100">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-white">Preview Recipients</h2>
        <p className="text-slate-400">Review the parsed recipients before importing</p>
      </div>

      {/* Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-slate-400">Total Recipients</p>
            <p className="text-2xl font-bold text-white">{recipients.length}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Valid Emails</p>
            <p className="text-2xl font-bold text-green-400">{recipients.filter((r) => r.email).length}</p>
          </div>
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-900/40 border border-red-800 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-200 mb-1">Issues found ({errors.length}):</h3>
            <ul className="text-sm text-red-200 space-y-1">
              {errors.slice(0, 5).map((error, idx) => (
                <li key={idx}>• {error}</li>
              ))}
              {errors.length > 5 && <li>• ... and {errors.length - 5} more</li>}
            </ul>
          </div>
        </div>
      )}

      {/* Table Preview */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60">
                <th className="text-left p-3 font-semibold text-white">Name</th>
                <th className="text-left p-3 font-semibold text-white">Email</th>
                <th className="text-left p-3 font-semibold text-white">Company</th>
                <th className="text-left p-3 font-semibold text-white">Job Title</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((recipient, idx) => (
                <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/60">
                  <td className="p-3 text-white">{recipient.name || '-'}</td>
                  <td className="p-3 text-white">{recipient.email}</td>
                  <td className="p-3 text-slate-300">{recipient.company || '-'}</td>
                  <td className="p-3 text-slate-300">{recipient.position || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {recipients.length > 5 && (
        <p className="text-sm text-slate-400">... and {recipients.length - 5} more recipients</p>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onConfirm} className="flex-1" disabled={isSaving}>
          {isSaving ? 'Saving recipients...' : `Import ${recipients.length} Recipients`}
        </Button>
      </div>
    </div>
  )
}
