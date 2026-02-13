"use client";

/**
 * Step 4: Progress Dashboard
 * THE CORE COMPONENT - Real-time extraction progress with 9-layer visualization
 * Uses Server-Sent Events (SSE) for live updates
 */

import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  StopCircle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Activity,
  Zap,
  TrendingUp,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import confetti from "canvas-confetti";
import { extractionAPI } from "@/lib/api";
import { toast } from "sonner";

interface ProgressDashboardProps {
  config: any;
  jobId: number | null;
  onJobCreated: (jobId: number) => void;
  onComplete: () => void;
}

interface ProgressUpdate {
  job_id: number;
  type: "progress" | "complete" | "error";
  stage?: string;
  message: string;
  progress_percent: number;
  current_source?: string;
  current_layer?: number;
  records_extracted?: number;
  records_validated?: number;
  errors_encountered?: number;
  timestamp: string;
}

const STAGES = [
  { id: "discovery", label: "Layer 0: Discovery", color: "from-blue-500 to-cyan-500" },
  { id: "fetching", label: "Layer 1: Static Scraping", color: "from-purple-500 to-pink-500" },
  { id: "rendering", label: "Layer 3: JS Rendering", color: "from-green-500 to-emerald-500" },
  { id: "parsing", label: "Layer 4: NLP Extraction", color: "from-yellow-500 to-orange-500" },
  { id: "enrichment", label: "Layer 5: OSINT Intel", color: "from-red-500 to-pink-500" },
  { id: "validation", label: "Layer 8: Fraud Detection", color: "from-indigo-500 to-purple-500" },
  { id: "storage", label: "Layer 9: Entity Resolution", color: "from-teal-500 to-cyan-500" },
];

export function ProgressDashboard({
  config,
  jobId,
  onJobCreated,
  onComplete,
}: ProgressDashboardProps) {
  const [isStarted, setIsStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<number | null>(jobId);
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);
  const [completedStages, setCompletedStages] = useState<Set<string>>(new Set());
  const [liveRecords, setLiveRecords] = useState<any[]>([]);
  const [stats, setStats] = useState({
    records_extracted: 0,
    records_validated: 0,
    errors_encountered: 0,
    success_rate: 100,
  });
  const [eta, setEta] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  // Start extraction
  const startExtraction = async () => {
    try {
      // 1. Create job using API client
      const { data: job } = await extractionAPI.createJob({
        sector: config.sector,
        sources: config.sources,
        filters: config.filters,
        options: config.options,
      });

      setCurrentJobId(job.id);
      onJobCreated(job.id);

      // 2. Start job using API client
      await extractionAPI.startJob(job.id);

      setIsStarted(true);
      setStartTime(new Date());

      // 3. Connect to SSE stream
      connectToStream(job.id);

      toast.success("Extraction started!", {
        description: `Job #${job.id} is now running`,
      });
    } catch (error: any) {
      console.error("Failed to start extraction:", error);
      toast.error("Failed to start extraction", {
        description: error.message || "Please try again",
      });
    }
  };

  // Connect to SSE stream
  const connectToStream = (jobId: number) => {
    const eventSource = new EventSource(
      `${API_BASE_URL}/extraction/jobs/${jobId}/stream`
    );

    eventSource.onmessage = (event) => {
      const update: ProgressUpdate = JSON.parse(event.data);
      setProgress(update);

      // Update completed stages
      if (update.stage) {
        setCompletedStages((prev) => new Set(prev).add(update.stage!));
      }

      // Update stats
      if (update.records_extracted !== undefined) {
        setStats((prev) => ({
          ...prev,
          records_extracted: update.records_extracted || 0,
          records_validated: update.records_validated || 0,
          errors_encountered: update.errors_encountered || 0,
          success_rate:
            update.records_extracted && update.errors_encountered
              ? Math.round(
                  ((update.records_extracted - update.errors_encountered) /
                    update.records_extracted) *
                    100
                )
              : 100,
        }));
      }

      // Calculate ETA
      if (startTime && update.progress_percent > 0) {
        const elapsed = Date.now() - startTime.getTime();
        const totalTime = (elapsed / update.progress_percent) * 100;
        const remaining = totalTime - elapsed;
        const remainingMin = Math.ceil(remaining / 60000);
        setEta(remainingMin > 0 ? `${remainingMin} min` : "< 1 min");
      }

      // Handle completion
      if (update.type === "complete" || update.progress_percent >= 100) {
        setIsComplete(true);
        eventSource.close();

        // Trigger confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });

        // Auto-advance after 2 seconds
        setTimeout(() => {
          onComplete();
        }, 2000);
      }

      // Handle errors
      if (update.type === "error") {
        eventSource.close();
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE error:", error);
      eventSource.close();
    };
  };

  // Pause extraction
  const pauseExtraction = async () => {
    if (!currentJobId) return;

    try {
      await extractionAPI.pauseJob(currentJobId);
      setIsPaused(true);
      toast.info("Extraction paused");
    } catch (error: any) {
      console.error("Failed to pause:", error);
      toast.error("Failed to pause extraction");
    }
  };

  // Resume extraction
  const resumeExtraction = async () => {
    if (!currentJobId) return;

    try {
      await extractionAPI.resumeJob(currentJobId);
      setIsPaused(false);
      toast.success("Extraction resumed");
    } catch (error: any) {
      console.error("Failed to resume:", error);
      toast.error("Failed to resume extraction");
    }
  };

  // Cancel extraction
  const cancelExtraction = async () => {
    if (!currentJobId) return;

    try {
      await extractionAPI.stopJob(currentJobId);
      setIsStarted(false);
      toast.warning("Extraction cancelled");
    } catch (error: any) {
      console.error("Failed to cancel:", error);
      toast.error("Failed to cancel extraction");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {isComplete
              ? "Extraction Complete! 🎉"
              : isStarted
              ? "Extraction in Progress"
              : "Ready to Extract"}
          </h2>
          <p className="text-slate-400">
            {isComplete
              ? "Your data is ready for review and export"
              : isStarted
              ? "Live progress updates via Server-Sent Events"
              : "Click Start Extraction to begin"}
          </p>
        </div>

        {/* Control Buttons */}
        {!isStarted ? (
          <Button
            onClick={startExtraction}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-500/50"
          >
            <Play className="w-5 h-5 mr-2" />
            Start Extraction
          </Button>
        ) : !isComplete ? (
          <div className="flex gap-2">
            {!isPaused ? (
              <Button onClick={pauseExtraction} variant="outline">
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
            ) : (
              <Button onClick={resumeExtraction} className="bg-green-600 hover:bg-green-700">
                <Play className="w-4 h-4 mr-2" />
                Resume
              </Button>
            )}
            <Button onClick={cancelExtraction} variant="destructive">
              <StopCircle className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        ) : null}
      </div>

      {isStarted && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Main Progress Card */}
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-xl">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Circular Progress */}
                <div className="flex flex-col items-center justify-center">
                  <div className="w-48 h-48 relative">
                    <CircularProgressbar
                      value={progress?.progress_percent || 0}
                      text={`${Math.round(progress?.progress_percent || 0)}%`}
                      styles={buildStyles({
                        pathColor: isComplete
                          ? "#10b981"
                          : progress?.progress_percent && progress.progress_percent > 66
                          ? "#3b82f6"
                          : progress?.progress_percent && progress.progress_percent > 33
                          ? "#8b5cf6"
                          : "#ef4444",
                        textColor: "#fff",
                        trailColor: "#1e293b",
                        pathTransitionDuration: 0.5,
                      })}
                    />

                    {/* Animated Ring */}
                    <motion.div
                      className="absolute inset-0 rounded-full border-4 border-blue-500/30"
                      animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.3, 0.6, 0.3],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  </div>

                  {/* ETA */}
                  {eta && !isComplete && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-4 flex items-center gap-2 text-slate-400"
                    >
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">ETA: {eta}</span>
                    </motion.div>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                  {/* Records Extracted */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 rounded-xl bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/30"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-blue-500/20">
                        <Activity className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="text-sm text-slate-400">Records Extracted</div>
                    </div>
                    <div className="text-3xl font-bold text-white">
                      {stats.records_extracted.toLocaleString()}
                    </div>
                  </motion.div>

                  {/* Records Validated */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="p-6 rounded-xl bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-green-500/20">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="text-sm text-slate-400">Validated</div>
                    </div>
                    <div className="text-3xl font-bold text-white">
                      {stats.records_validated.toLocaleString()}
                    </div>
                  </motion.div>

                  {/* Errors */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="p-6 rounded-xl bg-gradient-to-br from-red-600/20 to-pink-600/20 border border-red-500/30"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-red-500/20">
                        <AlertCircle className="w-5 h-5 text-red-400" />
                      </div>
                      <div className="text-sm text-slate-400">Errors</div>
                    </div>
                    <div className="text-3xl font-bold text-white">
                      {stats.errors_encountered}
                    </div>
                  </motion.div>

                  {/* Success Rate */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="p-6 rounded-xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-purple-500/20">
                        <TrendingUp className="w-5 h-5 text-purple-400" />
                      </div>
                      <div className="text-sm text-slate-400">Success Rate</div>
                    </div>
                    <div className="text-3xl font-bold text-white">
                      {stats.success_rate}%
                    </div>
                  </motion.div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 9-Layer Progress Indicators */}
          <Card className="bg-slate-800/30 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Multi-Layer Extraction Pipeline</CardTitle>
              <CardDescription>
                Real-time progress across all 9 extraction layers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {STAGES.map((stage, index) => {
                const isActive = progress?.stage === stage.id;
                const isCompleted = completedStages.has(stage.id);
                const isFuture = !isActive && !isCompleted;

                return (
                  <motion.div
                    key={stage.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`
                      relative p-4 rounded-xl border-2 transition-all duration-300
                      ${
                        isActive
                          ? `border-transparent bg-gradient-to-r ${stage.color} shadow-lg`
                          : isCompleted
                          ? "border-green-500/50 bg-green-600/10"
                          : "border-slate-700/50 bg-slate-800/30"
                      }
                    `}
                  >
                    {/* Animated Background */}
                    {isActive && (
                      <motion.div
                        className={`absolute inset-0 rounded-xl bg-gradient-to-r ${stage.color} opacity-20`}
                        animate={{
                          opacity: [0.1, 0.3, 0.1],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    )}

                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Icon */}
                        <div
                          className={`
                            flex items-center justify-center w-10 h-10 rounded-lg
                            ${
                              isCompleted
                                ? "bg-green-500/20"
                                : isActive
                                ? "bg-white/20"
                                : "bg-slate-700/50"
                            }
                          `}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                          ) : isActive ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                            >
                              <Loader2 className="w-5 h-5 text-white" />
                            </motion.div>
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-slate-600" />
                          )}
                        </div>

                        {/* Label */}
                        <div>
                          <div
                            className={`
                              font-semibold transition-colors
                              ${
                                isActive || isCompleted
                                  ? "text-white"
                                  : "text-slate-500"
                              }
                            `}
                          >
                            {stage.label}
                          </div>
                          {isActive && progress?.message && (
                            <div className="text-sm text-white/80 mt-1">
                              {progress.message}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <Badge
                        variant={
                          isCompleted
                            ? "default"
                            : isActive
                            ? "secondary"
                            : "outline"
                        }
                        className={
                          isCompleted
                            ? "bg-green-600"
                            : isActive
                            ? "bg-blue-600"
                            : ""
                        }
                      >
                        {isCompleted ? "Complete" : isActive ? "Processing" : "Pending"}
                      </Badge>
                    </div>

                    {/* Progress Bar for Active Stage */}
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-3"
                      >
                        <Progress
                          value={progress?.progress_percent || 0}
                          className="h-2"
                        />
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>

          {/* Current Source */}
          {progress?.current_source && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-blue-600/10 border border-blue-500/30"
            >
              <div className="flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-blue-400" />
                <span className="text-slate-400">Currently processing:</span>
                <span className="text-blue-400 font-mono truncate">
                  {progress.current_source}
                </span>
              </div>
            </motion.div>
          )}

          {/* Completion Message */}
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 rounded-2xl bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-2 border-green-500/50 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="inline-block p-4 rounded-full bg-green-500/20 mb-4"
              >
                <CheckCircle2 className="w-16 h-16 text-green-400" />
              </motion.div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Extraction Complete!
              </h3>
              <p className="text-slate-300 mb-4">
                Extracted {stats.records_validated} validated records with{" "}
                {stats.success_rate}% success rate
              </p>
              <p className="text-sm text-slate-400">
                Redirecting to review in 2 seconds...
              </p>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
