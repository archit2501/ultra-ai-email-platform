"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Printer,
  Download,
  Eye,
  X,
  FileText,
  Check,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// ========================================
// TYPES
// ========================================

interface PrintOptions {
  title?: string
  orientation?: "portrait" | "landscape"
  pageSize?: "A4" | "Letter" | "Legal"
  margins?: "default" | "narrow" | "wide"
  includeStyles?: boolean
}

// ========================================
// PRINT BUTTON
// ========================================

interface PrintButtonProps extends React.ComponentPropsWithoutRef<typeof Button> {
  targetId?: string
  options?: PrintOptions
}

export function PrintButton({
  targetId,
  options = {},
  children,
  ...props
}: PrintButtonProps) {
  const handlePrint = () => {
    const {
      title = document.title,
      orientation = "portrait",
      pageSize = "A4",
    } = options

    // Set print-specific styles
    const printStyles = `
      @page {
        size: ${pageSize} ${orientation};
      }
    `

    const styleSheet = document.createElement("style")
    styleSheet.textContent = printStyles
    document.head.appendChild(styleSheet)

    // If targetId is provided, print only that element
    if (targetId) {
      const element = document.getElementById(targetId)
      if (element) {
        const originalContents = document.body.innerHTML
        const printContents = element.innerHTML
        document.body.innerHTML = printContents
        window.print()
        document.body.innerHTML = originalContents
        window.location.reload() // Restore original content
      }
    } else {
      // Print entire page
      window.print()
    }

    // Clean up
    document.head.removeChild(styleSheet)
  }

  return (
    <Button onClick={handlePrint} {...props}>
      <Printer className="h-4 w-4 mr-2" />
      {children || "Print"}
    </Button>
  )
}

// ========================================
// PRINT PREVIEW
// ========================================

interface PrintPreviewProps {
  children: React.ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  options?: PrintOptions
}

export function PrintPreview({
  children,
  open,
  onOpenChange,
  title = "Print Preview",
  options = {},
}: PrintPreviewProps) {
  const [zoom, setZoom] = React.useState(100)

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = () => {
    window.print()
    // In a real implementation, you'd use a library like jsPDF or html2pdf
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      >
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl"
            >
              {/* Toolbar */}
              <Card className="p-4 mb-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{title}</h2>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setZoom((z) => Math.max(50, z - 10))}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground min-w-[60px] text-center">
                      {zoom}%
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setZoom((z) => Math.min(200, z + 10))}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <div className="h-4 w-px bg-border mx-2" />
                    <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                      <Download className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                    <Button size="sm" onClick={handlePrint}>
                      <Printer className="h-4 w-4 mr-2" />
                      Print
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onOpenChange(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Preview Content */}
              <div className="print-preview">
                <div
                  className="print-preview-page"
                  style={{ transform: `scale(${zoom / 100})` }}
                >
                  {children}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// ========================================
// PRINT SECTION
// ========================================

interface PrintSectionProps {
  children: React.ReactNode
  id: string
  className?: string
}

/**
 * Wrapper for content that should be printable
 */
export function PrintSection({ children, id, className }: PrintSectionProps) {
  return (
    <div id={id} className={cn("print-content", className)}>
      {children}
    </div>
  )
}

// ========================================
// PRINT UTILITIES
// ========================================

/**
 * Component visible only when printing
 */
export function PrintOnly({ children }: { children: React.ReactNode }) {
  return <div className="print-only">{children}</div>
}

/**
 * Component hidden when printing
 */
export function ScreenOnly({ children }: { children: React.ReactNode }) {
  return <div className="screen-only">{children}</div>
}

/**
 * Force page break before this element
 */
export function PageBreakBefore({ children }: { children: React.ReactNode }) {
  return <div className="page-break-before">{children}</div>
}

/**
 * Force page break after this element
 */
export function PageBreakAfter({ children }: { children: React.ReactNode }) {
  return <div className="page-break-after">{children}</div>
}

/**
 * Avoid page break inside this element
 */
export function PageBreakAvoid({ children }: { children: React.ReactNode }) {
  return <div className="page-break-avoid">{children}</div>
}

// ========================================
// PRINT HEADER/FOOTER
// ========================================

interface PrintHeaderProps {
  logo?: React.ReactNode
  title?: string
  subtitle?: string
  className?: string
}

export function PrintHeader({
  logo,
  title,
  subtitle,
  className,
}: PrintHeaderProps) {
  return (
    <div className={cn("print-only print-header", className)}>
      {logo && <div className="print-logo">{logo}</div>}
      <div>
        {title && <h1 className="print-title">{title}</h1>}
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="text-sm text-muted-foreground">
        {new Date().toLocaleDateString()}
      </div>
    </div>
  )
}

interface PrintFooterProps {
  content?: string
  className?: string
}

export function PrintFooter({ content, className }: PrintFooterProps) {
  return (
    <div className={cn("print-only print-footer", className)}>
      {content || "Generated by Metaminds HR Resume Web App"}
    </div>
  )
}

// ========================================
// PRINT TOOLBAR
// ========================================

interface PrintToolbarProps {
  targetId?: string
  title?: string
  className?: string
}

export function PrintToolbar({ targetId, title, className }: PrintToolbarProps) {
  const [previewOpen, setPreviewOpen] = React.useState(false)

  const handlePrint = () => {
    if (targetId) {
      const element = document.getElementById(targetId)
      if (element) {
        const originalContents = document.body.innerHTML
        const printContents = element.innerHTML
        document.body.innerHTML = printContents
        window.print()
        document.body.innerHTML = originalContents
        window.location.reload()
      }
    } else {
      window.print()
    }
  }

  const handleExportPDF = () => {
    window.print()
    // In production, integrate with jsPDF or similar
  }

  return (
    <Card className={cn("screen-only p-3", className)}>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportPDF}>
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
      </div>
    </Card>
  )
}

// ========================================
// DOCUMENT METADATA
// ========================================

interface DocumentMetadataProps {
  title?: string
  author?: string
  date?: string
  version?: string
  status?: string
  className?: string
}

export function DocumentMetadata({
  title,
  author,
  date,
  version,
  status,
  className,
}: DocumentMetadataProps) {
  return (
    <div className={cn("document-metadata", className)}>
      <div className="grid grid-cols-2 gap-2 text-sm">
        {title && (
          <>
            <span className="font-semibold">Document:</span>
            <span>{title}</span>
          </>
        )}
        {author && (
          <>
            <span className="font-semibold">Author:</span>
            <span>{author}</span>
          </>
        )}
        {date && (
          <>
            <span className="font-semibold">Date:</span>
            <span>{date}</span>
          </>
        )}
        {version && (
          <>
            <span className="font-semibold">Version:</span>
            <span>{version}</span>
          </>
        )}
        {status && (
          <>
            <span className="font-semibold">Status:</span>
            <span>{status}</span>
          </>
        )}
      </div>
    </div>
  )
}

// ========================================
// PRINT STATUS INDICATOR
// ========================================

export function PrintStatusIndicator() {
  const [isPrinting, setIsPrinting] = React.useState(false)

  React.useEffect(() => {
    const beforePrint = () => setIsPrinting(true)
    const afterPrint = () => setIsPrinting(false)

    window.addEventListener("beforeprint", beforePrint)
    window.addEventListener("afterprint", afterPrint)

    return () => {
      window.removeEventListener("beforeprint", beforePrint)
      window.removeEventListener("afterprint", afterPrint)
    }
  }, [])

  if (!isPrinting) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 backdrop-blur-sm screen-only">
      <Card className="p-8 text-center">
        <Printer className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
        <h2 className="text-xl font-semibold mb-2">Preparing to Print...</h2>
        <p className="text-muted-foreground">
          Please wait while we optimize your document for printing
        </p>
      </Card>
    </div>
  )
}

// ========================================
// PRINT CONFIGURATION
// ========================================

interface PrintConfigProps {
  options: PrintOptions
  onChange: (options: PrintOptions) => void
  className?: string
}

export function PrintConfig({ options, onChange, className }: PrintConfigProps) {
  return (
    <Card className={cn("p-4 space-y-4", className)}>
      <div>
        <label className="text-sm font-medium mb-2 block">Orientation</label>
        <Select
          value={options.orientation || "portrait"}
          onValueChange={(value) =>
            onChange({ ...options, orientation: value as "portrait" | "landscape" })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="portrait">Portrait</SelectItem>
            <SelectItem value="landscape">Landscape</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Page Size</label>
        <Select
          value={options.pageSize || "A4"}
          onValueChange={(value) =>
            onChange({ ...options, pageSize: value as "A4" | "Letter" | "Legal" })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="A4">A4</SelectItem>
            <SelectItem value="Letter">Letter</SelectItem>
            <SelectItem value="Legal">Legal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Margins</label>
        <Select
          value={options.margins || "default"}
          onValueChange={(value) =>
            onChange({ ...options, margins: value as "default" | "narrow" | "wide" })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default (20mm)</SelectItem>
            <SelectItem value="narrow">Narrow (10mm)</SelectItem>
            <SelectItem value="wide">Wide (30mm)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </Card>
  )
}
