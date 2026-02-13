'use client'

import { useState } from 'react'
import { Upload, Globe, Users, Briefcase, PenTool, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type DataSource = 'csv' | 'ultra' | 'mobiadz' | 'group' | 'applications' | 'manual' | 'campaign'

interface DataSourceOption {
  id: DataSource
  title: string
  description: string
  icon: React.ReactNode
  badge?: string
  section?: 'import' | 'extract' | 'reuse'
}

interface DataSourceSelectorProps {
  selectedSource?: DataSource
  onSelect: (source: DataSource) => void
}

export function DataSourceSelector({ selectedSource, onSelect }: DataSourceSelectorProps) {
  const [view, setView] = useState<'main' | 'extract'>('main')

  const sources: DataSourceOption[] = [
    {
      id: 'csv',
      title: 'Upload CSV',
      description: 'Import contacts from Excel or CSV file',
      icon: <Upload className="w-6 h-6" />,
      section: 'import',
    },
    {
      id: 'ultra',
      title: 'ULTRA Extraction',
      description: 'AI-powered extraction from LinkedIn & websites',
      icon: <Globe className="w-6 h-6" />,
      badge: 'AI-Powered',
      section: 'extract',
    },
    {
      id: 'mobiadz',
      title: 'MobiAdz Extraction',
      description: 'Deep OSINT research for companies & emails',
      icon: <Globe className="w-6 h-6" />,
      badge: 'Deep OSINT',
      section: 'extract',
    },
    {
      id: 'group',
      title: 'Use Existing Group',
      description: 'Select from saved recipient groups',
      icon: <Users className="w-6 h-6" />,
      section: 'reuse',
    },
    {
      id: 'applications',
      title: 'From Applications',
      description: 'Convert pipeline job applications to campaign',
      icon: <Briefcase className="w-6 h-6" />,
      section: 'reuse',
    },
    {
      id: 'manual',
      title: 'Manual Entry',
      description: 'Type in contacts one by one or paste a list',
      icon: <PenTool className="w-6 h-6" />,
      section: 'import',
    },
  ]

  const groupedSources = {
    import: sources.filter((s) => s.section === 'import'),
    extract: sources.filter((s) => s.section === 'extract'),
    reuse: sources.filter((s) => s.section === 'reuse'),
  }

  return (
    <div className="space-y-8 text-slate-100">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-white">Where do you want to get recipients?</h2>
        <p className="text-slate-400">Choose how you'd like to build your contact list</p>
      </div>

      {/* Import Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Import Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groupedSources.import.map((source) => (
            <SourceCard
              key={source.id}
              source={source}
              isSelected={selectedSource === source.id}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>

      {/* Extract Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Extract from Web</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groupedSources.extract.map((source) => (
            <SourceCard
              key={source.id}
              source={source}
              isSelected={selectedSource === source.id}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>

      {/* Reuse Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Reuse Existing Data</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groupedSources.reuse.map((source) => (
            <SourceCard
              key={source.id}
              source={source}
              isSelected={selectedSource === source.id}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

interface SourceCardProps {
  source: DataSourceOption
  isSelected: boolean
  onSelect: (source: DataSource) => void
}

function SourceCard({ source, isSelected, onSelect }: SourceCardProps) {
  return (
    <button
      onClick={() => onSelect(source.id)}
      className={`p-4 rounded-lg border-2 transition-all text-left ${
        isSelected
          ? 'border-blue-500 bg-slate-800'
          : 'border-slate-800 bg-slate-900 hover:border-blue-500/60 hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className={`${isSelected ? 'text-blue-400' : 'text-slate-300'}`}>{source.icon}</div>
        {source.badge && (
          <span className="text-xs font-semibold px-2 py-1 bg-amber-900/50 text-amber-200 rounded">
            {source.badge}
          </span>
        )}
      </div>
      <h3 className="font-semibold text-white">{source.title}</h3>
      <p className="text-sm text-slate-300 mt-1">{source.description}</p>
    </button>
  )
}
