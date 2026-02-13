import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const skeletonVariants = cva("animate-pulse rounded-md", {
  variants: {
    variant: {
      default: "bg-muted",
      glass: "glass bg-white/5",
      shimmer:
        "bg-gradient-to-r from-muted via-muted-foreground/20 to-muted bg-[length:200%_100%] animate-shimmer",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

function Skeleton({ className, variant, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(skeletonVariants({ variant, className }))}
      {...props}
    />
  )
}

// Pre-built skeleton patterns
export interface SkeletonTextProps {
  lines?: number
  className?: string
  variant?: "default" | "glass" | "shimmer"
}

function SkeletonText({ lines = 3, className, variant }: SkeletonTextProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant={variant}
          className="h-4"
          style={{ width: i === lines - 1 ? "80%" : "100%" }}
        />
      ))}
    </div>
  )
}

export interface SkeletonCardProps {
  className?: string
  variant?: "default" | "glass" | "shimmer"
}

function SkeletonCard({ className, variant }: SkeletonCardProps) {
  return (
    <div className={cn("flex flex-col space-y-3", className)}>
      <Skeleton variant={variant} className="h-[180px] w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton variant={variant} className="h-4 w-full" />
        <Skeleton variant={variant} className="h-4 w-4/5" />
      </div>
    </div>
  )
}

export interface SkeletonAvatarProps {
  size?: "sm" | "default" | "lg"
  className?: string
  variant?: "default" | "glass" | "shimmer"
}

function SkeletonAvatar({ size = "default", className, variant }: SkeletonAvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    default: "h-10 w-10",
    lg: "h-12 w-12",
  }

  return (
    <Skeleton
      variant={variant}
      className={cn("rounded-full", sizeClasses[size], className)}
    />
  )
}

export interface SkeletonButtonProps {
  className?: string
  variant?: "default" | "glass" | "shimmer"
}

function SkeletonButton({ className, variant }: SkeletonButtonProps) {
  return <Skeleton variant={variant} className={cn("h-10 w-24", className)} />
}

export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonAvatar,
  SkeletonButton,
}
