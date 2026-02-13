'use client'

import { useState } from 'react'
import { Search, Star, Filter, ChevronDown, ChevronUp, Heart, Zap, TrendingUp, Globe, Eye, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export interface MarketplaceTemplate {
  id: number
  name: string
  description: string
  category: string
  tone: string
  language: string
  author: string
  rating: number
  reviewCount: number
  uses: number
  isFavorited: boolean
  preview: {
    subject: string
    body: string
  }
  tags: string[]
}

interface TemplateMarketplaceModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectTemplate: (template: MarketplaceTemplate) => void
  templates: MarketplaceTemplate[]
}

const CATEGORIES = ['All', 'Sales', 'Recruitment', 'Support', 'Business Development', 'Outreach', 'Follow-up']
const TONES = ['All', 'Professional', 'Casual', 'Urgent', 'Friendly', 'Formal']
const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Portuguese', 'Japanese', 'Chinese']
const SORT_OPTIONS = ['Popularity', 'Rating', 'Newest', 'Most Used']

export function TemplateMarketplaceModal({
  isOpen,
  onClose,
  onSelectTemplate,
  templates,
}: TemplateMarketplaceModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedTone, setSelectedTone] = useState('All')
  const [selectedLanguage, setSelectedLanguage] = useState('English')
  const [sortBy, setSortBy] = useState('Popularity')
  const [showFilters, setShowFilters] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<MarketplaceTemplate | null>(null)
  const [favorites, setFavorites] = useState<Set<number>>(new Set())

  // Filter templates
  let filtered = templates.filter(t => {
    const matchesSearch = searchQuery === '' || 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory
    const matchesTone = selectedTone === 'All' || t.tone === selectedTone
    const matchesLanguage = selectedLanguage === 'All' || t.language === selectedLanguage

    return matchesSearch && matchesCategory && matchesTone && matchesLanguage
  })

  // Sort templates
  if (sortBy === 'Rating') {
    filtered = filtered.sort((a, b) => b.rating - a.rating)
  } else if (sortBy === 'Newest') {
    filtered = filtered.sort((a, b) => b.id - a.id)
  } else if (sortBy === 'Most Used') {
    filtered = filtered.sort((a, b) => b.uses - a.uses)
  } else {
    // Popularity (default)
    filtered = filtered.sort((a, b) => b.reviewCount - a.reviewCount)
  }

  const toggleFavorite = (id: number) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(id)) {
      newFavorites.delete(id)
    } else {
      newFavorites.add(id)
    }
    setFavorites(newFavorites)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-950 rounded-lg border border-slate-800 w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div>
            <h2 className="text-2xl font-bold text-white">Template Marketplace</h2>
            <p className="text-sm text-slate-400 mt-1">Browse {templates.length} professional email templates</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Filters Sidebar */}
          <div
            className={`border-r border-slate-800 bg-slate-900/50 transition-all overflow-y-auto ${
              showFilters ? 'w-64 p-4' : 'w-0'
            }`}
          >
            {showFilters && (
              <div className="space-y-6">
                {/* Search */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 uppercase">Search</label>
                  <div className="relative mt-2">
                    <Search className="absolute left-2 top-2.5 w-4 h-4 text-slate-500" />
                    <Input
                      placeholder="Search templates..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 bg-slate-800 border-slate-700"
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 uppercase">Category</label>
                  <div className="space-y-2 mt-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`block w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                          selectedCategory === cat
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tone */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 uppercase">Tone</label>
                  <div className="space-y-2 mt-2">
                    {TONES.map((tone) => (
                      <button
                        key={tone}
                        onClick={() => setSelectedTone(tone)}
                        className={`block w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                          selectedTone === tone
                            ? 'bg-purple-600 text-white'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                        }`}
                      >
                        {tone}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 uppercase flex items-center gap-2">
                    <Globe className="w-3 h-3" />
                    Language
                  </label>
                  <div className="space-y-2 mt-2">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setSelectedLanguage(lang)}
                        className={`block w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                          selectedLanguage === lang
                            ? 'bg-green-600 text-white'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 uppercase">Sort By</label>
                  <div className="space-y-2 mt-2">
                    {SORT_OPTIONS.map((option) => (
                      <button
                        key={option}
                        onClick={() => setSortBy(option)}
                        className={`block w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                          sortBy === option
                            ? 'bg-orange-600 text-white'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            {selectedTemplate ? (
              // Template Detail View
              <div className="p-6 space-y-4">
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mb-4"
                >
                  ← Back to Templates
                </button>

                <div className="grid grid-cols-3 gap-6">
                  {/* Preview */}
                  <div className="col-span-2">
                    <div className="bg-slate-800 rounded-lg p-6 space-y-4 border border-slate-700">
                      <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase">Subject</label>
                        <div className="mt-2 p-4 bg-slate-700/50 rounded border border-slate-600 text-white">
                          {selectedTemplate.preview.subject}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase">Body Preview</label>
                        <div className="mt-2 p-4 bg-slate-700/50 rounded border border-slate-600 text-white whitespace-pre-wrap text-sm max-h-96 overflow-y-auto">
                          {selectedTemplate.preview.body}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="space-y-4">
                    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 space-y-3">
                      <div>
                        <h3 className="text-lg font-bold text-white">{selectedTemplate.name}</h3>
                        <p className="text-xs text-slate-400 mt-1">by {selectedTemplate.author}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(selectedTemplate.rating)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-slate-600'
                            }`}
                          />
                        ))}
                        <span className="text-sm text-slate-400">
                          {selectedTemplate.rating.toFixed(1)} ({selectedTemplate.reviewCount} reviews)
                        </span>
                      </div>

                      <div className="pt-3 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">Uses</span>
                          <span className="text-white font-semibold">{selectedTemplate.uses.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">Category</span>
                          <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-300 text-xs font-medium">
                            {selectedTemplate.category}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">Tone</span>
                          <span className="px-2 py-1 rounded bg-purple-500/10 text-purple-300 text-xs font-medium">
                            {selectedTemplate.tone}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">Language</span>
                          <span className="text-white font-semibold">{selectedTemplate.language}</span>
                        </div>
                      </div>

                      {selectedTemplate.tags.length > 0 && (
                        <div className="pt-3 border-t border-slate-700">
                          <div className="text-xs text-slate-400 mb-2">Tags</div>
                          <div className="flex flex-wrap gap-1">
                            {selectedTemplate.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 rounded bg-slate-700 text-slate-300 text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="pt-3 border-t border-slate-700 space-y-2">
                        <Button
                          onClick={() => {
                            onSelectTemplate(selectedTemplate)
                            onClose()
                          }}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          Use This Template
                        </Button>
                        <button
                          onClick={() => toggleFavorite(selectedTemplate.id)}
                          className={`w-full py-2 rounded border transition-colors flex items-center justify-center gap-2 ${
                            favorites.has(selectedTemplate.id)
                              ? 'bg-red-500/10 border-red-500/30 text-red-300'
                              : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:text-slate-300'
                          }`}
                        >
                          <Heart
                            className={`w-4 h-4 ${favorites.has(selectedTemplate.id) ? 'fill-current' : ''}`}
                          />
                          {favorites.has(selectedTemplate.id) ? 'Favorited' : 'Add to Favorites'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Template Grid
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-400">
                      Showing {filtered.length} of {templates.length} templates
                    </span>
                  </div>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-300"
                  >
                    {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map((template) => (
                    <div
                      key={template.id}
                      className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden hover:border-slate-600 transition-colors cursor-pointer group"
                    >
                      <div className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                              {template.name}
                            </h3>
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                              {template.description}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleFavorite(template.id)
                            }}
                            className="p-1.5 hover:bg-slate-700 rounded transition-colors"
                          >
                            <Heart
                              className={`w-4 h-4 ${
                                favorites.has(template.id)
                                  ? 'fill-red-400 text-red-400'
                                  : 'text-slate-400 hover:text-red-400'
                              }`}
                            />
                          </button>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-300 text-xs font-medium">
                            {template.category}
                          </span>
                          <span className="px-2 py-1 rounded bg-purple-500/10 text-purple-300 text-xs font-medium">
                            {template.tone}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < Math.floor(template.rating)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-slate-600'
                                }`}
                              />
                            ))}
                            <span className="text-xs text-slate-400 ml-1">
                              {template.rating.toFixed(1)}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {template.uses}
                          </span>
                        </div>

                        <button
                          onClick={() => setSelectedTemplate(template)}
                          className="w-full mt-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                        >
                          Preview
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {filtered.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-slate-400">No templates found matching your filters</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
