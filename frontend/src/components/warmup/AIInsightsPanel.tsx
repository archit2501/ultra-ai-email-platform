"use client";

/**
 * AIInsightsPanel.tsx - ULTRA PREMIUM EDITION
 *
 * AI-powered insights and recommendations panel
 * Features machine learning predictions and actionable insights
 *
 * @version 3.0.0 - GOD TIER EDITION
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Award,
  ChevronRight,
  Lightbulb,
  Target,
  Clock,
  Zap,
  ArrowRight,
  Star,
  Trophy,
  Shield,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface AIInsight {
  id: string;
  type: "recommendation" | "warning" | "prediction" | "achievement";
  title: string;
  description: string;
  impact: "low" | "medium" | "high" | "critical";
  actionRequired: boolean;
  suggestedAction?: string;
  confidence: number;
  generatedAt: string;
}

interface AIInsightsPanelProps {
  insights: AIInsight[];
  compact?: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getInsightConfig(type: AIInsight["type"]) {
  const configs = {
    recommendation: {
      icon: Lightbulb,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-500/10",
      textColor: "text-blue-400",
      label: "Recommendation",
    },
    warning: {
      icon: AlertTriangle,
      color: "from-yellow-500 to-orange-500",
      bgColor: "bg-yellow-500/10",
      textColor: "text-yellow-400",
      label: "Warning",
    },
    prediction: {
      icon: TrendingUp,
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-500/10",
      textColor: "text-purple-400",
      label: "Prediction",
    },
    achievement: {
      icon: Trophy,
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-500/10",
      textColor: "text-green-400",
      label: "Achievement",
    },
  };
  return configs[type];
}

function getImpactConfig(impact: AIInsight["impact"]) {
  const configs = {
    low: { color: "text-slate-400", badge: "bg-slate-500/20" },
    medium: { color: "text-blue-400", badge: "bg-blue-500/20" },
    high: { color: "text-orange-400", badge: "bg-orange-500/20" },
    critical: { color: "text-red-400", badge: "bg-red-500/20" },
  };
  return configs[impact];
}

// ============================================================================
// Insight Card Component
// ============================================================================

function InsightCard({
  insight,
  expanded,
  onToggle,
}: {
  insight: AIInsight;
  expanded: boolean;
  onToggle: () => void;
}) {
  const config = getInsightConfig(insight.type);
  const impactConfig = getImpactConfig(insight.impact);
  const Icon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative rounded-xl overflow-hidden",
        "bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90",
        "backdrop-blur-xl border border-slate-700/50",
        "hover:border-slate-600/50 transition-all cursor-pointer"
      )}
      onClick={onToggle}
    >
      {/* Gradient accent */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r",
        config.color
      )} />

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <motion.div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              config.bgColor
            )}
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <Icon className={cn("w-5 h-5", config.textColor)} />
          </motion.div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className={cn("text-xs", config.textColor)}>
                {config.label}
              </Badge>
              <Badge className={cn("text-xs", impactConfig.badge, impactConfig.color)}>
                {insight.impact.toUpperCase()}
              </Badge>
              {insight.actionRequired && (
                <Badge className="text-xs bg-red-500/20 text-red-400">
                  Action Required
                </Badge>
              )}
            </div>

            <h4 className="font-semibold text-white">{insight.title}</h4>
            <p className="text-sm text-slate-400 mt-1 line-clamp-2">
              {insight.description}
            </p>

            {/* Confidence meter */}
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs text-slate-500">AI Confidence</span>
              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className={cn("h-full bg-gradient-to-r", config.color)}
                  initial={{ width: 0 }}
                  animate={{ width: `${insight.confidence}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                />
              </div>
              <span className={cn("text-xs font-medium", config.textColor)}>
                {insight.confidence}%
              </span>
            </div>

            {/* Expanded content */}
            <AnimatePresence>
              {expanded && insight.suggestedAction && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-4 pt-4 border-t border-slate-800"
                >
                  <div className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-yellow-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-white">Suggested Action</p>
                      <p className="text-sm text-slate-400 mt-1">
                        {insight.suggestedAction}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className={cn("mt-3 gap-2 bg-gradient-to-r", config.color)}
                  >
                    Apply Recommendation
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Expand indicator */}
          <motion.div
            animate={{ rotate: expanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// AI Summary Card
// ============================================================================

function AISummaryCard({ insights }: { insights: AIInsight[] }) {
  const recommendations = insights.filter((i) => i.type === "recommendation").length;
  const warnings = insights.filter((i) => i.type === "warning").length;
  const achievements = insights.filter((i) => i.type === "achievement").length;
  const predictions = insights.filter((i) => i.type === "prediction").length;

  const avgConfidence = insights.length > 0
    ? insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length
    : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {[
        { label: "Recommendations", value: recommendations, icon: Lightbulb, color: "text-blue-400" },
        { label: "Warnings", value: warnings, icon: AlertTriangle, color: "text-yellow-400" },
        { label: "Achievements", value: achievements, icon: Trophy, color: "text-green-400" },
        { label: "AI Confidence", value: `${avgConfidence.toFixed(0)}%`, icon: Brain, color: "text-purple-400" },
      ].map((stat) => (
        <motion.div
          key={stat.label}
          className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50"
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <stat.icon className={cn("w-4 h-4", stat.color)} />
            <span className="text-xs text-slate-400">{stat.label}</span>
          </div>
          <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
        </motion.div>
      ))}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function AIInsightsPanel({ insights, compact = false }: AIInsightsPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const displayedInsights = compact ? insights.slice(0, 3) : insights;

  return (
    <Card className="bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 backdrop-blur-xl border-slate-700/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"
              animate={{
                boxShadow: [
                  "0 0 20px rgba(168, 85, 247, 0.3)",
                  "0 0 40px rgba(168, 85, 247, 0.5)",
                  "0 0 20px rgba(168, 85, 247, 0.3)",
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Brain className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                AI-Powered Insights
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Neural Engine v3.0
                </Badge>
              </CardTitle>
              <p className="text-sm text-slate-400 mt-1">
                Machine learning recommendations and predictions
              </p>
            </div>
          </div>

          {compact && (
            <Button variant="ghost" size="sm" className="gap-1 text-slate-400">
              View All
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {!compact && <AISummaryCard insights={insights} />}

        <ScrollArea className={compact ? "h-auto" : "h-[400px]"}>
          <div className="space-y-3 pr-4">
            {displayedInsights.length > 0 ? (
              displayedInsights.map((insight) => (
                <InsightCard
                  key={insight.id}
                  insight={insight}
                  expanded={expandedId === insight.id}
                  onToggle={() => setExpandedId(expandedId === insight.id ? null : insight.id)}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <motion.div
                  className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Brain className="w-8 h-8 text-purple-400" />
                </motion.div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  AI Analysis in Progress
                </h3>
                <p className="text-slate-400">
                  Neural network is analyzing your warmup patterns...
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default AIInsightsPanel;
