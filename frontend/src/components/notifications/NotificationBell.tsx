"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Archive,
  X,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/contexts/NotificationContext";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

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

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
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

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current &&
        buttonRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle notification click
  const handleNotificationClick = async (notification: {
    id: number;
    is_read: boolean;
    action_url?: string;
  }) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    if (notification.action_url) {
      setIsOpen(false);
      router.push(notification.action_url);
    }
  };

  // Format relative time
  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return "recently";
    }
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <Button
        ref={buttonRef}
        variant="ghost"
        size="sm"
        className="relative h-9 w-9 p-0 hover:bg-slate-800/50"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            fetchNotifications();
          }
        }}
      >
        <Bell className="h-5 w-5 text-slate-300" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5"
            >
              <Badge className="h-5 min-w-[20px] px-1 bg-red-500 text-white text-xs font-medium border-0">
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>
      </Button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-12 z-50 w-96 max-w-[calc(100vw-2rem)]"
          >
            <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-blue-400" />
                  <h3 className="font-semibold text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <Badge className="bg-blue-500/20 text-blue-400 border-0">
                      {unreadCount} new
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs text-slate-400 hover:text-white"
                      onClick={markAllAsRead}
                    >
                      <CheckCheck className="h-3.5 w-3.5 mr-1" />
                      Mark all read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Notification List */}
              <ScrollArea className="h-[400px]">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-slate-500">
                    <Bell className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">No notifications</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-700/30">
                    {notifications.map((notification) => {
                      const IconComponent =
                        typeIcons[notification.type] || Info;
                      const iconColor =
                        typeColors[notification.type] || "text-slate-400";
                      const bgColor =
                        typeBgColors[notification.type] || "bg-slate-500/10";

                      return (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className={cn(
                            "p-3 hover:bg-slate-800/50 transition-colors cursor-pointer group",
                            !notification.is_read && "bg-blue-500/5"
                          )}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex gap-3">
                            {/* Icon */}
                            <div
                              className={cn(
                                "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                                bgColor
                              )}
                            >
                              <IconComponent
                                className={cn("h-5 w-5", iconColor)}
                              />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p
                                    className={cn(
                                      "text-sm font-medium truncate",
                                      notification.is_read
                                        ? "text-slate-300"
                                        : "text-white"
                                    )}
                                  >
                                    {notification.title}
                                  </p>
                                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                                    {notification.message}
                                  </p>
                                </div>

                                {/* Unread indicator */}
                                {!notification.is_read && (
                                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                                )}
                              </div>

                              {/* Footer */}
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-slate-600">
                                  {formatTime(notification.created_at)}
                                </span>

                                {/* Actions */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {!notification.is_read && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 text-slate-500 hover:text-green-400"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        markAsRead(notification.id);
                                      }}
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-slate-500 hover:text-amber-400"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      archiveNotification(notification.id);
                                    }}
                                  >
                                    <Archive className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-slate-500 hover:text-red-400"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteNotification(notification.id);
                                    }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>

                              {/* Action Button */}
                              {notification.action_url &&
                                notification.action_text && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-2 h-7 text-xs border-slate-700 hover:border-blue-500 hover:text-blue-400"
                                  >
                                    {notification.action_text}
                                  </Button>
                                )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="border-t border-slate-700/50 px-4 py-2">
                  <Button
                    variant="ghost"
                    className="w-full h-8 text-xs text-slate-400 hover:text-white"
                    onClick={() => {
                      setIsOpen(false);
                      router.push("/notifications");
                    }}
                  >
                    View all notifications
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
