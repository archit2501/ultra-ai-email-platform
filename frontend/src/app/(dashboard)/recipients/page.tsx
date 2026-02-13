"use client";

import { useState, useEffect, useCallback } from "react";
import {
  UserCircle2,
  Search,
  Filter,
  LayoutGrid,
  List,
  Plus,
  RefreshCw,
  Upload,
  Trash2,
  MoreVertical,
  Mail,
  Building2,
  MapPin,
  Tag,
  TrendingUp,
  CheckCircle,
  XCircle,
  Users,
  Sparkles,
  Download,
  UsersRound,
  Zap,
  Eye,
  Edit,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  DropdownMenuLabel,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { recipientsAPI, recipientGroupsAPI } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { Recipient, RecipientStatistics, RecipientGroup } from "@/types";
import { RecipientDialog } from "@/components/RecipientDialog";
import { UltraEmailPanel } from "@/components/recipients/UltraEmailPanel";
import { GroupDialog } from "@/components/GroupDialog";
import { GroupCampaignComposer } from "@/components/GroupCampaignComposer";
import { FollowUpScheduleDialog } from "@/components/FollowUpScheduleDialog";
import IntentSelectionDialog from "@/components/recipients/IntentSelectionDialog";
import TierSelectionDialog from "@/components/recipients/TierSelectionDialog";
import FollowUpQueuePanel from "@/components/recipients/FollowUpQueuePanel";
import type { MobiAdzTier } from "@/components/recipients/utils/mobiadzTemplates";

export default function RecipientsPage() {
  const { user } = useAuthStore();
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [groups, setGroups] = useState<RecipientGroup[]>([]);
  const [statistics, setStatistics] = useState<RecipientStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCompany, setFilterCompany] = useState<string>("all");
  const [filterCountry, setFilterCountry] = useState<string>("all");
  const [filterTag, setFilterTag] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvUploading, setcsvUploading] = useState(false);
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [recipientDialogOpen, setRecipientDialogOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
  const [ultraPanelOpen, setUltraPanelOpen] = useState(false);
  const [ultraRecipient, setUltraRecipient] = useState<Recipient | null>(null);
  const [intentDialogOpen, setIntentDialogOpen] = useState(false);
  const [pendingRecipient, setPendingRecipient] = useState<Recipient | null>(null);
  const [selectedMode, setSelectedMode] = useState<"job" | "market" | "themobiadz">("job");
  const [tierDialogOpen, setTierDialogOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<MobiAdzTier | null>(null);

  // Tabs and Groups state
  const [activeTab, setActiveTab] = useState<"recipients" | "groups" | "follow-up">("recipients");
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<RecipientGroup | null>(null);
  const [campaignComposerOpen, setCampaignComposerOpen] = useState(false);
  const [selectedGroupIdForCampaign, setSelectedGroupIdForCampaign] = useState<number | undefined>();
  const [followUpFilter, setFollowUpFilter] = useState<string>("all");

  // Follow-up schedule dialog state
  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false);
  const [followUpRecipient, setFollowUpRecipient] = useState<Recipient | null>(null);

  useEffect(() => {
    fetchRecipients();
    fetchStatistics();
    fetchGroups();
  }, [user]);

  const fetchRecipients = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await recipientsAPI.list({ limit: 1000 });
      console.log("📋 [Recipients] Fetched data:", data);

      // Ensure we always set an array - handle various response formats
      const responseData = data as any;
      if (Array.isArray(responseData)) {
        setRecipients(responseData);
      } else if (responseData && Array.isArray(responseData.recipients)) {
        setRecipients(responseData.recipients);
      } else if (responseData && Array.isArray(responseData.items)) {
        setRecipients(responseData.items);
      } else {
        console.warn("⚠️ [Recipients] Unexpected data format, setting empty array");
        setRecipients([]);
      }
    } catch (error: any) {
      console.error("❌ [Recipients] Failed to load:", error.message);
      toast.error("Failed to load recipients");
      setRecipients([]); // Ensure array even on error
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStatistics = useCallback(async () => {
    try {
      const { data } = await recipientsAPI.getStatistics();
      setStatistics(data);
    } catch (error: any) {
      console.error("Failed to load statistics:", error);
    }
  }, []);

  const fetchGroups = useCallback(async () => {
    try {
      const { data } = await recipientGroupsAPI.list({ limit: 100 });
      setGroups(Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Failed to load groups:", error);
      setGroups([]);
    }
  }, []);

  const handleCsvUpload = async () => {
    if (!csvFile) return;

    console.log("📤 [CSV Import] Starting CSV import for file:", csvFile.name);
    setcsvUploading(true);
    try {
      const result = await recipientsAPI.importCSV(csvFile);
      console.log("✅ [CSV Import] Success! Response:", result.data);

      const importResult = result.data as any;
      const { created, skipped, errors } = importResult;
      const total_processed = importResult.total_processed || (created + skipped + (Array.isArray(errors) ? errors.length : 0));
      console.log(`📊 [CSV Import] Stats: ${created} created, ${skipped} skipped, ${Array.isArray(errors) ? errors.length : errors} errors out of ${total_processed} total`);

      const errorCount = Array.isArray(errors) ? errors.length : errors;
      if (created > 0) {
        toast.success(`Imported ${created} recipients successfully!`, {
          description: skipped > 0 ? `Skipped ${skipped} duplicates` : errorCount > 0 ? `${errorCount} rows had errors` : undefined,
        });
      } else if (errorCount > 0) {
        toast.error(`Failed to import any recipients`, {
          description: `${errorCount} rows had errors out of ${total_processed} total`,
        });
      } else {
        toast.warning(`No new recipients imported`, {
          description: `All ${total_processed} rows were duplicates`,
        });
      }

      setCsvDialogOpen(false);
      setCsvFile(null);
      fetchRecipients();
      fetchStatistics();
    } catch (error: any) {
      console.error("❌ [CSV Import] Error:", error.message);
      toast.error("Failed to import CSV", {
        description: error.message,
      });
    } finally {
      setcsvUploading(false);
    }
  };

  const handleBulkAddToGroup = async () => {
    if (!selectedGroupId || selectedIds.length === 0) return;

    try {
      await recipientGroupsAPI.addRecipients(selectedGroupId, selectedIds);
      toast.success(`Added ${selectedIds.length} recipients to group`);
      setBulkActionDialogOpen(false);
      setSelectedIds([]);
      setSelectedGroupId(null);
    } catch (error: any) {
      toast.error("Failed to add recipients to group");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    if (confirm(`Delete ${selectedIds.length} selected recipients?`)) {
      try {
        await recipientsAPI.bulkDelete(selectedIds);
        toast.success(`Deleted ${selectedIds.length} recipients`);
        setSelectedIds([]);
        fetchRecipients();
        fetchStatistics();
      } catch (error: any) {
        toast.error("Failed to delete recipients");
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Delete this recipient?")) {
      try {
        await recipientsAPI.delete(id);
        toast.success("Recipient deleted");
        fetchRecipients();
        fetchStatistics();
      } catch (error: any) {
        toast.error("Failed to delete recipient");
      }
    }
  };

  // Group handlers
  const handleRefreshGroup = async (groupId: number) => {
    try {
      const result = await recipientGroupsAPI.refreshDynamicGroup(groupId);
      toast.success(
        `Group refreshed! Added ${result.data.recipients_added}, removed ${result.data.recipients_removed}`,
        { duration: 5000 }
      );
      fetchGroups();
    } catch (error: any) {
      toast.error("Failed to refresh group");
    }
  };

  const handleDeleteGroup = async (groupId: number) => {
    if (confirm("Delete this group? This action cannot be undone.")) {
      try {
        await recipientGroupsAPI.delete(groupId);
        toast.success("Group deleted");
        fetchGroups();
      } catch (error: any) {
        toast.error("Failed to delete group");
      }
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredRecipients.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRecipients.map(r => r.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Filtering logic with Follow-up status
  const filteredRecipients = recipients.filter((recipient) => {
    const matchesSearch =
      !searchQuery ||
      recipient.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipient.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipient.company?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCompany = filterCompany === "all" || recipient.company === filterCompany;
    const matchesCountry = filterCountry === "all" || recipient.country === filterCountry;
    const matchesTag = filterTag === "all" || recipient.tags?.includes(filterTag);

    // Follow-up status filtering
    const recipientFollowUpStatus = (recipient as any).follow_up_status || "none";
    const matchesFollowUp = followUpFilter === "all" || recipientFollowUpStatus === followUpFilter;

    return matchesSearch && matchesCompany && matchesCountry && matchesTag && matchesFollowUp;
  });

  // Extract unique values for filters
  const uniqueCompanies = Array.from(new Set(recipients.map(r => r.company).filter(Boolean)));
  const uniqueCountries = Array.from(new Set(recipients.map(r => r.country).filter(Boolean)));
  const uniqueTags = Array.from(
    new Set(
      recipients
        .flatMap(r => r.tags?.split(",").map(t => t.trim()) || [])
        .filter(Boolean)
    )
  );

  const getEngagementColor = (score: number) => {
    if (score >= 40) return "text-success";
    if (score >= 20) return "text-warning";
    return "text-muted-foreground";
  };

  const getEngagementLabel = (score: number) => {
    if (score >= 40) return "High";
    if (score >= 20) return "Medium";
    return "Low";
  };

  // Group helper functions
  const getGroupTypeColor = (type: string) => {
    return type === "dynamic"
      ? "from-purple-500 to-pink-500"
      : "from-blue-500 to-cyan-500";
  };

  const getGroupTypeBadge = (type: string) => {
    return type === "dynamic" ? (
      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
        <Zap className="w-3 h-3 mr-1" />
        Dynamic
      </Badge>
    ) : (
      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
        <Users className="w-3 h-3 mr-1" />
        Static
      </Badge>
    );
  };

  // Follow-up helper functions with stunning UI
  const getFollowUpStatusBadge = (status?: string) => {
    if (!status || status === "none") {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
          <span className="text-xs font-medium text-slate-400">No Follow-up</span>
        </motion.div>
      );
    }

    const statusConfig: Record<string, {
      gradient: string;
      text: string;
      icon: React.ReactNode;
      glow: string;
      pulse: boolean;
    }> = {
      scheduled: {
        gradient: "from-blue-500 to-cyan-500",
        text: "text-blue-300",
        icon: <RefreshCw className="w-3 h-3" />,
        glow: "shadow-blue-500/50",
        pulse: false,
      },
      active: {
        gradient: "from-green-500 to-emerald-500",
        text: "text-green-300",
        icon: <Zap className="w-3 h-3" />,
        glow: "shadow-green-500/50",
        pulse: true,
      },
      paused: {
        gradient: "from-yellow-500 to-orange-500",
        text: "text-yellow-300",
        icon: <RefreshCw className="w-3 h-3" />,
        glow: "shadow-yellow-500/50",
        pulse: false,
      },
      replied: {
        gradient: "from-purple-500 to-pink-500",
        text: "text-purple-300",
        icon: <CheckCircle className="w-3 h-3" />,
        glow: "shadow-purple-500/50",
        pulse: false,
      },
      completed: {
        gradient: "from-slate-500 to-slate-600",
        text: "text-slate-300",
        icon: <CheckCircle className="w-3 h-3" />,
        glow: "shadow-slate-500/50",
        pulse: false,
      },
    };

    const config = statusConfig[status] || statusConfig.scheduled;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05, y: -2 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r ${config.gradient} bg-opacity-10 border border-transparent backdrop-blur-sm shadow-lg ${config.glow} relative overflow-hidden group cursor-default`}
      >
        {/* Animated background glow */}
        <motion.div
          className={`absolute inset-0 bg-gradient-to-r ${config.gradient} opacity-20`}
          animate={config.pulse ? {
            opacity: [0.2, 0.4, 0.2],
            scale: [1, 1.02, 1],
          } : {}}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Icon with rotation animation */}
        <motion.div
          className={config.text}
          animate={config.pulse ? { rotate: [0, 360] } : {}}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {config.icon}
        </motion.div>

        {/* Text */}
        <span className={`text-xs font-semibold ${config.text} relative z-10`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>

        {/* Shimmer effect on hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full"
          transition={{ duration: 0.6 }}
        />
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      {/* Header with Statistics */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl border border-cyan-500/30">
              <UserCircle2 className="w-8 h-8 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-500 bg-clip-text text-transparent">
                Recipients Directory
              </h1>
              <p className="text-slate-400 mt-1">
                Manage your recipient contacts and engagement
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setCsvDialogOpen(true)}
              variant="outline"
              className="border-slate-700 hover:border-cyan-500 hover:bg-cyan-500/10"
              aria-label="Import recipients from CSV file"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
            <Button
              onClick={() => {
                setSelectedRecipient(null);
                setRecipientDialogOpen(true);
              }}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Recipient
            </Button>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        {statistics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
          >
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Total Recipients</p>
                    <p className="text-2xl font-bold text-white mt-1">{statistics.total}</p>
                  </div>
                  <div className="p-3 bg-cyan-500/20 rounded-lg">
                    <Users className="w-5 h-5 text-cyan-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Active</p>
                    <p className="text-2xl font-bold text-success mt-1">{statistics.active}</p>
                  </div>
                  <div className="p-3 bg-success/20 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Avg. Engagement</p>
                    <p className="text-2xl font-bold text-warning mt-1">
                      {statistics.avg_engagement_score.toFixed(1)}
                    </p>
                  </div>
                  <div className="p-3 bg-warning/20 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-warning" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Companies</p>
                    <p className="text-2xl font-bold text-info mt-1">
                      {statistics.top_companies.length}
                    </p>
                  </div>
                  <div className="p-3 bg-info/20 rounded-lg">
                    <Building2 className="w-5 h-5 text-info" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Tabs: Recipients, Groups, and Follow-Up */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "recipients" | "groups" | "follow-up")} className="w-full">
        <TabsList className="bg-slate-900 border border-slate-800 mb-6">
          <TabsTrigger value="recipients" className="data-[state=active]:bg-cyan-600">
            <UserCircle2 className="w-4 h-4 mr-2" />
            Recipients
          </TabsTrigger>
          <TabsTrigger value="groups" className="data-[state=active]:bg-purple-600">
            <UsersRound className="w-4 h-4 mr-2" />
            Groups
          </TabsTrigger>
          <TabsTrigger value="follow-up" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600">
            <RefreshCw className="w-4 h-4 mr-2" />
            Follow-Up
            <Badge className="ml-2 bg-amber-500/20 text-amber-300 text-[10px] px-1.5">
              AI
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Recipients Tab */}
        <TabsContent value="recipients" className="space-y-6">
          {/* Filters and Actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search by name, email, or company..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-slate-800/50 border-slate-700 focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                <Select value={filterCompany} onValueChange={setFilterCompany}>
                  <SelectTrigger className="w-[180px] bg-slate-800/50 border-slate-700">
                    <Building2 className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Companies</SelectItem>
                    {uniqueCompanies.map((company) => (
                      <SelectItem key={company} value={company!}>
                        {company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterCountry} onValueChange={setFilterCountry}>
                  <SelectTrigger className="w-[180px] bg-slate-800/50 border-slate-700">
                    <MapPin className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    {uniqueCountries.map((country) => (
                      <SelectItem key={country} value={country!}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterTag} onValueChange={setFilterTag}>
                  <SelectTrigger className="w-[180px] bg-slate-800/50 border-slate-700">
                    <Tag className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Tag" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tags</SelectItem>
                    {uniqueTags.map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Beautiful Follow-up Status Filter */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Select value={followUpFilter} onValueChange={setFollowUpFilter}>
                    <SelectTrigger className="w-[200px] bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 hover:border-cyan-500/50 transition-all duration-300 shadow-lg shadow-cyan-500/10">
                      <RefreshCw className="w-4 h-4 mr-2 text-cyan-400" />
                      <SelectValue placeholder="Follow-up Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800">
                      <SelectItem value="all" className="focus:bg-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" />
                          All Status
                        </div>
                      </SelectItem>
                      <SelectItem value="none" className="focus:bg-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-slate-500" />
                          No Follow-up
                        </div>
                      </SelectItem>
                      <SelectItem value="scheduled" className="focus:bg-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-cyan-500 animate-pulse" />
                          Scheduled
                        </div>
                      </SelectItem>
                      <SelectItem value="active" className="focus:bg-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 animate-pulse shadow-lg shadow-green-500/50" />
                          Active
                        </div>
                      </SelectItem>
                      <SelectItem value="paused" className="focus:bg-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500" />
                          Paused
                        </div>
                      </SelectItem>
                      <SelectItem value="replied" className="focus:bg-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-500" />
                          Replied
                        </div>
                      </SelectItem>
                      <SelectItem value="completed" className="focus:bg-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-slate-400 to-slate-600" />
                          Completed
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>
              </div>

              {/* View Toggle */}
              <div className="flex gap-2 border-l border-slate-700 pl-4">
                <Button
                  variant={viewMode === "card" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("card")}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("table")}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={fetchRecipients}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            {/* Bulk Actions */}
            {selectedIds.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-4 flex items-center justify-between p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedIds.length === filteredRecipients.length}
                    onCheckedChange={toggleSelectAll}
                  />
                  <span className="text-sm font-medium text-cyan-400">
                    {selectedIds.length} selected
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setBulkActionDialogOpen(true)}
                    className="border-slate-700"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Add to Group
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleBulkDelete}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Results */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-slate-400 text-sm">
          Showing <span className="text-white font-semibold">{filteredRecipients.length}</span> of{" "}
          <span className="text-white font-semibold">{recipients.length}</span> recipients
        </p>
      </div>

      {/* Card View */}
      {viewMode === "card" && (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <AnimatePresence>
            {filteredRecipients.map((recipient, index) => (
              <motion.div
                key={recipient.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.02 }}
              >
                <Card
                  className="bg-slate-900/50 border-slate-800 hover:border-cyan-500/50 transition-all group cursor-pointer"
                  onClick={() => {
                    setPendingRecipient(recipient);
                    setIntentDialogOpen(true);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedIds.includes(recipient.id)}
                        onCheckedChange={() => toggleSelect(recipient.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white truncate">
                              {recipient.name || "No name"}
                            </h3>
                            <p className="text-sm text-slate-400 truncate">{recipient.email}</p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedRecipient(recipient);
                                  setRecipientDialogOpen(true);
                                }}
                              >
                                <Mail className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Users className="w-4 h-4 mr-2" />
                                Add to Group
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-500"
                                onClick={() => handleDelete(recipient.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="mt-3 space-y-2">
                          {recipient.company && (
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                              <Building2 className="w-3.5 h-3.5" />
                              <span className="truncate">{recipient.company}</span>
                            </div>
                          )}
                          {recipient.position && (
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span className="truncate">{recipient.position}</span>
                            </div>
                          )}
                          {recipient.country && (
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                              <MapPin className="w-3.5 h-3.5" />
                              <span>{recipient.country}</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <TrendingUp
                              className={`w-4 h-4 ${getEngagementColor(recipient.engagement_score)}`}
                            />
                            <span className={`text-sm font-medium ${getEngagementColor(recipient.engagement_score)}`}>
                              {getEngagementLabel(recipient.engagement_score)}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            {recipient.total_emails_sent > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {recipient.total_emails_sent} sent
                              </Badge>
                            )}
                            {recipient.unsubscribed && (
                              <Badge variant="destructive" className="text-xs">
                                Unsubscribed
                              </Badge>
                            )}
                          </div>
                        </div>

                        {recipient.tags && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {recipient.tags.split(",").map((tag, i) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className="text-xs border-slate-700"
                              >
                                {tag.trim()}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800">
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIds.length === filteredRecipients.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Engagement</TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Follow-up</span>
                  </div>
                </TableHead>
                <TableHead>Emails Sent</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecipients.map((recipient) => (
                <TableRow
                  key={recipient.id}
                  className="border-slate-800 cursor-pointer hover:bg-slate-800/50 transition-colors"
                  onClick={() => {
                    setPendingRecipient(recipient);
                    setIntentDialogOpen(true);
                  }}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.includes(recipient.id)}
                      onCheckedChange={() => toggleSelect(recipient.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{recipient.name || "—"}</TableCell>
                  <TableCell className="text-slate-400">{recipient.email}</TableCell>
                  <TableCell className="text-slate-400">{recipient.company || "—"}</TableCell>
                  <TableCell className="text-slate-400">{recipient.country || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getEngagementColor(recipient.engagement_score).replace('text-', 'bg-')}`} />
                      <span className="text-sm">{recipient.engagement_score.toFixed(1)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getFollowUpStatusBadge((recipient as any).follow_up_status)}
                    {(recipient as any).follow_up_next_step && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-slate-500 mt-1 font-mono"
                      >
                        Step {(recipient as any).follow_up_next_step}/3
                      </motion.p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{recipient.total_emails_sent}</Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedRecipient(recipient);
                            setRecipientDialogOpen(true);
                          }}
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Users className="w-4 h-4 mr-2" />
                          Add to Group
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setFollowUpRecipient(recipient);
                            setFollowUpDialogOpen(true);
                          }}
                          className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 focus:bg-gradient-to-r focus:from-cyan-500/20 focus:to-blue-500/20 border-l-2 border-cyan-500"
                        >
                          <div className="flex items-center gap-2 w-full">
                            <RefreshCw className="w-4 h-4 text-cyan-400" />
                            <div className="flex-1">
                              <div className="font-medium text-cyan-300">Schedule Follow-up</div>
                              <div className="text-xs text-slate-500">Automate sequences</div>
                            </div>
                            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-500 focus:text-red-400"
                          onClick={() => handleDelete(recipient.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
        </TabsContent>

        {/* Groups Tab */}
        <TabsContent value="groups" className="space-y-6">
          {/* Groups Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Total Groups</p>
                    <p className="text-2xl font-bold text-white mt-1">{groups.length}</p>
                  </div>
                  <div className="p-3 bg-purple-500/20 rounded-lg">
                    <UsersRound className="w-5 h-5 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Dynamic Groups</p>
                    <p className="text-2xl font-bold text-purple-400 mt-1">
                      {groups.filter((g) => g.group_type === "dynamic").length}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-500/20 rounded-lg">
                    <Zap className="w-5 h-5 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Total Recipients</p>
                    <p className="text-2xl font-bold text-cyan-400 mt-1">
                      {groups.reduce((sum, g) => sum + g.total_recipients, 0)}
                    </p>
                  </div>
                  <div className="p-3 bg-cyan-500/20 rounded-lg">
                    <Users className="w-5 h-5 text-cyan-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Static Groups</p>
                    <p className="text-2xl font-bold text-blue-400 mt-1">
                      {groups.filter((g) => g.group_type === "static").length}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-500/20 rounded-lg">
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Groups Filters */}
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search groups..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-slate-900 border-slate-800 focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Select value={filterCompany} onValueChange={setFilterCompany}>
                    <SelectTrigger className="w-[180px] bg-slate-900 border-slate-800">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filter Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Groups</SelectItem>
                      <SelectItem value="static">Static Only</SelectItem>
                      <SelectItem value="dynamic">Dynamic Only</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={fetchGroups}
                    className="text-slate-400 hover:text-white"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>

                  <Button
                    onClick={() => {
                      setSelectedGroup(null);
                      setGroupDialogOpen(true);
                    }}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Group
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Groups Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-purple-400" />
            </div>
          ) : groups.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-16"
            >
              <div className="p-6 bg-slate-900 rounded-full border border-slate-800 mb-6">
                <UsersRound className="w-16 h-16 text-slate-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-300 mb-2">
                No groups found
              </h3>
              <p className="text-slate-400 mb-6">
                Create your first recipient group to get started
              </p>
              <Button
                onClick={() => {
                  setSelectedGroup(null);
                  setGroupDialogOpen(true);
                }}
                className="bg-gradient-to-r from-purple-600 to-pink-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Group
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {groups.map((group, index) => (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card className="bg-slate-900/50 border-slate-800 hover:border-purple-500/50 transition-all group overflow-hidden relative">
                      {/* Decorative gradient */}
                      <div
                        className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getGroupTypeColor(
                          group.group_type
                        )}`}
                      />

                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              {group.color && (
                                <div
                                  className="w-3 h-3 rounded-full ring-2 ring-slate-800"
                                  style={{ backgroundColor: group.color }}
                                />
                              )}
                              <h3 className="font-semibold text-white truncate">
                                {group.name}
                              </h3>
                            </div>
                            <p className="text-sm text-slate-400 line-clamp-2 mb-3">
                              {group.description || "No description"}
                            </p>
                            {getGroupTypeBadge(group.group_type)}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedGroup(group);
                                  setGroupDialogOpen(true);
                                }}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Group
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedGroupIdForCampaign(group.id);
                                  setCampaignComposerOpen(true);
                                }}
                              >
                                <Mail className="w-4 h-4 mr-2" />
                                Send Campaign
                              </DropdownMenuItem>
                              {group.group_type === "dynamic" && (
                                <DropdownMenuItem
                                  onClick={() => handleRefreshGroup(group.id)}
                                >
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                  Refresh Members
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-500"
                                onClick={() => handleDeleteGroup(group.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0">
                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="bg-slate-800/50 rounded-lg p-3">
                            <p className="text-xs text-slate-400 mb-1">Recipients</p>
                            <p className="text-lg font-bold text-white">
                              {group.total_recipients}
                            </p>
                          </div>
                          <div className="bg-slate-800/50 rounded-lg p-3">
                            <p className="text-xs text-slate-400 mb-1">Active</p>
                            <p className="text-lg font-bold text-green-400">
                              {group.active_recipients}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-slate-700 hover:border-purple-500"
                            onClick={() => {
                              setSelectedGroup(group);
                              setGroupDialogOpen(true);
                            }}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedGroupIdForCampaign(group.id);
                              setCampaignComposerOpen(true);
                            }}
                            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                          >
                            <Send className="w-3.5 h-3.5 mr-1" />
                            Campaign
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        {/* Follow-Up Tab */}
        <TabsContent value="follow-up" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <FollowUpQueuePanel />
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* CSV Upload Dialog */}
      <Dialog open={csvDialogOpen} onOpenChange={setCsvDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle>Import Recipients from CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file with columns: email, name, company, position, country, language, tags
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center">
              <Input
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="w-8 h-8 text-slate-400" />
                <p className="text-sm text-slate-400">
                  {csvFile ? csvFile.name : "Click to select CSV file"}
                </p>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCsvDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCsvUpload}
              disabled={!csvFile || csvUploading}
              className="bg-gradient-to-r from-cyan-600 to-blue-600"
            >
              {csvUploading ? "Uploading..." : "Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Add to Group Dialog */}
      <Dialog open={bulkActionDialogOpen} onOpenChange={setBulkActionDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle>Add Recipients to Group</DialogTitle>
            <DialogDescription>
              Select a group to add {selectedIds.length} selected recipients
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedGroupId?.toString()} onValueChange={(v) => setSelectedGroupId(Number(v))}>
              <SelectTrigger className="bg-slate-800/50 border-slate-700">
                <SelectValue placeholder="Select a group" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id.toString()}>
                    {group.name} ({group.total_recipients} members)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkAddToGroup}
              disabled={!selectedGroupId}
              className="bg-gradient-to-r from-cyan-600 to-blue-600"
            >
              Add to Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Empty State */}
      {!loading && filteredRecipients.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-16"
        >
          <div className="p-6 bg-slate-900/50 rounded-full border border-slate-800 mb-6">
            <UserCircle2 className="w-16 h-16 text-slate-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-300 mb-2">No recipients found</h3>
          <p className="text-slate-500 mb-6">
            {searchQuery || filterCompany !== "all" || filterCountry !== "all" || filterTag !== "all"
              ? "Try adjusting your filters"
              : "Get started by importing recipients or adding them manually"}
          </p>
          {!(searchQuery || filterCompany !== "all" || filterCountry !== "all" || filterTag !== "all") && (
            <div className="flex gap-3">
              <Button
                onClick={() => setCsvDialogOpen(true)}
                variant="outline"
                className="border-slate-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </Button>
              <Button className="bg-gradient-to-r from-cyan-600 to-blue-600">
                <Plus className="w-4 h-4 mr-2" />
                Add Recipient
              </Button>
            </div>
          )}
        </motion.div>
      )}

      {/* Recipient Dialog */}
      <RecipientDialog
        open={recipientDialogOpen}
        onOpenChange={setRecipientDialogOpen}
        recipient={selectedRecipient}
        onSuccess={() => {
          fetchRecipients();
          fetchStatistics();
        }}
      />

      {/* Intent Selection Dialog */}
      <IntentSelectionDialog
        open={intentDialogOpen}
        recipientName={pendingRecipient?.name || pendingRecipient?.email || ""}
        recipientCompany={pendingRecipient?.company || ""}
        onSelect={(intent) => {
          setSelectedMode(intent);
          setIntentDialogOpen(false);
          if (intent === "themobiadz") {
            // For TheMobiAdz, show tier selection dialog
            setTierDialogOpen(true);
          } else {
            // For job/market, proceed with research flow
            setUltraRecipient(pendingRecipient);
            setUltraPanelOpen(true);
          }
        }}
        onClose={() => {
          setIntentDialogOpen(false);
          setPendingRecipient(null);
        }}
      />

      {/* Tier Selection Dialog (for TheMobiAdz) */}
      <TierSelectionDialog
        open={tierDialogOpen}
        recipientName={pendingRecipient?.name || pendingRecipient?.email || ""}
        recipientCompany={pendingRecipient?.company || ""}
        onSelect={(tier) => {
          setSelectedTier(tier);
          setTierDialogOpen(false);
          setUltraRecipient(pendingRecipient);
          setUltraPanelOpen(true);
        }}
        onClose={() => {
          setTierDialogOpen(false);
          setPendingRecipient(null);
          setSelectedTier(null);
        }}
      />

      {/* Ultra AI Email Panel */}
      {ultraRecipient && (
        <UltraEmailPanel
          open={ultraPanelOpen}
          recipient={{
            ...ultraRecipient,
            name: ultraRecipient.name || "Unknown",
            company: ultraRecipient.company || "Unknown Company",
            position: ultraRecipient.position || "Unknown Position",
          }}
          mode={selectedMode}
          mobiadzTier={selectedTier}
          onClose={() => {
            setUltraPanelOpen(false);
            setUltraRecipient(null);
            setSelectedTier(null);
          }}
          onEmailSent={() => {
            fetchRecipients();
            fetchStatistics();
          }}
        />
      )}

      {/* Group Dialog */}
      <GroupDialog
        open={groupDialogOpen}
        onOpenChange={setGroupDialogOpen}
        group={selectedGroup}
        onSuccess={() => {
          fetchGroups();
          setSelectedGroup(null);
        }}
      />

      {/* Campaign Composer */}
      <GroupCampaignComposer
        open={campaignComposerOpen}
        onOpenChange={setCampaignComposerOpen}
        preselectedGroupId={selectedGroupIdForCampaign}
        onSuccess={() => {
          setSelectedGroupIdForCampaign(undefined);
        }}
      />

      {/* Follow-up Schedule Dialog */}
      <FollowUpScheduleDialog
        open={followUpDialogOpen}
        onOpenChange={setFollowUpDialogOpen}
        recipient={followUpRecipient}
        onSuccess={() => {
          fetchRecipients();
          fetchStatistics();
        }}
      />
    </div>
  );
}
