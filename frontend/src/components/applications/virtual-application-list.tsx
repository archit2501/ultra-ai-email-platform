"use client";

/**
 * Virtual Application List Component
 *
 * High-performance virtualized list for rendering large numbers of applications.
 * Uses @tanstack/react-virtual for windowing - only renders visible items.
 */

import * as React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/utils";
import type { Application } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FloatingGlassCard } from "@/components/ui/glass-panel";
import {
  Building2,
  Mail,
  Calendar,
  ExternalLink,
  MoreVertical,
  CheckCircle2,
  Clock,
  XCircle,
  Send,
  Eye,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ============================================
// Types
// ============================================

interface VirtualApplicationListProps {
  applications: Application[];
  height?: number | string;
  isLoading?: boolean;
  onViewApplication?: (app: Application) => void;
  onSendEmail?: (app: Application) => void;
  onUpdateStatus?: (app: Application, status: string) => void;
  className?: string;
}

// ============================================
// Status Badge Helper
// ============================================

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  draft: {
    label: "Draft",
    variant: "secondary",
    icon: <Clock className="h-3 w-3" />,
  },
  pending: {
    label: "Pending",
    variant: "outline",
    icon: <Clock className="h-3 w-3" />,
  },
  sent: {
    label: "Sent",
    variant: "default",
    icon: <Send className="h-3 w-3" />,
  },
  delivered: {
    label: "Delivered",
    variant: "default",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  opened: {
    label: "Opened",
    variant: "default",
    icon: <Eye className="h-3 w-3" />,
  },
  replied: {
    label: "Replied",
    variant: "default",
    icon: <Mail className="h-3 w-3" />,
  },
  interview: {
    label: "Interview",
    variant: "default",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  rejected: {
    label: "Rejected",
    variant: "destructive",
    icon: <XCircle className="h-3 w-3" />,
  },
  failed: {
    label: "Failed",
    variant: "destructive",
    icon: <XCircle className="h-3 w-3" />,
  },
};

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.draft;
  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      {config.icon}
      {config.label}
    </Badge>
  );
}

// ============================================
// Application Row Component (Memoized)
// ============================================

interface ApplicationRowProps {
  application: Application;
  style: React.CSSProperties;
  onView?: () => void;
  onSend?: () => void;
  onUpdateStatus?: (status: string) => void;
}

const ApplicationRow = React.memo(function ApplicationRow({
  application,
  style,
  onView,
  onSend,
  onUpdateStatus,
}: ApplicationRowProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div style={style} className="px-2 py-1">
      <FloatingGlassCard
        className="p-4 transition-all duration-200 hover:scale-[1.01] cursor-pointer"
        onClick={onView}
      >
        <div className="flex items-center justify-between gap-4">
          {/* Company Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
              <Building2 className="h-5 w-5 text-purple-400" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-white truncate">
                {application.company_name || "Unknown Company"}
              </h3>
              <p className="text-sm text-gray-400 truncate">
                {application.position_title || "No title specified"}
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="shrink-0">
            <StatusBadge status={application.status} />
          </div>

          {/* Date */}
          <div className="hidden md:flex items-center gap-2 text-sm text-gray-400 shrink-0">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(application.sent_at || application.created_at)}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {application.status === "draft" && (
              <Button
                size="sm"
                variant="ghost"
                className="text-purple-400 hover:text-purple-300"
                onClick={(e) => {
                  e.stopPropagation();
                  onSend?.();
                }}
              >
                <Send className="h-4 w-4 mr-1" />
                Send
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={onView}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                {application.job_posting_url && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(application.job_posting_url, "_blank");
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Job Posting
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateStatus?.("replied");
                  }}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Mark as Replied
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateStatus?.("interview");
                  }}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark as Interview
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateStatus?.("rejected");
                  }}
                  className="text-red-400"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Mark as Rejected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </FloatingGlassCard>
    </div>
  );
});

// ============================================
// Virtual Application List Component
// ============================================

export function VirtualApplicationList({
  applications,
  height = 600,
  isLoading = false,
  onViewApplication,
  onSendEmail,
  onUpdateStatus,
  className,
}: VirtualApplicationListProps) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: applications.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 88, // Estimated row height
    overscan: 5,
    getItemKey: (index) => applications[index].id,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Loading state
  if (isLoading) {
    return (
      <div
        className={cn(
          "flex items-center justify-center text-gray-400",
          className
        )}
        style={{ height: typeof height === "number" ? `${height}px` : height }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
          <span>Loading applications...</span>
        </div>
      </div>
    );
  }

  // Empty state
  if (applications.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center text-gray-400 gap-4",
          className
        )}
        style={{ height: typeof height === "number" ? `${height}px` : height }}
      >
        <div className="h-16 w-16 rounded-full bg-gray-800/50 flex items-center justify-center">
          <Mail className="h-8 w-8 text-gray-500" />
        </div>
        <div className="text-center">
          <p className="font-medium text-white">No applications yet</p>
          <p className="text-sm text-gray-500">
            Start by adding companies to apply to
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Stats bar */}
      <div className="mb-4 flex items-center justify-between text-sm text-gray-400">
        <span>
          Showing <span className="text-white font-medium">{applications.length}</span> applications
        </span>
        <span className="text-xs">
          Rendering {virtualItems.length} of {applications.length} items
        </span>
      </div>

      {/* Virtual list container */}
      <div
        ref={parentRef}
        className="overflow-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
        style={{ height: typeof height === "number" ? `${height}px` : height }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualItems.map((virtualRow) => {
            const application = applications[virtualRow.index];
            return (
              <ApplicationRow
                key={virtualRow.key}
                application={application}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                onView={() => onViewApplication?.(application)}
                onSend={() => onSendEmail?.(application)}
                onUpdateStatus={(status) => onUpdateStatus?.(application, status)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default VirtualApplicationList;
