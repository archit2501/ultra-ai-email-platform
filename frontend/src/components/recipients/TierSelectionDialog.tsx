"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Star, Zap, X, Lock } from "lucide-react";

interface TierSelectionDialogProps {
  open: boolean;
  recipientName: string;
  recipientCompany: string;
  onSelect: (tier: "tier1" | "tier2" | "tier3") => void;
  onClose: () => void;
}

export default function TierSelectionDialog({
  open,
  recipientName,
  recipientCompany,
  onSelect,
  onClose,
}: TierSelectionDialogProps) {
  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full max-w-3xl bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
              {/* Gradient Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 pointer-events-none" />

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>

              {/* Header */}
              <div className="relative p-8 pb-6 border-b border-slate-700/50">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Select Campaign Tier
                  </h2>
                  <p className="text-slate-400 text-lg">
                    Reaching out to{" "}
                    <span className="text-emerald-400 font-semibold">
                      {recipientCompany}
                    </span>
                    {recipientName && (
                      <>
                        {" "}({recipientName})
                      </>
                    )}
                  </p>
                  <p className="text-slate-500 text-sm mt-2">
                    Choose the appropriate tier for this prospect
                  </p>
                </motion.div>
              </div>

              {/* Tier Cards */}
              <div className="relative p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Tier 1 Card */}
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelect("tier1")}
                  className="group relative p-6 rounded-xl bg-gradient-to-br from-amber-900/40 to-orange-800/40 border-2 border-amber-500/30 hover:border-amber-400/60 transition-all duration-300 text-left overflow-hidden"
                >
                  {/* Gradient Glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 to-orange-600/0 group-hover:from-amber-500/10 group-hover:to-orange-600/20 transition-all duration-300" />

                  {/* Icon */}
                  <div className="relative mb-4 inline-flex p-3 rounded-xl bg-amber-500/20 group-hover:bg-amber-500/30 transition-colors">
                    <Crown className="w-6 h-6 text-amber-400" />
                  </div>

                  {/* Content */}
                  <div className="relative">
                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                      Tier 1
                      <span className="px-2 py-0.5 text-xs font-semibold bg-amber-500/20 text-amber-400 rounded-full">
                        PREMIUM
                      </span>
                    </h3>
                    <p className="text-slate-300 text-sm mb-4">
                      Premium outreach for top-tier prospects
                    </p>

                    {/* Features */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="text-amber-400">•</span>
                        <span>Custom messaging</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="text-amber-400">•</span>
                        <span>Priority placement</span>
                      </div>
                    </div>
                  </div>
                </motion.button>

                {/* Tier 2 Card */}
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelect("tier2")}
                  className="group relative p-6 rounded-xl bg-gradient-to-br from-emerald-900/40 to-teal-800/40 border-2 border-emerald-500/30 hover:border-emerald-400/60 transition-all duration-300 text-left overflow-hidden"
                >
                  {/* Gradient Glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-teal-600/0 group-hover:from-emerald-500/10 group-hover:to-teal-600/20 transition-all duration-300" />

                  {/* Icon */}
                  <div className="relative mb-4 inline-flex p-3 rounded-xl bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors">
                    <Star className="w-6 h-6 text-emerald-400" />
                  </div>

                  {/* Content */}
                  <div className="relative">
                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                      Tier 2
                      <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-400 rounded-full">
                        STANDARD
                      </span>
                    </h3>
                    <p className="text-slate-300 text-sm mb-4">
                      Standard performance campaign outreach
                    </p>

                    {/* Features */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="text-emerald-400">•</span>
                        <span>CPI/CPA model pitch</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="text-emerald-400">•</span>
                        <span>Full channel overview</span>
                      </div>
                    </div>
                  </div>
                </motion.button>

                {/* Tier 3 Card */}
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelect("tier3")}
                  className="group relative p-6 rounded-xl bg-gradient-to-br from-blue-900/40 to-indigo-800/40 border-2 border-blue-500/30 hover:border-blue-400/60 transition-all duration-300 text-left overflow-hidden"
                >
                  {/* Gradient Glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-indigo-600/0 group-hover:from-blue-500/10 group-hover:to-indigo-600/20 transition-all duration-300" />

                  {/* Icon */}
                  <div className="relative mb-4 inline-flex p-3 rounded-xl bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                    <Zap className="w-6 h-6 text-blue-400" />
                  </div>

                  {/* Content */}
                  <div className="relative">
                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                      Tier 3
                      <span className="px-2 py-0.5 text-xs font-semibold bg-blue-500/20 text-blue-400 rounded-full">
                        BASIC
                      </span>
                    </h3>
                    <p className="text-slate-300 text-sm mb-4">
                      Basic introduction for new prospects
                    </p>

                    {/* Features */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="text-blue-400">•</span>
                        <span>Quick introduction</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="text-blue-400">•</span>
                        <span>Service overview</span>
                      </div>
                    </div>
                  </div>
                </motion.button>
              </div>

              {/* Footer */}
              <div className="relative px-8 pb-6">
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <p className="text-sm text-slate-400 text-center">
                    <span className="text-emerald-400 font-semibold">
                      TheMobiAdz
                    </span>{" "}
                    · Performance Marketing · CPI/CPA Models · 450+ Advertisers · 1.5-2M Monthly Conversions
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
