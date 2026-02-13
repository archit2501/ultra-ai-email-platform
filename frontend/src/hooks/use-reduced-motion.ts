import { useState, useEffect } from "react"

/**
 * Hook to detect if user prefers reduced motion
 *
 * Respects the `prefers-reduced-motion` media query
 * for accessibility (WCAG 2.3.3 Animation from Interactions)
 *
 * @returns boolean - true if user prefers reduced motion
 *
 * Usage:
 * ```tsx
 * const prefersReducedMotion = useReducedMotion()
 *
 * <motion.div
 *   animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
 * />
 * ```
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")

    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches)

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange)
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange)
    }

    // Cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange)
      } else {
        mediaQuery.removeListener(handleChange)
      }
    }
  }, [])

  return prefersReducedMotion
}

/**
 * Get animation variants that respect motion preferences
 *
 * @param reducedMotion - boolean from useReducedMotion()
 * @returns object with common animation variants
 *
 * Usage:
 * ```tsx
 * const prefersReducedMotion = useReducedMotion()
 * const variants = getMotionVariants(prefersReducedMotion)
 *
 * <motion.div variants={variants.fadeIn} />
 * ```
 */
export function getMotionVariants(reducedMotion: boolean) {
  const instant = { duration: 0.01 }
  const smooth = { duration: 0.3, ease: [0.4, 0, 0.2, 1] }

  return {
    fadeIn: {
      initial: { opacity: reducedMotion ? 1 : 0 },
      animate: { opacity: 1 },
      transition: reducedMotion ? instant : smooth,
    },
    fadeInUp: {
      initial: { opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 20 },
      animate: { opacity: 1, y: 0 },
      transition: reducedMotion ? instant : smooth,
    },
    fadeInDown: {
      initial: { opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : -20 },
      animate: { opacity: 1, y: 0 },
      transition: reducedMotion ? instant : smooth,
    },
    scaleIn: {
      initial: { opacity: reducedMotion ? 1 : 0, scale: reducedMotion ? 1 : 0.95 },
      animate: { opacity: 1, scale: 1 },
      transition: reducedMotion ? instant : smooth,
    },
  }
}
