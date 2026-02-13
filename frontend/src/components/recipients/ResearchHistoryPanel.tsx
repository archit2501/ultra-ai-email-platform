"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Code2,
  Heart,
  Briefcase,
  Newspaper,
  TrendingUp,
  History,
  Download,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { CacheFreshnessIndicator } from "./CacheFreshnessIndicator";
import { RegenerateButton } from "./RegenerateButton";
import { Button } from "@/components/ui/button";
import type { ResearchHistory, CompanyIntelligence } from "./utils/researchCache";

interface ResearchHistoryPanelProps {
  cachedResearch: ResearchHistory | null;
  onRegenerate: () => Promise<void>;
  onViewHistory?: () => void;
  onExport?: (format: "md" | "pdf" | "json") => void;
  loading?: boolean;
}

/**
 * ResearchHistoryPanel - God-Tier Company Research Display
 * Shows cached research with freshness indicators and regeneration options
 */
export function ResearchHistoryPanel({
  cachedResearch,
  onRegenerate,
  onViewHistory,
  onExport,
  loading = false,
}: ResearchHistoryPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["techStack", "culture"])
  );

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  // No cached research state
  if (!cachedResearch) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 px-6"
      >
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 4,
            ease: "easeInOut",
          }}
        >
          <Building2 className="w-20 h-20 text-slate-600 mb-4" />
        </motion.div>

        <h3 className="text-xl font-bold text-slate-300 mb-2">
          No Research Found
        </h3>
        <p className="text-sm text-slate-500 text-center mb-6 max-w-md">
          Company research hasn't been generated yet. Click the button below to start researching this company.
        </p>

        <RegenerateButton
          onRegenerate={onRegenerate}
          loading={loading}
          type="research"
          confirmationRequired={false}
        />
      </motion.div>
    );
  }

  const { research, generatedAt, version, companyName } = cachedResearch;

  // Calculate confidence color
  const getConfidenceColor = (score: number) => {
    if (score >= 80) return "text-green-400 bg-green-500/20 border-green-500/30";
    if (score >= 60) return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
    return "text-orange-400 bg-orange-500/20 border-orange-500/30";
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header with Actions */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4"
      >
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-6 h-6 text-cyan-400" />
            <h2 className="text-2xl font-bold text-slate-100">
              {companyName}
            </h2>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <CacheFreshnessIndicator
              timestamp={generatedAt}
              type="research"
              size="md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`px-3 py-1.5 rounded-full border text-sm font-medium ${getConfidenceColor(
                research.confidenceScore
              )}`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5" />
              {research.confidenceScore}% Confidence
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="px-3 py-1.5 rounded-full border border-slate-700 bg-slate-800/50 text-sm text-slate-400"
            >
              Version {version}
            </motion.div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onViewHistory && (
            <Button
              onClick={onViewHistory}
              variant="outline"
              size="sm"
              className="gap-2 border-slate-700 hover:bg-slate-800"
            >
              <History className="w-4 h-4" />
              History
            </Button>
          )}

          <RegenerateButton
            onRegenerate={onRegenerate}
            loading={loading}
            lastGenerated={generatedAt}
            type="research"
            variant="compact"
          />
        </div>
      </motion.div>

      {/* Tech Stack Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6"
      >
        <button
          onClick={() => toggleSection("techStack")}
          className="w-full flex items-center justify-between mb-4 group"
        >
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-slate-200">
              Tech Stack
            </h3>
            <span className="text-sm text-slate-500">
              ({research.techStack.length} technologies)
            </span>
          </div>
          <motion.div
            animate={{ rotate: expandedSections.has("techStack") ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="text-slate-400 group-hover:text-cyan-400"
          >
            ▼
          </motion.div>
        </button>

        <AnimatePresence>
          {expandedSections.has("techStack") && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-2"
            >
              {research.techStack.map((tech, index) => (
                <motion.div
                  key={tech}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="px-3 py-1.5 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-lg text-sm text-blue-300 font-medium shadow-lg shadow-blue-500/10"
                >
                  {tech}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Culture Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6"
      >
        <button
          onClick={() => toggleSection("culture")}
          className="w-full flex items-center justify-between mb-4 group"
        >
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-400" />
            <h3 className="text-lg font-semibold text-slate-200">
              Company Culture
            </h3>
          </div>
          <motion.div
            animate={{ rotate: expandedSections.has("culture") ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="text-slate-400 group-hover:text-cyan-400"
          >
            ▼
          </motion.div>
        </button>

        <AnimatePresence>
          {expandedSections.has("culture") && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <p className="text-slate-400 leading-relaxed">
                {research.culture}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Recent Projects Section */}
      {research.recentProjects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6"
        >
          <button
            onClick={() => toggleSection("projects")}
            className="w-full flex items-center justify-between mb-4 group"
          >
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-slate-200">
                Recent Projects
              </h3>
              <span className="text-sm text-slate-500">
                ({research.recentProjects.length})
              </span>
            </div>
            <motion.div
              animate={{ rotate: expandedSections.has("projects") ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="text-slate-400 group-hover:text-cyan-400"
            >
              ▼
            </motion.div>
          </button>

          <AnimatePresence>
            {expandedSections.has("projects") && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                {research.recentProjects.map((project, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-2 text-slate-400"
                  >
                    <Sparkles className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span>{project}</span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* News Section */}
      {research.newsItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6"
        >
          <button
            onClick={() => toggleSection("news")}
            className="w-full flex items-center justify-between mb-4 group"
          >
            <div className="flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-orange-400" />
              <h3 className="text-lg font-semibold text-slate-200">
                Recent News
              </h3>
              <span className="text-sm text-slate-500">
                ({research.newsItems.length})
              </span>
            </div>
            <motion.div
              animate={{ rotate: expandedSections.has("news") ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="text-slate-400 group-hover:text-cyan-400"
            >
              ▼
            </motion.div>
          </button>

          <AnimatePresence>
            {expandedSections.has("news") && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                {research.newsItems.map((news, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-2 text-slate-400"
                  >
                    <TrendingUp className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                    <span>{news}</span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Footer Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-between px-4 py-3 bg-slate-800/30 border border-slate-700/50 rounded-lg text-sm text-slate-500"
      >
        <span>
          Scraped {research.scrapedPages} pages • Generated {new Date(generatedAt).toLocaleDateString()}
        </span>

        {onExport && (
          <div className="flex items-center gap-2">
            <span>Export:</span>
            <Button
              onClick={() => onExport("md")}
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs hover:text-cyan-400"
            >
              MD
            </Button>
            <Button
              onClick={() => onExport("json")}
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs hover:text-cyan-400"
            >
              JSON
            </Button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
