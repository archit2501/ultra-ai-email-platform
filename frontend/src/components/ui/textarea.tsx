"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { AlertCircle, CheckCircle, AlertTriangle } from "lucide-react"

import { cn } from "@/lib/utils"

const textareaVariants = cva(
  "flex w-full rounded-md border px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-input bg-background text-foreground hover:border-primary/50",
        error: "border-error bg-background text-foreground focus-visible:ring-error/30 hover:border-error",
        success: "border-success bg-background text-foreground focus-visible:ring-success/30 hover:border-success",
        warning: "border-warning bg-background text-foreground focus-visible:ring-warning/30 hover:border-warning",
        glass: "glass border-white/10 text-foreground backdrop-blur-xl",
      },
      textareaSize: {
        sm: "min-h-[60px] text-xs",
        default: "min-h-[80px]",
        lg: "min-h-[120px] text-base",
      },
      resize: {
        none: "resize-none",
        vertical: "resize-y",
        horizontal: "resize-x",
        both: "resize",
      },
    },
    defaultVariants: {
      variant: "default",
      textareaSize: "default",
      resize: "vertical",
    },
  }
)

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "size">,
    VariantProps<typeof textareaVariants> {
  error?: string
  helperText?: string
  label?: string
  showCharCount?: boolean
  wrapperClassName?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      variant,
      textareaSize,
      resize,
      error,
      helperText,
      label,
      showCharCount = false,
      maxLength,
      wrapperClassName,
      value,
      defaultValue,
      ...props
    },
    ref
  ) => {
    const [charCount, setCharCount] = React.useState(0)
    const displayVariant = error ? "error" : variant

    React.useEffect(() => {
      if (showCharCount) {
        const currentValue = value ?? defaultValue ?? ""
        setCharCount(String(currentValue).length)
      }
    }, [value, defaultValue, showCharCount])

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (showCharCount) {
        setCharCount(e.target.value.length)
      }
      props.onChange?.(e)
    }

    const ValidationIcon = ({ variant }: { variant?: string }) => {
      if (variant === "error") {
        return <AlertCircle className="h-4 w-4 text-error" />
      }
      if (variant === "success") {
        return <CheckCircle className="h-4 w-4 text-success" />
      }
      if (variant === "warning") {
        return <AlertTriangle className="h-4 w-4 text-warning" />
      }
      return null
    }

    return (
      <div className={cn("space-y-2", wrapperClassName)}>
        {label && (
          <label className="text-sm font-medium text-foreground">{label}</label>
        )}
        <div className="relative">
          <textarea
            className={cn(
              textareaVariants({
                variant: displayVariant,
                textareaSize,
                resize,
                className,
              })
            )}
            ref={ref}
            maxLength={maxLength}
            value={value}
            defaultValue={defaultValue}
            onChange={handleChange}
            {...props}
          />
          {displayVariant &&
            displayVariant !== "default" &&
            displayVariant !== "glass" && (
              <div className="absolute right-3 top-3 pointer-events-none">
                <ValidationIcon variant={displayVariant} />
              </div>
            )}
        </div>

        {/* Character count and helper text row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1">
            {(error || helperText) && (
              <p
                className={cn(
                  "text-sm",
                  error
                    ? "text-error"
                    : variant === "success"
                    ? "text-success"
                    : variant === "warning"
                    ? "text-warning"
                    : "text-muted-foreground"
                )}
              >
                {error || helperText}
              </p>
            )}
          </div>
          {showCharCount && (
            <p
              className={cn(
                "text-xs tabular-nums",
                maxLength && charCount > maxLength * 0.9
                  ? "text-warning"
                  : "text-muted-foreground"
              )}
            >
              {charCount}
              {maxLength && ` / ${maxLength}`}
            </p>
          )}
        </div>
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
