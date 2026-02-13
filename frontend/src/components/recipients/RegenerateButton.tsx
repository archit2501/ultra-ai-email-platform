"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Sparkles, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RegenerateButtonProps {
  onRegenerate: () => Promise<void>;
  loading?: boolean;
  lastGenerated?: string;
  type?: "research" | "email";
  variant?: "default" | "compact" | "icon-only";
  confirmationRequired?: boolean;
}

/**
 * RegenerateButton - God-Tier Regenerate Button
 * Beautiful animated button with confirmation dialog and loading states
 */
export function RegenerateButton({
  onRegenerate,
  loading = false,
  lastGenerated,
  type = "research",
  variant = "default",
  confirmationRequired = true,
}: RegenerateButtonProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleClick = () => {
    if (confirmationRequired && !loading) {
      setShowConfirmation(true);
    } else if (!loading) {
      handleRegenerate();
    }
  };

  const handleRegenerate = async () => {
    setShowConfirmation(false);
    setIsRegenerating(true);

    try {
      await onRegenerate();

      // Show success animation
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setIsRegenerating(false);
      }, 2000);
    } catch (error) {
      console.error("Regeneration failed:", error);
      setIsRegenerating(false);
    }
  };

  const isLoading = loading || isRegenerating;

  // Button variants
  const renderButton = () => {
    if (variant === "icon-only") {
      return (
        <motion.button
          onClick={handleClick}
          disabled={isLoading}
          whileHover={!isLoading ? { scale: 1.05, rotate: 180 } : {}}
          whileTap={!isLoading ? { scale: 0.95 } : {}}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          className={`
            relative p-2 rounded-lg
            bg-gradient-to-r from-cyan-600 to-cyan-700
            hover:from-cyan-500 hover:to-cyan-600
            border border-cyan-500/30
            shadow-lg shadow-cyan-500/20
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-300
          `}
        >
          <motion.div
            animate={
              isLoading
                ? {
                    rotate: 360,
                    transition: {
                      repeat: Infinity,
                      duration: 1,
                      ease: "linear",
                    },
                  }
                : {}
            }
          >
            {showSuccess ? (
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            ) : (
              <RefreshCw className="w-4 h-4 text-cyan-100" />
            )}
          </motion.div>

          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 rounded-lg bg-cyan-500/30 blur-md -z-10"
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.2, 1],
            }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: "easeInOut",
            }}
          />
        </motion.button>
      );
    }

    if (variant === "compact") {
      return (
        <Button
          onClick={handleClick}
          disabled={isLoading}
          className="relative gap-2 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 border border-cyan-500/30 shadow-lg shadow-cyan-500/20"
        >
          <motion.div
            animate={
              isLoading
                ? {
                    rotate: 360,
                    transition: {
                      repeat: Infinity,
                      duration: 1,
                      ease: "linear",
                    },
                  }
                : {}
            }
          >
            {showSuccess ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </motion.div>
          <span>{isLoading ? "Regenerating..." : "Regenerate"}</span>
        </Button>
      );
    }

    // Default variant (full button)
    return (
      <motion.div
        whileHover={!isLoading ? { scale: 1.02 } : {}}
        whileTap={!isLoading ? { scale: 0.98 } : {}}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
      >
        <Button
          onClick={handleClick}
          disabled={isLoading}
          className="relative gap-2 px-6 py-3 text-base bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 border border-cyan-500/30 shadow-lg shadow-cyan-500/20"
        >
          {/* Icon with rotation */}
          <motion.div
            animate={
              isLoading
                ? {
                    rotate: 360,
                    transition: {
                      repeat: Infinity,
                      duration: 1,
                      ease: "linear",
                    },
                  }
                : {}
            }
            whileHover={
              !isLoading
                ? {
                    rotate: 180,
                    transition: { duration: 0.3 },
                  }
                : {}
            }
          >
            {showSuccess ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <RefreshCw className="w-5 h-5" />
            )}
          </motion.div>

          <span className="font-semibold">
            {showSuccess
              ? "Regenerated!"
              : isLoading
              ? "Regenerating..."
              : `Regenerate ${type === "research" ? "Research" : "Emails"}`}
          </span>

          {/* Sparkles for success */}
          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
              >
                <Sparkles className="w-5 h-5 text-green-400" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 rounded-lg bg-cyan-500/30 blur-xl -z-10"
            animate={{
              opacity: [0.2, 0.4, 0.2],
              scale: [1, 1.05, 1],
            }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: "easeInOut",
            }}
          />
        </Button>
      </motion.div>
    );
  };

  return (
    <>
      {renderButton()}

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-xl border border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{
                  repeat: Infinity,
                  duration: 3,
                  ease: "linear",
                }}
              >
                <RefreshCw className="w-6 h-6 text-cyan-400" />
              </motion.div>
              <span>Regenerate {type === "research" ? "Research" : "Emails"}?</span>
            </DialogTitle>
            <DialogDescription className="text-slate-400 space-y-3 pt-2">
              {/* Warning badge */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 px-3 py-2 bg-orange-500/10 border border-orange-500/30 rounded-lg"
              >
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                <span className="text-sm text-orange-300">
                  This will replace your current cached {type}
                </span>
              </motion.div>

              <p>
                {type === "research"
                  ? "New company research will be generated by scraping the latest information. This may take 30-60 seconds."
                  : "New email variations will be generated with 5 different tones. This may take 20-40 seconds."}
              </p>

              {lastGenerated && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg"
                >
                  <p className="text-xs text-slate-500">Last generated:</p>
                  <p className="text-sm text-slate-300 font-medium">
                    {new Date(lastGenerated).toLocaleString()}
                  </p>
                </motion.div>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirmation(false)}
              className="border-slate-700 hover:bg-slate-800"
            >
              Cancel
            </Button>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleRegenerate}
                className="gap-2 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600"
              >
                <RefreshCw className="w-4 h-4" />
                Yes, Regenerate
              </Button>
            </motion.div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Compact variant for inline use
 */
export function CompactRegenerateButton(
  props: Omit<RegenerateButtonProps, "variant">
) {
  return <RegenerateButton {...props} variant="compact" />;
}

/**
 * Icon-only variant for minimal UI
 */
export function IconRegenerateButton(
  props: Omit<RegenerateButtonProps, "variant">
) {
  return <RegenerateButton {...props} variant="icon-only" />;
}
