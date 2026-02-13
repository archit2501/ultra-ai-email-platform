"use client";

/**
 * DOCUMENT PREVIEW DIALOG
 *
 * A beautiful, full-featured document preview dialog
 * Features:
 * - PDF preview using iframe
 * - Image preview for image files
 * - Download button for all file types
 * - Loading states and error handling
 * - Responsive design
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileText,
  Building2,
  Download,
  ExternalLink,
  Loader2,
  FileImage,
  File,
  AlertCircle,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { documentsAPI } from "@/lib/api";

interface DocumentPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  documentType: "resume" | "info-doc";
  documentId: number;
  documentName: string;
  filename: string;
}

type PreviewState = "loading" | "preview" | "unsupported" | "error";

export default function DocumentPreviewDialog({
  open,
  onClose,
  documentType,
  documentId,
  documentName,
  filename,
}: DocumentPreviewDialogProps) {
  const [previewState, setPreviewState] = useState<PreviewState>("loading");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine file type from filename
  const fileExtension = filename?.split(".").pop()?.toLowerCase() || "";
  const isPDF = fileExtension === "pdf";
  const isImage = ["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(fileExtension);
  const isPreviewable = isPDF || isImage;

  const Icon = documentType === "resume" ? FileText : Building2;
  const iconColor = documentType === "resume" ? "text-blue-400" : "text-purple-400";
  const iconBg = documentType === "resume" ? "bg-blue-500/10" : "bg-purple-500/10";
  const accentColor = documentType === "resume" ? "blue" : "purple";

  // Load preview when dialog opens
  useEffect(() => {
    if (!open) {
      // Cleanup when closing
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setPreviewState("loading");
      setError(null);
      return;
    }

    if (!isPreviewable) {
      setPreviewState("unsupported");
      return;
    }

    const loadPreview = async () => {
      setPreviewState("loading");
      setError(null);

      try {
        const downloadFn = documentType === "resume"
          ? documentsAPI.downloadResume
          : documentsAPI.downloadInfoDoc;

        const { blob } = await downloadFn(documentId);
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setPreviewState("preview");
      } catch (err) {
        console.error("Failed to load preview:", err);
        setError("Failed to load document preview");
        setPreviewState("error");
      }
    };

    loadPreview();

    // Cleanup on unmount
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [open, documentId, documentType, isPreviewable]);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const downloadFn = documentType === "resume"
        ? documentsAPI.downloadResume
        : documentsAPI.downloadInfoDoc;

      const { blob, filename: downloadFilename } = await downloadFn(documentId);

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOpenInNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, "_blank");
    }
  };

  const getFileIcon = () => {
    if (isPDF) return <FileText className="w-16 h-16 text-red-400" />;
    if (isImage) return <FileImage className="w-16 h-16 text-green-400" />;
    return <File className="w-16 h-16 text-slate-400" />;
  };

  const getFileTypeLabel = () => {
    if (isPDF) return "PDF Document";
    if (isImage) return "Image File";
    if (["doc", "docx"].includes(fileExtension)) return "Word Document";
    if (["xls", "xlsx"].includes(fileExtension)) return "Excel Spreadsheet";
    if (["txt"].includes(fileExtension)) return "Text File";
    return `${fileExtension.toUpperCase()} File`;
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-700/50 shadow-2xl flex flex-col",
              isFullscreen
                ? "w-[95vw] h-[95vh]"
                : "w-full max-w-5xl h-[85vh]"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", iconBg)}>
                  <Icon className={cn("w-5 h-5", iconColor)} />
                </div>
                <div>
                  <h2 className="font-semibold text-white truncate max-w-[300px]">
                    {documentName}
                  </h2>
                  <p className="text-xs text-slate-400">{filename}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* File type badge */}
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-700/50 text-slate-300">
                  {getFileTypeLabel()}
                </span>

                {/* Fullscreen toggle */}
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                  title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-5 h-5 text-slate-400" />
                  ) : (
                    <Maximize2 className="w-5 h-5 text-slate-400" />
                  )}
                </button>

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 overflow-hidden relative">
              {/* Loading State */}
              {previewState === "loading" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className={cn("w-12 h-12", `text-${accentColor}-400`)} />
                  </motion.div>
                  <p className="text-slate-400">Loading preview...</p>
                </div>
              )}

              {/* Preview Content */}
              {previewState === "preview" && previewUrl && (
                <div className="w-full h-full">
                  {isPDF ? (
                    <iframe
                      src={previewUrl}
                      className="w-full h-full border-0"
                      title="Document Preview"
                    />
                  ) : isImage ? (
                    <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
                      <img
                        src={previewUrl}
                        alt={documentName}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                      />
                    </div>
                  ) : null}
                </div>
              )}

              {/* Unsupported File Type */}
              {previewState === "unsupported" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50"
                  >
                    {getFileIcon()}
                  </motion.div>

                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Preview not available
                    </h3>
                    <p className="text-slate-400 mb-1">
                      {getFileTypeLabel()} files cannot be previewed in the browser.
                    </p>
                    <p className="text-sm text-slate-500">
                      Download the file to view it in your preferred application.
                    </p>
                  </div>

                  <Button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className={cn(
                      "px-6",
                      documentType === "resume"
                        ? "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
                        : "bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600"
                    )}
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Download {getFileTypeLabel()}
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Error State */}
              {previewState === "error" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30"
                  >
                    <AlertCircle className="w-16 h-16 text-red-400" />
                  </motion.div>

                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Failed to load preview
                    </h3>
                    <p className="text-slate-400">
                      {error || "Something went wrong while loading the document."}
                    </p>
                  </div>

                  <Button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    variant="outline"
                    className="border-slate-600"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Try downloading instead
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Footer with actions */}
            {(previewState === "preview" || previewState === "loading") && (
              <div className="flex items-center justify-between p-4 border-t border-slate-700/50 bg-slate-900/50">
                <p className="text-sm text-slate-500">
                  {isPDF ? "PDF preview powered by browser" : isImage ? "Image preview" : ""}
                </p>

                <div className="flex items-center gap-2">
                  {previewUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenInNewTab}
                      className="border-slate-600"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open in new tab
                    </Button>
                  )}

                  <Button
                    size="sm"
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className={cn(
                      documentType === "resume"
                        ? "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
                        : "bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600"
                    )}
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
