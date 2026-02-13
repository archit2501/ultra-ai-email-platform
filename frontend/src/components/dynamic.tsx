"use client";

/**
 * Dynamic Component Imports
 *
 * Code splitting with Next.js dynamic imports for better initial load performance.
 * Heavy components are lazy-loaded only when needed, reducing bundle size.
 */

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton-loader";

// ============================================
// Loading Skeletons
// ============================================

function ChartSkeleton() {
  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-[300px] w-full rounded-lg" />
    </div>
  );
}

function EditorSkeleton() {
  return (
    <div className="w-full space-y-2">
      <div className="flex gap-2 border-b pb-2">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-8" />
        ))}
      </div>
      <Skeleton className="h-[200px] w-full rounded-lg" />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="w-full space-y-2">
      <div className="flex gap-4 border-b pb-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4 py-3">
          {[...Array(5)].map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-20 w-full" />
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="w-full space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      ))}
      <Skeleton className="h-10 w-full rounded-md" />
    </div>
  );
}

function ModalSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex justify-end gap-2 pt-4">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

// ============================================
// Dynamic Chart Components (recharts)
// ============================================

export const DynamicAreaChart = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.AreaChart })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

export const DynamicLineChart = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.LineChart })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

export const DynamicBarChart = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.BarChart })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

export const DynamicPieChart = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.PieChart })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

export const DynamicComposedChart = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.ComposedChart })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

// ============================================
// Dynamic Virtual List Component
// ============================================

export const DynamicVirtualApplicationList = dynamic(
  () => import("@/components/applications/virtual-application-list"),
  {
    loading: () => (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    ),
    ssr: false,
  }
);

export const DynamicVirtualList = dynamic(
  () => import("@/components/ui/virtual-list"),
  {
    loading: () => (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    ),
    ssr: false,
  }
);

// ============================================
// Placeholder Components for Future Use
// ============================================

// These dynamic imports are ready to be used when the corresponding
// components are created. For now, they export placeholder functions.

/**
 * Creates a lazy-loaded component with fallback for missing modules.
 * Use this pattern when adding new dynamic imports:
 *
 * export const DynamicMyComponent = createDynamicImport(
 *   () => import("@/components/path/my-component"),
 *   EditorSkeleton
 * );
 */

// ============================================
// Future Dynamic Components (Ready for Implementation)
// ============================================

// Email Composer - To be implemented
// export const DynamicEmailComposer = dynamic(
//   () => import("@/components/email/email-composer"),
//   { loading: () => <EditorSkeleton />, ssr: false }
// );

// Template Editor - To be implemented
// export const DynamicTemplateEditor = dynamic(
//   () => import("@/components/templates/template-editor"),
//   { loading: () => <EditorSkeleton />, ssr: false }
// );

// Application Modal - To be implemented
// export const DynamicApplicationModal = dynamic(
//   () => import("@/components/applications/application-modal"),
//   { loading: () => <ModalSkeleton />, ssr: false }
// );

// Company Modal - To be implemented
// export const DynamicCompanyModal = dynamic(
//   () => import("@/components/companies/company-modal"),
//   { loading: () => <ModalSkeleton />, ssr: false }
// );

// Analytics Dashboard - To be implemented
// export const DynamicAnalyticsDashboard = dynamic(
//   () => import("@/components/analytics/analytics-dashboard"),
//   { loading: () => <ChartSkeleton />, ssr: false }
// );

// Warming Settings - To be implemented
// export const DynamicWarmingSettings = dynamic(
//   () => import("@/components/settings/warming-settings"),
//   { loading: () => <FormSkeleton />, ssr: false }
// );

// Rate Limit Settings - To be implemented
// export const DynamicRateLimitSettings = dynamic(
//   () => import("@/components/settings/rate-limit-settings"),
//   { loading: () => <FormSkeleton />, ssr: false }
// );

// Data Table - To be implemented
// export const DynamicDataTable = dynamic(
//   () => import("@/components/ui/data-table"),
//   { loading: () => <TableSkeleton />, ssr: false }
// );

// ============================================
// Export Loading Components for reuse
// ============================================

export const LoadingSkeletons = {
  Chart: ChartSkeleton,
  Editor: EditorSkeleton,
  Table: TableSkeleton,
  Card: CardSkeleton,
  Form: FormSkeleton,
  Modal: ModalSkeleton,
};
