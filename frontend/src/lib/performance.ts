/* ========================================
   PERFORMANCE OPTIMIZATION UTILITIES
   ======================================== */

// ========================================
// WEB VITALS TRACKING
// ========================================

export interface PerformanceMetric {
  name: string
  value: number
  rating: "good" | "needs-improvement" | "poor"
  delta?: number
}

/**
 * Track Core Web Vitals
 */
export function trackWebVitals(onMetric: (metric: PerformanceMetric) => void) {
  if (typeof window === "undefined") return

  // Largest Contentful Paint (LCP)
  if ("PerformanceObserver" in window) {
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as any
        const value = lastEntry.renderTime || lastEntry.loadTime

        onMetric({
          name: "LCP",
          value,
          rating: value <= 2500 ? "good" : value <= 4000 ? "needs-improvement" : "poor",
        })
      })
      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] })
    } catch (error) {
      console.warn("LCP tracking failed:", error)
    }

    // First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          const value = entry.processingStart - entry.startTime

          onMetric({
            name: "FID",
            value,
            rating: value <= 100 ? "good" : value <= 300 ? "needs-improvement" : "poor",
          })
        })
      })
      fidObserver.observe({ entryTypes: ["first-input"] })
    } catch (error) {
      console.warn("FID tracking failed:", error)
    }

    // Cumulative Layout Shift (CLS)
    try {
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
            onMetric({
              name: "CLS",
              value: clsValue,
              rating: clsValue <= 0.1 ? "good" : clsValue <= 0.25 ? "needs-improvement" : "poor",
            })
          }
        })
      })
      clsObserver.observe({ entryTypes: ["layout-shift"] })
    } catch (error) {
      console.warn("CLS tracking failed:", error)
    }

    // Time to First Byte (TTFB)
    try {
      const navigationEntry = performance.getEntriesByType("navigation")[0] as any
      if (navigationEntry) {
        const ttfb = navigationEntry.responseStart - navigationEntry.requestStart
        onMetric({
          name: "TTFB",
          value: ttfb,
          rating: ttfb <= 800 ? "good" : ttfb <= 1800 ? "needs-improvement" : "poor",
        })
      }
    } catch (error) {
      console.warn("TTFB tracking failed:", error)
    }
  }

  // First Contentful Paint (FCP) - Using Navigation Timing
  if ("performance" in window && "timing" in performance) {
    try {
      const paintEntries = performance.getEntriesByType("paint")
      const fcpEntry = paintEntries.find((entry) => entry.name === "first-contentful-paint")
      if (fcpEntry) {
        onMetric({
          name: "FCP",
          value: fcpEntry.startTime,
          rating:
            fcpEntry.startTime <= 1800
              ? "good"
              : fcpEntry.startTime <= 3000
              ? "needs-improvement"
              : "poor",
        })
      }
    } catch (error) {
      console.warn("FCP tracking failed:", error)
    }
  }
}

// ========================================
// PERFORMANCE MONITORING
// ========================================

export interface PerformanceReport {
  fcp?: number
  lcp?: number
  fid?: number
  cls?: number
  ttfb?: number
  timestamp: number
  url: string
}

/**
 * Generate performance report
 */
export function generatePerformanceReport(): PerformanceReport {
  const report: PerformanceReport = {
    timestamp: Date.now(),
    url: typeof window !== "undefined" ? window.location.href : "",
  }

  if (typeof window === "undefined") return report

  try {
    // Get paint timing
    const paintEntries = performance.getEntriesByType("paint")
    const fcpEntry = paintEntries.find((entry) => entry.name === "first-contentful-paint")
    if (fcpEntry) {
      report.fcp = fcpEntry.startTime
    }

    // Get navigation timing
    const navigationEntry = performance.getEntriesByType("navigation")[0] as any
    if (navigationEntry) {
      report.ttfb = navigationEntry.responseStart - navigationEntry.requestStart
    }
  } catch (error) {
    console.warn("Failed to generate performance report:", error)
  }

  return report
}

/**
 * Log performance metrics to console
 */
export function logPerformanceMetrics() {
  if (typeof window === "undefined") return

  const metrics: Record<string, any> = {}

  trackWebVitals((metric) => {
    metrics[metric.name] = {
      value: Math.round(metric.value),
      rating: metric.rating,
    }

    console.log(
      `%c[Performance] ${metric.name}`,
      `color: ${
        metric.rating === "good"
          ? "#10b981"
          : metric.rating === "needs-improvement"
          ? "#f59e0b"
          : "#ef4444"
      }; font-weight: bold`,
      `${Math.round(metric.value)}ms - ${metric.rating}`
    )
  })

  // Log full report after 5 seconds
  setTimeout(() => {
    console.table(metrics)
  }, 5000)
}

// ========================================
// RESOURCE HINTS
// ========================================

/**
 * Preload a resource
 */
export function preloadResource(href: string, as: string) {
  if (typeof document === "undefined") return

  const link = document.createElement("link")
  link.rel = "preload"
  link.href = href
  link.as = as
  document.head.appendChild(link)
}

/**
 * Prefetch a resource
 */
export function prefetchResource(href: string) {
  if (typeof document === "undefined") return

  const link = document.createElement("link")
  link.rel = "prefetch"
  link.href = href
  document.head.appendChild(link)
}

/**
 * Preconnect to an origin
 */
export function preconnect(href: string) {
  if (typeof document === "undefined") return

  const link = document.createElement("link")
  link.rel = "preconnect"
  link.href = href
  document.head.appendChild(link)
}

// ========================================
// IMAGE OPTIMIZATION
// ========================================

/**
 * Lazy load images with IntersectionObserver
 */
export function lazyLoadImages(selector = "img[data-lazy]") {
  if (typeof window === "undefined" || !("IntersectionObserver" in window)) return

  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement
        const src = img.dataset.lazy
        if (src) {
          img.src = src
          img.removeAttribute("data-lazy")
          imageObserver.unobserve(img)
        }
      }
    })
  })

  document.querySelectorAll(selector).forEach((img) => imageObserver.observe(img))
}

/**
 * Optimize image loading
 */
export function optimizeImage(src: string, width?: number, quality = 85): string {
  // In production, this would integrate with an image optimization service
  // For now, just return the original source
  return src
}

// ========================================
// CODE SPLITTING HELPERS
// ========================================

/**
 * Dynamically import a component with loading state
 */
export async function loadComponent<T>(
  importFn: () => Promise<{ default: T }>,
  delay = 0
): Promise<T> {
  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay))
  }
  const module = await importFn()
  return module.default
}

/**
 * Preload a component (don't wait for it to be needed)
 */
export function preloadComponent(importFn: () => Promise<any>) {
  importFn().catch((error) => {
    console.warn("Failed to preload component:", error)
  })
}

// ========================================
// BUNDLE SIZE ANALYSIS
// ========================================

/**
 * Estimate bundle size of loaded scripts
 */
export function estimateBundleSize(): number {
  if (typeof window === "undefined") return 0

  let totalSize = 0

  try {
    const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[]
    resources.forEach((resource) => {
      if (resource.initiatorType === "script" && resource.transferSize) {
        totalSize += resource.transferSize
      }
    })
  } catch (error) {
    console.warn("Failed to estimate bundle size:", error)
  }

  return totalSize
}

/**
 * Log bundle size information
 */
export function logBundleSize() {
  const size = estimateBundleSize()
  const sizeKB = (size / 1024).toFixed(2)
  const sizeMB = (size / 1024 / 1024).toFixed(2)

  console.log(
    `%c[Bundle Size]`,
    "color: #3b82f6; font-weight: bold",
    `${sizeKB} KB (${sizeMB} MB)`
  )
}

// ========================================
// DEBOUNCE & THROTTLE
// ========================================

/**
 * Debounce function execution
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout !== null) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function execution
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// ========================================
// REQUEST IDLE CALLBACK
// ========================================

/**
 * Execute a task when the browser is idle
 */
export function runWhenIdle(callback: () => void, options?: IdleRequestOptions) {
  if (typeof window === "undefined") return

  if ("requestIdleCallback" in window) {
    requestIdleCallback(callback, options)
  } else {
    // Fallback for browsers that don't support requestIdleCallback
    setTimeout(callback, 1)
  }
}

// ========================================
// MEMORY MANAGEMENT
// ========================================

/**
 * Get memory usage (Chrome only)
 */
export function getMemoryUsage(): { used: number; total: number; limit: number } | null {
  if (typeof window === "undefined") return null

  // @ts-ignore - Chrome specific API
  if (performance.memory) {
    // @ts-ignore
    const memory = performance.memory
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
    }
  }

  return null
}

/**
 * Log memory usage
 */
export function logMemoryUsage() {
  const memory = getMemoryUsage()
  if (!memory) {
    console.warn("[Memory] Memory API not available")
    return
  }

  const usedMB = (memory.used / 1024 / 1024).toFixed(2)
  const totalMB = (memory.total / 1024 / 1024).toFixed(2)
  const limitMB = (memory.limit / 1024 / 1024).toFixed(2)
  const percentage = ((memory.used / memory.limit) * 100).toFixed(2)

  console.log(
    `%c[Memory]`,
    "color: #8b5cf6; font-weight: bold",
    `${usedMB} MB / ${totalMB} MB (${percentage}% of ${limitMB} MB limit)`
  )
}

// ========================================
// NETWORK INFORMATION
// ========================================

export type ConnectionType = "slow-2g" | "2g" | "3g" | "4g" | "5g" | "wifi" | "unknown"

/**
 * Get network information
 */
export function getNetworkInfo(): {
  effectiveType: ConnectionType
  downlink: number
  rtt: number
  saveData: boolean
} | null {
  if (typeof window === "undefined") return null

  // @ts-ignore - Navigator API
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection

  if (!connection) return null

  return {
    effectiveType: (connection.effectiveType as ConnectionType) || "unknown",
    downlink: connection.downlink || 0,
    rtt: connection.rtt || 0,
    saveData: connection.saveData || false,
  }
}

/**
 * Check if user is on a slow connection
 */
export function isSlowConnection(): boolean {
  const network = getNetworkInfo()
  if (!network) return false

  return (
    network.saveData ||
    network.effectiveType === "slow-2g" ||
    network.effectiveType === "2g" ||
    network.effectiveType === "3g"
  )
}

// ========================================
// PERFORMANCE BUDGET
// ========================================

export interface PerformanceBudget {
  fcp: number // ms
  lcp: number // ms
  cls: number // score
  fid: number // ms
  bundleSize: number // bytes
}

export const DEFAULT_BUDGET: PerformanceBudget = {
  fcp: 1800, // 1.8s
  lcp: 2500, // 2.5s
  cls: 0.1, // 0.1
  fid: 100, // 100ms
  bundleSize: 500 * 1024, // 500KB
}

/**
 * Check if performance metrics meet the budget
 */
export function checkPerformanceBudget(
  metrics: Partial<PerformanceReport>,
  budget: PerformanceBudget = DEFAULT_BUDGET
): { passed: boolean; failures: string[] } {
  const failures: string[] = []

  if (metrics.fcp && metrics.fcp > budget.fcp) {
    failures.push(`FCP: ${metrics.fcp.toFixed(0)}ms > ${budget.fcp}ms`)
  }

  if (metrics.lcp && metrics.lcp > budget.lcp) {
    failures.push(`LCP: ${metrics.lcp.toFixed(0)}ms > ${budget.lcp}ms`)
  }

  if (metrics.cls && metrics.cls > budget.cls) {
    failures.push(`CLS: ${metrics.cls.toFixed(3)} > ${budget.cls}`)
  }

  if (metrics.fid && metrics.fid > budget.fid) {
    failures.push(`FID: ${metrics.fid.toFixed(0)}ms > ${budget.fid}ms`)
  }

  const bundleSize = estimateBundleSize()
  if (bundleSize > budget.bundleSize) {
    failures.push(
      `Bundle: ${(bundleSize / 1024).toFixed(0)}KB > ${(budget.bundleSize / 1024).toFixed(0)}KB`
    )
  }

  return {
    passed: failures.length === 0,
    failures,
  }
}
