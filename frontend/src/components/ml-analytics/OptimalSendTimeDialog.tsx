"use client";

/**
 * Optimal Send Time Dialog
 *
 * A focused dialog for the step4-send page that shows
 * the ML-powered send time heatmap and recommendations
 */

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  Zap,
  Calendar,
  TrendingUp,
  Check,
  Sparkles,
  Info,
  ArrowRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SendTimeHeatmap } from "./SendTimeHeatmap";
import { getOptimalSendTime, SendTimeRecommendation } from "@/lib/ml-api";

interface OptimalSendTimeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientDomain?: string;
  onApply?: (recommendation: SendTimeRecommendation) => void;
}

export function OptimalSendTimeDialog({
  open,
  onOpenChange,
  recipientDomain,
  onApply,
}: OptimalSendTimeDialogProps) {
  const [recommendation, setRecommendation] = useState<SendTimeRecommendation | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchRecommendation();
    }
  }, [open, recipientDomain]);

  const fetchRecommendation = async () => {
    setLoading(true);
    try {
      const data = await getOptimalSendTime({ recipientDomain });
      setRecommendation(data);
    } catch (error) {
      console.error("Failed to fetch send time recommendation:", error);
    } finally {
      setLoading(false);
    }
  };

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const formatHour = (hour: number) => {
    const ampm = hour >= 12 ? "PM" : "AM";
    const h = hour % 12 || 12;
    return `${h}:00 ${ampm}`;
  };

  const getConfidenceBadge = (confidence?: string) => {
    switch (confidence) {
      case "HIGH":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">High Confidence</Badge>;
      case "MEDIUM":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Medium Confidence</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">Learning</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-gradient-to-b from-slate-900 to-slate-950 border-slate-700/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-white">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            Optimal Send Time Analysis
            <Badge variant="outline" className="ml-2 border-blue-500/50 text-blue-400">
              <Sparkles className="w-3 h-3 mr-1" />
              ML Powered
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Our ML model analyzes engagement patterns to recommend the best time to send your emails.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Recommendation Card */}
          {recommendation && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "p-4 rounded-xl border",
                "bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-blue-500/10",
                "border-blue-500/30"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-400" />
                    <span className="font-medium text-white">Recommended Send Time</span>
                    {getConfidenceBadge(recommendation.confidence)}
                  </div>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-2 text-lg">
                      <Calendar className="w-5 h-5 text-slate-400" />
                      <span className="font-semibold text-white">
                        {dayNames[recommendation.recommended_day]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-lg">
                      <Clock className="w-5 h-5 text-slate-400" />
                      <span className="font-semibold text-white">
                        {formatHour(recommendation.recommended_hour)}
                      </span>
                    </div>
                  </div>
                  {recommendation.expected_boost && (
                    <div className="flex items-center gap-2 text-sm text-green-400 mt-2">
                      <TrendingUp className="w-4 h-4" />
                      <span>+{(recommendation.expected_boost * 100).toFixed(0)}% expected engagement boost</span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 mb-1">Based on</div>
                  <div className="text-sm text-slate-300">{recommendation.sample_size || 0} data points</div>
                  <div className="text-xs text-slate-500 mt-1">{recommendation.data_source || "Historical data"}</div>
                </div>
              </div>
            </motion.div>
          )}

          {loading && (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-slate-400">Analyzing engagement patterns...</p>
            </div>
          )}

          {/* Heatmap */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-400">
                Engagement heatmap based on your historical email data
              </span>
            </div>
            <SendTimeHeatmap
              recipientDomain={recipientDomain}
              className="bg-slate-800/30 rounded-xl border border-slate-700/50"
            />
          </div>

          {/* Tips */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                icon: Calendar,
                title: "Best Days",
                desc: "Tuesday-Thursday typically see higher engagement",
                color: "blue",
              },
              {
                icon: Clock,
                title: "Peak Hours",
                desc: "9-11 AM and 2-4 PM are generally optimal",
                color: "cyan",
              },
              {
                icon: TrendingUp,
                title: "Adaptive Learning",
                desc: "Model improves as you send more emails",
                color: "green",
              },
            ].map((tip, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/50"
              >
                <tip.icon className={cn("w-4 h-4 mb-2", `text-${tip.color}-400`)} />
                <div className="text-sm font-medium text-white">{tip.title}</div>
                <div className="text-xs text-slate-400 mt-1">{tip.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-700">
            Close
          </Button>
          {recommendation && onApply && (
            <Button
              onClick={() => {
                onApply(recommendation);
                onOpenChange(false);
              }}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 gap-2"
            >
              <Check className="w-4 h-4" />
              Apply Recommendation
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default OptimalSendTimeDialog;
