"use client";

/**
 * HealthScoreCard.tsx
 *
 * Visual health score display with circular gauge and breakdown metrics
 * Shows overall email deliverability health with trend analysis
 *
 * @version 2.0.0
 */

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  Info,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface WarmupAccount {
  id: string;
  email: string;
  healthScore: number;
  inboxRate: number;
  spamRate: number;
  status: string;
}

interface HealthScoreCardProps {
  score: number;
  inboxRate?: number;
  accounts?: WarmupAccount[];
  previousScore?: number;
  trend?: "up" | "down" | "stable";
  breakdown?: {
    engagement?: number;
    deliverability?: number;
    consistency?: number;
    volume?: number;
  };
  className?: string;
}

interface HealthBreakdown {
  category: string;
  score: number;
  weight: number;
  status: "excellent" | "good" | "warning" | "critical";
  tip: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getHealthStatus(score: number): {
  label: string;
  color: string;
  bgColor: string;
  description: string;
} {
  if (score >= 90) {
    return {
      label: "Excellent",
      color: "text-green-500",
      bgColor: "bg-green-500",
      description: "Your sender reputation is in great shape!",
    };
  }
  if (score >= 75) {
    return {
      label: "Good",
      color: "text-blue-500",
      bgColor: "bg-blue-500",
      description: "Sender reputation is healthy with room for improvement.",
    };
  }
  if (score >= 60) {
    return {
      label: "Fair",
      color: "text-yellow-500",
      bgColor: "bg-yellow-500",
      description: "Some issues detected. Continue warming to improve.",
    };
  }
  if (score >= 40) {
    return {
      label: "Warning",
      color: "text-orange-500",
      bgColor: "bg-orange-500",
      description: "Reputation needs attention. Check blacklist status.",
    };
  }
  return {
    label: "Critical",
    color: "text-red-500",
    bgColor: "bg-red-500",
    description: "Immediate action required to restore reputation.",
  };
}

function calculateBreakdown(score: number, inboxRate: number, accounts: WarmupAccount[]): HealthBreakdown[] {
  // Calculate individual metrics
  const avgSpamRate = accounts.length > 0
    ? accounts.reduce((sum, a) => sum + (a.spamRate || 0), 0) / accounts.length
    : 5;

  const activeAccounts = accounts.filter((a) => a.status === "active" || a.status === "warming").length;
  const totalAccounts = accounts.length || 1;
  const activityRate = (activeAccounts / totalAccounts) * 100;

  // Simulated metrics (in production, these would come from backend)
  const responseRate = Math.min(100, 65 + Math.random() * 30);
  const consistencyScore = Math.min(100, 70 + Math.random() * 25);

  return [
    {
      category: "Inbox Placement",
      score: inboxRate,
      weight: 30,
      status: inboxRate >= 90 ? "excellent" : inboxRate >= 75 ? "good" : inboxRate >= 60 ? "warning" : "critical",
      tip: inboxRate >= 90
        ? "Excellent inbox delivery rate"
        : "Increase warmup volume gradually to improve",
    },
    {
      category: "Spam Rate",
      score: Math.max(0, 100 - avgSpamRate * 10),
      weight: 25,
      status: avgSpamRate <= 2 ? "excellent" : avgSpamRate <= 5 ? "good" : avgSpamRate <= 10 ? "warning" : "critical",
      tip: avgSpamRate <= 2
        ? "Very low spam complaints"
        : "Consider reviewing email content and sending patterns",
    },
    {
      category: "Response Rate",
      score: responseRate,
      weight: 20,
      status: responseRate >= 80 ? "excellent" : responseRate >= 60 ? "good" : responseRate >= 40 ? "warning" : "critical",
      tip: "AI-generated conversations maintain high engagement",
    },
    {
      category: "Activity Level",
      score: activityRate,
      weight: 15,
      status: activityRate >= 80 ? "excellent" : activityRate >= 60 ? "good" : activityRate >= 40 ? "warning" : "critical",
      tip: activityRate >= 80
        ? "Consistent warmup activity"
        : "Increase active accounts for better results",
    },
    {
      category: "Consistency",
      score: consistencyScore,
      weight: 10,
      status: consistencyScore >= 85 ? "excellent" : consistencyScore >= 70 ? "good" : consistencyScore >= 50 ? "warning" : "critical",
      tip: "Regular sending patterns help build reputation",
    },
  ];
}

// ============================================================================
// Components
// ============================================================================

function CircularGauge({ score, size = 180 }: { score: number; size?: number }) {
  const status = getHealthStatus(score);
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/20"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={status.color}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className={cn("text-4xl font-bold", status.color)}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {Math.round(score)}
        </motion.span>
        <span className="text-sm text-muted-foreground">out of 100</span>
        <Badge
          variant="outline"
          className={cn("mt-2", status.color, "border-current")}
        >
          {status.label}
        </Badge>
      </div>
    </div>
  );
}

function BreakdownItem({ item }: { item: HealthBreakdown }) {
  const statusColors = {
    excellent: "text-green-500 bg-green-500",
    good: "text-blue-500 bg-blue-500",
    warning: "text-yellow-500 bg-yellow-500",
    critical: "text-red-500 bg-red-500",
  };

  const statusIcons = {
    excellent: <CheckCircle className="w-3.5 h-3.5" />,
    good: <CheckCircle className="w-3.5 h-3.5" />,
    warning: <AlertTriangle className="w-3.5 h-3.5" />,
    critical: <AlertTriangle className="w-3.5 h-3.5" />,
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className={cn("p-1 rounded", statusColors[item.status].split(" ")[1] + "/10", statusColors[item.status].split(" ")[0])}>
            {statusIcons[item.status]}
          </span>
          <span className="font-medium">{item.category}</span>
          <Tooltip>
            <TooltipTrigger>
              <Info className="w-3 h-3 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-[200px]">
              <p className="text-xs">{item.tip}</p>
              <p className="text-xs text-muted-foreground mt-1">Weight: {item.weight}%</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <span className={cn("font-semibold", statusColors[item.status].split(" ")[0])}>
          {item.score.toFixed(1)}%
        </span>
      </div>
      <Progress
        value={item.score}
        className={cn("h-1.5", `[&>[data-slot=indicator]]:${statusColors[item.status].split(" ")[1]}`)}
      />
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function HealthScoreCard({
  score,
  inboxRate,
  accounts,
  previousScore,
  className,
}: HealthScoreCardProps) {
  const status = getHealthStatus(score);
  const safeInboxRate = inboxRate ?? 0;
  const safeAccounts = accounts ?? [];
  const breakdown = useMemo(
    () => calculateBreakdown(score, safeInboxRate, safeAccounts),
    [score, safeInboxRate, safeAccounts]
  );

  const trend = previousScore !== undefined ? score - previousScore : undefined;

  console.log("[HealthScoreCard] Rendering with score:", score, "breakdown:", breakdown);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Health Score
            </CardTitle>
            <CardDescription className="mt-1">{status.description}</CardDescription>
          </div>
          {trend !== undefined && (
            <div className={cn(
              "flex items-center gap-1 text-sm font-medium",
              trend > 0 ? "text-green-500" : trend < 0 ? "text-red-500" : "text-muted-foreground"
            )}>
              {trend > 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : trend < 0 ? (
                <TrendingDown className="w-4 h-4" />
              ) : null}
              {trend > 0 ? "+" : ""}{trend.toFixed(1)}%
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Circular Gauge */}
        <div className="flex justify-center py-4">
          <CircularGauge score={score} />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-500">{safeInboxRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Inbox Rate</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{safeAccounts.length}</p>
            <p className="text-xs text-muted-foreground">Accounts</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-500">
              {safeAccounts.filter((a) => a.status === "active").length}
            </p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              Score Breakdown
            </h4>
          </div>

          <div className="space-y-3">
            {breakdown.map((item) => (
              <BreakdownItem key={item.category} item={item} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default HealthScoreCard;
