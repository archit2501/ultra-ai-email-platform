"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, Archive, Trash2, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Link from 'next/link';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  action_url?: string;
  action_text?: string;
  is_read: boolean;
  is_archived: boolean;
  icon?: string;
  priority: number;
  created_at: string;
  read_at?: string;
}

interface NotificationStats {
  total: number;
  unread: number;
  by_type: Record<string, number>;
}

const typeColors: Record<string, { bg: string; text: string; border: string }> = {
  campaign_created: { bg: '#EEF2FF', text: '#4338CA', border: '#818CF8' },
  campaign_sending: { bg: '#F3E8FF', text: '#6D28D9', border: '#C084FC' },
  campaign_completed: { bg: '#DCFCE7', text: '#16A34A', border: '#86EFAC' },
  campaign_failed: { bg: '#FEE2E2', text: '#DC2626', border: '#FCA5A5' },
  campaign_paused: { bg: '#FEF3C7', text: '#D97706', border: '#FCD34D' },
  reply_detected: { bg: '#DDD6FE', text: '#4F46E5', border: '#A5B4FC' },
  email_opened: { bg: '#E0E7FF', text: '#3730A3', border: '#818CF8' },
  email_replied: { bg: '#DDD6FE', text: '#4F46E5', border: '#A5B4FC' },
  success: { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' },
  error: { bg: '#FEE2E2', text: '#DC2626', border: '#FCA5A5' },
  warning: { bg: '#FEF3C7', text: '#B45309', border: '#FCD34D' },
  info: { bg: '#E0E7FF', text: '#1E40AF', border: '#93C5FD' },
};

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/v1/notifications?limit=10&include_read=true', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
      });
      const data = await response.json();
      if (data.notifications) {
        setNotifications(data.notifications);
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await fetch(`/api/v1/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
      });
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const handleArchive = async (notificationId: number) => {
    try {
      await fetch(`/api/v1/notifications/${notificationId}/archive`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
      });
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success('Notification archived');
    } catch (error) {
      toast.error('Failed to archive');
    }
  };

  const handleDelete = async (notificationId: number) => {
    try {
      await fetch(`/api/v1/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
      });
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch('/api/v1/notifications/read-all', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read && !n.is_archived).length;
  const displayedNotifications = notifications.slice(0, 5);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-50 max-h-96 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
              <div>
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <p className="text-xs text-gray-600">{unreadCount} unread</p>
                )}
              </div>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                    title="Mark all as read"
                  >
                    <Check size={16} className="text-gray-600" />
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowSettings(!showSettings);
                    setIsOpen(false);
                  }}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title="Notification settings"
                >
                  <Settings size={16} className="text-gray-600" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {displayedNotifications.length > 0 ? (
                displayedNotifications.map((notif, idx) => {
                  const colors = typeColors[notif.type] || typeColors.info;
                  return (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`p-3 border-l-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        notif.is_read ? 'opacity-60' : ''
                      }`}
                      style={{ borderLeftColor: colors.border }}
                    >
                      {notif.action_url ? (
                        <Link href={notif.action_url} onClick={() => setIsOpen(false)}>
                          <div className="group">
                            <h4 className="font-medium text-sm text-gray-900 group-hover:text-blue-600">
                              {notif.title}
                            </h4>
                            <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              {new Date(notif.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </Link>
                      ) : (
                        <div>
                          <h4 className="font-medium text-sm text-gray-900">{notif.title}</h4>
                          <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(notif.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notif.is_read && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleMarkAsRead(notif.id);
                            }}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                          >
                            Mark as read
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleArchive(notif.id);
                          }}
                          className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                        >
                          Archive
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Bell size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 5 && (
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <Link
                  href="/notifications"
                  onClick={() => setIsOpen(false)}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  View all notifications →
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
