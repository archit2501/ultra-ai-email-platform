"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Smartphone,
  Gamepad2,
  ShoppingCart,
  Globe,
  Building2,
  Users,
  Mail,
  ExternalLink,
  Play,
  Pause,
  RotateCcw,
  Download,
  Filter,
  Search,
  ChevronRight,
  ChevronDown,
  Check,
  Loader2,
  Sparkles,
  Zap,
  Crown,
  MapPin,
  Briefcase,
  TrendingUp,
  Store,
  Megaphone,
  GraduationCap,
  Heart,
  DollarSign,
  MessageCircle,
  Tv,
  Layout,
  Building,
  Table,
  LayoutGrid,
  Eye,
  Copy,
  CheckCircle,
  AlertCircle,
  Info,
  Brain,
  Network,
  Database,
  Layers,
  Target,
  Activity,
  Clock,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Terminal,
  Code,
  Cpu,
  Server,
  Wifi,
  Shield,
  FileSearch,
  UserSearch,
  Link,
  Github,
  Linkedin,
  Twitter,
  Phone,
  Minimize2,
  Maximize2,
  PanelRightClose,
  PanelRight,
  ChevronUp,
  ChevronLeft,
  Minus,
  Plus,
  Menu,
  X,
  ArrowLeft,
  History,
  PlayCircle,
  SkipForward,
  Trash2,
  ChevronsRight,
  Repeat,
  FolderOpen
} from "lucide-react"
import { Toast } from "@/lib/toast"
import { CampaignRecipient } from "@/types"

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"

// Types
interface Demographic {
  value: string
  label: string
  icon: React.ReactNode
  countries: string[]
}

interface Category {
  value: string
  label: string
  icon: React.ReactNode
  description: string
}

interface PersonData {
  name: string
  title?: string
  role?: string
  emails?: string[]
  linkedin?: string
  github?: string
  twitter?: string
  location?: string
  sources?: string[]
  confidence?: number
}

interface ExtractionResult {
  company_name: string
  app_or_product: string | null
  product_category: string | null
  demographic: string | null
  company_website: string | null
  company_domain: string | null
  company_description: string | null
  company_linkedin: string | null
  company_size?: string | null
  company_industry?: string | null
  company_location?: string | null
  contact_email: string | null
  marketing_email: string | null
  sales_email: string | null
  support_email: string | null
  playstore_url: string | null
  appstore_url: string | null
  people: PersonData[]
  confidence_score: number
  data_sources: string[]
  // Email verification fields
  email_verification_status?: "verified" | "maybe" | "not_verified"
  email_verification_confidence?: number
  email_mx_valid?: boolean
  email_is_disposable?: boolean
  email_is_role_based?: boolean
}

interface ExtractionStats {
  apps_found: number
  companies_found: number
  emails_found: number
  emails_verified: number
  pages_scraped: number
  api_calls: number
  bloom_filter_hits: number
  cache_hits: number
  nlp_entities_extracted: number
  email_permutations_generated: number
  osint_leadership_found: number
  osint_employees_found: number
  osint_phones_found: number
  osint_social_profiles_found: number
}

interface APILiveContact {
  id: string
  timestamp: string
  company_name: string
  app_or_product?: string
  email?: string
  person_name?: string
  type: "company" | "email" | "person" | "leadership" | "app"
  source: string
  confidence: number
  playstore_url?: string
  website?: string
}

interface ExtractionJob {
  job_id: string
  status: "pending" | "running" | "completed" | "failed" | "cancelled"
  progress: {
    stage: string
    stage_progress: number
    total_progress: number
    message: string
  }
  stats: ExtractionStats
  results_count: number
  live_contacts?: APILiveContact[]
  created_at?: string
  completed_at?: string
}

interface JobHistoryItem {
  job_id: string
  status: string
  progress: number
  results_count: number
  emails_found: number
  created_at: string
  completed_at?: string
  demographics?: string[]
  categories?: string[]
}

interface LiveContact {
  id: string
  timestamp: Date
  company_name: string
  app_or_product?: string
  email?: string
  person_name?: string
  type: "company" | "email" | "person" | "leadership" | "app"
  source: string
  confidence: number
  playstore_url?: string
  website?: string
}

interface ExtractionError {
  id: string
  timestamp: Date
  message: string
  type: "warning" | "error"
  source?: string
}

interface ExtractionLayer {
  id: string
  name: string
  icon: React.ReactNode
  status: "idle" | "active" | "completed" | "error"
  description: string
  progress: number
}

// Demographics data
const DEMOGRAPHICS: Demographic[] = [
  { value: "usa", label: "USA", icon: <Globe className="w-4 h-4 sm:w-5 sm:h-5" />, countries: ["us"] },
  { value: "europe", label: "Europe", icon: <Globe className="w-4 h-4 sm:w-5 sm:h-5" />, countries: ["de", "fr", "es", "it", "nl"] },
  { value: "uk", label: "United Kingdom", icon: <Globe className="w-4 h-4 sm:w-5 sm:h-5" />, countries: ["gb"] },
  { value: "australia", label: "Australia & NZ", icon: <Globe className="w-4 h-4 sm:w-5 sm:h-5" />, countries: ["au", "nz"] },
  { value: "singapore", label: "Singapore", icon: <Globe className="w-4 h-4 sm:w-5 sm:h-5" />, countries: ["sg"] },
  { value: "east_asia", label: "East Asia", icon: <Globe className="w-4 h-4 sm:w-5 sm:h-5" />, countries: ["jp", "kr", "cn", "tw"] },
  { value: "south_asia", label: "South Asia", icon: <Globe className="w-4 h-4 sm:w-5 sm:h-5" />, countries: ["in", "pk", "bd"] },
  { value: "middle_east", label: "Middle East", icon: <Globe className="w-4 h-4 sm:w-5 sm:h-5" />, countries: ["ae", "sa", "il"] },
  { value: "russia", label: "Russia", icon: <Globe className="w-4 h-4 sm:w-5 sm:h-5" />, countries: ["ru"] },
  { value: "latin_america", label: "Latin America", icon: <Globe className="w-4 h-4 sm:w-5 sm:h-5" />, countries: ["br", "mx", "ar"] },
  { value: "africa", label: "Africa", icon: <Globe className="w-4 h-4 sm:w-5 sm:h-5" />, countries: ["za", "ng", "ke"] },
  { value: "southeast_asia", label: "Southeast Asia", icon: <Globe className="w-4 h-4 sm:w-5 sm:h-5" />, countries: ["th", "vn", "id", "ph"] },
]

// Categories data
const CATEGORIES: Category[] = [
  { value: "mobile_apps", label: "Mobile Apps", icon: <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />, description: "All mobile applications" },
  { value: "android_apps", label: "Android Apps", icon: <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />, description: "Google Play Store apps" },
  { value: "ios_apps", label: "iOS Apps", icon: <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />, description: "Apple App Store apps" },
  { value: "games", label: "Games", icon: <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5" />, description: "Mobile & PC games" },
  { value: "ecommerce", label: "E-commerce", icon: <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />, description: "Online stores & marketplaces" },
  { value: "product_based", label: "Product Companies", icon: <Store className="w-4 h-4 sm:w-5 sm:h-5" />, description: "Consumer product companies" },
  { value: "ads_based", label: "Ads/AdTech", icon: <Megaphone className="w-4 h-4 sm:w-5 sm:h-5" />, description: "Advertising platforms" },
  { value: "saas", label: "SaaS", icon: <Building className="w-4 h-4 sm:w-5 sm:h-5" />, description: "Software as a Service" },
  { value: "fintech", label: "Fintech", icon: <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />, description: "Financial technology" },
  { value: "health_tech", label: "Health Tech", icon: <Heart className="w-4 h-4 sm:w-5 sm:h-5" />, description: "Healthcare & fitness apps" },
  { value: "ed_tech", label: "EdTech", icon: <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />, description: "Education technology" },
  { value: "social_media", label: "Social Media", icon: <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />, description: "Social networks" },
  { value: "streaming", label: "Streaming", icon: <Tv className="w-4 h-4 sm:w-5 sm:h-5" />, description: "Video & music streaming" },
  { value: "productivity", label: "Productivity", icon: <Layout className="w-4 h-4 sm:w-5 sm:h-5" />, description: "Productivity tools" },
  { value: "enterprise", label: "Enterprise", icon: <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />, description: "B2B enterprise software" },
]

// Initial extraction layers
const INITIAL_LAYERS: ExtractionLayer[] = [
  { id: "discovery", name: "App Discovery", icon: <Search className="w-3 h-3 sm:w-4 sm:h-4" />, status: "idle", description: "Searching app stores...", progress: 0 },
  { id: "web_scraping", name: "Web Scraping", icon: <Globe className="w-3 h-3 sm:w-4 sm:h-4" />, status: "idle", description: "Deep website crawling", progress: 0 },
  { id: "ml_nlp", name: "ML/NLP", icon: <Brain className="w-3 h-3 sm:w-4 sm:h-4" />, status: "idle", description: "Entity extraction", progress: 0 },
  { id: "data_structures", name: "Data Structures", icon: <Database className="w-3 h-3 sm:w-4 sm:h-4" />, status: "idle", description: "Bloom Filter, Cache", progress: 0 },
  { id: "osint", name: "Deep OSINT", icon: <Shield className="w-3 h-3 sm:w-4 sm:h-4" />, status: "idle", description: "Google, LinkedIn, GitHub", progress: 0 },
  { id: "web_search", name: "Web Search", icon: <Search className="w-3 h-3 sm:w-4 sm:h-4" />, status: "idle", description: "DuckDuckGo, Bing, SearX", progress: 0 },
  { id: "email_intel", name: "Email Intel", icon: <Mail className="w-3 h-3 sm:w-4 sm:h-4" />, status: "idle", description: "Verification, MX check", progress: 0 },
  { id: "social", name: "Social Media", icon: <Users className="w-3 h-3 sm:w-4 sm:h-4" />, status: "idle", description: "Twitter, Facebook", progress: 0 },
  { id: "enrichment", name: "Enrichment", icon: <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />, status: "idle", description: "API enrichment", progress: 0 },
]

// Selection Card Component - Responsive
function SelectionCard({
  item,
  selected,
  onToggle,
  type
}: {
  item: Demographic | Category
  selected: boolean
  onToggle: () => void
  type: "demographic" | "category"
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onToggle}
      className={`
        relative p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border-2 transition-all duration-200 text-left w-full
        ${selected
          ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
          : "border-slate-700 bg-slate-900 hover:border-primary/50 hover:bg-primary/5"
        }
      `}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        <div className={`
          p-1.5 sm:p-2 rounded-md sm:rounded-lg flex-shrink-0
          ${selected ? "bg-primary text-primary-foreground" : "bg-slate-800 text-slate-400"}
        `}>
          {item.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium sm:font-semibold text-white text-xs sm:text-sm truncate">{item.label}</h3>
          {type === "category" && (item as Category).description && (
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 hidden sm:block truncate">
              {(item as Category).description}
            </p>
          )}
          {type === "demographic" && (item as Demographic).countries && (
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 hidden xs:block">
              {(item as Demographic).countries.slice(0, 2).map(c => c.toUpperCase()).join(", ")}
              {(item as Demographic).countries.length > 2 && ` +${(item as Demographic).countries.length - 2}`}
            </p>
          )}
        </div>
        {selected && (
          <div className="absolute top-1 right-1 sm:top-2 sm:right-2">
            <Check className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>
        )}
      </div>
    </motion.button>
  )
}

// Live Contact Feed Item - Enhanced with app details
function LiveContactItem({ contact, compact = false }: { contact: LiveContact; compact?: boolean }) {
  const getIcon = () => {
    const size = compact ? "w-3 h-3" : "w-4 h-4"
    switch (contact.type) {
      case "app": return <Smartphone className={`${size} text-cyan-500`} />
      case "company": return <Building2 className={`${size} text-blue-500`} />
      case "email": return <Mail className={`${size} text-green-500`} />
      case "person": return <Users className={`${size} text-purple-500`} />
      case "leadership": return <Crown className={`${size} text-amber-500`} />
      default: return <Info className={`${size} text-slate-400`} />
    }
  }

  const getBg = () => {
    switch (contact.type) {
      case "app": return "bg-cyan-500/10 border-cyan-500/20"
      case "company": return "bg-blue-500/10 border-blue-500/20"
      case "email": return "bg-green-500/10 border-green-500/20"
      case "person": return "bg-purple-500/10 border-purple-500/20"
      case "leadership": return "bg-amber-500/10 border-amber-500/20"
      default: return "bg-slate-800/50 border-slate-700"
    }
  }

  const getTypeLabel = () => {
    switch (contact.type) {
      case "app": return "APP"
      case "company": return "COMPANY"
      case "email": return "EMAIL"
      case "person": return "PERSON"
      case "leadership": return "LEADER"
      default: return "INFO"
    }
  }

  return (
    <div className={`${compact ? "p-2" : "p-2.5 sm:p-3"} rounded-lg border ${getBg()} transition-all duration-200`}>
      <div className="flex items-start gap-2">
        <div className="mt-0.5 flex-shrink-0">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          {/* Header row with company/app name and badges */}
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            <span className={`font-semibold ${compact ? "text-xs" : "text-xs sm:text-sm"} text-white truncate max-w-[150px] sm:max-w-none`}>
              {contact.company_name}
            </span>
            <span className={`${compact ? "text-[8px]" : "text-[9px] sm:text-[10px]"} px-1.5 py-0.5 rounded-full font-bold ${
              contact.type === "app" ? "bg-cyan-500/30 text-cyan-400" :
              contact.type === "email" ? "bg-green-500/30 text-green-400" :
              contact.type === "company" ? "bg-blue-500/30 text-blue-400" :
              contact.type === "leadership" ? "bg-amber-500/30 text-amber-400" :
              "bg-purple-500/30 text-purple-400"
            }`}>
              {getTypeLabel()}
            </span>
            <span className={`${compact ? "text-[8px]" : "text-[9px] sm:text-[10px]"} px-1 py-0.5 rounded ${
              contact.confidence >= 80 ? "bg-green-500/20 text-green-500" :
              contact.confidence >= 50 ? "bg-amber-500/20 text-amber-500" :
              "bg-slate-800 text-slate-400"
            }`}>
              {contact.confidence}%
            </span>
          </div>

          {/* App/Product name if different from company */}
          {contact.app_or_product && contact.app_or_product !== contact.company_name && (
            <p className={`${compact ? "text-[10px]" : "text-[10px] sm:text-xs"} text-cyan-400 truncate flex items-center gap-1`}>
              <Smartphone className="w-2.5 h-2.5 inline" />
              {contact.app_or_product}
            </p>
          )}

          {/* Email - highlighted prominently */}
          {contact.email && (
            <p className={`${compact ? "text-[10px]" : "text-[11px] sm:text-xs"} text-green-400 font-medium truncate flex items-center gap-1`}>
              <Mail className="w-2.5 h-2.5 inline flex-shrink-0" />
              {contact.email}
            </p>
          )}

          {/* Person name */}
          {contact.person_name && !compact && (
            <p className="text-[10px] sm:text-xs text-purple-400 truncate flex items-center gap-1">
              <Users className="w-2.5 h-2.5 inline" />
              {contact.person_name}
            </p>
          )}

          {/* Source info - where we found this */}
          {contact.source && !compact && (
            <p className="text-[9px] sm:text-[10px] text-slate-400 truncate flex items-center gap-1 mt-1">
              <Search className="w-2 h-2 inline flex-shrink-0" />
              Found from: <span className="text-blue-400">{contact.source}</span>
            </p>
          )}

          {/* Links row */}
          {!compact && (contact.playstore_url || contact.website) && (
            <div className="flex items-center gap-2 mt-1">
              {contact.playstore_url && (
                <a
                  href={contact.playstore_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[9px] text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5"
                >
                  <ExternalLink className="w-2 h-2" /> Play Store
                </a>
              )}
              {contact.website && (
                <a
                  href={contact.website.startsWith("http") ? contact.website : `https://${contact.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[9px] text-blue-400 hover:text-blue-300 flex items-center gap-0.5"
                >
                  <ExternalLink className="w-2 h-2" /> Website
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Error Item Component
function ErrorItem({ error }: { error: ExtractionError }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-2 rounded-lg text-xs sm:text-sm flex items-start gap-2 ${
        error.type === "error" ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"
      }`}
    >
      {error.type === "error" ? (
        <XCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" />
      ) : (
        <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" />
      )}
      <div className="flex-1 min-w-0">
        <p className="truncate">{error.message}</p>
      </div>
    </motion.div>
  )
}

// Layer Status Component - Responsive
function LayerStatus({ layer, compact = false }: { layer: ExtractionLayer; compact?: boolean }) {
  const getStatusColor = () => {
    switch (layer.status) {
      case "active": return "text-primary bg-primary/20 border-primary/30"
      case "completed": return "text-green-500 bg-green-500/20 border-green-500/30"
      case "error": return "text-red-500 bg-red-500/20 border-red-500/30"
      default: return "text-slate-400 bg-slate-800/50 border-slate-700"
    }
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-2 p-2 rounded-lg border ${getStatusColor()}`}>
        <div className="flex-shrink-0">
          {layer.status === "active" ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            >
              {layer.icon}
            </motion.div>
          ) : layer.status === "completed" ? (
            <Check className="w-3 h-3" />
          ) : (
            layer.icon
          )}
        </div>
        <span className="text-[10px] sm:text-xs font-medium truncate">{layer.name}</span>
        {layer.status === "active" && (
          <span className="text-[10px] ml-auto">{layer.progress}%</span>
        )}
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border ${getStatusColor()}`}>
      <div className="flex-shrink-0">
        {layer.status === "active" ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          >
            {layer.icon}
          </motion.div>
        ) : layer.status === "completed" ? (
          <Check className="w-3 h-3 sm:w-4 sm:h-4" />
        ) : layer.status === "error" ? (
          <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
        ) : (
          layer.icon
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-medium truncate">{layer.name}</span>
          {layer.status === "active" && (
            <span className="text-[10px] sm:text-xs ml-2">{layer.progress}%</span>
          )}
        </div>
        <p className="text-[10px] sm:text-xs opacity-70 truncate hidden sm:block">{layer.description}</p>
        {layer.status === "active" && (
          <div className="h-1 bg-black/10 rounded-full mt-1 overflow-hidden">
            <motion.div
              className="h-full bg-current rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${layer.progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// Result Card Component - Responsive
function ResultCard({
  result,
  onCopyEmail,
  index,
  compact = false
}: {
  result: ExtractionResult
  onCopyEmail: (email: string) => void
  index: number
  compact?: boolean
}) {
  const [expanded, setExpanded] = useState(false)

  const hasEmails = !!(result.contact_email || result.marketing_email || result.sales_email)
  const hasLeadership = result.people?.some(p => p.role === "leadership")

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.02 }}
        className="bg-slate-900 border border-slate-700 rounded-lg p-2 sm:p-3"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-xs sm:text-sm text-white truncate">{result.company_name}</h3>
            {result.app_or_product && (
              <p className="text-[10px] sm:text-xs text-slate-400 truncate">{result.app_or_product}</p>
            )}
          </div>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${
            result.confidence_score >= 80 ? "bg-green-500/20 text-green-500" :
            result.confidence_score >= 50 ? "bg-amber-500/20 text-amber-500" :
            "bg-slate-800 text-slate-400"
          }`}>
            {result.confidence_score}%
          </span>
        </div>
        {(result.marketing_email || result.sales_email) && (
          <button
            onClick={() => onCopyEmail(result.marketing_email || result.sales_email!)}
            className="mt-2 text-[10px] sm:text-xs text-primary truncate w-full text-left hover:underline flex items-center gap-1"
          >
            <Mail className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{result.marketing_email || result.sales_email}</span>
          </button>
        )}
      </motion.div>
    )
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      className="bg-slate-900 border border-slate-700 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:shadow-lg hover:border-primary/30 transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium sm:font-semibold text-sm sm:text-base text-white truncate">{result.company_name}</h3>
          {result.app_or_product && (
            <p className="text-xs sm:text-sm text-slate-400 truncate mt-0.5">
              <Smartphone className="w-3 h-3 inline mr-1" />
              {result.app_or_product}
            </p>
          )}
        </div>
        <div className={`
          px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium flex-shrink-0
          ${result.confidence_score >= 80 ? "bg-green-500/20 text-green-500" :
            result.confidence_score >= 50 ? "bg-amber-500/20 text-amber-500" :
            "bg-slate-800 text-slate-400"}
        `}>
          {result.confidence_score}%
        </div>
      </div>

      {/* Category & Location */}
      <div className="flex flex-wrap gap-1 sm:gap-2 mt-2 sm:mt-3">
        {result.product_category && (
          <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-primary/10 text-primary text-[10px] sm:text-xs rounded-full">
            {result.product_category}
          </span>
        )}
        {result.demographic && (
          <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-slate-800 text-slate-400 text-[10px] sm:text-xs rounded-full flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            {result.demographic.toUpperCase()}
          </span>
        )}
      </div>

      {/* Description - Hidden on mobile */}
      {result.company_description && (
        <p className="text-xs text-slate-400 mt-2 sm:mt-3 line-clamp-2 hidden sm:block">
          {result.company_description}
        </p>
      )}

      {/* Emails with Verification Status */}
      {hasEmails && (
        <div className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2">
          {/* Verification Status Badge */}
          {result.email_verification_status && (
            <div className={`flex items-center gap-1.5 text-[10px] sm:text-xs px-2 py-1 rounded-full w-fit ${
              result.email_verification_status === "verified"
                ? "bg-green-500/20 text-green-500"
                : result.email_verification_status === "maybe"
                  ? "bg-amber-500/20 text-amber-500"
                  : "bg-red-500/20 text-red-500"
            }`}>
              {result.email_verification_status === "verified" ? (
                <><CheckCircle className="w-3 h-3" /> Verified</>
              ) : result.email_verification_status === "maybe" ? (
                <><AlertCircle className="w-3 h-3" /> Maybe</>
              ) : (
                <><XCircle className="w-3 h-3" /> Not Verified</>
              )}
              {result.email_verification_confidence !== undefined && (
                <span className="ml-1 opacity-70">({result.email_verification_confidence}%)</span>
              )}
            </div>
          )}
          {result.marketing_email && (
            <div className="flex items-center justify-between gap-2 p-1.5 sm:p-2 bg-primary/5 rounded-lg group">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                <Megaphone className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                <span className="text-xs sm:text-sm truncate">{result.marketing_email}</span>
              </div>
              <button
                onClick={() => onCopyEmail(result.marketing_email!)}
                className="p-1 hover:bg-primary/20 rounded transition-colors"
              >
                <Copy className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
              </button>
            </div>
          )}
          {result.sales_email && (
            <div className="flex items-center justify-between gap-2 p-1.5 sm:p-2 bg-green-500/5 rounded-lg group">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                <span className="text-xs sm:text-sm truncate">{result.sales_email}</span>
              </div>
              <button
                onClick={() => onCopyEmail(result.sales_email!)}
                className="p-1 hover:bg-green-500/20 rounded transition-colors"
              >
                <Copy className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Links - Responsive */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3 sm:mt-4">
        {result.company_website && (
          <a
            href={result.company_website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-slate-800 text-[10px] sm:text-xs rounded-full hover:bg-slate-800/80 transition-colors"
          >
            <Globe className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span className="hidden xs:inline">Website</span>
          </a>
        )}
        {result.playstore_url && (
          <a
            href={result.playstore_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-500/10 text-green-500 text-[10px] sm:text-xs rounded-full hover:bg-green-500/20 transition-colors"
          >
            <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span className="hidden xs:inline">Play</span>
          </a>
        )}
        {result.company_linkedin && (
          <a
            href={result.company_linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-600/10 text-blue-600 text-[10px] sm:text-xs rounded-full hover:bg-blue-600/20 transition-colors"
          >
            <Linkedin className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span className="hidden xs:inline">LinkedIn</span>
          </a>
        )}
      </div>

      {/* People (Expandable) */}
      {result.people && result.people.length > 0 && (
        <div className="mt-3 sm:mt-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-xs sm:text-sm text-slate-400 hover:text-white transition-colors w-full"
          >
            <Users className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>
              {hasLeadership && <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3 inline text-amber-500 mr-1" />}
              {result.people.length} contact{result.people.length > 1 ? "s" : ""}
            </span>
            <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 ml-auto transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 space-y-1.5 sm:space-y-2">
                  {result.people.slice(0, 5).map((person, idx) => (
                    <div key={idx} className={`p-1.5 sm:p-2 rounded-lg ${
                      person.role === "leadership" ? "bg-amber-500/10" : "bg-slate-800/30"
                    }`}>
                      <div className="flex items-center gap-2">
                        {person.role === "leadership" ? (
                          <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500" />
                        ) : (
                          <Users className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-medium truncate">{person.name}</p>
                          {person.title && (
                            <p className="text-[10px] sm:text-xs text-slate-400 truncate">{person.title}</p>
                          )}
                        </div>
                      </div>
                      {person.emails && person.emails.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {person.emails.slice(0, 2).map((email, eidx) => (
                            <button
                              key={eidx}
                              onClick={() => onCopyEmail(email)}
                              className="text-[10px] sm:text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              <Mail className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                              <span className="truncate max-w-[150px]">{email}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Data Sources */}
      <div className="flex flex-wrap items-center gap-1 mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-slate-700">
        <span className="text-[10px] sm:text-xs text-slate-400 mr-1">Sources:</span>
        {result.data_sources.slice(0, 3).map((source, idx) => (
          <span key={idx} className="text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 bg-slate-800 rounded">
            {source.replace(/_/g, " ").replace("osint ", "").slice(0, 12)}
          </span>
        ))}
        {result.data_sources.length > 3 && (
          <span className="text-[8px] sm:text-[10px] text-slate-400">+{result.data_sources.length - 3}</span>
        )}
      </div>
    </motion.div>
  )
}

// Props interface for embedded use
export interface MobiAdzExtractionContentProps {
  onRecipientsSelected?: (recipients: CampaignRecipient[], count: number) => void
  initialJobId?: string
  onJobCreated?: (jobId: string) => void
}

// Main Content Component - can be used embedded or standalone
export function MobiAdzExtractionContent(props?: MobiAdzExtractionContentProps) {
  const onRecipientsSelected = props?.onRecipientsSelected
  const initialJobId = props?.initialJobId
  const onJobCreated = props?.onJobCreated
  // State
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [selectedDemographics, setSelectedDemographics] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [extractionMode, setExtractionMode] = useState<"free" | "paid">("free")
  const [currentJob, setCurrentJob] = useState<ExtractionJob | null>(null)
  const [results, setResults] = useState<ExtractionResult[]>([])
  const recipientsPushedRef = useRef(false)
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards")
  const [searchQuery, setSearchQuery] = useState("")
  const [isExtracting, setIsExtracting] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Live feed state
  const [liveContacts, setLiveContacts] = useState<LiveContact[]>([])
  const [errors, setErrors] = useState<ExtractionError[]>([])
  const [layers, setLayers] = useState<ExtractionLayer[]>(INITIAL_LAYERS)
  const [feedSize, setFeedSize] = useState<"collapsed" | "small" | "medium" | "large">("medium")
  const [showMobileFeed, setShowMobileFeed] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const liveContactsRef = useRef<HTMLDivElement>(null)
  const pollAbortRef = useRef<boolean>(false)

  // Job history state
  const [jobHistory, setJobHistory] = useState<JobHistoryItem[]>([])
  const [showJobHistory, setShowJobHistory] = useState(false)
  const [selectedHistoryJob, setSelectedHistoryJob] = useState<string | null>(null)
  const [loadingRerun, setLoadingRerun] = useState<string | null>(null)
  const [exportingToRecipients, setExportingToRecipients] = useState(false)

  // Configuration - now with configurable target
  const [config, setConfig] = useState({
    maxCompanies: 200,
    maxAppsPerCategory: 100,
    websiteScrapeDepth: 7,
    hunterApiKey: "",
    clearbitApiKey: "",
    apolloApiKey: "",
    targetContacts: 1000,  // Configurable from 100 to 5000
    maxPerProduct: 5,
    enableDeepOsint: true,
    enableEmailVerification: true,
    enableSocialScraping: true
  })

  useEffect(() => {
    if (!onRecipientsSelected) return

    if (results.length === 0) {
      recipientsPushedRef.current = false
      return
    }

    if (recipientsPushedRef.current) return

    const mappedRecipients: CampaignRecipient[] = results
      .map((r) => ({
        email: r.marketing_email || r.sales_email || r.contact_email || "",
        name: r.people?.[0]?.name || r.company_name,
        company: r.company_name,
        position: r.people?.[0]?.title || r.people?.[0]?.role,
        linkedinUrl: r.company_linkedin || r.people?.[0]?.linkedin,
        website: r.company_website || r.playstore_url || r.appstore_url || undefined,
      }))

    if (mappedRecipients.length === 0) return

    recipientsPushedRef.current = true
    onRecipientsSelected(mappedRecipients, mappedRecipients.length)
  }, [results, onRecipientsSelected])

  // Toggle demographic selection
  const toggleDemographic = (value: string) => {
    setSelectedDemographics(prev =>
      prev.includes(value)
        ? prev.filter(d => d !== value)
        : [...prev, value]
    )
  }

  // Toggle category selection
  const toggleCategory = (value: string) => {
    setSelectedCategories(prev =>
      prev.includes(value)
        ? prev.filter(c => c !== value)
        : [...prev, value]
    )
  }

  // Add live contact
  const addLiveContact = useCallback((contact: Omit<LiveContact, "id" | "timestamp">) => {
    const newContact: LiveContact = {
      ...contact,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    }
    setLiveContacts(prev => [newContact, ...prev].slice(0, 100))
  }, [])

  // Add error
  const addError = useCallback((message: string, type: "warning" | "error", source?: string) => {
    const newError: ExtractionError = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      message,
      type,
      source
    }
    setErrors(prev => [newError, ...prev].slice(0, 50))
  }, [])

  // Update layer status
  const updateLayer = useCallback((layerId: string, updates: Partial<ExtractionLayer>) => {
    setLayers(prev => prev.map(l => l.id === layerId ? { ...l, ...updates } : l))
  }, [])

  // Simulate extraction progress with live updates
  const simulateLiveUpdates = useCallback((job: ExtractionJob) => {
    const stage = job.progress.stage
    const progress = job.progress.stage_progress

    if (stage === "discovery") {
      updateLayer("discovery", { status: "active", progress })
    } else if (stage === "app_scraping" || stage === "company_scraping") {
      updateLayer("discovery", { status: "completed", progress: 100 })
      updateLayer("web_scraping", { status: "active", progress })
    } else if (stage === "contact_finding") {
      updateLayer("web_scraping", { status: "completed", progress: 100 })
      updateLayer("ml_nlp", { status: "active", progress: Math.min(progress, 50) })
      updateLayer("data_structures", { status: "active", progress: Math.min(progress, 60) })
      updateLayer("osint", { status: "active", progress: Math.min(progress - 50, 100) })
    } else if (stage === "web_search") {
      // Web search stage after OSINT
      updateLayer("web_scraping", { status: "completed", progress: 100 })
      updateLayer("ml_nlp", { status: "completed", progress: 100 })
      updateLayer("data_structures", { status: "completed", progress: 100 })
      updateLayer("osint", { status: "completed", progress: 100 })
      updateLayer("web_search", { status: "active", progress, description: "DuckDuckGo, Bing, SearX" })
    } else if (stage === "enrichment") {
      updateLayer("ml_nlp", { status: "completed", progress: 100 })
      updateLayer("data_structures", { status: "completed", progress: 100 })
      updateLayer("osint", { status: "completed", progress: 100 })
      updateLayer("web_search", { status: "completed", progress: 100 })
      updateLayer("email_intel", { status: "active", progress })
      updateLayer("social", { status: "active", progress: Math.max(progress - 20, 0) })
      updateLayer("enrichment", { status: "active", progress })
    } else if (stage === "complete") {
      setLayers(prev => prev.map(l => ({ ...l, status: "completed", progress: 100 })))
    }
  }, [updateLayer])

  // Cancel extraction
  const cancelExtraction = async () => {
    if (!currentJob) return

    setIsCancelling(true)
    pollAbortRef.current = true

    try {
      await fetch(`${API_BASE_URL}/mobiadz/jobs/${currentJob.job_id}`, {
        method: "DELETE"
      })
      Toast.success("Extraction cancelled")
    } catch (error) {
      Toast.error("Failed to cancel extraction")
    } finally {
      setIsExtracting(false)
      setIsCancelling(false)
      pollAbortRef.current = false
    }
  }

  // Fetch job history
  const fetchJobHistory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/mobiadz/jobs`)
      if (response.ok) {
        const data = await response.json()
        setJobHistory(data.jobs || [])
      }
    } catch (error) {
      console.error("Failed to fetch job history:", error)
    }
  }

  // Rerun job with same settings
  const rerunJob = async (jobId: string, mode: "same" | "same_exclude_found" | "new") => {
    setLoadingRerun(`${jobId}-${mode}`)
    try {
      const response = await fetch(`${API_BASE_URL}/mobiadz/jobs/${jobId}/rerun`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode })
      })
      if (response.ok) {
        const data = await response.json()
        setCurrentJob(data)
        onJobCreated?.(data.job_id)
        setStep(4)
        setIsExtracting(true)
        setShowJobHistory(false)
        setLiveContacts([])
        setResults([])
        setLayers(INITIAL_LAYERS)
        pollAbortRef.current = false
        pollJobStatus(data.job_id)
        Toast.success(mode === "same_exclude_found"
          ? "Rerunning extraction (excluding previous contacts)"
          : mode === "new"
          ? "Starting new extraction with fresh settings"
          : "Rerunning extraction with same settings")
      } else {
        const errorData = await response.json().catch(() => ({}))
        Toast.error(errorData.detail || "Failed to rerun job")
      }
    } catch (error) {
      Toast.error("Failed to rerun job")
    } finally {
      setLoadingRerun(null)
    }
  }

  // Load a completed job's results
  const loadJobResults = async (jobId: string) => {
    try {
      // Fetch job details
      const jobResponse = await fetch(`${API_BASE_URL}/mobiadz/jobs/${jobId}`)
      if (!jobResponse.ok) {
        Toast.error("Failed to load job details")
        return
      }
      const job = await jobResponse.json()
      setCurrentJob(job)

      // Fetch results
      const resultsResponse = await fetch(`${API_BASE_URL}/mobiadz/jobs/${jobId}/results?limit=1000`)
      if (resultsResponse.ok) {
        const results = await resultsResponse.json()
        setResults(results)
      }

      setStep(4)
      setIsExtracting(false)
      setShowJobHistory(false)
      Toast.success(`Loaded ${job.results_count} results from previous extraction`)
    } catch (error) {
      Toast.error("Failed to load job results")
    }
  }

  // Delete a job from history
  const deleteJob = async (jobId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/mobiadz/jobs/${jobId}`, {
        method: "DELETE"
      })
      if (response.ok) {
        setJobHistory(prev => prev.filter(j => j.job_id !== jobId))
        Toast.success("Job deleted")
      } else {
        Toast.error("Failed to delete job")
      }
    } catch (error) {
      Toast.error("Failed to delete job")
    }
  }

  // Load job history on mount
  useEffect(() => {
    fetchJobHistory()
  }, [])

  // Resume a specific job passed in via props
  useEffect(() => {
    const jobId = initialJobId
    if (!jobId) return

    const loadJob = async () => {
      try {
        const jobResponse = await fetch(`${API_BASE_URL}/mobiadz/jobs/${jobId}`)
        if (!jobResponse.ok) return

        const job = await jobResponse.json()
        setCurrentJob(job)
        setStep(4)
        setShowJobHistory(false)

        if (job.results_count > 0) {
          const resultsResponse = await fetch(`${API_BASE_URL}/mobiadz/jobs/${jobId}/results?limit=1000`)
          if (resultsResponse.ok) {
            const data: ExtractionResult[] = await resultsResponse.json()
            setResults(data)
          }
        }

        if (job.status === "running" || job.status === "pending") {
          setIsExtracting(true)
          pollAbortRef.current = false
          pollJobStatus(jobId)
        } else {
          setIsExtracting(false)
        }
      } catch (error) {
        console.error("[MobiAdz] Failed to resume job", error)
      }
    }

    loadJob()
  }, [initialJobId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      pollAbortRef.current = true
    }
  }, [])

  // Check for existing running jobs on mount
  useEffect(() => {
    if (initialJobId) return

    const checkExistingJobs = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/mobiadz/jobs`)
        if (!response.ok) return

        const data = await response.json()
        const runningJob = data.jobs?.find((j: { status: string }) => j.status === "running")

        if (runningJob) {
          console.log("[MobiAdz] Found running job, resuming:", runningJob.job_id)

          // Fetch full job details
          const jobResponse = await fetch(`${API_BASE_URL}/mobiadz/jobs/${runningJob.job_id}`)
          if (jobResponse.ok) {
            const job = await jobResponse.json()
            setCurrentJob(job)
            setStep(4)
            setIsExtracting(true)

            // Fetch existing results
            if (runningJob.results_count > 0) {
              const resultsResponse = await fetch(`${API_BASE_URL}/mobiadz/jobs/${runningJob.job_id}/results?page=1&limit=500`)
              if (resultsResponse.ok) {
                const results = await resultsResponse.json()
                setResults(results)
              }
            }

            // Resume polling
            pollAbortRef.current = false
            pollJobStatus(runningJob.job_id)

            Toast.info(`Resuming extraction job at ${runningJob.progress}%`)
          }
        }
      } catch (error) {
        console.error("[MobiAdz] Error checking existing jobs:", error)
      }
    }

    checkExistingJobs()
  }, [initialJobId])

  // Start extraction
  const startExtraction = async () => {
    if (selectedDemographics.length === 0 || selectedCategories.length === 0) {
      Toast.error("Please select at least one demographic and one category")
      return
    }

    pollAbortRef.current = false
    setIsExtracting(true)
    setIsCancelling(false)
    setStep(4)
    setLiveContacts([])
    setErrors([])
    setLayers(INITIAL_LAYERS)
    setResults([])

    try {
      const response = await fetch(`${API_BASE_URL}/mobiadz/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          demographics: selectedDemographics,
          categories: selectedCategories,
          use_paid_apis: extractionMode === "paid",
          max_companies: config.maxCompanies,
          max_apps_per_category: config.maxAppsPerCategory,
          website_scrape_depth: config.websiteScrapeDepth,
          hunter_api_key: extractionMode === "paid" ? config.hunterApiKey : undefined,
          clearbit_api_key: extractionMode === "paid" ? config.clearbitApiKey : undefined,
          apollo_api_key: extractionMode === "paid" ? config.apolloApiKey : undefined
        })
      })

      if (!response.ok) throw new Error("Failed to start extraction")

      const job = await response.json()
      setCurrentJob(job)

      onJobCreated?.(job.job_id)

      // Poll for updates
      pollJobStatus(job.job_id)

    } catch (error) {
      Toast.error("Failed to start extraction. Make sure the backend is running.")
      addError("Failed to start extraction job", "error", "API")
      setIsExtracting(false)
    }
  }

  // Poll job status
  const pollJobStatus = async (jobId: string) => {
    let lastResultsCount = 0
    let continuousSearchMode = false

    const poll = async () => {
      // Check if polling should be aborted
      if (pollAbortRef.current) {
        return
      }

      try {
        const response = await fetch(`${API_BASE_URL}/mobiadz/jobs/${jobId}`)
        if (!response.ok) throw new Error("Failed to get job status")

        const job: ExtractionJob = await response.json()
        setCurrentJob(job)
        simulateLiveUpdates(job)

        // Update live contacts from API response
        if (job.live_contacts && job.live_contacts.length > 0) {
          const apiContacts: LiveContact[] = job.live_contacts.map(lc => ({
            id: lc.id,
            timestamp: new Date(lc.timestamp),
            company_name: lc.company_name,
            app_or_product: lc.app_or_product,
            email: lc.email,
            person_name: lc.person_name,
            type: lc.type,
            source: lc.source,
            confidence: lc.confidence,
            playstore_url: lc.playstore_url,
            website: lc.website
          }))
          // Reverse so newest are first
          setLiveContacts(apiContacts.reverse())
        }

        // Fetch new results incrementally
        if (job.results_count > lastResultsCount) {
          try {
            const resultsResponse = await fetch(`${API_BASE_URL}/mobiadz/jobs/${jobId}/results?page=1&limit=500`)
            if (resultsResponse.ok) {
              const data: ExtractionResult[] = await resultsResponse.json()
              setResults(data)
              lastResultsCount = job.results_count
            }
          } catch (e) {
            // Ignore results fetch errors
          }
        }

        if (job.status === "completed") {
          const totalContacts = job.results_count

          if (totalContacts < config.targetContacts && !continuousSearchMode) {
            continuousSearchMode = true
            addError(`Found ${totalContacts} contacts, target is ${config.targetContacts}. Consider running another extraction.`, "warning", "Target")
          }

          setIsExtracting(false)
          Toast.success(`Extraction complete! Found ${job.results_count} companies`)

          const finalResponse = await fetch(`${API_BASE_URL}/mobiadz/jobs/${jobId}/results?limit=1000`)
          if (finalResponse.ok) {
            const finalData = await finalResponse.json()
            setResults(finalData)
          }

        } else if (job.status === "failed") {
          setIsExtracting(false)
          addError("Extraction failed", "error", "System")
          Toast.error("Extraction failed")
        } else if (job.status === "running" || job.status === "pending") {
          if (!pollAbortRef.current) {
            setTimeout(poll, 1500)
          }
        } else if (job.status === "cancelled") {
          setIsExtracting(false)
          Toast.success("Extraction was cancelled")
        }
      } catch (error) {
        if (!pollAbortRef.current) {
          addError("Lost connection to extraction service", "warning", "Network")
          setTimeout(poll, 3000)
        }
      }
    }

    poll()
  }

  // Copy email
  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email)
    Toast.success("Email copied!")
  }

  // Filter results
  const filteredResults = results.filter(r => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      r.company_name?.toLowerCase().includes(query) ||
      r.app_or_product?.toLowerCase().includes(query) ||
      r.contact_email?.toLowerCase().includes(query) ||
      r.marketing_email?.toLowerCase().includes(query) ||
      r.sales_email?.toLowerCase().includes(query) ||
      r.people?.some(p => p.name?.toLowerCase().includes(query))
    )
  })

  // Export results
  const exportResults = async (format: "csv" | "json") => {
    if (!currentJob) return

    try {
      const response = await fetch(`${API_BASE_URL}/mobiadz/jobs/${currentJob.job_id}/export?format=${format}`, {
        method: "POST"
      })

      if (response.ok) {
        const data = await response.json()

        if (format === "csv") {
          const blob = new Blob([data.content], { type: "text/csv" })
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `mobiadz-extraction-${currentJob.job_id}.csv`
          a.click()
        } else {
          const blob = new Blob([JSON.stringify(data.results, null, 2)], { type: "application/json" })
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `mobiadz-extraction-${currentJob.job_id}.json`
          a.click()
        }

        Toast.success(`Exported as ${format.toUpperCase()}`)
      }
    } catch (error) {
      Toast.error("Export failed")
    }
  }

  // Export results to Recipients
  const exportToRecipients = async () => {
    if (!results || results.length === 0) {
      Toast.error("No results to export")
      return
    }

    try {
      // Get token from localStorage
      const token = localStorage.getItem("token")
      if (!token) {
        Toast.error("Please login to export to recipients")
        return
      }

      // Transform results to recipient format
      const recipientData = results
        .filter(r => r.marketing_email || r.sales_email || r.contact_email)
        .map(r => ({
          email: r.marketing_email || r.sales_email || r.contact_email,
          name: r.people?.[0]?.name || r.company_name,
          company: r.company_name,
          position: r.people?.[0]?.title || r.people?.[0]?.role || undefined,
          country: r.demographic || undefined,
          source: "themobiadz",
          tags: [r.product_category, "mobiadz"].filter(Boolean).join(","),
          custom_fields: {
            app_or_product: r.app_or_product,
            company_website: r.company_website,
            company_linkedin: r.company_linkedin,
            playstore_url: r.playstore_url,
            appstore_url: r.appstore_url,
            confidence_score: r.confidence_score,
            data_sources: r.data_sources
          }
        }))

      if (recipientData.length === 0) {
        Toast.error("No contacts with emails found")
        return
      }

      // Call bulk import API
      const response = await fetch(`${API_BASE_URL}/recipients/bulk-import-mobiadz`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          recipients: recipientData,
          skip_duplicates: true,
          create_group: true,
          group_name: `MobiAdz Import - ${new Date().toLocaleDateString()}`
        })
      })

      if (response.ok) {
        const data = await response.json()
        Toast.success(`Exported ${data.created} contacts to Recipients! (${data.skipped} duplicates skipped)`)

        // If a group was created, fetch its recipients and return to Step 1
        if (data.group_id && onRecipientsSelected) {
          try {
            const groupResp = await fetch(`${API_BASE_URL}/recipient-groups/${data.group_id}/recipients?page=1&page_size=500`, {
              headers: { "Authorization": `Bearer ${token}` }
            })
            if (groupResp.ok) {
              const groupData = await groupResp.json()
              const items = groupData.items || groupData.recipients || []
              const mapped = items.map((r: any) => ({
                id: r.id,
                email: r.email,
                name: r.name || undefined,
                company: r.company || undefined,
                position: r.position || undefined,
                linkedinUrl: r.custom_fields?.linkedin_url,
              })) as CampaignRecipient[]
              if (mapped.length > 0) {
                onRecipientsSelected(mapped, mapped.length)
              }
            }
          } catch (e) {
            console.error('Failed to fetch imported group recipients', e)
          }
        }
      } else {
        const errorData = await response.json()
        Toast.error(errorData.detail || "Failed to export to recipients")
      }
    } catch (error) {
      console.error("Export to recipients error:", error)
      Toast.error("Failed to export to recipients")
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header - Responsive */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1920px] mx-auto px-3 sm:px-4 py-2 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            {/* Logo & Title */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="p-1.5 sm:p-2 bg-gradient-to-br from-primary via-accent to-purple-600 rounded-lg sm:rounded-xl shadow-lg flex-shrink-0">
                <Smartphone className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-xl font-bold text-white flex items-center gap-1 sm:gap-2 truncate">
                  <span className="hidden xs:inline">TheMobiAdz</span>
                  <span className="xs:hidden">MobiAdz</span>
                  <span className="text-[8px] sm:text-xs px-1 sm:px-2 py-0.5 bg-gradient-to-r from-primary to-accent text-white rounded-full">
                    ULTRA
                  </span>
                </h1>
                <p className="text-[10px] sm:text-sm text-slate-400 hidden sm:block">AI-Powered Company Discovery</p>
              </div>
            </div>

            {/* Step Indicator - Desktop */}
            <div className="hidden md:flex items-center gap-2">
              {[
                { num: 1, label: "Region" },
                { num: 2, label: "Category" },
                { num: 3, label: "Mode" },
                { num: 4, label: "Extract" }
              ].map((s) => (
                <div key={s.num} className="flex items-center gap-1">
                  <div
                    className={`
                      flex items-center justify-center w-6 h-6 lg:w-8 lg:h-8 rounded-full text-xs lg:text-sm font-medium transition-all
                      ${step >= s.num
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                        : "bg-slate-800 text-slate-400"
                      }
                    `}
                  >
                    {step > s.num ? <Check className="w-3 h-3 lg:w-4 lg:h-4" /> : s.num}
                  </div>
                  <span className={`text-xs hidden lg:block ${step >= s.num ? "text-white" : "text-slate-400"}`}>
                    {s.label}
                  </span>
                  {s.num < 4 && <ChevronRight className="w-3 h-3 lg:w-4 lg:h-4 text-slate-400" />}
                </div>
              ))}
            </div>

            {/* Step Indicator - Mobile */}
            <div className="flex md:hidden items-center gap-1">
              {[1, 2, 3, 4].map((num) => (
                <div
                  key={num}
                  className={`w-2 h-2 rounded-full transition-all ${
                    step >= num ? "bg-primary" : "bg-slate-800"
                  }`}
                />
              ))}
              <span className="text-xs text-slate-400 ml-1">Step {step}/4</span>
            </div>

            {/* History Button */}
            <button
              onClick={() => {
                fetchJobHistory()
                setShowJobHistory(true)
              }}
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-slate-800 hover:bg-slate-800/80 rounded-lg text-xs sm:text-sm font-medium transition-colors"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
              {jobHistory.length > 0 && (
                <span className="px-1.5 py-0.5 bg-primary/20 text-primary text-[10px] rounded-full">
                  {jobHistory.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Job History Sidebar/Modal */}
      <AnimatePresence>
        {showJobHistory && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowJobHistory(false)}
            />
            {/* Sidebar */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-[400px] lg:w-[500px] bg-slate-900 border-l border-slate-700 z-50 overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <History className="w-5 h-5 text-primary" />
                    Extraction History
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {jobHistory.length} previous extraction{jobHistory.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  onClick={() => setShowJobHistory(false)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Job List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {jobHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <FolderOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-400">No extraction history yet</p>
                    <p className="text-xs text-slate-400 mt-1">Start an extraction to see it here</p>
                  </div>
                ) : (
                  jobHistory.map((job) => (
                    <motion.div
                      key={job.job_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-slate-800/30 border border-slate-700 rounded-xl hover:border-primary/30 transition-all"
                    >
                      {/* Job Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`
                              px-2 py-0.5 rounded-full text-[10px] font-bold uppercase
                              ${job.status === "completed" ? "bg-green-500/20 text-green-500" :
                                job.status === "running" ? "bg-blue-500/20 text-blue-500" :
                                job.status === "failed" ? "bg-red-500/20 text-red-500" :
                                job.status === "cancelled" ? "bg-amber-500/20 text-amber-500" :
                                "bg-slate-800 text-slate-400"}
                            `}>
                              {job.status}
                            </span>
                            <span className="text-xs text-slate-400">
                              {new Date(job.created_at).toLocaleDateString()} {new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-white mt-1 truncate">
                            Job {job.job_id.slice(0, 8)}...
                          </p>
                        </div>
                        <button
                          onClick={() => deleteJob(job.job_id)}
                          className="p-1.5 hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Job Stats */}
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="p-2 bg-slate-900 rounded-lg text-center">
                          <p className="text-lg font-bold text-white">{job.results_count || 0}</p>
                          <p className="text-[10px] text-slate-400">Results</p>
                        </div>
                        <div className="p-2 bg-slate-900 rounded-lg text-center">
                          <p className="text-lg font-bold text-green-500">{job.emails_found || 0}</p>
                          <p className="text-[10px] text-slate-400">Emails</p>
                        </div>
                        <div className="p-2 bg-slate-900 rounded-lg text-center">
                          <p className="text-lg font-bold text-primary">{job.progress || 0}%</p>
                          <p className="text-[10px] text-slate-400">Progress</p>
                        </div>
                      </div>

                      {/* Demographics & Categories Tags */}
                      {(job.demographics || job.categories) && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {job.demographics?.slice(0, 2).map((d: string) => (
                            <span key={d} className="px-1.5 py-0.5 bg-blue-500/10 text-blue-500 text-[10px] rounded">
                              {d}
                            </span>
                          ))}
                          {job.categories?.slice(0, 2).map((c: string) => (
                            <span key={c} className="px-1.5 py-0.5 bg-purple-500/10 text-purple-500 text-[10px] rounded">
                              {c}
                            </span>
                          ))}
                          {((job.demographics?.length || 0) + (job.categories?.length || 0)) > 4 && (
                            <span className="px-1.5 py-0.5 bg-slate-800 text-slate-400 text-[10px] rounded">
                              +{(job.demographics?.length || 0) + (job.categories?.length || 0) - 4} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        {/* View Results */}
                        {job.status === "completed" && job.results_count > 0 && (
                          <button
                            onClick={() => loadJobResults(job.job_id)}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-medium transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Results
                          </button>
                        )}

                        {/* Rerun Same Settings */}
                        <button
                          onClick={() => rerunJob(job.job_id, "same")}
                          disabled={loadingRerun === `${job.job_id}-same`}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-800/80 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          {loadingRerun === `${job.job_id}-same` ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Repeat className="w-3.5 h-3.5" />
                          )}
                          Rerun
                        </button>

                        {/* Rerun + Exclude Found */}
                        {job.status === "completed" && job.results_count > 0 && (
                          <button
                            onClick={() => rerunJob(job.job_id, "same_exclude_found")}
                            disabled={loadingRerun === `${job.job_id}-same_exclude_found`}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                            title="Rerun with same settings but exclude already found contacts"
                          >
                            {loadingRerun === `${job.job_id}-same_exclude_found` ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <SkipForward className="w-3.5 h-3.5" />
                            )}
                            +New
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-700">
                <button
                  onClick={() => {
                    setShowJobHistory(false)
                    setStep(1)
                    setResults([])
                    setCurrentJob(null)
                    setLiveContacts([])
                    setErrors([])
                    setLayers(INITIAL_LAYERS)
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  <Sparkles className="w-5 h-5" />
                  Start New Extraction
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <AnimatePresence mode="wait">
          {/* Step 1: Select Demographics */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="text-center mb-4 sm:mb-8">
                <h2 className="text-lg sm:text-2xl font-bold text-white">Select Target Demographics</h2>
                <p className="text-xs sm:text-base text-slate-400 mt-1 sm:mt-2">Choose the regions where you want to find app companies</p>
              </div>

              {/* Selection count badge */}
              {selectedDemographics.length > 0 && (
                <div className="flex justify-center mb-4">
                  <span className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                    {selectedDemographics.length} region{selectedDemographics.length > 1 ? "s" : ""} selected
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
                {DEMOGRAPHICS.map((demo) => (
                  <SelectionCard
                    key={demo.value}
                    item={demo}
                    selected={selectedDemographics.includes(demo.value)}
                    onToggle={() => toggleDemographic(demo.value)}
                    type="demographic"
                  />
                ))}
              </div>

              <div className="flex justify-end mt-6 sm:mt-8">
                <button
                  onClick={() => setStep(2)}
                  disabled={selectedDemographics.length === 0}
                  className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-primary text-primary-foreground rounded-lg sm:rounded-xl text-sm sm:text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Select Categories */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="text-center mb-4 sm:mb-8">
                <h2 className="text-lg sm:text-2xl font-bold text-white">Select Product Categories</h2>
                <p className="text-xs sm:text-base text-slate-400 mt-1 sm:mt-2">What types of apps/companies are you looking for?</p>
              </div>

              {selectedCategories.length > 0 && (
                <div className="flex justify-center mb-4">
                  <span className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                    {selectedCategories.length} categor{selectedCategories.length > 1 ? "ies" : "y"} selected
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
                {CATEGORIES.map((cat) => (
                  <SelectionCard
                    key={cat.value}
                    item={cat}
                    selected={selectedCategories.includes(cat.value)}
                    onToggle={() => toggleCategory(cat.value)}
                    type="category"
                  />
                ))}
              </div>

              <div className="flex justify-between mt-6 sm:mt-8">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-slate-800 text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-medium hover:bg-slate-800/80 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={selectedCategories.length === 0}
                  className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-primary text-primary-foreground rounded-lg sm:rounded-xl text-sm sm:text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Choose Mode */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="text-center mb-4 sm:mb-8">
                <h2 className="text-lg sm:text-2xl font-bold text-white">Choose Extraction Mode</h2>
                <p className="text-xs sm:text-base text-slate-400 mt-1 sm:mt-2">Select between FREE or PAID extraction</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
                {/* FREE Mode */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setExtractionMode("free")}
                  className={`
                    relative p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 text-left transition-all
                    ${extractionMode === "free"
                      ? "border-primary bg-primary/10"
                      : "border-slate-700 bg-slate-900 hover:border-primary/50"
                    }
                  `}
                >
                  {extractionMode === "free" && (
                    <div className="absolute top-2 sm:top-4 right-2 sm:right-4">
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                  )}

                  <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <div className="p-2 sm:p-3 bg-green-500/20 rounded-lg sm:rounded-xl">
                      <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-xl font-bold text-white">FREE Mode</h3>
                      <p className="text-xs sm:text-sm text-green-500 font-medium">$0 / No API Keys</p>
                    </div>
                  </div>

                  <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-slate-400">
                    <li className="flex items-center gap-2">
                      <Brain className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500 flex-shrink-0" />
                      AI/ML NLP Extraction
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                      Deep OSINT
                    </li>
                    <li className="flex items-center gap-2">
                      <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                      7-Level Deep Scraping
                    </li>
                    <li className="flex items-center gap-2">
                      <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500 flex-shrink-0" />
                      50+ Email Patterns
                    </li>
                  </ul>
                </motion.button>

                {/* PAID Mode */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setExtractionMode("paid")}
                  className={`
                    relative p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 text-left transition-all
                    ${extractionMode === "paid"
                      ? "border-primary bg-primary/10"
                      : "border-slate-700 bg-slate-900 hover:border-primary/50"
                    }
                  `}
                >
                  {extractionMode === "paid" && (
                    <div className="absolute top-2 sm:top-4 right-2 sm:right-4">
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                  )}

                  <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <div className="p-2 sm:p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg sm:rounded-xl">
                      <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-xl font-bold text-white">PAID Mode</h3>
                      <p className="text-xs sm:text-sm text-amber-500 font-medium">Enhanced with APIs</p>
                    </div>
                  </div>

                  <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-slate-400">
                    <li className="flex items-center gap-2">
                      <Check className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500 flex-shrink-0" />
                      Everything in FREE +
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500 flex-shrink-0" />
                      Hunter.io Verification
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500 flex-shrink-0" />
                      Clearbit Enrichment
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500 flex-shrink-0" />
                      Apollo.io Contacts
                    </li>
                  </ul>
                </motion.button>
              </div>

              {/* API Keys for paid mode */}
              {extractionMode === "paid" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 sm:mt-6 p-4 sm:p-6 bg-slate-900 border border-slate-700 rounded-xl max-w-4xl mx-auto"
                >
                  <h4 className="font-semibold text-sm sm:text-base text-white mb-3 sm:mb-4">API Keys (Optional)</h4>
                  <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-white mb-1">Hunter.io</label>
                      <input
                        type="password"
                        value={config.hunterApiKey}
                        onChange={(e) => setConfig({ ...config, hunterApiKey: e.target.value })}
                        placeholder="API key..."
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-white mb-1">Clearbit</label>
                      <input
                        type="password"
                        value={config.clearbitApiKey}
                        onChange={(e) => setConfig({ ...config, clearbitApiKey: e.target.value })}
                        placeholder="API key..."
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-white mb-1">Apollo.io</label>
                      <input
                        type="password"
                        value={config.apolloApiKey}
                        onChange={(e) => setConfig({ ...config, apolloApiKey: e.target.value })}
                        placeholder="API key..."
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Configuration */}
              <div className="mt-4 sm:mt-6 p-4 sm:p-6 bg-slate-900 border border-slate-700 rounded-xl max-w-4xl mx-auto">
                <h4 className="font-semibold text-sm sm:text-base text-white mb-3 sm:mb-4 flex items-center gap-2">
                  <Cpu className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  Extraction Settings
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-white mb-1">Max Companies</label>
                    <input
                      type="number"
                      value={config.maxCompanies}
                      onChange={(e) => setConfig({ ...config, maxCompanies: parseInt(e.target.value) || 200 })}
                      min={50}
                      max={1000}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-white mb-1">Apps/Category</label>
                    <input
                      type="number"
                      value={config.maxAppsPerCategory}
                      onChange={(e) => setConfig({ ...config, maxAppsPerCategory: parseInt(e.target.value) || 100 })}
                      min={20}
                      max={500}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-white mb-1">Scrape Depth</label>
                    <input
                      type="number"
                      value={config.websiteScrapeDepth}
                      onChange={(e) => setConfig({ ...config, websiteScrapeDepth: parseInt(e.target.value) || 7 })}
                      min={1}
                      max={10}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-white mb-1">Target Contacts</label>
                    <input
                      type="number"
                      value={config.targetContacts}
                      onChange={(e) => setConfig({ ...config, targetContacts: Math.min(5000, Math.max(100, parseInt(e.target.value) || 1000)) })}
                      min={100}
                      max={5000}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Target Contacts Slider - Prominent */}
                <div className="mt-4 p-4 bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-white flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" />
                      Extraction Target
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-primary">{config.targetContacts.toLocaleString()}</span>
                      <span className="text-xs text-slate-400">contacts</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={100}
                    max={5000}
                    step={100}
                    value={config.targetContacts}
                    onChange={(e) => setConfig({ ...config, targetContacts: parseInt(e.target.value) })}
                    className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between mt-2 text-[10px] text-slate-400">
                    <span>100</span>
                    <span>1,000</span>
                    <span>2,500</span>
                    <span>5,000</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">
                    The extraction will attempt to find this many contacts. Higher targets may take longer.
                  </p>
                </div>
              </div>

              <div className="flex justify-between mt-6 sm:mt-8 max-w-4xl mx-auto">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-slate-800 text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-medium hover:bg-slate-800/80 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={startExtraction}
                  disabled={isExtracting}
                  className="flex items-center gap-2 px-4 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-primary via-accent to-purple-600 text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity shadow-lg shadow-primary/30"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden sm:inline">Start ULTRA Extraction</span>
                      <span className="sm:hidden">Start</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Extraction & Results */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 sm:space-y-6"
            >
              {/* Mobile Live Feed Toggle */}
              {isExtracting && (
                <div className="lg:hidden flex justify-end">
                  <button
                    onClick={() => setShowMobileFeed(!showMobileFeed)}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm"
                  >
                    <Terminal className="w-4 h-4 text-green-500" />
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Live Feed ({liveContacts.length})
                    <ChevronDown className={`w-4 h-4 transition-transform ${showMobileFeed ? "rotate-180" : ""}`} />
                  </button>
                </div>
              )}

              {/* Mobile Live Feed Panel */}
              <AnimatePresence>
                {isExtracting && showMobileFeed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="lg:hidden overflow-hidden"
                  >
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 max-h-60 overflow-y-auto space-y-2">
                      {liveContacts.slice(0, 10).map((contact) => (
                        <LiveContactItem key={contact.id} contact={contact} compact />
                      ))}
                      {liveContacts.length === 0 && (
                        <div className="text-center text-slate-400 py-4">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                          <p className="text-xs">Waiting for contacts...</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Status Dashboard + Live Feed */}
              {isExtracting && (
                <div className={`grid gap-4 sm:gap-6 ${
                  feedSize === "collapsed" ? "lg:grid-cols-1" :
                  feedSize === "small" ? "lg:grid-cols-4" :
                  feedSize === "large" ? "lg:grid-cols-2" :
                  "lg:grid-cols-3"
                }`}>
                  {/* Status Dashboard */}
                  <div className={`space-y-4 sm:space-y-6 ${
                    feedSize === "collapsed" ? "lg:col-span-1" :
                    feedSize === "small" ? "lg:col-span-3" :
                    feedSize === "large" ? "lg:col-span-1" :
                    "lg:col-span-2"
                  }`}>
                    {/* Main Progress */}
                    <div className="p-4 sm:p-6 bg-slate-900 border border-slate-700 rounded-xl">
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-sm sm:text-base text-white flex items-center gap-2">
                            <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-primary animate-pulse" />
                            <span className="hidden sm:inline">ULTRA+OSINT Extraction</span>
                            <span className="sm:hidden">Extracting</span>
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-400 mt-1 truncate">{currentJob?.progress.message}</p>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <span className="text-xl sm:text-3xl font-bold text-primary">{currentJob?.progress.total_progress || 0}%</span>
                        </div>
                      </div>

                      <div className="w-full h-2 sm:h-4 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-primary via-accent to-purple-600"
                          initial={{ width: 0 }}
                          animate={{ width: `${currentJob?.progress.total_progress || 0}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>

                      {/* Target Progress + Cancel Button */}
                      <div className="flex items-center justify-between mt-3 sm:mt-4">
                        <div className="text-xs sm:text-sm">
                          <span className="text-slate-400">Target: {config.targetContacts}</span>
                          <span className={`ml-2 font-medium ${
                            results.length >= config.targetContacts ? "text-green-500" :
                            results.length >= config.targetContacts * 0.5 ? "text-amber-500" :
                            "text-slate-400"
                          }`}>
                            ({results.length} found)
                          </span>
                        </div>
                        <button
                          onClick={cancelExtraction}
                          disabled={isCancelling}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg text-xs sm:text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          {isCancelling ? (
                            <>
                              <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                              Cancelling...
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                              Cancel
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Stats Grid - Responsive */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4">
                      <div className="p-3 sm:p-4 bg-slate-900 border border-slate-700 rounded-xl text-center">
                        <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 mx-auto mb-1 sm:mb-2" />
                        <p className="text-lg sm:text-2xl font-bold text-white">{currentJob?.stats?.apps_found || 0}</p>
                        <p className="text-[10px] sm:text-xs text-slate-400">Apps</p>
                      </div>
                      <div className="p-3 sm:p-4 bg-slate-900 border border-slate-700 rounded-xl text-center">
                        <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500 mx-auto mb-1 sm:mb-2" />
                        <p className="text-lg sm:text-2xl font-bold text-white">{currentJob?.stats?.companies_found || 0}</p>
                        <p className="text-[10px] sm:text-xs text-slate-400">Companies</p>
                      </div>
                      <div className="p-3 sm:p-4 bg-slate-900 border border-slate-700 rounded-xl text-center">
                        <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 mx-auto mb-1 sm:mb-2" />
                        <p className="text-lg sm:text-2xl font-bold text-white">{currentJob?.stats?.emails_found || 0}</p>
                        <p className="text-[10px] sm:text-xs text-slate-400">Emails</p>
                      </div>
                      <div className="p-3 sm:p-4 bg-slate-900 border border-slate-700 rounded-xl text-center">
                        <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-500 mx-auto mb-1 sm:mb-2" />
                        <p className="text-lg sm:text-2xl font-bold text-white">{currentJob?.stats?.emails_verified || 0}</p>
                        <p className="text-[10px] sm:text-xs text-slate-400">Verified</p>
                      </div>
                      <div className="p-3 sm:p-4 bg-slate-900 border border-slate-700 rounded-xl text-center">
                        <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 mx-auto mb-1 sm:mb-2" />
                        <p className="text-lg sm:text-2xl font-bold text-white">{currentJob?.stats?.osint_leadership_found || 0}</p>
                        <p className="text-[10px] sm:text-xs text-slate-400">Leaders</p>
                      </div>
                    </div>

                    {/* Extraction Layers - Responsive Grid */}
                    <div className="p-3 sm:p-4 bg-slate-900 border border-slate-700 rounded-xl">
                      <h4 className="font-semibold text-sm sm:text-base text-white mb-3 sm:mb-4 flex items-center gap-2">
                        <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                        Extraction Layers
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                        {layers.map(layer => (
                          <LayerStatus key={layer.id} layer={layer} compact />
                        ))}
                      </div>
                    </div>

                    {/* Errors */}
                    {errors.length > 0 && (
                      <div className="p-3 sm:p-4 bg-slate-900 border border-slate-700 rounded-xl">
                        <h4 className="font-semibold text-sm text-white mb-2 sm:mb-3 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          Warnings ({errors.length})
                        </h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {errors.slice(0, 5).map(error => (
                            <ErrorItem key={error.id} error={error} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Live Feed Panel - Desktop Only */}
                  {feedSize === "collapsed" ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="hidden lg:block fixed bottom-6 right-6 z-50"
                    >
                      <button
                        onClick={() => setFeedSize("medium")}
                        className="flex items-center gap-3 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl shadow-xl hover:shadow-2xl transition-all hover:scale-105"
                      >
                        <div className="relative">
                          <Terminal className="w-5 h-5 text-green-500" />
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-semibold text-white">{liveContacts.length} Found</p>
                          <p className="text-xs text-slate-400">{currentJob?.progress.stage || "Running..."}</p>
                        </div>
                        <PanelRight className="w-4 h-4 text-slate-400 ml-2" />
                      </button>
                    </motion.div>
                  ) : (
                    <div className="hidden lg:block lg:col-span-1">
                      <motion.div
                        layout
                        className={`p-4 bg-slate-900 border border-slate-700 rounded-xl sticky top-24 flex flex-col transition-all ${
                          feedSize === "small" ? "max-h-[300px]" :
                          feedSize === "large" ? "max-h-[calc(100vh-8rem)]" :
                          "max-h-[500px]"
                        }`}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-white flex items-center gap-2">
                            <Terminal className="w-5 h-5 text-green-500" />
                            Live Feed
                            <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-500 rounded-full">
                              {liveContacts.length}
                            </span>
                          </h4>
                          <div className="flex items-center gap-1">
                            <span className="flex items-center gap-1 text-xs text-green-500 mr-2">
                              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                              Live
                            </span>
                            <div className="flex items-center gap-0.5 p-1 bg-slate-800 rounded-lg">
                              <button
                                onClick={() => setFeedSize("small")}
                                className={`p-1.5 rounded ${feedSize === "small" ? "bg-slate-900 shadow" : ""}`}
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setFeedSize("medium")}
                                className={`p-1.5 rounded ${feedSize === "medium" ? "bg-slate-900 shadow" : ""}`}
                              >
                                <Minimize2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setFeedSize("large")}
                                className={`p-1.5 rounded ${feedSize === "large" ? "bg-slate-900 shadow" : ""}`}
                              >
                                <Maximize2 className="w-3 h-3" />
                              </button>
                            </div>
                            <button
                              onClick={() => setFeedSize("collapsed")}
                              className="p-1.5 hover:bg-slate-800 rounded-lg ml-1"
                            >
                              <PanelRightClose className="w-4 h-4 text-slate-400" />
                            </button>
                          </div>
                        </div>

                        {/* Feed Content */}
                        <div ref={liveContactsRef} className="flex-1 overflow-y-auto space-y-2 pr-2">
                          <AnimatePresence mode="popLayout">
                            {liveContacts.map((contact, idx) => (
                              <motion.div
                                key={contact.id}
                                initial={{ opacity: 0, x: 50, scale: 0.8 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: -20 }}
                              >
                                <LiveContactItem contact={contact} />
                              </motion.div>
                            ))}
                          </AnimatePresence>
                          {liveContacts.length === 0 && (
                            <div className="text-center text-slate-400 py-8">
                              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                              <p className="text-sm">Waiting for contacts...</p>
                            </div>
                          )}
                        </div>

                        {/* Quick Stats */}
                        <div className="mt-3 pt-3 border-t border-slate-700 grid grid-cols-5 gap-1 text-center">
                          <div>
                            <p className="text-sm font-bold text-cyan-500">{liveContacts.filter(c => c.type === "app").length}</p>
                            <p className="text-[9px] text-slate-400">Apps</p>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-blue-500">{liveContacts.filter(c => c.type === "company").length}</p>
                            <p className="text-[9px] text-slate-400">Co.</p>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-green-500">{liveContacts.filter(c => c.type === "email").length}</p>
                            <p className="text-[9px] text-slate-400">Email</p>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-purple-500">{liveContacts.filter(c => c.type === "person").length}</p>
                            <p className="text-[9px] text-slate-400">People</p>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-amber-500">{liveContacts.filter(c => c.type === "leadership").length}</p>
                            <p className="text-[9px] text-slate-400">Lead</p>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </div>
              )}

              {/* Live Results Preview */}
              {isExtracting && results.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3 sm:space-y-4"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="font-semibold text-sm sm:text-base text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary animate-pulse" />
                      Live Results
                      <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full">
                        +{results.length}
                      </span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    <AnimatePresence mode="popLayout">
                      {results.slice(0, 8).map((result, idx) => (
                        <motion.div
                          key={`live-${result.company_name}-${idx}`}
                          initial={{ opacity: 0, scale: 0.8, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0, transition: { delay: idx * 0.05 } }}
                          className="relative"
                        >
                          {idx < 2 && (
                            <span className="absolute -top-1 -right-1 z-10 px-1.5 py-0.5 bg-green-500 text-white text-[8px] sm:text-[10px] font-bold rounded-full">
                              NEW
                            </span>
                          )}
                          <ResultCard result={result} onCopyEmail={copyEmail} index={idx} compact />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}

              {/* Results Section */}
              {(currentJob?.status === "completed" || results.length > 0) && !isExtracting && (
                <>
                  {/* Completion Summary */}
                  {currentJob?.status === "completed" && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 sm:p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="p-2 sm:p-3 bg-green-500/20 rounded-full">
                          <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg sm:text-xl font-bold text-white">Extraction Complete!</h3>
                          <p className="text-xs sm:text-sm text-slate-400">
                            Found {results.length} companies with {currentJob?.stats?.emails_found || 0} emails
                          </p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-2xl sm:text-3xl font-bold text-green-500">{results.length}</p>
                          <p className="text-xs sm:text-sm text-slate-400">Total</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Results Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-white">Results</h2>
                      <p className="text-xs sm:text-sm text-slate-400">
                        {filteredResults.length} of {results.length}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      {/* Search */}
                      <div className="relative flex-1 sm:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search..."
                          className="w-full sm:w-48 lg:w-64 pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      {/* View Toggle */}
                      <div className="flex items-center gap-1 p-1 bg-slate-800 rounded-lg">
                        <button
                          onClick={() => setViewMode("cards")}
                          className={`p-1.5 sm:p-2 rounded-md ${viewMode === "cards" ? "bg-slate-900 shadow" : ""}`}
                        >
                          <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setViewMode("table")}
                          className={`p-1.5 sm:p-2 rounded-md ${viewMode === "table" ? "bg-slate-900 shadow" : ""}`}
                        >
                          <Table className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Export */}
                      <div className="flex items-center gap-1 sm:gap-2">
                        <button
                          onClick={() => exportResults("csv")}
                          className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-slate-800 hover:bg-slate-800/80 rounded-lg text-xs sm:text-sm font-medium"
                        >
                          <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden xs:inline">CSV</span>
                        </button>
                        <button
                          onClick={() => exportResults("json")}
                          className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-slate-800 hover:bg-slate-800/80 rounded-lg text-xs sm:text-sm font-medium"
                        >
                          <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden xs:inline">JSON</span>
                        </button>
                        <button
                          onClick={exportToRecipients}
                          className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs sm:text-sm font-medium shadow-lg shadow-emerald-500/20"
                        >
                          <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden xs:inline">Recipients</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Results Grid/Table */}
                  {viewMode === "cards" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
                      {filteredResults.map((result, idx) => (
                        <ResultCard key={idx} result={result} onCopyEmail={copyEmail} index={idx} />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px]">
                          <thead>
                            <tr className="border-b border-slate-700 bg-slate-800/50">
                              <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-white">Company</th>
                              <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-white">App</th>
                              <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-white hidden lg:table-cell">Category</th>
                              <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-white">Email</th>
                              <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-white">Verified</th>
                              <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-white hidden md:table-cell">People</th>
                              <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-white">Score</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredResults.map((result, idx) => (
                              <tr key={idx} className="border-b border-slate-700 hover:bg-slate-800/30">
                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-white max-w-[120px] sm:max-w-[150px] truncate">{result.company_name}</td>
                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-slate-400 max-w-[100px] sm:max-w-[150px] truncate">{result.app_or_product || "-"}</td>
                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-slate-400 hidden lg:table-cell">{result.product_category || "-"}</td>
                                <td className="px-3 sm:px-4 py-2 sm:py-3">
                                  {(result.marketing_email || result.sales_email) ? (
                                    <button
                                      onClick={() => copyEmail(result.marketing_email || result.sales_email!)}
                                      className="text-xs sm:text-sm text-primary hover:underline max-w-[150px] sm:max-w-[180px] truncate block"
                                    >
                                      {result.marketing_email || result.sales_email}
                                    </button>
                                  ) : (
                                    <span className="text-xs sm:text-sm text-slate-400">-</span>
                                  )}
                                </td>
                                <td className="px-3 sm:px-4 py-2 sm:py-3">
                                  {result.email_verification_status ? (
                                    <span className={`
                                      inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium
                                      ${result.email_verification_status === "verified" ? "bg-green-500/20 text-green-500" :
                                        result.email_verification_status === "maybe" ? "bg-amber-500/20 text-amber-500" :
                                        "bg-red-500/20 text-red-500"}
                                    `}>
                                      {result.email_verification_status === "verified" ? (
                                        <><CheckCircle className="w-3 h-3" /></>
                                      ) : result.email_verification_status === "maybe" ? (
                                        <><AlertCircle className="w-3 h-3" /></>
                                      ) : (
                                        <><XCircle className="w-3 h-3" /></>
                                      )}
                                      <span className="hidden sm:inline">
                                        {result.email_verification_status === "verified" ? "Yes" :
                                          result.email_verification_status === "maybe" ? "Maybe" : "No"}
                                      </span>
                                    </span>
                                  ) : (
                                    <span className="text-xs text-slate-400">-</span>
                                  )}
                                </td>
                                <td className="px-3 sm:px-4 py-2 sm:py-3 hidden md:table-cell">
                                  {result.people && result.people.length > 0 ? (
                                    <span className="flex items-center gap-1 text-xs sm:text-sm">
                                      {result.people.some(p => p.role === "leadership") && <Crown className="w-3 h-3 text-amber-500" />}
                                      {result.people.length}
                                    </span>
                                  ) : "-"}
                                </td>
                                <td className="px-3 sm:px-4 py-2 sm:py-3">
                                  <span className={`
                                    px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium
                                    ${result.confidence_score >= 80 ? "bg-green-500/20 text-green-500" :
                                      result.confidence_score >= 50 ? "bg-amber-500/20 text-amber-500" :
                                      "bg-slate-800 text-slate-400"}
                                  `}>
                                    {result.confidence_score}%
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Rerun Options & New Extraction */}
                  <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-slate-900 border border-slate-700 rounded-xl">
                    <h3 className="text-sm sm:text-base font-semibold text-white mb-4 flex items-center gap-2">
                      <ChevronsRight className="w-5 h-5 text-primary" />
                      What's Next?
                    </h3>
                    <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
                      {/* Rerun Same Settings */}
                      {currentJob && (
                        <button
                          onClick={() => rerunJob(currentJob.job_id, "same")}
                          disabled={loadingRerun === `${currentJob.job_id}-same`}
                          className="flex flex-col items-center gap-2 p-4 bg-slate-800/50 hover:bg-slate-800 rounded-xl text-center transition-colors disabled:opacity-50"
                        >
                          {loadingRerun === `${currentJob.job_id}-same` ? (
                            <Loader2 className="w-6 h-6 text-primary animate-spin" />
                          ) : (
                            <Repeat className="w-6 h-6 text-primary" />
                          )}
                          <div>
                            <p className="font-medium text-sm text-white">Rerun Same</p>
                            <p className="text-[10px] text-slate-400">Same demographics & categories</p>
                          </div>
                        </button>
                      )}

                      {/* Rerun + Exclude Found */}
                      {currentJob && results.length > 0 && (
                        <button
                          onClick={() => rerunJob(currentJob.job_id, "same_exclude_found")}
                          disabled={loadingRerun === `${currentJob.job_id}-same_exclude_found`}
                          className="flex flex-col items-center gap-2 p-4 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl text-center transition-colors disabled:opacity-50"
                        >
                          {loadingRerun === `${currentJob.job_id}-same_exclude_found` ? (
                            <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                          ) : (
                            <SkipForward className="w-6 h-6 text-amber-500" />
                          )}
                          <div>
                            <p className="font-medium text-sm text-amber-500">Find More New</p>
                            <p className="text-[10px] text-slate-400">Exclude {results.length} already found</p>
                          </div>
                        </button>
                      )}

                      {/* New Extraction */}
                      <button
                        onClick={() => {
                          setStep(1)
                          setResults([])
                          setCurrentJob(null)
                          setLiveContacts([])
                          setErrors([])
                          setLayers(INITIAL_LAYERS)
                        }}
                        className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20 rounded-xl text-center transition-colors"
                      >
                        <Sparkles className="w-6 h-6 text-primary" />
                        <div>
                          <p className="font-medium text-sm text-white">New Search</p>
                          <p className="text-[10px] text-slate-400">Different settings</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

