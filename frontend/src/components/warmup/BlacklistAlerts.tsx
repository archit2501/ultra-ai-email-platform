"use client";

/**
 * BlacklistAlerts.tsx
 *
 * Displays blacklist monitoring alerts and status
 * Shows active alerts, severity levels, and delisting guidance
 *
 * @version 2.0.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  ExternalLink,
  Clock,
  Server,
  Globe,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Bell,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface BlacklistAlert {
  id: string;
  blacklistName: string;
  severity: "critical" | "warning" | "info";
  domain: string;
  ip?: string;
  detectedAt: string;
  status: "active" | "resolved" | "monitoring";
  delistingUrl?: string;
  description?: string;
}

interface BlacklistAlertsProps {
  alerts: BlacklistAlert[];
  onViewAll?: () => void;
  showAll?: boolean;
  className?: string;
}

// ============================================================================
// Blacklist Information
// ============================================================================

const blacklistInfo: Record<string, {
  category: string;
  impact: string;
  delistProcess: string;
  avgDelistTime: string;
}> = {
  "Spamhaus ZEN": {
    category: "Major",
    impact: "High - Blocks at many large ISPs",
    delistProcess: "Submit removal request at spamhaus.org",
    avgDelistTime: "24-48 hours",
  },
  "Spamhaus SBL": {
    category: "Major",
    impact: "Critical - Severe delivery issues",
    delistProcess: "Manual review required",
    avgDelistTime: "24-72 hours",
  },
  "Barracuda": {
    category: "Major",
    impact: "High - Many corporate filters",
    delistProcess: "Automatic after issue resolved",
    avgDelistTime: "12-24 hours",
  },
  "SpamCop": {
    category: "Major",
    impact: "Medium-High - Wide usage",
    delistProcess: "Automatic expiry",
    avgDelistTime: "24-48 hours",
  },
  "SORBS": {
    category: "Major",
    impact: "Medium - Some ISPs use it",
    delistProcess: "Submit removal request",
    avgDelistTime: "24-48 hours",
  },
  "Invaluement": {
    category: "Minor",
    impact: "Low-Medium - Fewer users",
    delistProcess: "Contact support",
    avgDelistTime: "48-72 hours",
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

function getSeverityConfig(severity: string) {
  switch (severity) {
    case "critical":
      return {
        icon: <XCircle className="w-4 h-4" />,
        color: "text-red-500",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/50",
        label: "Critical",
      };
    case "warning":
      return {
        icon: <AlertTriangle className="w-4 h-4" />,
        color: "text-yellow-500",
        bgColor: "bg-yellow-500/10",
        borderColor: "border-yellow-500/50",
        label: "Warning",
      };
    case "info":
    default:
      return {
        icon: <Info className="w-4 h-4" />,
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/50",
        label: "Info",
      };
  }
}

function getStatusConfig(status: string) {
  switch (status) {
    case "active":
      return {
        icon: <AlertCircle className="w-3 h-3" />,
        color: "text-red-500",
        label: "Active",
      };
    case "resolved":
      return {
        icon: <CheckCircle className="w-3 h-3" />,
        color: "text-green-500",
        label: "Resolved",
      };
    case "monitoring":
      return {
        icon: <Clock className="w-3 h-3" />,
        color: "text-yellow-500",
        label: "Monitoring",
      };
    default:
      return {
        icon: <Info className="w-3 h-3" />,
        color: "text-gray-500",
        label: status,
      };
  }
}

function formatTimestamp(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// ============================================================================
// Components
// ============================================================================

function AlertItem({
  alert,
  expanded,
  onToggle,
}: {
  alert: BlacklistAlert;
  expanded: boolean;
  onToggle: () => void;
}) {
  const severityConfig = getSeverityConfig(alert.severity);
  const statusConfig = getStatusConfig(alert.status);
  const blInfo = blacklistInfo[alert.blacklistName];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "border rounded-lg overflow-hidden transition-all",
        severityConfig.borderColor,
        alert.status === "active" && "shadow-sm"
      )}
    >
      {/* Alert Header */}
      <div
        className={cn(
          "p-3 cursor-pointer hover:bg-muted/50 transition-colors",
          severityConfig.bgColor
        )}
        onClick={onToggle}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-1.5 rounded-lg", severityConfig.bgColor, severityConfig.color)}>
              {severityConfig.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{alert.blacklistName}</span>
                <Badge
                  variant="outline"
                  className={cn("text-xs", statusConfig.color, "border-current")}
                >
                  {statusConfig.icon}
                  <span className="ml-1">{statusConfig.label}</span>
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                <Globe className="w-3 h-3" />
                <span>{alert.domain}</span>
                {alert.ip && (
                  <>
                    <span>•</span>
                    <Server className="w-3 h-3" />
                    <span>{alert.ip}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {formatTimestamp(alert.detectedAt)}
            </span>
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Separator />
            <div className="p-4 space-y-4">
              {/* Blacklist Info */}
              {blInfo && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Category:</span>
                    <span className="ml-2 font-medium">{blInfo.category}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Avg Delist Time:</span>
                    <span className="ml-2 font-medium">{blInfo.avgDelistTime}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Impact:</span>
                    <span className="ml-2">{blInfo.impact}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Delist Process:</span>
                    <span className="ml-2">{blInfo.delistProcess}</span>
                  </div>
                </div>
              )}

              {/* Description */}
              {alert.description && (
                <p className="text-sm text-muted-foreground">
                  {alert.description}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                {alert.delistingUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(alert.delistingUrl, "_blank");
                    }}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Request Delisting
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Implement recheck
                  }}
                >
                  <RefreshCw className="w-4 h-4" />
                  Recheck Now
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function BlacklistStatusSummary({ alerts }: { alerts: BlacklistAlert[] }) {
  const activeAlerts = alerts.filter((a) => a.status === "active");
  const criticalCount = activeAlerts.filter((a) => a.severity === "critical").length;
  const warningCount = activeAlerts.filter((a) => a.severity === "warning").length;

  // Calculate overall health
  const healthScore = Math.max(0, 100 - criticalCount * 30 - warningCount * 10);

  return (
    <div className="p-4 bg-muted/50 rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Blacklist Health</span>
        <span className={cn(
          "text-lg font-bold",
          healthScore >= 90 ? "text-green-500" :
          healthScore >= 70 ? "text-yellow-500" : "text-red-500"
        )}>
          {healthScore}%
        </span>
      </div>
      <Progress value={healthScore} className="h-2" />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Monitoring 50+ blacklists</span>
        <span>Last checked: 5 min ago</span>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function BlacklistAlerts({
  alerts,
  onViewAll,
  showAll = false,
  className,
}: BlacklistAlertsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Sort alerts by severity and status
  const sortedAlerts = [...alerts].sort((a, b) => {
    // Active alerts first
    if (a.status === "active" && b.status !== "active") return -1;
    if (b.status === "active" && a.status !== "active") return 1;

    // Then by severity
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  const displayedAlerts = showAll ? sortedAlerts : sortedAlerts.slice(0, 3);
  const activeCount = alerts.filter((a) => a.status === "active").length;

  console.log("[BlacklistAlerts] Rendering", {
    total: alerts.length,
    active: activeCount,
    displayed: displayedAlerts.length,
  });

  // Compact mode for overview
  if (!showAll && alerts.length > 0) {
    return (
      <Card className={cn("border-yellow-500/50", className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bell className="w-4 h-4 text-yellow-500" />
              Blacklist Alerts
              {activeCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {activeCount} active
                </Badge>
              )}
            </CardTitle>
            {onViewAll && (
              <Button variant="ghost" size="sm" onClick={onViewAll}>
                View All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {displayedAlerts.map((alert) => {
              const severityConfig = getSeverityConfig(alert.severity);
              return (
                <div
                  key={alert.id}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg text-sm",
                    severityConfig.bgColor
                  )}
                >
                  <span className={severityConfig.color}>{severityConfig.icon}</span>
                  <span className="flex-1 truncate">
                    {alert.blacklistName} - {alert.domain}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(alert.detectedAt)}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full view
  return (
    <div className={cn("space-y-4", className)}>
      {/* Status Summary */}
      <BlacklistStatusSummary alerts={alerts} />

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <div className="text-center py-8 border rounded-lg">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h3 className="font-medium">All Clear!</h3>
          <p className="text-sm text-muted-foreground mt-1">
            No blacklist detections across 50+ monitored lists
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[400px]">
          <div className="space-y-3 pr-4">
            {sortedAlerts.map((alert) => (
              <AlertItem
                key={alert.id}
                alert={alert}
                expanded={expandedId === alert.id}
                onToggle={() => setExpandedId(expandedId === alert.id ? null : alert.id)}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

export default BlacklistAlerts;
