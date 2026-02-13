"use client";

/**
 * CONSOLIDATED INSIGHTS PAGE
 * Combines Analytics + Template Analytics + Notifications + Email Warmup:
 * - Tab 1: Application Analytics (from /analytics)
 * - Tab 2: Template Performance (from /template-analytics)
 * - Tab 3: Email Warmup (NEW - Smartlead/Instantly competitor)
 * - Tab 4: Notifications (from /notifications)
 *
 * NOTE: For now, this embeds the original full pages.
 * In Phase 2, we can refactor these into proper tab components.
 */

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Mail,
  Bell,
  BarChart3,
  Shield,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";

// ========== LAZY LOAD FULL PAGE COMPONENTS ==========
const AnalyticsPage = dynamic(
  () => import("@/app/(dashboard)/analytics/page"),
  { loading: () => <div className="p-8 text-center text-gray-400">Loading analytics...</div> }
);

const TemplateAnalyticsPage = dynamic(
  () => import("@/app/(dashboard)/template-analytics/page"),
  { loading: () => <div className="p-8 text-center text-gray-400">Loading template analytics...</div> }
);

const NotificationsPage = dynamic(
  () => import("@/app/(dashboard)/notifications/page"),
  { loading: () => <div className="p-8 text-center text-gray-400">Loading notifications...</div> }
);

// Email Warmup Dashboard - Advanced Sender Reputation Building
const WarmupDashboard = dynamic(
  () => import("@/components/warmup/WarmupDashboard"),
  { loading: () => <div className="p-8 text-center text-gray-400">Loading warmup dashboard...</div> }
);

export default function ConsolidatedInsightsPage() {
  const [activeTab, setActiveTab] = useState("analytics");

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 pb-0"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-gradient-to-br from-orange-600 to-red-600 rounded-lg">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Insights</h1>
            <p className="text-gray-400 flex items-center gap-2 mt-1">
              Analytics, metrics, and performance tracking
              <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30">
                <BarChart3 className="w-3 h-3 mr-1" />
                Analytics
              </Badge>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tabs Container */}
      <div className="px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-slate-900 border border-slate-800">
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Applications
            </TabsTrigger>

            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Templates
            </TabsTrigger>

            <TabsTrigger value="warmup" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Email Warmup
              <Badge className="ml-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[10px] px-1.5 py-0">
                <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                PRO
              </Badge>
            </TabsTrigger>

            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Application Analytics */}
          <TabsContent value="analytics" className="mt-0">
            <AnalyticsPage />
          </TabsContent>

          {/* Tab 2: Template Performance */}
          <TabsContent value="templates" className="mt-0">
            <TemplateAnalyticsPage />
          </TabsContent>

          {/* Tab 3: Email Warmup - Advanced Sender Reputation Building */}
          <TabsContent value="warmup" className="mt-6">
            <WarmupDashboard />
          </TabsContent>

          {/* Tab 4: Notifications */}
          <TabsContent value="notifications" className="mt-0">
            <NotificationsPage />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
