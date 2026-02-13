"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  UsersRound,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  MoreVertical,
  Mail,
  Users,
  Sparkles,
  Zap,
  TrendingUp,
  Calendar,
  Eye,
  Edit,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { recipientGroupsAPI, groupCampaignsAPI } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { RecipientGroup, GroupCampaign } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { GroupDialog } from "@/components/GroupDialog";
import { GroupCampaignComposer } from "@/components/GroupCampaignComposer";

export default function RecipientGroupsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [groups, setGroups] = useState<RecipientGroup[]>([]);
  const [campaigns, setCampaigns] = useState<GroupCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("groups");
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<RecipientGroup | null>(null);
  const [campaignComposerOpen, setCampaignComposerOpen] = useState(false);
  const [selectedGroupIdForCampaign, setSelectedGroupIdForCampaign] = useState<number | undefined>();

  useEffect(() => {
    fetchGroups();
    fetchCampaigns();
  }, [user]);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await recipientGroupsAPI.list({ limit: 1000 });
      setGroups(Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error("Failed to load groups");
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCampaigns = useCallback(async () => {
    try {
      const { data } = await groupCampaignsAPI.list({ limit: 100 });
      // Ensure campaigns is always an array
      const campaignsData = data.items || data;
      setCampaigns(Array.isArray(campaignsData) ? campaignsData : []);
    } catch (error: any) {
      console.error("Failed to load campaigns:", error);
      setCampaigns([]); // Set empty array on error
    }
  }, []);

  const handleRefreshGroup = async (groupId: number) => {
    try {
      const result = await recipientGroupsAPI.refreshDynamicGroup(groupId);
      toast.success(
        `Group refreshed! Added ${result.data.recipients_added}, removed ${result.data.recipients_removed}`,
        {
          duration: 5000,
        }
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

  const filteredGroups = groups.filter((group) => {
    const matchesSearch =
      !searchQuery ||
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      filterType === "all" || group.group_type === filterType;

    return matchesSearch && matchesType;
  });

  const getGroupTypeColor = (type: string) => {
    return type === "dynamic"
      ? "from-purple-500 to-pink-500"
      : "from-blue-500 to-cyan-500";
  };

  const getGroupTypeBadge = (type: string) => {
    return type === "dynamic" ? (
      <Badge className="bg-accent/20 text-accent border-accent/30">
        <Zap className="w-3 h-3 mr-1" />
        Dynamic
      </Badge>
    ) : (
      <Badge className="bg-info/20 text-info border-info/30">
        <Users className="w-3 h-3 mr-1" />
        Static
      </Badge>
    );
  };

  const getCampaignStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-muted",
      scheduled: "bg-warning",
      sending: "bg-info",
      completed: "bg-success",
      failed: "bg-error",
      paused: "bg-warning",
      cancelled: "bg-muted",
    };
    return colors[status] || "bg-muted";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-accent/20 to-primary/20 rounded-xl border border-accent/30">
            <UsersRound className="w-8 h-8 text-accent" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-accent via-primary to-accent bg-clip-text text-transparent">
              Recipient Groups
            </h1>
            <p className="text-muted-foreground mt-1">
              Organize recipients and manage email campaigns
            </p>
          </div>
        </div>
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
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
      >
        <Card className="bg-card border-border backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Groups</p>
                <p className="text-2xl font-bold text-white mt-1">{groups.length}</p>
              </div>
              <div className="p-3 bg-accent/20 rounded-lg">
                <UsersRound className="w-5 h-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Dynamic Groups</p>
                <p className="text-2xl font-bold text-accent mt-1">
                  {groups.filter((g) => g.group_type === "dynamic").length}
                </p>
              </div>
              <div className="p-3 bg-accent/20 rounded-lg">
                <Zap className="w-5 h-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Recipients</p>
                <p className="text-2xl font-bold text-info mt-1">
                  {groups.reduce((sum, g) => sum + g.total_recipients, 0)}
                </p>
              </div>
              <div className="p-3 bg-info/20 rounded-lg">
                <Users className="w-5 h-5 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Active Campaigns</p>
                <p className="text-2xl font-bold text-success mt-1">
                  {campaigns.filter((c) => c.status === "sending").length}
                </p>
              </div>
              <div className="p-3 bg-success/20 rounded-lg">
                <Send className="w-5 h-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-card border border-border mb-6">
            <TabsTrigger value="groups" className="data-[state=active]:bg-accent">
              <UsersRound className="w-4 h-4 mr-2" />
              My Groups
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="data-[state=active]:bg-accent">
              <Send className="w-4 h-4 mr-2" />
              Recent Campaigns
            </TabsTrigger>
          </TabsList>

          {/* Groups Tab */}
          <TabsContent value="groups" className="space-y-4">
            {/* Filters */}
            <Card className="bg-card border-border backdrop-blur">
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search groups..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-card border-border focus:border-accent"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-[180px] bg-card border-border">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Filter" />
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
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Groups Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {filteredGroups.map((group, index) => (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card className="bg-card border-border hover:border-accent/50 transition-all group overflow-hidden relative">
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
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
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
                                onClick={() => router.push(`/recipient-groups/${group.id}`)}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
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
                                className="text-error"
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
                          <div className="bg-card rounded-lg p-3">
                            <p className="text-xs text-muted-foreground mb-1">Recipients</p>
                            <p className="text-lg font-bold text-white">
                              {group.total_recipients}
                            </p>
                          </div>
                          <div className="bg-card rounded-lg p-3">
                            <p className="text-xs text-muted-foreground mb-1">Active</p>
                            <p className="text-lg font-bold text-success">
                              {group.active_recipients}
                            </p>
                          </div>
                        </div>

                        {/* Metadata */}
                        <div className="space-y-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                              Created{" "}
                              {formatDistanceToNow(new Date(group.created_at), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                          {group.last_refreshed_at && (
                            <div className="flex items-center gap-2">
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>
                                Last refreshed{" "}
                                {formatDistanceToNow(new Date(group.last_refreshed_at), {
                                  addSuffix: true,
                                })}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="mt-4 flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-border hover:border-accent"
                            onClick={() => router.push(`/recipient-groups/${group.id}`)}
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

            {/* Empty State */}
            {!loading && filteredGroups.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-16"
              >
                <div className="p-6 bg-card rounded-full border border-border mb-6">
                  <UsersRound className="w-16 h-16 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-slate-300 mb-2">
                  No groups found
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery || filterType !== "all"
                    ? "Try adjusting your filters"
                    : "Create your first recipient group to get started"}
                </p>
                {!(searchQuery || filterType !== "all") && (
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
                )}
              </motion.div>
            )}
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {campaigns.map((campaign, index) => (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="bg-card border-border hover:border-accent/50 transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div
                              className={`w-2 h-2 rounded-full ${getCampaignStatusColor(
                                campaign.status
                              )}`}
                            />
                            <h3 className="font-semibold text-white">
                              {campaign.campaign_name}
                            </h3>
                            <Badge
                              className={`${getCampaignStatusColor(
                                campaign.status
                              )} text-white`}
                            >
                              {campaign.status}
                            </Badge>
                          </div>

                          {campaign.group && (
                            <p className="text-sm text-muted-foreground mb-3">
                              Group: {campaign.group.name}
                            </p>
                          )}

                          <div className="flex items-center gap-6">
                            <div>
                              <p className="text-xs text-muted-foreground">Recipients</p>
                              <p className="text-sm font-semibold text-white">
                                {campaign.total_recipients}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Sent</p>
                              <p className="text-sm font-semibold text-success">
                                {campaign.sent_count}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Opened</p>
                              <p className="text-sm font-semibold text-info">
                                {campaign.opened_count}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Replied</p>
                              <p className="text-sm font-semibold text-info">
                                {campaign.replied_count}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Failed</p>
                              <p className="text-sm font-semibold text-error">
                                {campaign.failed_count}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {campaign.status === "sending" && (
                            <div className="text-right mr-4">
                              <p className="text-xs text-muted-foreground">Progress</p>
                              <p className="text-sm font-semibold text-white">
                                {campaign.current_progress}%
                              </p>
                            </div>
                          )}
                          <Button variant="outline" size="icon">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {campaigns.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-16"
              >
                <div className="p-6 bg-card rounded-full border border-border mb-6">
                  <Send className="w-16 h-16 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-slate-300 mb-2">
                  No campaigns yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Create a group and send your first campaign
                </p>
                <Button
                  onClick={() => setCampaignComposerOpen(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Campaign
                </Button>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>

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
          fetchCampaigns();
          setSelectedGroupIdForCampaign(undefined);
        }}
      />
    </div>
  );
}
