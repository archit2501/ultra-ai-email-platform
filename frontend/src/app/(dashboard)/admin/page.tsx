"use client";

/**
 * CONSOLIDATED ADMIN PAGE
 * Super Admin Only - Consolidates Users + Settings + Email Controls:
 * - Tab 1: User Management (from /users)
 * - Tab 2: Account Settings (from /settings)
 * - Tab 3: Email Controls (from /email-controls)
 * 
 * NOTE: For now, this embeds the original full pages.
 * In Phase 2, we can refactor these into proper tab components.
 */

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Settings,
  Zap,
  AlertCircle,
  Shield,
} from "lucide-react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";

// ========== LAZY LOAD FULL PAGE COMPONENTS ==========
const UsersPage = dynamic(
  () => import("@/app/(dashboard)/users/page"),
  { loading: () => <div className="p-8 text-center text-gray-400">Loading users...</div> }
);

const SettingsPage = dynamic(
  () => import("@/app/(dashboard)/settings/page"),
  { loading: () => <div className="p-8 text-center text-gray-400">Loading settings...</div> }
);

const EmailControlsPage = dynamic(
  () => import("@/app/(dashboard)/email-controls/page"),
  { loading: () => <div className="p-8 text-center text-gray-400">Loading email controls...</div> }
);

export default function ConsolidatedAdminPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("users");

  // Super Admin guard
  useEffect(() => {
    if (!user || user.role !== "super_admin") {
      router.push("/dashboard");
    }
  }, [user, router]);

  if (!user || user.role !== "super_admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 pb-0"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-gray-400 flex items-center gap-2 mt-1">
              System administration and configuration
              <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
                <AlertCircle className="w-3 h-3 mr-1" />
                Super Admin Only
              </Badge>
            </p>
          </div>
        </div>

        {/* Warning Alert */}
        <div
          className="mb-6 flex items-start gap-3 rounded-lg border border-red-800 bg-red-950/50 p-4"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 text-red-400 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-red-200">Admin Warning</p>
            <p className="text-sm text-red-300">
              You are in the admin panel. Changes here affect all users.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tabs Container */}
      <div className="px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-slate-900 border border-slate-800">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>

            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>

            <TabsTrigger value="email-controls" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Email Controls
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: User Management */}
          <TabsContent value="users" className="mt-0">
            <UsersPage />
          </TabsContent>

          {/* Tab 2: Account Settings */}
          <TabsContent value="settings" className="mt-0">
            <SettingsPage />
          </TabsContent>

          {/* Tab 3: Email Controls (Warmup + Rate Limiting) */}
          <TabsContent value="email-controls" className="mt-0">
            <EmailControlsPage />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
