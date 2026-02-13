'use client'

import { useState, useEffect } from 'react'
import { CampaignRecipient } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Briefcase, Filter, Search, CheckSquare, Square } from 'lucide-react'
import apiClient from '@/lib/api'
import { toast } from 'sonner'

interface Application {
  id: number
  recruiterName: string
  recruiterEmail: string
  company: string
  jobTitle: string
  status: 'sent' | 'opened' | 'responded' | 'pending'
  sentDate: string
}

interface ApplicationSelectorProps {
  onApplicationsSelected: (recipients: CampaignRecipient[], count: number) => void
  isLoading?: boolean
}

export function ApplicationSelector({
  onApplicationsSelected,
  isLoading,
}: ApplicationSelectorProps) {
  const [applications, setApplications] = useState<Application[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [filters, setFilters] = useState({
    status: [] as string[],
    searchQuery: '',
  })
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch applications on mount
  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data } = await apiClient.get('/applications', { params: { limit: 100, skip: 0 } })
      const items = data?.items || data || []
      setApplications(
        items.map((app: any) => ({
          id: app.id,
          recruiterName: app.recruiter_name || app.recruiterName || app.recruiter_email,
          recruiterEmail: app.recruiter_email,
          company: app.company_name || app.company,
          jobTitle: app.position_title || app.job_title,
          status: app.status || 'sent',
          sentDate: app.sent_at || app.created_at,
        }))
      )
    } catch (err) {
      setError('Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  const filteredApplications = applications.filter((app) => {
    // Status filter
    if (filters.status.length > 0 && !filters.status.includes(app.status)) {
      return false
    }
    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      return (
        app.recruiterName.toLowerCase().includes(query) ||
        app.company.toLowerCase().includes(query) ||
        app.recruiterEmail.toLowerCase().includes(query)
      )
    }
    return true
  })

  const toggleSelection = (id: number) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const toggleStatusFilter = (status: string) => {
    const newFilters = [...filters.status]
    if (newFilters.includes(status)) {
      newFilters.splice(newFilters.indexOf(status), 1)
    } else {
      newFilters.push(status)
    }
    setFilters({ ...filters, status: newFilters })
  }

  const handleConfirm = () => {
    const selected = applications.filter((app) => selectedIds.has(app.id))
    const recipients: CampaignRecipient[] = selected.map((app) => ({
      name: app.recruiterName,
      email: app.recruiterEmail,
      company: app.company,
      position: app.jobTitle,
    }))

    onApplicationsSelected(recipients, recipients.length)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredApplications.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredApplications.map((app) => app.id)))
    }
  }

  const bulkSelectByStatus = (status: string) => {
    const statusApps = filteredApplications.filter((app) => app.status === status)
    const newSelected = new Set(selectedIds)
    statusApps.forEach((app) => newSelected.add(app.id))
    setSelectedIds(newSelected)
    toast.success(`Selected ${statusApps.length} ${status} applications`)
  }

  const statusOptions = [
    { value: 'sent', label: 'Sent', color: 'blue' },
    { value: 'opened', label: 'Opened', color: 'green' },
    { value: 'responded', label: 'Responded', color: 'purple' },
    { value: 'pending', label: 'Pending', color: 'yellow' },
  ]

  if (loading) {
    return (
      <div className="space-y-6 text-slate-100">
        <div>
          <h2 className="text-2xl font-bold mb-2 text-white">Loading Applications...</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-800 h-20 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 text-slate-100">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-white">Select from Pipeline</h2>
        <p className="text-slate-400">
          Convert your job applications to a campaign to send follow-ups
        </p>
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-800 rounded-lg p-4 text-red-200">
          {error}
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search by name, company, or email..."
          value={filters.searchQuery}
          onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
          className="pl-9 bg-slate-900 border-slate-700 text-white"
        />
      </div>

      {/* Filters & Bulk Actions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? 'Hide' : 'Show'} Filters
          </button>

          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-slate-400 hover:text-white font-medium"
          >
            {selectedIds.size === filteredApplications.length ? (
              <CheckSquare className="w-4 h-4" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            Select All ({filteredApplications.length})
          </button>
        </div>

        {showFilters && (
          <div className="bg-slate-900 rounded-lg p-4 space-y-4 border border-slate-800">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Filter by Status
              </label>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => toggleStatusFilter(option.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filters.status.includes(option.value)
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 border border-slate-700 text-slate-200 hover:border-blue-500/60'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bulk Select by Status */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Bulk Select by Status
              </label>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => bulkSelectByStatus(option.value)}
                    className="px-3 py-2 rounded-lg text-sm font-medium bg-slate-800 border border-slate-700 text-slate-200 hover:border-blue-500/60 transition-colors"
                  >
                    Select All {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center">
          <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-300">No applications match your filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredApplications.map((app) => (
            <label
              key={app.id}
              className="flex items-start gap-3 p-4 rounded-lg border-2 border-slate-800 hover:border-blue-500/60 bg-slate-900 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedIds.has(app.id)}
                onChange={() => toggleSelection(app.id)}
                className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-white">{app.recruiterName}</h3>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      app.status === 'sent'
                        ? 'bg-blue-900/60 text-blue-200'
                        : app.status === 'opened'
                        ? 'bg-green-900/60 text-green-200'
                        : 'bg-purple-900/60 text-purple-200'
                    }`}
                  >
                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </span>
                </div>
                <p className="text-sm text-slate-300">
                  {app.jobTitle} @ {app.company}
                </p>
                <p className="text-sm text-slate-400">{app.recruiterEmail}</p>
                <p className="text-xs text-slate-500 mt-1">Sent: {app.sentDate}</p>
              </div>
            </label>
          ))}
        </div>
      )}

      {/* Selected Count */}
      {selectedIds.size > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <p className="text-blue-300 font-semibold">
            {selectedIds.size} application{selectedIds.size !== 1 ? 's' : ''} selected
          </p>
        </div>
      )}

      {/* Actions */}
      <div>
        <Button
          onClick={handleConfirm}
          disabled={selectedIds.size === 0 || isLoading}
          className="w-full"
        >
          {isLoading ? 'Processing...' : `Use ${selectedIds.size} Selected`}
        </Button>
      </div>
    </div>
  )
}
