import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

const spinnerVariants = cva("animate-spin", {
  variants: {
    size: {
      sm: "h-4 w-4",
      default: "h-6 w-6",
      lg: "h-8 w-8",
      xl: "h-12 w-12",
    },
    variant: {
      default: "text-primary",
      muted: "text-muted-foreground",
      success: "text-success",
      warning: "text-warning",
      error: "text-error",
      info: "text-info",
      white: "text-white",
    },
  },
  defaultVariants: {
    size: "default",
    variant: "default",
  },
})

export interface SpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  label?: string
}

function Spinner({ className, size, variant, label, ...props }: SpinnerProps) {
  return (
    <div
      className={cn("flex items-center justify-center gap-2", className)}
      role="status"
      aria-label={label || "Loading"}
      {...props}
    >
      <Loader2 className={cn(spinnerVariants({ size, variant }))} />
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
    </div>
  )
}

// Full page spinner overlay
export interface SpinnerOverlayProps {
  label?: string
  variant?: "default" | "muted" | "success" | "warning" | "error" | "info" | "white"
}

function SpinnerOverlay({ label = "Loading...", variant }: SpinnerOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="xl" variant={variant} />
        <p className="text-lg font-medium text-foreground">{label}</p>
      </div>
    </div>
  )
}

// Inline spinner for buttons
export interface SpinnerInlineProps extends VariantProps<typeof spinnerVariants> {
  className?: string
}

function SpinnerInline({ className, size = "sm", variant }: SpinnerInlineProps) {
  return <Loader2 className={cn(spinnerVariants({ size, variant }), className)} />
}

export { Spinner, SpinnerOverlay, SpinnerInline, spinnerVariants }
