"use client";

/**
 * DELETE CONFIRMATION DIALOG
 *
 * A beautiful, animated confirmation dialog for deleting documents
 * Features:
 * - Smooth animations
 * - Document preview in dialog
 * - Clear warning message
 * - Loading state during deletion
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Trash2,
  X,
  FileText,
  Building2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  documentType: "resume" | "info-doc";
  documentName: string;
  additionalInfo?: string;
}

export default function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  documentType,
  documentName,
  additionalInfo,
}: DeleteConfirmDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const Icon = documentType === "resume" ? FileText : Building2;
  const typeLabel = documentType === "resume" ? "Resume" : "Info Document";
  const iconColor = documentType === "resume" ? "text-blue-400" : "text-purple-400";
  const iconBg = documentType === "resume" ? "bg-blue-500/10" : "bg-purple-500/10";

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-700/50 shadow-2xl"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-700/50 transition-colors z-10"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>

            {/* Content */}
            <div className="p-6">
              {/* Warning Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="flex justify-center mb-6"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse" />
                  <div className="relative p-4 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30">
                    <AlertTriangle className="w-10 h-10 text-red-400" />
                  </div>
                </div>
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl font-bold text-white text-center mb-2"
              >
                Delete {typeLabel}?
              </motion.h2>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="text-slate-400 text-center mb-6"
              >
                This action cannot be undone. The document will be permanently removed.
              </motion.p>

              {/* Document Preview */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 mb-6"
              >
                <div className={cn("p-3 rounded-xl", iconBg)}>
                  <Icon className={cn("w-6 h-6", iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{documentName}</p>
                  {additionalInfo && (
                    <p className="text-sm text-slate-400 truncate">{additionalInfo}</p>
                  )}
                </div>
              </motion.div>

              {/* Warning Message */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20 mb-6"
              >
                <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-300">
                  All parsed data, usage history, and associations with this document will be lost.
                </p>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex gap-3"
              >
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isDeleting}
                  className="flex-1 border-slate-600 hover:bg-slate-700/50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={isDeleting}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-lg shadow-red-500/25"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
