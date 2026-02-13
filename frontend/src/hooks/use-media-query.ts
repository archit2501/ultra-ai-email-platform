"use client"

import * as React from "react"

/**
 * Media query hook for responsive design
 * Returns true if the media query matches
 *
 * @example
 * const isMobile = useMediaQuery("(max-width: 768px)")
 * const isDesktop = useMediaQuery("(min-width: 1024px)")
 * const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)")
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    const mediaQuery = window.matchMedia(query)
    setMatches(mediaQuery.matches)

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handler)
      return () => mediaQuery.removeEventListener("change", handler)
    }
    // Fallback for older browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handler)
      return () => mediaQuery.removeListener(handler)
    }
  }, [query])

  // Return false during SSR to avoid hydration mismatch
  if (!mounted) {
    return false
  }

  return matches
}

/**
 * Breakpoint hooks for common screen sizes
 * Based on Tailwind CSS default breakpoints
 */

export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 768px)")
}

export function useIsTablet(): boolean {
  return useMediaQuery("(min-width: 768px) and (max-width: 1024px)")
}

export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)")
}

export function useIsLargeDesktop(): boolean {
  return useMediaQuery("(min-width: 1280px)")
}

/**
 * Get current breakpoint
 */
export function useBreakpoint(): "mobile" | "tablet" | "desktop" | "xl" {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const isXL = useMediaQuery("(min-width: 1280px)")

  if (isMobile) return "mobile"
  if (isTablet) return "tablet"
  if (isXL) return "xl"
  return "desktop"
}

/**
 * Touch device detection
 */
export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = React.useState(false)

  React.useEffect(() => {
    setIsTouch(
      "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore - for older browsers
        navigator.msMaxTouchPoints > 0
    )
  }, [])

  return isTouch
}

/**
 * Orientation detection
 */
export function useOrientation(): "portrait" | "landscape" {
  const isPortrait = useMediaQuery("(orientation: portrait)")
  return isPortrait ? "portrait" : "landscape"
}

/**
 * Screen size detection
 */
export function useScreenSize() {
  const [size, setSize] = React.useState({
    width: 0,
    height: 0,
  })

  React.useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return size
}
