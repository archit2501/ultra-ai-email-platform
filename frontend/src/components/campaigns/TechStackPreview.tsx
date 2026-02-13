'use client'

import { useState } from 'react'
import { Code, Eye, EyeOff, TrendingUp, Building, ChevronDown, ChevronUp } from 'lucide-react'

export interface CompanyTechStack {
  companyName: string
  technologies: string[]
  techCategories: string[]
  recipientCount: number
}

export interface TechCategoryBreakdown {
  category: string
  count: number
  technologies: string[]
}

export interface TechRecipientMatch {
  technology: string
  matchedRecipients: number
  companies: string[]
}

interface TechStackPreviewProps {
  companyTechStacks: CompanyTechStack[]
  categoryBreakdown: TechCategoryBreakdown[]
  techRecipientMatches: TechRecipientMatch[]
}

export function TechStackPreview({
  companyTechStacks,
  categoryBreakdown,
  techRecipientMatches,
}: TechStackPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showAllCompanies, setShowAllCompanies] = useState(false)

  // Calculate stats
  const totalCompanies = companyTechStacks.length
  const companiesWithTech = companyTechStacks.filter(c => c.technologies.length > 0).length
  const techSet = new Set(companyTechStacks.flatMap(c => c.technologies))
  const allTechnologies = Array.from(techSet)
  const avgTechPerCompany = totalCompanies > 0
    ? Math.round(companyTechStacks.reduce((sum, c) => sum + c.technologies.length, 0) / totalCompanies)
    : 0

  // Most common technologies
  const topTechnologies = [...techRecipientMatches]
    .sort((a, b) => b.matchedRecipients - a.matchedRecipients)
    .slice(0, 10)

  const displayedCompanies = showAllCompanies ? companyTechStacks : companyTechStacks.slice(0, 5)

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Code className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Tech Stack Detection Preview</h3>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-slate-400 hover:text-slate-300 transition-colors"
        >
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {isExpanded && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className="text-2xl font-bold text-blue-400">{companiesWithTech}</div>
              <div className="text-xs text-slate-400 mt-1">Companies Analyzed</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className="text-2xl font-bold text-green-400">{allTechnologies.length}</div>
              <div className="text-xs text-slate-400 mt-1">Unique Technologies</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className="text-2xl font-bold text-purple-400">{avgTechPerCompany}</div>
              <div className="text-xs text-slate-400 mt-1">Avg Tech per Company</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className="text-2xl font-bold text-amber-400">{categoryBreakdown.length}</div>
              <div className="text-xs text-slate-400 mt-1">Tech Categories</div>
            </div>
          </div>

          {/* Tech Categories Breakdown */}
          {categoryBreakdown.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                Tech Categories Distribution
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {categoryBreakdown.slice(0, 6).map((cat) => (
                  <div
                    key={cat.category}
                    className="p-3 rounded-lg bg-slate-800/30 border border-slate-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white">{cat.category}</span>
                      <span className="text-sm font-bold text-blue-400">{cat.count}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {cat.technologies.slice(0, 4).map((tech) => (
                        <span
                          key={tech}
                          className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs"
                        >
                          {tech}
                        </span>
                      ))}
                      {cat.technologies.length > 4 && (
                        <span className="px-2 py-0.5 text-xs text-slate-400">
                          +{cat.technologies.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Most Common Technologies */}
          {topTechnologies.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Code className="w-4 h-4 text-blue-400" />
                Most Common Technologies
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {topTechnologies.map((tech) => (
                  <div
                    key={tech.technology}
                    className="p-3 rounded-lg bg-slate-800/30 border border-slate-700 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{tech.technology}</span>
                        <span className="text-xs text-slate-400">
                          {tech.matchedRecipients} recipients
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {tech.companies.slice(0, 3).map((company) => (
                          <span
                            key={company}
                            className="text-xs text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded"
                          >
                            {company}
                          </span>
                        ))}
                        {tech.companies.length > 3 && (
                          <span className="text-xs text-slate-400">
                            +{tech.companies.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-24 ml-4">
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-blue-400 h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, (tech.matchedRecipients / totalCompanies) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Companies with Tech Stacks */}
          {companyTechStacks.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Building className="w-4 h-4 text-blue-400" />
                  Companies with Detected Tech Stacks
                </h4>
                {companyTechStacks.length > 5 && (
                  <button
                    onClick={() => setShowAllCompanies(!showAllCompanies)}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    {showAllCompanies ? (
                      <>
                        <EyeOff className="w-3 h-3" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3" />
                        Show All ({companyTechStacks.length})
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {displayedCompanies.map((company) => (
                  <div
                    key={company.companyName}
                    className="p-3 rounded-lg bg-slate-800/30 border border-slate-700"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-sm font-medium text-white">{company.companyName}</div>
                        <div className="text-xs text-slate-400">
                          {company.recipientCount} recipient{company.recipientCount !== 1 ? 's' : ''} · {company.technologies.length} technologies
                        </div>
                      </div>
                    </div>

                    {/* Tech Categories */}
                    {company.techCategories.length > 0 && (
                      <div className="mb-2">
                        <div className="text-xs text-slate-400 mb-1">Categories:</div>
                        <div className="flex flex-wrap gap-1">
                          {company.techCategories.map((cat) => (
                            <span
                              key={cat}
                              className="px-2 py-0.5 rounded bg-slate-700/50 border border-slate-600 text-slate-300 text-xs"
                            >
                              {cat}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Technologies */}
                    {company.technologies.length > 0 && (
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Technologies:</div>
                        <div className="flex flex-wrap gap-1">
                          {company.technologies.slice(0, 8).map((tech) => (
                            <span
                              key={tech}
                              className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs"
                            >
                              {tech}
                            </span>
                          ))}
                          {company.technologies.length > 8 && (
                            <span className="px-2 py-0.5 text-xs text-slate-400">
                              +{company.technologies.length - 8} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
