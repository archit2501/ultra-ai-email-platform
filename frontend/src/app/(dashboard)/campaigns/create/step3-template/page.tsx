'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCampaignDraft } from '@/hooks/useCampaignDraft'
import apiClient from '@/lib/api'
import { toast } from 'sonner'
import { 
  ArrowLeft, Store, BookOpen, Sparkles, PenTool, Eye, 
  Filter, Search, Star, TrendingUp, Clock, Globe, 
  Briefcase, Mail, Edit, Trash2, Copy, Check, X,
  ChevronDown, ChevronUp, Zap, MessageSquare, Target,
  Brain, DollarSign, Send
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { syncDraftToList } from '@/utils/draftCampaigns'
import { TemplateMarketplaceModal, MarketplaceTemplate } from '@/components/campaigns/TemplateMarketplaceModal'
import { TemplateVersionHistory, TemplateVersion } from '@/components/campaigns/TemplateVersionHistory'
import { TemplateAnalytics, TemplateAnalyticsData } from '@/components/campaigns/TemplateAnalytics'

type TemplateSource = 'marketplace' | 'my_templates' | 'ai_generate' | 'create_new'
type EmailTone = 'professional' | 'enthusiastic' | 'story_driven' | 'value_first' | 'consultant'

interface TemplatePreview {
  id: number | string
  subject: string
  body: string
  tone?: EmailTone
  personalizationScore?: number
}

export default function Step3Page() {
  const router = useRouter()
  const { draft, updateDraft, updateStep3, setStep } = useCampaignDraft()
  const [campaignName, setCampaignName] = useState('')
  
  // Template source selection
  const [templateSource, setTemplateSource] = useState<TemplateSource | null>(null)
  
  // Marketplace and Versioning
  const [showMarketplace, setShowMarketplace] = useState(false)
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [marketplaceTemplates] = useState<MarketplaceTemplate[]>(generateMarketplaceTemplates())
  
  // Template preview
  const [selectedTemplate, setSelectedTemplate] = useState<TemplatePreview | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [templateAnalytics, setTemplateAnalytics] = useState<TemplateAnalyticsData | null>(null)

  // AI Generate - Multi-tone variations
  const [aiGenerating, setAiGenerating] = useState(false)
  const [toneVariations, setToneVariations] = useState<Record<EmailTone, TemplatePreview>>({} as any)
  const [selectedTone, setSelectedTone] = useState<EmailTone | null>(null)

  // Initialize from draft
  useEffect(() => {
    if (draft.campaignName) {
      setCampaignName(draft.campaignName)
    }
    if (draft.step3.templateSource) {
      setTemplateSource(draft.step3.templateSource)
    }
    if (draft.step3.selectedTone) {
      setSelectedTone(draft.step3.selectedTone as EmailTone)
    }
  }, [draft])

  // Sync draft
  useEffect(() => {
    if (draft.id && draft.createdAt) {
      syncDraftToList(draft)
    }
  }, [draft])

  // Save to draft
  useEffect(() => {
    if (templateSource || selectedTone) {
      updateStep3({
        templateSource: templateSource || undefined,
        selectedTone: selectedTone || undefined,
      })
    }
  }, [templateSource, selectedTone, updateStep3])

  const handleBack = () => {
    setStep(2)
    router.push('/campaigns/create/step2-enrich')
  }

  const handleNext = () => {
    if (!selectedTemplate) {
      alert('Please select or generate a template')
      return
    }
    setStep(4)
    router.push('/campaigns/create/step4-send')
  }

  // Calculate template match score based on enriched data
  const calculateTemplateMatchScore = (template: TemplatePreview): number => {
    let score = 50 // Base score
    const enrichedData = draft.step2.enrichedData || {}
    const enrichmentCount = Object.keys(enrichedData).length
    
    if (enrichmentCount === 0) {
      return 65 // Default score when no enrichment data
    }

    // Check template subject and body for personalization variables
    const templateText = `${template.subject} ${template.body}`.toLowerCase()
    
    // +10 points if enrichment has company data and template uses company vars
    const hasCompanyVars = /\{company|company_name|company_size\}/i.test(templateText)
    const hasCompanyData = Object.values(enrichedData).some((d: any) => d.company_name)
    if (hasCompanyVars && hasCompanyData) score += 10

    // +10 points if enrichment has role data and template uses role vars
    const hasRoleVars = /\{role|job_title|position\}/i.test(templateText)
    const hasRoleData = Object.values(enrichedData).some((d: any) => d.job_title)
    if (hasRoleVars && hasRoleData) score += 10

    // +10 points if enrichment has industry data and template uses industry vars
    const hasIndustryVars = /\{industry\}/i.test(templateText)
    const hasIndustryData = Object.values(enrichedData).some((d: any) => d.industry)
    if (hasIndustryVars && hasIndustryData) score += 10

    // +5 points if enrichment has tech stack and template mentions technology
    const hasTechVars = /\{tech_stack|technologies\}/i.test(templateText) || 
                         /technology|software|tools|platforms/i.test(templateText)
    const hasTechData = Object.values(enrichedData).some((d: any) => d.tech_stack)
    if (hasTechVars && hasTechData) score += 5

    // +5 points if enrichment has LinkedIn and template mentions social/professional network
    const hasLinkedInVars = /linkedin|professional network/i.test(templateText)
    const hasLinkedInData = Object.values(enrichedData).some((d: any) => d.linkedin_url)
    if (hasLinkedInVars && hasLinkedInData) score += 5

    // +10 points for tone matching based on seniority (if data available)
    const avgSeniority = Object.values(enrichedData)
      .filter((d: any) => d.seniority_level)
      .map((d: any) => {
        const seniority = d.seniority_level.toLowerCase()
        if (seniority.includes('director') || seniority.includes('vp') || seniority.includes('c-level')) return 3
        if (seniority.includes('manager') || seniority.includes('lead')) return 2
        return 1
      })
      .reduce((sum, val, _, arr) => sum + val / arr.length, 0)

    if (avgSeniority > 2.5 && template.tone === 'professional') score += 10
    if (avgSeniority < 1.5 && template.tone === 'enthusiastic') score += 10

    return Math.min(score, 95) // Cap at 95%
  }

  // Replace template variables with enriched data
  const replaceTemplateVariables = (text: string, recipientId?: number): string => {
    if (!recipientId || !draft.step2.enrichedData) return text

    const enrichedData = draft.step2.enrichedData[recipientId]
    if (!enrichedData) return text

    let result = text

    // Replace common variables with enriched data
    const replacements: Record<string, string> = {
      '{company_name}': enrichedData.company_name || '',
      '{company}': enrichedData.company_name || '',
      '{job_title}': enrichedData.job_title || '',
      '{role}': enrichedData.job_title || '',
      '{position}': enrichedData.job_title || '',
      '{industry}': enrichedData.industry || '',
      '{company_size}': enrichedData.company_size || '',
      '{linkedin_url}': enrichedData.linkedin_url || '',
      '{phone_number}': enrichedData.phone_number || '',
      '{phone}': enrichedData.phone_number || '',
    }

    // Handle tech stack (array)
    if (enrichedData.tech_stack && Array.isArray(enrichedData.tech_stack)) {
      replacements['{tech_stack}'] = enrichedData.tech_stack.slice(0, 5).join(', ')
      replacements['{technologies}'] = enrichedData.tech_stack.slice(0, 3).join(', ')
    }

    // Apply replacements
    Object.entries(replacements).forEach(([variable, value]) => {
      if (value) {
        result = result.replace(new RegExp(variable, 'gi'), value)
      }
    })

    return result
  }

  const handleSelectMarketplaceTemplate = (template: MarketplaceTemplate) => {
    const matchScore = calculateTemplateMatchScore({
      id: template.id,
      subject: template.preview.subject,
      body: template.preview.body,
      tone: undefined
    })
    
    setSelectedTemplate({
      id: template.id,
      subject: template.preview.subject,
      body: template.preview.body,
      personalizationScore: matchScore,
    })
    setShowMarketplace(false)
    toast.success(`Template "${template.name}" selected (${matchScore}% match)`)
  }

  const handleRevertVersion = (version: TemplateVersion) => {
    setSelectedTemplate({
      id: `v${version.version}`,
      subject: version.subject,
      body: version.body,
      personalizationScore: 85,
    })
    setShowVersionHistory(false)
    toast.success(`Reverted to version ${version.version}`)
  }

  const isJobSeeker = draft.goal === 'jobs'
  const recipientCount = draft.step1.recipientCount || 0
  const primaryRecipientId = (draft.step1.recipients && (draft.step1.recipients as any[])[0]?.id) || undefined

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/70 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="flex items-center gap-2 text-slate-200 hover:text-white hover:bg-slate-800/60"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <label className="block text-xs text-slate-400 mb-2">Campaign Name</label>
              <Input
                placeholder="Enter campaign name (e.g., Q1 2026 Outreach)"
                value={campaignName}
                onChange={(e) => {
                  const value = e.target.value
                  setCampaignName(value)
                  updateDraft({ campaignName: value || undefined })
                }}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 mb-3"
              />
              <div>
                <h1 className="text-3xl font-bold text-white">Create Campaign</h1>
                <p className="text-slate-400 mt-1">Step 3 of 4: Choose Template</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-slate-900/60 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-3">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                    step === 3
                      ? 'bg-blue-600 text-white shadow-[0_0_0_4px_rgba(59,130,246,0.2)]'
                      : step < 3
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {step}
                </div>
                {step < 4 && (
                  <div className="flex-1 h-1 mx-2 bg-slate-800 rounded-full" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Campaign Summary */}
          <div className="p-6 rounded-lg border-2 border-slate-800 bg-slate-900">
            <h3 className="text-lg font-semibold text-white mb-2">Campaign Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-slate-400">Recipients</p>
                <p className="text-white font-semibold">{recipientCount}</p>
              </div>
              <div>
                <p className="text-slate-400">Goal</p>
                <p className="text-white font-semibold capitalize">{draft.goal || 'Not set'}</p>
              </div>
              <div>
                <p className="text-slate-400">Source</p>
                <p className="text-white font-semibold capitalize">{draft.step1.source?.replace('_', ' ') || 'Not set'}</p>
              </div>
              <div>
                <p className="text-slate-400">Enrichment</p>
                <p className="text-white font-semibold capitalize">{draft.step2.enrichmentDepth || 'Standard'}</p>
              </div>
            </div>
          </div>

          {/* Template Source Selection */}
          {!templateSource && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold mb-2 text-white">Choose Template Source</h2>
                <p className="text-slate-400">
                  {isJobSeeker 
                    ? "How would you like to create your job application emails?"
                    : "How would you like to create your outreach emails?"
                  }
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Marketplace */}
                <button
                  onClick={() => setShowMarketplace(true)}
                  className="p-6 rounded-lg border-2 border-slate-800 bg-slate-900 hover:border-blue-500 hover:bg-slate-800 transition-all text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400">
                      <Store className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-2">Template Marketplace</h3>
                      <p className="text-sm text-slate-300 mb-3">
                        Browse 500+ proven templates by category, industry, and rating
                      </p>
                      <ul className="text-xs text-slate-400 space-y-1">
                        <li>✓ Community-tested templates</li>
                        <li>✓ Filter by category, tone & language</li>
                        <li>✓ See ratings & performance metrics</li>
                      </ul>
                    </div>
                  </div>
                </button>

                {/* My Templates */}
                <button
                  onClick={() => setTemplateSource('my_templates')}
                  className="p-6 rounded-lg border-2 border-slate-800 bg-slate-900 hover:border-blue-500 hover:bg-slate-800 transition-all text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-2">My Templates</h3>
                      <p className="text-sm text-slate-300 mb-3">
                        Use your saved templates from previous campaigns
                      </p>
                      <ul className="text-xs text-slate-400 space-y-1">
                        <li>✓ Your personal library</li>
                        <li>✓ Quick access to favorites</li>
                        <li>✓ Edit and reuse</li>
                      </ul>
                    </div>
                  </div>
                </button>

                {/* AI Generate */}
                <button
                  onClick={() => setTemplateSource('ai_generate')}
                  className="p-6 rounded-lg border-2 border-amber-600/30 bg-gradient-to-br from-amber-900/20 to-slate-900 hover:border-amber-500 hover:from-amber-900/30 transition-all text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-amber-500/20 text-amber-400">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-white">AI Generate (Multi-Tone)</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-600/20 text-amber-400 font-semibold">RECOMMENDED</span>
                      </div>
                      <p className="text-sm text-slate-300 mb-3">
                        AI generates 5 personalized variations in different tones
                      </p>
                      <ul className="text-xs text-slate-400 space-y-1">
                        <li>✓ Uses Step 2 enrichment data</li>
                        <li>✓ 5 tones: Professional, Enthusiastic, Story-Driven, Value-First, Consultant</li>
                        <li>✓ 40%+ response rate potential</li>
                      </ul>
                    </div>
                  </div>
                </button>

                {/* Create New */}
                <button
                  onClick={() => setTemplateSource('create_new')}
                  className="p-6 rounded-lg border-2 border-slate-800 bg-slate-900 hover:border-blue-500 hover:bg-slate-800 transition-all text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-green-500/10 text-green-400">
                      <PenTool className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-2">Create New</h3>
                      <p className="text-sm text-slate-300 mb-3">
                        Write your own template from scratch with variables
                      </p>
                      <ul className="text-xs text-slate-400 space-y-1">
                        <li>✓ Full creative control</li>
                        <li>✓ Variable insertion</li>
                        <li>✓ Save for future use</li>
                      </ul>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Template Source Components */}
          {templateSource === 'marketplace' && (
            <MarketplaceTemplates
              isJobSeeker={isJobSeeker}
              onSelect={(template: TemplatePreview) => {
                setSelectedTemplate(template)
                setShowPreview(true)
                const analytics = generateTemplateAnalytics(template.id, 'Selected Template')
                setTemplateAnalytics(analytics)
                if (primaryRecipientId) {
                  updateStep3({
                    templateSource: 'marketplace',
                    templateId: typeof template.id === 'number' ? template.id : undefined,
                    preview: { ...(draft.step3.preview || {}), [primaryRecipientId]: template.body },
                  })
                } else {
                  updateStep3({ templateSource: 'marketplace', templateId: typeof template.id === 'number' ? template.id : undefined })
                }
              }}
              onBack={() => setTemplateSource(null)}
            />
          )}

          {templateSource === 'my_templates' && (
            <MyTemplates
              isJobSeeker={isJobSeeker}
              onSelect={(template: TemplatePreview) => {
                setSelectedTemplate(template)
                setShowPreview(true)
                const analytics = generateTemplateAnalytics(template.id, 'Selected Template')
                setTemplateAnalytics(analytics)
                if (primaryRecipientId) {
                  updateStep3({
                    templateSource: 'my_templates',
                    templateId: typeof template.id === 'number' ? template.id : undefined,
                    preview: { ...(draft.step3.preview || {}), [primaryRecipientId]: template.body },
                  })
                } else {
                  updateStep3({ templateSource: 'my_templates', templateId: typeof template.id === 'number' ? template.id : undefined })
                }
              }}
              onBack={() => setTemplateSource(null)}
            />
          )}

          {templateSource === 'ai_generate' && (
            <AIGenerate
              isJobSeeker={isJobSeeker}
              recipientCount={recipientCount}
              recipientId={primaryRecipientId}
              onGenerate={(variations: Record<EmailTone, TemplatePreview>) => {
                setToneVariations(variations)
                setAiGenerating(false)
              }}
              onSelectTone={(tone: EmailTone, template: TemplatePreview) => {
                setSelectedTone(tone)
                setSelectedTemplate(template)
                setShowPreview(true)
                const analytics = generateTemplateAnalytics(template.id, `AI Generated - ${tone}`)
                setTemplateAnalytics(analytics)
                if (primaryRecipientId) {
                  updateStep3({
                    templateSource: 'ai_generate',
                    selectedTone: tone,
                    preview: { ...(draft.step3.preview || {}), [primaryRecipientId]: template.body },
                  })
                } else {
                  updateStep3({ templateSource: 'ai_generate', selectedTone: tone })
                }
              }}
              onBack={() => setTemplateSource(null)}
            />
          )}

          {templateSource === 'create_new' && (
            <CreateNew
              isJobSeeker={isJobSeeker}
              onSave={(template: TemplatePreview) => {
                setSelectedTemplate(template)
                setShowPreview(true)
                const analytics = generateTemplateAnalytics(template.id, 'Custom Template')
                setTemplateAnalytics(analytics)
                if (primaryRecipientId) {
                  updateStep3({
                    templateSource: 'create_new',
                    templateId: typeof template.id === 'number' ? template.id : undefined,
                    preview: { ...(draft.step3.preview || {}), [primaryRecipientId]: template.body },
                  })
                } else {
                  updateStep3({ templateSource: 'create_new', templateId: typeof template.id === 'number' ? template.id : undefined })
                }
              }}
              onBack={() => setTemplateSource(null)}
            />
          )}

          {/* Template Analytics (show when template is selected) */}
          {selectedTemplate && templateAnalytics && (
            <div className="space-y-6 pt-8">
              <TemplateAnalytics analytics={templateAnalytics} />
            </div>
          )}

          {/* Navigation (only show if template selected) */}
          {selectedTemplate && (
            <div className="flex gap-4 pt-8 border-t border-slate-800">
              <Button
                onClick={handleBack}
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Back to Step 2
              </Button>
              <Button
                onClick={handleNext}
                className="flex-1 bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Continue to Send Options
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Marketplace Templates Component - Integrated with Modal
function MarketplaceTemplates({ isJobSeeker, onSelect, onBack }: { isJobSeeker: boolean; onSelect: (t: TemplatePreview) => void; onBack: () => void }) {
  const [mockTemplates] = useState<MarketplaceTemplate[]>(generateMarketplaceTemplates())

  const handleSelectTemplate = (template: MarketplaceTemplate) => {
    const selected: TemplatePreview = {
      id: template.id,
      subject: template.preview.subject,
      body: template.preview.body,
      personalizationScore: 75,
    }
    onSelect(selected)
    toast.success(`Template "${template.name}" selected`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Store className="w-6 h-6 text-blue-400" />
            Template Marketplace
          </h2>
          <p className="text-slate-400 mt-1">
            Browse {mockTemplates.length}+ proven templates, searchable by category, tone, and language
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack}>
          <X className="w-4 h-4 mr-2" />
          Change Source
        </Button>
      </div>

      {/* Marketplace Modal with Full Features */}
      <TemplateMarketplaceModal
        isOpen={true}
        onClose={onBack}
        onSelectTemplate={handleSelectTemplate}
        templates={mockTemplates}
      />
    </div>
  )
}

// Helper function to generate marketplace templates
function generateMarketplaceTemplates(): MarketplaceTemplate[] {
  const categories = ['Sales', 'Recruitment', 'Support', 'Business Development', 'Outreach', 'Follow-up']
  const tones = ['Professional', 'Casual', 'Urgent', 'Friendly', 'Formal']
  const languages = ['English', 'Spanish', 'French', 'German']
  const authors = ['John Smith', 'Sarah Johnson', 'Mike Chen', 'Emma Davis']

  const templates: MarketplaceTemplate[] = []
  
  for (let i = 1; i <= 30; i++) {
    templates.push({
      id: i,
      name: `Template ${i}: ${categories[i % categories.length]} - ${tones[i % tones.length]}`,
      description: `A proven ${tones[i % tones.length].toLowerCase()} template for ${categories[i % categories.length].toLowerCase()} campaigns with high open rates`,
      category: categories[i % categories.length],
      tone: tones[i % tones.length],
      language: languages[i % languages.length],
      author: authors[i % authors.length],
      rating: (Math.random() * 2 + 3.5),
      reviewCount: Math.floor(Math.random() * 500 + 50),
      uses: Math.floor(Math.random() * 10000 + 1000),
      isFavorited: false,
      preview: {
        subject: `Subject: Check out this amazing opportunity - Template ${i}`,
        body: `Hi {{recipient_name}},\n\nI came across your profile and was impressed by your work at {{company}}.\n\nI thought you might be interested in [opportunity/collaboration/project].\n\nWould you be open to a quick chat?\n\nBest regards,\nYour Name`,
      },
      tags: ['cold-email', categories[i % categories.length].toLowerCase(), tones[i % tones.length].toLowerCase()],
    })
  }

  return templates
}

function generateTemplateAnalytics(templateId: number | string, templateName: string): TemplateAnalyticsData {
  // Generate realistic performance data
  const totalSent = Math.floor(Math.random() * 1000 + 500)
  const openRate = Math.random() * 45 + 15 // 15-60%
  const opens = Math.floor(totalSent * (openRate / 100))
  const clickRate = (Math.random() * 8 + 2) // 2-10%
  const clicks = Math.floor(opens * (clickRate / 100))
  const replyRate = (Math.random() * 6 + 1) // 1-7%
  const replies = Math.floor(opens * (replyRate / 100))
  const conversionRate = (Math.random() * 4 + 0.5) // 0.5-4.5%
  const conversions = Math.floor(replies * (conversionRate / 100))

  // Generate trend data (14 days of data)
  const performanceTrend = []
  let trendRate = openRate - 10
  for (let i = 0; i < 14; i++) {
    trendRate += (Math.random() - 0.4) * 3 // Random walk
    trendRate = Math.max(5, Math.min(60, trendRate))
    performanceTrend.push({
      date: `Day ${i + 1}`,
      rate: parseFloat(trendRate.toFixed(1)),
    })
  }

  // Generate comparison templates (5 similar templates)
  const similarTemplates = []
  for (let i = 0; i < 5; i++) {
    similarTemplates.push({
      id: Math.random() * 10000,
      name: `Similar Template ${i + 1}`,
      openRate: Math.random() * 45 + 15,
      clickRate: Math.random() * 8 + 2,
      replyRate: Math.random() * 6 + 1,
      conversionRate: Math.random() * 4 + 0.5,
      similarity: Math.floor(Math.random() * 30 + 70), // 70-100% similarity
    })
  }

  return {
    templateId,
    templateName,
    openRate,
    clickRate,
    replyRate,
    conversionRate,
    totalSent,
    opens,
    clicks,
    replies,
    conversions,
    performanceTrend,
    similarTemplates,
  }
}

function MyTemplates({ isJobSeeker, onSelect, onBack }: { isJobSeeker: boolean; onSelect: (t: TemplatePreview) => void; onBack: () => void }) {
  const [loading, setLoading] = useState(false)
  const [templates, setTemplates] = useState<any[]>([])
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMyTemplates()
  }, [])

  const fetchMyTemplates = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await apiClient.get('/email-templates')
      // EmailTemplateListResponse
      const normalized = (data?.items || []).map((tpl: any) => ({
        id: tpl.id,
        name: tpl.name,
        subject: tpl.subject_template,
        body: tpl.body_template_text || tpl.body_template_html || '',
        createdAt: tpl.created_at,
        usedCount: tpl.times_used || 0,
        lastUsed: tpl.last_used_at,
        responseRate: tpl.response_rate || 0,
      }))
      setTemplates(normalized)
    } catch (err: any) {
      console.error('Failed to fetch my templates:', err)
      const message = err?.response?.data?.detail || err?.message || 'Failed to load your templates'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleUse = (template: any) => {
    const used: TemplatePreview = {
      id: template.id,
      subject: template.subject,
      body: template.body,
      personalizationScore: 80
    }
    onSelect(used)
  }

  const handleDelete = async (templateId: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return
    try {
      await apiClient.delete(`/email-templates/${templateId}`)
      setTemplates((prev) => prev.filter((t) => t.id !== templateId))
      toast.success('Template deleted successfully')
    } catch (err: any) {
      console.error('Failed to delete template:', err)
      const message = err?.response?.data?.detail || err?.message || 'Failed to delete template'
      toast.error(message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-purple-400" />
            My Templates
          </h2>
          <p className="text-slate-400 mt-1">
            Your personal template library with performance tracking
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack}>
          <X className="w-4 h-4 mr-2" />
          Change Source
        </Button>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-2 border-slate-700 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading your templates...</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="p-12 text-center text-slate-400 border-2 border-dashed border-slate-800 rounded-lg">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <p className="mb-4">You haven't saved any templates yet</p>
          <Button onClick={onBack} variant="outline" className="border-slate-700 text-slate-300">
            Browse Marketplace
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="p-6 rounded-lg border-2 border-slate-800 bg-slate-900 hover:border-slate-700 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-2">{template.name}</h3>
                  <div className="text-sm">
                    <p className="text-slate-400 mb-1">Subject:</p>
                    <p className="text-white">{template.subject}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
                <div className="p-3 rounded bg-slate-800/50">
                  <p className="text-slate-400 text-xs">Times Used</p>
                  <p className="text-white font-semibold">{template.usedCount}</p>
                </div>
                <div className="p-3 rounded bg-slate-800/50">
                  <p className="text-slate-400 text-xs">Response Rate</p>
                  <p className="text-green-400 font-semibold">{template.responseRate}%</p>
                </div>
                <div className="p-3 rounded bg-slate-800/50">
                  <p className="text-slate-400 text-xs">Created</p>
                  <p className="text-white font-semibold">{new Date(template.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="p-3 rounded bg-slate-800/50">
                  <p className="text-slate-400 text-xs">Last Used</p>
                  <p className="text-white font-semibold">{new Date(template.lastUsed).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setPreviewTemplate(template)}
                  variant="outline"
                  size="sm"
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button
                  onClick={() => handleUse(template)}
                  size="sm"
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Use Template
                </Button>
                <Button
                  onClick={() => handleDelete(template.id)}
                  variant="outline"
                  size="sm"
                  className="border-red-800 text-red-400 hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-slate-900 border-2 border-slate-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900">
              <h3 className="text-xl font-bold text-white">{previewTemplate.name}</h3>
              <Button variant="ghost" size="sm" onClick={() => setPreviewTemplate(null)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wide">Subject</label>
                <p className="text-white font-semibold mt-1">
                  {previewTemplate.subject}
                </p>
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wide">Body (Personalized Preview)</label>
                <div className="mt-2 p-4 bg-slate-800/50 rounded-lg text-sm text-slate-300 whitespace-pre-wrap">
                  {previewTemplate.body}
                </div>
                <p className="text-xs text-green-400 mt-2">
                  ✓ Personalized template available
                </p>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => {
                    handleUse(previewTemplate)
                    setPreviewTemplate(null)
                  }}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Use This Template
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AIGenerate({ isJobSeeker, recipientCount, recipientId, onGenerate, onSelectTone, onBack }: { isJobSeeker: boolean; recipientCount: number; recipientId?: number; onGenerate: (v: Record<EmailTone, TemplatePreview>) => void; onSelectTone: (tone: EmailTone, t: TemplatePreview) => void; onBack: () => void }) {
  const [generating, setGenerating] = useState(false)
  const [variations, setVariations] = useState<Record<EmailTone, TemplatePreview> | null>(null)
  const [selectedToneLocal, setSelectedToneLocal] = useState<EmailTone | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [inputPrompt, setInputPrompt] = useState('')

  const toneConfig: Record<EmailTone, { icon: any; color: string; label: string; description: string }> = {
    professional: {
      icon: Briefcase,
      color: 'blue',
      label: 'Professional',
      description: 'Formal, direct, business-focused language'
    },
    enthusiastic: {
      icon: Zap,
      color: 'amber',
      label: 'Enthusiastic',
      description: 'Energetic, positive, passionate tone'
    },
    story_driven: {
      icon: MessageSquare,
      color: 'purple',
      label: 'Story-Driven',
      description: 'Narrative approach with personal anecdotes'
    },
    value_first: {
      icon: Target,
      color: 'green',
      label: 'Value-First',
      description: 'Lead with benefits and ROI'
    },
    consultant: {
      icon: Brain,
      color: 'cyan',
      label: 'Consultant',
      description: 'Advisory, insightful, problem-solving'
    }
  }

  const handleGenerate = async () => {
    if (!recipientId) {
      const message = 'No recipient selected in Step 1. Please add recipients first.'
      setError(message)
      toast.error(message)
      return
    }

    setGenerating(true)
    setError(null)

    try {
      const { data } = await apiClient.post(`/recipients/${recipientId}/generate-emails`, {})
      // API returns { email_variations: [ { subject, body, tone, personalization_score, estimated_response_rate, matched_skills } ] }
      const variationsMap: Record<EmailTone, TemplatePreview> = {} as any
      const list = data?.email_variations || []
      list.forEach((draft: any) => {
        const tone = (draft.tone as EmailTone) || 'professional'
        const scoreRaw = draft.personalization_score || (draft.personalization_level ? draft.personalization_level * 100 : null)
        const score = typeof scoreRaw === 'number' ? Math.round(scoreRaw) : 80
        variationsMap[tone] = {
          id: `${tone}-${draft.subject}`,
          subject: draft.subject,
          body: draft.body,
          tone,
          personalizationScore: score,
        }
      })

      setVariations(variationsMap)
      onGenerate(variationsMap)
      toast.success('5 tone variations generated successfully!')
    } catch (err: any) {
      const message = err?.response?.data?.detail || err?.message || 'Failed to generate variations'
      setError(message)
      toast.error(message)
    } finally {
      setGenerating(false)
    }
  }

  const handleSelectTone = (tone: EmailTone) => {
    if (!variations) return
    setSelectedToneLocal(tone)
    onSelectTone(tone, variations[tone])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-400" />
            AI Generate - Multi-Tone Variations
          </h2>
          <p className="text-slate-400 mt-1">
            {isJobSeeker 
              ? "AI will generate 5 personalized job application emails in different tones"
              : "AI will generate 5 personalized outreach emails in different tones"
            }
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack}>
          <X className="w-4 h-4 mr-2" />
          Change Source
        </Button>
      </div>

      {/* Input Section */}
      {!variations && (
        <div className="p-6 rounded-lg border-2 border-slate-800 bg-slate-900 space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Additional Context (Optional)
            </label>
            <textarea
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder={isJobSeeker 
                ? "e.g., Emphasize my React expertise, mention I'm available immediately..."
                : "e.g., Focus on our AI capabilities, mention recent Series A funding..."
              }
              rows={4}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
            />
            <p className="text-xs text-slate-500 mt-2">
              AI will use enrichment data from Step 2 plus any additional context you provide
            </p>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold py-4"
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Generating 5 tone variations...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate All 5 Tone Variations
              </>
            )}
          </Button>

          {error && (
            <div className="p-4 rounded-lg bg-red-900/20 border border-red-800 text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Variations Display */}
      {variations && (
        <div className="space-y-6">
          {/* Success Banner */}
          <div className="p-4 rounded-lg bg-green-900/20 border border-green-800 text-green-400 text-sm flex items-center gap-3">
            <Check className="w-5 h-5" />
            <div>
              <p className="font-semibold">5 variations generated successfully!</p>
              <p className="text-green-500/80">Compare tones below and select your favorite</p>
            </div>
          </div>

          {/* Tone Comparison Grid */}
          <div className="grid grid-cols-1 gap-6">
            {(Object.keys(toneConfig) as EmailTone[]).map((tone) => {
              const config = toneConfig[tone]
              const template = variations[tone]
              const isSelected = selectedToneLocal === tone
              const Icon = config.icon

              return (
                <div
                  key={tone}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    isSelected
                      ? `border-${config.color}-500 bg-${config.color}-900/10`
                      : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg bg-${config.color}-500/10 text-${config.color}-400`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{config.label}</h3>
                        <p className="text-sm text-slate-400">{config.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Personalization Score */}
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">{template.personalizationScore}%</div>
                        <div className="text-xs text-slate-400">Personalization</div>
                      </div>
                      {isSelected && (
                        <div className="p-2 rounded-full bg-green-500 text-white">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Subject Line */}
                  <div className="mb-3">
                    <label className="text-xs text-slate-500 uppercase tracking-wide">Subject</label>
                    <p className="text-white font-semibold mt-1">
                      {template.subject}
                    </p>
                  </div>

                  {/* Body Preview */}
                  <div className="mb-4">
                    <label className="text-xs text-slate-500 uppercase tracking-wide">Body Preview</label>
                    <div className="mt-2 p-4 bg-slate-800/50 rounded-lg text-sm text-slate-300 whitespace-pre-wrap max-h-64 overflow-y-auto">
                      {template.body}
                    </div>
                    <p className="text-xs text-green-400 mt-1">✓ Personalization available</p>
                  </div>

                  {/* Select Button */}
                  <Button
                    onClick={() => handleSelectTone(tone)}
                    className={`w-full ${
                      isSelected
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Selected
                      </>
                    ) : (
                      'Select This Tone'
                    )}
                  </Button>
                </div>
              )
            })}
          </div>

          {/* Regenerate Button */}
          <div className="flex gap-3">
            <Button
              onClick={() => {
                setVariations(null)
                setSelectedToneLocal(null)
              }}
              variant="outline"
              className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Start Over
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={generating}
              variant="outline"
              className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Regenerate All
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function CreateNew({ isJobSeeker, onSave, onBack }: any) {
  const [templateName, setTemplateName] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [showVariables, setShowVariables] = useState(false)

  const variables = [
    { key: '{{recipient_name}}', label: 'Recipient Name', example: 'John Smith' },
    { key: '{{company_name}}', label: 'Company Name', example: 'Acme Corp' },
    { key: '{{job_title}}', label: 'Job Title', example: 'Software Engineer' },
    { key: '{{job_location}}', label: 'Job Location', example: 'San Francisco, CA' },
    { key: '{{salary_range}}', label: 'Salary Range', example: '$120k-$180k' },
    { key: '{{company_industry}}', label: 'Company Industry', example: 'Technology' },
    { key: '{{your_name}}', label: 'Your Name', example: 'Jane Doe' },
    { key: '{{your_title}}', label: 'Your Title', example: 'Senior Developer' },
    { key: '{{your_company}}', label: 'Your Company', example: 'TechCorp' }
  ]

  const insertVariable = (variable: string, field: 'subject' | 'body') => {
    if (field === 'subject') {
      setSubject(subject + variable)
    } else {
      setBody(body + variable)
    }
  }

  const handleSave = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error('Please enter both subject and body')
      return
    }

    try {
      const payload = {
        name: templateName || 'Custom Template',
        description: isJobSeeker ? 'Job application custom template' : 'Outreach custom template',
        category: isJobSeeker ? 'application' : 'outreach',
        language: 'english',
        subject_template: subject,
        body_template_html: body.replace(/\n/g, '<br/>'),
        body_template_text: body,
        target_position: isJobSeeker ? 'Hiring Manager' : 'Founder',
        target_industry: undefined,
        target_country: undefined,
        target_company_size: undefined,
        available_variables: JSON.stringify(variables.map((v) => v.key)),
        is_default: false,
        is_active: true,
      }

      const { data } = await apiClient.post('/email-templates', payload)

      const template: TemplatePreview = {
        id: data.id,
        subject: data.subject_template,
        body: data.body_template_text || data.body_template_html || '',
        personalizationScore: 75
      }

      onSave(template)
      toast.success('Template saved successfully!')
    } catch (err: any) {
      console.error('Failed to save template:', err)
      const message = err?.response?.data?.detail || err?.message || 'Failed to save template'
      toast.error(message)
    }
  }

  const previewData = {
    recipient_name: 'John Smith',
    company_name: 'Acme Corp',
    job_title: 'Software Engineer',
    job_location: 'San Francisco, CA',
    salary_range: '$120k-$180k',
    company_industry: 'Technology',
    your_name: 'Jane Doe',
    your_title: 'Senior Developer',
    your_company: 'TechCorp'
  }

  const renderPreview = (text: string) => {
    let preview = text
    Object.entries(previewData).forEach(([key, value]) => {
      preview = preview.replaceAll(`{{${key}}}`, value)
    })
    return preview
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <PenTool className="w-6 h-6 text-green-400" />
            Create New Template
          </h2>
          <p className="text-slate-400 mt-1">
            Write your own custom template with dynamic variables
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack}>
          <X className="w-4 h-4 mr-2" />
          Change Source
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor */}
        <div className="lg:col-span-2 space-y-6">
          {/* Template Name */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Template Name (Optional)
            </label>
            <Input
              placeholder="e.g., My Tech Application Template"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          {/* Subject Line */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-white">
                Subject Line <span className="text-red-400">*</span>
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowVariables(!showVariables)}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Insert Variable
              </Button>
            </div>
            <Input
              placeholder="Enter email subject..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          {/* Body */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-white">
                Email Body <span className="text-red-400">*</span>
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowVariables(!showVariables)}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Insert Variable
              </Button>
            </div>
            <textarea
              placeholder={isJobSeeker 
                ? "Dear {{recipient_name}},\n\nI am writing to express my interest in the {{job_title}} position at {{company_name}}..."
                : "Hi {{recipient_name}},\n\nI noticed {{company_name}} is focused on..."
              }
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={16}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none font-mono text-sm"
            />
            <p className="text-xs text-slate-500 mt-2">
              Tip: Use variables like {"{{recipient_name}}"} for personalization
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={() => setShowPreview(!showPreview)}
              variant="outline"
              className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? 'Hide' : 'Show'} Preview
            </Button>
            <Button
              onClick={handleSave}
              disabled={!subject.trim() || !body.trim()}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4 mr-2" />
              Save & Use Template
            </Button>
          </div>
        </div>

        {/* Variables Sidebar */}
        <div className="space-y-4">
          <div className="p-6 rounded-lg border-2 border-slate-800 bg-slate-900 sticky top-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-400" />
              Available Variables
            </h3>
            <div className="space-y-2">
              {variables.map((variable) => (
                <button
                  key={variable.key}
                  onClick={() => insertVariable(variable.key, 'body')}
                  className="w-full p-3 rounded-lg border border-slate-800 bg-slate-800/50 hover:bg-slate-800 hover:border-blue-500 transition-all text-left group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white mb-1">{variable.label}</p>
                      <p className="text-xs text-blue-400 font-mono truncate">{variable.key}</p>
                    </div>
                    <Copy className="w-4 h-4 text-slate-500 group-hover:text-blue-400 flex-shrink-0 ml-2" />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Example: {variable.example}</p>
                </button>
              ))}
            </div>
            <div className="mt-4 p-3 rounded bg-blue-900/20 border border-blue-800 text-xs text-blue-300">
              <p className="font-semibold mb-1">💡 Pro Tip</p>
              <p>Click any variable to insert it at the end of your email body. Variables are automatically replaced with actual data when sending.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Panel */}
      {showPreview && (
        <div className="p-6 rounded-lg border-2 border-blue-800 bg-slate-900">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-400" />
            Preview (with sample data)
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wide">Subject</label>
              <p className="text-white font-semibold mt-1">{renderPreview(subject) || '(empty)'}</p>
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wide">Body</label>
              <div className="mt-2 p-4 bg-slate-800/50 rounded-lg text-sm text-slate-300 whitespace-pre-wrap">
                {renderPreview(body) || '(empty)'}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

