"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface SkeletonProps {
  className?: string;
  variant?: "default" | "shimmer" | "pulse" | "wave";
  style?: React.CSSProperties;
}

export function Skeleton({ className, variant = "shimmer", style }: SkeletonProps) {
  const baseClasses = "bg-slate-700/50 rounded";

  if (variant === "pulse") {
    return (
      <div className={cn(baseClasses, "animate-pulse", className)} style={style} />
    );
  }

  if (variant === "wave") {
    return (
      <div className={cn(baseClasses, "relative overflow-hidden", className)} style={style}>
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-600/30 to-transparent"
          animate={{
            x: ["-100%", "100%"],
          }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            ease: "linear",
          }}
        />
      </div>
    );
  }

  // Default shimmer
  return (
    <div
      className={cn(
        baseClasses,
        "relative overflow-hidden",
        "before:absolute before:inset-0",
        "before:bg-gradient-to-r before:from-transparent before:via-slate-600/20 before:to-transparent",
        "before:animate-shimmer",
        className
      )}
      style={style}
    />
  );
}

// Skeleton for text lines
interface SkeletonTextProps {
  lines?: number;
  lastLineWidth?: string;
  className?: string;
  gap?: "sm" | "md" | "lg";
}

export function SkeletonText({
  lines = 3,
  lastLineWidth = "60%",
  className,
  gap = "md",
}: SkeletonTextProps) {
  const gapClasses = {
    sm: "space-y-1",
    md: "space-y-2",
    lg: "space-y-3",
  };

  return (
    <div className={cn(gapClasses[gap], className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 ? `w-[${lastLineWidth}]` : "w-full"
          )}
          style={i === lines - 1 ? { width: lastLineWidth } : undefined}
        />
      ))}
    </div>
  );
}

// Skeleton for cards
interface SkeletonCardProps {
  hasImage?: boolean;
  lines?: number;
  className?: string;
}

export function SkeletonCard({
  hasImage = true,
  lines = 3,
  className,
}: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-700/50 bg-slate-800/50 p-4 space-y-4",
        className
      )}
    >
      {hasImage && <Skeleton className="w-full h-40 rounded-lg" />}
      <div className="space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <SkeletonText lines={lines} />
      </div>
    </div>
  );
}

// Skeleton for stat cards
export function SkeletonStatCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-700/50 bg-slate-800/50 p-6",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-12 w-12 rounded-xl" />
      </div>
    </div>
  );
}

// Skeleton for table rows
interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
}: SkeletonTableProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* Header */}
      <div className="flex gap-4 pb-4 border-b border-slate-700/50">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      <div className="divide-y divide-slate-700/30">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex gap-4 py-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                className={cn(
                  "h-4 flex-1",
                  colIndex === 0 && "w-1/4 flex-none"
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton for avatar
interface SkeletonAvatarProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function SkeletonAvatar({ size = "md", className }: SkeletonAvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  return (
    <Skeleton className={cn("rounded-full", sizeClasses[size], className)} />
  );
}

// Skeleton for user profile
export function SkeletonProfile({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <SkeletonAvatar size="lg" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

// Skeleton for list items
interface SkeletonListProps {
  items?: number;
  hasAvatar?: boolean;
  className?: string;
}

export function SkeletonList({
  items = 5,
  hasAvatar = true,
  className,
}: SkeletonListProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          {hasAvatar && <SkeletonAvatar />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// Dashboard skeleton layout
export function DashboardSkeleton() {
  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6 space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6 space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
        <Skeleton className="h-6 w-40 mb-6" />
        <SkeletonTable rows={5} columns={5} />
      </div>
    </div>
  );
}
