"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Search,
  Filter,
  Star,
  Mail,
  TrendingUp,
  CheckCircle2,
  Copy,
  ExternalLink,
  Sparkles,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CompactFreshnessIndicator } from "./CacheFreshnessIndicator";
import { CompactRegenerateButton } from "./RegenerateButton";
import {
  getAllEmailHistory,
  toggleEmailFavorite,
  getEmailStatistics,
  calculateAgeText,
  type EmailHistory,
  type EmailVariation,
} from "./utils/emailCache";

interface EmailLibraryDrawerProps {
  open: boolean;
  onClose: () => void;
  recipientId: number;
  recipientName: string;
  onSelectEmail: (email: EmailVariation, batchId: string) => void;
  onGenerateNew: () => Promise<void>;
}

/**
 * EmailLibraryDrawer - God-Tier Email History System
 * Side drawer showing all generated emails with search, filter, and favorites
 */
export function EmailLibraryDrawer({
  open,
  onClose,
  recipientId,
  recipientName,
  onSelectEmail,
  onGenerateNew,
}: EmailLibraryDrawerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTone, setSelectedTone] = useState<string>("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);

  // Load email history
  const emailHistory = useMemo(() => {
    return getAllEmailHistory(recipientId);
  }, [recipientId, open]); // Reload when drawer opens

  // Get statistics
  const stats = useMemo(() => {
    return getEmailStatistics(recipientId);
  }, [recipientId, open]);

  // Available tones
  const tones = useMemo(() => {
    const toneSet = new Set<string>();
    emailHistory.forEach((batch) => {
      batch.emails.forEach((email) => {
        toneSet.add(email.tone);
      });
    });
    return Array.from(toneSet);
  }, [emailHistory]);

  // Filter emails
  const filteredHistory = useMemo(() => {
    return emailHistory
      .map((batch) => ({
        ...batch,
        emails: batch.emails.filter((email) => {
          // Search filter
          const matchesSearch =
            searchQuery === "" ||
            email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            email.body.toLowerCase().includes(searchQuery.toLowerCase());

          // Tone filter
          const matchesTone =
            selectedTone === "all" || email.tone === selectedTone;

          // Favorites filter
          const matchesFavorites = !showFavoritesOnly || email.favorite;

          return matchesSearch && matchesTone && matchesFavorites;
        }),
      }))
      .filter((batch) => batch.emails.length > 0);
  }, [emailHistory, searchQuery, selectedTone, showFavoritesOnly]);

  // Toggle favorite
  const handleToggleFavorite = (batchId: string, emailId: string) => {
    toggleEmailFavorite(recipientId, batchId, emailId);
    // Force re-render by updating a state
    setSelectedBatch(null);
    setTimeout(() => setSelectedBatch(batchId), 0);
  };

  // Get tone color
  const getToneColor = (tone: string) => {
    const colors: Record<string, string> = {
      professional: "from-blue-500 to-cyan-500",
      enthusiastic: "from-green-500 to-emerald-500",
      "story-driven": "from-purple-500 to-pink-500",
      "value-first": "from-orange-500 to-amber-500",
      consultant: "from-indigo-500 to-violet-500",
    };
    return colors[tone.toLowerCase()] || "from-slate-500 to-slate-600";
  };

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-400 border-green-500/30";
    if (score >= 70) return "text-yellow-400 border-yellow-500/30";
    return "text-orange-400 border-orange-500/30";
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-3xl bg-slate-900 border-l border-slate-700 shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-slate-700 bg-gradient-to-r from-slate-800 to-slate-900">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-100 mb-1">
                    📚 Email Library
                  </h2>
                  <p className="text-sm text-slate-400">{recipientName}</p>
                </div>

                <Button
                  onClick={onClose}
                  variant="ghost"
                  size="sm"
                  className="hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-4 gap-3">
                <StatCard
                  label="Batches"
                  value={stats.totalBatches}
                  icon={<Mail className="w-4 h-4" />}
                  color="blue"
                />
                <StatCard
                  label="Emails"
                  value={stats.totalEmails}
                  icon={<Sparkles className="w-4 h-4" />}
                  color="cyan"
                />
                <StatCard
                  label="Favorites"
                  value={stats.totalFavorites}
                  icon={<Star className="w-4 h-4" />}
                  color="yellow"
                />
                <StatCard
                  label="Used"
                  value={stats.totalUsed}
                  icon={<CheckCircle2 className="w-4 h-4" />}
                  color="green"
                />
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-slate-700 bg-slate-800/50 space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search emails..."
                  className="pl-10 bg-slate-900 border-slate-700"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-4 h-4 text-slate-500" />

                {/* Tone Filter */}
                <select
                  value={selectedTone}
                  onChange={(e) => setSelectedTone(e.target.value)}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-300 hover:border-cyan-500 transition-colors"
                >
                  <option value="all">All Tones</option>
                  {tones.map((tone) => (
                    <option key={tone} value={tone}>
                      {tone.charAt(0).toUpperCase() + tone.slice(1)}
                    </option>
                  ))}
                </select>

                {/* Favorites Toggle */}
                <Button
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  variant={showFavoritesOnly ? "default" : "outline"}
                  size="sm"
                  className={`gap-2 ${
                    showFavoritesOnly
                      ? "bg-gradient-to-r from-yellow-600 to-amber-600"
                      : "border-slate-700"
                  }`}
                >
                  <Star className="w-4 h-4" />
                  Favorites Only
                </Button>

                {/* Generate New Button */}
                <div className="ml-auto">
                  <CompactRegenerateButton
                    onRegenerate={onGenerateNew}
                    type="email"
                  />
                </div>
              </div>
            </div>

            {/* Email List */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {filteredHistory.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-16"
                >
                  <Mail className="w-16 h-16 text-slate-600 mb-4" />
                  <p className="text-slate-400 text-center">
                    {searchQuery || selectedTone !== "all" || showFavoritesOnly
                      ? "No emails match your filters"
                      : "No emails generated yet"}
                  </p>
                </motion.div>
              ) : (
                filteredHistory.map((batch, batchIndex) => (
                  <motion.div
                    key={batch.batchId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: batchIndex * 0.05 }}
                  >
                    {/* Batch Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-slate-400">
                        {calculateAgeText(batch.generatedAt)}
                      </span>
                      <CompactFreshnessIndicator
                        timestamp={batch.generatedAt}
                        type="email"
                      />
                      <span className="text-xs text-slate-600">
                        {batch.emails.length} variations
                      </span>
                    </div>

                    {/* Email Cards */}
                    <div className="grid gap-3">
                      {batch.emails.map((email, emailIndex) => (
                        <EmailCard
                          key={email.id}
                          email={email}
                          batchId={batch.batchId}
                          index={emailIndex}
                          onSelect={() => onSelectEmail(email, batch.batchId)}
                          onToggleFavorite={() =>
                            handleToggleFavorite(batch.batchId, email.id)
                          }
                          getToneColor={getToneColor}
                          getScoreColor={getScoreColor}
                        />
                      ))}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// StatCard Component
function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: "blue" | "cyan" | "yellow" | "green";
}) {
  const colors = {
    blue: "from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-400",
    cyan: "from-cyan-500/20 to-cyan-600/20 border-cyan-500/30 text-cyan-400",
    yellow:
      "from-yellow-500/20 to-yellow-600/20 border-yellow-500/30 text-yellow-400",
    green:
      "from-green-500/20 to-green-600/20 border-green-500/30 text-green-400",
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -2 }}
      className={`px-3 py-2 rounded-lg border bg-gradient-to-br backdrop-blur-sm ${colors[color]}`}
    >
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <div className="text-xl font-bold">{value}</div>
    </motion.div>
  );
}

// EmailCard Component
function EmailCard({
  email,
  batchId,
  index,
  onSelect,
  onToggleFavorite,
  getToneColor,
  getScoreColor,
}: {
  email: EmailVariation;
  batchId: string;
  index: number;
  onSelect: () => void;
  onToggleFavorite: () => void;
  getToneColor: (tone: string) => string;
  getScoreColor: (score: number) => string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(
      `Subject: ${email.subject}\n\n${email.body}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.01, y: -2 }}
      className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-xl p-4 hover:border-cyan-500/30 transition-all duration-300 group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Tone Badge */}
          <div
            className={`px-3 py-1 rounded-lg bg-gradient-to-r ${getToneColor(
              email.tone
            )} text-white text-sm font-medium`}
          >
            {email.tone.charAt(0).toUpperCase() + email.tone.slice(1)}
          </div>

          {/* Score Badge */}
          <div
            className={`px-2 py-1 rounded-lg border bg-slate-900/50 text-xs font-medium ${getScoreColor(
              email.personalizationScore
            )}`}
          >
            {email.personalizationScore}/100
          </div>

          {/* Used Badge */}
          {email.used && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-2 py-1 rounded-lg border border-green-500/30 bg-green-500/10 text-xs text-green-400"
            >
              <CheckCircle2 className="w-3 h-3 inline mr-1" />
              Used
            </motion.div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button
            onClick={onToggleFavorite}
            variant="ghost"
            size="sm"
            className={`h-8 w-8 p-0 ${
              email.favorite ? "text-yellow-400" : "text-slate-500"
            } hover:text-yellow-400`}
          >
            <Star
              className="w-4 h-4"
              fill={email.favorite ? "currentColor" : "none"}
            />
          </Button>

          <Button
            onClick={handleCopy}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-slate-500 hover:text-cyan-400"
          >
            {copied ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Subject */}
      <h4 className="text-slate-200 font-semibold mb-2">{email.subject}</h4>

      {/* Body Preview */}
      <p className="text-sm text-slate-400 line-clamp-3 mb-3">{email.body}</p>

      {/* Matched Skills */}
      {email.matchedSkills.length > 0 && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-xs text-slate-500">Matched:</span>
          {email.matchedSkills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs text-slate-400"
            >
              {skill}
            </span>
          ))}
          {email.matchedSkills.length > 3 && (
            <span className="text-xs text-slate-500">
              +{email.matchedSkills.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {email.estimatedResponseRate} response
          </span>
          {email.usedAt && (
            <span className="text-green-500">
              Sent {calculateAgeText(email.usedAt)}
            </span>
          )}
        </div>

        <Button
          onClick={onSelect}
          size="sm"
          className="gap-2 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          Use This
          <ExternalLink className="w-3 h-3" />
        </Button>
      </div>
    </motion.div>
  );
}
