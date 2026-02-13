/**
 * Frontend Structured Logging Utility
 *
 * Features:
 * - Consistent logging interface across the application
 * - Log levels: DEBUG, INFO, WARN, ERROR
 * - Automatic correlation ID tracking (from API responses)
 * - Environment-aware (disabled in production unless explicitly enabled)
 * - Structured JSON output for log aggregation
 * - Performance timing helpers
 * - Error boundary integration
 */

type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  correlation_id?: string;
  data?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

// Store current correlation ID (updated from API response headers)
let currentCorrelationId: string | null = null;

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === "development";

// Enable logging in production via env variable
const ENABLE_PROD_LOGS = process.env.NEXT_PUBLIC_ENABLE_LOGS === "true";

// Determine if logging is enabled
const isLoggingEnabled = isDevelopment || ENABLE_PROD_LOGS;

// Log level thresholds
const LOG_LEVELS: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

// Minimum log level from env (default: DEBUG in dev, WARN in prod)
const MIN_LOG_LEVEL = isDevelopment ? "DEBUG" : "WARN";
const minLevelThreshold =
  LOG_LEVELS[
    (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel) || MIN_LOG_LEVEL
  ] || 0;

/**
 * Set the current correlation ID (call after receiving API response)
 */
export function setCorrelationId(id: string | null): void {
  currentCorrelationId = id;
}

/**
 * Get the current correlation ID
 */
export function getCorrelationId(): string | null {
  return currentCorrelationId;
}

/**
 * Format a log entry for output
 */
function formatLogEntry(entry: LogEntry): string {
  if (isDevelopment) {
    // Human-readable format for development
    const correlationPart = entry.correlation_id
      ? `[${entry.correlation_id}] `
      : "";
    const dataPart = entry.data ? ` ${JSON.stringify(entry.data)}` : "";
    return `[${entry.component}] ${correlationPart}${entry.message}${dataPart}`;
  }
  // JSON format for production/log aggregation
  return JSON.stringify(entry);
}

/**
 * Log a message at the specified level
 */
function log(
  level: LogLevel,
  component: string,
  message: string,
  data?: Record<string, unknown>,
  error?: Error
): void {
  // Check if logging is enabled and level meets threshold
  if (!isLoggingEnabled || LOG_LEVELS[level] < minLevelThreshold) {
    return;
  }

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    component,
    message,
    correlation_id: currentCorrelationId || undefined,
    data: data || undefined,
  };

  if (error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: isDevelopment ? error.stack : undefined,
    };
  }

  const formattedMessage = formatLogEntry(entry);

  switch (level) {
    case "DEBUG":
      console.debug(formattedMessage);
      break;
    case "INFO":
      console.info(formattedMessage);
      break;
    case "WARN":
      console.warn(formattedMessage);
      break;
    case "ERROR":
      console.error(formattedMessage);
      break;
  }
}

/**
 * Create a logger instance for a specific component
 */
export function createLogger(component: string) {
  return {
    debug: (message: string, data?: Record<string, unknown>) =>
      log("DEBUG", component, message, data),

    info: (message: string, data?: Record<string, unknown>) =>
      log("INFO", component, message, data),

    warn: (message: string, data?: Record<string, unknown>) =>
      log("WARN", component, message, data),

    error: (
      message: string,
      error?: Error | unknown,
      data?: Record<string, unknown>
    ) => {
      const errorObj =
        error instanceof Error
          ? error
          : new Error(error ? String(error) : "Unknown error");
      log("ERROR", component, message, data, errorObj);
    },

    /**
     * Time an operation and log its duration
     */
    time: async <T>(
      operationName: string,
      operation: () => Promise<T>
    ): Promise<T> => {
      const startTime = performance.now();
      try {
        const result = await operation();
        const duration = performance.now() - startTime;
        log("DEBUG", component, `${operationName} completed`, {
          duration_ms: Math.round(duration),
        });
        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        log(
          "ERROR",
          component,
          `${operationName} failed`,
          { duration_ms: Math.round(duration) },
          error instanceof Error ? error : new Error(String(error))
        );
        throw error;
      }
    },

    /**
     * Log the start of an operation (for sync timing)
     */
    startTimer: (operationName: string): (() => void) => {
      const startTime = performance.now();
      return () => {
        const duration = performance.now() - startTime;
        log("DEBUG", component, `${operationName} completed`, {
          duration_ms: Math.round(duration),
        });
      };
    },
  };
}

// Pre-configured loggers for common components
export const apiLogger = createLogger("API");
export const authLogger = createLogger("Auth");
export const uiLogger = createLogger("UI");
export const formLogger = createLogger("Form");
export const routeLogger = createLogger("Route");

/**
 * Interceptor for axios/fetch to capture correlation IDs
 */
export function extractCorrelationIdFromResponse(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  response: Response | { headers?: any }
): void {
  try {
    if (response instanceof Response) {
      const correlationId = response.headers.get("x-correlation-id");
      if (correlationId) {
        setCorrelationId(correlationId);
      }
    } else if (response.headers) {
      // Axios response - headers can be AxiosHeaders object or plain object
      let correlationId: string | null = null;

      // Try getting via method if available (AxiosHeaders)
      if (typeof response.headers.get === "function") {
        correlationId = response.headers.get("x-correlation-id");
      } else if (typeof response.headers === "object") {
        // Plain object access
        correlationId =
          response.headers["x-correlation-id"] ||
          response.headers["X-Correlation-ID"];
      }

      if (correlationId) {
        setCorrelationId(correlationId);
      }
    }
  } catch {
    // Silently fail - logging correlation IDs is not critical
  }
}

/**
 * Error boundary helper - log errors caught by React error boundaries
 */
export function logErrorBoundary(
  error: Error,
  errorInfo: { componentStack: string }
): void {
  const errorLogger = createLogger("ErrorBoundary");
  errorLogger.error("React error boundary caught error", error, {
    componentStack: errorInfo.componentStack,
  });
}

// Default export for convenience
export default createLogger;
