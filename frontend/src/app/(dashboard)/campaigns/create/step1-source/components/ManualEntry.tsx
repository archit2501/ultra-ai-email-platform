'use client'

import { useCallback, useState } from 'react'
import axios from 'axios'
import { CampaignRecipient } from '@/types'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react'
import { recipientsAPI } from '@/lib/api'
import apiClient from '@/lib/api'
import { toast } from 'sonner'
import { validateEmail } from '@/utils/recipientValidation'

interface ManualEntryProps {
  onRecipientSelected: (recipients: CampaignRecipient[], count: number) => void
}

export function ManualEntry({ onRecipientSelected }: ManualEntryProps) {
  const [mode, setMode] = useState<'form' | 'paste'>('form')
  const [recipients, setRecipients] = useState<CampaignRecipient[]>([])
  const [pasteText, setPasteText] = useState('')
  const [newRecipient, setNewRecipient] = useState({
    name: '',
    email: '',
    company: '',
    jobTitle: '',
  })
  const [errors, setErrors] = useState<string[]>([])
  const [emailValidation, setEmailValidation] = useState<{ isValid: boolean; reason?: string } | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleEmailChange = (email: string) => {
    setNewRecipient({ ...newRecipient, email })
    
    // Real-time validation
    if (email.trim()) {
      const validation = validateEmail(email)
      setEmailValidation(validation)
    } else {
      setEmailValidation(null)
    }
  }

  const addRecipient = () => {
    const newErrors: string[] = []

    if (!newRecipient.email.trim()) {
      newErrors.push('Email is required')
    } else {
      const validation = validateEmail(newRecipient.email)
      if (!validation.isValid) {
        newErrors.push(validation.reason || 'Invalid email')
      }
    }

    if (newErrors.length > 0) {
      setErrors(newErrors)
      return
    }

    setRecipients([
      ...recipients,
      {
        ...newRecipient,
        name: newRecipient.name || newRecipient.email,
        position: newRecipient.jobTitle,
      } as CampaignRecipient,
    ])
    setNewRecipient({
      name: '',
      email: '',
      company: '',
      jobTitle: '',
    })
    setErrors([])
  }

  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index))
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
        // Attempt to fetch existing recipient by email so we still get the id
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

  const handlePasteImport = () => {
    const newErrors: string[] = []
    const lines = pasteText
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => line.trim())

    const importedRecipients: CampaignRecipient[] = []

    lines.forEach((line, idx) => {
      // Support formats: email | name, email | name | company | email | name | email | company | job
      const parts = line.split('|').map((p) => p.trim())

      if (parts.length === 0 || !parts[0]) {
        return // Skip empty lines
      }

      // Try to parse different formats
      let email = ''
      let name = ''
      let company = ''
      let jobTitle = ''

      if (parts.length === 1) {
        // Just email
        email = parts[0]
      } else if (parts.length === 2) {
        // name | email OR email | name
        const firstIsEmail = validateEmail(parts[0]).isValid
        email = firstIsEmail ? parts[0] : parts[1]
        name = firstIsEmail ? parts[1] : parts[0]
      } else if (parts.length === 3) {
        // name | email | company
        email = parts[1]
        name = parts[0]
        company = parts[2]
      } else if (parts.length >= 4) {
        // name | email | company | job
        name = parts[0]
        email = parts[1]
        company = parts[2]
        jobTitle = parts[3]
      }

      const validation = validateEmail(email)
      if (!validation.isValid) {
        newErrors.push(`Row ${idx + 1}: ${validation.reason || 'Invalid email'} "${email}"`)
        return
      }

      importedRecipients.push({
        name: name || email,
        email,
        company: company || '',
        position: jobTitle || '',
      })
    })

    if (newErrors.length > 0) {
      setErrors(newErrors.slice(0, 5))
    } else {
      setRecipients([...recipients, ...importedRecipients])
      setPasteText('')
      setMode('form')
    }
  }

  const handleConfirm = async () => {
    if (recipients.length === 0) return

    setIsSaving(true)
    const created: CampaignRecipient[] = []
    const failed: string[] = []

    for (const recipient of recipients) {
      try {
        const saved = await createOrFetchRecipient(recipient)
        if (saved) {
          created.push(saved)
        }
      } catch (error: any) {
        failed.push(`${recipient.email} (${error?.response?.data?.detail || error?.message || 'unknown error'})`)
      }
    }

    setIsSaving(false)

    if (created.length > 0) {
      onRecipientSelected(created, created.length)
      toast.success(`Saved ${created.length} recipients to your workspace`)
    }

    if (failed.length > 0) {
      toast.error(`Failed to save ${failed.length} recipients`, {
        description: failed.slice(0, 3).join('\n'),
      })
    }
  }

  return (
    <div className="space-y-6 text-slate-100">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-white">Enter Recipients Manually</h2>
        <p className="text-slate-400">Add contacts one by one or paste a list</p>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 border-b border-slate-800">
        <button
          onClick={() => setMode('form')}
          className={`px-4 py-2 font-medium transition-colors ${
            mode === 'form'
              ? 'border-b-2 border-blue-500 text-blue-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Add One by One
        </button>
        <button
          onClick={() => setMode('paste')}
          className={`px-4 py-2 font-medium transition-colors ${
            mode === 'paste'
              ? 'border-b-2 border-blue-500 text-blue-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Paste List
        </button>
      </div>

      {/* Form Mode */}
      {mode === 'form' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Email *
            </label>
            <input
              type="email"
              placeholder="name@example.com"
              value={newRecipient.email}
              onChange={(e) => handleEmailChange(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 bg-slate-900 text-slate-100 ${
                emailValidation?.isValid === false
                  ? 'border-red-500 focus:ring-red-500'
                  : emailValidation?.isValid === true
                  ? 'border-green-500 focus:ring-green-500'
                  : 'border-slate-700 focus:ring-blue-500'
              }`}
            />
            {emailValidation?.isValid === false && (
              <div className="flex items-center gap-1 mt-1 text-xs text-red-400">
                <AlertCircle className="w-3 h-3" />
                <span>{emailValidation.reason}</span>
              </div>
            )}
            {emailValidation?.isValid === true && (
              <div className="flex items-center gap-1 mt-1 text-xs text-green-400">
                <CheckCircle className="w-3 h-3" />
                <span>Valid email</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Name
            </label>
            <input
              type="text"
              placeholder="John Smith"
              value={newRecipient.name}
              onChange={(e) =>
                setNewRecipient({ ...newRecipient, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-900 text-slate-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Company
              </label>
              <input
                type="text"
                placeholder="Acme Corp"
                value={newRecipient.company}
                onChange={(e) =>
                  setNewRecipient({ ...newRecipient, company: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-900 text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Job Title
              </label>
              <input
                type="text"
                placeholder="CEO"
                value={newRecipient.jobTitle}
                onChange={(e) =>
                  setNewRecipient({ ...newRecipient, jobTitle: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-900 text-slate-100"
              />
            </div>
          </div>

          {errors.length > 0 && (
            <div className="bg-red-900/40 border border-red-800 rounded-lg p-3 flex gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div>
                {errors.map((error, idx) => (
                  <p key={idx} className="text-sm text-red-200">
                    {error}
                  </p>
                ))}
              </div>
            </div>
          )}

          <Button onClick={addRecipient} variant="outline" className="w-full gap-2">
            <Plus className="w-4 h-4" />
            Add Recipient
          </Button>
        </div>
      )}

      {/* Paste Mode */}
      {mode === 'paste' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Paste Recipients
            </label>
            <textarea
              placeholder={`Paste one per line. Formats:\nemail@example.com\nJohn Smith | john@example.com\nJohn Smith | john@example.com | Acme Corp\nJohn Smith | john@example.com | Acme Corp | CEO`}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono bg-slate-900 text-slate-100"
              rows={8}
            />
          </div>

          {errors.length > 0 && (
            <div className="bg-red-900/40 border border-red-800 rounded-lg p-3 flex gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-200 mb-1">
                  Issues found ({errors.length}):
                </p>
                {errors.map((error, idx) => (
                  <p key={idx} className="text-sm text-red-200">
                    • {error}
                  </p>
                ))}
              </div>
            </div>
          )}

          <Button onClick={handlePasteImport} className="w-full">
            Import from Paste
          </Button>
        </div>
      )}

      {/* Recipients Table */}
      {recipients.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-white">Added Recipients ({recipients.length})</h3>
          <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60">
                    <th className="text-left p-3 font-semibold text-white">Name</th>
                    <th className="text-left p-3 font-semibold text-white">Email</th>
                    <th className="text-left p-3 font-semibold text-white">Company</th>
                    <th className="text-left p-3 font-semibold text-white">Job Title</th>
                    <th className="text-center p-3 font-semibold text-white">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recipients.map((recipient, idx) => (
                    <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/60">
                      <td className="p-3 text-white">{recipient.name}</td>
                      <td className="p-3 text-white">{recipient.email}</td>
                      <td className="p-3 text-slate-300">{recipient.company || '-'}</td>
                      <td className="p-3 text-slate-300">{recipient.position || '-'}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => removeRecipient(idx)}
                          className="text-red-400 hover:text-red-300 inline-flex"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div>
        <Button
          onClick={handleConfirm}
          disabled={recipients.length === 0 || isSaving}
          className="w-full"
        >
          {isSaving ? 'Saving recipients...' : `Use ${recipients.length} Recipients`}
        </Button>
      </div>
    </div>
  )
}
