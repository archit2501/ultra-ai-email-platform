import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Inbox,
  Search,
  FileQuestion,
  AlertCircle,
  Lock,
  Sparkles,
  FolderOpen,
  Users,
  Mail,
  Calendar,
} from "lucide-react"

const emptyStateVariants = cva(
  "flex flex-col items-center justify-center text-center p-8 rounded-lg transition-all",
  {
    variants: {
      variant: {
        default: "bg-muted/30",
        ghost: "",
        glass: "glass border border-white/10",
        card: "bg-card border border-border shadow-sm",
      },
      size: {
        sm: "py-6 px-4 gap-3",
        default: "py-8 px-6 gap-4",
        lg: "py-12 px-8 gap-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface EmptyStateProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof emptyStateVariants> {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: "default" | "outline" | "ghost" | "secondary"
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      className,
      variant,
      size,
      icon,
      title,
      description,
      action,
      secondaryAction,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(emptyStateVariants({ variant, size, className }))}
        {...props}
      >
        {icon && (
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 text-muted-foreground mb-2">
            {icon}
          </div>
        )}
        <div className="space-y-2 max-w-md">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {(action || secondaryAction) && (
          <div className="flex items-center gap-3 mt-2">
            {action && (
              <Button
                onClick={action.onClick}
                variant={action.variant || "default"}
              >
                {action.label}
              </Button>
            )}
            {secondaryAction && (
              <Button onClick={secondaryAction.onClick} variant="outline">
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    )
  }
)
EmptyState.displayName = "EmptyState"

// Pre-built empty state variants
export interface EmptyStateNoDataProps {
  onAction?: () => void
  actionLabel?: string
  variant?: "default" | "ghost" | "glass" | "card"
}

const EmptyStateNoData: React.FC<EmptyStateNoDataProps> = ({
  onAction,
  actionLabel = "Refresh",
  variant,
}) => (
  <EmptyState
    icon={<Inbox className="w-8 h-8" />}
    title="No data available"
    description="There's nothing to show here yet. Check back later or try refreshing."
    variant={variant}
    action={onAction ? { label: actionLabel, onClick: onAction } : undefined}
  />
)

export interface EmptyStateNoResultsProps {
  searchQuery?: string
  onClear?: () => void
  variant?: "default" | "ghost" | "glass" | "card"
}

const EmptyStateNoResults: React.FC<EmptyStateNoResultsProps> = ({
  searchQuery,
  onClear,
  variant,
}) => (
  <EmptyState
    icon={<Search className="w-8 h-8" />}
    title="No results found"
    description={
      searchQuery
        ? `No results for "${searchQuery}". Try adjusting your search terms.`
        : "No results match your search criteria. Try different filters."
    }
    variant={variant}
    action={onClear ? { label: "Clear filters", onClick: onClear } : undefined}
  />
)

export interface EmptyStateNoAccessProps {
  reason?: string
  onRequest?: () => void
  variant?: "default" | "ghost" | "glass" | "card"
}

const EmptyStateNoAccess: React.FC<EmptyStateNoAccessProps> = ({
  reason = "You don't have permission to view this content.",
  onRequest,
  variant,
}) => (
  <EmptyState
    icon={<Lock className="w-8 h-8" />}
    title="Access restricted"
    description={reason}
    variant={variant}
    action={
      onRequest
        ? { label: "Request access", onClick: onRequest }
        : undefined
    }
  />
)

export interface EmptyStateComingSoonProps {
  feature?: string
  variant?: "default" | "ghost" | "glass" | "card"
}

const EmptyStateComingSoon: React.FC<EmptyStateComingSoonProps> = ({
  feature = "This feature",
  variant,
}) => (
  <EmptyState
    icon={<Sparkles className="w-8 h-8" />}
    title="Coming soon"
    description={`${feature} is currently under development. Stay tuned for updates!`}
    variant={variant}
  />
)

export interface EmptyStateNoFilesProps {
  onUpload?: () => void
  variant?: "default" | "ghost" | "glass" | "card"
}

const EmptyStateNoFiles: React.FC<EmptyStateNoFilesProps> = ({
  onUpload,
  variant,
}) => (
  <EmptyState
    icon={<FolderOpen className="w-8 h-8" />}
    title="No files uploaded"
    description="Upload your first file to get started."
    variant={variant}
    action={
      onUpload ? { label: "Upload file", onClick: onUpload } : undefined
    }
  />
)

export interface EmptyStateNoUsersProps {
  onInvite?: () => void
  variant?: "default" | "ghost" | "glass" | "card"
}

const EmptyStateNoUsers: React.FC<EmptyStateNoUsersProps> = ({
  onInvite,
  variant,
}) => (
  <EmptyState
    icon={<Users className="w-8 h-8" />}
    title="No users yet"
    description="Invite team members to collaborate on this project."
    variant={variant}
    action={onInvite ? { label: "Invite users", onClick: onInvite } : undefined}
  />
)

export interface EmptyStateNoMessagesProps {
  onCompose?: () => void
  variant?: "default" | "ghost" | "glass" | "card"
}

const EmptyStateNoMessages: React.FC<EmptyStateNoMessagesProps> = ({
  onCompose,
  variant,
}) => (
  <EmptyState
    icon={<Mail className="w-8 h-8" />}
    title="No messages"
    description="Your inbox is empty. Compose a new message to get started."
    variant={variant}
    action={
      onCompose ? { label: "Compose message", onClick: onCompose } : undefined
    }
  />
)

export interface EmptyStateNoEventsProps {
  onCreate?: () => void
  variant?: "default" | "ghost" | "glass" | "card"
}

const EmptyStateNoEvents: React.FC<EmptyStateNoEventsProps> = ({
  onCreate,
  variant,
}) => (
  <EmptyState
    icon={<Calendar className="w-8 h-8" />}
    title="No events scheduled"
    description="Create your first event to start managing your calendar."
    variant={variant}
    action={onCreate ? { label: "Create event", onClick: onCreate } : undefined}
  />
)

export interface EmptyState404Props {
  onGoBack?: () => void
  onGoHome?: () => void
  variant?: "default" | "ghost" | "glass" | "card"
}

const EmptyState404: React.FC<EmptyState404Props> = ({
  onGoBack,
  onGoHome,
  variant,
}) => (
  <EmptyState
    icon={<FileQuestion className="w-8 h-8" />}
    title="Page not found"
    description="The page you're looking for doesn't exist or has been moved."
    variant={variant}
    action={onGoHome ? { label: "Go home", onClick: onGoHome } : undefined}
    secondaryAction={
      onGoBack ? { label: "Go back", onClick: onGoBack } : undefined
    }
  />
)

export interface EmptyStateErrorProps {
  title?: string
  description?: string
  onRetry?: () => void
  variant?: "default" | "ghost" | "glass" | "card"
}

const EmptyStateError: React.FC<EmptyStateErrorProps> = ({
  title = "Something went wrong",
  description = "An unexpected error occurred. Please try again.",
  onRetry,
  variant,
}) => (
  <EmptyState
    icon={<AlertCircle className="w-8 h-8" />}
    title={title}
    description={description}
    variant={variant}
    action={onRetry ? { label: "Try again", onClick: onRetry } : undefined}
  />
)

export {
  EmptyState,
  EmptyStateNoData,
  EmptyStateNoResults,
  EmptyStateNoAccess,
  EmptyStateComingSoon,
  EmptyStateNoFiles,
  EmptyStateNoUsers,
  EmptyStateNoMessages,
  EmptyStateNoEvents,
  EmptyState404,
  EmptyStateError,
  emptyStateVariants,
}
