"use client";

/**
 * Step 3 (PAID Mode): API Layer Configuration
 * Configure premium APIs for each extraction layer
 * @description Premium API configuration component
 */

import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Globe,
  Bot,
  Brain,
  Mail,
  Shield,
  FileSearch,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Check,
  Key,
  ExternalLink,
  AlertCircle,
  Zap,
  Crown,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Plus,
  Settings2,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface APIConfig {
  [layerId: string]: {
    provider: string;
    apiKey?: string;
    enabled: boolean;
  };
}

interface APILayerConfigProps {
  apiConfig: APIConfig;
  onUpdateConfig: (config: APIConfig) => void;
}

interface APIProvider {
  id: string;
  name: string;
  description: string;
  docsUrl: string;
  pricingTier: string;
  features: string[];
}

interface ExtractionLayer {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  providers: APIProvider[];
  freeAlternative: string;
}

const EXTRACTION_LAYERS: ExtractionLayer[] = [
  {
    id: "search_discovery",
    name: "Search & Discovery",
    description: "Web search APIs for finding target pages and contacts",
    icon: Search,
    color: "blue",
    freeAlternative: "DuckDuckGo + Common Crawl",
    providers: [
      {
        id: "google_custom_search",
        name: "Google Custom Search",
        description: "Official Google search API with 100 free queries/day",
        docsUrl: "https://developers.google.com/custom-search",
        pricingTier: "$5 per 1000 queries",
        features: ["Precision search", "Custom filtering", "Site-specific"],
      },
      {
        id: "bing_search",
        name: "Bing Search API",
        description: "Microsoft Bing web search with good pricing",
        docsUrl: "https://www.microsoft.com/en-us/bing/apis/bing-web-search-api",
        pricingTier: "$3 per 1000 queries",
        features: ["Web search", "News search", "Image search"],
      },
      {
        id: "serp_api",
        name: "SerpAPI",
        description: "Google, Bing, Yahoo scraping with anti-detection",
        docsUrl: "https://serpapi.com",
        pricingTier: "$50/month",
        features: ["Multiple engines", "Real-time data", "No blocks"],
      },
    ],
  },
  {
    id: "contact_database",
    name: "Contact Database",
    description: "B2B contact databases with verified emails",
    icon: Globe,
    color: "purple",
    freeAlternative: "Web scraping + Pattern detection",
    providers: [
      {
        id: "apollo",
        name: "Apollo.io",
        description: "275M+ contacts with verified emails",
        docsUrl: "https://www.apollo.io/docs",
        pricingTier: "Free tier + $49/month",
        features: ["Verified emails", "Direct dials", "Enrichment"],
      },
      {
        id: "zoominfo",
        name: "ZoomInfo",
        description: "Enterprise-grade B2B database",
        docsUrl: "https://www.zoominfo.com",
        pricingTier: "Enterprise pricing",
        features: ["Intent data", "Org charts", "Technographics"],
      },
      {
        id: "lusha",
        name: "Lusha",
        description: "Direct contact info with high accuracy",
        docsUrl: "https://www.lusha.com",
        pricingTier: "$36/month",
        features: ["Phone numbers", "Email finder", "CRM sync"],
      },
    ],
  },
  {
    id: "email_verification",
    name: "Email Verification",
    description: "Verify and validate email addresses",
    icon: Mail,
    color: "green",
    freeAlternative: "DNS/MX validation + Pattern matching",
    providers: [
      {
        id: "hunter",
        name: "Hunter.io",
        description: "Industry standard email finder & verifier",
        docsUrl: "https://hunter.io/api",
        pricingTier: "25 free + $49/month",
        features: ["Email finder", "Verifier", "Domain search"],
      },
      {
        id: "zerobounce",
        name: "ZeroBounce",
        description: "99% accuracy email validation",
        docsUrl: "https://www.zerobounce.net",
        pricingTier: "$0.008/email",
        features: ["Bounce detection", "Abuse check", "Catch-all"],
      },
      {
        id: "neverbounce",
        name: "NeverBounce",
        description: "Real-time email verification",
        docsUrl: "https://neverbounce.com",
        pricingTier: "$0.008/email",
        features: ["Bulk verify", "Real-time API", "List cleaning"],
      },
    ],
  },
  {
    id: "company_enrichment",
    name: "Company Enrichment",
    description: "Enrich company data with firmographics",
    icon: Shield,
    color: "orange",
    freeAlternative: "WHOIS + DNS analysis + Web scraping",
    providers: [
      {
        id: "clearbit",
        name: "Clearbit",
        description: "Complete company & person enrichment",
        docsUrl: "https://clearbit.com/docs",
        pricingTier: "$99/month",
        features: ["Firmographics", "Technographics", "Social profiles"],
      },
      {
        id: "fullcontact",
        name: "FullContact",
        description: "Person & company identity resolution",
        docsUrl: "https://fullcontact.com",
        pricingTier: "$99/month",
        features: ["Identity graph", "Social enrichment", "Tags"],
      },
      {
        id: "crunchbase",
        name: "Crunchbase",
        description: "Company funding & growth data",
        docsUrl: "https://www.crunchbase.com/api",
        pricingTier: "$99/month",
        features: ["Funding data", "Investors", "News"],
      },
    ],
  },
  {
    id: "social_data",
    name: "Social & LinkedIn Data",
    description: "Extract LinkedIn profiles and social data",
    icon: Bot,
    color: "cyan",
    freeAlternative: "Public profile scraping",
    providers: [
      {
        id: "proxycurl",
        name: "ProxyCurl",
        description: "LinkedIn profile API - compliant & fast",
        docsUrl: "https://nubela.co/proxycurl",
        pricingTier: "$10 for 100 credits",
        features: ["Profile data", "Company data", "Job listings"],
      },
      {
        id: "peopledatalabs",
        name: "People Data Labs",
        description: "1.5B person records with rich data",
        docsUrl: "https://peopledatalabs.com",
        pricingTier: "$0.03/record",
        features: ["Social profiles", "Work history", "Education"],
      },
      {
        id: "coresignal",
        name: "Coresignal",
        description: "Fresh B2B data from public sources",
        docsUrl: "https://coresignal.com",
        pricingTier: "Custom pricing",
        features: ["Employee data", "Company insights", "Job data"],
      },
    ],
  },
  {
    id: "ai_extraction",
    name: "AI-Powered Extraction",
    description: "Advanced AI for intelligent data extraction",
    icon: Brain,
    color: "pink",
    freeAlternative: "Local SpaCy NER + BERT models",
    providers: [
      {
        id: "anthropic",
        name: "Claude API",
        description: "Best-in-class for structured extraction",
        docsUrl: "https://docs.anthropic.com",
        pricingTier: "$3/$15 per 1M tokens",
        features: ["Structured output", "Multi-modal", "Long context"],
      },
      {
        id: "openai",
        name: "OpenAI GPT-4",
        description: "Powerful general-purpose extraction",
        docsUrl: "https://platform.openai.com/docs",
        pricingTier: "$10/$30 per 1M tokens",
        features: ["Function calling", "Vision", "Fine-tuning"],
      },
      {
        id: "cohere",
        name: "Cohere",
        description: "Enterprise NLP & extraction",
        docsUrl: "https://docs.cohere.com",
        pricingTier: "$1 per 1M tokens",
        features: ["Classify", "Extract", "Summarize"],
      },
    ],
  },
  {
    id: "document_parsing",
    name: "Document Parsing",
    description: "Extract data from PDFs, DOCXs, and more",
    icon: FileSearch,
    color: "indigo",
    freeAlternative: "PyMuPDF + python-docx + Local OCR",
    providers: [
      {
        id: "docparser",
        name: "DocParser",
        description: "Smart document data extraction",
        docsUrl: "https://docparser.com",
        pricingTier: "$39/month",
        features: ["Resume parsing", "Invoice extraction", "Templates"],
      },
      {
        id: "textract",
        name: "AWS Textract",
        description: "ML-powered document analysis",
        docsUrl: "https://aws.amazon.com/textract",
        pricingTier: "$1.50/1000 pages",
        features: ["OCR", "Tables", "Forms"],
      },
      {
        id: "affinda",
        name: "Affinda Resume Parser",
        description: "Specialized resume/CV parsing",
        docsUrl: "https://affinda.com",
        pricingTier: "$0.10/document",
        features: ["Resume parsing", "Skills extraction", "Standardization"],
      },
    ],
  },
  {
    id: "captcha_solving",
    name: "CAPTCHA Solving",
    description: "Bypass CAPTCHAs when scraping",
    icon: Sparkles,
    color: "amber",
    freeAlternative: "Basic retry + Playwright stealth mode",
    providers: [
      {
        id: "2captcha",
        name: "2Captcha",
        description: "Human CAPTCHA solving service",
        docsUrl: "https://2captcha.com",
        pricingTier: "$2.99/1000 CAPTCHAs",
        features: ["reCAPTCHA", "hCaptcha", "Image CAPTCHA"],
      },
      {
        id: "anticaptcha",
        name: "Anti-Captcha",
        description: "Fast CAPTCHA bypass with high accuracy",
        docsUrl: "https://anti-captcha.com",
        pricingTier: "$2/1000 CAPTCHAs",
        features: ["All types", "Fast solving", "API"],
      },
      {
        id: "capsolver",
        name: "CapSolver",
        description: "AI-powered CAPTCHA solving",
        docsUrl: "https://capsolver.com",
        pricingTier: "$0.8/1000 CAPTCHAs",
        features: ["AI solving", "Browser extension", "Fast"],
      },
    ],
  },
];

const colorClasses: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  blue: { bg: "bg-blue-500/20", border: "border-blue-500/50", text: "text-blue-400", glow: "shadow-blue-500/30" },
  purple: { bg: "bg-purple-500/20", border: "border-purple-500/50", text: "text-purple-400", glow: "shadow-purple-500/30" },
  green: { bg: "bg-emerald-500/20", border: "border-emerald-500/50", text: "text-emerald-400", glow: "shadow-emerald-500/30" },
  orange: { bg: "bg-orange-500/20", border: "border-orange-500/50", text: "text-orange-400", glow: "shadow-orange-500/30" },
  cyan: { bg: "bg-cyan-500/20", border: "border-cyan-500/50", text: "text-cyan-400", glow: "shadow-cyan-500/30" },
  pink: { bg: "bg-pink-500/20", border: "border-pink-500/50", text: "text-pink-400", glow: "shadow-pink-500/30" },
  indigo: { bg: "bg-indigo-500/20", border: "border-indigo-500/50", text: "text-indigo-400", glow: "shadow-indigo-500/30" },
  amber: { bg: "bg-amber-500/20", border: "border-amber-500/50", text: "text-amber-400", glow: "shadow-amber-500/30" },
};

export function APILayerConfig({ apiConfig, onUpdateConfig }: APILayerConfigProps) {
  const [expandedLayer, setExpandedLayer] = useState<string | null>(null);
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});

  const toggleLayer = (layerId: string) => {
    setExpandedLayer(expandedLayer === layerId ? null : layerId);
  };

  const selectProvider = (layerId: string, providerId: string) => {
    onUpdateConfig({
      ...apiConfig,
      [layerId]: {
        ...apiConfig[layerId],
        provider: providerId,
        enabled: true,
      },
    });
  };

  const setApiKey = (layerId: string, apiKey: string) => {
    onUpdateConfig({
      ...apiConfig,
      [layerId]: {
        ...apiConfig[layerId],
        apiKey,
      },
    });
  };

  const toggleLayerEnabled = (layerId: string) => {
    onUpdateConfig({
      ...apiConfig,
      [layerId]: {
        ...apiConfig[layerId],
        enabled: !apiConfig[layerId]?.enabled,
      },
    });
  };

  const configuredCount = Object.values(apiConfig).filter(c => c?.enabled && c?.provider).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
              <Settings2 className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Configure Premium APIs</h2>
              <p className="text-slate-400">Select and configure APIs for each extraction layer</p>
            </div>
          </div>
        </div>

        {/* Progress Badge */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <Layers className="w-4 h-4 text-amber-400" />
          <span className="text-sm text-slate-300">
            <span className="font-semibold text-white">{configuredCount}</span>
            /{EXTRACTION_LAYERS.length} layers configured
          </span>
        </div>
      </div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-start gap-3"
      >
        <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-blue-300 text-sm">
            <span className="font-semibold">Tip:</span> You don't need to configure all layers.
            Unconfigured layers will use the FREE alternatives automatically.
            API keys are stored locally and never sent to our servers.
          </p>
        </div>
      </motion.div>

      {/* Layers List */}
      <div className="space-y-4">
        {EXTRACTION_LAYERS.map((layer, idx) => {
          const Icon = layer.icon;
          const colors = colorClasses[layer.color];
          const isExpanded = expandedLayer === layer.id;
          const config = apiConfig[layer.id];
          const isEnabled = config?.enabled;
          const selectedProvider = layer.providers.find(p => p.id === config?.provider);

          return (
            <motion.div
              key={layer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`
                rounded-2xl border-2 overflow-hidden transition-all duration-300
                ${isEnabled
                  ? `${colors.border} bg-slate-800/50 shadow-lg ${colors.glow}`
                  : "border-slate-700/50 bg-slate-800/30"}
              `}
            >
              {/* Layer Header */}
              <div
                onClick={() => toggleLayer(layer.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && toggleLayer(layer.id)}
                className="w-full p-5 flex items-center justify-between hover:bg-slate-700/20 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className={`p-3 rounded-xl ${colors.bg}`}>
                    <Icon className={`w-6 h-6 ${colors.text}`} />
                  </div>

                  {/* Info */}
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-white">{layer.name}</h3>
                      {isEnabled && selectedProvider && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                          {selectedProvider.name}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400">{layer.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Enable Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLayerEnabled(layer.id);
                    }}
                    className={`
                      relative w-14 h-7 rounded-full transition-colors
                      ${isEnabled ? "bg-emerald-500" : "bg-slate-600"}
                    `}
                  >
                    <motion.div
                      animate={{ x: isEnabled ? 28 : 4 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md"
                    />
                  </button>

                  {/* Expand Icon */}
                  <div className={`p-2 rounded-lg transition-colors ${isExpanded ? colors.bg : "bg-slate-700/50"}`}>
                    {isExpanded
                      ? <ChevronUp className={`w-5 h-5 ${colors.text}`} />
                      : <ChevronDown className="w-5 h-5 text-slate-400" />
                    }
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 pt-2 border-t border-slate-700/50">
                      {/* Free Alternative Info */}
                      <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-emerald-400" />
                          <span className="text-sm text-emerald-300">
                            <span className="font-semibold">FREE fallback:</span> {layer.freeAlternative}
                          </span>
                        </div>
                      </div>

                      {/* Provider Options */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Crown className="w-4 h-4 text-amber-400" />
                          <span className="text-sm font-medium text-slate-300">Premium API Options:</span>
                        </div>

                        {layer.providers.map((provider) => {
                          const isSelected = config?.provider === provider.id;

                          return (
                            <motion.div
                              key={provider.id}
                              whileHover={{ scale: 1.01 }}
                              className={`
                                p-4 rounded-xl border-2 cursor-pointer transition-all
                                ${isSelected
                                  ? `${colors.border} ${colors.bg}`
                                  : "border-slate-700/50 bg-slate-800/30 hover:border-slate-600"}
                              `}
                              onClick={() => selectProvider(layer.id, provider.id)}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className={`
                                    w-5 h-5 rounded-full border-2 flex items-center justify-center
                                    ${isSelected ? `${colors.border} ${colors.bg}` : "border-slate-600"}
                                  `}>
                                    {isSelected && <Check className={`w-3 h-3 ${colors.text}`} />}
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-white">{provider.name}</h4>
                                    <p className="text-sm text-slate-400">{provider.description}</p>
                                  </div>
                                </div>
                                <span className="text-xs px-2 py-1 rounded-md bg-slate-700/50 text-slate-300">
                                  {provider.pricingTier}
                                </span>
                              </div>

                              {/* Features */}
                              <div className="flex flex-wrap gap-2 mb-3">
                                {provider.features.map((feature, fidx) => (
                                  <span
                                    key={fidx}
                                    className="text-xs px-2 py-1 rounded-md bg-slate-700/30 text-slate-400"
                                  >
                                    {feature}
                                  </span>
                                ))}
                              </div>

                              {/* API Key Input (only for selected) */}
                              {isSelected && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  className="mt-4 pt-4 border-t border-slate-700/50"
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    <Key className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm text-slate-300">API Key:</span>
                                    <a
                                      href={provider.docsUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                    >
                                      Get API Key <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                      <Input
                                        type={showApiKeys[layer.id] ? "text" : "password"}
                                        placeholder="Enter your API key..."
                                        value={config?.apiKey || ""}
                                        onChange={(e) => setApiKey(layer.id, e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="bg-slate-900/50 border-slate-700 text-white pr-10"
                                      />
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setShowApiKeys({ ...showApiKeys, [layer.id]: !showApiKeys[layer.id] });
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                      >
                                        {showApiKeys[layer.id]
                                          ? <EyeOff className="w-4 h-4" />
                                          : <Eye className="w-4 h-4" />
                                        }
                                      </button>
                                    </div>
                                    {config?.apiKey && (
                                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/20">
              <CheckCircle2 className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h4 className="text-white font-semibold mb-1">Configuration Summary</h4>
              <p className="text-slate-400 text-sm">
                {configuredCount === 0 ? (
                  "No premium APIs configured. All layers will use FREE alternatives."
                ) : configuredCount === EXTRACTION_LAYERS.length ? (
                  "All layers configured with premium APIs. Maximum performance enabled!"
                ) : (
                  `${configuredCount} layer(s) will use premium APIs, ${EXTRACTION_LAYERS.length - configuredCount} will use FREE alternatives.`
                )}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{configuredCount}/{EXTRACTION_LAYERS.length}</div>
            <div className="text-sm text-slate-400">Layers configured</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
