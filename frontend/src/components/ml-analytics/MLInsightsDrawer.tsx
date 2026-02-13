"use client";

/**
 * ML Insights Drawer - Unified ML Analytics Panel
 *
 * Opens as a slide-out drawer from the right side
 * Contains tabs for: Reply Predictions, Send Time Heatmap, Model Accuracy
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  X,
  TrendingUp,
  Clock,
  Target,
  Sparkles,
  ChevronRight,
  BarChart3,
  Zap,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// Import ML Components
import { SendTimeHeatmap } from "./SendTimeHeatmap";
import { ReplyProbabilityChart } from "./ReplyProbabilityChart";
import { MLAccuracyDashboard } from "./MLAccuracyDashboard";

interface MLInsightsDrawerProps {
  open: boolean;
  onClose: () => void;
  defaultTab?: "predictions" | "sendtime" | "accuracy";
  campaignIds?: number[];
  recipientDomain?: string;
  onCampaignClick?: (campaignId: number) => void;
}

export function MLInsightsDrawer({
  open,
  onClose,
  defaultTab = "predictions",
  campaignIds,
  recipientDomain,
  onCampaignClick,
}: MLInsightsDrawerProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={cn(
              "fixed right-0 top-0 h-full w-full max-w-2xl z-50",
              "bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950",
              "border-l border-slate-700/50 shadow-2xl shadow-black/50"
            )}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                    <Brain className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">ML Insights</h2>
                    <p className="text-sm text-slate-400">AI-powered analytics & predictions</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="mt-4">
                <TabsList className="grid grid-cols-3 bg-slate-800/50 p-1 rounded-lg">
                  <TabsTrigger
                    value="predictions"
                    className="data-[state=active]:bg-purple-600 data-[state=active]:text-white flex items-center gap-2"
                  >
                    <Target className="w-4 h-4" />
                    <span className="hidden sm:inline">Predictions</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="sendtime"
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    <span className="hidden sm:inline">Send Time</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="accuracy"
                    className="data-[state=active]:bg-green-600 data-[state=active]:text-white flex items-center gap-2"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span className="hidden sm:inline">Accuracy</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto h-[calc(100%-140px)]">
              <Tabs value={activeTab} className="space-y-6">
                {/* Reply Predictions Tab */}
                <TabsContent value="predictions" className="mt-0 space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-medium text-white">Reply Probability</h3>
                    <Badge variant="outline" className="ml-auto border-purple-500/50 text-purple-400">
                      ML Powered
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-400 mb-4">
                    Campaigns ranked by likelihood of receiving a reply. Higher probability = prioritize these first.
                  </p>
                  <ReplyProbabilityChart
                    campaignIds={campaignIds}
                    limit={10}
                    onCampaignClick={onCampaignClick}
                    className="bg-slate-800/30 rounded-xl border border-slate-700/50"
                  />
                </TabsContent>

                {/* Send Time Heatmap Tab */}
                <TabsContent value="sendtime" className="mt-0 space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-medium text-white">Optimal Send Times</h3>
                    <Badge variant="outline" className="ml-auto border-blue-500/50 text-blue-400">
                      Learned from Data
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-400 mb-4">
                    Engagement heatmap showing the best days and hours to send emails based on historical data.
                  </p>
                  <SendTimeHeatmap
                    recipientDomain={recipientDomain}
                    className="bg-slate-800/30 rounded-xl border border-slate-700/50"
                  />
                </TabsContent>

                {/* Model Accuracy Tab */}
                <TabsContent value="accuracy" className="mt-0 space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    <h3 className="text-lg font-medium text-white">Model Performance</h3>
                    <Badge variant="outline" className="ml-auto border-green-500/50 text-green-400">
                      Live Stats
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-400 mb-4">
                    Track how accurate our ML predictions are based on actual outcomes.
                  </p>
                  <MLAccuracyDashboard
                    className="bg-slate-800/30 rounded-xl border border-slate-700/50"
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Models trained on your campaign data</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Last updated: Today
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Trigger Button Component for easy integration
interface MLInsightsButtonProps {
  onClick: () => void;
  variant?: "default" | "compact" | "icon";
  className?: string;
}

export function MLInsightsButton({ onClick, variant = "default", className }: MLInsightsButtonProps) {
  if (variant === "icon") {
    return (
      <Button
        onClick={onClick}
        size="icon"
        className={cn(
          "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500",
          "shadow-lg shadow-purple-500/25",
          className
        )}
      >
        <Brain className="w-4 h-4" />
      </Button>
    );
  }

  if (variant === "compact") {
    return (
      <Button
        onClick={onClick}
        size="sm"
        className={cn(
          "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500",
          "shadow-lg shadow-purple-500/25 gap-2",
          className
        )}
      >
        <Brain className="w-4 h-4" />
        <span>ML</span>
      </Button>
    );
  }

  return (
    <Button
      onClick={onClick}
      className={cn(
        "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500",
        "shadow-lg shadow-purple-500/25 gap-2",
        className
      )}
    >
      <Brain className="w-4 h-4" />
      <span>ML Insights</span>
      <ChevronRight className="w-4 h-4" />
    </Button>
  );
}

export default MLInsightsDrawer;
