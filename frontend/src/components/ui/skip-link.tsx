import * as React from "react"
import { cn } from "@/lib/utils"

export interface SkipLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
}

/**
 * SkipLink - Accessibility component for keyboard navigation
 *
 * Allows keyboard users to skip directly to main content,
 * bypassing navigation and other repeated elements.
 *
 * WCAG 2.4.1 Bypass Blocks (Level A)
 *
 * Usage:
 * ```tsx
 * <SkipLink href="#main-content">Skip to main content</SkipLink>
 * ```
 */
const SkipLink = React.forwardRef<HTMLAnchorElement, SkipLinkProps>(
  ({ className, href, children = "Skip to main content", ...props }, ref) => {
    return (
      <a
        ref={ref}
        href={href}
        className={cn(
          // Hidden by default
          "absolute -top-full left-0 z-[9999]",
          // Visible on focus (keyboard navigation)
          "focus:top-4 focus:left-4",
          // Styling
          "bg-primary text-primary-foreground",
          "px-4 py-2 rounded-md",
          "font-medium text-sm",
          "shadow-premium-lg",
          "transition-all duration-200",
          // Focus ring
          "focus:outline-none focus:ring-4 focus:ring-ring focus:ring-offset-2",
          className
        )}
        {...props}
      >
        {children}
      </a>
    )
  }
)
SkipLink.displayName = "SkipLink"

export { SkipLink }
