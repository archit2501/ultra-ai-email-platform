"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useMemo } from "react";
import { cn } from "@/lib/utils";

// Animated Donut Chart
interface DonutChartData {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutChartData[];
  size?: number;
  strokeWidth?: number;
  className?: string;
  showLegend?: boolean;
  centerLabel?: string;
  centerValue?: string | number;
}

export function DonutChart({
  data,
  size = 200,
  strokeWidth = 24,
  className,
  showLegend = true,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  const segments = useMemo(() => {
    let cumulativePercentage = 0;
    return data.map((item) => {
      const percentage = (item.value / total) * 100;
      const offset = cumulativePercentage;
      cumulativePercentage += percentage;
      return {
        ...item,
        percentage,
        offset,
        strokeDasharray: `${(percentage / 100) * circumference} ${circumference}`,
        strokeDashoffset: -(offset / 100) * circumference,
      };
    });
  }, [data, total, circumference]);

  return (
    <div ref={ref} className={cn("flex items-center gap-8", className)}>
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          {segments.map((segment, index) => (
            <motion.circle
              key={segment.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={segment.strokeDasharray}
              strokeDashoffset={segment.strokeDashoffset}
              initial={{ opacity: 0, pathLength: 0 }}
              animate={
                isInView
                  ? { opacity: 1, pathLength: 1 }
                  : { opacity: 0, pathLength: 0 }
              }
              transition={{
                duration: 1,
                delay: index * 0.2,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            />
          ))}
        </svg>

        {(centerLabel || centerValue) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {centerValue && (
              <motion.span
                initial={{ opacity: 0, scale: 0.5 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.5, duration: 0.3 }}
                className="text-3xl font-bold text-white"
              >
                {centerValue}
              </motion.span>
            )}
            {centerLabel && (
              <span className="text-sm text-slate-400">{centerLabel}</span>
            )}
          </div>
        )}
      </div>

      {showLegend && (
        <div className="space-y-3">
          {segments.map((segment, index) => (
            <motion.div
              key={segment.label}
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="flex items-center gap-3"
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-sm text-slate-300">{segment.label}</span>
              <span className="text-sm font-medium text-white ml-auto">
                {segment.value}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// Animated Bar Chart
interface BarChartData {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarChartData[];
  height?: number;
  className?: string;
  showValues?: boolean;
  horizontal?: boolean;
  defaultColor?: string;
}

export function BarChart({
  data,
  height = 200,
  className,
  showValues = true,
  horizontal = false,
  defaultColor = "#3b82f6",
}: BarChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const maxValue = useMemo(() => Math.max(...data.map((d) => d.value)), [data]);

  if (horizontal) {
    return (
      <div ref={ref} className={cn("space-y-4", className)}>
        {data.map((item, index) => (
          <div key={item.label} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">{item.label}</span>
              {showValues && (
                <span className="text-white font-medium">{item.value}</span>
              )}
            </div>
            <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={
                  isInView
                    ? { width: `${(item.value / maxValue) * 100}%` }
                    : { width: 0 }
                }
                transition={{
                  duration: 0.8,
                  delay: index * 0.1,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                className="h-full rounded-full"
                style={{ backgroundColor: item.color || defaultColor }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={cn("flex items-end justify-between gap-4", className)}
      style={{ height }}
    >
      {data.map((item, index) => (
        <div key={item.label} className="flex-1 flex flex-col items-center gap-2">
          <motion.div
            initial={{ height: 0 }}
            animate={
              isInView
                ? { height: `${(item.value / maxValue) * (height - 40)}px` }
                : { height: 0 }
            }
            transition={{
              duration: 0.8,
              delay: index * 0.1,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="w-full rounded-t-lg relative group"
            style={{ backgroundColor: item.color || defaultColor }}
          >
            {showValues && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm font-medium text-white"
              >
                {item.value}
              </motion.span>
            )}
          </motion.div>
          <span className="text-xs text-slate-400 text-center">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// Animated Area Sparkline
interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fillOpacity?: number;
  className?: string;
}

export function Sparkline({
  data,
  width = 100,
  height = 40,
  color = "#3b82f6",
  fillOpacity = 0.2,
  className,
}: SparklineProps) {
  const ref = useRef<SVGSVGElement>(null);
  const isInView = useInView(ref, { once: true });

  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue || 1;

  const points = useMemo(() => {
    return data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - minValue) / range) * height;
      return { x, y };
    });
  }, [data, width, height, minValue, range]);

  const linePath = useMemo(() => {
    return points
      .map((point, index) =>
        index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`
      )
      .join(" ");
  }, [points]);

  const areaPath = useMemo(() => {
    return `${linePath} L ${width} ${height} L 0 ${height} Z`;
  }, [linePath, width, height]);

  return (
    <svg
      ref={ref}
      width={width}
      height={height}
      className={cn("overflow-visible", className)}
    >
      <defs>
        <linearGradient id={`sparkline-gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={fillOpacity} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Area fill */}
      <motion.path
        d={areaPath}
        fill={`url(#sparkline-gradient-${color})`}
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.5 }}
      />

      {/* Line */}
      <motion.path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={isInView ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ duration: 1, ease: "easeInOut" }}
      />

      {/* End dot */}
      <motion.circle
        cx={points[points.length - 1]?.x}
        cy={points[points.length - 1]?.y}
        r={3}
        fill={color}
        initial={{ scale: 0 }}
        animate={isInView ? { scale: 1 } : { scale: 0 }}
        transition={{ delay: 1, duration: 0.2 }}
      />
    </svg>
  );
}

// Animated Mini Stats List
interface MiniStat {
  label: string;
  value: number | string;
  change?: number;
  color?: string;
}

interface MiniStatsListProps {
  stats: MiniStat[];
  className?: string;
}

export function MiniStatsList({ stats, className }: MiniStatsListProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <div ref={ref} className={cn("space-y-4", className)}>
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: index * 0.1, duration: 0.4 }}
          className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: stat.color || "#3b82f6" }}
            />
            <span className="text-sm text-slate-400">{stat.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">{stat.value}</span>
            {stat.change !== undefined && (
              <span
                className={cn(
                  "text-xs",
                  stat.change >= 0 ? "text-green-400" : "text-red-400"
                )}
              >
                {stat.change >= 0 ? "+" : ""}
                {stat.change}%
              </span>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Activity Timeline
interface ActivityItem {
  id: string;
  title: string;
  description?: string;
  time: string;
  type: "success" | "info" | "warning" | "error";
}

interface ActivityTimelineProps {
  activities: ActivityItem[];
  className?: string;
}

const typeColors = {
  success: "bg-green-500",
  info: "bg-blue-500",
  warning: "bg-orange-500",
  error: "bg-red-500",
};

export function ActivityTimeline({ activities, className }: ActivityTimelineProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <div ref={ref} className={cn("relative", className)}>
      {/* Timeline line */}
      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-700" />

      <div className="space-y-6">
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            className="flex gap-4"
          >
            <div
              className={cn(
                "w-4 h-4 rounded-full flex-shrink-0 mt-0.5 ring-4 ring-slate-900",
                typeColors[activity.type]
              )}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{activity.title}</p>
              {activity.description && (
                <p className="text-xs text-slate-400 mt-0.5 truncate">
                  {activity.description}
                </p>
              )}
              <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
