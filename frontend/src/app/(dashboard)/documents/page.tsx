"use client";

/**
 * DOCUMENTS PAGE - Ultimate Document Management Experience
 *
 * Features:
 * - Beautiful grid layout with animated cards
 * - Dual tab system for Resumes and Info Docs
 * - Quick upload buttons with visual feedback
 * - Detailed viewer dialogs for parsed data
 * - Search and filter capabilities
 * - Confidence score indicators
 * - Skills preview on resume cards
 * - Pricing preview on info doc cards
 */

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Plus,
  Star,
  Trash2,
  Calendar,
  BarChart3,
  Sparkles,
  Building2,
  Briefcase,
  ChevronRight,
  Download,
  Upload,
  Search,
  Filter,
  Grid3X3,
  List,
  Eye,
  Package,
  DollarSign,
  Users,
  Zap,
  CheckCircle,
  TrendingUp,
  ArrowUpRight,
  MoreVertical,
  FolderOpen,
  FileUp,
  Award,
  Globe,
  Check,
  Square,
  CheckSquare,
  X,
  FileJson,
  FileSpreadsheet,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { documentsAPI } from "@/lib/api";
import { toast } from "sonner";
import ResumeUploadDialog from "@/components/documents/ResumeUploadDialog";
import InfoDocUploadDialog from "@/components/documents/InfoDocUploadDialog";
import ResumeViewerDialog from "@/components/documents/ResumeViewerDialog";
import InfoDocViewerDialog from "@/components/documents/InfoDocViewerDialog";
import DeleteConfirmDialog from "@/components/documents/DeleteConfirmDialog";
import DocumentPreviewDialog from "@/components/documents/DocumentPreviewDialog";
import type { ParsedResume, CompanyInfoDoc } from "@/types";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";

type TabValue = "resumes" | "info-docs";
type ViewMode = "grid" | "list";

interface Resume {
  id: number;
  name: string;
  description?: string;
  filename: string;
  file_path: string;
  file_size?: number;
  target_position?: string;
  is_default: boolean;
  is_active: boolean;
  times_used: number;
  parsing_confidence_score?: number;
  last_used_at?: string;
  created_at: string;
  updated_at?: string;
  parsed_data?: ParsedResume;
}

interface InfoDoc {
  id: number;
  name: string;
  description?: string;
  filename: string;
  doc_type?: string;
  company_name?: string;
  tagline?: string;
  industry?: string;
  is_default: boolean;
  is_active: boolean;
  times_used: number;
  parsing_confidence_score?: number;
  products_services_count?: number;
  last_used_at?: string;
  created_at?: string;
  // Full data when selected
  products_services?: any[];
  key_benefits?: string[];
  unique_selling_points?: string[];
  problem_solved?: string;
  pricing_tiers?: any[];
  contact_info?: any;
  team_members?: any[];
  word_count?: number;
}

// Loading fallback component
function DocumentsPageLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8 flex items-center justify-center">
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="inline-block mb-4"
        >
          <FileText className="w-12 h-12 text-blue-400" />
        </motion.div>
        <p className="text-slate-400">Loading documents...</p>
      </div>
    </div>
  );
}

// Main page component wrapped with Suspense
export default function DocumentsPage() {
  return (
    <Suspense fallback={<DocumentsPageLoading />}>
      <DocumentsPageContent />
    </Suspense>
  );
}

// Inner content component that uses useSearchParams
function DocumentsPageContent() {
  const searchParams = useSearchParams();
  const uploadType = searchParams.get("upload");

  const [activeTab, setActiveTab] = useState<TabValue>("resumes");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [infoDocs, setInfoDocs] = useState<InfoDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResumeUpload, setShowResumeUpload] = useState(false);
  const [showInfoDocUpload, setShowInfoDocUpload] = useState(false);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [selectedInfoDoc, setSelectedInfoDoc] = useState<InfoDoc | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "resume" | "info-doc";
    id: number;
    name: string;
    additionalInfo?: string;
  } | null>(null);

  // Bulk selection state
  const [selectedResumeIds, setSelectedResumeIds] = useState<Set<number>>(new Set());
  const [selectedInfoDocIds, setSelectedInfoDocIds] = useState<Set<number>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkExporting, setBulkExporting] = useState(false);

  // Document preview state
  const [previewDocument, setPreviewDocument] = useState<{
    type: "resume" | "info-doc";
    id: number;
    name: string;
    filename: string;
  } | null>(null);

  // Handle URL params for direct upload
  useEffect(() => {
    if (uploadType === "resume") {
      setActiveTab("resumes");
      setShowResumeUpload(true);
    } else if (uploadType === "info") {
      setActiveTab("info-docs");
      setShowInfoDocUpload(true);
    }
  }, [uploadType]);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const [resumesRes, infoDocsRes] = await Promise.all([
        documentsAPI.listResumes({ include_parsed: true }),
        documentsAPI.listInfoDocs(),
      ]);

      setResumes(resumesRes.data.resumes || []);
      setInfoDocs(infoDocsRes.data.info_docs || []);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectResume = async (resume: Resume) => {
    setLoadingDetail(true);
    try {
      // Fetch full resume details with parsed data
      const response = await documentsAPI.getResume(resume.id);
      setSelectedResume(response.data);
    } catch (error) {
      console.error("Failed to fetch resume details:", error);
      // Fall back to existing data
      setSelectedResume(resume);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSelectInfoDoc = async (doc: InfoDoc) => {
    setLoadingDetail(true);
    try {
      // Fetch full info doc details
      const response = await documentsAPI.getInfoDoc(doc.id);
      // Map CompanyInfoDoc to InfoDoc with default values for required fields
      const data = response.data;
      setSelectedInfoDoc({
        ...data,
        is_default: data.is_default ?? false,
        is_active: data.is_active ?? true,
        times_used: data.times_used ?? 0,
      });
    } catch (error) {
      console.error("Failed to fetch info doc details:", error);
      // Fall back to existing data
      setSelectedInfoDoc(doc);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDeleteResume = (resume: Resume, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget({
      type: "resume",
      id: resume.id,
      name: resume.name,
      additionalInfo: resume.target_position || resume.filename,
    });
  };

  const handleDeleteInfoDoc = (doc: InfoDoc, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget({
      type: "info-doc",
      id: doc.id,
      name: doc.name,
      additionalInfo: doc.company_name || doc.filename,
    });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === "resume") {
        await documentsAPI.deleteResume(deleteTarget.id);
        toast.success("Resume deleted successfully");
      } else {
        await documentsAPI.deleteInfoDoc(deleteTarget.id);
        toast.success("Document deleted successfully");
      }
      fetchDocuments();
    } catch (error) {
      console.error("Failed to delete:", error);
      toast.error(`Failed to delete ${deleteTarget.type === "resume" ? "resume" : "document"}`);
      throw error; // Re-throw to keep dialog open on error
    }
  };

  // Bulk selection handlers
  const toggleResumeSelection = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedResumeIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleInfoDocSelection = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedInfoDocIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAllResumes = () => {
    if (selectedResumeIds.size === filteredResumes.length) {
      setSelectedResumeIds(new Set());
    } else {
      setSelectedResumeIds(new Set(filteredResumes.map(r => r.id)));
    }
  };

  const selectAllInfoDocs = () => {
    if (selectedInfoDocIds.size === filteredInfoDocs.length) {
      setSelectedInfoDocIds(new Set());
    } else {
      setSelectedInfoDocIds(new Set(filteredInfoDocs.map(d => d.id)));
    }
  };

  const clearSelection = () => {
    setSelectedResumeIds(new Set());
    setSelectedInfoDocIds(new Set());
  };

  // Bulk delete handler
  const handleBulkDelete = async () => {
    const ids = activeTab === "resumes" ? selectedResumeIds : selectedInfoDocIds;
    if (ids.size === 0) return;

    setBulkDeleting(true);
    try {
      const deletePromises = Array.from(ids).map(id =>
        activeTab === "resumes"
          ? documentsAPI.deleteResume(id)
          : documentsAPI.deleteInfoDoc(id)
      );

      await Promise.all(deletePromises);
      toast.success(`${ids.size} ${activeTab === "resumes" ? "resumes" : "documents"} deleted successfully`);
      clearSelection();
      fetchDocuments();
    } catch (error) {
      console.error("Bulk delete failed:", error);
      toast.error("Some items could not be deleted");
    } finally {
      setBulkDeleting(false);
    }
  };

  // Export handlers
  const exportToJSON = async () => {
    setBulkExporting(true);
    try {
      let dataToExport: any[] = [];

      if (activeTab === "resumes") {
        const ids = selectedResumeIds.size > 0 ? selectedResumeIds : new Set(resumes.map(r => r.id));
        dataToExport = resumes.filter(r => ids.has(r.id));
      } else {
        const ids = selectedInfoDocIds.size > 0 ? selectedInfoDocIds : new Set(infoDocs.map(d => d.id));
        dataToExport = infoDocs.filter(d => ids.has(d.id));
      }

      const json = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeTab}-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${dataToExport.length} ${activeTab === "resumes" ? "resumes" : "documents"} to JSON`);
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export data");
    } finally {
      setBulkExporting(false);
    }
  };

  const exportToCSV = async () => {
    setBulkExporting(true);
    try {
      let dataToExport: any[] = [];
      let headers: string[] = [];
      let rows: string[][] = [];

      if (activeTab === "resumes") {
        const ids = selectedResumeIds.size > 0 ? selectedResumeIds : new Set(resumes.map(r => r.id));
        dataToExport = resumes.filter(r => ids.has(r.id));
        headers = ["ID", "Name", "Target Position", "Confidence Score", "Times Used", "Created At"];
        rows = dataToExport.map(r => [
          r.id.toString(),
          r.name,
          r.target_position || "",
          (r.parsing_confidence_score || 0).toFixed(0) + "%",
          r.times_used.toString(),
          formatDate(r.created_at),
        ]);
      } else {
        const ids = selectedInfoDocIds.size > 0 ? selectedInfoDocIds : new Set(infoDocs.map(d => d.id));
        dataToExport = infoDocs.filter(d => ids.has(d.id));
        headers = ["ID", "Name", "Company", "Industry", "Type", "Confidence Score", "Times Used", "Created At"];
        rows = dataToExport.map(d => [
          d.id.toString(),
          d.name,
          d.company_name || "",
          d.industry || "",
          d.doc_type || "",
          (d.parsing_confidence_score || 0).toFixed(0) + "%",
          d.times_used.toString(),
          formatDate(d.created_at),
        ]);
      }

      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeTab}-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${dataToExport.length} ${activeTab === "resumes" ? "resumes" : "documents"} to CSV`);
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export data");
    } finally {
      setBulkExporting(false);
    }
  };

  // Preview handlers
  const handleViewResumeOriginal = () => {
    if (selectedResume) {
      setPreviewDocument({
        type: "resume",
        id: selectedResume.id,
        name: selectedResume.name,
        filename: selectedResume.filename,
      });
    }
  };

  const handleViewInfoDocOriginal = () => {
    if (selectedInfoDoc) {
      setPreviewDocument({
        type: "info-doc",
        id: selectedInfoDoc.id,
        name: selectedInfoDoc.name,
        filename: selectedInfoDoc.filename,
      });
    }
  };

  const handleSetDefaultResume = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await documentsAPI.setDefaultResume(id);
      toast.success("Default resume updated");
      fetchDocuments();
    } catch (error) {
      console.error("Failed to set default:", error);
      toast.error("Failed to set default");
    }
  };

  const handleSetDefaultInfoDoc = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await documentsAPI.setDefaultInfoDoc(id);
      toast.success("Default info doc updated");
      fetchDocuments();
    } catch (error) {
      console.error("Failed to set default:", error);
      toast.error("Failed to set default");
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  };

  const getDocTypeConfig = (type?: string) => {
    const configs: Record<string, { icon: any; color: string; label: string; bg: string }> = {
      product: { icon: Package, color: "text-blue-400", label: "Product", bg: "bg-blue-500/10" },
      service: { icon: Briefcase, color: "text-purple-400", label: "Service", bg: "bg-purple-500/10" },
      company: { icon: Building2, color: "text-green-400", label: "Company", bg: "bg-green-500/10" },
      portfolio: { icon: Award, color: "text-orange-400", label: "Portfolio", bg: "bg-orange-500/10" },
    };
    return configs[type || "company"] || configs.company;
  };

  const getConfidenceColor = (score?: number) => {
    if (!score) return "text-slate-500";
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getConfidenceBg = (score?: number) => {
    if (!score) return "bg-slate-500";
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Filter documents based on search
  const filteredResumes = resumes.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.target_position?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInfoDocs = infoDocs.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25"
              >
                <FolderOpen className="w-8 h-8 text-white" />
              </motion.div>
              Document Management
            </h1>
            <p className="text-slate-400">
              Manage your resumes and company/service documentation for AI-powered email generation
            </p>
          </div>

          {/* Quick Upload Buttons */}
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowResumeUpload(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium shadow-lg shadow-blue-500/25 transition-all"
            >
              <FileUp className="w-4 h-4" />
              Upload Resume
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowInfoDocUpload(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-medium shadow-lg shadow-purple-500/25 transition-all"
            >
              <FileUp className="w-4 h-4" />
              Upload Info Doc
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      >
        <div className="p-4 rounded-xl bg-slate-800/30 backdrop-blur-sm border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{resumes.length}</p>
              <p className="text-xs text-slate-400">Resumes</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-slate-800/30 backdrop-blur-sm border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Building2 className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{infoDocs.length}</p>
              <p className="text-xs text-slate-400">Info Docs</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-slate-800/30 backdrop-blur-sm border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {resumes.reduce((sum, r) => sum + r.times_used, 0) +
                 infoDocs.reduce((sum, d) => sum + d.times_used, 0)}
              </p>
              <p className="text-xs text-slate-400">Total Uses</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-slate-800/30 backdrop-blur-sm border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Star className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {resumes.filter(r => r.is_default).length + infoDocs.filter(d => d.is_default).length}
              </p>
              <p className="text-xs text-slate-400">Defaults Set</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs & Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
      >
        {/* Tabs */}
        <div className="flex gap-2 bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-1">
          <button
            onClick={() => setActiveTab("resumes")}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all",
              activeTab === "resumes"
                ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg"
                : "text-slate-400 hover:text-white hover:bg-slate-700/50"
            )}
          >
            <Briefcase className="w-4 h-4" />
            Resumes
            <span className="px-2 py-0.5 bg-white/10 rounded-full text-xs">
              {resumes.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("info-docs")}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all",
              activeTab === "info-docs"
                ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg"
                : "text-slate-400 hover:text-white hover:bg-slate-700/50"
            )}
          >
            <Building2 className="w-4 h-4" />
            Info Docs
            <span className="px-2 py-0.5 bg-white/10 rounded-full text-xs">
              {infoDocs.length}
            </span>
          </button>
        </div>

        {/* Search & View Toggle */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              className="pl-10 bg-slate-800/50 border-slate-700 text-white w-64"
            />
          </div>
          <div className="flex gap-1 p-1 bg-slate-800/30 rounded-lg border border-slate-700/50">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 rounded-md transition-colors",
                viewMode === "grid" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
              )}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 rounded-md transition-colors",
                viewMode === "list" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Bulk Actions Toolbar */}
      <AnimatePresence>
        {((activeTab === "resumes" && selectedResumeIds.size > 0) ||
          (activeTab === "info-docs" && selectedInfoDocIds.size > 0)) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 rounded-xl bg-gradient-to-r from-slate-800/80 to-slate-800/50 backdrop-blur-sm border border-slate-700/50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <CheckSquare className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="font-medium text-white">
                    {activeTab === "resumes" ? selectedResumeIds.size : selectedInfoDocIds.size} selected
                  </span>
                </div>
                <button
                  onClick={activeTab === "resumes" ? selectAllResumes : selectAllInfoDocs}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {(activeTab === "resumes" && selectedResumeIds.size === filteredResumes.length) ||
                   (activeTab === "info-docs" && selectedInfoDocIds.size === filteredInfoDocs.length)
                    ? "Deselect All"
                    : "Select All"}
                </button>
                <button
                  onClick={clearSelection}
                  className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Clear
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Export Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={bulkExporting}
                      className="border-slate-600 hover:bg-slate-700/50"
                    >
                      {bulkExporting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                    <DropdownMenuItem onClick={exportToJSON} className="text-white focus:bg-slate-700">
                      <FileJson className="w-4 h-4 mr-2 text-yellow-400" />
                      Export as JSON
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportToCSV} className="text-white focus:bg-slate-700">
                      <FileSpreadsheet className="w-4 h-4 mr-2 text-green-400" />
                      Export as CSV
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Bulk Delete */}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={bulkDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {bulkDeleting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Delete Selected
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-24"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="inline-block mb-4"
              >
                <FileText className="w-12 h-12 text-blue-400" />
              </motion.div>
              <p className="text-slate-400">Loading documents...</p>
            </div>
          </motion.div>
        ) : activeTab === "resumes" ? (
          <motion.div
            key="resumes"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            {filteredResumes.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title="No Resumes Yet"
                description="Upload your first resume to get started with AI-powered email generation"
                buttonLabel="Upload Resume"
                onButtonClick={() => setShowResumeUpload(true)}
                color="blue"
              />
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResumes.map((resume, index) => (
                  <ResumeCard
                    key={resume.id}
                    resume={resume}
                    index={index}
                    onClick={() => handleSelectResume(resume)}
                    onDelete={(e) => handleDeleteResume(resume, e)}
                    onSetDefault={(e) => handleSetDefaultResume(resume.id, e)}
                    formatDate={formatDate}
                    getConfidenceColor={getConfidenceColor}
                    getConfidenceBg={getConfidenceBg}
                    isSelected={selectedResumeIds.has(resume.id)}
                    onToggleSelect={(e) => toggleResumeSelection(resume.id, e)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredResumes.map((resume, index) => (
                  <ResumeListItem
                    key={resume.id}
                    resume={resume}
                    index={index}
                    onClick={() => handleSelectResume(resume)}
                    onDelete={(e) => handleDeleteResume(resume, e)}
                    onSetDefault={(e) => handleSetDefaultResume(resume.id, e)}
                    formatDate={formatDate}
                    formatFileSize={formatFileSize}
                    getConfidenceColor={getConfidenceColor}
                    isSelected={selectedResumeIds.has(resume.id)}
                    onToggleSelect={(e) => toggleResumeSelection(resume.id, e)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="info-docs"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {filteredInfoDocs.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="No Info Docs Yet"
                description="Upload company/service documentation for marketing campaigns"
                buttonLabel="Upload Info Doc"
                onButtonClick={() => setShowInfoDocUpload(true)}
                color="purple"
              />
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredInfoDocs.map((doc, index) => (
                  <InfoDocCard
                    key={doc.id}
                    doc={doc}
                    index={index}
                    onClick={() => handleSelectInfoDoc(doc)}
                    onDelete={(e) => handleDeleteInfoDoc(doc, e)}
                    onSetDefault={(e) => handleSetDefaultInfoDoc(doc.id, e)}
                    formatDate={formatDate}
                    getDocTypeConfig={getDocTypeConfig}
                    getConfidenceColor={getConfidenceColor}
                    getConfidenceBg={getConfidenceBg}
                    isSelected={selectedInfoDocIds.has(doc.id)}
                    onToggleSelect={(e) => toggleInfoDocSelection(doc.id, e)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredInfoDocs.map((doc, index) => (
                  <InfoDocListItem
                    key={doc.id}
                    doc={doc}
                    index={index}
                    onClick={() => handleSelectInfoDoc(doc)}
                    onDelete={(e) => handleDeleteInfoDoc(doc, e)}
                    onSetDefault={(e) => handleSetDefaultInfoDoc(doc.id, e)}
                    formatDate={formatDate}
                    getDocTypeConfig={getDocTypeConfig}
                    getConfidenceColor={getConfidenceColor}
                    isSelected={selectedInfoDocIds.has(doc.id)}
                    onToggleSelect={(e) => toggleInfoDocSelection(doc.id, e)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Dialogs */}
      <ResumeUploadDialog
        open={showResumeUpload}
        onClose={() => setShowResumeUpload(false)}
        onUploadSuccess={() => {
          fetchDocuments();
        }}
      />

      <InfoDocUploadDialog
        open={showInfoDocUpload}
        onClose={() => setShowInfoDocUpload(false)}
        onUploadSuccess={() => {
          fetchDocuments();
        }}
      />

      {/* Viewer Dialogs */}
      <ResumeViewerDialog
        open={!!selectedResume}
        onClose={() => setSelectedResume(null)}
        resume={selectedResume}
        onUpdate={fetchDocuments}
        onViewOriginal={handleViewResumeOriginal}
      />

      <InfoDocViewerDialog
        open={!!selectedInfoDoc}
        onClose={() => setSelectedInfoDoc(null)}
        infoDoc={selectedInfoDoc}
        onUpdate={fetchDocuments}
        onViewOriginal={handleViewInfoDocOriginal}
      />

      {/* Document Preview Dialog */}
      <DocumentPreviewDialog
        open={!!previewDocument}
        onClose={() => setPreviewDocument(null)}
        documentType={previewDocument?.type || "resume"}
        documentId={previewDocument?.id || 0}
        documentName={previewDocument?.name || ""}
        filename={previewDocument?.filename || ""}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        documentType={deleteTarget?.type || "resume"}
        documentName={deleteTarget?.name || ""}
        additionalInfo={deleteTarget?.additionalInfo}
      />

      {/* Loading Detail Overlay */}
      <AnimatePresence>
        {loadingDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-12 h-12 text-blue-400" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Resume Card Component
function ResumeCard({
  resume,
  index,
  onClick,
  onDelete,
  onSetDefault,
  formatDate,
  getConfidenceColor,
  getConfidenceBg,
  isSelected,
  onToggleSelect
}: {
  resume: any;
  index: number;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onSetDefault: (e: React.MouseEvent) => void;
  formatDate: (d?: string) => string;
  getConfidenceColor: (s?: number) => string;
  getConfidenceBg: (s?: number) => string;
  isSelected?: boolean;
  onToggleSelect?: (e: React.MouseEvent) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={cn(
        "group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border rounded-xl p-6 hover:shadow-xl transition-all cursor-pointer",
        isSelected
          ? "border-blue-500 shadow-lg shadow-blue-500/20 ring-1 ring-blue-500/50"
          : "border-slate-700/50 hover:border-blue-500/50 hover:shadow-blue-500/10"
      )}
    >
      {/* Selection Checkbox */}
      <button
        onClick={onToggleSelect}
        className="absolute top-4 left-4 z-10 p-1 rounded-md hover:bg-slate-700/50 transition-colors"
      >
        {isSelected ? (
          <CheckSquare className="w-5 h-5 text-blue-400" />
        ) : (
          <Square className="w-5 h-5 text-slate-500 group-hover:text-slate-400" />
        )}
      </button>

      {/* Default badge */}
      {resume.is_default && (
        <div className="absolute top-4 right-4">
          <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-xs text-yellow-400 font-medium">Default</span>
          </div>
        </div>
      )}

      {/* Confidence indicator - moved down */}
      {resume.parsing_confidence_score !== undefined && (
        <div className="absolute top-12 left-4">
          <div className="flex items-center gap-1.5">
            <div className={cn("w-2 h-2 rounded-full", getConfidenceBg(resume.parsing_confidence_score))} />
            <span className={cn("text-xs font-medium", getConfidenceColor(resume.parsing_confidence_score))}>
              {resume.parsing_confidence_score?.toFixed(0)}%
            </span>
          </div>
        </div>
      )}

      <div className="flex items-start gap-4 mb-4 mt-6">
        <div className="p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl border border-blue-500/30">
          <FileText className="w-6 h-6 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white mb-1 truncate pr-8">
            {resume.name}
          </h3>
          {resume.target_position && (
            <p className="text-sm text-slate-400 truncate">{resume.target_position}</p>
          )}
        </div>
      </div>

      {resume.description && (
        <p className="text-sm text-slate-400 mb-4 line-clamp-2">
          {resume.description}
        </p>
      )}

      {/* Skills preview */}
      {resume.parsed_data?.technical_skills && resume.parsed_data.technical_skills.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {resume.parsed_data.technical_skills.slice(0, 3).map((skill: string, i: number) => (
            <span
              key={i}
              className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-md border border-blue-500/20"
            >
              {skill}
            </span>
          ))}
          {resume.parsed_data.technical_skills.length > 3 && (
            <span className="px-2 py-1 bg-slate-700/50 text-slate-400 text-xs rounded-md">
              +{resume.parsed_data.technical_skills.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {formatDate(resume.created_at)}
        </div>
        <div className="flex items-center gap-1">
          <BarChart3 className="w-3 h-3" />
          {resume.times_used} uses
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 text-blue-400 hover:bg-blue-500/10"
          onClick={(e) => { e.stopPropagation(); onClick(); }}
        >
          <Eye className="w-3 h-3 mr-1" />
          View Details
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="px-2">
              <MoreVertical className="w-4 h-4 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
            {!resume.is_default && (
              <DropdownMenuItem onClick={onSetDefault} className="text-yellow-400 focus:bg-yellow-500/10">
                <Star className="w-4 h-4 mr-2" />
                Set as Default
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator className="bg-slate-700" />
            <DropdownMenuItem onClick={onDelete} className="text-red-400 focus:bg-red-500/10">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Hover indicator */}
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight className="w-5 h-5 text-blue-400" />
      </div>
    </motion.div>
  );
}

// Resume List Item Component
function ResumeListItem({
  resume,
  index,
  onClick,
  onDelete,
  onSetDefault,
  formatDate,
  formatFileSize,
  getConfidenceColor,
  isSelected,
  onToggleSelect
}: {
  resume: any;
  index: number;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onSetDefault: (e: React.MouseEvent) => void;
  formatDate: (d?: string) => string;
  formatFileSize: (b?: number) => string;
  getConfidenceColor: (s?: number) => string;
  isSelected?: boolean;
  onToggleSelect?: (e: React.MouseEvent) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 p-4 bg-slate-800/30 backdrop-blur-sm border rounded-xl transition-all cursor-pointer",
        isSelected
          ? "border-blue-500 shadow-lg shadow-blue-500/20 ring-1 ring-blue-500/50"
          : "border-slate-700/50 hover:border-blue-500/50"
      )}
    >
      {/* Selection Checkbox */}
      <button
        onClick={onToggleSelect}
        className="p-1 rounded-md hover:bg-slate-700/50 transition-colors"
      >
        {isSelected ? (
          <CheckSquare className="w-5 h-5 text-blue-400" />
        ) : (
          <Square className="w-5 h-5 text-slate-500 hover:text-slate-400" />
        )}
      </button>

      <div className="p-2 bg-blue-500/10 rounded-lg">
        <FileText className="w-5 h-5 text-blue-400" />
      </div>

      <div className="flex-1 min-w-0 grid grid-cols-4 gap-4 items-center">
        <div className="col-span-2">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-white truncate">{resume.name}</h3>
            {resume.is_default && (
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-slate-400 truncate">{resume.target_position || resume.filename}</p>
        </div>

        <div className="text-center">
          <p className={cn("text-sm font-medium", getConfidenceColor(resume.parsing_confidence_score))}>
            {resume.parsing_confidence_score?.toFixed(0) || "N/A"}%
          </p>
          <p className="text-xs text-slate-500">Confidence</p>
        </div>

        <div className="text-right">
          <p className="text-sm text-white">{resume.times_used} uses</p>
          <p className="text-xs text-slate-500">{formatDate(resume.created_at)}</p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {!resume.is_default && (
          <Button variant="ghost" size="sm" onClick={onSetDefault} className="text-yellow-400 hover:bg-yellow-500/10">
            <Star className="w-4 h-4" />
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-400 hover:bg-red-500/10">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

// Info Doc Card Component
function InfoDocCard({
  doc,
  index,
  onClick,
  onDelete,
  onSetDefault,
  formatDate,
  getDocTypeConfig,
  getConfidenceColor,
  getConfidenceBg,
  isSelected,
  onToggleSelect
}: {
  doc: any;
  index: number;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onSetDefault: (e: React.MouseEvent) => void;
  formatDate: (d?: string) => string;
  getDocTypeConfig: (t?: string) => { icon: any; color: string; label: string; bg: string };
  getConfidenceColor: (s?: number) => string;
  getConfidenceBg: (s?: number) => string;
  isSelected?: boolean;
  onToggleSelect?: (e: React.MouseEvent) => void;
}) {
  const typeConfig = getDocTypeConfig(doc.doc_type);
  const TypeIcon = typeConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={cn(
        "group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border rounded-xl p-6 hover:shadow-xl transition-all cursor-pointer",
        isSelected
          ? "border-purple-500 shadow-lg shadow-purple-500/20 ring-1 ring-purple-500/50"
          : "border-slate-700/50 hover:border-purple-500/50 hover:shadow-purple-500/10"
      )}
    >
      {/* Selection Checkbox */}
      <button
        onClick={onToggleSelect}
        className="absolute top-4 left-4 z-10 p-1 rounded-md hover:bg-slate-700/50 transition-colors"
      >
        {isSelected ? (
          <CheckSquare className="w-5 h-5 text-purple-400" />
        ) : (
          <Square className="w-5 h-5 text-slate-500 group-hover:text-slate-400" />
        )}
      </button>

      {/* Default badge */}
      {doc.is_default && (
        <div className="absolute top-4 right-4">
          <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-xs text-yellow-400 font-medium">Default</span>
          </div>
        </div>
      )}

      {/* Confidence indicator - moved down */}
      {doc.parsing_confidence_score !== undefined && (
        <div className="absolute top-12 left-4">
          <div className="flex items-center gap-1.5">
            <div className={cn("w-2 h-2 rounded-full", getConfidenceBg(doc.parsing_confidence_score))} />
            <span className={cn("text-xs font-medium", getConfidenceColor(doc.parsing_confidence_score))}>
              {doc.parsing_confidence_score?.toFixed(0)}%
            </span>
          </div>
        </div>
      )}

      <div className="flex items-start gap-4 mb-4 mt-6">
        <div className={cn("p-3 rounded-xl border", typeConfig.bg, `border-${typeConfig.color.replace('text-', '')}/30`)}>
          <TypeIcon className={cn("w-6 h-6", typeConfig.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white mb-1 truncate pr-8">
            {doc.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className={cn("text-xs px-2 py-0.5 rounded-full capitalize", typeConfig.bg, typeConfig.color)}>
              {typeConfig.label}
            </span>
            {doc.industry && (
              <span className="text-xs text-slate-400 capitalize">{doc.industry.replace(/_/g, " ")}</span>
            )}
          </div>
        </div>
      </div>

      {/* Company Name & Tagline */}
      {doc.company_name && (
        <div className="mb-4">
          <p className="text-sm font-medium text-white">{doc.company_name}</p>
          {doc.tagline && (
            <p className="text-xs text-slate-400 italic truncate">"{doc.tagline}"</p>
          )}
        </div>
      )}

      {/* Preview stats */}
      <div className="flex items-center gap-4 mb-4">
        {doc.products_services_count !== undefined && doc.products_services_count > 0 && (
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Package className="w-3 h-3 text-blue-400" />
            <span>{doc.products_services_count} products</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {formatDate(doc.created_at)}
        </div>
        <div className="flex items-center gap-1">
          <BarChart3 className="w-3 h-3" />
          {doc.times_used} uses
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 text-purple-400 hover:bg-purple-500/10"
          onClick={(e) => { e.stopPropagation(); onClick(); }}
        >
          <Eye className="w-3 h-3 mr-1" />
          View Details
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="px-2">
              <MoreVertical className="w-4 h-4 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
            {!doc.is_default && (
              <DropdownMenuItem onClick={onSetDefault} className="text-yellow-400 focus:bg-yellow-500/10">
                <Star className="w-4 h-4 mr-2" />
                Set as Default
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator className="bg-slate-700" />
            <DropdownMenuItem onClick={onDelete} className="text-red-400 focus:bg-red-500/10">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Hover indicator */}
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight className="w-5 h-5 text-purple-400" />
      </div>
    </motion.div>
  );
}

// Info Doc List Item Component
function InfoDocListItem({
  doc,
  index,
  onClick,
  onDelete,
  onSetDefault,
  formatDate,
  getDocTypeConfig,
  getConfidenceColor,
  isSelected,
  onToggleSelect
}: {
  doc: any;
  index: number;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onSetDefault: (e: React.MouseEvent) => void;
  formatDate: (d?: string) => string;
  getDocTypeConfig: (t?: string) => { icon: any; color: string; label: string; bg: string };
  getConfidenceColor: (s?: number) => string;
  isSelected?: boolean;
  onToggleSelect?: (e: React.MouseEvent) => void;
}) {
  const typeConfig = getDocTypeConfig(doc.doc_type);
  const TypeIcon = typeConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 p-4 bg-slate-800/30 backdrop-blur-sm border rounded-xl transition-all cursor-pointer",
        isSelected
          ? "border-purple-500 shadow-lg shadow-purple-500/20 ring-1 ring-purple-500/50"
          : "border-slate-700/50 hover:border-purple-500/50"
      )}
    >
      {/* Selection Checkbox */}
      <button
        onClick={onToggleSelect}
        className="p-1 rounded-md hover:bg-slate-700/50 transition-colors"
      >
        {isSelected ? (
          <CheckSquare className="w-5 h-5 text-purple-400" />
        ) : (
          <Square className="w-5 h-5 text-slate-500 hover:text-slate-400" />
        )}
      </button>

      <div className={cn("p-2 rounded-lg", typeConfig.bg)}>
        <TypeIcon className={cn("w-5 h-5", typeConfig.color)} />
      </div>

      <div className="flex-1 min-w-0 grid grid-cols-4 gap-4 items-center">
        <div className="col-span-2">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-white truncate">{doc.name}</h3>
            {doc.is_default && (
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-slate-400 truncate">
            {doc.company_name || typeConfig.label} {doc.industry && `• ${doc.industry}`}
          </p>
        </div>

        <div className="text-center">
          <p className={cn("text-sm font-medium", getConfidenceColor(doc.parsing_confidence_score))}>
            {doc.parsing_confidence_score?.toFixed(0) || "N/A"}%
          </p>
          <p className="text-xs text-slate-500">Confidence</p>
        </div>

        <div className="text-right">
          <p className="text-sm text-white">{doc.times_used} uses</p>
          <p className="text-xs text-slate-500">{formatDate(doc.created_at)}</p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {!doc.is_default && (
          <Button variant="ghost" size="sm" onClick={onSetDefault} className="text-yellow-400 hover:bg-yellow-500/10">
            <Star className="w-4 h-4" />
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-400 hover:bg-red-500/10">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

// Empty State Component
function EmptyState({
  icon: Icon,
  title,
  description,
  buttonLabel,
  onButtonClick,
  color
}: {
  icon: any;
  title: string;
  description: string;
  buttonLabel: string;
  onButtonClick: () => void;
  color: "blue" | "purple";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-24"
    >
      <div className={cn(
        "p-6 rounded-full mb-6",
        color === "blue" ? "bg-blue-500/10" : "bg-purple-500/10"
      )}>
        <Icon className={cn("w-16 h-16", color === "blue" ? "text-blue-400" : "text-purple-400")} />
      </div>
      <h3 className="text-2xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400 mb-6 text-center max-w-md">{description}</p>
      <Button
        onClick={onButtonClick}
        className={cn(
          "shadow-lg",
          color === "blue"
            ? "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-blue-500/25"
            : "bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-purple-500/25"
        )}
      >
        <Plus className="w-4 h-4 mr-2" />
        {buttonLabel}
      </Button>
    </motion.div>
  );
}
