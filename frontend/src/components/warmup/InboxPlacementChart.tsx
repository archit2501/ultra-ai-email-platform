"use client";

/**
 * InboxPlacementChart.tsx
 *
 * Visual chart showing email placement across different providers
 * Tracks inbox vs spam vs promotions placement
 *
 * @version 2.0.0
 */

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Target,
  Inbox,
  AlertTriangle,
  Archive,
  Mail,
  CheckCircle,
  XCircle,
  HelpCircle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface PlacementResult {
  provider: string;
  placement: "inbox" | "spam" | "promotions" | "missing";
  timestamp: string;
  testId: string;
}

interface InboxPlacementChartProps {
  placements?: PlacementResult[];
  data?: {
    gmail?: { inbox: number; spam: number; missing?: number };
    outlook?: { inbox: number; spam: number; missing?: number };
    yahoo?: { inbox: number; spam: number; missing?: number };
  };
  lastTestDate?: string;
  showDetails?: boolean;
  className?: string;
}

interface ProviderStats {
  provider: string;
  inboxRate: number;
  spamRate: number;
  promotionsRate: number;
  missingRate: number;
  totalTests: number;
  trend: "up" | "down" | "stable";
  lastPlacement: "inbox" | "spam" | "promotions" | "missing";
}

// ============================================================================
// Provider Icons & Colors
// ============================================================================

const providerConfig: Record<string, { icon: string; color: string; bgColor: string }> = {
  Gmail: { icon: "📧", color: "text-red-500", bgColor: "bg-red-500/10" },
  Outlook: { icon: "📨", color: "text-blue-500", bgColor: "bg-blue-500/10" },
  Yahoo: { icon: "📩", color: "text-purple-500", bgColor: "bg-purple-500/10" },
  "Apple Mail": { icon: "🍎", color: "text-gray-500", bgColor: "bg-gray-500/10" },
  AOL: { icon: "📬", color: "text-yellow-500", bgColor: "bg-yellow-500/10" },
  ProtonMail: { icon: "🔒", color: "text-indigo-500", bgColor: "bg-indigo-500/10" },
  Zoho: { icon: "📮", color: "text-orange-500", bgColor: "bg-orange-500/10" },
};

const placementConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  inbox: {
    icon: <Inbox className="w-4 h-4" />,
    color: "text-green-500 bg-green-500/10",
    label: "Primary Inbox",
  },
  spam: {
    icon: <AlertTriangle className="w-4 h-4" />,
    color: "text-red-500 bg-red-500/10",
    label: "Spam Folder",
  },
  promotions: {
    icon: <Archive className="w-4 h-4" />,
    color: "text-yellow-500 bg-yellow-500/10",
    label: "Promotions Tab",
  },
  missing: {
    icon: <HelpCircle className="w-4 h-4" />,
    color: "text-gray-500 bg-gray-500/10",
    label: "Not Delivered",
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

function calculateProviderStats(placements: PlacementResult[]): ProviderStats[] {
  const providerMap = new Map<string, PlacementResult[]>();

  // Group by provider
  placements.forEach((p) => {
    const existing = providerMap.get(p.provider) || [];
    existing.push(p);
    providerMap.set(p.provider, existing);
  });

  // Calculate stats for each provider
  const stats: ProviderStats[] = [];

  providerMap.forEach((results, provider) => {
    const total = results.length;
    const inbox = results.filter((r) => r.placement === "inbox").length;
    const spam = results.filter((r) => r.placement === "spam").length;
    const promotions = results.filter((r) => r.placement === "promotions").length;
    const missing = results.filter((r) => r.placement === "missing").length;

    // Sort by timestamp to get trend
    const sorted = [...results].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const lastPlacement = sorted[0]?.placement || "missing";

    // Simple trend calculation (comparing last half vs first half)
    const midpoint = Math.floor(sorted.length / 2);
    const recentInbox = sorted.slice(0, midpoint).filter((r) => r.placement === "inbox").length;
    const olderInbox = sorted.slice(midpoint).filter((r) => r.placement === "inbox").length;
    const trend =
      recentInbox > olderInbox ? "up" : recentInbox < olderInbox ? "down" : "stable";

    stats.push({
      provider,
      inboxRate: total > 0 ? (inbox / total) * 100 : 0,
      spamRate: total > 0 ? (spam / total) * 100 : 0,
      promotionsRate: total > 0 ? (promotions / total) * 100 : 0,
      missingRate: total > 0 ? (missing / total) * 100 : 0,
      totalTests: total,
      trend,
      lastPlacement,
    });
  });

  // Sort by inbox rate descending
  return stats.sort((a, b) => b.inboxRate - a.inboxRate);
}

function calculateOverallStats(stats: ProviderStats[]): {
  avgInboxRate: number;
  avgSpamRate: number;
  totalTests: number;
} {
  if (stats.length === 0) {
    return { avgInboxRate: 0, avgSpamRate: 0, totalTests: 0 };
  }

  const totalTests = stats.reduce((sum, s) => sum + s.totalTests, 0);
  const weightedInbox = stats.reduce((sum, s) => sum + s.inboxRate * s.totalTests, 0);
  const weightedSpam = stats.reduce((sum, s) => sum + s.spamRate * s.totalTests, 0);

  return {
    avgInboxRate: totalTests > 0 ? weightedInbox / totalTests : 0,
    avgSpamRate: totalTests > 0 ? weightedSpam / totalTests : 0,
    totalTests,
  };
}

// ============================================================================
// Components
// ============================================================================

function ProviderRow({ stats, showDetails }: { stats: ProviderStats; showDetails?: boolean }) {
  const config = providerConfig[stats.provider] || {
    icon: "📧",
    color: "text-gray-500",
    bgColor: "bg-gray-500/10",
  };

  const placementInfo = placementConfig[stats.lastPlacement];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
    >
      {/* Provider Icon */}
      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-lg", config.bgColor)}>
        {config.icon}
      </div>

      {/* Provider Name & Stats */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">{stats.provider}</span>
          <Badge variant="outline" className="text-xs">
            {stats.totalTests} tests
          </Badge>
          {stats.trend === "up" && (
            <TrendingUp className="w-4 h-4 text-green-500" />
          )}
          {stats.trend === "down" && (
            <TrendingDown className="w-4 h-4 text-red-500" />
          )}
        </div>

        {/* Placement Bar */}
        {showDetails && (
          <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden flex">
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  className="bg-green-500 h-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.inboxRate}%` }}
                  transition={{ duration: 0.5 }}
                />
              </TooltipTrigger>
              <TooltipContent>Inbox: {stats.inboxRate.toFixed(1)}%</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  className="bg-yellow-500 h-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.promotionsRate}%` }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                />
              </TooltipTrigger>
              <TooltipContent>Promotions: {stats.promotionsRate.toFixed(1)}%</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  className="bg-red-500 h-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.spamRate}%` }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                />
              </TooltipTrigger>
              <TooltipContent>Spam: {stats.spamRate.toFixed(1)}%</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>

      {/* Inbox Rate */}
      <div className="text-right">
        <p className={cn(
          "text-lg font-bold",
          stats.inboxRate >= 90 ? "text-green-500" :
          stats.inboxRate >= 70 ? "text-yellow-500" : "text-red-500"
        )}>
          {stats.inboxRate.toFixed(0)}%
        </p>
        <p className="text-xs text-muted-foreground">inbox rate</p>
      </div>

      {/* Last Placement Badge */}
      <Tooltip>
        <TooltipTrigger>
          <div className={cn("p-2 rounded-lg", placementInfo.color)}>
            {placementInfo.icon}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          Last test: {placementInfo.label}
        </TooltipContent>
      </Tooltip>
    </motion.div>
  );
}

function OverallSummary({ stats }: { stats: ReturnType<typeof calculateOverallStats> }) {
  return (
    <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
      <div className="text-center">
        <p className={cn(
          "text-2xl font-bold",
          stats.avgInboxRate >= 90 ? "text-green-500" :
          stats.avgInboxRate >= 70 ? "text-yellow-500" : "text-red-500"
        )}>
          {stats.avgInboxRate.toFixed(1)}%
        </p>
        <p className="text-xs text-muted-foreground">Avg Inbox Rate</p>
      </div>
      <div className="text-center">
        <p className={cn(
          "text-2xl font-bold",
          stats.avgSpamRate <= 5 ? "text-green-500" :
          stats.avgSpamRate <= 15 ? "text-yellow-500" : "text-red-500"
        )}>
          {stats.avgSpamRate.toFixed(1)}%
        </p>
        <p className="text-xs text-muted-foreground">Spam Rate</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold">{stats.totalTests}</p>
        <p className="text-xs text-muted-foreground">Total Tests</p>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function InboxPlacementChart({
  placements = [],
  data,
  lastTestDate,
  showDetails = false,
  className,
}: InboxPlacementChartProps) {
  // Convert data prop to placements format if provided
  const effectivePlacements = useMemo(() => {
    if (data) {
      const result: PlacementResult[] = [];
      const timestamp = lastTestDate || new Date().toISOString();

      if (data.gmail) {
        result.push({ provider: "Gmail", placement: "inbox", timestamp, testId: "data-gmail" });
      }
      if (data.outlook) {
        result.push({ provider: "Outlook", placement: "inbox", timestamp, testId: "data-outlook" });
      }
      if (data.yahoo) {
        result.push({ provider: "Yahoo", placement: "inbox", timestamp, testId: "data-yahoo" });
      }
      return result;
    }
    return placements;
  }, [data, placements, lastTestDate]);

  // Convert data prop to provider stats if provided
  const providerStats = useMemo(() => {
    if (data) {
      const stats: ProviderStats[] = [];
      if (data.gmail) {
        stats.push({
          provider: "Gmail",
          inboxRate: data.gmail.inbox,
          spamRate: data.gmail.spam,
          promotionsRate: 0,
          missingRate: data.gmail.missing || 0,
          totalTests: 10,
          trend: "stable",
          lastPlacement: "inbox",
        });
      }
      if (data.outlook) {
        stats.push({
          provider: "Outlook",
          inboxRate: data.outlook.inbox,
          spamRate: data.outlook.spam,
          promotionsRate: 0,
          missingRate: data.outlook.missing || 0,
          totalTests: 10,
          trend: "stable",
          lastPlacement: "inbox",
        });
      }
      if (data.yahoo) {
        stats.push({
          provider: "Yahoo",
          inboxRate: data.yahoo.inbox,
          spamRate: data.yahoo.spam,
          promotionsRate: 0,
          missingRate: data.yahoo.missing || 0,
          totalTests: 10,
          trend: "stable",
          lastPlacement: "inbox",
        });
      }
      return stats;
    }
    return calculateProviderStats(effectivePlacements);
  }, [data, effectivePlacements]);

  const overallStats = useMemo(() => calculateOverallStats(providerStats), [providerStats]);

  console.log("[InboxPlacementChart] Rendering with", {
    totalPlacements: effectivePlacements.length,
    providers: providerStats.length,
    avgInboxRate: overallStats.avgInboxRate,
  });

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Inbox Placement
        </CardTitle>
        <CardDescription>
          Email delivery performance across major providers
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall Summary */}
        <OverallSummary stats={overallStats} />

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500" />
            Inbox
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-yellow-500" />
            Promotions
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500" />
            Spam
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gray-500" />
            Missing
          </span>
        </div>

        {/* Provider Breakdown */}
        <div className="space-y-2">
          {providerStats.length > 0 ? (
            providerStats.map((stats) => (
              <ProviderRow key={stats.provider} stats={stats} showDetails={showDetails} />
            ))
          ) : (
            <div className="text-center py-8">
              <Target className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No placement tests run yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Run a test to see where your emails land
              </p>
            </div>
          )}
        </div>

        {/* Recommendations */}
        {providerStats.length > 0 && (
          <div className="pt-4 border-t space-y-2">
            <h4 className="text-sm font-medium">Recommendations</h4>
            {providerStats.some((s) => s.spamRate > 10) && (
              <div className="flex items-start gap-2 text-sm text-yellow-600 bg-yellow-500/10 p-2 rounded">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  High spam rate detected. Continue warmup and verify DNS records (SPF, DKIM, DMARC).
                </span>
              </div>
            )}
            {providerStats.some((s) => s.promotionsRate > 30) && (
              <div className="flex items-start gap-2 text-sm text-blue-600 bg-blue-500/10 p-2 rounded">
                <Archive className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  Emails landing in Promotions. Reduce marketing language and images.
                </span>
              </div>
            )}
            {overallStats.avgInboxRate >= 90 && (
              <div className="flex items-start gap-2 text-sm text-green-600 bg-green-500/10 p-2 rounded">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  Excellent inbox placement! Maintain current warmup schedule.
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default InboxPlacementChart;
