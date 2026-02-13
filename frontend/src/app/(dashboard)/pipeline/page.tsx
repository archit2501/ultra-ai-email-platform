"use client";

/**
 * UNIFIED APPLICATIONS PAGE
 * Combines Applications + Pipeline into a single page with 3 view modes:
 * - Card View (original Applications)
 * - Table View (original Applications)
 * - Pipeline View (original Pipeline - Kanban with drag-and-drop)
 */

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Mail,
  FileSpreadsheet,
  Search,
  Filter,
  LayoutGrid,
  List,
  Send,
  Trash2,
  MoreVertical,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Loader2,
  Plus,
  RefreshCw,
  Download,
  Briefcase,
  Calendar,
  Building,
  StickyNote,
  ExternalLink,
  AlertCircle,
  FileText,
  Zap,
  TrendingUp,
  GripVertical,
  Kanban,
  RefreshCcw,
  Play,
  Pause,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { applicationsAPI, followUpAPI, documentsAPI, type PipelineFollowUpSummary, type FollowUpSequence } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { EmailComposer } from "@/components/EmailComposer";
import { CSVUpload } from "@/components/CSVUpload";
import { useDeleteConfirmation } from "@/components/ui/confirm-dialog";
import { FloatingGlassCard, GlassPanel } from "@/components/ui/glass-panel";
import { MLInsightsDrawer, MLInsightsButton } from "@/components/ml-analytics";
import { cn } from "@/lib/utils";

// ============ TYPES ============

interface Application {
  id: number;
  company_id?: number;
  company_name?: string;
  position_title?: string;
  recruiter_name?: string;
  recruiter_email: string;
  status: string;
  created_at: string;
  sent_at?: string | null;
  opened_at?: string | null;
  replied_at?: string | null;
  email_subject?: string;
  email_body_html?: string;
  notes?: string | null;
  priority?: number;
  is_starred?: boolean;
  response_received?: boolean;
}

interface ApplicationNote {
  id: number;
  content: string;
  note_type: string;
  created_at: string;
}

interface ApplicationHistory {
  id: number;
  field_name: string;
  old_value: string;
  new_value: string;
  note: string | null;
  change_type: string;
  created_at: string;
}

interface ResumeOption {
  id: number;
  name: string;
  is_default?: boolean;
}

type ViewMode = "card" | "table" | "pipeline";

// ============ CONSTANTS ============

const statusConfig: Record<string, { color: string; label: string; icon: any }> = {
  draft: { color: "bg-slate-500", label: "Draft", icon: Clock },
  sent: { color: "bg-blue-500", label: "Sent", icon: Send },
  opened: { color: "bg-purple-500", label: "Opened", icon: Mail },
  responded: { color: "bg-green-500", label: "Responded", icon: CheckCircle },
  replied: { color: "bg-green-600", label: "Replied", icon: MessageSquare },
  interview: { color: "bg-yellow-500", label: "Interview", icon: MessageSquare },
  waiting: { color: "bg-orange-500", label: "Waiting", icon: Clock },
  offer: { color: "bg-emerald-500", label: "Offer", icon: CheckCircle },
  rejected: { color: "bg-red-500", label: "Rejected", icon: XCircle },
  accepted: { color: "bg-green-700", label: "Accepted", icon: CheckCircle },
  declined: { color: "bg-red-600", label: "Declined", icon: XCircle },
};

// Pipeline stages configuration
const PIPELINE_STAGES = [
  { key: "draft", label: "Draft", color: "from-slate-500 to-slate-600", bgColor: "bg-slate-500", icon: FileText, description: "Not yet sent" },
  { key: "sent", label: "Sent", color: "from-blue-500 to-blue-600", bgColor: "bg-blue-500", icon: Send, description: "Email sent" },
  { key: "opened", label: "Opened", color: "from-cyan-500 to-cyan-600", bgColor: "bg-cyan-500", icon: Mail, description: "Email opened" },
  { key: "responded", label: "Responded", color: "from-purple-500 to-purple-600", bgColor: "bg-purple-500", icon: AlertCircle, description: "Recruiter responded" },
  { key: "interview", label: "Interview", color: "from-amber-500 to-amber-600", bgColor: "bg-amber-500", icon: Calendar, description: "Interview scheduled" },
  { key: "offer", label: "Offer", color: "from-green-500 to-green-600", bgColor: "bg-green-500", icon: CheckCircle, description: "Offer received" },
  { key: "accepted", label: "Accepted", color: "from-emerald-500 to-emerald-600", bgColor: "bg-emerald-500", icon: TrendingUp, description: "Offer accepted" },
  { key: "rejected", label: "Rejected", color: "from-red-500 to-red-600", bgColor: "bg-red-500", icon: XCircle, description: "Application rejected" },
];

// ============ SORTABLE PIPELINE CARD ============

function SortableApplicationCard({
  app,
  onCardClick,
  onSendEmail,
  onChangeStatus,
  onStartFollowUp,
  followUpSummary,
}: {
  app: Application;
  onCardClick: (app: Application) => void;
  onSendEmail: (app: Application) => void;
  onChangeStatus: (app: Application) => void;
  onStartFollowUp: (app: Application) => void;
  followUpSummary?: PipelineFollowUpSummary;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: app.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "transition-all duration-200",
        isDragging && "opacity-50 scale-105 z-50"
      )}
    >
      <Card
        className={cn(
          "bg-slate-800/60 border-slate-700/50 hover:border-blue-500/50 transition-all cursor-pointer group backdrop-blur-sm",
          isDragging && "shadow-2xl shadow-blue-500/20 border-blue-500/50"
        )}
        onClick={() => onCardClick(app)}
      >
        <CardContent className="p-3">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-slate-700/50 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="h-4 w-4 text-slate-500" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
                  <h4 className="font-medium text-white text-xs truncate group-hover:text-blue-400 transition-colors">
                    {app.company_name || "Unknown Company"}
                  </h4>
                </div>
                {app.position_title && (
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {app.position_title}
                  </p>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCardClick(app); }}>
                    <FileText className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onChangeStatus(app); }}>
                    <Zap className="h-4 w-4 mr-2" />
                    Change Status
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSendEmail(app); }}>
                    <Send className="h-4 w-4 mr-2" />
                    Send Email
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStartFollowUp(app); }}>
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    {followUpSummary?.has_campaign ? "View Follow-Up" : "Start Follow-Up"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-1 text-xs text-slate-500">
              {app.recruiter_name && (
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{app.recruiter_name}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                <span>{new Date(app.created_at).toLocaleDateString()}</span>
              </div>
              {app.sent_at && (
                <div className="flex items-center gap-1.5 text-green-400">
                  <Send className="h-3 w-3" />
                  <span>Sent {new Date(app.sent_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              {app.is_starred && (
                <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-400">⭐</Badge>
              )}
              {app.response_received && (
                <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">✓ Reply</Badge>
              )}
              {(app.priority ?? 0) > 0 && (
                <Badge variant="outline" className="text-xs border-orange-500/30 text-orange-400">P{app.priority}</Badge>
              )}
              {followUpSummary?.has_campaign && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs gap-0.5",
                    followUpSummary.status === "active"
                      ? "border-green-500/30 text-green-400"
                      : followUpSummary.status === "pending_approval"
                      ? "border-yellow-500/30 text-yellow-400"
                      : "border-blue-500/30 text-blue-400"
                  )}
                >
                  <RefreshCcw className="h-2.5 w-2.5" />
                  {followUpSummary.current_step}/{followUpSummary.total_steps}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Drag Overlay Card
function DragOverlayCard({ app }: { app: Application }) {
  return (
    <Card className="bg-slate-800/90 border-blue-500 shadow-2xl shadow-blue-500/30 backdrop-blur-xl w-[250px]">
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
            {app.company_name?.charAt(0)?.toUpperCase() || "C"}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-white text-sm truncate">{app.company_name}</h4>
            <p className="text-xs text-slate-400 truncate">{app.position_title}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============ MAIN COMPONENT ============

export default function ApplicationsPage() {
  const { user } = useAuthStore();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [mlDrawerOpen, setMlDrawerOpen] = useState(false);

  // Dialogs
  const [composerOpen, setComposerOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [bulkSendOpen, setBulkSendOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);

  // Bulk send state
  const [bulkSending, setBulkSending] = useState(false);

  // Pipeline states
  const [activeApp, setActiveApp] = useState<Application | null>(null);
  const [newNote, setNewNote] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [appNotes, setAppNotes] = useState<ApplicationNote[]>([]);
  const [appHistory, setAppHistory] = useState<ApplicationHistory[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Follow-up states
  const [sequences, setSequences] = useState<FollowUpSequence[]>([]);
  const [selectedSequence, setSelectedSequence] = useState<number | null>(null);
  const [autoMode, setAutoMode] = useState(false);
  const [startingFollowUp, setStartingFollowUp] = useState(false);
  const [followUpSummaries, setFollowUpSummaries] = useState<Record<number, PipelineFollowUpSummary>>({});

  // Resume selection for new applications
  const [availableResumes, setAvailableResumes] = useState<ResumeOption[]>([]);

  // Confirmation dialog for deletes
  const { confirmDelete, ConfirmDialog } = useDeleteConfirmation();

  // Form state for creating application
  const [formData, setFormData] = useState({
    company_name: "",
    recruiter_email: "",
    recruiter_name: "",
    position_title: "",
    notes: "",
    resume_id: null as number | null,
  });

  // DnD Sensors for Pipeline view
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // ============ DATA FETCHING ============

  useEffect(() => {
    fetchApplications();
    fetchSequences();
    fetchResumes();
  }, [user]);

  const fetchResumes = async () => {
    try {
      const response = await documentsAPI.listResumes();
      const resumes: ResumeOption[] = (response.data?.resumes || []).map((r: any) => ({
        id: r.id,
        name: r.name || `Resume ${r.id}`,
        is_default: r.is_default,
      }));
      setAvailableResumes(resumes);

      // Set default resume if available and no resume selected
      const defaultResume = resumes.find((r) => r.is_default);
      if (defaultResume) {
        setFormData((prev) => ({ ...prev, resume_id: prev.resume_id || defaultResume.id }));
      }
    } catch (error) {
      console.error("Failed to fetch resumes:", error);
    }
  };

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await applicationsAPI.getAll();
      setApplications(data);
    } catch (error: any) {
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSequences = async () => {
    try {
      const res = await followUpAPI.getSequences(true);
      const payload = res?.data as any;
      const items = Array.isArray(payload) ? payload : payload?.items;
      const normalized = Array.isArray(items)
        ? items.map((seq: any) => ({
            ...seq,
            is_preset: seq.is_preset ?? seq.is_system_preset ?? false,
            steps: seq.steps ?? [],
          }))
        : [];
      setSequences(normalized);
    } catch (error) {
      console.error("Failed to fetch sequences:", error);
    }
  };

  // Fetch follow-up summaries for pipeline view
  useEffect(() => {
    if (viewMode !== "pipeline") return;

    const idsToFetch = applications
      .filter((app) => !followUpSummaries[app.id])
      .map((app) => app.id);

    if (idsToFetch.length === 0) return;

    const fetchBatch = async () => {
      const results = await Promise.allSettled(
        idsToFetch.map((id) =>
          followUpAPI.getPipelineFollowUpSummary(id).then((res) => ({ id, data: res.data }))
        )
      );

      const newSummaries: Record<number, PipelineFollowUpSummary> = {};
      results.forEach((result) => {
        if (result.status === "fulfilled") {
          newSummaries[result.value.id] = result.value.data;
        }
      });

      if (Object.keys(newSummaries).length > 0) {
        setFollowUpSummaries((prev) => ({ ...prev, ...newSummaries }));
      }
    };

    fetchBatch();
  }, [applications, viewMode]);

  // ============ CRUD HANDLERS ============

  const handleCreate = async () => {
    try {
      // Validate required fields
      if (!formData.company_name?.trim()) {
        toast.error("Company name is required");
        return;
      }
      if (!formData.recruiter_email?.trim()) {
        toast.error("Recruiter email is required");
        return;
      }
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.recruiter_email)) {
        toast.error("Please enter a valid email address");
        return;
      }
      if (!formData.position_title?.trim()) {
        toast.error("Position title is required");
        return;
      }

      // Only include resume_id if selected
      const payload = {
        ...formData,
        resume_id: formData.resume_id || undefined,
      };
      await applicationsAPI.create(payload);
      toast.success("Application created successfully!");
      setCreateOpen(false);

      // Reset form with default resume if available
      const defaultResume = availableResumes.find((r) => r.is_default);
      setFormData({
        company_name: "",
        recruiter_email: "",
        recruiter_name: "",
        position_title: "",
        notes: "",
        resume_id: defaultResume?.id || null,
      });
      fetchApplications();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to create application");
    }
  };

  const handleDelete = async (id: number, companyName?: string) => {
    const confirmed = await confirmDelete(companyName || `Application #${id}`, "application");
    if (!confirmed) return;

    try {
      await applicationsAPI.delete(id);
      toast.success("Application deleted");
      fetchApplications();
    } catch (error: any) {
      toast.error("Failed to delete application");
    }
  };

  const handleBulkDelete = async () => {
    const confirmed = await confirmDelete(`${selectedIds.length} applications`, "applications");
    if (!confirmed) return;

    try {
      await Promise.all(selectedIds.map((id) => applicationsAPI.delete(id)));
      toast.success(`Deleted ${selectedIds.length} applications`);
      setSelectedIds([]);
      fetchApplications();
    } catch (error: any) {
      toast.error("Failed to delete applications");
    }
  };

  const handleBulkSend = async () => {
    setBulkSending(true);
    try {
      const payload = { application_ids: selectedIds, delay_seconds: 60 };
      const { data } = await applicationsAPI.sendBulk(payload);
      toast.success(`Sent ${data.summary.sent} emails! Failed: ${data.summary.failed}, Skipped: ${data.summary.skipped}`);
      setSelectedIds([]);
      setBulkSendOpen(false);
      fetchApplications();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to send emails");
    } finally {
      setBulkSending(false);
    }
  };

  // ============ PIPELINE HANDLERS ============

  const handleDragStart = (event: DragStartEvent) => {
    const app = applications.find((a) => a.id === event.active.id);
    setActiveApp(app || null);
  };

  const handleDragOver = (event: DragOverEvent) => {};

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveApp(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    const newStatusKey = PIPELINE_STAGES.find((s) => s.key === overId)?.key;

    if (newStatusKey) {
      const app = applications.find((a) => a.id === activeId);
      if (app && app.status !== newStatusKey) {
        setApplications((prev) =>
          prev.map((a) => (a.id === activeId ? { ...a, status: newStatusKey } : a))
        );

        try {
          await applicationsAPI.updateStatus(Number(activeId), { status: newStatusKey });
          toast.success(`Moved to ${newStatusKey}`);
        } catch (error) {
          setApplications((prev) =>
            prev.map((a) => (a.id === activeId ? { ...a, status: app.status } : a))
          );
          toast.error("Failed to update status");
        }
      }
    }
  };

  const handleCardClick = async (app: Application) => {
    setSelectedApp(app);
    setDetailModalOpen(true);
    setLoadingDetails(true);

    try {
      const [notesRes, historyRes] = await Promise.all([
        applicationsAPI.getNotes(app.id),
        applicationsAPI.getHistory(app.id),
      ]);
      setAppNotes(notesRes.data);
      setAppHistory(historyRes.data);
    } catch (error) {
      toast.error("Failed to load application details");
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleAddNote = async () => {
    if (!selectedApp || !newNote.trim()) return;

    try {
      const res = await applicationsAPI.addNote(selectedApp.id, { content: newNote, note_type: "general" });
      setAppNotes([res.data, ...appNotes]);
      setNewNote("");
      setNoteModalOpen(false);
      toast.success("Note added successfully");
    } catch (error: any) {
      toast.error("Failed to add note");
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedApp || !newStatus) return;

    try {
      await applicationsAPI.updateStatus(selectedApp.id, { status: newStatus, note: statusNote || undefined });
      setApplications(applications.map(app =>
        app.id === selectedApp.id ? { ...app, status: newStatus } : app
      ));
      setSelectedApp({ ...selectedApp, status: newStatus });
      setNewStatus("");
      setStatusNote("");
      setStatusModalOpen(false);
      setDetailModalOpen(false);
      toast.success(`Status updated to ${newStatus}`);
    } catch (error: any) {
      toast.error("Failed to update status");
    }
  };

  const handleSendEmail = async (app: Application) => {
    try {
      await applicationsAPI.sendEmail(app.id, {});
      toast.success("Email sent successfully!");
      fetchApplications();
    } catch (error: any) {
      toast.error("Failed to send email");
    }
  };

  const handleStartFollowUp = async () => {
    if (!selectedApp || !selectedSequence) return;

    setStartingFollowUp(true);
    try {
      await followUpAPI.startCampaign({
        application_id: selectedApp.id,
        sequence_id: selectedSequence,
        auto_mode: autoMode,
      });
      toast.success(autoMode ? "Follow-up campaign started with auto-mode!" : "Follow-up campaign started!");
      setFollowUpModalOpen(false);
      setSelectedSequence(null);
      setAutoMode(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to start follow-up campaign");
    } finally {
      setStartingFollowUp(false);
    }
  };

  // ============ SELECTION HANDLERS ============

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedIds(
      selectedIds.length === filteredApplications.length
        ? []
        : filteredApplications.map((app) => app.id)
    );
  };

  // ============ FILTERING ============

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      searchQuery === "" ||
      app.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.position_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.recruiter_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.recruiter_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === "all" || app.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getApplicationsByStage = useCallback((stage: string) => {
    return applications.filter((app) => {
      const matchesStage = app.status.toLowerCase() === stage.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        app.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.position_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.recruiter_name?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStage && matchesSearch;
    });
  }, [applications, searchQuery]);

  // ============ CARD VIEW COMPONENT ============

  const ApplicationCard = ({ app }: { app: Application }) => {
    const StatusIcon = statusConfig[app.status]?.icon || Clock;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="glass backdrop-blur-xl bg-slate-900/50 border-slate-700 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/20">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <Checkbox
                  checked={selectedIds.includes(app.id)}
                  onCheckedChange={() => toggleSelect(app.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">{app.company_name || "Unknown Company"}</h3>
                  <p className="text-sm text-slate-400">{app.position_title || "Position not specified"}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={`${statusConfig[app.status]?.color} text-white border-0`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusConfig[app.status]?.label || app.status}
                    </Badge>
                    <span className="text-xs text-slate-500">{new Date(app.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-slate-800 border-slate-700">
                  <DropdownMenuItem
                    onClick={() => { setSelectedApp(app); setComposerOpen(true); }}
                    className="text-white hover:bg-slate-700"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Compose Email
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => { setSelectedApp(app); setStatusModalOpen(true); }}
                    className="text-white hover:bg-slate-700"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Change Status
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDelete(app.id, app.company_name)}
                    className="text-red-400 hover:bg-slate-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Recruiter:</span>
                <span className="text-white">{app.recruiter_name || "Not specified"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Email:</span>
                <span className="text-blue-400">{app.recruiter_email}</span>
              </div>
              {app.notes && (
                <div className="flex items-start gap-2">
                  <span className="text-slate-500">Notes:</span>
                  <span className="text-slate-400 text-xs">{app.notes}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                onClick={() => { setSelectedApp(app); setComposerOpen(true); }}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Mail className="w-3 h-3 mr-2" />
                {app.status === "draft" ? "Compose & Send" : "View Email"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  // ============ RENDER ============

  return (
    <div className="relative p-6 space-y-6">
      {/* Metaminds Translucent Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          className="absolute top-1/3 right-1/4 w-96 h-96 opacity-[0.02]"
          animate={{ y: [0, -30, 0], rotate: [15, 25, 15] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        >
          <Image src="/metaminds-logo.jpg" alt="" fill className="object-contain blur-sm" />
        </motion.div>
      </div>

      {/* Header */}
      <div className="relative flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            Applications
          </h1>
          <p className="text-slate-400 mt-1">
            Manage your applications and track your pipeline • {applications.length} total
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchApplications} className="border-slate-600 text-slate-300 hover:bg-slate-800">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setCsvOpen(true)} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <Button onClick={() => setCreateOpen(true)} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            New Application
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="glass backdrop-blur-xl bg-slate-900/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total</p>
                <p className="text-2xl font-bold text-white">{applications.length}</p>
              </div>
              <Mail className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass backdrop-blur-xl bg-slate-900/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Sent</p>
                <p className="text-2xl font-bold text-white">{applications.filter((a) => a.status !== "draft").length}</p>
              </div>
              <Send className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass backdrop-blur-xl bg-slate-900/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Responded</p>
                <p className="text-2xl font-bold text-white">{applications.filter((a) => a.status === "responded").length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass backdrop-blur-xl bg-slate-900/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Interview</p>
                <p className="text-2xl font-bold text-white">{applications.filter((a) => a.status === "interview").length}</p>
              </div>
              <Calendar className="w-8 h-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass backdrop-blur-xl bg-slate-900/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Selected</p>
                <p className="text-2xl font-bold text-white">{selectedIds.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & View Toggle */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search applications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {Object.entries(statusConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View Mode Toggle - Card/Table/Pipeline */}
          <TooltipProvider>
            <div className="flex gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant={viewMode === "card" ? "default" : "ghost"}
                    onClick={() => setViewMode("card")}
                    className={viewMode === "card" ? "bg-blue-600" : ""}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Card View</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant={viewMode === "table" ? "default" : "ghost"}
                    onClick={() => setViewMode("table")}
                    className={viewMode === "table" ? "bg-blue-600" : ""}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Table View</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant={viewMode === "pipeline" ? "default" : "ghost"}
                    onClick={() => setViewMode("pipeline")}
                    className={viewMode === "pipeline" ? "bg-purple-600" : ""}
                  >
                    <Kanban className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Pipeline View (Kanban)</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>

          {/* ML Insights Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  onClick={() => setMlDrawerOpen(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/25"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  ML Insights
                </Button>
              </TooltipTrigger>
              <TooltipContent>AI-powered predictions and send time optimization</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {selectedIds.length > 0 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex gap-2">
            <Button onClick={() => setBulkSendOpen(true)} className="bg-gradient-to-r from-green-600 to-emerald-600">
              <Send className="w-4 h-4 mr-2" />
              Send {selectedIds.length} Emails
            </Button>
            <Button variant="outline" onClick={handleBulkDelete} className="border-red-500 text-red-400 hover:bg-red-900/20">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete {selectedIds.length}
            </Button>
          </motion.div>
        )}
      </div>

      {/* Select All (for card/table views) */}
      {viewMode !== "pipeline" && filteredApplications.length > 0 && (
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedIds.length === filteredApplications.length}
            onCheckedChange={toggleSelectAll}
          />
          <span className="text-sm text-slate-400">
            Select all {filteredApplications.length} applications
          </span>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
        </div>
      ) : (
        <>
          {/* Card View */}
          {viewMode === "card" && (
            filteredApplications.length === 0 ? (
              <Card className="glass backdrop-blur-xl bg-slate-900/50 border-slate-700">
                <CardContent className="p-12 text-center">
                  <Mail className="w-16 h-16 mx-auto text-slate-600 mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">
                    {searchQuery || filterStatus !== "all" ? "No applications found" : "No applications yet"}
                  </h3>
                  <p className="text-slate-400 mb-6">
                    {searchQuery || filterStatus !== "all" ? "Try adjusting your filters" : "Create your first application or import from CSV"}
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button onClick={() => setCreateOpen(true)} className="bg-gradient-to-r from-blue-600 to-purple-600">
                      <Plus className="w-4 h-4 mr-2" />
                      New Application
                    </Button>
                    <Button onClick={() => setCsvOpen(true)} variant="outline" className="border-slate-600">
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      Import CSV
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {filteredApplications.map((app) => (
                    <ApplicationCard key={app.id} app={app} />
                  ))}
                </AnimatePresence>
              </div>
            )
          )}

          {/* Table View */}
          {viewMode === "table" && (
            <Card className="glass backdrop-blur-xl bg-slate-900/50 border-slate-700">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="p-4 text-left w-12">
                        <Checkbox checked={selectedIds.length === filteredApplications.length} onCheckedChange={toggleSelectAll} />
                      </th>
                      <th className="p-4 text-left text-sm text-slate-400">Company</th>
                      <th className="p-4 text-left text-sm text-slate-400">Position</th>
                      <th className="p-4 text-left text-sm text-slate-400">Recruiter</th>
                      <th className="p-4 text-left text-sm text-slate-400">Status</th>
                      <th className="p-4 text-left text-sm text-slate-400">Date</th>
                      <th className="p-4 text-left text-sm text-slate-400 w-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApplications.map((app) => {
                      const StatusIcon = statusConfig[app.status]?.icon || Clock;
                      return (
                        <tr key={app.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                          <td className="p-4">
                            <Checkbox checked={selectedIds.includes(app.id)} onCheckedChange={() => toggleSelect(app.id)} />
                          </td>
                          <td className="p-4 text-white font-medium">{app.company_name || "Unknown"}</td>
                          <td className="p-4 text-slate-400">{app.position_title || "—"}</td>
                          <td className="p-4">
                            <div>
                              <p className="text-white text-sm">{app.recruiter_name || "—"}</p>
                              <p className="text-slate-500 text-xs">{app.recruiter_email}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge className={`${statusConfig[app.status]?.color} text-white border-0`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig[app.status]?.label || app.status}
                            </Badge>
                          </td>
                          <td className="p-4 text-slate-400 text-sm">{new Date(app.created_at).toLocaleDateString()}</td>
                          <td className="p-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-slate-800 border-slate-700">
                                <DropdownMenuItem onClick={() => { setSelectedApp(app); setComposerOpen(true); }} className="text-white hover:bg-slate-700">
                                  <Mail className="w-4 h-4 mr-2" />
                                  {app.status === "draft" ? "Compose Email" : "View Email"}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setSelectedApp(app); setStatusModalOpen(true); }} className="text-white hover:bg-slate-700">
                                  <Zap className="w-4 h-4 mr-2" />
                                  Change Status
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDelete(app.id, app.company_name)} className="text-red-400 hover:bg-slate-700">
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Pipeline View (Kanban) */}
          {viewMode === "pipeline" && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4"
              >
                {PIPELINE_STAGES.map((stage, stageIndex) => {
                  const stageApplications = getApplicationsByStage(stage.key);
                  const Icon = stage.icon;

                  return (
                    <motion.div
                      key={stage.key}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + stageIndex * 0.05 }}
                      className="flex flex-col"
                      id={stage.key}
                    >
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={cn("p-1.5 rounded-lg bg-gradient-to-br", stage.color)}>
                            <Icon className="h-3.5 w-3.5 text-white" />
                          </div>
                          <h3 className="font-semibold text-white text-sm">{stage.label}</h3>
                          <Badge variant="secondary" className="ml-auto bg-slate-800 text-slate-300 border-slate-700">
                            {stageApplications.length}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mb-2">{stage.description}</p>
                        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                          <motion.div
                            className={cn("h-full", stage.bgColor)}
                            initial={{ width: 0 }}
                            animate={{
                              width: applications.length > 0
                                ? `${(stageApplications.length / applications.length) * 100}%`
                                : "0%"
                            }}
                            transition={{ duration: 0.5, delay: 0.3 + stageIndex * 0.05 }}
                          />
                        </div>
                      </div>

                      <div
                        className={cn(
                          "space-y-2 min-h-[200px] flex-1 p-2 rounded-xl border-2 border-dashed transition-colors",
                          activeApp ? "border-blue-500/50 bg-blue-500/5" : "border-transparent"
                        )}
                      >
                        <SortableContext items={stageApplications.map((a) => a.id)} strategy={verticalListSortingStrategy}>
                          <AnimatePresence mode="popLayout">
                            {stageApplications.map((app) => (
                              <SortableApplicationCard
                                key={app.id}
                                app={app}
                                onCardClick={handleCardClick}
                                onSendEmail={handleSendEmail}
                                onChangeStatus={(app) => { setSelectedApp(app); setStatusModalOpen(true); }}
                                onStartFollowUp={(app) => { setSelectedApp(app); setFollowUpModalOpen(true); }}
                                followUpSummary={followUpSummaries[app.id]}
                              />
                            ))}
                          </AnimatePresence>
                        </SortableContext>

                        {stageApplications.length === 0 && (
                          <div className="flex items-center justify-center h-24 border-2 border-dashed border-slate-700/50 rounded-lg">
                            <p className="text-slate-600 text-xs">Drop here</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>

              <DragOverlay>
                {activeApp && <DragOverlayCard app={activeApp} />}
              </DragOverlay>

              {/* Pipeline Statistics */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <FloatingGlassCard className="p-4 mt-6" hover={false}>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                    {PIPELINE_STAGES.map((stage) => {
                      const count = getApplicationsByStage(stage.key).length;
                      const percentage = applications.length > 0 ? ((count / applications.length) * 100).toFixed(1) : "0";
                      const Icon = stage.icon;

                      return (
                        <div key={stage.key} className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <div className={cn("p-1 rounded-md bg-gradient-to-br", stage.color)}>
                              <Icon className="h-3 w-3 text-white" />
                            </div>
                          </div>
                          <div className="text-2xl font-bold text-white">{count}</div>
                          <div className="text-xs text-slate-500">{percentage}%</div>
                          <div className="text-xs text-slate-400 font-medium">{stage.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </FloatingGlassCard>
              </motion.div>
            </DndContext>
          )}
        </>
      )}

      {/* ============ DIALOGS ============ */}

      {/* Create Application Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-2xl bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-2xl text-white">Create New Application</DialogTitle>
            <DialogDescription className="text-slate-400">Add a new job application to your list</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-white">Company Name *</Label>
                <Input
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="e.g., TechCorp"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-white">Position Title</Label>
                <Input
                  value={formData.position_title}
                  onChange={(e) => setFormData({ ...formData, position_title: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="e.g., Senior Engineer"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-white">Recruiter Name</Label>
                <Input
                  value={formData.recruiter_name}
                  onChange={(e) => setFormData({ ...formData, recruiter_name: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="e.g., John Smith"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-white">Recruiter Email *</Label>
                <Input
                  type="email"
                  value={formData.recruiter_email}
                  onChange={(e) => setFormData({ ...formData, recruiter_email: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="e.g., john@techcorp.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-white">Notes</Label>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="e.g., Found on LinkedIn"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-white">Resume</Label>
                <Select
                  value={formData.resume_id?.toString() || "none"}
                  onValueChange={(v) => setFormData({ ...formData, resume_id: v === "none" ? null : parseInt(v) })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Select a resume" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="none" className="text-slate-400">No resume selected</SelectItem>
                    {availableResumes.map((resume) => (
                      <SelectItem key={resume.id} value={resume.id.toString()} className="text-white hover:bg-slate-700">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-green-400" />
                          <span>{resume.name}</span>
                          {resume.is_default && (
                            <Badge className="bg-blue-500/20 text-blue-400 text-xs border-0">Default</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableResumes.length === 0 && (
                  <p className="text-xs text-slate-500">
                    No resumes uploaded yet.{" "}
                    <a href="/documents" className="text-blue-400 hover:underline">Upload one</a>
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="border-slate-600">Cancel</Button>
            <Button onClick={handleCreate} className="bg-gradient-to-r from-blue-600 to-purple-600">Create Application</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Send Confirmation */}
      <Dialog open={bulkSendOpen} onOpenChange={setBulkSendOpen}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Send {selectedIds.length} Emails?</DialogTitle>
            <DialogDescription className="text-slate-400">
              This will send emails to {selectedIds.length} recruiters with a 1-minute delay between each email.
            </DialogDescription>
          </DialogHeader>

          <div className="glass p-4 rounded-lg border border-slate-700">
            <p className="text-sm text-slate-300">Estimated time: {Math.ceil(selectedIds.length / 60)} minutes</p>
            <p className="text-xs text-slate-500 mt-2">Emails will be sent in the background with proper delays to avoid spam filters.</p>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setBulkSendOpen(false)} className="border-slate-600" disabled={bulkSending}>Cancel</Button>
            <Button onClick={handleBulkSend} disabled={bulkSending} className="bg-gradient-to-r from-green-600 to-emerald-600">
              {bulkSending ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</>) : (<><Send className="w-4 h-4 mr-2" />Send Emails</>)}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Building className="h-5 w-5 text-blue-400" />
              {selectedApp?.company_name}
            </DialogTitle>
            <DialogDescription className="text-slate-400">{selectedApp?.position_title || "No position specified"}</DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={cn("text-white", PIPELINE_STAGES.find(s => s.key === selectedApp.status.toLowerCase())?.bgColor || "bg-slate-500")}>
                  {selectedApp.status}
                </Badge>
                {selectedApp.is_starred && <span>⭐</span>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-slate-400">Recruiter</Label><p className="text-white">{selectedApp.recruiter_name || "Not specified"}</p></div>
                <div><Label className="text-slate-400">Email</Label><p className="text-white text-sm">{selectedApp.recruiter_email}</p></div>
                <div><Label className="text-slate-400">Applied</Label><p className="text-white">{new Date(selectedApp.created_at).toLocaleString()}</p></div>
                <div><Label className="text-slate-400">Priority</Label><p className="text-white">{selectedApp.priority || 0}</p></div>
              </div>

              {(selectedApp.sent_at || selectedApp.opened_at || selectedApp.replied_at) && (
                <div>
                  <Label className="text-slate-400 mb-2 block">Timeline</Label>
                  <div className="space-y-2">
                    {selectedApp.sent_at && (<div className="flex items-center gap-2 text-sm"><Send className="h-4 w-4 text-green-400" /><span className="text-slate-400">Sent:</span><span className="text-white">{new Date(selectedApp.sent_at).toLocaleString()}</span></div>)}
                    {selectedApp.opened_at && (<div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-cyan-400" /><span className="text-slate-400">Opened:</span><span className="text-white">{new Date(selectedApp.opened_at).toLocaleString()}</span></div>)}
                    {selectedApp.replied_at && (<div className="flex items-center gap-2 text-sm"><CheckCircle className="h-4 w-4 text-purple-400" /><span className="text-slate-400">Replied:</span><span className="text-white">{new Date(selectedApp.replied_at).toLocaleString()}</span></div>)}
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-slate-400">Notes</Label>
                  <Button size="sm" variant="outline" onClick={() => setNoteModalOpen(true)} className="border-slate-700"><StickyNote className="h-4 w-4 mr-2" />Add Note</Button>
                </div>
                {loadingDetails ? (<Loader2 className="h-6 w-6 animate-spin text-slate-400" />) : appNotes.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {appNotes.map((note) => (
                      <div key={note.id} className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                        <p className="text-sm text-white">{note.content}</p>
                        <p className="text-xs text-slate-500 mt-1">{new Date(note.created_at).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                ) : (<p className="text-sm text-slate-500">No notes yet</p>)}
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-700/50">
                <Button onClick={() => { setStatusModalOpen(true); setDetailModalOpen(false); }} variant="outline" className="flex-1 border-slate-700 hover:bg-slate-800"><Zap className="h-4 w-4 mr-2" />Change Status</Button>
                <Button onClick={() => handleSendEmail(selectedApp)} className="flex-1 bg-blue-600 hover:bg-blue-700"><Send className="h-4 w-4 mr-2" />Send Email</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Note Modal */}
      <Dialog open={noteModalOpen} onOpenChange={setNoteModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Add Note</DialogTitle>
            <DialogDescription className="text-slate-400">Add a note to {selectedApp?.company_name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-slate-300">Note</Label><Textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Enter your note..." rows={4} className="bg-slate-800 border-slate-700 text-white" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteModalOpen(false)} className="border-slate-700">Cancel</Button>
            <Button onClick={handleAddNote} disabled={!newNote.trim()} className="bg-blue-600 hover:bg-blue-700">Add Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Status Modal */}
      <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Change Status</DialogTitle>
            <DialogDescription className="text-slate-400">Update the status for {selectedApp?.company_name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {PIPELINE_STAGES.map((stage) => (<SelectItem key={stage.key} value={stage.key} className="text-white hover:bg-slate-700">{stage.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-slate-300">Note (Optional)</Label><Textarea value={statusNote} onChange={(e) => setStatusNote(e.target.value)} placeholder="Reason for status change..." rows={3} className="bg-slate-800 border-slate-700 text-white" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusModalOpen(false)} className="border-slate-700">Cancel</Button>
            <Button onClick={handleUpdateStatus} disabled={!newStatus} className="bg-blue-600 hover:bg-blue-700">Update Status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Follow-Up Modal */}
      <Dialog open={followUpModalOpen} onOpenChange={setFollowUpModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white"><RefreshCcw className="h-5 w-5 text-green-400" />Start Follow-Up Sequence</DialogTitle>
            <DialogDescription className="text-slate-400">Automate follow-up emails for {selectedApp?.company_name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {selectedApp && followUpSummaries[selectedApp.id]?.has_campaign ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4"><RefreshCcw className="h-8 w-8 text-green-400" /></div>
                <h3 className="text-lg font-medium text-white mb-2">Follow-Up Active</h3>
                <p className="text-slate-400 text-sm mb-4">Campaign is {followUpSummaries[selectedApp.id].status} - Step {followUpSummaries[selectedApp.id].current_step} of {followUpSummaries[selectedApp.id].total_steps}</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="text-slate-300">Select Sequence</Label>
                  <Select value={selectedSequence?.toString() || ""} onValueChange={(v) => setSelectedSequence(parseInt(v))}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="Choose a follow-up sequence" /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {sequences.length === 0 ? (<SelectItem value="none" disabled className="text-slate-500">No sequences available</SelectItem>) : sequences.map((seq) => (
                        <SelectItem key={seq.id} value={seq.id.toString()} className="text-white hover:bg-slate-700">
                          <div className="flex items-center gap-2">
                            {seq.is_preset && (<Badge className="bg-amber-500/20 text-amber-400 text-xs">Preset</Badge>)}
                            <span>{seq.name}</span>
                            <span className="text-slate-500 text-xs">({seq.steps.length} steps)</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/20"><Zap className="h-5 w-5 text-amber-400" /></div>
                    <div><Label className="text-white font-medium">Auto Mode</Label><p className="text-xs text-slate-400">Send follow-ups automatically</p></div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={autoMode} onChange={(e) => setAutoMode(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                {autoMode && (<div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg"><p className="text-xs text-amber-200"><strong>Note:</strong> You will be asked to review and approve all follow-up emails before auto-mode is enabled.</p></div>)}
              </>
            )}
          </div>

          {selectedApp && !followUpSummaries[selectedApp.id]?.has_campaign && (
            <DialogFooter>
              <Button variant="outline" onClick={() => { setFollowUpModalOpen(false); setSelectedSequence(null); setAutoMode(false); }} className="border-slate-700">Cancel</Button>
              <Button onClick={handleStartFollowUp} disabled={!selectedSequence || startingFollowUp} className="bg-green-600 hover:bg-green-700">
                {startingFollowUp ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Starting...</>) : (<><RefreshCcw className="h-4 w-4 mr-2" />Start Follow-Up</>)}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Email Composer */}
      {selectedApp && (
        <EmailComposer
          open={composerOpen}
          onClose={() => { setComposerOpen(false); setSelectedApp(null); }}
          applicationId={selectedApp.id}
          application={selectedApp}
          onEmailSent={() => { fetchApplications(); setSelectedApp(null); }}
        />
      )}

      {/* CSV Upload */}
      <CSVUpload
        open={csvOpen}
        onClose={() => setCsvOpen(false)}
        onImportComplete={() => { fetchApplications(); }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog />

      {/* ML Insights Drawer */}
      <MLInsightsDrawer
        open={mlDrawerOpen}
        onClose={() => setMlDrawerOpen(false)}
        defaultTab="predictions"
      />
    </div>
  );
}
