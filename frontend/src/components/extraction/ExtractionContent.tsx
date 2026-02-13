"use client";

/**
 * ULTRA PRO MAX EXTRACTION ENGINE V2.0 - Main Page
 * 7-Step Wizard with FREE/PAID Mode Selection
 *
 * Flow:
 * 1. Sector & Demographics Selection
 * 2. Mode Selection (FREE vs PAID)
 * 3. API Configuration (PAID) / Source Input (FREE)
 * 4. Filter Builder
 * 5. Extraction Progress
 * 6. Data Review
 * 7. Integration
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Zap,
  Crown,
  Rocket,
  Sparkles,
  Target,
  Settings2,
  Filter,
  Play,
  Eye,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { extractionAPI, ExtractionResult } from "@/lib/api";
import { CampaignRecipient } from "@/types";
import { toast } from "sonner";

// Step Components
import { SectorSelector, SectorType, DemographicsConfig } from "@/components/extraction/SectorSelector";
import { ModeSelector, ExtractionMode } from "@/components/extraction/ModeSelector";
import { APILayerConfig, APIConfig } from "@/components/extraction/APILayerConfig";
import { SourceConfiguration } from "@/components/extraction/SourceConfiguration";
import { FilterBuilder } from "@/components/extraction/FilterBuilder";
import { ProgressDashboard } from "@/components/extraction/ProgressDashboard";
import { DataReview } from "@/components/extraction/DataReview";
import Integration from "@/components/extraction/Integration";

// Types
type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface ExtractionConfig {
  sector?: SectorType;
  demographics: DemographicsConfig;
  mode?: ExtractionMode;
  apiConfig: APIConfig;
  sources: {
    urls?: string[];
    files?: string[];
    directories?: any[];
  };
  filters: {
    basic?: {
      job_titles?: string[];
      locations?: string[];
      industries?: string[];
      company_sizes?: string[];
    };
    advanced?: {
      revenue_ranges?: string[];
      tech_stack?: string[];
      funding_status?: string[];
      keywords?: string[];
    };
  };
  options: {
    depth: number;
    follow_external: boolean;
    use_playwright: boolean;
    rate_limit: number;
    max_records: number;
  };
}

const WIZARD_STEPS = [
  {
    number: 1,
    label: "Target",
    description: "Sector & Demographics",
    icon: Target,
    color: "blue",
  },
  {
    number: 2,
    label: "Mode",
    description: "FREE or PAID",
    icon: Zap,
    color: "emerald",
  },
  {
    number: 3,
    label: "Configure",
    description: "APIs / Sources",
    icon: Settings2,
    color: "purple",
  },
  {
    number: 4,
    label: "Filters",
    description: "Search criteria",
    icon: Filter,
    color: "orange",
  },
  {
    number: 5,
    label: "Extract",
    description: "Run extraction",
    icon: Play,
    color: "pink",
  },
  {
    number: 6,
    label: "Review",
    description: "Review & export",
    icon: Eye,
    color: "cyan",
  },
  {
    number: 7,
    label: "Integrate",
    description: "Import data",
    icon: Upload,
    color: "amber",
  },
];

const stepColors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  blue: { bg: "bg-blue-500", border: "border-blue-400", text: "text-blue-400", glow: "shadow-blue-500/50" },
  emerald: { bg: "bg-emerald-500", border: "border-emerald-400", text: "text-emerald-400", glow: "shadow-emerald-500/50" },
  purple: { bg: "bg-purple-500", border: "border-purple-400", text: "text-purple-400", glow: "shadow-purple-500/50" },
  orange: { bg: "bg-orange-500", border: "border-orange-400", text: "text-orange-400", glow: "shadow-orange-500/50" },
  pink: { bg: "bg-pink-500", border: "border-pink-400", text: "text-pink-400", glow: "shadow-pink-500/50" },
  cyan: { bg: "bg-cyan-500", border: "border-cyan-400", text: "text-cyan-400", glow: "shadow-cyan-500/50" },
  amber: { bg: "bg-amber-500", border: "border-amber-400", text: "text-amber-400", glow: "shadow-amber-500/50" },
};

// Props interface for when used as embedded component
export interface ExtractionContentProps {
  onRecipientsSelected?: (recipients: CampaignRecipient[], count: number) => void;
  initialJobId?: number;
  onJobCreated?: (jobId: number) => void;
}

// Main content component - can be used embedded or standalone
export function ExtractionContent(props?: ExtractionContentProps) {
  const onRecipientsSelected = props?.onRecipientsSelected;
  const [currentStep, setCurrentStep] = useState<WizardStep>(props?.initialJobId ? 5 : 1);
  const [jobId, setJobId] = useState<number | null>(props?.initialJobId ?? null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isExtracting, setIsExtracting] = useState(!!props?.initialJobId);
  const [extractionResults, setExtractionResults] = useState<ExtractionResult[]>([]);
  const [isExtractionComplete, setIsExtractionComplete] = useState(false);
  const recipientsPushedRef = useRef(false);
  const importedHandledRef = useRef(false);

  // Extraction configuration
  const [config, setConfig] = useState<ExtractionConfig>({
    demographics: {
      regions: [],
      companySizes: [],
      industries: [],
      customKeywords: [],
    },
    apiConfig: {},
    sources: {},
    filters: {},
    options: {
      depth: 3,
      follow_external: false,
      use_playwright: true,
      rate_limit: 10,
      max_records: 5000,
    },
  });

  // Update config helper
  const updateConfig = useCallback((partial: Partial<ExtractionConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  // Navigation handlers
  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return config.sector !== undefined;
      case 2:
        return config.mode !== undefined;
      case 3:
        // For FREE mode, always allow to proceed
        // For PAID mode, at least one source or API should be configured
        if (config.mode === "free") {
          return true;
        }
        return (
          Object.keys(config.apiConfig).length > 0 ||
          (config.sources.urls && config.sources.urls.length > 0) ||
          (config.sources.files && config.sources.files.length > 0)
        );
      case 4:
        return true; // Filters are optional
      case 5:
        return jobId !== null; // Extraction must be started
      case 6:
        return jobId !== null; // Must have results
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (canGoNext() && currentStep < 7) {
      setCompletedSteps((prev) => new Set(prev).add(currentStep));

      // For FREE mode, skip to step 4 (filters) from step 2 if user wants quick start
      // But we still show step 3 for optional URL input
      setCurrentStep((prev) => (prev + 1) as WizardStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep);
    }
  };

  const handleStepClick = (step: number) => {
    // Can only go to completed steps or current step
    if (step <= currentStep || completedSteps.has(step - 1)) {
      setCurrentStep(step as WizardStep);
    }
  };

  // Check for existing running jobs on mount (only if we weren't passed an initial job)
  useEffect(() => {
    if (props?.initialJobId) return;

    const checkExistingJobs = async () => {
      try {
        const { data } = await extractionAPI.listJobs({ status: "running" as any });
        const runningJob = data?.items?.[0];

        if (runningJob && runningJob.status === "running") {
          console.log("[Extraction] Found running job, resuming:", runningJob.id);
          setJobId(runningJob.id);
          setCurrentStep(5);
          setIsExtracting(true);
          setConfig((prev) => ({
            ...prev,
            mode: runningJob.config?.use_paid_apis ? "paid" : "free",
            sector: (runningJob.config?.sector || prev.sector) as SectorType | undefined,
          }));
          props?.onJobCreated?.(runningJob.id);
          toast.info(`Resuming extraction job at ${runningJob.progress || 0}%`);
        }
      } catch (error) {
        console.error("[Extraction] Error checking existing jobs:", error);
      }
    };

    checkExistingJobs();
  }, [props?.initialJobId, props?.onJobCreated]);

  // Auto-start extraction for FREE mode when reaching step 5
  useEffect(() => {
    if (currentStep === 5 && config.mode === "free" && !jobId && !isExtracting) {
      // The ProgressDashboard will handle auto-starting for free mode
    }
  }, [currentStep, config.mode, jobId, isExtracting]);

  // Fetch extraction results when moving to step 7
  useEffect(() => {
    const fetchResults = async () => {
      if (currentStep === 7 && jobId && extractionResults.length === 0) {
        try {
          const { data } = await extractionAPI.getResults(jobId, {
            page: 1,
            limit: 500 // Fetch a reasonable number of results
          });

          const results = data.items || [];
          setExtractionResults(results);
          console.log(`📊 [Extraction] Loaded ${results.length} results for Integration`);
        } catch (error: any) {
          console.error("Failed to fetch extraction results:", error);
          toast.error("Failed to load extraction results", {
            description: error.message
          });
        }
      }
    };

    fetchResults();
  }, [currentStep, jobId, extractionResults.length]);

  useEffect(() => {
    if (!onRecipientsSelected) return;
    if (!isExtractionComplete || extractionResults.length === 0) return;
    if (recipientsPushedRef.current || importedHandledRef.current) return;

    const mappedRecipients = extractionResults
      .map((result) => ({
        email: result.data?.email || "",
        name: result.data?.name,
        company: result.data?.company,
        position: result.data?.title,
        linkedinUrl: result.data?.linkedin_url,
        website: result.data?.website,
      }))
      .filter((recipient) => recipient.email);

    if (mappedRecipients.length === 0) return;

    recipientsPushedRef.current = true;
    onRecipientsSelected(mappedRecipients, mappedRecipients.length);
  }, [onRecipientsSelected, isExtractionComplete, extractionResults]);

  useEffect(() => {
    recipientsPushedRef.current = false;
  }, [jobId]);

  // Calculate overall progress
  const overallProgress = (currentStep / 7) * 100;

  // Get current step info
  const currentStepInfo = WIZARD_STEPS.find((s) => s.number === currentStep);
  const currentStepColor = currentStepInfo ? stepColors[currentStepInfo.color] : stepColors.blue;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-purple-500/5 rounded-full blur-3xl" />
        {config.mode === "free" && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 bg-emerald-500/5 rounded-full blur-3xl" />
        )}
        {config.mode === "paid" && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 bg-amber-500/5 rounded-full blur-3xl" />
        )}
      </div>

      {/* Header */}
      <div className="relative border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Logo/Icon */}
              <motion.div
                animate={{
                  boxShadow: [
                    "0 0 20px rgba(59, 130, 246, 0.3)",
                    "0 0 40px rgba(139, 92, 246, 0.3)",
                    "0 0 20px rgba(59, 130, 246, 0.3)",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600"
              >
                <Rocket className="w-8 h-8 text-white" />
              </motion.div>

              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-white">
                    ULTRA PRO MAX EXTRACTION ENGINE
                  </h1>
                  <span className="px-2 py-1 rounded-md bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-xs font-semibold text-blue-300">
                    V2.0
                  </span>
                </div>
                <p className="text-slate-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  9-Layer Multi-Source Data Extraction & Intelligence Gathering
                </p>
              </div>
            </div>

            {/* Mode Badge + Progress */}
            <div className="flex items-center gap-4">
              {config.mode && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-xl border
                    ${config.mode === "free"
                      ? "bg-emerald-500/20 border-emerald-500/50"
                      : "bg-amber-500/20 border-amber-500/50"}
                  `}
                >
                  {config.mode === "free" ? (
                    <>
                      <Zap className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-semibold text-emerald-300">FREE MODE</span>
                    </>
                  ) : (
                    <>
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-semibold text-amber-300">PAID MODE</span>
                    </>
                  )}
                </motion.div>
              )}

              {/* Overall Progress */}
              <div className="w-48">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Progress</span>
                  <span className="text-sm font-semibold text-white">
                    {Math.round(overallProgress)}%
                  </span>
                </div>
                <Progress value={overallProgress} className="h-2" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wizard Steps Indicator */}
      <div className="relative border-b border-slate-800/50 bg-slate-900/30 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {WIZARD_STEPS.map((step, idx) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = completedSteps.has(step.number);
              const isAccessible = step.number <= currentStep || completedSteps.has(step.number - 1);
              const colors = stepColors[step.color];

              return (
                <div key={step.number} className="flex items-center flex-1">
                  {/* Step Circle */}
                  <button
                    onClick={() => handleStepClick(step.number)}
                    disabled={!isAccessible}
                    className={`
                      relative flex flex-col items-center group
                      ${isAccessible ? "cursor-pointer" : "cursor-not-allowed opacity-50"}
                    `}
                  >
                    <motion.div
                      animate={isActive ? {
                        boxShadow: [
                          `0 0 0px transparent`,
                          `0 0 20px ${colors.glow.replace("shadow-", "").replace("/50", "")}`,
                          `0 0 0px transparent`,
                        ],
                      } : {}}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className={`
                        relative z-10 flex items-center justify-center w-12 h-12 rounded-full
                        transition-all duration-300 border-2
                        ${
                          isActive
                            ? `${colors.bg} ${colors.border} shadow-lg ${colors.glow} scale-110`
                            : isCompleted
                              ? "bg-green-600 border-green-500"
                              : "bg-slate-800 border-slate-700"
                        }
                        ${isAccessible && !isActive ? "group-hover:scale-105" : ""}
                      `}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      ) : (
                        <StepIcon className="w-5 h-5 text-white" />
                      )}
                    </motion.div>

                    {/* Step Label */}
                    <div className="mt-2 text-center">
                      <div
                        className={`
                          text-sm font-semibold transition-colors
                          ${isActive ? "text-white" : isCompleted ? "text-green-400" : "text-slate-400"}
                        `}
                      >
                        {step.label}
                      </div>
                      <div className={`text-xs ${isActive ? colors.text : "text-slate-500"}`}>
                        {step.description}
                      </div>
                    </div>
                  </button>

                  {/* Connector Line */}
                  {idx < WIZARD_STEPS.length - 1 && (
                    <div
                      className={`
                        flex-1 h-0.5 mx-4 transition-colors duration-300
                        ${completedSteps.has(step.number) ? "bg-green-600" : "bg-slate-700"}
                      `}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative container mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-xl shadow-2xl">
              <div className="p-8">
                {/* Step 1: Sector & Demographics */}
                {currentStep === 1 && (
                  <SectorSelector
                    selectedSector={config.sector}
                    onSelectSector={(sector) => updateConfig({ sector })}
                    demographics={config.demographics}
                    onUpdateDemographics={(demographics) => updateConfig({ demographics })}
                  />
                )}

                {/* Step 2: Mode Selection */}
                {currentStep === 2 && (
                  <ModeSelector
                    selectedMode={config.mode}
                    onSelectMode={(mode) => updateConfig({ mode })}
                  />
                )}

                {/* Step 3: Configuration (API or Sources) */}
                {currentStep === 3 && (
                  <div>
                    {config.mode === "paid" ? (
                      <APILayerConfig
                        apiConfig={config.apiConfig}
                        onUpdateConfig={(apiConfig) => updateConfig({ apiConfig })}
                      />
                    ) : (
                      <div className="space-y-6">
                        {/* FREE Mode Quick Start Banner */}
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30"
                        >
                          <div className="flex items-start gap-4">
                            <div className="p-3 rounded-xl bg-emerald-500/20">
                              <Zap className="w-8 h-8 text-emerald-400" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-white mb-2">
                                FREE Mode - Quick Start Ready!
                              </h3>
                              <p className="text-slate-300 mb-4">
                                You can skip this step and start extraction immediately! The FREE engine will automatically:
                              </p>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                  "Search DuckDuckGo",
                                  "Crawl websites",
                                  "Use Playwright",
                                  "Run Local AI/ML",
                                  "Find emails via DNS",
                                  "OSINT gathering",
                                  "Parse documents",
                                  "Detect fraud",
                                ].map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10"
                                  >
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span className="text-sm text-emerald-200">{item}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>

                        {/* Optional URL Input */}
                        <div className="text-center py-4">
                          <p className="text-slate-400 mb-2">
                            Optionally, you can provide specific URLs or files to focus the extraction:
                          </p>
                        </div>

                        <SourceConfiguration
                          sources={config.sources}
                          onUpdateSources={(sources) => updateConfig({ sources })}
                          options={config.options}
                          onUpdateOptions={(options) => updateConfig({ options })}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Step 4: Filters */}
                {currentStep === 4 && (
                  <FilterBuilder
                    sector={config.sector!}
                    filters={config.filters}
                    onUpdateFilters={(filters) => updateConfig({ filters })}
                  />
                )}

                {/* Step 5: Extraction Progress */}
                {currentStep === 5 && (
                  <ProgressDashboard
                    config={{
                      ...config,
                      // Pass mode information for the dashboard
                      options: {
                        ...config.options,
                        use_playwright: config.mode === "free" ? true : config.options.use_playwright,
                      },
                    }}
                    jobId={jobId}
                    onJobCreated={(id) => {
                      setJobId(id);
                      props?.onJobCreated?.(id);
                    }}
                    onComplete={handleNext}
                  />
                )}

                {/* Step 6: Data Review */}
                {currentStep === 6 && jobId && (
                  <DataReview jobId={jobId} onExportComplete={handleNext} />
                )}

                {/* Step 7: Integration */}
                {currentStep === 7 && jobId && (
                  <Integration
                    jobId={jobId}
                    results={extractionResults}
                    sector={config.sector || "Technology"}
                    onImported={(recipients) => {
                      if (!onRecipientsSelected) return;
                      importedHandledRef.current = true;
                      recipientsPushedRef.current = true;
                      onRecipientsSelected(recipients, recipients.length);
                    }}
                    onComplete={() => {
                      setIsExtractionComplete(true);
                      // Could navigate to dashboard or show completion message
                    }}
                  />
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between px-8 py-6 border-t border-slate-800/50 bg-slate-900/30">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  className="flex items-center gap-2 border-slate-700 hover:bg-slate-800"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>

                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <span>Step {currentStep} of {WIZARD_STEPS.length}</span>
                  {currentStepInfo && (
                    <>
                      <span className="text-slate-600">|</span>
                      <span className={currentStepColor.text}>{currentStepInfo.label}</span>
                    </>
                  )}
                </div>

                <Button
                  onClick={handleNext}
                  disabled={!canGoNext() || currentStep === 7}
                  className={`
                    flex items-center gap-2 transition-all
                    ${config.mode === "free"
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                      : config.mode === "paid"
                        ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                        : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"}
                  `}
                >
                  {currentStep === 4 ? (
                    <>
                      <Play className="w-4 h-4" />
                      Start Extraction
                    </>
                  ) : currentStep === 2 && config.mode === "free" ? (
                    <>
                      <Zap className="w-4 h-4" />
                      Continue (Skip to Filters)
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="relative border-t border-slate-800/50 bg-slate-900/30 backdrop-blur-sm mt-auto">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <div className="flex items-center gap-4">
              <span>Powered by 9-Layer Extraction Technology</span>
              <span className="text-slate-700">|</span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                System Ready
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span>FREE: DuckDuckGo, Playwright, SpaCy, BERT</span>
              <span className="text-slate-700">|</span>
              <span>PAID: Google, Hunter, Apollo, Claude AI</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
