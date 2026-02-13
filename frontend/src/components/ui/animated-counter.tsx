"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  delay?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  once?: boolean;
  format?: boolean;
}

export function AnimatedCounter({
  value,
  duration = 2,
  delay = 0,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
  once = true,
  format = true,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once, margin: "-50px" });
  const [hasAnimated, setHasAnimated] = useState(false);

  const spring = useSpring(0, {
    damping: 30,
    stiffness: 100,
    duration: duration * 1000,
  });

  const display = useTransform(spring, (current) => {
    const num = current.toFixed(decimals);
    if (format) {
      return Number(num).toLocaleString();
    }
    return num;
  });

  useEffect(() => {
    if (isInView && !hasAnimated) {
      const timeout = setTimeout(() => {
        spring.set(value);
        setHasAnimated(true);
      }, delay * 1000);
      return () => clearTimeout(timeout);
    }
  }, [isInView, hasAnimated, value, spring, delay]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}
      <motion.span>{display}</motion.span>
      {suffix}
    </span>
  );
}

// Percentage counter with circular progress
interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  duration?: number;
  delay?: number;
  color?: "blue" | "green" | "purple" | "orange" | "pink";
  showValue?: boolean;
  label?: string;
  className?: string;
}

const colorClasses = {
  blue: "stroke-blue-500",
  green: "stroke-green-500",
  purple: "stroke-purple-500",
  orange: "stroke-orange-500",
  pink: "stroke-pink-500",
};

const bgColorClasses = {
  blue: "stroke-blue-500/20",
  green: "stroke-green-500/20",
  purple: "stroke-purple-500/20",
  orange: "stroke-orange-500/20",
  pink: "stroke-pink-500/20",
};

const glowClasses = {
  blue: "drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]",
  green: "drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]",
  purple: "drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]",
  orange: "drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]",
  pink: "drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]",
};

export function CircularProgress({
  value,
  size = 120,
  strokeWidth = 8,
  duration = 1.5,
  delay = 0,
  color = "blue",
  showValue = true,
  label,
  className,
}: CircularProgressProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [hasAnimated, setHasAnimated] = useState(false);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  const spring = useSpring(0, {
    damping: 30,
    stiffness: 50,
    duration: duration * 1000,
  });

  const strokeDashoffset = useTransform(spring, (current) => {
    return circumference - (current / 100) * circumference;
  });

  const displayValue = useTransform(spring, (current) => Math.round(current));

  useEffect(() => {
    if (isInView && !hasAnimated) {
      const timeout = setTimeout(() => {
        spring.set(Math.min(value, 100));
        setHasAnimated(true);
      }, delay * 1000);
      return () => clearTimeout(timeout);
    }
  }, [isInView, hasAnimated, value, spring, delay]);

  return (
    <div ref={ref} className={cn("relative inline-flex flex-col items-center", className)}>
      <svg
        width={size}
        height={size}
        className={cn("transform -rotate-90", glowClasses[color])}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={bgColorClasses[color]}
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset }}
          className={cn(colorClasses[color], "transition-colors")}
        />
      </svg>

      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span className="text-2xl font-bold text-white">
            {displayValue}
          </motion.span>
          <span className="text-sm text-slate-400">%</span>
        </div>
      )}

      {label && (
        <span className="mt-2 text-sm text-slate-400">{label}</span>
      )}
    </div>
  );
}

// Linear progress bar with animation
interface LinearProgressProps {
  value: number;
  duration?: number;
  delay?: number;
  color?: "blue" | "green" | "purple" | "orange" | "pink";
  showValue?: boolean;
  label?: string;
  height?: "sm" | "md" | "lg";
  className?: string;
}

const heightClasses = {
  sm: "h-1",
  md: "h-2",
  lg: "h-3",
};

const linearColorClasses = {
  blue: "bg-gradient-to-r from-blue-600 to-cyan-500",
  green: "bg-gradient-to-r from-green-600 to-emerald-500",
  purple: "bg-gradient-to-r from-purple-600 to-pink-500",
  orange: "bg-gradient-to-r from-orange-600 to-amber-500",
  pink: "bg-gradient-to-r from-pink-600 to-rose-500",
};

export function LinearProgress({
  value,
  duration = 1,
  delay = 0,
  color = "blue",
  showValue = false,
  label,
  height = "md",
  className,
}: LinearProgressProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <div ref={ref} className={cn("w-full", className)}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-sm text-slate-400">{label}</span>}
          {showValue && (
            <span className="text-sm font-medium text-slate-300">
              {Math.round(value)}%
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          "w-full rounded-full bg-slate-700/50 overflow-hidden",
          heightClasses[height]
        )}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={isInView ? { width: `${Math.min(value, 100)}%` } : { width: 0 }}
          transition={{
            duration,
            delay,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          className={cn(
            "h-full rounded-full",
            linearColorClasses[color],
            "shadow-lg"
          )}
        />
      </div>
    </div>
  );
}

// Animated number with flip effect
interface FlipCounterProps {
  value: number;
  className?: string;
}

export function FlipCounter({ value, className }: FlipCounterProps) {
  const digits = String(value).padStart(4, "0").split("");

  return (
    <div className={cn("flex gap-1", className)}>
      {digits.map((digit, index) => (
        <motion.div
          key={`${index}-${digit}`}
          initial={{ rotateX: -90, opacity: 0 }}
          animate={{ rotateX: 0, opacity: 1 }}
          transition={{
            duration: 0.3,
            delay: index * 0.1,
            ease: "easeOut",
          }}
          className="relative w-10 h-14 bg-slate-800 rounded-lg border border-slate-700 flex items-center justify-center overflow-hidden"
        >
          <span className="text-2xl font-bold text-white">{digit}</span>
          <div className="absolute inset-x-0 top-1/2 h-px bg-slate-700" />
        </motion.div>
      ))}
    </div>
  );
}
