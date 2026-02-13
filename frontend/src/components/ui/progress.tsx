"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const progressVariants = cva(
  "relative w-full overflow-hidden rounded-full bg-muted transition-all",
  {
    variants: {
      variant: {
        default: "[&>div]:bg-primary",
        success: "[&>div]:bg-success",
        warning: "[&>div]:bg-warning",
        error: "[&>div]:bg-error",
        info: "[&>div]:bg-info",
        gradient: "[&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-accent",
        glow: "[&>div]:bg-primary [&>div]:shadow-premium-lg",
      },
      size: {
        sm: "h-1",
        default: "h-2",
        lg: "h-3",
        xl: "h-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants> {
  showLabel?: boolean
  label?: string
  animated?: boolean
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, variant, size, showLabel, label, animated, ...props }, ref) => {
  return (
    <div className="w-full space-y-2">
      {(showLabel || label) && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground">{label}</span>
          {showLabel && (
            <span className="text-muted-foreground tabular-nums">
              {value}%
            </span>
          )}
        </div>
      )}
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(progressVariants({ variant, size, className }))}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            "h-full transition-all duration-500 ease-out",
            animated && "animate-pulse"
          )}
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
      </ProgressPrimitive.Root>
    </div>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

// Indeterminate/loading progress bar
export interface ProgressIndeterminateProps
  extends VariantProps<typeof progressVariants> {
  className?: string
  label?: string
}

const ProgressIndeterminate = React.forwardRef<
  HTMLDivElement,
  ProgressIndeterminateProps
>(({ className, variant, size, label }, ref) => {
  return (
    <div ref={ref} className="w-full space-y-2">
      {label && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground">{label}</span>
        </div>
      )}
      <div className={cn(progressVariants({ variant, size, className }))}>
        <div className="h-full w-1/3 animate-shimmer" />
      </div>
    </div>
  )
})
ProgressIndeterminate.displayName = "ProgressIndeterminate"

// Circular progress (simple CSS implementation)
export interface ProgressCircularProps {
  value?: number
  size?: number
  strokeWidth?: number
  variant?: "default" | "success" | "warning" | "error" | "info"
  showLabel?: boolean
  label?: string
  className?: string
}

const ProgressCircular = React.forwardRef<HTMLDivElement, ProgressCircularProps>(
  (
    {
      value = 0,
      size = 64,
      strokeWidth = 4,
      variant = "default",
      showLabel,
      label,
      className,
    },
    ref
  ) => {
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (value / 100) * circumference

    const colorClasses = {
      default: "text-primary",
      success: "text-success",
      warning: "text-warning",
      error: "text-error",
      info: "text-info",
    }

    return (
      <div ref={ref} className={cn("flex flex-col items-center gap-2", className)}>
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={strokeWidth}
              className="fill-none stroke-muted"
            />
            {/* Progress circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className={cn(
                "fill-none transition-all duration-500 ease-out",
                colorClasses[variant]
              )}
              strokeLinecap="round"
            />
          </svg>
          {showLabel && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-medium text-foreground tabular-nums">
                {value}%
              </span>
            </div>
          )}
        </div>
        {label && <p className="text-sm text-muted-foreground">{label}</p>}
      </div>
    )
  }
)
ProgressCircular.displayName = "ProgressCircular"

export { Progress, ProgressIndeterminate, ProgressCircular, progressVariants }
