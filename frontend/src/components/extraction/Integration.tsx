"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  UserPlus,
  FolderPlus,
  Mail,
  ArrowRight,
  Sparkles,
  Database,
  FileText,
  TrendingUp,
  Filter,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import confetti from "canvas-confetti";
import { extractionAPI, ExtractionResult, recipientGroupsAPI } from "@/lib/api";
import { toast } from "sonner";
import type { Recipient, CampaignRecipient } from "@/types";

interface IntegrationProps {
  jobId: number;
  results: ExtractionResult[];
  sector: string;
  onComplete: () => void;
  onImported?: (recipients: CampaignRecipient[]) => void;
}

interface ImportStats {
  total: number;
  toImport: number;
  duplicates: number;
  lowQuality: number;
  highQuality: number;
}

export default function Integration({
  jobId,
  results,
  sector,
  onComplete,
  onImported,
}: IntegrationProps) {
  const [groupName, setGroupName] = useState("");
  const [filterDuplicates, setFilterDuplicates] = useState(true);
  const [minQuality, setMinQuality] = useState(0.7);
  const [autoCreateGroup, setAutoCreateGroup] = useState(true);
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(false);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<ImportStats>({
    total: 0,
    toImport: 0,
    duplicates: 0,
    lowQuality: 0,
    highQuality: 0,
  });
  const [groupId, setGroupId] = useState<number | null>(null);

  // Calculate import statistics
  useEffect(() => {
    const total = results.length;
    let toImport = 0;
    let duplicates = 0;
    let lowQuality = 0;
    let highQuality = 0;

    results.forEach((result) => {
      const meetsQuality = result.quality_score >= minQuality;
      const isDuplicate = filterDuplicates && result.is_duplicate;

      if (meetsQuality && !isDuplicate) {
        toImport++;
        if (result.quality_score >= 0.8) {
          highQuality++;
        } else {
          lowQuality++;
        }
      }

      if (isDuplicate) {
        duplicates++;
      }
    });

    setStats({ total, toImport, duplicates, lowQuality, highQuality });

    // Auto-generate group name if not set
    if (!groupName) {
      const timestamp = new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      setGroupName(`${sector} Extraction - ${timestamp}`);
    }
  }, [results, minQuality, filterDuplicates, groupName, sector]);

  // Import to recipients table
  const handleImport = async () => {
    try {
      setImporting(true);
      setError("");
      setImportProgress(0);

      // Step 1: Import records using API client (60% of progress)
      const { data: importData } = await extractionAPI.importToRecipients(jobId, {
        filter_duplicates: filterDuplicates,
        min_quality: minQuality,
        create_group: autoCreateGroup,
        group_name: autoCreateGroup ? groupName : undefined,
        send_welcome_email: sendWelcomeEmail,
      });

      setImportProgress(60);
      setGroupId(importData.group_id || null);

      // Step 2: Validate imports (80% of progress)
      await new Promise((resolve) => setTimeout(resolve, 500));
      setImportProgress(80);

      // Step 3: Finalize (100% of progress)
      await new Promise((resolve) => setTimeout(resolve, 300));
      setImportProgress(100);

      setImported(true);

      toast.success(`Imported ${importData.imported_count} recipients!`, {
        description: importData.message,
      });

      // Fetch imported recipients (with IDs) and return to parent
      try {
        if (importData.group_id && onImported) {
          const { data } = await recipientGroupsAPI.getRecipients(importData.group_id, { limit: 500 });
          const recipients: CampaignRecipient[] = (data.items || (data as any).recipients || []).map((r: Recipient) => ({
            id: r.id,
            email: r.email,
            name: r.name || undefined,
            company: r.company || undefined,
            position: r.position || undefined,
            linkedinUrl: r.custom_fields?.linkedin_url,
          }));
          if (recipients.length > 0) {
            onImported(recipients);
          }
        }
      } catch (e) {
        console.error("Failed to fetch imported recipients:", e);
      }

      // Celebration
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b"],
      });

      // Auto-complete after 3 seconds
      setTimeout(() => {
        onComplete();
      }, 3000);
    } catch (err: any) {
      console.error("Import failed:", err);
      setError(err.message || "Import failed. Please try again.");
      toast.error("Import failed", { description: err.message });
    } finally {
      setImporting(false);
    }
  };

  // Export configuration for external use
  const handleExportConfig = async () => {
    const config = {
      job_id: jobId,
      sector,
      total_records: stats.total,
      filtered_records: stats.toImport,
      filters: {
        filter_duplicates: filterDuplicates,
        min_quality: minQuality,
      },
      group_name: groupName,
      exported_at: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `extraction_config_${jobId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="relative">
            <Database className="w-8 h-8 text-purple-400" />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl"
            />
          </div>
          <ArrowRight className="w-6 h-6 text-slate-400" />
          <div className="relative">
            <Users className="w-8 h-8 text-green-400" />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              className="absolute inset-0 bg-green-500/20 rounded-full blur-xl"
            />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-green-400">
          Integration & Import
        </h2>
        <p className="text-slate-400 mt-2">
          Import extracted data to your Recipients database
        </p>
      </motion.div>

      {/* Import Statistics Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {/* Total Records */}
        <Card className="p-4 bg-slate-800/50 border-slate-700 backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <Database className="w-5 h-5 text-blue-400" />
              <Badge variant="outline" className="text-xs border-blue-400/30 text-blue-400">
                Total
              </Badge>
            </div>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-xs text-slate-400">Records Extracted</div>
          </div>
        </Card>

        {/* To Import */}
        <Card className="p-4 bg-slate-800/50 border-slate-700 backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <UserPlus className="w-5 h-5 text-green-400" />
              <Badge variant="outline" className="text-xs border-green-400/30 text-green-400">
                Ready
              </Badge>
            </div>
            <div className="text-2xl font-bold text-green-400">{stats.toImport}</div>
            <div className="text-xs text-slate-400">Will Be Imported</div>
          </div>
        </Card>

        {/* Duplicates */}
        <Card className="p-4 bg-slate-800/50 border-slate-700 backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <Copy className="w-5 h-5 text-yellow-400" />
              <Badge variant="outline" className="text-xs border-yellow-400/30 text-yellow-400">
                Skip
              </Badge>
            </div>
            <div className="text-2xl font-bold text-yellow-400">{stats.duplicates}</div>
            <div className="text-xs text-slate-400">Duplicates Found</div>
          </div>
        </Card>

        {/* High Quality */}
        <Card className="p-4 bg-slate-800/50 border-slate-700 backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <Badge variant="outline" className="text-xs border-purple-400/30 text-purple-400">
                Premium
              </Badge>
            </div>
            <div className="text-2xl font-bold text-purple-400">{stats.highQuality}</div>
            <div className="text-xs text-slate-400">High Quality (≥80%)</div>
          </div>
        </Card>
      </motion.div>

      {/* Configuration Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-6 bg-slate-800/50 border-slate-700 backdrop-blur-xl">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-400" />
            Import Configuration
          </h3>

          <div className="space-y-6">
            {/* Group Name */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Recipient Group Name
              </label>
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name..."
                disabled={!autoCreateGroup || imported}
                className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
              />
              <p className="text-xs text-slate-400 mt-1">
                Records will be added to this group for easy management
              </p>
            </div>

            {/* Options */}
            <div className="space-y-4">
              {/* Auto Create Group */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/30 border border-slate-700/50">
                <div className="flex items-center gap-3">
                  <FolderPlus className="w-5 h-5 text-green-400" />
                  <div>
                    <div className="text-sm font-medium text-white">
                      Auto-Create Recipient Group
                    </div>
                    <div className="text-xs text-slate-400">
                      Automatically create a new group with imported records
                    </div>
                  </div>
                </div>
                <Switch
                  checked={autoCreateGroup}
                  onCheckedChange={setAutoCreateGroup}
                  disabled={imported}
                />
              </div>

              {/* Filter Duplicates */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/30 border border-slate-700/50">
                <div className="flex items-center gap-3">
                  <Filter className="w-5 h-5 text-yellow-400" />
                  <div>
                    <div className="text-sm font-medium text-white">
                      Filter Duplicate Records
                    </div>
                    <div className="text-xs text-slate-400">
                      Skip records already in your database ({stats.duplicates} detected)
                    </div>
                  </div>
                </div>
                <Switch
                  checked={filterDuplicates}
                  onCheckedChange={setFilterDuplicates}
                  disabled={imported}
                />
              </div>

              {/* Send Welcome Email */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/30 border border-slate-700/50">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-blue-400" />
                  <div>
                    <div className="text-sm font-medium text-white">
                      Send Welcome Email
                    </div>
                    <div className="text-xs text-slate-400">
                      Automatically send a welcome email to imported recipients
                    </div>
                  </div>
                </div>
                <Switch
                  checked={sendWelcomeEmail}
                  onCheckedChange={setSendWelcomeEmail}
                  disabled={imported}
                />
              </div>

              {/* Quality Threshold */}
              <div className="p-3 rounded-lg bg-slate-900/30 border border-slate-700/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                    <div>
                      <div className="text-sm font-medium text-white">
                        Minimum Quality Score
                      </div>
                      <div className="text-xs text-slate-400">
                        Only import records meeting this quality threshold
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-purple-400 border-purple-400/30">
                    {Math.round(minQuality * 100)}%
                  </Badge>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={minQuality * 100}
                  onChange={(e) => setMinQuality(parseFloat(e.target.value) / 100)}
                  disabled={imported}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Import Progress */}
      <AnimatePresence>
        {importing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="p-6 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/30 backdrop-blur-xl">
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="inline-block mb-4"
                >
                  <Database className="w-12 h-12 text-blue-400" />
                </motion.div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Importing Records...
                </h3>
                <div className="w-full bg-slate-700 rounded-full h-3 mb-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${importProgress}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                  />
                </div>
                <p className="text-sm text-slate-400">{importProgress}% Complete</p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success State */}
      <AnimatePresence>
        {imported && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="p-6 bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-500/30 backdrop-blur-xl">
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="inline-block mb-4"
                >
                  <CheckCircle2 className="w-16 h-16 text-green-400" />
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Successfully Imported!
                </h3>
                <p className="text-slate-300 mb-4">
                  {stats.toImport} recipients have been added to your database
                </p>
                {groupId && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    Group ID: {groupId}
                  </Badge>
                )}
                <div className="mt-6 flex items-center justify-center gap-3">
                  <Button
                    onClick={() => (window.location.href = "/recipients")}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    View Recipients
                  </Button>
                  {groupId && (
                    <Button
                      variant="outline"
                      onClick={() =>
                        (window.location.href = `/groups/${groupId}`)
                      }
                      className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                    >
                      <FolderPlus className="w-4 h-4 mr-2" />
                      View Group
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="p-4 bg-red-900/20 border-red-500/30 backdrop-blur-xl">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-red-400 mb-1">
                    Import Failed
                  </h4>
                  <p className="text-sm text-red-300">{error}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setError("")}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  Dismiss
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      {!imported && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between gap-4"
        >
          <Button
            variant="outline"
            onClick={handleExportConfig}
            disabled={importing}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <FileText className="w-4 h-4 mr-2" />
            Export Config
          </Button>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              disabled={importing}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Back to Review
            </Button>
            <Button
              onClick={handleImport}
              disabled={importing || stats.toImport === 0}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold px-8 relative overflow-hidden group"
            >
              <motion.div
                animate={{ x: [0, 100, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              />
              <UserPlus className="w-4 h-4 mr-2 relative z-10" />
              <span className="relative z-10">
                {importing
                  ? "Importing..."
                  : `Import ${stats.toImport} Recipients`}
              </span>
            </Button>
          </div>
        </motion.div>
      )}

      {/* Info Banner */}
      {!imported && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-4 bg-blue-900/10 border-blue-500/20 backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-sm text-slate-300">
                <strong className="text-blue-400">Import Note:</strong> All
                imported records will preserve extraction metadata (source URL,
                quality scores, confidence levels) in the custom_fields JSON
                column for future reference. You can manage these recipients
                from the Recipients page or create email campaigns using the
                created group.
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
