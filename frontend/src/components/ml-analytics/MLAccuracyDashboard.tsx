/**
 * ML Accuracy Dashboard Component
 *
 * ULTRA Follow-Up System V2.0 - Sprint 2
 *
 * Displays prediction accuracy metrics:
 * - Overall accuracy donut chart
 * - Breakdown by confidence level
 * - Average probabilities by outcome
 */

"use client";

import React, { useEffect, useState } from "react";
import {
  getAccuracyStats,
  AccuracyStats,
  getConfidenceColor,
} from "@/lib/ml-api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

interface MLAccuracyDashboardProps {
  className?: string;
}

export function MLAccuracyDashboard({ className = "" }: MLAccuracyDashboardProps) {
  const [stats, setStats] = useState<AccuracyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const result = await getAccuracyStats();
        setStats(result);
      } catch (err: any) {
        setError(err.message || "Failed to load accuracy stats");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Prediction Accuracy</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Prediction Accuracy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500 text-center py-8">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const hasData = stats.evaluated_predictions > 0;
  const accuracyPercent = hasData ? stats.overall_accuracy * 100 : 0;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Prediction Accuracy</CardTitle>
          <span className="text-sm text-muted-foreground">
            {stats.evaluated_predictions} / {stats.total_predictions} evaluated
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No predictions evaluated yet.</p>
            <p className="text-sm mt-2">
              Accuracy data will appear after campaigns complete.
            </p>
          </div>
        ) : (
          <>
            {/* Overall Accuracy Circle */}
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-32 h-32">
                {/* Background circle */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="12"
                    className="text-muted/20"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${accuracyPercent * 3.52} 352`}
                    className={
                      accuracyPercent >= 70
                        ? "text-green-500"
                        : accuracyPercent >= 50
                        ? "text-yellow-500"
                        : "text-red-500"
                    }
                  />
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold">
                    {stats.overall_accuracy_percent}
                  </span>
                  <span className="text-xs text-muted-foreground">Accuracy</span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="text-center p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                <div className="text-xl font-bold text-green-700 dark:text-green-300">
                  {stats.accurate_predictions}
                </div>
                <div className="text-xs text-green-600 dark:text-green-400">
                  Accurate
                </div>
              </div>
              <div className="text-center p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                <div className="text-xl font-bold text-red-700 dark:text-red-300">
                  {stats.evaluated_predictions - stats.accurate_predictions}
                </div>
                <div className="text-xs text-red-600 dark:text-red-400">
                  Inaccurate
                </div>
              </div>
              <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="text-xl font-bold">
                  {stats.total_predictions - stats.evaluated_predictions}
                </div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
            </div>

            {/* Accuracy by Confidence */}
            <div className="mb-6">
              <h4 className="text-sm font-medium mb-3">By Confidence Level</h4>
              <div className="space-y-2">
                {(["high", "medium", "low"] as const).map((level) => {
                  const data = stats.accuracy_by_confidence[level];
                  if (!data || data.total === 0) return null;

                  const levelAccuracy = data.evaluated > 0 ? data.accuracy * 100 : 0;

                  return (
                    <div key={level} className="flex items-center gap-3">
                      <Badge className={`${getConfidenceColor(level)} w-20 justify-center`}>
                        {level}
                      </Badge>
                      <div className="flex-1">
                        <Progress value={levelAccuracy} className="h-2" />
                      </div>
                      <span className="text-sm font-medium w-16 text-right">
                        {levelAccuracy.toFixed(0)}%
                      </span>
                      <span className="text-xs text-muted-foreground w-20 text-right">
                        ({data.accurate}/{data.evaluated})
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Average Probabilities */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg border">
                <div className="text-xs text-muted-foreground mb-1">
                  Avg. Probability When Replied
                </div>
                <div className="text-lg font-bold text-green-600">
                  {(stats.avg_probability_when_replied * 100).toFixed(1)}%
                </div>
              </div>
              <div className="p-3 rounded-lg border">
                <div className="text-xs text-muted-foreground mb-1">
                  Avg. Probability When Not Replied
                </div>
                <div className="text-lg font-bold text-red-600">
                  {(stats.avg_probability_when_not_replied * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Calibration Note */}
            {stats.avg_probability_when_replied > stats.avg_probability_when_not_replied && (
              <div className="mt-4 p-2 rounded bg-green-50 dark:bg-green-900/20 text-xs text-green-700 dark:text-green-300">
                Model is well-calibrated: Higher predictions correlate with actual replies.
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default MLAccuracyDashboard;
