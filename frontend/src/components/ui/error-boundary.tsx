"use client"

import * as React from "react"
import { AlertTriangle, RefreshCw, Home, Bug, Copy, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  showDetails?: boolean
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export interface ErrorFallbackProps {
  error: Error | null
  errorInfo: React.ErrorInfo | null
  resetError: () => void
}

class ErrorBoundaryClass extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      errorInfo,
    })

    // Call optional error handler
    this.props.onError?.(error, errorInfo)

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error Boundary caught an error:", error, errorInfo)
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
        />
      )
    }

    return this.props.children
  }
}

// Default error fallback component
const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  resetError,
}) => {
  const [copied, setCopied] = React.useState(false)
  const isDevelopment = process.env.NODE_ENV === "development"

  const copyError = () => {
    const errorText = `
Error: ${error?.message}
Stack: ${error?.stack}
Component Stack: ${errorInfo?.componentStack}
    `.trim()
    navigator.clipboard.writeText(errorText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-2xl w-full border-error/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-error/10">
              <AlertTriangle className="w-6 h-6 text-error" />
            </div>
            <div>
              <CardTitle className="text-2xl">Something went wrong</CardTitle>
              <CardDescription>
                An unexpected error occurred while rendering this component.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <p className="text-sm font-medium text-error">{error.message}</p>
              {isDevelopment && error.stack && (
                <pre className="text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap break-words">
                  {error.stack}
                </pre>
              )}
            </div>
          )}

          {isDevelopment && errorInfo?.componentStack && (
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                Component Stack (Click to expand)
              </summary>
              <pre className="mt-2 text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-muted/30 p-3">
                {errorInfo.componentStack}
              </pre>
            </details>
          )}
        </CardContent>

        <CardFooter className="flex gap-3">
          <Button onClick={resetError} variant="default">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button onClick={() => window.location.href = "/"} variant="outline">
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Button>
          {isDevelopment && (
            <Button onClick={copyError} variant="ghost">
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Error
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

// Hook-based error boundary for functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return setError
}

// Export the class component as ErrorBoundary
export const ErrorBoundary = ErrorBoundaryClass

// Error display components
export interface ErrorDisplayProps {
  title: string
  description?: string
  error?: Error | string
  onRetry?: () => void
  onGoBack?: () => void
  showDetails?: boolean
  className?: string
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  title,
  description,
  error,
  onRetry,
  onGoBack,
  showDetails = false,
  className,
}) => {
  const errorMessage = typeof error === "string" ? error : error?.message

  return (
    <Card className={cn("border-error/20", className)}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-error/10">
            <AlertTriangle className="w-5 h-5 text-error" />
          </div>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
        </div>
      </CardHeader>

      {errorMessage && showDetails && (
        <CardContent>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-sm font-mono text-error">{errorMessage}</p>
          </div>
        </CardContent>
      )}

      {(onRetry || onGoBack) && (
        <CardFooter className="flex gap-2">
          {onRetry && (
            <Button onClick={onRetry} variant="default" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
          {onGoBack && (
            <Button onClick={onGoBack} variant="outline" size="sm">
              Go Back
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  )
}

// Inline error display (for forms, etc.)
export interface InlineErrorProps {
  message: string
  className?: string
}

export const InlineError: React.FC<InlineErrorProps> = ({ message, className }) => {
  return (
    <div className={cn("flex items-center gap-2 text-sm text-error", className)}>
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  )
}

// Network error component
export const NetworkError: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <ErrorDisplay
    title="Network Error"
    description="Unable to connect to the server. Please check your internet connection."
    onRetry={onRetry}
  />
)

// 404 Not Found error component
export const NotFoundError: React.FC<{ onGoHome?: () => void }> = ({ onGoHome }) => (
  <ErrorDisplay
    title="Page Not Found"
    description="The page you're looking for doesn't exist or has been moved."
    onGoBack={onGoHome}
  />
)

// 403 Forbidden error component
export const ForbiddenError: React.FC<{ onGoHome?: () => void }> = ({ onGoHome }) => (
  <ErrorDisplay
    title="Access Denied"
    description="You don't have permission to access this resource."
    onGoBack={onGoHome}
  />
)

// 500 Server Error component
export const ServerError: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <ErrorDisplay
    title="Server Error"
    description="Something went wrong on our end. Please try again later."
    onRetry={onRetry}
  />
)

// Validation error component
export interface ValidationErrorProps {
  errors: Record<string, string>
  className?: string
}

export const ValidationError: React.FC<ValidationErrorProps> = ({ errors, className }) => {
  const errorEntries = Object.entries(errors)

  if (errorEntries.length === 0) return null

  return (
    <div className={cn("rounded-lg bg-error/10 border border-error/20 p-4", className)}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
        <div className="space-y-2 flex-1">
          <p className="text-sm font-medium text-error">
            Please fix the following errors:
          </p>
          <ul className="text-sm text-error space-y-1 list-disc list-inside">
            {errorEntries.map(([field, message]) => (
              <li key={field}>
                <span className="font-medium">{field}:</span> {message}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export { DefaultErrorFallback }
