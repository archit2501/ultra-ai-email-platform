"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  LayoutGrid,
  List,
  Search,
  Eye,
  Edit,
  Trash2,
  Star,
  Copy,
  Plus,
  Loader2,
  RefreshCw,
  Store,
  Sparkles,
  ArrowRight,
  FileText,
  Reply,
  SendHorizonal,
  Megaphone,
  Wand2,
  Filter,
  Download,
  Upload,
  BarChart3,
  Clock,
  TrendingUp,
  Zap,
  Target,
  Globe,
  Tag,
  Workflow,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowUpDown,
  MoreVertical,
  Layers,
  GitBranch,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDeleteConfirmation } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { templatesAPI } from "@/lib/api";
import { usePageTitle, PAGE_TITLES } from "@/hooks/usePageTitle";
import type { TemplateCategory, EmailLanguage } from "@/types";
import { EmailDraftViewer } from "@/components/EmailDraftViewer";
import { IntelligentRecipientSelector } from "@/components/templates/IntelligentRecipientSelector";

// Debug logging helper
const debugLog = (action: string, data?: unknown) => {
  console.log(`[Templates] ${action}`, data ?? '');
};

interface EmailTemplate {
  id: number;
  name: string;
  category: string;
  language: string;
  targetPosition: string;
  targetCountry: string;
  isDefault: boolean;
  timesUsed: number;
  createdAt: string;
  subject: string;
  bodyPreview: string;
  body_template_html?: string;
}

// New template form state
interface NewTemplateForm {
  name: string;
  category: string;
  language: string;
  targetPosition: string;
  targetCountry: string;
  subject: string;
  body_template_html: string;
}

const initialFormState: NewTemplateForm = {
  name: "",
  category: undefined as any, // Use undefined so fallback to activeCategory works
  language: "english", // Lowercase to match backend enum
  targetPosition: "",
  targetCountry: "",
  subject: "",
  body_template_html: "",
};

// Category definitions with icons and colors
const TEMPLATE_CATEGORIES = [
  {
    id: "application",
    label: "Application",
    icon: FileText,
    color: "from-blue-500 to-cyan-600",
    bgColor: "from-blue-900/30 to-cyan-900/30",
    borderColor: "border-blue-500/30",
    description: "Job application templates for initial outreach",
    count: 0,
  },
  {
    id: "reply",
    label: "Reply",
    icon: Reply,
    color: "from-purple-500 to-pink-600",
    bgColor: "from-purple-900/30 to-pink-900/30",
    borderColor: "border-purple-500/30",
    description: "Response templates for recruiter replies",
    count: 0,
  },
  {
    id: "followup",
    label: "Follow-up",
    icon: SendHorizonal,
    color: "from-green-500 to-emerald-600",
    bgColor: "from-green-900/30 to-emerald-900/30",
    borderColor: "border-green-500/30",
    description: "Follow-up sequences and reminders",
    count: 0,
  },
  {
    id: "outreach",
    label: "Outreach",
    icon: Megaphone,
    color: "from-orange-500 to-red-600",
    bgColor: "from-orange-900/30 to-red-900/30",
    borderColor: "border-orange-500/30",
    description: "Cold outreach and networking templates",
    count: 0,
  },
  {
    id: "custom",
    label: "CUSTOM",
    icon: Wand2,
    color: "from-yellow-500 to-amber-600",
    bgColor: "from-yellow-900/30 to-amber-900/30",
    borderColor: "border-yellow-500/30",
    description: "Custom templates created by you",
    count: 0,
  },
];

export default function TemplatesPage() {
  // Set page title
  usePageTitle(PAGE_TITLES.TEMPLATES);

  const [activeCategory, setActiveCategory] = useState("application");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [searchQuery, setSearchQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTemplate, setNewTemplate] = useState<NewTemplateForm>(initialFormState);
  const [selectedTemplates, setSelectedTemplates] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filterLanguage, setFilterLanguage] = useState<string>("all");
  const [filterPosition, setFilterPosition] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");

  // Preview/Edit template states
  const [previewingTemplate, setPreviewingTemplate] = useState<EmailTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [editFormData, setEditFormData] = useState<NewTemplateForm>(initialFormState);
  const [hoveredTemplate, setHoveredTemplate] = useState<number | null>(null);

  // Email Draft Viewer states
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState<EmailTemplate | null>(null);

  // Recipient Selector states
  const [recipientSelectorOpen, setRecipientSelectorOpen] = useState(false);
  const [templateToSend, setTemplateToSend] = useState<EmailTemplate | null>(null);

  // Confirmation dialog for deletes
  const { confirmDelete, ConfirmDialog } = useDeleteConfirmation();

  // Fetch templates from API
  const fetchTemplates = useCallback(async () => {
    debugLog("fetchTemplates called");
    setLoading(true);
    setError(null);

    try {
      debugLog("fetchTemplates - Calling API");
      const response = await templatesAPI.list({ limit: 100 });
      debugLog("fetchTemplates - API response", response.data);

      // Transform API response to match our interface
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transformedTemplates: EmailTemplate[] = (response.data.items || []).map((t: any) => ({
        id: t.id as number,
        name: t.name as string || "Unnamed Template",
        category: (t.category as string || "application").toLowerCase(), // Normalize to lowercase
        language: t.language as string || "english",
        targetPosition: t.target_position as string || "",
        targetCountry: t.target_country as string || "",
        isDefault: t.is_default as boolean || false,
        timesUsed: t.times_used as number || 0,
        createdAt: t.created_at as string || new Date().toISOString(),
        subject: t.subject_template as string || "",
        bodyPreview: (t.body_template_html as string || "").substring(0, 150) + "...",
        body_template_html: t.body_template_html as string || "",
      }));

      setTemplates(transformedTemplates);
      debugLog("fetchTemplates - Templates loaded", { count: transformedTemplates.length });

      // DEBUG: Log all categories to diagnose filtering issue
      const categories = transformedTemplates.map(t => t.category);
      const uniqueCategories = Array.from(new Set(categories));
      console.log("🔍 DEBUG - All categories:", categories);
      console.log("🔍 DEBUG - Unique categories:", uniqueCategories);
      console.log("🔍 DEBUG - Templates per category:", {
        application: transformedTemplates.filter(t => t.category === "application").length,
        ai_generated: transformedTemplates.filter(t => t.category === "ai_generated").length,
        reply: transformedTemplates.filter(t => t.category === "reply").length,
        followup: transformedTemplates.filter(t => t.category === "followup").length,
        outreach: transformedTemplates.filter(t => t.category === "outreach").length,
        custom: transformedTemplates.filter(t => t.category === "custom").length,
      });
    } catch (err: unknown) {
      debugLog("fetchTemplates - Error", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load templates";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      debugLog("fetchTemplates - Complete");
    }
  }, []);

  // Load templates on mount
  useEffect(() => {
    debugLog("useEffect - Initial load");
    fetchTemplates();
  }, [fetchTemplates]);

  const handleCreate = async () => {
    debugLog("handleCreate called", newTemplate);

    if (!newTemplate.name || !newTemplate.subject) {
      debugLog("handleCreate - Validation failed");
      toast.error("Please fill in template name and subject");
      return;
    }

    try {
      debugLog("handleCreate - Calling API");

      // Explicitly use activeCategory if newTemplate.category is falsy
      const categoryToUse = newTemplate.category || activeCategory;
      debugLog("handleCreate - Using category", { newTemplate_category: newTemplate.category, activeCategory, categoryToUse });

      const response = await templatesAPI.create({
        name: newTemplate.name,
        category: categoryToUse as TemplateCategory,
        language: newTemplate.language as EmailLanguage,
        target_position: newTemplate.targetPosition,
        target_country: newTemplate.targetCountry,
        subject_template: newTemplate.subject,
        body_template_html: newTemplate.body_template_html,
      });

      debugLog("handleCreate - API response", response.data);

      // Confetti animation on success
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        // @ts-ignore
        if (typeof confetti !== 'undefined') {
          // @ts-ignore
          confetti(Object.assign({}, defaults, {
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
          }));
          // @ts-ignore
          confetti(Object.assign({}, defaults, {
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
          }));
        }
      }, 250);

      toast.success("Template created successfully! 🎉", {
        style: {
          border: "1px solid #22c55e",
          background: "#064e3b",
          color: "#dcfce7",
        },
      });

      // Reset form and close dialog
      setNewTemplate(initialFormState);
      setCreateOpen(false);

      // Refresh templates list
      await fetchTemplates();
      debugLog("handleCreate - Complete");
    } catch (err: unknown) {
      debugLog("handleCreate - Error", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to create template";
      toast.error(errorMessage);
    }
  };

  const handleSetDefault = async (id: number, name: string) => {
    debugLog("handleSetDefault called", { id, name });

    try {
      debugLog("handleSetDefault - Calling API");
      await templatesAPI.setDefault(id);
      debugLog("handleSetDefault - Success");

      toast.success(`Set "${name}" as default template`, {
        style: {
          border: "1px solid #22c55e",
          background: "#064e3b",
          color: "#dcfce7",
        },
      });

      // Refresh templates list
      await fetchTemplates();
    } catch (err: unknown) {
      debugLog("handleSetDefault - Error", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to set default";
      toast.error(errorMessage);
    }
  };

  const handleDuplicate = async (template: EmailTemplate) => {
    debugLog("handleDuplicate called", template);

    try {
      debugLog("handleDuplicate - Calling API to create copy");
      await templatesAPI.create({
        name: `${template.name} (Copy)`,
        category: (template.category || "application") as TemplateCategory,
        language: (template.language || "english") as EmailLanguage,
        target_position: template.targetPosition,
        target_country: template.targetCountry,
        subject_template: template.subject,
        body_template_html: template.body_template_html,
      });

      debugLog("handleDuplicate - Success");
      toast.info(`Duplicated "${template.name}"`, {
        style: {
          border: "1px solid #3b82f6",
          background: "#1e3a8a",
          color: "#dbeafe",
        },
      });

      // Refresh templates list
      await fetchTemplates();
    } catch (err: unknown) {
      debugLog("handleDuplicate - Error", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to duplicate template";
      toast.error(errorMessage);
    }
  };

  const handleDelete = useCallback(async (id: number, name: string) => {
    debugLog("handleDelete called", { id, name });

    const confirmed = await confirmDelete(name, "template");
    if (!confirmed) {
      debugLog("handleDelete - Cancelled by user");
      return;
    }

    try {
      debugLog("handleDelete - Calling API");
      await templatesAPI.delete(id);
      debugLog("handleDelete - Success");

      toast.error(`Deleted "${name}"`, {
        style: {
          border: "1px solid #ef4444",
          background: "#7f1d1d",
          color: "#fee2e2",
        },
      });

      // Refresh templates list
      await fetchTemplates();
    } catch (err: unknown) {
      debugLog("handleDelete - Error", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to delete template";
      toast.error(errorMessage);
    }
  }, [confirmDelete, fetchTemplates]);

  const handlePreview = (template: EmailTemplate) => {
    debugLog("handlePreview called", { id: template.id, name: template.name });
    setSelectedDraft(template);
    setViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setViewerOpen(false);
    setSelectedDraft(null);
  };

  const handleSaveDraft = async (draft: any) => {
    debugLog("handleSaveDraft called", draft);
    await handleUpdate();
  };

  const handleSendDraft = async (draft: any) => {
    debugLog("handleSendDraft called - Opening recipient selector", draft);
    // Instead of immediately sending, open the intelligent recipient selector
    setTemplateToSend(selectedDraft);
    setViewerOpen(false); // Close the draft viewer
    setRecipientSelectorOpen(true); // Open recipient selector
  };

  // Actually send the email to selected recipients
  const handleSendToRecipients = async (
    recipients: any[],
    mode: "individuals" | "groups" | "all"
  ) => {
    if (!templateToSend) return;

    debugLog("handleSendToRecipients called", {
      templateId: templateToSend.id,
      recipientCount: recipients.length,
      mode,
    });

    // TODO: Implement actual email sending via API
    // This will call the backend endpoint to send the template email to all selected recipients
    // For now, we'll simulate the send with a delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // In production, you would call something like:
    // await templatesAPI.sendToRecipients(templateToSend.id, {
    //   recipient_ids: recipients.map(r => r.id),
    //   mode: mode,
    // });

    debugLog("Email sent successfully", {
      template: templateToSend.name,
      recipients: recipients.length,
    });

    // Update template usage count
    await fetchTemplates();
  };

  const handleStartEdit = (template: EmailTemplate) => {
    debugLog("handleStartEdit called", { id: template.id, name: template.name });
    setEditingTemplate(template);
    setEditFormData({
      name: template.name,
      category: template.category,
      language: template.language,
      targetPosition: template.targetPosition,
      targetCountry: template.targetCountry,
      subject: template.subject,
      body_template_html: template.body_template_html || "",
    });
  };

  const handleUpdate = async () => {
    if (!editingTemplate) return;
    debugLog("handleUpdate called", { id: editingTemplate.id });

    try {
      await templatesAPI.update(editingTemplate.id, {
        name: editFormData.name,
        category: (editFormData.category || "application") as TemplateCategory,
        language: (editFormData.language || "english") as EmailLanguage,
        target_position: editFormData.targetPosition,
        target_country: editFormData.targetCountry,
        subject_template: editFormData.subject,
        body_template_html: editFormData.body_template_html,
      });

      debugLog("handleUpdate - Success");
      toast.success(`Updated template "${editFormData.name}"`, {
        style: {
          border: "1px solid #22c55e",
          background: "#064e3b",
          color: "#dcfce7",
        },
      });
      setEditingTemplate(null);
      await fetchTemplates();
    } catch (err: any) {
      debugLog("handleUpdate - Error", err);
      toast.error(err.response?.data?.detail || "Failed to update template");
    }
  };

  // Calculate category counts
  const categoryCounts = TEMPLATE_CATEGORIES.map(cat => ({
    ...cat,
    count: templates.filter(t => t.category === cat.id).length
  }));

  // Filter templates based on active category, search, and filters
  const filteredTemplates = templates
    .filter(template => template.category === activeCategory)
    .filter(template =>
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.targetPosition.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter(template => filterLanguage === "all" || template.language === filterLanguage)
    .filter(template => filterPosition === "all" || template.targetPosition.toLowerCase().includes(filterPosition.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "mostUsed":
          return b.timesUsed - a.timesUsed;
        case "leastUsed":
          return a.timesUsed - b.timesUsed;
        case "nameAZ":
          return a.name.localeCompare(b.name);
        case "nameZA":
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

  const currentCategory = categoryCounts.find(c => c.id === activeCategory);

  return (
    <div className="relative p-6 space-y-6">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-pink-500/10 to-orange-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog />

      {/* Header with Statistics */}
      <div className="relative">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between mb-6"
        >
          <div>
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <motion.div
                className={`p-3 rounded-xl bg-gradient-to-br ${currentCategory?.color}`}
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                {currentCategory && <currentCategory.icon className="w-8 h-8 text-white" />}
              </motion.div>
              Email Templates Hub
            </h1>
            <p className="text-slate-400 mt-2 text-lg">
              Create, manage, and organize templates across all scenarios
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={fetchTemplates}
              disabled={loading}
              className="border-slate-700 text-slate-400 hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="border-slate-700 text-slate-400 hover:text-white"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Dialog open={createOpen} onOpenChange={(open) => {
              if (open) {
                setNewTemplate(initialFormState); // Reset form when opening
              }
              setCreateOpen(open);
            }}>
              <DialogTrigger asChild>
                <Button className={`bg-gradient-to-r ${currentCategory?.color} hover:opacity-90 shadow-lg`}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Template
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-4xl bg-slate-900 border-slate-700 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl text-white flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-yellow-400" />
                    Create New Template
                  </DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Design a professional email template with AI-powered suggestions
                  </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-slate-800">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4 mt-4">
                    <div className="glass backdrop-blur-xl bg-white/5 p-6 rounded-lg space-y-4">
                      <div>
                        <label className="text-sm font-medium text-white mb-2 block">
                          Template Name
                        </label>
                        <Input
                          className="bg-slate-800 border-slate-700 text-white"
                          placeholder="e.g., Senior ML Engineer - Initial Application"
                          value={newTemplate.name}
                          onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-white mb-2 block">
                            Category
                          </label>
                          <Select
                            value={newTemplate.category || activeCategory}
                            onValueChange={(value) => setNewTemplate({ ...newTemplate, category: value })}
                          >
                            <SelectTrigger className="bg-slate-800 border-slate-700">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {TEMPLATE_CATEGORIES.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  <div className="flex items-center gap-2">
                                    <cat.icon className="w-4 h-4" />
                                    {cat.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-white mb-2 block">
                            Language
                          </label>
                          <Select
                            value={newTemplate.language}
                            onValueChange={(value) => setNewTemplate({ ...newTemplate, language: value })}
                          >
                            <SelectTrigger className="bg-slate-800 border-slate-700">
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="English">🇬🇧 English</SelectItem>
                              <SelectItem value="Hindi">🇮🇳 Hindi</SelectItem>
                              <SelectItem value="Spanish">🇪🇸 Spanish</SelectItem>
                              <SelectItem value="French">🇫🇷 French</SelectItem>
                              <SelectItem value="German">🇩🇪 German</SelectItem>
                              <SelectItem value="Chinese">🇨🇳 Chinese</SelectItem>
                              <SelectItem value="Japanese">🇯🇵 Japanese</SelectItem>
                              <SelectItem value="Korean">🇰🇷 Korean</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-white mb-2 block">
                            Target Position
                          </label>
                          <Input
                            className="bg-slate-800 border-slate-700 text-white"
                            placeholder="e.g., ML Engineer, Data Scientist"
                            value={newTemplate.targetPosition}
                            onChange={(e) => setNewTemplate({ ...newTemplate, targetPosition: e.target.value })}
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium text-white mb-2 block">
                            Target Country
                          </label>
                          <Input
                            className="bg-slate-800 border-slate-700 text-white"
                            placeholder="e.g., United States, Germany"
                            value={newTemplate.targetCountry}
                            onChange={(e) => setNewTemplate({ ...newTemplate, targetCountry: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="content" className="space-y-4 mt-4">
                    <div className="glass backdrop-blur-xl bg-white/5 p-6 rounded-lg space-y-4">
                      <div>
                        <label className="text-sm font-medium text-white mb-2 block">
                          Email Subject
                        </label>
                        <Input
                          className="bg-slate-800 border-slate-700 text-white"
                          placeholder="Application for {{position_title}} Position"
                          value={newTemplate.subject}
                          onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                        />
                        <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Available: {"{"}{"{"} position_title {"}"}{"}"},  {"{"}{"{"} company_name {"}"}{"}"},  {"{"}{"{"} recruiter_name {"}"}{"}"}
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-white mb-2 block">
                          Email Body (HTML)
                        </label>
                        <textarea
                          className="w-full h-64 bg-slate-800 border border-slate-700 text-white rounded-md p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="<p>Dear {{recruiter_name}},</p>
<p>I am writing to express my interest in the {{position_title}} position at {{company_name}}...</p>"
                          value={newTemplate.body_template_html}
                          onChange={(e) => setNewTemplate({ ...newTemplate, body_template_html: e.target.value })}
                        />
                        <p className="text-xs text-slate-400 mt-2">
                          Use Jinja2 syntax for dynamic variables
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="preview" className="space-y-4 mt-4">
                    <div className="glass backdrop-blur-xl bg-white/5 p-6 rounded-lg">
                      <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                        <div className="border-b border-slate-700 pb-4 mb-4">
                          <p className="text-xs text-slate-400 mb-1">Subject:</p>
                          <p className="text-white font-medium text-lg">
                            {newTemplate.subject
                              ? newTemplate.subject
                                  .replace(/\{\{position_title\}\}/g, "Machine Learning Engineer")
                                  .replace(/\{\{company_name\}\}/g, "Tech Corp")
                                  .replace(/\{\{recruiter_name\}\}/g, "John Smith")
                              : "No subject entered yet"}
                          </p>
                        </div>
                        <div className="prose prose-invert max-w-none">
                          {newTemplate.body_template_html ? (
                            <div
                              className="text-slate-300"
                              dangerouslySetInnerHTML={{
                                __html: newTemplate.body_template_html
                                  .replace(/\{\{position_title\}\}/g, "Machine Learning Engineer")
                                  .replace(/\{\{company_name\}\}/g, "Tech Corp")
                                  .replace(/\{\{recruiter_name\}\}/g, "John Smith")
                              }}
                            />
                          ) : (
                            <p className="text-slate-500 italic">No content yet. Add content in the Content tab.</p>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 mt-4 text-center">
                        Preview with sample data
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setCreateOpen(false)}
                    className="border-slate-700 text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreate}
                    className={`bg-gradient-to-r ${currentCategory?.color}`}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Create Template
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* Category Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-5 gap-4 mb-6"
        >
          {categoryCounts.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className={`glass backdrop-blur-xl cursor-pointer transition-all duration-300 ${
                  activeCategory === category.id
                    ? `bg-gradient-to-br ${category.bgColor} ${category.borderColor} border-2 shadow-xl shadow-${category.color}/20`
                    : 'bg-white/5 border-slate-700 hover:border-slate-600'
                }`}
                onClick={() => setActiveCategory(category.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <motion.div
                      className={`p-3 rounded-xl bg-gradient-to-br ${category.color} ${
                        activeCategory === category.id ? 'shadow-lg' : ''
                      }`}
                      animate={activeCategory === category.id ? { rotate: [0, -5, 5, 0] } : {}}
                      transition={{ duration: 0.5 }}
                    >
                      <category.icon className="w-6 h-6 text-white" />
                    </motion.div>
                    <Badge
                      variant="secondary"
                      className={activeCategory === category.id ? 'bg-white/20' : ''}
                    >
                      {category.count}
                    </Badge>
                  </div>
                  <h3 className="text-white font-bold text-lg mb-1">
                    {category.label}
                  </h3>
                  <p className="text-slate-400 text-xs line-clamp-2">
                    {category.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Statistics Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className={`glass backdrop-blur-xl bg-gradient-to-r ${currentCategory?.bgColor} ${currentCategory?.borderColor} border`}>
            <CardContent className="p-4">
              <div className="grid grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{filteredTemplates.length}</div>
                  <div className="text-xs text-slate-400">Total Templates</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {filteredTemplates.filter(t => t.isDefault).length}
                  </div>
                  <div className="text-xs text-slate-400">Default</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {filteredTemplates.reduce((sum, t) => sum + t.timesUsed, 0)}
                  </div>
                  <div className="text-xs text-slate-400">Times Used</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {new Set(filteredTemplates.map(t => t.language)).size}
                  </div>
                  <div className="text-xs text-slate-400">Languages</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">
                    {new Set(filteredTemplates.map(t => t.targetPosition)).size}
                  </div>
                  <div className="text-xs text-slate-400">Positions</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="glass backdrop-blur-xl bg-white/5 border-slate-700">
              <CardContent className="p-4">
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Language</label>
                    <Select value={filterLanguage} onValueChange={setFilterLanguage}>
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Languages</SelectItem>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Hindi">Hindi</SelectItem>
                        <SelectItem value="Spanish">Spanish</SelectItem>
                        <SelectItem value="French">French</SelectItem>
                        <SelectItem value="German">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Position</label>
                    <Input
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="Filter by position..."
                      value={filterPosition === "all" ? "" : filterPosition}
                      onChange={(e) => setFilterPosition(e.target.value || "all")}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Sort By</label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recent">Most Recent</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                        <SelectItem value="mostUsed">Most Used</SelectItem>
                        <SelectItem value="leastUsed">Least Used</SelectItem>
                        <SelectItem value="nameAZ">Name (A-Z)</SelectItem>
                        <SelectItem value="nameZA">Name (Z-A)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      className="w-full border-slate-700"
                      onClick={() => {
                        setFilterLanguage("all");
                        setFilterPosition("all");
                        setSortBy("recent");
                        toast.info("Filters cleared");
                      }}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & View Controls */}
      <Card className="glass backdrop-blur-xl bg-white/5 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                className="pl-12 bg-slate-800 border-slate-700 text-white text-lg h-12"
                placeholder={`Search ${currentCategory?.label.toLowerCase()} templates...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant={viewMode === "card" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("card")}
                className={
                  viewMode === "card"
                    ? `bg-gradient-to-r ${currentCategory?.color}`
                    : "border-slate-700 text-slate-400"
                }
              >
                <LayoutGrid className="w-5 h-5" />
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("table")}
                className={
                  viewMode === "table"
                    ? `bg-gradient-to-r ${currentCategory?.color}`
                    : "border-slate-700 text-slate-400"
                }
              >
                <List className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center py-20"
        >
          <div className="text-center">
            <Loader2 className={`w-16 h-16 animate-spin mx-auto mb-4 text-gradient bg-gradient-to-r ${currentCategory?.color} bg-clip-text`} />
            <span className="text-slate-400 text-lg">Loading templates...</span>
          </div>
        </motion.div>
      )}

      {/* Error State */}
      {error && !loading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="glass backdrop-blur-xl bg-red-500/10 border-red-500/30">
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-red-400 mb-2">Error Loading Templates</h3>
              <p className="text-red-300 mb-6">{error}</p>
              <Button
                variant="outline"
                onClick={fetchTemplates}
                className="border-red-500/50 text-red-400 hover:bg-red-500/20"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredTemplates.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className={`glass backdrop-blur-xl bg-gradient-to-br ${currentCategory?.bgColor} ${currentCategory?.borderColor} border-2`}>
            <CardContent className="p-16 text-center">
              {currentCategory && <currentCategory.icon className="w-24 h-24 text-slate-500 mx-auto mb-6" />}
              <h3 className="text-2xl font-bold text-white mb-3">
                {searchQuery ? "No templates match your search" : `No ${currentCategory?.label} templates yet`}
              </h3>
              <p className="text-slate-400 mb-6 text-lg max-w-md mx-auto">
                {searchQuery
                  ? "Try adjusting your search or filters"
                  : `Create your first ${currentCategory?.label.toLowerCase()} template to get started`
                }
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => {
                    setNewTemplate(initialFormState); // Reset form to initial state
                    setCreateOpen(true);
                  }}
                  className={`bg-gradient-to-r ${currentCategory?.color} text-lg px-8 py-6`}
                  size="lg"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create {currentCategory?.label} Template
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Card View */}
      {viewMode === "card" && !loading && !error && filteredTemplates.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredTemplates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -8, scale: 1.02 }}
              onHoverStart={() => setHoveredTemplate(template.id)}
              onHoverEnd={() => setHoveredTemplate(null)}
            >
              <Card
                className={`glass backdrop-blur-xl bg-gradient-to-br ${currentCategory?.bgColor} ${currentCategory?.borderColor} border hover:shadow-2xl hover:shadow-${currentCategory?.color}/20 transition-all duration-300 h-full`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-3">
                    <motion.div
                      className={`p-3 rounded-xl bg-gradient-to-br ${currentCategory?.color}`}
                      animate={hoveredTemplate === template.id ? { rotate: [0, -10, 10, 0] } : {}}
                      transition={{ duration: 0.5 }}
                    >
                      {currentCategory && <currentCategory.icon className="w-6 h-6 text-white" />}
                    </motion.div>
                    <div className="flex gap-2">
                      {template.isDefault && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          whileHover={{ scale: 1.2, rotate: 72 }}
                        >
                          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        </motion.div>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-slate-900 border-slate-700">
                          <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-slate-700" />
                          <DropdownMenuItem onClick={() => handlePreview(template)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStartEdit(template)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.location.href = '/follow-up'}>
                            <Workflow className="w-4 h-4 mr-2" />
                            Use in Follow-up
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-700" />
                          {!template.isDefault && (
                            <DropdownMenuItem onClick={() => handleSetDefault(template.id, template.name)}>
                              <Star className="w-4 h-4 mr-2" />
                              Set as Default
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDelete(template.id, template.name)}
                            className="text-red-400"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <CardTitle className="text-white text-lg line-clamp-2">
                    {template.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-white/10">
                      <Globe className="w-3 h-3 mr-1" />
                      {template.language}
                    </Badge>
                    {template.targetPosition && (
                      <Badge variant="secondary" className="bg-white/10">
                        <Target className="w-3 h-3 mr-1" />
                        {template.targetPosition}
                      </Badge>
                    )}
                    {template.isDefault && (
                      <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                        <Star className="w-3 h-3 mr-1 fill-yellow-400" />
                        Default
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Activity className="w-4 h-4" />
                        Usage:
                      </span>
                      <span className="text-white font-bold">{template.timesUsed}x</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Created:
                      </span>
                      <span className="text-white">
                        {new Date(template.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 p-4 rounded-lg space-y-2">
                    <p className="text-xs text-slate-400">Subject:</p>
                    <p className="text-sm text-white font-medium line-clamp-2">
                      {template.subject}
                    </p>
                  </div>

                  <AnimatePresence>
                    {hoveredTemplate === template.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-slate-800/50 p-4 rounded-lg overflow-hidden"
                      >
                        <p className="text-xs text-slate-400 mb-2">Preview:</p>
                        <p className="text-xs text-slate-300 line-clamp-4">
                          {template.bodyPreview}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-700">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-700 text-white hover:bg-slate-800"
                      onClick={() => handlePreview(template)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      className={`bg-gradient-to-r ${currentCategory?.color}`}
                      onClick={() => handleStartEdit(template)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Table View */}
      {viewMode === "table" && !loading && !error && filteredTemplates.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Card className="glass backdrop-blur-xl bg-white/5 border-slate-700">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800 border-b border-slate-700">
                    <tr>
                      <th className="text-left p-4 text-white font-medium">Template</th>
                      <th className="text-left p-4 text-white font-medium">Language</th>
                      <th className="text-left p-4 text-white font-medium">Position</th>
                      <th className="text-left p-4 text-white font-medium">Usage</th>
                      <th className="text-left p-4 text-white font-medium">Status</th>
                      <th className="text-left p-4 text-white font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTemplates.map((template, index) => (
                      <motion.tr
                        key={template.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-gradient-to-br ${currentCategory?.color}`}>
                              {currentCategory && <currentCategory.icon className="w-4 h-4 text-white" />}
                            </div>
                            <div>
                              <span className="text-white font-medium block">
                                {template.name}
                              </span>
                              <span className="text-slate-400 text-xs line-clamp-1">
                                {template.subject}
                              </span>
                            </div>
                            {template.isDefault && (
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="secondary" className="bg-white/10">
                            {template.language}
                          </Badge>
                        </td>
                        <td className="p-4 text-slate-300">{template.targetPosition || "Any"}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-400" />
                            <span className="text-white font-bold">{template.timesUsed}x</span>
                          </div>
                        </td>
                        <td className="p-4">
                          {template.isDefault ? (
                            <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                              <Star className="w-3 h-3 mr-1 fill-yellow-400" />
                              Default
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-white/10">
                              Active
                            </Badge>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-blue-400 hover:text-blue-300"
                              onClick={() => handlePreview(template)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-green-400 hover:text-green-300"
                              onClick={() => handleStartEdit(template)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-purple-400 hover:text-purple-300"
                              onClick={() => handleDuplicate(template)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:text-red-300"
                              onClick={() => handleDelete(template.id, template.name)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Edit Template Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent className="sm:max-w-3xl bg-slate-900 border-slate-700 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl text-white flex items-center gap-2">
              <Edit className="w-6 h-6" />
              Edit Template
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Update template: {editingTemplate?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Template Name</label>
                <Input
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Category</label>
                <Select
                  value={editFormData.category}
                  onValueChange={(value) => setEditFormData({ ...editFormData, category: value })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Language</label>
                <Select
                  value={editFormData.language}
                  onValueChange={(value) => setEditFormData({ ...editFormData, language: value })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Hindi">Hindi</SelectItem>
                    <SelectItem value="Spanish">Spanish</SelectItem>
                    <SelectItem value="French">French</SelectItem>
                    <SelectItem value="German">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Target Position</label>
                <Input
                  value={editFormData.targetPosition}
                  onChange={(e) => setEditFormData({ ...editFormData, targetPosition: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Email Subject</label>
              <Input
                value={editFormData.subject}
                onChange={(e) => setEditFormData({ ...editFormData, subject: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Email Body</label>
              <textarea
                value={editFormData.body_template_html}
                onChange={(e) => setEditFormData({ ...editFormData, body_template_html: e.target.value })}
                className="w-full h-64 bg-slate-800 border border-slate-700 text-white rounded-md p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingTemplate(null)}
              className="border-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              className={`bg-gradient-to-r ${currentCategory?.color}`}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Draft Viewer */}
      {selectedDraft && (
        <EmailDraftViewer
          draft={{
            id: selectedDraft.id,
            subject_line: selectedDraft.subject,
            email_body: selectedDraft.body_template_html || "",
            email_html: selectedDraft.body_template_html,
            tone: selectedDraft.category,
            personalization_level: 85,
            confidence_score: 90,
            is_favorite: selectedDraft.isDefault,
            is_used: selectedDraft.timesUsed > 0,
            created_at: selectedDraft.createdAt,
            company_name: selectedDraft.targetPosition,
          }}
          open={viewerOpen}
          onClose={handleCloseViewer}
          onSave={handleSaveDraft}
          onSend={handleSendDraft}
        />
      )}

      {/* Intelligent Recipient Selector - God-Tier Email Sending */}
      <IntelligentRecipientSelector
        open={recipientSelectorOpen}
        onClose={() => {
          setRecipientSelectorOpen(false);
          setTemplateToSend(null);
        }}
        onSend={handleSendToRecipients}
        templateName={templateToSend?.name}
      />
    </div>
  );
}
