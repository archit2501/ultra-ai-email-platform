'use client'

import { useState } from 'react'
import { History, ChevronDown, ChevronUp, RotateCcw, Eye, EyeOff, Copy, Calendar, User, AlignLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface TemplateVersion {
  id: number
  version: number
  createdAt: string
  createdBy: string
  subject: string
  body: string
  notes: string
  changes: string
  isCurrent: boolean
}

interface TemplateVersionHistoryProps {
  isOpen: boolean
  onClose: () => void
  versions: TemplateVersion[]
  onRevert: (version: TemplateVersion) => void
  currentTemplate?: {
    subject: string
    body: string
  }
}

export function TemplateVersionHistory({
  isOpen,
  onClose,
  versions,
  onRevert,
  currentTemplate,
}: TemplateVersionHistoryProps) {
  const [selectedVersion, setSelectedVersion] = useState<TemplateVersion | null>(null)
  const [compareMode, setCompareMode] = useState(false)
  const [compareWithVersion, setCompareWithVersion] = useState<TemplateVersion | null>(null)
  const [expandedAnnotations, setExpandedAnnotations] = useState<Set<number>>(new Set())

  const toggleAnnotation = (versionId: number) => {
    const newExpanded = new Set(expandedAnnotations)
    if (newExpanded.has(versionId)) {
      newExpanded.delete(versionId)
    } else {
      newExpanded.add(versionId)
    }
    setExpandedAnnotations(newExpanded)
  }

  if (!isOpen) return null

  const sortedVersions = [...versions].sort((a, b) => b.version - a.version)
  const currentVersion = sortedVersions.find(v => v.isCurrent) || sortedVersions[0]

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-950 rounded-lg border border-slate-800 w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <History className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-2xl font-bold text-white">Template Version History</h2>
              <p className="text-sm text-slate-400 mt-1">{versions.length} versions total</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-300"
          >
            Close
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Timeline Sidebar */}
          <div className="w-72 border-r border-slate-800 bg-slate-900/50 overflow-y-auto p-4 space-y-2">
            {sortedVersions.map((version, idx) => (
              <div key={version.id}>
                {/* Timeline connector */}
                {idx < sortedVersions.length - 1 && (
                  <div className="ml-4 h-6 border-l-2 border-slate-700"></div>
                )}

                {/* Version item */}
                <button
                  onClick={() => {
                    setSelectedVersion(version)
                    setCompareMode(false)
                  }}
                  className={`w-full p-3 rounded-lg text-left transition-all ${
                    selectedVersion?.id === version.id
                      ? 'bg-blue-600/20 border border-blue-500/50'
                      : 'hover:bg-slate-800 border border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        version.isCurrent ? 'bg-green-400' : 'bg-slate-600'
                      }`}
                    />
                    <span className="font-semibold text-white text-sm">v{version.version}</span>
                    {version.isCurrent && (
                      <span className="px-1.5 py-0.5 rounded bg-green-500/10 border border-green-500/30 text-green-300 text-xs">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 space-y-0.5">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {version.createdAt}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {version.createdBy}
                    </div>
                  </div>
                </button>
              </div>
            ))}
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            {selectedVersion ? (
              <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Version {selectedVersion.version}</h3>
                    <p className="text-sm text-slate-400 mt-1">{selectedVersion.createdAt}</p>
                  </div>
                  <div className="flex gap-2">
                    {!selectedVersion.isCurrent && (
                      <Button
                        onClick={() => onRevert(selectedVersion)}
                        className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Restore This Version
                      </Button>
                    )}
                    <button
                      onClick={() => {
                        setCompareMode(!compareMode)
                        if (!compareMode) {
                          setCompareWithVersion(
                            sortedVersions.find(v => v.version === selectedVersion.version + 1) || null
                          )
                        }
                      }}
                      className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      {compareMode ? 'Hide Comparison' : 'Compare'}
                    </button>
                  </div>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <div className="text-xs text-slate-400 uppercase font-semibold">Created By</div>
                    <div className="text-sm text-white mt-1">{selectedVersion.createdBy}</div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <div className="text-xs text-slate-400 uppercase font-semibold">Created At</div>
                    <div className="text-sm text-white mt-1">{selectedVersion.createdAt}</div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <div className="text-xs text-slate-400 uppercase font-semibold">Changes</div>
                    <div className="text-sm text-white mt-1">{selectedVersion.changes}</div>
                  </div>
                </div>

                {/* Notes/Annotations */}
                {selectedVersion.notes && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <button
                      onClick={() => toggleAnnotation(selectedVersion.id)}
                      className="flex items-center gap-2 w-full text-left"
                    >
                      <AlignLeft className="w-4 h-4 text-blue-400" />
                      <span className="font-semibold text-blue-300">Annotation</span>
                      {expandedAnnotations.has(selectedVersion.id) ? (
                        <ChevronUp className="w-4 h-4 text-blue-400 ml-auto" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-blue-400 ml-auto" />
                      )}
                    </button>
                    {expandedAnnotations.has(selectedVersion.id) && (
                      <div className="mt-3 text-sm text-blue-200 whitespace-pre-wrap">
                        {selectedVersion.notes}
                      </div>
                    )}
                  </div>
                )}

                {/* Content Comparison or Single View */}
                {compareMode && compareWithVersion ? (
                  <div className="grid grid-cols-2 gap-4">
                    {/* Current Version */}
                    <div>
                      <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-slate-600" />
                        v{selectedVersion.version}
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-semibold text-slate-400 uppercase">Subject</label>
                          <div className="mt-2 p-4 bg-slate-800 rounded border border-slate-700 text-white text-sm">
                            {selectedVersion.subject}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-400 uppercase">Body</label>
                          <div className="mt-2 p-4 bg-slate-800 rounded border border-slate-700 text-white text-sm max-h-64 overflow-y-auto whitespace-pre-wrap">
                            {selectedVersion.body}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Comparison Version */}
                    <div>
                      <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-green-400" />
                        v{compareWithVersion.version}
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-semibold text-slate-400 uppercase">Subject</label>
                          <div className="mt-2 p-4 bg-slate-800 rounded border border-slate-700 text-white text-sm">
                            {compareWithVersion.subject}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-400 uppercase">Body</label>
                          <div className="mt-2 p-4 bg-slate-800 rounded border border-slate-700 text-white text-sm max-h-64 overflow-y-auto whitespace-pre-wrap">
                            {compareWithVersion.body}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Single View */
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase">Subject</label>
                      <div className="mt-2 p-4 bg-slate-800 rounded border border-slate-700 text-white">
                        {selectedVersion.subject}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase">Body</label>
                      <div className="mt-2 p-4 bg-slate-800 rounded border border-slate-700 text-white max-h-96 overflow-y-auto whitespace-pre-wrap text-sm">
                        {selectedVersion.body}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                <p>Select a version from the timeline to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
