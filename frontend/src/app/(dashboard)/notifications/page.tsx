"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Archive,
  Filter,
  RefreshCw,
  Mail,
  Send,
  MessageCircle,
  Briefcase,
  Thermometer,
  Clock,
  Settings,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FloatingGlassCard, GlassPanel } from "@/components/ui/glass-panel";
import { useNotifications } from "@/contexts/NotificationContext";
import { notificationsAPI, Notification } from "@/lib/api";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

// Icon mapping for notification types
const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  email_sent: Send,
  email_opened: Mail,
  email_replied: MessageCircle,
  application_update: Briefcase,
  warming_alert: Thermometer,
  rate_limit: Clock,
  system: Settings,
};

// Color mapping for notification types
const typeColors: Record<string, string> = {
  info: "text-blue-400",
  success: "text-green-400",
  warning: "text-amber-400",
  error: "text-red-400",
  email_sent: "text-cyan-400",
  email_opened: "text-purple-400",
  email_replied: "text-pink-400",
  application_update: "text-indigo-400",
  warming_alert: "text-orange-400",
  rate_limit: "text-yellow-400",
  system: "text-slate-400",
};

// Background colors for notifications
const typeBgColors: Record<string, string> = {
  info: "bg-blue-500/10",
  success: "bg-green-500/10",
  warning: "bg-amber-500/10",
  error: "bg-red-500/10",
  email_sent: "bg-cyan-500/10",
  email_opened: "bg-purple-500/10",
  email_replied: "bg-pink-500/10",
  application_update: "bg-indigo-500/10",
  warming_alert: "bg-orange-500/10",
  rate_limit: "bg-yellow-500/10",
  system: "bg-slate-500/10",
};

type TabValue = "all" | "unread" | "archived";

export default function NotificationsPage() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
  } = useNotifications();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [archivedNotifications, setArchivedNotifications] = useState<Notification[]>([]);
  const [loadingArchived, setLoadingArchived] = useState(false);

  // Fetch archived notifications when tab changes
  useEffect(() => {
    if (activeTab === "archived") {
      fetchArchivedNotifications();
    }
  }, [activeTab]);

  const fetchArchivedNotifications = async () => {
    try {
      setLoadingArchived(true);
      const response = await notificationsAPI.getAll({
        include_read: true,
        include_archived: true,
        limit: 50,
      });
      // Filter to only show archived
      setArchivedNotifications(
        response.data.notifications.filter((n) => n.is_archived)
      );
    } catch (error) {
      toast.error("Failed to load archived notifications");
    } finally {
      setLoadingArchived(false);
    }
  };

  // Filter notifications
  const getFilteredNotifications = () => {
    let filtered =
      activeTab === "archived" ? archivedNotifications : notifications;

    if (activeTab === "unread") {
      filtered = filtered.filter((n) => !n.is_read);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.message.toLowerCase().includes(query)
      );
    }

    if (selectedType !== "all") {
      filtered = filtered.filter((n) => n.type === selectedType);
    }

    return filtered;
  };

  const filteredNotifications = getFilteredNotifications();

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    if (notification.action_url) {
      router.push(notification.action_url);
    }
  };

  // Format time
  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return "recently";
    }
  };

  const formatFullDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "PPpp");
    } catch {
      return "Unknown date";
    }
  };

  // Notification types for filter
  const notificationTypes = [
    { value: "all", label: "All Types" },
    { value: "info", label: "Info" },
    { value: "success", label: "Success" },
    { value: "warning", label: "Warning" },
    { value: "error", label: "Error" },
    { value: "email_sent", label: "Email Sent" },
    { value: "email_opened", label: "Email Opened" },
    { value: "email_replied", label: "Email Replied" },
    { value: "application_update", label: "Application Update" },
    { value: "warming_alert", label: "Warming Alert" },
    { value: "rate_limit", label: "Rate Limit" },
    { value: "system", label: "System" },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Notifications
          </h1>
          <p className="text-slate-400 mt-1">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "You're all caught up!"}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              variant="outline"
              className="gap-2 border-slate-700 hover:border-green-500/50 hover:text-green-400"
            >
              <CheckCheck className="h-4 w-4" />
              Mark All Read
            </Button>
          )}
          <Button
            onClick={fetchNotifications}
            variant="outline"
            className="gap-2 border-slate-700 hover:border-slate-600"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <GlassPanel className="p-4" blur="md" border>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-800/50 border-slate-700 focus:border-blue-500"
              />
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full sm:w-48 bg-slate-800/50 border-slate-700">
                <Filter className="h-4 w-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {notificationTypes.map((type) => (
                  <SelectItem
                    key={type.value}
                    value={type.value}
                    className="text-white hover:bg-slate-700"
                  >
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </GlassPanel>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
          <TabsList className="bg-slate-800/50 border border-slate-700">
            <TabsTrigger value="all" className="data-[state=active]:bg-slate-700">
              All
              <Badge className="ml-2 bg-slate-700 text-slate-300 text-xs">
                {notifications.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="unread" className="data-[state=active]:bg-slate-700">
              Unread
              {unreadCount > 0 && (
                <Badge className="ml-2 bg-blue-500 text-white text-xs">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="archived" className="data-[state=active]:bg-slate-700">
              Archived
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {(loading || (activeTab === "archived" && loadingArchived)) ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <FloatingGlassCard className="p-8" hover={false}>
                <div className="flex flex-col items-center justify-center text-center">
                  <Bell className="h-12 w-12 text-slate-600 mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">
                    No notifications
                  </h3>
                  <p className="text-slate-400">
                    {activeTab === "unread"
                      ? "You've read all your notifications"
                      : activeTab === "archived"
                      ? "No archived notifications"
                      : "No notifications yet"}
                  </p>
                </div>
              </FloatingGlassCard>
            ) : (
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {filteredNotifications.map((notification, index) => {
                    const IconComponent =
                      typeIcons[notification.type] || Info;
                    const iconColor =
                      typeColors[notification.type] || "text-slate-400";
                    const bgColor =
                      typeBgColors[notification.type] || "bg-slate-500/10";

                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <FloatingGlassCard
                          className={cn(
                            "p-4 cursor-pointer",
                            !notification.is_read && "ring-1 ring-blue-500/30"
                          )}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex gap-4">
                            {/* Icon */}
                            <div
                              className={cn(
                                "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
                                bgColor
                              )}
                            >
                              <IconComponent
                                className={cn("h-6 w-6", iconColor)}
                              />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4
                                      className={cn(
                                        "font-medium",
                                        notification.is_read
                                          ? "text-slate-300"
                                          : "text-white"
                                      )}
                                    >
                                      {notification.title}
                                    </h4>
                                    {!notification.is_read && (
                                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                                    )}
                                  </div>
                                  <p className="text-sm text-slate-400 mt-1">
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center gap-4 mt-2">
                                    <span className="text-xs text-slate-500">
                                      {formatTime(notification.created_at)}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className="text-xs border-slate-700 text-slate-400"
                                    >
                                      {notification.type.replace("_", " ")}
                                    </Badge>
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1">
                                  {!notification.is_read && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-slate-500 hover:text-green-400"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        markAsRead(notification.id);
                                      }}
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-slate-500 hover:text-amber-400"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      archiveNotification(notification.id);
                                    }}
                                  >
                                    <Archive className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-slate-500 hover:text-red-400"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteNotification(notification.id);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              {/* Action Button */}
                              {notification.action_url &&
                                notification.action_text && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-3 border-slate-700 hover:border-blue-500 hover:text-blue-400"
                                  >
                                    {notification.action_text}
                                  </Button>
                                )}
                            </div>
                          </div>
                        </FloatingGlassCard>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <FloatingGlassCard className="p-4" hover={false}>
          <h3 className="text-sm font-medium text-slate-400 mb-3">
            Notification Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {notifications.length}
              </div>
              <div className="text-xs text-slate-500">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {unreadCount}
              </div>
              <div className="text-xs text-slate-500">Unread</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {notifications.filter((n) => n.is_read).length}
              </div>
              <div className="text-xs text-slate-500">Read</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">
                {archivedNotifications.length}
              </div>
              <div className="text-xs text-slate-500">Archived</div>
            </div>
          </div>
        </FloatingGlassCard>
      </motion.div>
    </div>
  );
}
