"use client"

import * as React from "react"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

// ========================================
// LAZY COMPONENT
// ========================================

interface LazyProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  minHeight?: string | number
  className?: string
}

/**
 * Wrapper for lazy-loaded components with loading fallback
 */
export function Lazy({ children, fallback, minHeight = "200px", className }: LazyProps) {
  return (
    <React.Suspense
      fallback={
        fallback || (
          <div
            className={cn("flex items-center justify-center", className)}
            style={{ minHeight }}
          >
            <Spinner />
          </div>
        )
      }
    >
      {children}
    </React.Suspense>
  )
}

// ========================================
// LAZY SECTION (Intersection Observer)
// ========================================

interface LazySectionProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  threshold?: number
  rootMargin?: string
  className?: string
  minHeight?: string | number
}

/**
 * Lazy load a section when it enters the viewport
 */
export function LazySection({
  children,
  fallback,
  threshold = 0.1,
  rootMargin = "100px",
  className,
  minHeight = "200px",
}: LazySectionProps) {
  const [isVisible, setIsVisible] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!ref.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(ref.current)

    return () => observer.disconnect()
  }, [threshold, rootMargin])

  return (
    <div ref={ref} className={className} style={{ minHeight }}>
      {isVisible ? (
        children
      ) : (
        fallback || (
          <div className="flex items-center justify-center" style={{ minHeight }}>
            <Spinner />
          </div>
        )
      )}
    </div>
  )
}

// ========================================
// LAZY IMAGE
// ========================================

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  fallback?: string
  threshold?: number
  rootMargin?: string
}

/**
 * Lazy load image with IntersectionObserver
 */
export function LazyImage({
  src,
  alt,
  fallback,
  threshold = 0.1,
  rootMargin = "100px",
  className,
  ...props
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = React.useState(fallback || "")
  const [isLoaded, setIsLoaded] = React.useState(false)
  const imgRef = React.useRef<HTMLImageElement>(null)

  React.useEffect(() => {
    if (!imgRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setImageSrc(src)
          observer.disconnect()
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(imgRef.current)

    return () => observer.disconnect()
  }, [src, threshold, rootMargin])

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={cn(!isLoaded && "opacity-0 transition-opacity duration-300", className)}
      onLoad={() => setIsLoaded(true)}
      {...props}
    />
  )
}

// ========================================
// LAZY LOAD ON HOVER
// ========================================

interface LazyLoadOnHoverProps {
  children: React.ReactNode
  preload: () => Promise<any>
  className?: string
}

/**
 * Preload component on hover for instant loading
 */
export function LazyLoadOnHover({ children, preload, className }: LazyLoadOnHoverProps) {
  const [preloaded, setPreloaded] = React.useState(false)

  const handleMouseEnter = () => {
    if (!preloaded) {
      preload().catch((error) => {
        console.warn("Failed to preload:", error)
      })
      setPreloaded(true)
    }
  }

  return (
    <div onMouseEnter={handleMouseEnter} className={className}>
      {children}
    </div>
  )
}

// ========================================
// LAZY LOAD ON VISIBLE
// ========================================

interface LazyLoadOnVisibleProps {
  children: (props: { isVisible: boolean }) => React.ReactNode
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
}

/**
 * Render children with visibility state
 */
export function LazyLoadOnVisible({
  children,
  threshold = 0.1,
  rootMargin = "100px",
  triggerOnce = true,
}: LazyLoadOnVisibleProps) {
  const [isVisible, setIsVisible] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!ref.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (triggerOnce) {
            observer.disconnect()
          }
        } else if (!triggerOnce) {
          setIsVisible(false)
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(ref.current)

    return () => observer.disconnect()
  }, [threshold, rootMargin, triggerOnce])

  return <div ref={ref}>{children({ isVisible })}</div>
}

// ========================================
// CODE SPLITTING HELPER
// ========================================

/**
 * Create a lazy-loaded component with better error handling
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  retries = 3,
  interval = 1000
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    let lastError: any

    for (let i = 0; i < retries; i++) {
      try {
        return await componentImport()
      } catch (error) {
        lastError = error
        if (i < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, interval))
        }
      }
    }

    throw lastError
  })
}

// ========================================
// PERFORMANCE MONITORING
// ========================================

interface PerformanceMonitorProps {
  children: React.ReactNode
  name: string
  onRender?: (stats: {
    id: string
    phase: "mount" | "update" | "nested-update"
    actualDuration: number
    baseDuration: number
    startTime: number
    commitTime: number
  }) => void
}

/**
 * Monitor component render performance
 */
export function PerformanceMonitor({ children, name, onRender }: PerformanceMonitorProps) {
  const handleRender = (
    id: string,
    phase: "mount" | "update" | "nested-update",
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number
  ) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[Performance] ${name} (${phase}):`, {
        actualDuration: `${actualDuration.toFixed(2)}ms`,
        baseDuration: `${baseDuration.toFixed(2)}ms`,
      })
    }

    onRender?.({
      id,
      phase,
      actualDuration,
      baseDuration,
      startTime,
      commitTime,
    })
  }

  return (
    <React.Profiler id={name} onRender={handleRender}>
      {children}
    </React.Profiler>
  )
}

// ========================================
// BUNDLE SIZE INDICATOR
// ========================================

export function BundleSizeIndicator() {
  const [size, setSize] = React.useState<number>(0)

  React.useEffect(() => {
    if (typeof window === "undefined") return

    const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[]
    let totalSize = 0

    resources.forEach((resource) => {
      if (resource.initiatorType === "script" && resource.transferSize) {
        totalSize += resource.transferSize
      }
    })

    setSize(totalSize)
  }, [])

  if (process.env.NODE_ENV !== "development") return null

  const sizeKB = (size / 1024).toFixed(2)
  const color = size < 300 * 1024 ? "text-success" : size < 500 * 1024 ? "text-warning" : "text-error"

  return (
    <div className="fixed bottom-4 left-4 bg-background border border-border rounded-lg px-3 py-2 text-sm shadow-lg z-50">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Bundle:</span>
        <span className={cn("font-semibold", color)}>{sizeKB} KB</span>
      </div>
    </div>
  )
}

// ========================================
// WEB VITALS MONITOR
// ========================================

export function WebVitalsMonitor() {
  const [metrics, setMetrics] = React.useState<Record<string, any>>({})

  React.useEffect(() => {
    if (typeof window === "undefined") return

    import("@/lib/performance").then(({ trackWebVitals }) => {
      trackWebVitals((metric) => {
        setMetrics((prev) => ({
          ...prev,
          [metric.name]: {
            value: Math.round(metric.value),
            rating: metric.rating,
          },
        }))
      })
    })
  }, [])

  if (process.env.NODE_ENV !== "development" || Object.keys(metrics).length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 bg-background border border-border rounded-lg p-3 text-xs shadow-lg z-50 max-w-xs">
      <div className="font-semibold mb-2">Web Vitals</div>
      <div className="space-y-1">
        {Object.entries(metrics).map(([name, data]: [string, any]) => {
          const color =
            data.rating === "good"
              ? "text-success"
              : data.rating === "needs-improvement"
              ? "text-warning"
              : "text-error"

          return (
            <div key={name} className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">{name}:</span>
              <span className={cn("font-semibold", color)}>
                {data.value}
                {name === "CLS" ? "" : "ms"}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
