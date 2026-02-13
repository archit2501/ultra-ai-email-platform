"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Home,
  FileText,
  Users,
  Mail,
  Settings,
  Search,
  Calendar,
  BarChart3,
  Palette,
  FileUp,
  Bell,
  LogOut,
  User,
  Shield,
  HelpCircle,
  Moon,
  Sun,
  Monitor,
  Zap,
  type LucideIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

// ========================================
// TYPES
// ========================================

interface CommandAction {
  id: string
  label: string
  description?: string
  icon: LucideIcon
  keywords?: string[]
  action: () => void
  shortcut?: string
}

interface CommandSection {
  heading: string
  actions: CommandAction[]
}

// ========================================
// COMMAND PALETTE
// ========================================

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter()
  const { setTheme } = useTheme()
  const [recentPages, setRecentPages] = React.useState<CommandAction[]>([])

  // Load recent pages from localStorage
  React.useEffect(() => {
    const recent = localStorage.getItem("command-palette-recent")
    if (recent) {
      try {
        const parsed = JSON.parse(recent)
        setRecentPages(parsed.slice(0, 5)) // Keep only 5 most recent
      } catch {
        // Ignore parse errors
      }
    }
  }, [])

  // Save page visit
  const addToRecent = React.useCallback((action: CommandAction) => {
    setRecentPages((prev) => {
      const filtered = prev.filter((a) => a.id !== action.id)
      const newRecent = [action, ...filtered].slice(0, 5)
      localStorage.setItem("command-palette-recent", JSON.stringify(newRecent))
      return newRecent
    })
  }, [])

  // Navigation actions
  const navigationActions: CommandAction[] = [
    {
      id: "nav-dashboard",
      label: "Dashboard",
      description: "Go to dashboard home",
      icon: Home,
      keywords: ["home", "main"],
      action: () => {
        router.push("/dashboard")
        onOpenChange(false)
        addToRecent({
          id: "nav-dashboard",
          label: "Dashboard",
          icon: Home,
          action: () => router.push("/dashboard"),
        })
      },
    },
    {
      id: "nav-applications",
      label: "Applications",
      description: "View all job applications",
      icon: FileText,
      keywords: ["jobs", "apply"],
      action: () => {
        router.push("/applications")
        onOpenChange(false)
        addToRecent({
          id: "nav-applications",
          label: "Applications",
          icon: FileText,
          action: () => router.push("/applications"),
        })
      },
    },
    {
      id: "nav-recipients",
      label: "Recipients",
      description: "Manage contact directory",
      icon: Users,
      keywords: ["contacts", "people"],
      action: () => {
        router.push("/recipients")
        onOpenChange(false)
        addToRecent({
          id: "nav-recipients",
          label: "Recipients",
          icon: Users,
          action: () => router.push("/recipients"),
        })
      },
    },
    {
      id: "nav-groups",
      label: "Recipient Groups",
      description: "Manage recipient groups",
      icon: Users,
      keywords: ["segments", "lists"],
      action: () => {
        router.push("/recipient-groups")
        onOpenChange(false)
        addToRecent({
          id: "nav-groups",
          label: "Recipient Groups",
          icon: Users,
          action: () => router.push("/recipient-groups"),
        })
      },
    },
    {
      id: "nav-templates",
      label: "Email Templates",
      description: "Manage email templates",
      icon: Mail,
      keywords: ["emails", "drafts"],
      action: () => {
        router.push("/templates")
        onOpenChange(false)
        addToRecent({
          id: "nav-templates",
          label: "Email Templates",
          icon: Mail,
          action: () => router.push("/templates"),
        })
      },
    },
    {
      id: "nav-calendar",
      label: "Calendar",
      description: "View scheduled events",
      icon: Calendar,
      keywords: ["schedule", "events"],
      action: () => {
        router.push("/calendar")
        onOpenChange(false)
        addToRecent({
          id: "nav-calendar",
          label: "Calendar",
          icon: Calendar,
          action: () => router.push("/calendar"),
        })
      },
    },
    {
      id: "nav-analytics",
      label: "Analytics",
      description: "View performance metrics",
      icon: BarChart3,
      keywords: ["stats", "reports", "metrics"],
      action: () => {
        router.push("/analytics")
        onOpenChange(false)
        addToRecent({
          id: "nav-analytics",
          label: "Analytics",
          icon: BarChart3,
          action: () => router.push("/analytics"),
        })
      },
    },
    {
      id: "nav-design-system",
      label: "Design System",
      description: "View UI components",
      icon: Palette,
      keywords: ["components", "ui", "design"],
      action: () => {
        router.push("/design-system")
        onOpenChange(false)
        addToRecent({
          id: "nav-design-system",
          label: "Design System",
          icon: Palette,
          action: () => router.push("/design-system"),
        })
      },
    },
    {
      id: "nav-settings",
      label: "Settings",
      description: "Configure your account",
      icon: Settings,
      keywords: ["preferences", "config"],
      action: () => {
        router.push("/settings")
        onOpenChange(false)
        addToRecent({
          id: "nav-settings",
          label: "Settings",
          icon: Settings,
          action: () => router.push("/settings"),
        })
      },
    },
  ]

  // Quick actions
  const quickActions: CommandAction[] = [
    {
      id: "action-new-application",
      label: "New Application",
      description: "Create a new job application",
      icon: FileUp,
      keywords: ["create", "add"],
      action: () => {
        router.push("/applications?new=true")
        onOpenChange(false)
      },
      shortcut: "⌘N",
    },
    {
      id: "action-new-template",
      label: "New Template",
      description: "Create an email template",
      icon: Mail,
      keywords: ["create", "email"],
      action: () => {
        router.push("/templates?new=true")
        onOpenChange(false)
      },
    },
    {
      id: "action-search",
      label: "Search Applications",
      description: "Search through all applications",
      icon: Search,
      keywords: ["find", "filter"],
      action: () => {
        router.push("/applications")
        onOpenChange(false)
      },
      shortcut: "⌘/",
    },
    {
      id: "action-notifications",
      label: "View Notifications",
      description: "Check your notifications",
      icon: Bell,
      keywords: ["alerts", "updates"],
      action: () => {
        // This would open a notifications panel
        onOpenChange(false)
      },
    },
  ]

  // Theme actions
  const themeActions: CommandAction[] = [
    {
      id: "theme-light",
      label: "Light Theme",
      description: "Switch to light mode",
      icon: Sun,
      keywords: ["appearance", "mode"],
      action: () => {
        setTheme("light")
        onOpenChange(false)
      },
    },
    {
      id: "theme-dark",
      label: "Dark Theme",
      description: "Switch to dark mode",
      icon: Moon,
      keywords: ["appearance", "mode"],
      action: () => {
        setTheme("dark")
        onOpenChange(false)
      },
    },
    {
      id: "theme-system",
      label: "System Theme",
      description: "Use system preference",
      icon: Monitor,
      keywords: ["appearance", "mode", "auto"],
      action: () => {
        setTheme("system")
        onOpenChange(false)
      },
    },
  ]

  // Account actions
  const accountActions: CommandAction[] = [
    {
      id: "account-profile",
      label: "Your Profile",
      description: "View and edit your profile",
      icon: User,
      keywords: ["account", "settings"],
      action: () => {
        router.push("/settings/profile")
        onOpenChange(false)
      },
    },
    {
      id: "account-security",
      label: "Security",
      description: "Manage security settings",
      icon: Shield,
      keywords: ["password", "2fa"],
      action: () => {
        router.push("/settings/security")
        onOpenChange(false)
      },
    },
    {
      id: "account-help",
      label: "Help & Support",
      description: "Get help and documentation",
      icon: HelpCircle,
      keywords: ["docs", "support", "faq"],
      action: () => {
        router.push("/help")
        onOpenChange(false)
      },
    },
    {
      id: "account-logout",
      label: "Log Out",
      description: "Sign out of your account",
      icon: LogOut,
      keywords: ["exit", "signout"],
      action: () => {
        router.push("/auth/login")
        onOpenChange(false)
      },
    },
  ]

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <Command className="rounded-lg border-border shadow-premium-lg">
        <div className="flex items-center border-b border-border px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <CommandInput
            placeholder="Type a command or search..."
            className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          />
          <kbd className="pointer-events-none ml-2 hidden h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            ESC
          </kbd>
        </div>
        <CommandList className="max-h-[400px] overflow-y-auto">
          <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
            No results found.
          </CommandEmpty>

          {/* Recent Pages */}
          {recentPages.length > 0 && (
            <>
              <CommandGroup heading="Recent">
                {recentPages.map((action) => (
                  <CommandItem
                    key={action.id}
                    onSelect={action.action}
                    className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
                  >
                    <action.icon className="h-4 w-4 text-muted-foreground" />
                    <span>{action.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {/* Navigation */}
          <CommandGroup heading="Navigation">
            {navigationActions.map((action) => (
              <CommandItem
                key={action.id}
                onSelect={action.action}
                keywords={action.keywords}
                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
              >
                <action.icon className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col flex-1">
                  <span>{action.label}</span>
                  {action.description && (
                    <span className="text-xs text-muted-foreground">
                      {action.description}
                    </span>
                  )}
                </div>
                {action.shortcut && (
                  <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                    {action.shortcut}
                  </kbd>
                )}
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          {/* Quick Actions */}
          <CommandGroup heading="Quick Actions">
            {quickActions.map((action) => (
              <CommandItem
                key={action.id}
                onSelect={action.action}
                keywords={action.keywords}
                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
              >
                <action.icon className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col flex-1">
                  <span>{action.label}</span>
                  {action.description && (
                    <span className="text-xs text-muted-foreground">
                      {action.description}
                    </span>
                  )}
                </div>
                {action.shortcut && (
                  <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                    {action.shortcut}
                  </kbd>
                )}
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          {/* Theme */}
          <CommandGroup heading="Theme">
            {themeActions.map((action) => (
              <CommandItem
                key={action.id}
                onSelect={action.action}
                keywords={action.keywords}
                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
              >
                <action.icon className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col flex-1">
                  <span>{action.label}</span>
                  {action.description && (
                    <span className="text-xs text-muted-foreground">
                      {action.description}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          {/* Account */}
          <CommandGroup heading="Account">
            {accountActions.map((action) => (
              <CommandItem
                key={action.id}
                onSelect={action.action}
                keywords={action.keywords}
                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
              >
                <action.icon className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col flex-1">
                  <span>{action.label}</span>
                  {action.description && (
                    <span className="text-xs text-muted-foreground">
                      {action.description}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}

// ========================================
// COMMAND PALETTE PROVIDER
// ========================================

interface CommandPaletteProviderProps {
  children: React.ReactNode
}

export function CommandPaletteProvider({ children }: CommandPaletteProviderProps) {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <>
      {children}
      <CommandPalette open={open} onOpenChange={setOpen} />
    </>
  )
}

// ========================================
// COMMAND PALETTE TRIGGER
// ========================================

interface CommandPaletteTriggerProps {
  onClick?: () => void
  className?: string
}

export function CommandPaletteTrigger({ onClick, className }: CommandPaletteTriggerProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 w-full max-w-sm px-3 py-2 text-sm text-muted-foreground rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors",
        className
      )}
    >
      <Search className="h-4 w-4" />
      <span>Search...</span>
      <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
        <span className="text-xs">⌘</span>K
      </kbd>
    </button>
  )
}
