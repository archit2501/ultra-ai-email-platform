"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassPanelProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  className?: string;
  blur?: "sm" | "md" | "lg" | "xl";
  opacity?: "low" | "medium" | "high";
  border?: boolean;
  glow?: boolean;
  glowColor?: "blue" | "purple" | "green" | "orange" | "pink";
  animated?: boolean;
  delay?: number;
}

const blurClasses = {
  sm: "backdrop-blur-sm",
  md: "backdrop-blur-md",
  lg: "backdrop-blur-lg",
  xl: "backdrop-blur-xl",
};

const opacityClasses = {
  low: "bg-slate-900/20",
  medium: "bg-slate-900/40",
  high: "bg-slate-900/60",
};

const glowColorClasses = {
  blue: "shadow-blue-500/30",
  purple: "shadow-purple-500/30",
  green: "shadow-green-500/30",
  orange: "shadow-orange-500/30",
  pink: "shadow-pink-500/30",
};

export function GlassPanel({
  children,
  className,
  blur = "lg",
  opacity = "medium",
  border = true,
  glow = false,
  glowColor = "blue",
  animated = true,
  delay = 0,
  ...props
}: GlassPanelProps) {
  const containerClass = cn(
    "relative rounded-2xl overflow-hidden",
    blurClasses[blur],
    opacityClasses[opacity],
    border && "border border-white/10",
    glow && `shadow-lg ${glowColorClasses[glowColor]}`,
    className
  );

  const innerContent = (
    <>
      {/* Inner glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />

      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </>
  );

  if (animated) {
    return (
      <motion.div
        className={containerClass}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.5,
          delay,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        {...props}
      >
        {innerContent}
      </motion.div>
    );
  }

  return (
    <div className={containerClass}>
      {innerContent}
    </div>
  );
}

// Floating Glass Card variant
interface FloatingGlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
  onClick?: () => void;
}

export function FloatingGlassCard({
  children,
  className,
  hover = true,
  delay = 0,
  onClick,
}: FloatingGlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={
        hover
          ? {
              y: -8,
              transition: { duration: 0.3, ease: "easeOut" },
            }
          : undefined
      }
      onClick={onClick}
      className={cn(
        "group relative rounded-2xl overflow-hidden",
        "bg-gradient-to-br from-slate-800/60 via-slate-800/40 to-slate-900/60",
        "backdrop-blur-xl border border-white/10",
        "shadow-xl shadow-black/20",
        (hover || onClick) && "cursor-pointer",
        className
      )}
    >
      {/* Animated gradient border */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-[-2px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl animate-gradient-x" />
        <div className="absolute inset-[1px] bg-slate-900 rounded-2xl" />
      </div>

      {/* Shine sweep effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </div>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

// Glass Modal Overlay
interface GlassModalProps {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function GlassModal({
  children,
  isOpen,
  onClose,
  className,
}: GlassModalProps) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={cn(
          "relative rounded-2xl overflow-hidden",
          "bg-gradient-to-br from-slate-800/80 via-slate-800/60 to-slate-900/80",
          "backdrop-blur-xl border border-white/10",
          "shadow-2xl shadow-black/40",
          "max-w-lg w-full max-h-[90vh] overflow-y-auto",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Inner glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />

        {/* Content */}
        <div className="relative z-10">{children}</div>
      </motion.div>
    </motion.div>
  );
}
