"use client"

import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { cva, type VariantProps } from "class-variance-authority"
import { Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn("grid gap-2", className)}
      {...props}
      ref={ref}
    />
  )
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const radioGroupItemVariants = cva(
  "aspect-square rounded-full border ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
  {
    variants: {
      variant: {
        default:
          "border-input text-primary data-[state=checked]:border-primary",
        success:
          "border-input text-success data-[state=checked]:border-success",
        error:
          "border-error text-error data-[state=checked]:border-error",
      },
      size: {
        sm: "h-3.5 w-3.5",
        default: "h-4 w-4",
        lg: "h-5 w-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface RadioGroupItemProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>,
    VariantProps<typeof radioGroupItemVariants> {}

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItemProps
>(({ className, variant, size, ...props }, ref) => {
  const iconSize = size === "sm" ? "h-2 w-2" : size === "lg" ? "h-2.5 w-2.5" : "h-2.5 w-2.5"

  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(radioGroupItemVariants({ variant, size, className }))}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className={cn("fill-current", iconSize)} />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

// Radio with label
export interface RadioGroupItemWithLabelProps extends RadioGroupItemProps {
  label: string
  description?: string
  wrapperClassName?: string
}

const RadioGroupItemWithLabel = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItemWithLabelProps
>(
  (
    { label, description, wrapperClassName, className, id, ...props },
    ref
  ) => {
    const radioId = id || `radio-${React.useId()}`

    return (
      <div className={cn("flex items-start space-x-3", wrapperClassName)}>
        <RadioGroupItem
          ref={ref}
          id={radioId}
          className={className}
          {...props}
        />
        <div className="grid gap-1.5 leading-none">
          <label
            htmlFor={radioId}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            {label}
          </label>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
    )
  }
)
RadioGroupItemWithLabel.displayName = "RadioGroupItemWithLabel"

// Card radio variant (for better UX in certain cases)
export interface RadioCardProps
  extends Omit<RadioGroupItemProps, "children"> {
  label: string
  description?: string
  icon?: React.ReactNode
  value: string
}

const RadioCard = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioCardProps
>(({ label, description, icon, value, className, variant, size, ...props }, ref) => {
  return (
    <label
      htmlFor={value}
      className={cn(
        "flex items-start gap-4 rounded-lg border p-4 cursor-pointer transition-all hover:bg-accent/50",
        "has-[:checked]:border-primary has-[:checked]:bg-accent/30 has-[:checked]:shadow-sm",
        className
      )}
    >
      <RadioGroupItem
        ref={ref}
        id={value}
        value={value}
        variant={variant}
        size={size}
        className="mt-1"
        {...props}
      />
      {icon && (
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
          {icon}
        </div>
      )}
      <div className="grid gap-1.5 leading-none flex-1">
        <div className="text-sm font-medium leading-none">{label}</div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </label>
  )
})
RadioCard.displayName = "RadioCard"

export {
  RadioGroup,
  RadioGroupItem,
  RadioGroupItemWithLabel,
  RadioCard,
  radioGroupItemVariants,
}
