"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { applicationsAPI } from "@/lib/api";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, Download, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

interface CSVUploadProps {
  open: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
}

// Normalized results structure for display
interface ImportResults {
  summary: {
    success_count: number;
    failed_count: number;
    duplicate_count: number;
    total_rows: number;
  };
  results: {
    failed: Array<{ row: number; error: string }>;
    duplicates: Array<{ row: number; email: string }>;
  };
  message: string;
}

export function CSVUpload({ open, onClose, onImportComplete }: CSVUploadProps) {
  const { user } = useAuthStore();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<ImportResults | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResults(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && (droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
      setFile(droppedFile);
      setResults(null);
    } else {
      toast.error("Please upload a CSV or Excel file");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    setUploading(true);
    try {
      // API returns: { imported: number; failed: number; errors: string[] }
      const { data } = await applicationsAPI.importCSV(file, user?.id);

      // Transform API response to normalized structure for display
      const normalizedResults: ImportResults = {
        summary: {
          success_count: data.imported || 0,
          failed_count: data.failed || 0,
          duplicate_count: 0, // API doesn't distinguish duplicates from failures
          total_rows: (data.imported || 0) + (data.failed || 0),
        },
        results: {
          failed: (data.errors || []).map((error: string, idx: number) => ({
            row: idx + 1,
            error: error,
          })),
          duplicates: [], // API doesn't provide duplicate info separately
        },
        message: `Imported ${data.imported || 0} applications${data.failed ? `, ${data.failed} failed` : ''}`,
      };

      setResults(normalizedResults);
      toast.success(normalizedResults.message);

      if (onImportComplete) {
        onImportComplete();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to import CSV");
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `recruiter_email,company_name,recruiter_name,position_title,position_country,position_language,recruiter_country,recruiter_language,notes
john.doe@techcorp.com,TechCorp,John Doe,Senior Engineer,USA,English,USA,English,Found on LinkedIn
jane.smith@startup.io,StartupXYZ,Jane Smith,ML Engineer,Canada,English,Canada,English,Referral from friend
recruiter@company.com,Example Inc,Hiring Manager,Full Stack Developer,UK,English,UK,English,Job posting from Indeed`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "recruiters_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setFile(null);
    setResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-blue-400" />
            Import Recruiters from CSV/Excel
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Template Download */}
          <div className="glass p-4 rounded-lg border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">Download Template</h3>
                <p className="text-slate-400 text-sm">
                  Get a sample CSV file with the correct format
                </p>
              </div>
              <Button
                variant="outline"
                onClick={downloadTemplate}
                className="border-blue-500 text-blue-400 hover:bg-blue-900/20"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
            </div>
          </div>

          {/* File Upload */}
          {!results && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />

              {file ? (
                <div className="space-y-4">
                  <FileSpreadsheet className="w-16 h-16 mx-auto text-green-400" />
                  <div>
                    <p className="text-white font-medium">{file.name}</p>
                    <p className="text-slate-400 text-sm">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReset();
                    }}
                    className="text-slate-400"
                  >
                    Choose different file
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="w-16 h-16 mx-auto text-slate-400" />
                  <div>
                    <p className="text-white font-medium">
                      Drop your CSV or Excel file here
                    </p>
                    <p className="text-slate-400 text-sm">
                      or click to browse
                    </p>
                  </div>
                  <p className="text-xs text-slate-500">
                    Supported formats: .csv, .xlsx, .xls
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Upload Button */}
          {file && !results && (
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Recruiters
                </>
              )}
            </Button>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="glass p-4 rounded-lg border border-green-700/30">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {results.summary.success_count}
                      </p>
                      <p className="text-sm text-slate-400">Created</p>
                    </div>
                  </div>
                </div>

                <div className="glass p-4 rounded-lg border border-red-700/30">
                  <div className="flex items-center gap-3">
                    <XCircle className="w-8 h-8 text-red-400" />
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {results.summary.failed_count}
                      </p>
                      <p className="text-sm text-slate-400">Failed</p>
                    </div>
                  </div>
                </div>

                <div className="glass p-4 rounded-lg border border-yellow-700/30">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-8 h-8 text-yellow-400" />
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {results.summary.duplicate_count}
                      </p>
                      <p className="text-sm text-slate-400">Duplicates</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Results */}
              <div className="glass p-4 rounded-lg border border-slate-700 max-h-60 overflow-y-auto">
                <h4 className="text-white font-medium mb-3">Import Details</h4>

                {results.results.failed.length > 0 && (
                  <div className="mb-4">
                    <p className="text-red-400 text-sm font-medium mb-2">Failed Rows:</p>
                    {results.results.failed.slice(0, 10).map((item, idx) => (
                      <p key={idx} className="text-xs text-slate-400 mb-1">
                        Row {item.row}: {item.error}
                      </p>
                    ))}
                    {results.results.failed.length > 10 && (
                      <p className="text-xs text-slate-500 mt-2">
                        ... and {results.results.failed.length - 10} more errors
                      </p>
                    )}
                  </div>
                )}

                {results.results.duplicates.length > 0 && (
                  <div>
                    <p className="text-yellow-400 text-sm font-medium mb-2">Duplicate Rows:</p>
                    {results.results.duplicates.slice(0, 10).map((item, idx) => (
                      <p key={idx} className="text-xs text-slate-400 mb-1">
                        Row {item.row}: {item.email} already exists
                      </p>
                    ))}
                    {results.results.duplicates.length > 10 && (
                      <p className="text-xs text-slate-500 mt-2">
                        ... and {results.results.duplicates.length - 10} more duplicates
                      </p>
                    )}
                  </div>
                )}

                {results.summary.success_count > 0 && (
                  <p className="text-green-400 text-sm">
                    Successfully imported {results.summary.success_count} recruiters
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="flex-1 border-slate-600 text-slate-300"
                >
                  Import Another File
                </Button>
                <Button
                  onClick={onClose}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  Done
                </Button>
              </div>
            </div>
          )}

          {/* Required Columns Info */}
          {!results && (
            <div className="glass p-4 rounded-lg border border-slate-700">
              <h4 className="text-white font-medium mb-2">Required Columns</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-green-400">✓ recruiter_email *</div>
                <div className="text-green-400">✓ company_name *</div>
                <div className="text-slate-400">recruiter_name</div>
                <div className="text-slate-400">position_title</div>
                <div className="text-slate-400">position_country</div>
                <div className="text-slate-400">position_language</div>
                <div className="text-slate-400">recruiter_country</div>
                <div className="text-slate-400">recruiter_language</div>
                <div className="text-slate-400">notes</div>
              </div>
              <p className="text-xs text-slate-500 mt-2">* Required columns</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
