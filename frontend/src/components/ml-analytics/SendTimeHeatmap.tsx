/**
 * Send Time Heatmap Component
 *
 * ULTRA Follow-Up System V2.0 - Sprint 2
 *
 * Displays a 7x24 grid showing optimal email send times based on engagement data.
 * Color coded from green (high engagement) to red (low engagement).
 */

"use client";

import React, { useEffect, useState } from "react";
import {
  getSendTimeHeatmap,
  HeatmapData,
  getHeatmapColor,
  getConfidenceColor,
} from "@/lib/ml-api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface SendTimeHeatmapProps {
  recipientDomain?: string;
  className?: string;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function SendTimeHeatmap({
  recipientDomain,
  className = "",
}: SendTimeHeatmapProps) {
  const [data, setData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const result = await getSendTimeHeatmap(recipientDomain);
        setData(result);
      } catch (err: any) {
        setError(err.message || "Failed to load heatmap data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [recipientDomain]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Send Time Optimization</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Send Time Optimization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500 text-center py-8">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const getScore = (dayKey: string, hour: number): number => {
    return data.heatmap[dayKey]?.[hour.toString()] || 0;
  };

  const isBestSlot = (dayIndex: number, hour: number): boolean => {
    return dayIndex === data.best_day && hour === data.best_hour;
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Send Time Optimization</CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={getConfidenceColor(data.confidence)}>
              {data.confidence.toUpperCase()} confidence
            </Badge>
            <span className="text-sm text-muted-foreground">
              {data.sample_size} samples
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Best Time Display */}
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-green-800 dark:text-green-200">
                Best Time to Send
              </div>
              <div className="text-xl font-bold text-green-900 dark:text-green-100">
                {data.best_day_name} at {data.best_hour}:00
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-green-700 dark:text-green-300">
                Expected Boost
              </div>
              <div className="text-lg font-semibold text-green-800 dark:text-green-200">
                +{data.expected_boost}%
              </div>
            </div>
          </div>
          <div className="mt-1 text-xs text-green-600 dark:text-green-400">
            Source: {data.data_source.replace("_", " ")}
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Hour Labels */}
            <div className="flex mb-1">
              <div className="w-12"></div>
              {HOURS.filter((h) => h % 3 === 0).map((hour) => (
                <div
                  key={hour}
                  className="flex-1 text-center text-xs text-muted-foreground"
                >
                  {hour}:00
                </div>
              ))}
            </div>

            {/* Day Rows */}
            {DAYS.map((day, dayIndex) => (
              <div key={day} className="flex items-center mb-1">
                <div className="w-12 text-sm font-medium text-muted-foreground">
                  {day}
                </div>
                <div className="flex-1 flex gap-[1px]">
                  {HOURS.map((hour) => {
                    const score = getScore(DAY_KEYS[dayIndex], hour);
                    const isBest = isBestSlot(dayIndex, hour);
                    return (
                      <div
                        key={hour}
                        className={`
                          flex-1 h-6 rounded-sm transition-all cursor-pointer
                          ${getHeatmapColor(score)}
                          ${isBest ? "ring-2 ring-green-600 ring-offset-1" : ""}
                          hover:opacity-80
                        `}
                        title={`${day} ${hour}:00 - Score: ${(score * 100).toFixed(0)}%`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Legend */}
            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span>Low</span>
              <div className="flex gap-[1px]">
                <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-sm" />
                <div className="w-4 h-4 bg-red-400 rounded-sm" />
                <div className="w-4 h-4 bg-orange-400 rounded-sm" />
                <div className="w-4 h-4 bg-yellow-400 rounded-sm" />
                <div className="w-4 h-4 bg-green-400 rounded-sm" />
                <div className="w-4 h-4 bg-green-500 rounded-sm" />
              </div>
              <span>High</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default SendTimeHeatmap;
