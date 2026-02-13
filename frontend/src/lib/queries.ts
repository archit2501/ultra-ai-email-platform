/**
 * React Query Hooks
 *
 * Provides intelligent data caching, background refetching,
 * and optimistic updates for all API operations.
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import {
  applicationsAPI,
  resumesAPI,
  templatesAPI,
  emailWarmingAPI,
  rateLimitingAPI,
  notificationsAPI,
  dashboardAPI,
} from "./api";
import type {
  Application,
  ApplicationCreate,
  ApplicationUpdate,
  ResumeVersion,
  EmailTemplate,
  DashboardStats,
} from "@/types";

// ============================================
// Query Keys - Centralized for cache management
// ============================================

export const queryKeys = {
  // Applications
  applications: ["applications"] as const,
  application: (id: number) => ["applications", id] as const,
  applicationHistory: (id: number) => ["applications", id, "history"] as const,
  applicationNotes: (id: number) => ["applications", id, "notes"] as const,
  applicationStats: ["applications", "stats"] as const,

  // Resumes
  resumes: ["resumes"] as const,
  resume: (id: number) => ["resumes", id] as const,

  // Templates
  templates: ["templates"] as const,
  template: (id: number) => ["templates", id] as const,

  // Email Warming
  warmingConfig: ["warming", "config"] as const,
  warmingProgress: ["warming", "progress"] as const,
  warmingPresets: ["warming", "presets"] as const,
  warmingLogs: ["warming", "logs"] as const,

  // Rate Limiting
  rateLimitConfig: ["rate-limits", "config"] as const,
  rateLimitUsage: ["rate-limits", "usage"] as const,
  rateLimitPresets: ["rate-limits", "presets"] as const,
  rateLimitCheck: ["rate-limits", "check"] as const,

  // Notifications
  notifications: ["notifications"] as const,
  notificationStats: ["notifications", "stats"] as const,
  unreadCount: ["notifications", "unread"] as const,

  // Dashboard
  dashboard: ["dashboard"] as const,
};

// ============================================
// Applications Hooks
// ============================================

export function useApplications(options?: Partial<UseQueryOptions<Application[]>>) {
  return useQuery({
    queryKey: queryKeys.applications,
    queryFn: () => applicationsAPI.getAll(),
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
}

export function useApplication(id: number, options?: Partial<UseQueryOptions<Application>>) {
  return useQuery({
    queryKey: queryKeys.application(id),
    queryFn: () => applicationsAPI.getById(id).then((res) => res.data),
    staleTime: 60 * 1000, // 1 minute
    enabled: !!id,
    ...options,
  });
}

export function useApplicationStats(candidateId?: number) {
  return useQuery({
    queryKey: [...queryKeys.applicationStats, candidateId],
    queryFn: () => applicationsAPI.getStats(candidateId).then((res) => res.data),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

export function useApplicationHistory(id: number) {
  return useQuery({
    queryKey: queryKeys.applicationHistory(id),
    queryFn: () => applicationsAPI.getHistory(id).then((res) => res.data),
    staleTime: 30 * 1000,
    enabled: !!id,
  });
}

export function useApplicationNotes(id: number) {
  return useQuery({
    queryKey: queryKeys.applicationNotes(id),
    queryFn: () => applicationsAPI.getNotes(id).then((res) => res.data),
    staleTime: 30 * 1000,
    enabled: !!id,
  });
}

// Mutations
export function useCreateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ApplicationCreate) => applicationsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applications });
      queryClient.invalidateQueries({ queryKey: queryKeys.applicationStats });
    },
  });
}

export function useUpdateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ApplicationUpdate }) =>
      applicationsAPI.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applications });
      queryClient.invalidateQueries({ queryKey: queryKeys.application(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.applicationStats });
    },
  });
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, note }: { id: number; status: string; note?: string }) =>
      applicationsAPI.updateStatus(id, { status, note }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applications });
      queryClient.invalidateQueries({ queryKey: queryKeys.application(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.applicationStats });
      queryClient.invalidateQueries({ queryKey: queryKeys.applicationHistory(id) });
    },
  });
}

export function useDeleteApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => applicationsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applications });
      queryClient.invalidateQueries({ queryKey: queryKeys.applicationStats });
    },
  });
}

export function useSendEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data?: { resume_version_id?: number; template_id?: number; force_send?: boolean };
    }) => applicationsAPI.sendEmail(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applications });
      queryClient.invalidateQueries({ queryKey: queryKeys.application(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.applicationStats });
      queryClient.invalidateQueries({ queryKey: queryKeys.rateLimitUsage });
      queryClient.invalidateQueries({ queryKey: queryKeys.warmingProgress });
    },
  });
}

export function useAddApplicationNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, content, noteType }: { id: number; content: string; noteType?: string }) =>
      applicationsAPI.addNote(id, { content, note_type: noteType }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applicationNotes(id) });
    },
  });
}

// ============================================
// Resumes Hooks
// ============================================

export function useResumes() {
  return useQuery({
    queryKey: queryKeys.resumes,
    queryFn: () => resumesAPI.list({ limit: 100 }).then((res) => res.data.items || []),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useResume(id: number) {
  return useQuery({
    queryKey: queryKeys.resume(id),
    queryFn: () => resumesAPI.getById(id).then((res) => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!id,
  });
}

export function useCreateResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => resumesAPI.create(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resumes });
    },
  });
}

export function useUpdateResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ResumeVersion> }) =>
      resumesAPI.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resumes });
      queryClient.invalidateQueries({ queryKey: queryKeys.resume(id) });
    },
  });
}

export function useDeleteResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => resumesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resumes });
    },
  });
}

export function useSetDefaultResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => resumesAPI.setDefault(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resumes });
    },
  });
}

// ============================================
// Templates Hooks
// ============================================

export function useTemplates(category?: string) {
  return useQuery({
    queryKey: [...queryKeys.templates, category],
    queryFn: () => templatesAPI.list({ limit: 100, category }).then((res) => res.data.items || []),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useTemplate(id: number) {
  return useQuery({
    queryKey: queryKeys.template(id),
    queryFn: () => templatesAPI.getById(id).then((res) => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!id,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<EmailTemplate>) => templatesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<EmailTemplate> }) =>
      templatesAPI.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates });
      queryClient.invalidateQueries({ queryKey: queryKeys.template(id) });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => templatesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates });
    },
  });
}

export function useSetDefaultTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => templatesAPI.setDefault(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates });
    },
  });
}

// ============================================
// Email Warming Hooks
// ============================================

export function useWarmingPresets() {
  return useQuery({
    queryKey: queryKeys.warmingPresets,
    queryFn: () => emailWarmingAPI.getPresets().then((res) => res.data.presets),
    staleTime: 10 * 60 * 1000, // 10 minutes - presets rarely change
  });
}

export function useWarmingConfig() {
  return useQuery({
    queryKey: queryKeys.warmingConfig,
    queryFn: () => emailWarmingAPI.getConfig().then((res) => res.data),
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useWarmingProgress() {
  return useQuery({
    queryKey: queryKeys.warmingProgress,
    queryFn: () => emailWarmingAPI.getProgress().then((res) => res.data.progress),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute when warming is active
  });
}

export function useWarmingLogs() {
  return useQuery({
    queryKey: queryKeys.warmingLogs,
    queryFn: () => emailWarmingAPI.getDailyLogs().then((res) => res.data),
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useCreateWarmingConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { strategy: string; custom_schedule?: Record<number, number>; auto_progress?: boolean }) =>
      emailWarmingAPI.createConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.warmingConfig });
      queryClient.invalidateQueries({ queryKey: queryKeys.warmingProgress });
    },
  });
}

export function useUpdateWarmingConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { strategy?: string; custom_schedule?: Record<number, number>; auto_progress?: boolean }) =>
      emailWarmingAPI.updateConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.warmingConfig });
      queryClient.invalidateQueries({ queryKey: queryKeys.warmingProgress });
    },
  });
}

export function useStartWarming() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => emailWarmingAPI.start(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.warmingConfig });
      queryClient.invalidateQueries({ queryKey: queryKeys.warmingProgress });
    },
  });
}

export function usePauseWarming() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => emailWarmingAPI.pause(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.warmingConfig });
      queryClient.invalidateQueries({ queryKey: queryKeys.warmingProgress });
    },
  });
}

export function useResumeWarming() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => emailWarmingAPI.resume(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.warmingConfig });
      queryClient.invalidateQueries({ queryKey: queryKeys.warmingProgress });
    },
  });
}

// ============================================
// Rate Limiting Hooks
// ============================================

export function useRateLimitPresets() {
  return useQuery({
    queryKey: queryKeys.rateLimitPresets,
    queryFn: () => rateLimitingAPI.getPresets().then((res) => res.data.presets),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useRateLimitConfig() {
  return useQuery({
    queryKey: queryKeys.rateLimitConfig,
    queryFn: () => rateLimitingAPI.getConfig().then((res) => res.data),
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useRateLimitUsage() {
  return useQuery({
    queryKey: queryKeys.rateLimitUsage,
    queryFn: () => rateLimitingAPI.getUsageStats().then((res) => res.data.stats),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

export function useCanSendEmail() {
  return useQuery({
    queryKey: queryKeys.rateLimitCheck,
    queryFn: () => rateLimitingAPI.checkCanSend().then((res) => res.data),
    staleTime: 10 * 1000, // 10 seconds
  });
}

export function useCreateRateLimitConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { preset: string; daily_limit?: number; hourly_limit?: number }) =>
      rateLimitingAPI.createConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rateLimitConfig });
      queryClient.invalidateQueries({ queryKey: queryKeys.rateLimitUsage });
    },
  });
}

export function useUpdateRateLimitConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      preset?: string;
      daily_limit?: number;
      hourly_limit?: number;
      weekly_limit?: number;
      monthly_limit?: number;
      enabled?: boolean;
    }) => rateLimitingAPI.updateConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rateLimitConfig });
      queryClient.invalidateQueries({ queryKey: queryKeys.rateLimitUsage });
    },
  });
}

// ============================================
// Notifications Hooks
// ============================================

export function useNotifications(params?: {
  include_read?: boolean;
  include_archived?: boolean;
  limit?: number;
}) {
  return useQuery({
    queryKey: [...queryKeys.notifications, params],
    queryFn: () => notificationsAPI.getAll(params).then((res) => res.data),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: queryKeys.unreadCount,
    queryFn: () => notificationsAPI.getUnreadCount().then((res) => res.data.unread_count),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
}

export function useNotificationStats() {
  return useQuery({
    queryKey: queryKeys.notificationStats,
    queryFn: () => notificationsAPI.getStats().then((res) => res.data),
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => notificationsAPI.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount });
      queryClient.invalidateQueries({ queryKey: queryKeys.notificationStats });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsAPI.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount });
      queryClient.invalidateQueries({ queryKey: queryKeys.notificationStats });
    },
  });
}

export function useArchiveNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => notificationsAPI.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => notificationsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount });
      queryClient.invalidateQueries({ queryKey: queryKeys.notificationStats });
    },
  });
}

// ============================================
// Dashboard Hooks
// ============================================

export function useDashboardStats(candidateId?: number) {
  return useQuery({
    queryKey: [...queryKeys.dashboard, "stats", candidateId],
    queryFn: () => dashboardAPI.getStats(candidateId).then((res) => res.data),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

// ============================================
// Prefetching Utilities
// ============================================

export function usePrefetchApplications() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.applications,
      queryFn: () => applicationsAPI.getAll(),
      staleTime: 30 * 1000,
    });
  };
}

export function usePrefetchDashboard() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.applicationStats,
      queryFn: () => applicationsAPI.getStats().then((res) => res.data),
      staleTime: 60 * 1000,
    });
  };
}

// ============================================
// Cache Invalidation Utilities
// ============================================

export function useInvalidateAllQueries() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries();
  };
}

export function useInvalidateApplications() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.applications });
    queryClient.invalidateQueries({ queryKey: queryKeys.applicationStats });
  };
}
