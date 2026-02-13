"use client";

import React from "react";
import { motion } from "framer-motion";
import { Clock, Sparkles, AlertTriangle, XCircle } from "lucide-react";
import { calculateFreshness } from "./utils/researchCache";

interface CacheFreshnessIndicatorProps {
  timestamp: string;
  type?: "research" | "email";
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

/**
 * CacheFreshnessIndicator - God-Tier Freshness Badge
 * Shows how old cached data is with beautiful color coding and animations
 */
export function CacheFreshnessIndicator({
  timestamp,
  type = "research",
  showIcon = true,
  size = "md",
}: CacheFreshnessIndicatorProps) {
  const freshness = calculateFreshness(timestamp);

  // Size configurations
  const sizeConfig = {
    sm: {
      container: "px-2 py-1 text-xs gap-1",
      icon: "w-3 h-3",
      text: "text-xs",
    },
    md: {
      container: "px-3 py-1.5 text-sm gap-1.5",
      icon: "w-3.5 h-3.5",
      text: "text-sm",
    },
    lg: {
      container: "px-4 py-2 text-base gap-2",
      icon: "w-4 h-4",
      text: "text-base",
    },
  };

  const config = sizeConfig[size];

  // Icon based on freshness
  const getIcon = () => {
    if (freshness.fresh) return <Sparkles className={config.icon} />;
    if (freshness.ageInDays < 7) return <Clock className={config.icon} />;
    if (freshness.ageInDays < 30) return <AlertTriangle className={config.icon} />;
    return <XCircle className={config.icon} />;
  };

  // Animation variants based on freshness
  const getAnimationVariants = () => {
    if (freshness.fresh) {
      // Fresh data: Pulsing glow
      return {
        initial: { opacity: 0.8, scale: 1 },
        animate: {
          opacity: [0.8, 1, 0.8],
          scale: [1, 1.02, 1],
          transition: {
            repeat: Infinity,
            duration: 2,
            ease: "easeInOut" as const,
          },
        },
      };
    } else if (freshness.stale) {
      // Stale data: Gentle pulse warning
      return {
        initial: { opacity: 1 },
        animate: {
          opacity: [1, 0.7, 1],
          transition: {
            repeat: Infinity,
            duration: 3,
            ease: "easeInOut" as const,
          },
        },
      };
    } else {
      // Normal: Subtle hover effect only
      return {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
      };
    }
  };

  const animationVariants = getAnimationVariants();

  // Shimmer effect for cached content
  const shimmerVariants = {
    initial: { backgroundPosition: "-200% 0" },
    animate: {
      backgroundPosition: "200% 0",
      transition: {
        repeat: Infinity,
        duration: 3,
        ease: "linear" as const,
      },
    },
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={animationVariants}
      whileHover={{ scale: 1.05, y: -1 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
      className="relative inline-flex"
    >
      {/* Shimmer background overlay */}
      <motion.div
        variants={shimmerVariants}
        className="absolute inset-0 rounded-full opacity-20"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
          backgroundSize: "200% 100%",
        }}
      />

      {/* Main badge */}
      <div
        className={`
          relative inline-flex items-center rounded-full border
          backdrop-blur-sm
          ${freshness.colorClass}
          ${config.container}
          transition-all duration-300
        `}
      >
        {/* Icon with rotation for fresh content */}
        {showIcon && (
          <motion.div
            animate={
              freshness.fresh
                ? {
                    rotate: [0, 360],
                    transition: {
                      repeat: Infinity,
                      duration: 4,
                      ease: "linear",
                    },
                  }
                : {}
            }
            className="flex-shrink-0"
          >
            {getIcon()}
          </motion.div>
        )}

        {/* Age text */}
        <span className={`font-medium whitespace-nowrap ${config.text}`}>
          {freshness.ageText}
        </span>

        {/* Glow effect for fresh content */}
        {freshness.fresh && (
          <motion.div
            className="absolute inset-0 rounded-full bg-green-500/30 blur-md -z-10"
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.1, 1],
            }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: "easeInOut",
            }}
          />
        )}

        {/* Warning glow for stale content */}
        {freshness.stale && (
          <motion.div
            className="absolute inset-0 rounded-full bg-red-500/20 blur-md -z-10"
            animate={{
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              repeat: Infinity,
              duration: 3,
              ease: "easeInOut",
            }}
          />
        )}
      </div>

      {/* Tooltip on hover */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileHover={{ opacity: 1, y: 0 }}
        className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-3 py-2 bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg shadow-xl pointer-events-none z-50 whitespace-nowrap"
      >
        <div className="text-xs text-slate-300">
          <div className="font-semibold mb-1">
            {type === "research" ? "Company Research" : "Email Template"}
          </div>
          <div className="text-slate-400">
            {freshness.fresh && "Fresh - Recently generated"}
            {!freshness.fresh && !freshness.stale && "Cached - Still valid"}
            {freshness.stale && "Stale - Consider regenerating"}
          </div>
          <div className="text-slate-500 text-xs mt-1">
            Generated: {new Date(timestamp).toLocaleString()}
          </div>
        </div>
        {/* Tooltip arrow */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-slate-900 border-l border-t border-slate-700 rotate-45" />
      </motion.div>
    </motion.div>
  );
}

/**
 * Compact version for inline use
 */
export function CompactFreshnessIndicator({
  timestamp,
  type = "research",
}: Pick<CacheFreshnessIndicatorProps, "timestamp" | "type">) {
  return (
    <CacheFreshnessIndicator
      timestamp={timestamp}
      type={type}
      showIcon={true}
      size="sm"
    />
  );
}

/**
 * Large version for prominent display
 */
export function LargeFreshnessIndicator({
  timestamp,
  type = "research",
}: Pick<CacheFreshnessIndicatorProps, "timestamp" | "type">) {
  return (
    <CacheFreshnessIndicator
      timestamp={timestamp}
      type={type}
      showIcon={true}
      size="lg"
    />
  );
}
