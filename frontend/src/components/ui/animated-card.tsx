"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface AnimatedCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
  glow?: boolean;
  gradient?: "blue" | "purple" | "green" | "orange" | "pink" | "none";
}

const gradientClasses = {
  blue: "from-blue-500/20 via-cyan-500/10 to-transparent",
  purple: "from-purple-500/20 via-pink-500/10 to-transparent",
  green: "from-green-500/20 via-emerald-500/10 to-transparent",
  orange: "from-orange-500/20 via-amber-500/10 to-transparent",
  pink: "from-pink-500/20 via-rose-500/10 to-transparent",
  none: "",
};

const glowColors = {
  blue: "shadow-blue-500/20",
  purple: "shadow-purple-500/20",
  green: "shadow-green-500/20",
  orange: "shadow-orange-500/20",
  pink: "shadow-pink-500/20",
  none: "",
};

export function AnimatedCard({
  children,
  className,
  delay = 0,
  hover = true,
  glow = false,
  gradient = "blue",
  ...props
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={
        hover
          ? {
              scale: 1.02,
              y: -5,
              transition: { duration: 0.2 },
            }
          : undefined
      }
      className={cn(
        "group relative overflow-hidden rounded-xl",
        "bg-gradient-to-br from-slate-800/80 to-slate-900/80",
        "border border-slate-700/50",
        "backdrop-blur-xl",
        "transition-shadow duration-300",
        glow && `shadow-lg ${glowColors[gradient]}`,
        hover && "hover:shadow-2xl hover:border-slate-600/50",
        className
      )}
      {...props}
    >
      {/* Gradient overlay */}
      {gradient !== "none" && (
        <div
          className={cn(
            "absolute inset-0 opacity-50 bg-gradient-to-br",
            gradientClasses[gradient]
          )}
        />
      )}

      {/* Animated border on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-[-1px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl opacity-20" />
      </div>

      {/* Shine effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </div>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

// Stat Card variant
interface StatCardProps {
  title: string;
  value: ReactNode;
  subtitle?: string;
  icon?: ReactNode;
  trend?: { value: number; isPositive: boolean };
  gradient?: "blue" | "purple" | "green" | "orange" | "pink";
  delay?: number;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  gradient = "blue",
  delay = 0,
}: StatCardProps) {
  return (
    <AnimatedCard delay={delay} gradient={gradient} glow className="p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-500">{subtitle}</p>
          )}
          {trend && (
            <div
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                trend.isPositive
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
              )}
            >
              <span>{trend.isPositive ? "+" : ""}{trend.value}%</span>
            </div>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              "p-3 rounded-xl",
              gradient === "blue" && "bg-blue-500/20 text-blue-400",
              gradient === "purple" && "bg-purple-500/20 text-purple-400",
              gradient === "green" && "bg-green-500/20 text-green-400",
              gradient === "orange" && "bg-orange-500/20 text-orange-400",
              gradient === "pink" && "bg-pink-500/20 text-pink-400"
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </AnimatedCard>
  );
}
