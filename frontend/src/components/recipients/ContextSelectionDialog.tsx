"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Briefcase,
  TrendingUp,
  CheckCircle2,
  Upload,
  Sparkles,
  X,
  Clock,
  Star,
  Zap,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { documentsAPI } from "@/lib/api";
import { toast } from "sonner";

interface Resume {
  id: number;
  name: string;
  target_position?: string;
  is_default: boolean;
  times_used: number;
  created_at: string;
  parsed_data?: {
    technical_skills?: string[];
    work_experience?: any[];
    confidence_score?: number;
  };
}

interface InfoDoc {
  id: number;
  name: string;
  doc_type?: string;
  company_name?: string;
  is_default: boolean;
  times_used: number;
  created_at?: string;
}

interface ContextSelectionDialogProps {
  open: boolean;
  mode: "job" | "market" | "themobiadz";
  recipientName: string;
  recipientCompany: string;
  onSelect: (contextId: number, contextType: "resume" | "info_doc") => void;
  onClose: () => void;
  onUploadNew: () => void;
}

export default function ContextSelectionDialog({
  open,
  mode,
  recipientName,
  recipientCompany,
  onSelect,
  onClose,
  onUploadNew,
}: ContextSelectionDialogProps) {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [infoDocs, setInfoDocs] = useState<InfoDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      fetchDocuments();
    }
  }, [open, mode]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      if (mode === "job") {
        const { data } = await documentsAPI.listResumes();
        setResumes(data.resumes || []);
        // Auto-select default resume
        const defaultResume = data.resumes?.find((r: Resume) => r.is_default);
        if (defaultResume) setSelectedId(defaultResume.id);
      } else {
        const { data } = await documentsAPI.listInfoDocs();
        setInfoDocs(data.info_docs || []);
        // Auto-select default info doc
        const defaultDoc = data.info_docs?.find((d: InfoDoc) => d.is_default);
        if (defaultDoc) setSelectedId(defaultDoc.id);
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (!selectedId) {
      toast.error("Please select a document first");
      return;
    }
    onSelect(selectedId, mode === "job" ? "resume" : "info_doc");
  };

  if (!open) return null;

  const documents = mode === "job" ? resumes : infoDocs;
  const hasDocuments = documents.length > 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl">
              {/* Animated gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />

              {/* Animated glow effect */}
              <motion.div
                animate={{
                  background: [
                    "radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)",
                    "radial-gradient(circle at 80% 50%, rgba(147, 51, 234, 0.15) 0%, transparent 50%)",
                    "radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)",
                  ],
                }}
                transition={{ duration: 8, repeat: Infinity }}
                className="absolute inset-0 pointer-events-none"
              />

              {/* Content */}
              <div className="relative backdrop-blur-xl bg-slate-900/90 border-2 border-slate-700/50 rounded-3xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="relative p-8 pb-6 border-b border-slate-700/50">
                  {/* Close button */}
                  <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 transition-colors group"
                  >
                    <X className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                  </button>

                  {/* Icon animation */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", duration: 0.8, bounce: 0.5 }}
                    className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 mb-4"
                  >
                    {mode === "job" ? (
                      <Briefcase className="w-8 h-8 text-blue-400" />
                    ) : (
                      <TrendingUp className="w-8 h-8 text-purple-400" />
                    )}
                  </motion.div>

                  {/* Title */}
                  <motion.h2
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl font-bold text-white mb-3"
                  >
                    {mode === "job" ? "Select Your Resume" : "Select Your Pitch"}
                  </motion.h2>

                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-lg text-slate-400"
                  >
                    Connecting with{" "}
                    <span className="text-blue-400 font-semibold">
                      {recipientName}
                    </span>{" "}
                    at{" "}
                    <span className="text-purple-400 font-semibold">
                      {recipientCompany}
                    </span>
                  </motion.p>

                  {/* Research complete badge */}
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, type: "spring", bounce: 0.5 }}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-semibold text-emerald-400">
                      Research Complete
                    </span>
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                  </motion.div>
                </div>

                {/* Body */}
                <div className="relative p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                  {loading ? (
                    // Loading state
                    <div className="flex flex-col items-center justify-center py-16">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full"
                      />
                      <p className="mt-4 text-slate-400">
                        Loading your documents...
                      </p>
                    </div>
                  ) : !hasDocuments ? (
                    // Empty state
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex flex-col items-center justify-center py-16"
                    >
                      <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
                        <FileText className="w-10 h-10 text-slate-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        No {mode === "job" ? "Resumes" : "Info Docs"} Yet
                      </h3>
                      <p className="text-slate-400 text-center mb-6 max-w-md">
                        {mode === "job"
                          ? "Upload your resume to get started with personalized job applications"
                          : "Upload your company/service info to start pitching"}
                      </p>
                      <Button
                        onClick={onUploadNew}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Now
                      </Button>
                    </motion.div>
                  ) : (
                    // Documents grid
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">
                          Choose Your {mode === "job" ? "Resume" : "Info Doc"}
                        </h3>
                        <span className="text-sm text-slate-500">
                          {documents.length} available
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {documents.map((doc, index) => (
                          <DocumentCard
                            key={doc.id}
                            doc={doc}
                            mode={mode}
                            selected={selectedId === doc.id}
                            onSelect={() => setSelectedId(doc.id)}
                            index={index}
                          />
                        ))}
                      </div>

                      {/* Upload new button */}
                      <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        onClick={onUploadNew}
                        className="w-full mt-6 p-6 rounded-2xl border-2 border-dashed border-slate-700 hover:border-blue-500/50 bg-slate-800/30 hover:bg-slate-800/50 transition-all group"
                      >
                        <div className="flex items-center justify-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                            <Plus className="w-5 h-5 text-blue-400" />
                          </div>
                          <span className="text-slate-400 group-hover:text-white transition-colors font-medium">
                            Upload New {mode === "job" ? "Resume" : "Info Doc"}
                          </span>
                        </div>
                      </motion.button>
                    </div>
                  )}
                </div>

                {/* Footer */}
                {hasDocuments && (
                  <div className="relative p-6 border-t border-slate-700/50 bg-slate-900/50">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Zap className="w-4 h-4" />
                        <span>AI will personalize using selected document</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          onClick={onClose}
                          variant="outline"
                          className="border-slate-700 hover:bg-slate-800"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleContinue}
                          disabled={!selectedId}
                          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Emails
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Document Card Component
function DocumentCard({
  doc,
  mode,
  selected,
  onSelect,
  index,
}: {
  doc: Resume | InfoDoc;
  mode: "job" | "market" | "themobiadz";
  selected: boolean;
  onSelect: () => void;
  index: number;
}) {
  const isResume = mode === "job" || mode === "themobiadz";
  const resume = isResume ? (doc as Resume) : null;
  const infoDoc = !isResume ? (doc as InfoDoc) : null;

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 * index }}
      onClick={onSelect}
      className={`relative p-6 rounded-2xl border-2 transition-all text-left group ${
        selected
          ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20"
          : "border-slate-700/50 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/50"
      }`}
    >
      {/* Selection indicator */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shadow-lg"
          >
            <CheckCircle2 className="w-5 h-5 text-white" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Default badge */}
      {doc.is_default && (
        <div className="absolute top-4 right-4 px-2 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center gap-1">
          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
          <span className="text-xs font-semibold text-yellow-400">Default</span>
        </div>
      )}

      {/* Icon */}
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
          selected
            ? "bg-blue-500/20"
            : "bg-slate-700/30 group-hover:bg-slate-700/50"
        }`}
      >
        <FileText
          className={`w-6 h-6 ${
            selected ? "text-blue-400" : "text-slate-400 group-hover:text-slate-300"
          }`}
        />
      </div>

      {/* Content */}
      <h4 className="text-lg font-semibold text-white mb-1 line-clamp-1">
        {doc.name}
      </h4>

      {isResume && resume?.target_position && (
        <p className="text-sm text-blue-400 mb-2">{resume.target_position}</p>
      )}

      {!isResume && infoDoc?.doc_type && (
        <p className="text-sm text-purple-400 mb-2 capitalize">
          {infoDoc.doc_type}
        </p>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{doc.created_at ? new Date(doc.created_at).toLocaleDateString() : "N/A"}</span>
        </div>
        <div className="flex items-center gap-1">
          <Zap className="w-3 h-3" />
          <span>Used {doc.times_used}x</span>
        </div>
      </div>

      {/* Skills preview (for resumes) */}
      {isResume && resume?.parsed_data?.technical_skills && (
        <div className="mt-3 flex flex-wrap gap-1">
          {resume.parsed_data.technical_skills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="px-2 py-0.5 rounded-full bg-slate-700/50 text-xs text-slate-400"
            >
              {skill}
            </span>
          ))}
          {resume.parsed_data.technical_skills.length > 3 && (
            <span className="px-2 py-0.5 rounded-full bg-slate-700/50 text-xs text-slate-400">
              +{resume.parsed_data.technical_skills.length - 3}
            </span>
          )}
        </div>
      )}
    </motion.button>
  );
}
