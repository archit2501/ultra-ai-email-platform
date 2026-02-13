import { toast as sonnerToast, ExternalToast } from "sonner"
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Sparkles,
  Loader2,
} from "lucide-react"
import React from "react"

// Enhanced toast options with semantic variants
export interface ToastOptions extends Omit<ExternalToast, 'action' | 'cancel'> {
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
  cancel?: {
    label: string
    onClick?: () => void
  }
}

// Success toast with green theme
export const success = (message: string | React.ReactNode, options?: ToastOptions) => {
  return sonnerToast.success(message, {
    ...(options as any),
    icon: options?.icon || <CheckCircle className="w-5 h-5" />,
    className: "bg-success/10 border-success/20 text-foreground",
  })
}

// Error toast with red theme
export const error = (message: string | React.ReactNode, options?: ToastOptions) => {
  return sonnerToast.error(message, {
    ...(options as any),
    icon: options?.icon || <XCircle className="w-5 h-5" />,
    className: "bg-error/10 border-error/20 text-foreground",
  })
}

// Warning toast with yellow theme
export const warning = (message: string | React.ReactNode, options?: ToastOptions) => {
  return sonnerToast.warning(message, {
    ...(options as any),
    icon: options?.icon || <AlertTriangle className="w-5 h-5" />,
    className: "bg-warning/10 border-warning/20 text-foreground",
  })
}

// Info toast with blue theme
export const info = (message: string | React.ReactNode, options?: ToastOptions) => {
  return sonnerToast.info(message, {
    ...(options as any),
    icon: options?.icon || <Info className="w-5 h-5" />,
    className: "bg-info/10 border-info/20 text-foreground",
  })
}

// Loading toast with spinner
export const loading = (message: string | React.ReactNode, options?: ToastOptions) => {
  return sonnerToast.loading(message, {
    ...(options as any),
    icon: options?.icon || <Loader2 className="w-5 h-5 animate-spin" />,
    className: "bg-muted/50 border-border text-foreground",
  })
}

// Premium toast with glow effect
export const premium = (message: string | React.ReactNode, options?: ToastOptions) => {
  return sonnerToast(message, {
    ...(options as any),
    icon: options?.icon || <Sparkles className="w-5 h-5" />,
    className: "bg-gradient-to-r from-primary/20 to-accent/20 border-primary/30 text-foreground shadow-premium-lg",
  })
}

// Default toast
export const toast = (message: string | React.ReactNode, options?: ToastOptions) => {
  return sonnerToast(message, {
    ...(options as any),
    className: "bg-card border-border text-foreground",
  })
}

// Promise toast with loading, success, and error states
export const promise = <T,>(
  promise: Promise<T> | (() => Promise<T>),
  options: {
    loading: string | React.ReactNode
    success: string | React.ReactNode | ((data: T) => React.ReactNode)
    error: string | React.ReactNode | ((error: any) => React.ReactNode)
  }
) => {
  return sonnerToast.promise(promise, {
    loading: options.loading,
    success: options.success,
    error: options.error,
  })
}

// Dismiss a specific toast
export const dismiss = (toastId?: string | number) => {
  return sonnerToast.dismiss(toastId)
}

// Custom toast with full control
export const custom = (component: React.ReactNode, options?: ToastOptions) => {
  return (sonnerToast.custom as any)(component, options)
}

// Export all toast functions as a single object
export const Toast = {
  success,
  error,
  warning,
  info,
  loading,
  premium,
  toast,
  promise,
  dismiss,
  custom,
}

// Default export
export default Toast
