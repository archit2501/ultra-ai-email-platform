"use client";

/**
 * CONSOLIDATED OUTREACH PAGE
 * Combines Recipients + Recipient Groups:
 * - Tab 1: Recipients List Management (full page from /recipients)
 * - Tab 2: Recipient Groups (full page from /recipient-groups)
 * 
 * NOTE: For now, this embeds the original full pages.
 * In Phase 2, we can refactor these into proper tab components.
 */

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserCircle2,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";

// ========== LAZY LOAD FULL PAGE COMPONENTS ==========
const RecipientsPage = dynamic(
  () => import("@/app/(dashboard)/recipients/page"),
  { loading: () => <div className="p-8 text-center text-gray-400">Loading recipients...</div> }
);

const RecipientGroupsPage = dynamic(
  () => import("@/app/(dashboard)/recipient-groups/page"),
  { loading: () => <div className="p-8 text-center text-gray-400">Loading groups...</div> }
);

export default function ConsolidatedOutreachPage() {
  const [activeTab, setActiveTab] = useState("recipients");

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 pb-0"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Outreach</h1>
            <p className="text-gray-400 flex items-center gap-2 mt-1">
              Manage recipients, groups, and ULTRA AI emails
              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                <Sparkles className="w-3 h-3 mr-1" />
                ULTRA AI
              </Badge>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tabs Container */}
      <div className="px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-slate-900 border border-slate-800">
            <TabsTrigger value="recipients" className="flex items-center gap-2">
              <UserCircle2 className="w-4 h-4" />
              Recipients
            </TabsTrigger>

            <TabsTrigger value="groups" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Groups
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Recipients (Full Page) */}
          <TabsContent value="recipients" className="mt-0">
            <RecipientsPage />
          </TabsContent>

          {/* Tab 2: Recipient Groups (Full Page) */}
          <TabsContent value="groups" className="mt-0">
            <RecipientGroupsPage />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
