'use client'

import { useState, useEffect } from 'react'
import { CampaignRecipient } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Users, ChevronRight, Eye, EyeOff, Search, Plus, Filter } from 'lucide-react'
import apiClient from '@/lib/api'
import { toast } from 'sonner'

interface RecipientGroup {
  id: number
  name: string
  type: 'static' | 'dynamic'
  recipientCount: number
  description?: string
  filters?: Record<string, any>
}

interface RecipientGroupSelectorProps {
  onGroupSelected: (recipients: CampaignRecipient[], count: number, groupName: string) => void
  isLoading?: boolean
}

export function RecipientGroupSelector({
  onGroupSelected,
  isLoading,
}: RecipientGroupSelectorProps) {
  const [groups, setGroups] = useState<RecipientGroup[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [previewRecipients, setPreviewRecipients] = useState<CampaignRecipient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'static' | 'dynamic'>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Fetch groups on mount
  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data } = await apiClient.get('/recipient-groups', { params: { page: 1, page_size: 50 } })
      const items = data?.groups || []
      setGroups(
        items.map((g: any) => ({
          id: g.id,
          name: g.name,
          type: g.group_type === 'dynamic' ? 'dynamic' : 'static',
          recipientCount: g.total_recipients || 0,
          description: g.description,
          filters: g.filter_criteria,
        }))
      )
    } catch (err) {
      setError('Failed to load groups')
    } finally {
      setLoading(false)
    }
  }

  const handleGroupSelect = async (groupId: number) => {
    setSelectedGroupId(groupId)
    await fetchGroupPreview(groupId)
  }

  const fetchGroupPreview = async (groupId: number) => {
    try {
      const { data } = await apiClient.get(`/recipient-groups/${groupId}/with-recipients`)
      const recs = data?.recipients || []
      const mapped: CampaignRecipient[] = recs.map((r: any) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        company: r.company,
        position: r.position,
        linkedinUrl: r.linkedin_url,
        website: r.website,
      }))
      setPreviewRecipients(mapped)
      setShowPreview(true)
    } catch (err) {
      setError('Failed to load group preview')
    }
  }

  const handleConfirm = () => {
    if (selectedGroupId !== null) {
      const group = groups.find((g) => g.id === selectedGroupId)
      if (group) {
        onGroupSelected(
          previewRecipients.length > 0 ? previewRecipients : [],
          group.recipientCount,
          group.name
        )
      }
    }
  }

  // Filter groups based on search and type
  const filteredGroups = groups.filter((group) => {
    // Type filter
    if (typeFilter !== 'all' && group.type !== typeFilter) {
      return false
    }
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        group.name.toLowerCase().includes(query) ||
        (group.description && group.description.toLowerCase().includes(query))
      )
    }
    return true
  })

  const handleCreateGroup = async (name: string, description: string, type: 'static' | 'dynamic') => {
    try {
      const { data } = await apiClient.post('/recipient-groups', {
        name,
        description,
        group_type: type,
      })
      toast.success('Group created successfully')
      setShowCreateModal(false)
      await fetchGroups()
    } catch (err) {
      toast.error('Failed to create group')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 text-slate-100">
        <div>
          <h2 className="text-2xl font-bold mb-2 text-white">Loading Groups...</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-800 h-24 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 text-slate-100">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-white">Select a Recipient Group</h2>
        <p className="text-slate-400">Choose from your saved groups to use for this campaign</p>
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-800 rounded-lg p-4 text-red-200">
          {error}
        </div>
      )}

      {/* Search & Filter Section */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search groups by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-900 border-slate-700 text-white"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-slate-900 border-slate-700 text-white hover:bg-slate-800"
          >
            <Plus className="w-4 h-4" />
            Create New
          </Button>
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <div className="flex gap-2">
            {['all', 'static', 'dynamic'].map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type as 'all' | 'static' | 'dynamic')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  typeFilter === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-900 border border-slate-700 text-slate-300 hover:border-blue-500/60'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredGroups.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center">
          <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-300">
            {searchQuery || typeFilter !== 'all'
              ? 'No groups match your filters'
              : 'No groups found'}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            {searchQuery || typeFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create a group to get started'}
          </p>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 bg-blue-600 hover:bg-blue-700"
          >
            Create Your First Group
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              onClick={() => handleGroupSelect(group.id)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedGroupId === group.id
                  ? 'border-blue-500 bg-slate-800'
                  : 'border-slate-800 bg-slate-900 hover:border-blue-500/60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white">{group.name}</h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-slate-800 text-slate-200">
                      {group.type === 'static' ? 'Static' : 'Dynamic'}
                    </span>
                  </div>
                  {group.description && (
                    <p className="text-sm text-slate-400">{group.description}</p>
                  )}
                  <p className="text-sm font-semibold text-blue-400 mt-2">
                    {group.recipientCount} recipients
                  </p>
                </div>
                <ChevronRight
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    selectedGroupId === group.id ? 'rotate-90' : ''
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateGroup}
        />
      )}

      {/* Preview Modal */}
      {showPreview && selectedGroupId !== null && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">Preview Recipients</h3>
            <button
              onClick={() => setShowPreview(false)}
              className="text-sm text-slate-400 hover:text-white flex items-center gap-1"
            >
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

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
                  {previewRecipients.map((recipient, idx) => (
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
          <p className="text-sm text-slate-400">
            Showing first {previewRecipients.length} of{' '}
            {groups.find((g) => g.id === selectedGroupId)?.recipientCount} recipients
          </p>
        </div>
      )}

      {/* Actions */}
      <div>
        <Button
          onClick={handleConfirm}
          disabled={selectedGroupId === null || isLoading}
          className="w-full"
        >
          {isLoading ? 'Processing...' : 'Use This Group'}
        </Button>
      </div>
    </div>
  )
}

// Create Group Modal Component
function CreateGroupModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (name: string, description: string, type: 'static' | 'dynamic') => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'static' | 'dynamic'>('static')
  const [creating, setCreating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Please enter a group name')
      return
    }
    setCreating(true)
    await onCreate(name, description, type)
    setCreating(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-6 max-w-md w-full">
        <h3 className="text-xl font-bold text-white mb-4">Create New Group</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Group Name *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Q1 2026 Leads"
              className="bg-slate-800 border-slate-700 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Group Type
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setType('static')}
                className={`flex-1 p-3 rounded-lg border-2 text-left transition-colors ${
                  type === 'static'
                    ? 'border-blue-500 bg-slate-800'
                    : 'border-slate-700 bg-slate-800/50 hover:border-blue-500/60'
                }`}
              >
                <div className="font-semibold text-white mb-1">Static</div>
                <div className="text-xs text-slate-400">Fixed list of recipients</div>
              </button>
              <button
                type="button"
                onClick={() => setType('dynamic')}
                className={`flex-1 p-3 rounded-lg border-2 text-left transition-colors ${
                  type === 'dynamic'
                    ? 'border-blue-500 bg-slate-800'
                    : 'border-slate-700 bg-slate-800/50 hover:border-blue-500/60'
                }`}
              >
                <div className="font-semibold text-white mb-1">Dynamic</div>
                <div className="text-xs text-slate-400">Auto-updated by filters</div>
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={creating}
            >
              {creating ? 'Creating...' : 'Create Group'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
