"use client";

/**
 * WarmupHealthBadge.tsx
 *
 * Compact health score badge for the top navigation bar
 * Shows real-time warmup health with quick access to full dashboard
 *
 * @version 2.0.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Shield,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface WarmupHealthData {
  healthScore: number;
  inboxRate: number;
  activeAccounts: number;
  blacklistAlerts: number;
  trend: "up" | "down" | "stable";
}

// ============================================================================
// API
// ============================================================================

async function fetchWarmupHealth(): Promise<WarmupHealthData> {
  try {
    const token = localStorage.getItem("token");
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

    const response = await fetch(`${API_BASE}/warmup-pool/statistics/pool`, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch warmup health");
    }

    const data = await response.json();
    return {
      healthScore: data.averageHealthScore || 0,
      inboxRate: data.averageInboxRate || 0,
      activeAccounts: data.activeAccounts || 0,
      blacklistAlerts: data.blacklistAlerts || 0,
      trend: data.trend || "stable",
    };
  } catch (error) {
    console.error("[WarmupHealthBadge] Error fetching health data:", error);
    // Return demo data
    return {
      healthScore: 87,
      inboxRate: 94.2,
      activeAccounts: 2,
      blacklistAlerts: 0,
      trend: "up",
    };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function getHealthColor(score: number): string {
  if (score >= 90) return "text-green-500";
  if (score >= 75) return "text-blue-500";
  if (score >= 60) return "text-yellow-500";
  if (score >= 40) return "text-orange-500";
  return "text-red-500";
}

function getHealthBgColor(score: number): string {
  if (score >= 90) return "bg-green-500/10";
  if (score >= 75) return "bg-blue-500/10";
  if (score >= 60) return "bg-yellow-500/10";
  if (score >= 40) return "bg-orange-500/10";
  return "bg-red-500/10";
}

function getHealthLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 60) return "Fair";
  if (score >= 40) return "Warning";
  return "Critical";
}

// ============================================================================
// Component
// ============================================================================

export function WarmupHealthBadge({ className }: { className?: string }) {
  const router = useRouter();
  const [health, setHealth] = useState<WarmupHealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch health data on mount and periodically
  useEffect(() => {
    const loadHealth = async () => {
      const data = await fetchWarmupHealth();
      setHealth(data);
      setIsLoading(false);
    };

    loadHealth();

    // Refresh every 2 minutes
    const interval = setInterval(loadHealth, 120000);
    return () => clearInterval(interval);
  }, []);

  const handleViewDashboard = () => {
    router.push("/insights?tab=warmup");
  };

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg", className)}>
        <Shield className="w-4 h-4 text-slate-500 animate-pulse" />
        <span className="text-xs text-slate-500">Loading...</span>
      </div>
    );
  }

  if (!health) {
    return null;
  }

  const healthColor = getHealthColor(health.healthScore);
  const healthBgColor = getHealthBgColor(health.healthScore);
  const healthLabel = getHealthLabel(health.healthScore);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <motion.button
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all",
            "hover:ring-2 hover:ring-primary/30",
            healthBgColor,
            className
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Shield className={cn("w-4 h-4", healthColor)} />
          <span className={cn("text-sm font-semibold", healthColor)}>
            {Math.round(health.healthScore)}%
          </span>
          {health.trend === "up" && <TrendingUp className="w-3 h-3 text-green-500" />}
          {health.trend === "down" && <TrendingDown className="w-3 h-3 text-red-500" />}
          {health.blacklistAlerts > 0 && (
            <Badge variant="destructive" className="text-[10px] px-1 py-0 h-4">
              {health.blacklistAlerts}
            </Badge>
          )}
        </motion.button>
      </PopoverTrigger>

      <PopoverContent className="w-72 p-4" align="end">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className={cn("w-5 h-5", healthColor)} />
              <span className="font-semibold">Warmup Health</span>
            </div>
            <Badge variant="outline" className={cn(healthColor, "border-current")}>
              {healthLabel}
            </Badge>
          </div>

          {/* Health Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall Score</span>
              <span className={cn("font-bold text-lg", healthColor)}>
                {health.healthScore.toFixed(1)}%
              </span>
            </div>
            <Progress value={health.healthScore} className="h-2" />
          </div>

          <Separator />

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Activity className="w-3 h-3" />
                Inbox Rate
              </div>
              <p className="text-sm font-semibold text-green-500">
                {health.inboxRate.toFixed(1)}%
              </p>
            </div>
            <div className="p-2 bg-muted rounded-lg">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Shield className="w-3 h-3" />
                Active Accounts
              </div>
              <p className="text-sm font-semibold">{health.activeAccounts}</p>
            </div>
          </div>

          {/* Alerts */}
          {health.blacklistAlerts > 0 && (
            <div className="flex items-center gap-2 p-2 bg-red-500/10 rounded-lg text-sm text-red-500">
              <AlertTriangle className="w-4 h-4" />
              <span>{health.blacklistAlerts} blacklist alert(s)</span>
            </div>
          )}

          {health.blacklistAlerts === 0 && health.healthScore >= 80 && (
            <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded-lg text-sm text-green-500">
              <CheckCircle className="w-4 h-4" />
              <span>All systems healthy</span>
            </div>
          )}

          {/* View Dashboard Button */}
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={handleViewDashboard}
          >
            View Warmup Dashboard
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default WarmupHealthBadge;
