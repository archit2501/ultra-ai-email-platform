"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  RefreshCw,
  Plus,
  Trash2,
  Mail,
  Edit,
  Users,
  Zap,
  Send,
  TrendingUp,
  Building2,
  MapPin,
  Calendar,
  UserCircle2,
  MoreVertical,
  CheckCircle,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { recipientGroupsAPI, groupCampaignsAPI } from "@/lib/api";
import type { RecipientGroup, Recipient, GroupCampaign } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { GroupCampaignComposer } from "@/components/GroupCampaignComposer";

export default function GroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = Number(params.id);

  const [group, setGroup] = useState<RecipientGroup | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [campaigns, setCampaigns] = useState<GroupCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState("recipients");
  const [campaignComposerOpen, setCampaignComposerOpen] = useState(false);

  useEffect(() => {
    if (groupId) {
      fetchGroupData();
      fetchRecipients();
      fetchCampaigns();
    }
  }, [groupId]);

  const fetchGroupData = useCallback(async () => {
    try {
      const { data } = await recipientGroupsAPI.getById(groupId);
      setGroup(data);
    } catch (error: any) {
      toast.error("Failed to load group");
      router.push("/recipient-groups");
    }
  }, [groupId]);

  const fetchRecipients = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await recipientGroupsAPI.getRecipients(groupId, { limit: 1000 });
      setRecipients(data.items || data);
    } catch (error: any) {
      toast.error("Failed to load recipients");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const fetchCampaigns = useCallback(async () => {
    try {
      const { data } = await groupCampaignsAPI.list({ group_id: groupId, limit: 100 });
      setCampaigns(data.items || data);
    } catch (error: any) {
      console.error("Failed to load campaigns:", error);
    }
  }, [groupId]);

  const handleRefreshGroup = async () => {
    try {
      const result = await recipientGroupsAPI.refreshDynamicGroup(groupId);
      toast.success(
        `Group refreshed! Added ${result.data.recipients_added}, removed ${result.data.recipients_removed}`
      );
      fetchGroupData();
      fetchRecipients();
    } catch (error: any) {
      toast.error("Failed to refresh group");
    }
  };

  const handleRemoveRecipients = async () => {
    if (selectedIds.length === 0) return;

    if (confirm(`Remove ${selectedIds.length} recipients from this group?`)) {
      try {
        await recipientGroupsAPI.removeRecipients(groupId, selectedIds);
        toast.success(`Removed ${selectedIds.length} recipients`);
        setSelectedIds([]);
        fetchRecipients();
        fetchGroupData();
      } catch (error: any) {
        toast.error("Failed to remove recipients");
      }
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === recipients.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(recipients.map((r) => r.id));
    }
  };

  if (!group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading group...</p>
        </div>
      </div>
    );
  }

  const getGroupTypeColor = (type: string) => {
    return type === "dynamic"
      ? "from-purple-500 to-pink-500"
      : "from-blue-500 to-cyan-500";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <Button
          variant="ghost"
          onClick={() => router.push("/recipient-groups")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Groups
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <div
              className={`p-4 bg-gradient-to-br ${getGroupTypeColor(
                group.group_type
              )}/20 rounded-xl border border-${
                group.group_type === "dynamic" ? "purple" : "blue"
              }-500/30`}
            >
              {group.group_type === "dynamic" ? (
                <Zap className="w-8 h-8 text-accent" />
              ) : (
                <Users className="w-8 h-8 text-info" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {group.color && (
                  <div
                    className="w-4 h-4 rounded-full ring-2 ring-slate-800"
                    style={{ backgroundColor: group.color }}
                  />
                )}
                <h1 className="text-3xl font-bold text-white">{group.name}</h1>
                <Badge
                  className={
                    group.group_type === "dynamic"
                      ? "bg-accent/20 text-accent border-accent/30"
                      : "bg-info/20 text-info border-info/30"
                  }
                >
                  {group.group_type === "dynamic" ? (
                    <>
                      <Zap className="w-3 h-3 mr-1" />
                      Dynamic
                    </>
                  ) : (
                    <>
                      <Users className="w-3 h-3 mr-1" />
                      Static
                    </>
                  )}
                </Badge>
              </div>
              <p className="text-muted-foreground mb-3">
                {group.description || "No description"}
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Created {formatDistanceToNow(new Date(group.created_at), { addSuffix: true })}
                </div>
                {group.last_refreshed_at && (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Last refreshed{" "}
                    {formatDistanceToNow(new Date(group.last_refreshed_at), { addSuffix: true })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {group.group_type === "dynamic" && (
              <Button
                variant="outline"
                onClick={handleRefreshGroup}
                className="border-border hover:border-accent"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            )}
            <Button variant="outline" className="border-border">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              onClick={() => setCampaignComposerOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
            >
              <Send className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
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
                <p className="text-muted-foreground text-sm">Total Recipients</p>
                <p className="text-2xl font-bold text-white mt-1">{group.total_recipients}</p>
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
                <p className="text-muted-foreground text-sm">Active</p>
                <p className="text-2xl font-bold text-success mt-1">{group.active_recipients}</p>
              </div>
              <div className="p-3 bg-success/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Campaigns</p>
                <p className="text-2xl font-bold text-accent mt-1">{campaigns.length}</p>
              </div>
              <div className="p-3 bg-accent/20 rounded-lg">
                <Mail className="w-5 h-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Engagement</p>
                <p className="text-2xl font-bold text-warning mt-1">
                  {recipients.length > 0
                    ? (
                        recipients.reduce((sum, r) => sum + r.engagement_score, 0) /
                        recipients.length
                      ).toFixed(1)
                    : "0"}
                </p>
              </div>
              <div className="p-3 bg-warning/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-card border border-border mb-4">
            <TabsTrigger value="recipients" className="data-[state=active]:bg-accent">
              <Users className="w-4 h-4 mr-2" />
              Recipients ({recipients.length})
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="data-[state=active]:bg-accent">
              <Send className="w-4 h-4 mr-2" />
              Campaigns ({campaigns.length})
            </TabsTrigger>
            {group.group_type === "dynamic" && (
              <TabsTrigger value="filters" className="data-[state=active]:bg-accent">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </TabsTrigger>
            )}
          </TabsList>

          {/* Recipients Tab */}
          <TabsContent value="recipients" className="space-y-4">
            {selectedIds.length > 0 && (
              <Card className="bg-info/10 border-info/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox checked={true} onCheckedChange={toggleSelectAll} />
                      <span className="text-sm font-medium text-info">
                        {selectedIds.length} selected
                      </span>
                    </div>
                    <Button size="sm" variant="destructive" onClick={handleRemoveRecipients}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove from Group
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-card border-border backdrop-blur">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedIds.length === recipients.length && recipients.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Engagement</TableHead>
                    <TableHead>Emails Sent</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recipients.map((recipient) => (
                    <TableRow key={recipient.id} className="border-border">
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(recipient.id)}
                          onCheckedChange={() => toggleSelect(recipient.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{recipient.name || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{recipient.email}</TableCell>
                      <TableCell className="text-muted-foreground">{recipient.company || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{recipient.country || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{recipient.engagement_score.toFixed(1)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{recipient.total_emails_sent}</Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Mail className="w-4 h-4 mr-2" />
                              Send Email
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <UserCircle2 className="w-4 h-4 mr-2" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-error">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            {recipients.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="p-6 bg-card rounded-full border border-border mb-6">
                  <Users className="w-16 h-16 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-slate-300 mb-2">No recipients yet</h3>
                <p className="text-muted-foreground mb-6">
                  {group.group_type === "dynamic"
                    ? "Refresh this group to populate it with recipients matching your filters"
                    : "Add recipients to this group to get started"}
                </p>
                <Button
                  onClick={() => {
                    if (group.group_type === "dynamic") {
                      handleRefreshGroup();
                    }
                  }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {group.group_type === "dynamic" ? "Refresh Group" : "Add Recipients"}
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-4">
            {campaigns.map((campaign) => (
              <Card
                key={campaign.id}
                className="bg-card border-border hover:border-accent/50 transition-all"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white mb-1">{campaign.campaign_name}</h3>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">Sent: {campaign.sent_count}</span>
                        <span className="text-success">Opened: {campaign.opened_count}</span>
                        <span className="text-info">Replied: {campaign.replied_count}</span>
                      </div>
                    </div>
                    <Badge className={`${campaign.status === "completed" ? "bg-success" : "bg-info"}`}>
                      {campaign.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}

            {campaigns.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="p-6 bg-card rounded-full border border-border mb-6">
                  <Send className="w-16 h-16 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-slate-300 mb-2">
                  No campaigns yet
                </h3>
                <p className="text-muted-foreground mb-6">Create your first campaign for this group</p>
                <Button
                  onClick={() => setCampaignComposerOpen(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Campaign
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Filters Tab (Dynamic Groups Only) */}
          {group.group_type === "dynamic" && (
            <TabsContent value="filters">
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-white mb-4">Filter Criteria</h3>
                  {group.filter_criteria ? (
                    <div className="space-y-3">
                      {group.filter_criteria.companies && group.filter_criteria.companies.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Companies:</p>
                          <div className="flex flex-wrap gap-2">
                            {group.filter_criteria.companies.map((company, i) => (
                              <Badge key={i} variant="outline">
                                {company}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {group.filter_criteria.countries && group.filter_criteria.countries.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Countries:</p>
                          <div className="flex flex-wrap gap-2">
                            {group.filter_criteria.countries.map((country, i) => (
                              <Badge key={i} variant="outline">
                                {country}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {group.filter_criteria.tags && group.filter_criteria.tags.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Tags:</p>
                          <div className="flex flex-wrap gap-2">
                            {group.filter_criteria.tags.map((tag, i) => (
                              <Badge key={i} variant="outline">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No filter criteria configured</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </motion.div>

      {/* Campaign Composer */}
      <GroupCampaignComposer
        open={campaignComposerOpen}
        onOpenChange={setCampaignComposerOpen}
        preselectedGroupId={groupId}
        onSuccess={() => {
          fetchCampaigns();
        }}
      />
    </div>
  );
}
