"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useBreakpoint,
  useIsTouchDevice,
} from "@/hooks/use-media-query"

// ========================================
// SHOW/HIDE ON BREAKPOINT
// ========================================

interface ShowOnProps {
  children: React.ReactNode
  breakpoint: "mobile" | "tablet" | "desktop" | "touch"
  className?: string
}

/**
 * Show content only on specific breakpoints
 */
export function ShowOn({ children, breakpoint, className }: ShowOnProps) {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const isDesktop = useIsDesktop()
  const isTouch = useIsTouchDevice()

  const shouldShow = {
    mobile: isMobile,
    tablet: isTablet,
    desktop: isDesktop,
    touch: isTouch,
  }[breakpoint]

  if (!shouldShow) return null

  return <div className={className}>{children}</div>
}

/**
 * Hide content on specific breakpoints
 */
export function HideOn({ children, breakpoint, className }: ShowOnProps) {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const isDesktop = useIsDesktop()
  const isTouch = useIsTouchDevice()

  const shouldHide = {
    mobile: isMobile,
    tablet: isTablet,
    desktop: isDesktop,
    touch: isTouch,
  }[breakpoint]

  if (shouldHide) return null

  return <div className={className}>{children}</div>
}

// ========================================
// MOBILE DRAWER/SHEET
// ========================================

interface MobileDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  side?: "left" | "right"
  className?: string
}

/**
 * Mobile-optimized drawer (slides from side)
 */
export function MobileDrawer({
  open,
  onOpenChange,
  children,
  side = "left",
  className,
}: MobileDrawerProps) {
  const isMobile = useIsMobile()

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  if (!isMobile) return null

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: side === "left" ? "-100%" : "100%" }}
            animate={{ x: 0 }}
            exit={{ x: side === "left" ? "-100%" : "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={cn(
              "fixed inset-y-0 z-50 w-[85vw] max-w-sm bg-background shadow-premium-xl",
              side === "left" ? "left-0" : "right-0",
              className
            )}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-5 w-5" />
            </Button>
            <div className="h-full overflow-y-auto p-6">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ========================================
// MOBILE BOTTOM SHEET
// ========================================

interface MobileBottomSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  snapPoints?: number[]
  className?: string
}

/**
 * Mobile bottom sheet (slides from bottom)
 */
export function MobileBottomSheet({
  open,
  onOpenChange,
  children,
  className,
}: MobileBottomSheetProps) {
  const isMobile = useIsMobile()

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  if (!isMobile) return null

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={cn(
              "fixed inset-x-0 bottom-0 z-50 max-h-[90vh] rounded-t-3xl bg-background shadow-premium-xl",
              className
            )}
          >
            {/* Handle */}
            <div className="flex justify-center py-3">
              <div className="h-1.5 w-12 rounded-full bg-muted" />
            </div>
            <div className="max-h-[calc(90vh-3rem)] overflow-y-auto px-6 pb-6">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ========================================
// TOUCH-OPTIMIZED BUTTON
// ========================================

interface TouchButtonProps extends React.ComponentPropsWithoutRef<typeof Button> {
  touchSize?: "default" | "large"
}

/**
 * Button with enhanced touch targets (min 44x44px)
 */
export const TouchButton = React.forwardRef<HTMLButtonElement, TouchButtonProps>(
  ({ children, touchSize = "default", className, ...props }, ref) => {
    const isTouch = useIsTouchDevice()

    return (
      <Button
        ref={ref}
        className={cn(
          isTouch && "min-h-[44px] min-w-[44px]",
          touchSize === "large" && isTouch && "min-h-[56px] min-w-[56px]",
          className
        )}
        {...props}
      >
        {children}
      </Button>
    )
  }
)
TouchButton.displayName = "TouchButton"

// ========================================
// RESPONSIVE GRID
// ========================================

interface ResponsiveGridProps {
  children: React.ReactNode
  mobile?: number
  tablet?: number
  desktop?: number
  gap?: "sm" | "md" | "lg"
  className?: string
}

/**
 * Grid that adapts columns based on screen size
 */
export function ResponsiveGrid({
  children,
  mobile = 1,
  tablet = 2,
  desktop = 3,
  gap = "md",
  className,
}: ResponsiveGridProps) {
  const breakpoint = useBreakpoint()

  const cols = {
    mobile: mobile,
    tablet: tablet,
    desktop: desktop,
    xl: desktop,
  }[breakpoint]

  const gaps = {
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
  }

  return (
    <div
      className={cn(
        "grid",
        gaps[gap],
        className
      )}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {children}
    </div>
  )
}

// ========================================
// MOBILE MENU BUTTON
// ========================================

interface MobileMenuButtonProps {
  open: boolean
  onClick: () => void
  className?: string
}

/**
 * Animated hamburger/close button for mobile menus
 */
export function MobileMenuButton({ open, onClick, className }: MobileMenuButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("min-h-[44px] min-w-[44px]", className)}
      onClick={onClick}
      aria-label={open ? "Close menu" : "Open menu"}
    >
      <AnimatePresence mode="wait">
        {open ? (
          <motion.div
            key="close"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <X className="h-6 w-6" />
          </motion.div>
        ) : (
          <motion.div
            key="menu"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Menu className="h-6 w-6" />
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  )
}

// ========================================
// RESPONSIVE CONTAINER
// ========================================

interface ResponsiveContainerProps {
  children: React.ReactNode
  className?: string
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full"
}

/**
 * Container with responsive padding and max-width
 */
export function ResponsiveContainer({
  children,
  className,
  maxWidth = "2xl",
}: ResponsiveContainerProps) {
  const maxWidths = {
    sm: "max-w-screen-sm",
    md: "max-w-screen-md",
    lg: "max-w-screen-lg",
    xl: "max-w-screen-xl",
    "2xl": "max-w-screen-2xl",
    full: "max-w-full",
  }

  return (
    <div className={cn("mx-auto px-4 sm:px-6 lg:px-8", maxWidths[maxWidth], className)}>
      {children}
    </div>
  )
}

// ========================================
// SWIPEABLE CARD
// ========================================

interface SwipeableCardProps {
  children: React.ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  className?: string
}

/**
 * Card with swipe gestures (mobile)
 */
export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  className,
}: SwipeableCardProps) {
  const isMobile = useIsMobile()

  if (!isMobile) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={(event, info) => {
        if (info.offset.x > 100) {
          onSwipeRight?.()
        } else if (info.offset.x < -100) {
          onSwipeLeft?.()
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ========================================
// PULL TO REFRESH
// ========================================

interface PullToRefreshProps {
  children: React.ReactNode
  onRefresh: () => Promise<void>
  className?: string
}

/**
 * Pull to refresh container (mobile)
 */
export function PullToRefresh({ children, onRefresh, className }: PullToRefreshProps) {
  const [isPulling, setIsPulling] = React.useState(false)
  const [refreshing, setRefreshing] = React.useState(false)
  const isMobile = useIsMobile()

  const handleRefresh = async () => {
    setRefreshing(true)
    await onRefresh()
    setRefreshing(false)
    setIsPulling(false)
  }

  if (!isMobile) {
    return <div className={className}>{children}</div>
  }

  return (
    <div className={className}>
      {refreshing && (
        <div className="flex justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
      {children}
    </div>
  )
}
