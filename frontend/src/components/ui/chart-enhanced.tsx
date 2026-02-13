"use client"

import * as React from "react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from "recharts"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

// ========================================
// CUSTOM TOOLTIP
// ========================================

interface CustomTooltipProps extends TooltipProps<any, any> {
  variant?: "default" | "premium" | "minimal"
}

export function CustomTooltip({
  active,
  payload,
  label,
  variant = "default",
}: CustomTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null
  }

  const variants = {
    default: "bg-popover border-border shadow-lg",
    premium: "glass border-white/10 backdrop-blur-xl shadow-premium-lg",
    minimal: "bg-background/95 border-border",
  }

  return (
    <div
      className={cn(
        "rounded-lg border p-3 animate-in fade-in-0 zoom-in-95",
        variants[variant]
      )}
    >
      {label && (
        <p className="font-semibold text-sm mb-2 text-foreground">{label}</p>
      )}
      <div className="space-y-1">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-semibold text-foreground">
              {typeof entry.value === "number"
                ? entry.value.toLocaleString()
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ========================================
// ENHANCED LINE CHART
// ========================================

interface EnhancedLineChartProps {
  data: any[]
  dataKeys: { key: string; name: string; color?: string }[]
  xAxisKey: string
  height?: number
  showGrid?: boolean
  showLegend?: boolean
  animate?: boolean
  tooltipVariant?: "default" | "premium" | "minimal"
  className?: string
}

export function EnhancedLineChart({
  data,
  dataKeys,
  xAxisKey,
  height = 300,
  showGrid = true,
  showLegend = true,
  animate = true,
  tooltipVariant = "premium",
  className,
}: EnhancedLineChartProps) {
  const colors = [
    "hsl(var(--primary))",
    "hsl(var(--accent))",
    "hsl(var(--success))",
    "hsl(var(--warning))",
    "hsl(var(--info))",
  ]

  return (
    <Card className={cn("p-6", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              opacity={0.3}
            />
          )}
          <XAxis
            dataKey={xAxisKey}
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => value.toLocaleString()}
          />
          <Tooltip content={<CustomTooltip variant={tooltipVariant} />} />
          {showLegend && (
            <Legend
              wrapperStyle={{
                paddingTop: "20px",
                fontSize: "14px",
              }}
            />
          )}
          {dataKeys.map((item, index) => (
            <Line
              key={item.key}
              type="monotone"
              dataKey={item.key}
              name={item.name}
              stroke={item.color || colors[index % colors.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              animationDuration={animate ? 1000 : 0}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}

// ========================================
// ENHANCED BAR CHART
// ========================================

interface EnhancedBarChartProps {
  data: any[]
  dataKeys: { key: string; name: string; color?: string }[]
  xAxisKey: string
  height?: number
  showGrid?: boolean
  showLegend?: boolean
  animate?: boolean
  tooltipVariant?: "default" | "premium" | "minimal"
  stacked?: boolean
  className?: string
}

export function EnhancedBarChart({
  data,
  dataKeys,
  xAxisKey,
  height = 300,
  showGrid = true,
  showLegend = true,
  animate = true,
  tooltipVariant = "premium",
  stacked = false,
  className,
}: EnhancedBarChartProps) {
  const colors = [
    "hsl(var(--primary))",
    "hsl(var(--accent))",
    "hsl(var(--success))",
    "hsl(var(--warning))",
    "hsl(var(--info))",
  ]

  return (
    <Card className={cn("p-6", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              opacity={0.3}
            />
          )}
          <XAxis
            dataKey={xAxisKey}
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => value.toLocaleString()}
          />
          <Tooltip content={<CustomTooltip variant={tooltipVariant} />} />
          {showLegend && (
            <Legend
              wrapperStyle={{
                paddingTop: "20px",
                fontSize: "14px",
              }}
            />
          )}
          {dataKeys.map((item, index) => (
            <Bar
              key={item.key}
              dataKey={item.key}
              name={item.name}
              fill={item.color || colors[index % colors.length]}
              radius={[4, 4, 0, 0]}
              animationDuration={animate ? 1000 : 0}
              stackId={stacked ? "stack" : undefined}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}

// ========================================
// ENHANCED AREA CHART
// ========================================

interface EnhancedAreaChartProps {
  data: any[]
  dataKeys: { key: string; name: string; color?: string }[]
  xAxisKey: string
  height?: number
  showGrid?: boolean
  showLegend?: boolean
  animate?: boolean
  tooltipVariant?: "default" | "premium" | "minimal"
  stacked?: boolean
  className?: string
}

export function EnhancedAreaChart({
  data,
  dataKeys,
  xAxisKey,
  height = 300,
  showGrid = true,
  showLegend = true,
  animate = true,
  tooltipVariant = "premium",
  stacked = false,
  className,
}: EnhancedAreaChartProps) {
  const colors = [
    "hsl(var(--primary))",
    "hsl(var(--accent))",
    "hsl(var(--success))",
    "hsl(var(--warning))",
    "hsl(var(--info))",
  ]

  return (
    <Card className={cn("p-6", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              opacity={0.3}
            />
          )}
          <XAxis
            dataKey={xAxisKey}
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => value.toLocaleString()}
          />
          <Tooltip content={<CustomTooltip variant={tooltipVariant} />} />
          {showLegend && (
            <Legend
              wrapperStyle={{
                paddingTop: "20px",
                fontSize: "14px",
              }}
            />
          )}
          {dataKeys.map((item, index) => (
            <Area
              key={item.key}
              type="monotone"
              dataKey={item.key}
              name={item.name}
              stroke={item.color || colors[index % colors.length]}
              fill={item.color || colors[index % colors.length]}
              fillOpacity={0.2}
              strokeWidth={2}
              animationDuration={animate ? 1000 : 0}
              stackId={stacked ? "stack" : undefined}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  )
}

// ========================================
// ENHANCED PIE CHART
// ========================================

interface EnhancedPieChartProps {
  data: { name: string; value: number }[]
  height?: number
  showLegend?: boolean
  animate?: boolean
  tooltipVariant?: "default" | "premium" | "minimal"
  innerRadius?: number
  outerRadius?: number
  className?: string
}

export function EnhancedPieChart({
  data,
  height = 300,
  showLegend = true,
  animate = true,
  tooltipVariant = "premium",
  innerRadius = 0,
  outerRadius = 80,
  className,
}: EnhancedPieChartProps) {
  const COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--accent))",
    "hsl(var(--success))",
    "hsl(var(--warning))",
    "hsl(var(--info))",
    "hsl(var(--error))",
  ]

  return (
    <Card className={cn("p-6", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            fill="#8884d8"
            dataKey="value"
            label={(entry) => `${entry.name}: ${entry.value}`}
            animationDuration={animate ? 1000 : 0}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip variant={tooltipVariant} />} />
          {showLegend && <Legend />}
        </PieChart>
      </ResponsiveContainer>
    </Card>
  )
}

// ========================================
// STAT CARD WITH CHART
// ========================================

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  chart?: React.ReactNode
  icon?: React.ReactNode
  variant?: "default" | "success" | "warning" | "error" | "info"
  className?: string
}

export function StatCard({
  title,
  value,
  change,
  changeLabel,
  chart,
  icon,
  variant = "default",
  className,
}: StatCardProps) {
  const variants = {
    default: "border-border",
    success: "border-success/30 bg-success/5",
    warning: "border-warning/30 bg-warning/5",
    error: "border-error/30 bg-error/5",
    info: "border-info/30 bg-info/5",
  }

  const changeColors = {
    positive: "text-success",
    negative: "text-error",
    neutral: "text-muted-foreground",
  }

  const changeType =
    change && change > 0 ? "positive" : change && change < 0 ? "negative" : "neutral"

  return (
    <Card className={cn("p-6", variants[variant], className)}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          {change !== undefined && (
            <p className={cn("text-sm mt-1", changeColors[changeType])}>
              {change > 0 ? "+" : ""}
              {change}% {changeLabel || "from last period"}
            </p>
          )}
        </div>
        {icon && (
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </div>
      {chart && <div className="-mx-2">{chart}</div>}
    </Card>
  )
}
