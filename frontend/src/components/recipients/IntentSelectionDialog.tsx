"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, TrendingUp, X, Smartphone } from "lucide-react";

interface IntentSelectionDialogProps {
  open: boolean;
  recipientName: string;
  recipientCompany: string;
  onSelect: (intent: "job" | "market" | "themobiadz") => void;
  onClose: () => void;
}

export default function IntentSelectionDialog({
  open,
  recipientName,
  recipientCompany,
  onSelect,
  onClose,
}: IntentSelectionDialogProps) {
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
            <div className="relative w-full max-w-2xl bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
              {/* Gradient Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 pointer-events-none" />

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
                    What's Your Intent?
                  </h2>
                  <p className="text-slate-400 text-lg">
                    Connecting with{" "}
                    <span className="text-blue-400 font-semibold">
                      {recipientName}
                    </span>{" "}
                    at{" "}
                    <span className="text-purple-400 font-semibold">
                      {recipientCompany}
                    </span>
                  </p>
                  <p className="text-slate-500 text-sm mt-2">
                    Choose your approach to unlock ultra-deep AI research
                  </p>
                </motion.div>
              </div>

              {/* Intent Cards */}
              <div className="relative p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Job Application Card */}
                <motion.button
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelect("job")}
                  className="group relative p-8 rounded-xl bg-gradient-to-br from-blue-900/40 to-blue-800/40 border-2 border-blue-500/30 hover:border-blue-400/60 transition-all duration-300 text-left overflow-hidden"
                >
                  {/* Gradient Glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-600/0 group-hover:from-blue-500/10 group-hover:to-blue-600/20 transition-all duration-300" />

                  {/* Icon */}
                  <div className="relative mb-4 inline-flex p-4 rounded-xl bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                    <Briefcase className="w-8 h-8 text-blue-400" />
                  </div>

                  {/* Content */}
                  <div className="relative">
                    <h3 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
                      Job Application
                      <span className="px-2 py-1 text-xs font-semibold bg-blue-500/20 text-blue-400 rounded-full">
                        CAREER
                      </span>
                    </h3>
                    <p className="text-slate-300 mb-4 leading-relaxed">
                      Apply for a position at their company
                    </p>

                    {/* Features */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-start gap-2 text-sm text-slate-400">
                        <span className="text-blue-400 mt-1">✓</span>
                        <span>Company culture & tech stack analysis</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-slate-400">
                        <span className="text-blue-400 mt-1">✓</span>
                        <span>Hiring manager deep OSINT research</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-slate-400">
                        <span className="text-blue-400 mt-1">✓</span>
                        <span>Job posting & team structure insights</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-slate-400">
                        <span className="text-blue-400 mt-1">✓</span>
                        <span>Person's role, education & achievements</span>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="flex items-center gap-2 text-blue-400 font-semibold group-hover:gap-3 transition-all">
                      <span>Start Job Research</span>
                      <motion.span
                        animate={{ x: [0, 4, 0] }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.5,
                        }}
                      >
                        →
                      </motion.span>
                    </div>
                  </div>
                </motion.button>

                {/* Marketing/Sales Card */}
                <motion.button
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelect("market")}
                  className="group relative p-8 rounded-xl bg-gradient-to-br from-purple-900/40 to-pink-800/40 border-2 border-purple-500/30 hover:border-purple-400/60 transition-all duration-300 text-left overflow-hidden"
                >
                  {/* Gradient Glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-600/0 group-hover:from-purple-500/10 group-hover:to-pink-600/20 transition-all duration-300" />

                  {/* Icon */}
                  <div className="relative mb-4 inline-flex p-4 rounded-xl bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
                    <TrendingUp className="w-8 h-8 text-purple-400" />
                  </div>

                  {/* Content */}
                  <div className="relative">
                    <h3 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
                      Marketing/Sales
                      <span className="px-2 py-1 text-xs font-semibold bg-purple-500/20 text-purple-400 rounded-full">
                        BUSINESS
                      </span>
                    </h3>
                    <p className="text-slate-300 mb-4 leading-relaxed">
                      Pitch your product, service, or collaboration
                    </p>

                    {/* Features */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-start gap-2 text-sm text-slate-400">
                        <span className="text-purple-400 mt-1">✓</span>
                        <span>Company pain points & buying signals</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-slate-400">
                        <span className="text-purple-400 mt-1">✓</span>
                        <span>Decision maker authority & influence</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-slate-400">
                        <span className="text-purple-400 mt-1">✓</span>
                        <span>Budget, initiatives & recent projects</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-slate-400">
                        <span className="text-purple-400 mt-1">✓</span>
                        <span>Person's interests, activities & network</span>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="flex items-center gap-2 text-purple-400 font-semibold group-hover:gap-3 transition-all">
                      <span>Start Market Research</span>
                      <motion.span
                        animate={{ x: [0, 4, 0] }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.5,
                        }}
                      >
                        →
                      </motion.span>
                    </div>
                  </div>
                </motion.button>

                {/* TheMobiAdz Card */}
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelect("themobiadz")}
                  className="group relative p-8 rounded-xl bg-gradient-to-br from-emerald-900/40 to-teal-800/40 border-2 border-emerald-500/30 hover:border-emerald-400/60 transition-all duration-300 text-left overflow-hidden"
                >
                  {/* Gradient Glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-teal-600/0 group-hover:from-emerald-500/10 group-hover:to-teal-600/20 transition-all duration-300" />

                  {/* Icon */}
                  <div className="relative mb-4 inline-flex p-4 rounded-xl bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors">
                    <Smartphone className="w-8 h-8 text-emerald-400" />
                  </div>

                  {/* Content */}
                  <div className="relative">
                    <h3 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
                      TheMobiAdz
                      <span className="px-2 py-1 text-xs font-semibold bg-emerald-500/20 text-emerald-400 rounded-full">
                        APPS
                      </span>
                    </h3>
                    <p className="text-slate-300 mb-4 leading-relaxed">
                      App, Game & E-commerce company outreach
                    </p>

                    {/* Features */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-start gap-2 text-sm text-slate-400">
                        <span className="text-emerald-400 mt-1">✓</span>
                        <span>App store & Play Store discovery</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-slate-400">
                        <span className="text-emerald-400 mt-1">✓</span>
                        <span>Developer & publisher contact mining</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-slate-400">
                        <span className="text-emerald-400 mt-1">✓</span>
                        <span>E-commerce & SaaS company intelligence</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-slate-400">
                        <span className="text-emerald-400 mt-1">✓</span>
                        <span>Marketing & sales email discovery</span>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold group-hover:gap-3 transition-all">
                      <span>Start App Research</span>
                      <motion.span
                        animate={{ x: [0, 4, 0] }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.5,
                        }}
                      >
                        →
                      </motion.span>
                    </div>
                  </div>
                </motion.button>
              </div>

              {/* Footer */}
              <div className="relative px-8 pb-6">
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <p className="text-sm text-slate-400 text-center">
                    <span className="text-emerald-400 font-semibold">
                      100% Free AI Research
                    </span>{" "}
                    · Scrapes 50+ sources · OSINT Intelligence · ML/DL Analysis
                    · Deep Person & Company Profiling
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
