"use client";

/**
 * Step 2: Extraction Mode Selection
 * Choose between FREE (100% Free - No APIs) or PAID (Premium APIs)
 */

import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Crown,
  Sparkles,
  Check,
  ArrowRight,
  Globe,
  Bot,
  Search,
  Shield,
  FileSearch,
  Mail,
  Brain,
  Lock,
  Unlock,
  Star,
  Rocket,
} from "lucide-react";
import { useState } from "react";

export type ExtractionMode = "free" | "paid";

interface ModeSelectorProps {
  selectedMode?: ExtractionMode;
  onSelectMode: (mode: ExtractionMode) => void;
}

const FREE_LAYERS = [
  { icon: Search, name: "DuckDuckGo Search", desc: "Free web discovery" },
  { icon: Globe, name: "Deep Web Crawling", desc: "Multi-level site crawling" },
  { icon: Bot, name: "Playwright Rendering", desc: "JavaScript page rendering" },
  { icon: Brain, name: "Local AI/ML Models", desc: "SpaCy NER + BERT extraction" },
  { icon: Mail, name: "Email Discovery", desc: "Pattern + DNS validation" },
  { icon: Shield, name: "OSINT Intelligence", desc: "WHOIS, DNS, SSL analysis" },
  { icon: FileSearch, name: "Document Extraction", desc: "PDF, DOCX parsing" },
  { icon: Sparkles, name: "Fraud Detection", desc: "ML-based validation" },
];

const PAID_LAYERS = [
  { icon: Search, name: "Google Custom Search", desc: "Precision web search" },
  { icon: Globe, name: "Hunter.io", desc: "Email verification API" },
  { icon: Bot, name: "Apollo.io", desc: "B2B contact database" },
  { icon: Brain, name: "Claude/GPT API", desc: "Advanced AI extraction" },
  { icon: Mail, name: "Clearbit", desc: "Company enrichment" },
  { icon: Shield, name: "ProxyCurl", desc: "LinkedIn data API" },
  { icon: FileSearch, name: "FullContact", desc: "Person enrichment" },
  { icon: Sparkles, name: "2Captcha", desc: "CAPTCHA solving" },
];

export function ModeSelector({ selectedMode, onSelectMode }: ModeSelectorProps) {
  const [hoveredMode, setHoveredMode] = useState<ExtractionMode | null>(null);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 mb-4"
        >
          <Rocket className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-blue-300">Choose Your Power Level</span>
        </motion.div>
        <h2 className="text-3xl font-bold text-white mb-3">
          Select Extraction Mode
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Choose between our 100% FREE extraction engine or unlock premium APIs for enhanced accuracy and speed
        </p>
      </div>

      {/* Mode Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* FREE Mode Card */}
        <motion.button
          onClick={() => onSelectMode("free")}
          onMouseEnter={() => setHoveredMode("free")}
          onMouseLeave={() => setHoveredMode(null)}
          whileHover={{ scale: 1.02, y: -5 }}
          whileTap={{ scale: 0.98 }}
          className="relative text-left group"
        >
          <div
            className={`
              relative p-8 rounded-3xl border-2 transition-all duration-500
              ${
                selectedMode === "free"
                  ? "border-emerald-400 bg-gradient-to-br from-emerald-600/30 to-teal-600/30 shadow-2xl shadow-emerald-500/30"
                  : "border-slate-700/50 bg-slate-800/40 backdrop-blur-sm hover:border-emerald-500/50"
              }
            `}
          >
            {/* Glow Effect */}
            {(hoveredMode === "free" || selectedMode === "free") && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10"
              />
            )}

            {/* FREE Badge */}
            <div className="absolute -top-4 left-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/50"
              >
                <div className="flex items-center gap-2">
                  <Unlock className="w-4 h-4 text-white" />
                  <span className="text-sm font-bold text-white">100% FREE</span>
                </div>
              </motion.div>
            </div>

            <div className="relative z-10 pt-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`
                    p-4 rounded-2xl transition-all duration-300
                    ${selectedMode === "free"
                      ? "bg-emerald-500/30 shadow-lg shadow-emerald-500/30"
                      : "bg-slate-700/50 group-hover:bg-emerald-500/20"}
                  `}>
                    <Zap className={`
                      w-10 h-10 transition-colors
                      ${selectedMode === "free" ? "text-emerald-300" : "text-slate-400 group-hover:text-emerald-400"}
                    `} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">FREE Engine</h3>
                    <p className="text-emerald-400 text-sm font-medium">No API keys required</p>
                  </div>
                </div>

                {selectedMode === "free" && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500 }}
                    className="p-2 rounded-full bg-emerald-500"
                  >
                    <Check className="w-5 h-5 text-white" />
                  </motion.div>
                )}
              </div>

              {/* Description */}
              <p className="text-slate-300 mb-6">
                Powerful extraction using open-source tools, web scraping, and local AI models.
                Perfect for getting started without any cost.
              </p>

              {/* Features Grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {FREE_LAYERS.map((layer, idx) => {
                  const Icon = layer.icon;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`
                        flex items-center gap-2 p-2 rounded-lg transition-colors
                        ${selectedMode === "free" ? "bg-emerald-500/20" : "bg-slate-700/30 group-hover:bg-slate-700/50"}
                      `}
                    >
                      <Icon className={`
                        w-4 h-4 flex-shrink-0
                        ${selectedMode === "free" ? "text-emerald-400" : "text-slate-500 group-hover:text-emerald-400"}
                      `} />
                      <span className="text-xs text-slate-300 truncate">{layer.name}</span>
                    </motion.div>
                  );
                })}
              </div>

              {/* Highlights */}
              <div className="space-y-2">
                {["Zero cost - completely free", "No API configuration needed", "Starts instantly", "Local AI processing"].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-slate-300">{item}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className={`
                mt-6 p-4 rounded-xl flex items-center justify-between transition-colors
                ${selectedMode === "free"
                  ? "bg-emerald-500/20 border border-emerald-500/30"
                  : "bg-slate-700/30 group-hover:bg-emerald-500/10"}
              `}>
                <span className="text-white font-semibold">Start Free Extraction</span>
                <ArrowRight className={`
                  w-5 h-5 transition-all
                  ${selectedMode === "free" ? "text-emerald-400" : "text-slate-400 group-hover:text-emerald-400 group-hover:translate-x-1"}
                `} />
              </div>
            </div>

            {/* Animated Border */}
            {selectedMode === "free" && (
              <motion.div
                className="absolute inset-0 rounded-3xl"
                style={{
                  background: "linear-gradient(90deg, #10b981, #14b8a6, #10b981)",
                  backgroundSize: "200% 200%",
                  padding: "2px",
                  mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  maskComposite: "exclude",
                  WebkitMaskComposite: "xor",
                }}
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
            )}
          </div>
        </motion.button>

        {/* PAID Mode Card */}
        <motion.button
          onClick={() => onSelectMode("paid")}
          onMouseEnter={() => setHoveredMode("paid")}
          onMouseLeave={() => setHoveredMode(null)}
          whileHover={{ scale: 1.02, y: -5 }}
          whileTap={{ scale: 0.98 }}
          className="relative text-left group"
        >
          <div
            className={`
              relative p-8 rounded-3xl border-2 transition-all duration-500
              ${
                selectedMode === "paid"
                  ? "border-amber-400 bg-gradient-to-br from-amber-600/30 to-orange-600/30 shadow-2xl shadow-amber-500/30"
                  : "border-slate-700/50 bg-slate-800/40 backdrop-blur-sm hover:border-amber-500/50"
              }
            `}
          >
            {/* Glow Effect */}
            {(hoveredMode === "paid" || selectedMode === "paid") && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 rounded-3xl bg-gradient-to-br from-amber-500/10 to-orange-500/10"
              />
            )}

            {/* PREMIUM Badge */}
            <div className="absolute -top-4 left-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-amber-500/50"
              >
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-white" />
                  <span className="text-sm font-bold text-white">PREMIUM</span>
                  <Star className="w-3 h-3 text-white fill-white" />
                </div>
              </motion.div>
            </div>

            <div className="relative z-10 pt-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`
                    p-4 rounded-2xl transition-all duration-300
                    ${selectedMode === "paid"
                      ? "bg-amber-500/30 shadow-lg shadow-amber-500/30"
                      : "bg-slate-700/50 group-hover:bg-amber-500/20"}
                  `}>
                    <Crown className={`
                      w-10 h-10 transition-colors
                      ${selectedMode === "paid" ? "text-amber-300" : "text-slate-400 group-hover:text-amber-400"}
                    `} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">PAID Engine</h3>
                    <p className="text-amber-400 text-sm font-medium">Premium APIs enabled</p>
                  </div>
                </div>

                {selectedMode === "paid" && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500 }}
                    className="p-2 rounded-full bg-amber-500"
                  >
                    <Check className="w-5 h-5 text-white" />
                  </motion.div>
                )}
              </div>

              {/* Description */}
              <p className="text-slate-300 mb-6">
                Maximum accuracy and speed using premium APIs. Configure each layer with
                your preferred providers for enterprise-grade results.
              </p>

              {/* Features Grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {PAID_LAYERS.map((layer, idx) => {
                  const Icon = layer.icon;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`
                        flex items-center gap-2 p-2 rounded-lg transition-colors
                        ${selectedMode === "paid" ? "bg-amber-500/20" : "bg-slate-700/30 group-hover:bg-slate-700/50"}
                      `}
                    >
                      <Icon className={`
                        w-4 h-4 flex-shrink-0
                        ${selectedMode === "paid" ? "text-amber-400" : "text-slate-500 group-hover:text-amber-400"}
                      `} />
                      <span className="text-xs text-slate-300 truncate">{layer.name}</span>
                    </motion.div>
                  );
                })}
              </div>

              {/* Highlights */}
              <div className="space-y-2">
                {["Higher accuracy & coverage", "Faster processing", "Email verification", "Configure APIs per layer"].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-sm text-slate-300">{item}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className={`
                mt-6 p-4 rounded-xl flex items-center justify-between transition-colors
                ${selectedMode === "paid"
                  ? "bg-amber-500/20 border border-amber-500/30"
                  : "bg-slate-700/30 group-hover:bg-amber-500/10"}
              `}>
                <span className="text-white font-semibold">Configure Premium APIs</span>
                <ArrowRight className={`
                  w-5 h-5 transition-all
                  ${selectedMode === "paid" ? "text-amber-400" : "text-slate-400 group-hover:text-amber-400 group-hover:translate-x-1"}
                `} />
              </div>
            </div>

            {/* Animated Border */}
            {selectedMode === "paid" && (
              <motion.div
                className="absolute inset-0 rounded-3xl"
                style={{
                  background: "linear-gradient(90deg, #f59e0b, #f97316, #f59e0b)",
                  backgroundSize: "200% 200%",
                  padding: "2px",
                  mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  maskComposite: "exclude",
                  WebkitMaskComposite: "xor",
                }}
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
            )}
          </div>
        </motion.button>
      </div>

      {/* Selection Confirmation */}
      <AnimatePresence>
        {selectedMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`
              p-6 rounded-2xl border
              ${selectedMode === "free"
                ? "bg-emerald-500/10 border-emerald-500/30"
                : "bg-amber-500/10 border-amber-500/30"}
            `}
          >
            <div className="flex items-center gap-4">
              <div className={`
                p-3 rounded-xl
                ${selectedMode === "free" ? "bg-emerald-500/20" : "bg-amber-500/20"}
              `}>
                {selectedMode === "free"
                  ? <Zap className="w-6 h-6 text-emerald-400" />
                  : <Crown className="w-6 h-6 text-amber-400" />
                }
              </div>
              <div className="flex-1">
                <h4 className="text-white font-semibold mb-1">
                  {selectedMode === "free" ? "FREE Mode Selected" : "PAID Mode Selected"}
                </h4>
                <p className="text-slate-400 text-sm">
                  {selectedMode === "free"
                    ? "Ready to start extraction immediately. No configuration needed - just click Next!"
                    : "Configure your preferred APIs for each extraction layer in the next step."
                  }
                </p>
              </div>
              <div className={`
                px-4 py-2 rounded-lg font-semibold text-sm
                ${selectedMode === "free"
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-amber-500/20 text-amber-300"}
              `}>
                Click Next to Continue
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
