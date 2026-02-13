/**
 * Reply Probability Chart Component
 *
 * ULTRA Follow-Up System V2.0 - Sprint 2
 *
 * Displays campaigns sorted by reply probability with:
 * - Probability bar visualization
 * - Confidence badges
 * - Recommended actions
 */

"use client";

import React, { useEffect, useState } from "react";
import {
  predictBatch,
  BatchPrediction,
  getConfidenceColor,
  getActionDisplay,
} from "@/lib/ml-api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

interface ReplyProbabilityChartProps {
  campaignIds?: number[];
  limit?: number;
  className?: string;
  onCampaignClick?: (campaignId: number) => void;
}

export function ReplyProbabilityChart({
  campaignIds,
  limit = 10,
  className = "",
  onCampaignClick,
}: ReplyProbabilityChartProps) {
  const [predictions, setPredictions] = useState<BatchPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const result = await predictBatch(campaignIds, limit);
        setPredictions(result.campaigns);
      } catch (err: any) {
        setError(err.message || "Failed to load predictions");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [campaignIds, limit]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Reply Probability</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Reply Probability</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500 text-center py-8">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (predictions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Reply Probability</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-center py-8">
            No active campaigns to predict
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Reply Probability</CardTitle>
          <span className="text-sm text-muted-foreground">
            {predictions.length} campaigns
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {predictions.map((prediction, index) => {
            const action = getActionDisplay(prediction.recommended_action);
            const probabilityPercent = prediction.probability * 100;

            return (
              <div
                key={prediction.campaign_id}
                className={`
                  p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors
                  ${onCampaignClick ? "cursor-pointer" : ""}
                `}
                onClick={() => onCampaignClick?.(prediction.campaign_id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      #{index + 1}
                    </span>
                    <span className="font-medium">
                      Campaign {prediction.campaign_id}
                    </span>
                    <Badge
                      variant="outline"
                      className={getConfidenceColor(prediction.confidence)}
                    >
                      {prediction.confidence}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">
                      {prediction.probability_percent}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Priority: {prediction.priority_score}
                    </span>
                  </div>
                </div>

                {/* Probability Bar */}
                <div className="mb-2">
                  <Progress
                    value={probabilityPercent}
                    className="h-2"
                  />
                </div>

                {/* Details */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">
                      Step {prediction.current_step}
                    </span>
                    <span className="text-muted-foreground">
                      Status: {prediction.status}
                    </span>
                    {prediction.next_send_date && (
                      <span className="text-muted-foreground">
                        Next:{" "}
                        {new Date(prediction.next_send_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <span className={`font-medium ${action.color}`}>
                    {action.text}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default ReplyProbabilityChart;
