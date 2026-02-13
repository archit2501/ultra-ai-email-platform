'use client'

import { useState } from 'react'
import { Building2, Eye, EyeOff, TrendingUp, DollarSign, Users, Calendar, ChevronDown, ChevronUp } from 'lucide-react'

export interface CompanyIntelligenceData {
  companyName: string
  industry: string
  companySize: string
  fundingStage: string
  revenue: string
  foundedYear: number
  location: string
  dataFreshness: 'fresh' | 'recent' | 'stale'
  lastUpdated: string
  recipientCount: number
}

export interface IndustryBreakdown {
  industry: string
  count: number
  companies: string[]
}

export interface CompanySizeDistribution {
  sizeRange: string
  count: number
  percentage: number
}

interface CompanyIntelligencePreviewProps {
  companies: CompanyIntelligenceData[]
  industryBreakdown: IndustryBreakdown[]
  sizeDistribution: CompanySizeDistribution[]
  cacheHitRate: number
}

export function CompanyIntelligencePreview({
  companies,
  industryBreakdown,
  sizeDistribution,
  cacheHitRate,
}: CompanyIntelligencePreviewProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showAllCompanies, setShowAllCompanies] = useState(false)

  // Calculate stats
  const totalCompanies = companies.length
  const freshDataCount = companies.filter(c => c.dataFreshness === 'fresh').length
  const recentDataCount = companies.filter(c => c.dataFreshness === 'recent').length
  const staleDataCount = companies.filter(c => c.dataFreshness === 'stale').length
  const companiesWithFunding = companies.filter(c => c.fundingStage && c.fundingStage !== 'Unknown').length

  // Funding stage breakdown
  const fundingStages = companies.reduce((acc, c) => {
    const stage = c.fundingStage || 'Unknown'
    acc[stage] = (acc[stage] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const displayedCompanies = showAllCompanies ? companies : companies.slice(0, 5)

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-semibold text-white">Company Intelligence Preview</h3>
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
              <div className="text-2xl font-bold text-emerald-400">{totalCompanies}</div>
              <div className="text-xs text-slate-400 mt-1">Companies Enriched</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className="text-2xl font-bold text-green-400">{Math.round(cacheHitRate)}%</div>
              <div className="text-xs text-slate-400 mt-1">Cache Hit Rate</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className="text-2xl font-bold text-blue-400">{freshDataCount}</div>
              <div className="text-xs text-slate-400 mt-1">Fresh Data (&lt;7 days)</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className="text-2xl font-bold text-purple-400">{companiesWithFunding}</div>
              <div className="text-xs text-slate-400 mt-1">With Funding Data</div>
            </div>
          </div>

          {/* Data Freshness Indicator */}
          <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-300">Data Freshness Distribution</span>
              <span className="text-xs text-slate-400">{totalCompanies} total</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-green-400 h-2 rounded-full transition-all"
                    style={{ width: `${(freshDataCount / totalCompanies) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400 w-20">Fresh: {freshDataCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full transition-all"
                    style={{ width: `${(recentDataCount / totalCompanies) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400 w-20">Recent: {recentDataCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-red-400 h-2 rounded-full transition-all"
                    style={{ width: `${(staleDataCount / totalCompanies) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400 w-20">Stale: {staleDataCount}</span>
              </div>
            </div>
          </div>

          {/* Industry Breakdown */}
          {industryBreakdown.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Industry Distribution
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {industryBreakdown.slice(0, 6).map((ind) => (
                  <div
                    key={ind.industry}
                    className="p-3 rounded-lg bg-slate-800/30 border border-slate-700"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white">{ind.industry}</span>
                      <span className="text-sm font-bold text-emerald-400">{ind.count}</span>
                    </div>
                    <div className="text-xs text-slate-400">
                      {Math.round((ind.count / totalCompanies) * 100)}% of total
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Company Size Distribution */}
          {sizeDistribution.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                Company Size Distribution
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {sizeDistribution.map((size) => (
                  <div
                    key={size.sizeRange}
                    className="p-3 rounded-lg bg-slate-800/30 border border-slate-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white">{size.sizeRange}</span>
                      <span className="text-sm font-bold text-emerald-400">{size.count}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-emerald-400 h-2 rounded-full transition-all"
                        style={{ width: `${size.percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{size.percentage}% of total</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Funding Stages */}
          {Object.keys(fundingStages).length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Funding Stages
              </h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(fundingStages).map(([stage, count]) => (
                  <div
                    key={stage}
                    className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-1.5"
                  >
                    <span>{stage}</span>
                    <span className="text-emerald-400 font-bold">×{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Companies List */}
          {companies.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  Enriched Companies
                </h4>
                {companies.length > 5 && (
                  <button
                    onClick={() => setShowAllCompanies(!showAllCompanies)}
                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    {showAllCompanies ? (
                      <>
                        <EyeOff className="w-3 h-3" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3" />
                        Show All ({companies.length})
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
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{company.companyName}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              company.dataFreshness === 'fresh'
                                ? 'bg-green-500/10 border border-green-500/30 text-green-300'
                                : company.dataFreshness === 'recent'
                                ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-300'
                                : 'bg-red-500/10 border border-red-500/30 text-red-300'
                            }`}
                          >
                            {company.dataFreshness}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {company.industry} · {company.location}
                        </div>
                      </div>
                      <div className="text-xs text-slate-500">
                        {company.recipientCount} recipient{company.recipientCount !== 1 ? 's' : ''}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-300">{company.companySize}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-300">{company.fundingStage}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-300">Founded {company.foundedYear}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-300">{company.revenue}</span>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-700">
                      <div className="text-xs text-slate-400">
                        Last updated: {company.lastUpdated}
                      </div>
                    </div>
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
