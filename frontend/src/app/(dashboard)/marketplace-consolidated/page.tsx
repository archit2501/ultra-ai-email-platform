"use client";

/**
 * CONSOLIDATED MARKETPLACE PAGE
 * Combines all tools and intelligence:
 * - Tab 1: Template Marketplace (from /marketplace)
 * - Tab 2: Company Intelligence (from /company-intelligence)
 * - Tab 3: Extraction Tools
 *   - ULTRA Extraction Engine (from /extraction)
 *   - MobiAdz Extraction (from /mobiadz-extraction)
 * 
 * NOTE: For now, this embeds the original full pages.
 * In Phase 2, we can refactor these into proper tab components.
 */

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Store,
  Brain,
  Sparkles,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";

// ========== LAZY LOAD FULL PAGE COMPONENTS ==========
const MarketplacePage = dynamic(
  () => import("@/app/(dashboard)/marketplace/page"),
  { loading: () => <div className="p-8 text-center text-gray-400">Loading marketplace...</div> }
);

const CompanyIntelligencePage = dynamic(
  () => import("@/app/(dashboard)/company-intelligence/page"),
  { loading: () => <div className="p-8 text-center text-gray-400">Loading intelligence...</div> }
);

const ExtractionPage = dynamic(
  () => import("@/app/(dashboard)/extraction/page"),
  { loading: () => <div className="p-8 text-center text-gray-400">Loading ULTRA extraction...</div> }
);

const MobiAdzExtractionPage = dynamic(
  () => import("@/app/(dashboard)/mobiadz-extraction/page"),
  { loading: () => <div className="p-8 text-center text-gray-400">Loading MobiAdz extraction...</div> }
);

export default function ConsolidatedMarketplacePage() {
  const [activeTab, setActiveTab] = useState("templates");
  const [extractionTab, setExtractionTab] = useState("ultra");

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 pb-0"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Marketplace & Tools</h1>
            <p className="text-gray-400 flex items-center gap-2 mt-1">
              Templates, intelligence, and extraction engines
              <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                <Sparkles className="w-3 h-3 mr-1" />
                ULTRA AI
              </Badge>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main Tabs */}
      <div className="px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-slate-900 border border-slate-800">
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Store className="w-4 h-4" />
              Templates
            </TabsTrigger>

            <TabsTrigger value="intelligence" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Intelligence
            </TabsTrigger>

            <TabsTrigger value="extraction" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Extraction
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Template Marketplace */}
          <TabsContent value="templates" className="mt-0">
            <MarketplacePage />
          </TabsContent>

          {/* Tab 2: Company Intelligence */}
          <TabsContent value="intelligence" className="mt-0">
            <CompanyIntelligencePage />
          </TabsContent>

          {/* Tab 3: Extraction Tools (ULTRA + MobiAdz) */}
          <TabsContent value="extraction" className="mt-0">
            <Card className="bg-slate-900 border-slate-800 p-6">
              <Tabs value={extractionTab} onValueChange={setExtractionTab}>
                <TabsList className="bg-slate-800 border border-slate-700 mb-6">
                  <TabsTrigger value="ultra" className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    ULTRA Engine
                  </TabsTrigger>

                  <TabsTrigger value="mobiadz" className="flex items-center gap-2">
                    <Store className="w-4 h-4" />
                    MobiAdz Engine
                  </TabsTrigger>
                </TabsList>

                {/* ULTRA Extraction Engine (698 lines preserved) */}
                <TabsContent value="ultra" className="mt-0">
                  <ExtractionPage />
                </TabsContent>

                {/* MobiAdz Extraction Engine (2657 lines preserved) */}
                <TabsContent value="mobiadz" className="mt-0">
                  <MobiAdzExtractionPage />
                </TabsContent>
              </Tabs>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
