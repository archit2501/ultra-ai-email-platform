"use client";

/**
 * CONSOLIDATED RESOURCES PAGE
 * Combines Documents + Templates:
 * - Tab 1: Documents (Resumes + Info Docs from /documents)
 * - Tab 2: Email Templates (from /templates)
 * 
 * NOTE: For now, this embeds the original full pages.
 * In Phase 2, we can refactor these into proper tab components.
 */

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Mail,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";

// ========== LAZY LOAD FULL PAGE COMPONENTS ==========
const DocumentsPage = dynamic(
  () => import("@/app/(dashboard)/documents/page"),
  { loading: () => <div className="p-8 text-center text-gray-400">Loading documents...</div> }
);

const TemplatesPage = dynamic(
  () => import("@/app/(dashboard)/templates/page"),
  { loading: () => <div className="p-8 text-center text-gray-400">Loading templates...</div> }
);

export default function ConsolidatedResourcesPage() {
  const [activeTab, setActiveTab] = useState("documents");

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 pb-0"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-lg">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Resources</h1>
            <p className="text-gray-400 flex items-center gap-2 mt-1">
              Manage resumes, documents, and email templates
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Powered
              </Badge>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tabs Container */}
      <div className="px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-slate-900 border border-slate-800">
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Documents
            </TabsTrigger>

            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Templates
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Documents (Resumes + Info Docs) */}
          <TabsContent value="documents" className="mt-0">
            <DocumentsPage />
          </TabsContent>

          {/* Tab 2: Email Templates */}
          <TabsContent value="templates" className="mt-0">
            <TemplatesPage />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
