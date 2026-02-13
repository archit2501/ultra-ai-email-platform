"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Brain,
  Briefcase,
  FileCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { documentsAPI } from "@/lib/api";
import { toast } from "sonner";
import type { ParsedResume } from "@/types";

interface ResumeUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUploadSuccess: (resumeId: number, parsedData?: ParsedResume) => void;
}

type UploadState = "idle" | "uploading" | "parsing" | "success" | "error";

const ALLOWED_FILE_TYPES = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function ResumeUploadDialog({
  open,
  onClose,
  onUploadSuccess,
}: ResumeUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsedData, setParsedData] = useState<ParsedResume | null>(null);
  const [resumeName, setResumeName] = useState("");
  const [description, setDescription] = useState("");
  const [targetPosition, setTargetPosition] = useState("");
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setError("Invalid file type. Please upload PDF or DOCX files only.");
      toast.error("Invalid file type");
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError("File size exceeds 10MB limit.");
      toast.error("File too large");
      return;
    }

    setSelectedFile(file);
    setResumeName(file.name.replace(/\.(pdf|docx|doc)$/i, ""));
    setError("");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }

    try {
      setUploadState("uploading");
      setUploadProgress(0);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await documentsAPI.uploadResume(selectedFile, {
        name: resumeName || undefined,
        description: description || undefined,
        target_position: targetPosition || undefined,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.data.success) {
        setUploadState("parsing");

        // Simulate parsing delay for better UX
        await new Promise(resolve => setTimeout(resolve, 2000));

        setParsedData(response.data.parsed_data || null);
        setUploadState("success");

        toast.success("Resume uploaded and parsed successfully!");

        // Wait a bit to show success state, then call callback
        setTimeout(() => {
          onUploadSuccess(response.data.resume.id, response.data.parsed_data);
          handleClose();
        }, 2000);
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      setUploadState("error");
      setError(error.response?.data?.detail || "Failed to upload resume");
      toast.error("Upload failed");
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setUploadState("idle");
    setUploadProgress(0);
    setParsedData(null);
    setResumeName("");
    setDescription("");
    setTargetPosition("");
    setError("");
    onClose();
  };

  const getFileIcon = () => {
    if (!selectedFile) return <FileText className="w-12 h-12 text-slate-400" />;

    const extension = selectedFile.name.split('.').pop()?.toLowerCase();
    return extension === 'pdf'
      ? <FileText className="w-12 h-12 text-red-400" />
      : <FileText className="w-12 h-12 text-blue-400" />;
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
          className="relative w-full max-w-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Animated gradient background */}
          <div className="absolute inset-0 opacity-30">
            <motion.div
              animate={{
                background: [
                  "radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)",
                  "radial-gradient(circle at 80% 70%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)",
                  "radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)",
                ],
              }}
              transition={{ duration: 10, repeat: Infinity }}
              className="w-full h-full"
            />
          </div>

          {/* Header */}
          <div className="relative border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  className="p-2 bg-blue-500/10 rounded-lg"
                >
                  <Upload className="w-6 h-6 text-blue-400" />
                </motion.div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Upload Resume</h2>
                  <p className="text-sm text-slate-400">Upload and parse your resume automatically</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                disabled={uploadState === "uploading" || uploadState === "parsing"}
                className="text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Body */}
          <div className="relative p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* File Drop Zone */}
            {uploadState === "idle" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
                    transition-all duration-300 backdrop-blur-sm
                    ${isDragging
                      ? "border-blue-500 bg-blue-500/10"
                      : selectedFile
                        ? "border-green-500 bg-green-500/5"
                        : "border-slate-600 bg-slate-800/30 hover:border-blue-500 hover:bg-blue-500/5"
                    }
                  `}
                >
                  {selectedFile ? (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex flex-col items-center gap-4"
                    >
                      {getFileIcon()}
                      <div>
                        <p className="text-lg font-medium text-white">{selectedFile.name}</p>
                        <p className="text-sm text-slate-400">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                      >
                        <CheckCircle2 className="w-8 h-8 text-green-400" />
                      </motion.div>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Upload className="w-16 h-16 text-slate-400" />
                      </motion.div>
                      <div>
                        <p className="text-lg font-medium text-white mb-2">
                          Drop your resume here or click to browse
                        </p>
                        <p className="text-sm text-slate-400">
                          Supports PDF, DOC, DOCX • Max 10MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-lg mt-4"
                  >
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-400">{error}</p>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Form Fields (only when file selected) */}
            {selectedFile && uploadState === "idle" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Resume Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={resumeName}
                    onChange={(e) => setResumeName(e.target.value)}
                    placeholder="e.g., Software Engineer Resume 2024"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., Updated with latest experience at Google"
                    rows={2}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Target Position (Optional)
                  </label>
                  <input
                    type="text"
                    value={targetPosition}
                    onChange={(e) => setTargetPosition(e.target.value)}
                    placeholder="e.g., Senior Software Engineer"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </motion.div>
            )}

            {/* Upload Progress */}
            {uploadState === "uploading" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="flex flex-col items-center gap-4 py-12">
                  <Loader2 className="w-16 h-16 text-blue-400 animate-spin" />
                  <div className="text-center">
                    <p className="text-lg font-medium text-white">Uploading Resume...</p>
                    <p className="text-sm text-slate-400 mt-1">{uploadProgress}% complete</p>
                  </div>
                  <div className="w-full max-w-md h-2 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3 }}
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Parsing State */}
            {uploadState === "parsing" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="flex flex-col items-center gap-4 py-12">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Brain className="w-16 h-16 text-purple-400" />
                  </motion.div>
                  <div className="text-center">
                    <p className="text-lg font-medium text-white">Parsing Resume with AI...</p>
                    <p className="text-sm text-slate-400 mt-1">Extracting skills, experience, and education</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                        className="w-2 h-2 bg-purple-400 rounded-full"
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Success State */}
            {uploadState === "success" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <div className="flex flex-col items-center gap-4 py-12">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                  >
                    <FileCheck className="w-16 h-16 text-green-400" />
                  </motion.div>
                  <div className="text-center">
                    <p className="text-lg font-medium text-white">Resume Uploaded Successfully!</p>
                    {parsedData && (
                      <p className="text-sm text-slate-400 mt-1">
                        Extracted {parsedData.technical_skills?.length || 0} skills, {parsedData.work_experience?.length || 0} experiences
                      </p>
                    )}
                  </div>
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <Sparkles className="w-8 h-8 text-yellow-400" />
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Error State */}
            {uploadState === "error" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="flex flex-col items-center gap-4 py-12">
                  <AlertCircle className="w-16 h-16 text-red-400" />
                  <div className="text-center">
                    <p className="text-lg font-medium text-white">Upload Failed</p>
                    <p className="text-sm text-red-400 mt-1">{error}</p>
                  </div>
                  <Button
                    onClick={() => setUploadState("idle")}
                    className="mt-4"
                  >
                    Try Again
                  </Button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          {uploadState === "idle" && (
            <div className="relative border-t border-slate-700/50 bg-slate-900/50 backdrop-blur-xl p-6">
              <div className="flex items-center justify-end gap-3">
                <Button
                  variant="ghost"
                  onClick={handleClose}
                  className="text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile}
                  className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-6"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload & Parse Resume
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
