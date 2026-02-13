'use client'

import { useState } from 'react'
import { Users, Eye, EyeOff, Briefcase, GraduationCap, Link as LinkIcon, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react'

export interface PersonEducationBackground {
  institution: string
  degree: string
  field: string
}

export interface PersonSocialProfile {
  platform: string
  profileUrl: string
  verifiedBadge: boolean
}

export interface PersonIntelligenceData {
  recipientName: string
  recipientEmail: string
  currentTitle: string
  titleAccuracyScore: number
  seniorityLevel: 'Entry' | 'Mid' | 'Senior' | 'Lead' | 'Executive'
  yearsExperience: number
  education: PersonEducationBackground[]
  socialProfiles: PersonSocialProfile[]
  profileCompleteness: number
  lastProfileUpdate: string
}

interface PersonIntelligencePreviewProps {
  personData: PersonIntelligenceData[]
}

export function PersonIntelligencePreview({ personData }: PersonIntelligencePreviewProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showAllRecipients, setShowAllRecipients] = useState(false)

  // Calculate stats
  const totalRecipients = personData.length
  const seniorityDistribution = personData.reduce((acc, p) => {
    acc[p.seniorityLevel] = (acc[p.seniorityLevel] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const avgTitleAccuracy = totalRecipients > 0
    ? Math.round(personData.reduce((sum, p) => sum + p.titleAccuracyScore, 0) / totalRecipients)
    : 0

  const avgYearsExperience = totalRecipients > 0
    ? Math.round(personData.reduce((sum, p) => sum + p.yearsExperience, 0) / totalRecipients)
    : 0

  const recipientsWithEducation = personData.filter(p => p.education.length > 0).length
  const recipientsWithSocialProfiles = personData.filter(p => p.socialProfiles.length > 0).length
  const totalSocialLinks = personData.reduce((sum, p) => sum + p.socialProfiles.length, 0)

  const topRecipients = [...personData]
    .sort((a, b) => b.titleAccuracyScore - a.titleAccuracyScore)
    .slice(0, 5)

  const displayedRecipients = showAllRecipients ? topRecipients : topRecipients.slice(0, 3)

  const getSeniorityColor = (level: string) => {
    switch (level) {
      case 'Executive':
        return 'bg-red-500/10 border border-red-500/30 text-red-300'
      case 'Lead':
        return 'bg-purple-500/10 border border-purple-500/30 text-purple-300'
      case 'Senior':
        return 'bg-blue-500/10 border border-blue-500/30 text-blue-300'
      case 'Mid':
        return 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-300'
      default:
        return 'bg-green-500/10 border border-green-500/30 text-green-300'
    }
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Briefcase className="w-5 h-5 text-orange-400" />
          <h3 className="text-lg font-semibold text-white">Person Intelligence Preview</h3>
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
              <div className="text-2xl font-bold text-orange-400">{totalRecipients}</div>
              <div className="text-xs text-slate-400 mt-1">People Enriched</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className="text-2xl font-bold text-green-400">{avgTitleAccuracy}%</div>
              <div className="text-xs text-slate-400 mt-1">Avg Title Accuracy</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className="text-2xl font-bold text-blue-400">{avgYearsExperience}</div>
              <div className="text-xs text-slate-400 mt-1">Avg Years Experience</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className="text-2xl font-bold text-purple-400">{totalSocialLinks}</div>
              <div className="text-xs text-slate-400 mt-1">Social Profile Links</div>
            </div>
          </div>

          {/* Seniority Distribution */}
          <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-orange-400" />
              <h4 className="text-sm font-semibold text-slate-300">Seniority Level Distribution</h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {['Entry', 'Mid', 'Senior', 'Lead', 'Executive'].map((level) => {
                const count = seniorityDistribution[level] || 0
                const percentage = totalRecipients > 0 ? Math.round((count / totalRecipients) * 100) : 0
                return (
                  <div key={level} className="flex items-center justify-between">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getSeniorityColor(level)}`}>
                      {level}
                    </span>
                    <div className="flex items-center gap-2 flex-1 ml-2">
                      <div className="flex-1 bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-orange-400 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 w-12 text-right">{count} ({percentage}%)</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Education & Social Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-white">Education Data</span>
              </div>
              <div className="text-2xl font-bold text-blue-400">{recipientsWithEducation}</div>
              <div className="text-xs text-slate-400 mt-1">
                {Math.round((recipientsWithEducation / totalRecipients) * 100)}% with education records
              </div>
            </div>
            <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <LinkIcon className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-semibold text-white">Social Profiles</span>
              </div>
              <div className="text-2xl font-bold text-purple-400">{recipientsWithSocialProfiles}</div>
              <div className="text-xs text-slate-400 mt-1">
                {Math.round((recipientsWithSocialProfiles / totalRecipients) * 100)}% with profiles verified
              </div>
            </div>
          </div>

          {/* Top Enriched Profiles */}
          {topRecipients.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Users className="w-4 h-4 text-orange-400" />
                  Most Enriched Profiles
                </h4>
                {topRecipients.length > 3 && (
                  <button
                    onClick={() => setShowAllRecipients(!showAllRecipients)}
                    className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1"
                  >
                    {showAllRecipients ? (
                      <>
                        <EyeOff className="w-3 h-3" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3" />
                        Show All ({topRecipients.length})
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {displayedRecipients.map((person) => (
                  <div
                    key={person.recipientEmail}
                    className="p-4 rounded-lg bg-slate-800/30 border border-slate-700 space-y-3"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{person.recipientName}</span>
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getSeniorityColor(
                              person.seniorityLevel
                            )}`}
                          >
                            {person.seniorityLevel}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">{person.recipientEmail}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-orange-400">{person.titleAccuracyScore}%</div>
                        <div className="text-xs text-slate-400">Title Accuracy</div>
                      </div>
                    </div>

                    {/* Current Title */}
                    <div>
                      <div className="text-xs text-slate-400 mb-1">Current Title</div>
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-orange-400" />
                        <span className="text-sm text-white">{person.currentTitle}</span>
                        <span className="text-xs text-slate-500">·</span>
                        <span className="text-xs text-slate-400">{person.yearsExperience} years</span>
                      </div>
                    </div>

                    {/* Title Accuracy Bar */}
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          person.titleAccuracyScore >= 80
                            ? 'bg-green-400'
                            : person.titleAccuracyScore >= 60
                            ? 'bg-yellow-400'
                            : 'bg-red-400'
                        }`}
                        style={{ width: `${person.titleAccuracyScore}%` }}
                      />
                    </div>

                    {/* Education */}
                    {person.education.length > 0 && (
                      <div>
                        <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                          <GraduationCap className="w-3 h-3" />
                          Education Background
                        </div>
                        <div className="space-y-1">
                          {person.education.slice(0, 2).map((edu, idx) => (
                            <div
                              key={idx}
                              className="px-2.5 py-1.5 rounded bg-slate-700/50 border border-slate-600"
                            >
                              <div className="text-xs font-medium text-white">{edu.degree}</div>
                              <div className="text-xs text-slate-400">
                                {edu.field} • {edu.institution}
                              </div>
                            </div>
                          ))}
                          {person.education.length > 2 && (
                            <div className="text-xs text-slate-400 px-2.5 py-1">
                              +{person.education.length - 2} more education records
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Social Profiles */}
                    {person.socialProfiles.length > 0 && (
                      <div>
                        <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                          <LinkIcon className="w-3 h-3" />
                          Social Profiles ({person.socialProfiles.length})
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {person.socialProfiles.map((profile, idx) => (
                            <a
                              key={idx}
                              href={profile.profileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-medium hover:bg-blue-500/20 transition-colors flex items-center gap-1"
                            >
                              <span>{profile.platform}</span>
                              {profile.verifiedBadge && (
                                <span className="text-blue-400 font-bold">✓</span>
                              )}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Profile Completeness */}
                    <div className="pt-2 border-t border-slate-700">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-400">Profile Completeness</span>
                        <span className="text-xs font-bold text-orange-400">{person.profileCompleteness}%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-1.5">
                        <div
                          className="bg-orange-400 h-1.5 rounded-full transition-all"
                          style={{ width: `${person.profileCompleteness}%` }}
                        />
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Last updated: {person.lastProfileUpdate}
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
