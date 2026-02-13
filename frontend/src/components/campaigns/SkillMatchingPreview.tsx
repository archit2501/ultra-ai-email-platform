'use client'

import { useState } from 'react'
import { Eye, EyeOff, Target, TrendingUp, Award, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface SkillMatchData {
  recipientName: string
  recipientEmail: string
  matchPercentage: number
  matchedSkills: string[]
  missingSkills: string[]
  category: string
}

export interface SkillCategoryBreakdown {
  category: string
  count: number
  avgMatch: number
}

interface SkillMatchingPreviewProps {
  skillMatches: SkillMatchData[]
  categoryBreakdown: SkillCategoryBreakdown[]
  overallCoveragePercentage: number
}

export function SkillMatchingPreview({
  skillMatches,
  categoryBreakdown,
  overallCoveragePercentage,
}: SkillMatchingPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showAllRecipients, setShowAllRecipients] = useState(false)

  // Calculate stats
  const topMatches = [...skillMatches].sort((a, b) => b.matchPercentage - a.matchPercentage).slice(0, 5)
  const avgMatchPercentage = skillMatches.length > 0
    ? Math.round(skillMatches.reduce((sum, m) => sum + m.matchPercentage, 0) / skillMatches.length)
    : 0
  const highMatchCount = skillMatches.filter(m => m.matchPercentage >= 70).length
  const mediumMatchCount = skillMatches.filter(m => m.matchPercentage >= 40 && m.matchPercentage < 70).length
  const lowMatchCount = skillMatches.filter(m => m.matchPercentage < 40).length

  // Get most common matched skills
  const allMatchedSkills = skillMatches.flatMap(m => m.matchedSkills)
  const skillCounts = allMatchedSkills.reduce((acc, skill) => {
    acc[skill] = (acc[skill] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const topSkills = Object.entries(skillCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([skill, count]) => ({ skill, count }))

  const displayedRecipients = showAllRecipients ? topMatches : topMatches.slice(0, 3)

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Skill Matching Preview</h3>
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
              <div className="text-2xl font-bold text-purple-400">{avgMatchPercentage}%</div>
              <div className="text-xs text-slate-400 mt-1">Avg Match</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className="text-2xl font-bold text-green-400">{highMatchCount}</div>
              <div className="text-xs text-slate-400 mt-1">High Match (≥70%)</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className="text-2xl font-bold text-yellow-400">{mediumMatchCount}</div>
              <div className="text-xs text-slate-400 mt-1">Medium (40-69%)</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className="text-2xl font-bold text-red-400">{lowMatchCount}</div>
              <div className="text-xs text-slate-400 mt-1">Low Match (&lt;40%)</div>
            </div>
          </div>

          {/* Overall Coverage */}
          <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-300">Skills Coverage</span>
              <span className="text-lg font-bold text-purple-400">{overallCoveragePercentage}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-purple-400 h-2 rounded-full transition-all"
                style={{ width: `${overallCoveragePercentage}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Percentage of job requirements covered by recipient pool
            </p>
          </div>

          {/* Category Breakdown */}
          {categoryBreakdown.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-400" />
                Skill Categories Breakdown
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {categoryBreakdown.map((cat) => (
                  <div
                    key={cat.category}
                    className="p-3 rounded-lg bg-slate-800/30 border border-slate-700 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-medium text-white">{cat.category}</div>
                      <div className="text-xs text-slate-400">{cat.count} recipients</div>
                    </div>
                    <div className="text-lg font-bold text-purple-400">{cat.avgMatch}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Most Common Matched Skills */}
          {topSkills.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                Most Common Matched Skills
              </h4>
              <div className="flex flex-wrap gap-2">
                {topSkills.map(({ skill, count }) => (
                  <div
                    key={skill}
                    className="px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-medium flex items-center gap-1.5"
                  >
                    <span>{skill}</span>
                    <span className="text-purple-400 font-bold">×{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Matched Recipients */}
          {topMatches.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-400" />
                  Top Matched Recipients
                </h4>
                {topMatches.length > 3 && (
                  <button
                    onClick={() => setShowAllRecipients(!showAllRecipients)}
                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    {showAllRecipients ? (
                      <>
                        <EyeOff className="w-3 h-3" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3" />
                        Show All ({topMatches.length})
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {displayedRecipients.map((match, idx) => (
                  <div
                    key={match.recipientEmail}
                    className="p-3 rounded-lg bg-slate-800/30 border border-slate-700"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{match.recipientName}</span>
                          <span className="text-xs text-slate-500">{match.recipientEmail}</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">{match.category}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-lg font-bold ${
                            match.matchPercentage >= 70
                              ? 'text-green-400'
                              : match.matchPercentage >= 40
                              ? 'text-yellow-400'
                              : 'text-red-400'
                          }`}
                        >
                          {match.matchPercentage}%
                        </span>
                      </div>
                    </div>

                    {/* Match Progress Bar */}
                    <div className="w-full bg-slate-700 rounded-full h-1.5 mb-2">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          match.matchPercentage >= 70
                            ? 'bg-green-400'
                            : match.matchPercentage >= 40
                            ? 'bg-yellow-400'
                            : 'bg-red-400'
                        }`}
                        style={{ width: `${match.matchPercentage}%` }}
                      />
                    </div>

                    {/* Matched Skills */}
                    {match.matchedSkills.length > 0 && (
                      <div className="mb-2">
                        <div className="text-xs text-slate-400 mb-1">Matched Skills:</div>
                        <div className="flex flex-wrap gap-1">
                          {match.matchedSkills.slice(0, 6).map((skill) => (
                            <span
                              key={skill}
                              className="px-2 py-0.5 rounded bg-green-500/10 border border-green-500/30 text-green-300 text-xs"
                            >
                              {skill}
                            </span>
                          ))}
                          {match.matchedSkills.length > 6 && (
                            <span className="px-2 py-0.5 text-xs text-slate-400">
                              +{match.matchedSkills.length - 6} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Missing Skills */}
                    {match.missingSkills.length > 0 && (
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Growth Areas:</div>
                        <div className="flex flex-wrap gap-1">
                          {match.missingSkills.slice(0, 4).map((skill) => (
                            <span
                              key={skill}
                              className="px-2 py-0.5 rounded bg-slate-700/50 border border-slate-600 text-slate-400 text-xs"
                            >
                              {skill}
                            </span>
                          ))}
                          {match.missingSkills.length > 4 && (
                            <span className="px-2 py-0.5 text-xs text-slate-400">
                              +{match.missingSkills.length - 4} more
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
