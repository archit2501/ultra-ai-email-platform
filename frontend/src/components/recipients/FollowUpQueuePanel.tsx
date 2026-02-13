"use client";

/**
 * FOLLOW-UP QUEUE PANEL
 *
 * Shows recipients who need follow-up (no response in X days)
 * Features:
 * - Configurable days threshold
 * - Auto follow-up settings
 * - Bulk send follow-ups
 * - Individual follow-up actions
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw,
  Clock,
  Send,
  Settings,
  CheckCircle2,
  AlertCircle,
  Mail,
  Building2,
  Calendar,
  Zap,
  Users,
  Timer,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
  MessageSquare,
  ArrowRight,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { recipientsAPI } from "@/lib/api";
import { cn } from "@/lib/utils";

interface FollowUpQueueItem {
  recipient_id: number;
  name: string;
  email: string;
  company: string;
  position: string;
  country: string;
  last_contacted_at: string;
  days_waiting: number;
  total_emails_sent: number;
  application: {
    id: number;
    position_title: string;
    status: string;
    sent_at: string;
  } | null;
  follow_up_count: number;
}

interface FollowUpSettings {
  auto_follow_up_enabled: boolean;
  days_before_follow_up: number;
  max_follow_ups: number;
  follow_up_interval_days: number;
  stop_on_reply: boolean;
  excluded_statuses: string[];
}

export default function FollowUpQueuePanel() {
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState<FollowUpQueueItem[]>([]);
  const [daysThreshold, setDaysThreshold] = useState(5);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [settings, setSettings] = useState<FollowUpSettings>({
    auto_follow_up_enabled: false,
    days_before_follow_up: 5,
    max_follow_ups: 3,
    follow_up_interval_days: 5,
    stop_on_reply: true,
    excluded_statuses: ["replied", "rejected", "accepted"],
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bulkSendOpen, setBulkSendOpen] = useState(false);
  const [sending, setSending] = useState(false);

  // Bulk send template
  const [subjectTemplate, setSubjectTemplate] = useState(
    "Following up on my application for {position}"
  );
  const [bodyTemplate, setBodyTemplate] = useState(
    `Hi {name},

I hope this message finds you well. I wanted to follow up on my application for the position at {company} that I sent {days_waiting} days ago.

I remain very interested in this opportunity and would love to discuss how my skills could contribute to your team.

Would you have a few minutes for a brief conversation?

Best regards`
  );

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await recipientsAPI.getFollowUpQueue(daysThreshold);
      setQueue(data.queue || []);
    } catch (error) {
      console.error("Failed to fetch follow-up queue:", error);
      toast.error("Failed to load follow-up queue");
    } finally {
      setLoading(false);
    }
  }, [daysThreshold]);

  const fetchSettings = useCallback(async () => {
    try {
      const { data } = await recipientsAPI.getFollowUpSettings();
      setSettings(data);
      setDaysThreshold(data.days_before_follow_up);
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    fetchSettings();
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [daysThreshold]);

  const handleSaveSettings = async () => {
    try {
      await recipientsAPI.updateFollowUpSettings(settings);
      toast.success("Follow-up settings saved!");
      setSettingsOpen(false);
    } catch (error) {
      toast.error("Failed to save settings");
    }
  };

  const handleBulkSend = async () => {
    if (selectedIds.length === 0) {
      toast.error("No recipients selected");
      return;
    }

    setSending(true);
    try {
      const result = await recipientsAPI.bulkSendFollowUps(selectedIds, {
        subject_template: subjectTemplate,
        body_template: bodyTemplate,
      });

      const { sent, failed, skipped } = result.data.results;
      toast.success(
        `Follow-ups sent! ${sent.length} sent, ${failed.length} failed, ${skipped.length} skipped`
      );

      setBulkSendOpen(false);
      setSelectedIds([]);
      fetchQueue();
    } catch (error) {
      toast.error("Failed to send follow-ups");
    } finally {
      setSending(false);
    }
  };

  const handleSingleFollowUp = async (item: FollowUpQueueItem) => {
    try {
      const subject = subjectTemplate
        .replace("{name}", item.name || "there")
        .replace("{company}", item.company || "your company")
        .replace("{position}", item.application?.position_title || "the position")
        .replace("{days_waiting}", String(item.days_waiting));

      const body = bodyTemplate
        .replace("{name}", item.name || "there")
        .replace("{company}", item.company || "your company")
        .replace("{position}", item.application?.position_title || "the position")
        .replace("{days_waiting}", String(item.days_waiting));

      await recipientsAPI.sendFollowUp(item.recipient_id, {
        subject,
        body,
        follow_up_number: item.follow_up_count + 1,
      });

      toast.success(`Follow-up sent to ${item.name || item.email}`);
      fetchQueue();
    } catch (error) {
      toast.error("Failed to send follow-up");
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === queue.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(queue.map((q) => q.recipient_id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const getDaysColor = (days: number) => {
    if (days >= 14) return "text-red-400 bg-red-500/10 border-red-500/30";
    if (days >= 7) return "text-orange-400 bg-orange-500/10 border-orange-500/30";
    return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Awaiting Response</p>
                <p className="text-2xl font-bold text-amber-400 mt-1">
                  {queue.length}
                </p>
              </div>
              <div className="p-3 bg-amber-500/20 rounded-lg">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Days Threshold</p>
                <p className="text-2xl font-bold text-cyan-400 mt-1">
                  {daysThreshold}+
                </p>
              </div>
              <div className="p-3 bg-cyan-500/20 rounded-lg">
                <Timer className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Auto Follow-up</p>
                <p className="text-2xl font-bold mt-1">
                  {settings.auto_follow_up_enabled ? (
                    <span className="text-green-400">ON</span>
                  ) : (
                    <span className="text-slate-500">OFF</span>
                  )}
                </p>
              </div>
              <div
                className={cn(
                  "p-3 rounded-lg",
                  settings.auto_follow_up_enabled
                    ? "bg-green-500/20"
                    : "bg-slate-700/50"
                )}
              >
                <Zap
                  className={cn(
                    "w-5 h-5",
                    settings.auto_follow_up_enabled
                      ? "text-green-400"
                      : "text-slate-500"
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Max Follow-ups</p>
                <p className="text-2xl font-bold text-purple-400 mt-1">
                  {settings.max_follow_ups}
                </p>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <MessageSquare className="w-5 h-5 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Days Threshold Selector */}
              <div className="flex items-center gap-3">
                <Label className="text-slate-400 whitespace-nowrap">
                  No response in:
                </Label>
                <Select
                  value={String(daysThreshold)}
                  onValueChange={(v) => setDaysThreshold(Number(v))}
                >
                  <SelectTrigger className="w-[120px] bg-slate-800/50 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3+ days</SelectItem>
                    <SelectItem value="5">5+ days</SelectItem>
                    <SelectItem value="7">7+ days</SelectItem>
                    <SelectItem value="10">10+ days</SelectItem>
                    <SelectItem value="14">14+ days</SelectItem>
                    <SelectItem value="21">21+ days</SelectItem>
                    <SelectItem value="30">30+ days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={fetchQueue}
                disabled={loading}
              >
                <RefreshCw
                  className={cn("w-4 h-4", loading && "animate-spin")}
                />
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setSettingsOpen(true)}
                className="border-slate-700"
              >
                <Settings className="w-4 h-4 mr-2" />
                Auto Settings
              </Button>

              {selectedIds.length > 0 && (
                <Button
                  onClick={() => setBulkSendOpen(true)}
                  className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Follow-ups ({selectedIds.length})
                </Button>
              )}
            </div>
          </div>

          {/* Bulk Selection */}
          {queue.length > 0 && (
            <div className="mt-4 flex items-center gap-3 pt-4 border-t border-slate-800">
              <Checkbox
                checked={selectedIds.length === queue.length && queue.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm text-slate-400">
                {selectedIds.length > 0
                  ? `${selectedIds.length} selected`
                  : "Select all"}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Queue List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        </div>
      ) : queue.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-16"
        >
          <div className="p-6 bg-slate-900 rounded-full border border-slate-800 mb-6">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
          </div>
          <h3 className="text-xl font-semibold text-slate-300 mb-2">
            All caught up!
          </h3>
          <p className="text-slate-400 text-center max-w-md">
            No recipients are waiting for a follow-up with {daysThreshold}+ days
            since last contact. Great job staying on top of your outreach!
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {queue.map((item, index) => (
              <motion.div
                key={item.recipient_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card
                  className={cn(
                    "bg-slate-900/50 border-slate-800 hover:border-amber-500/50 transition-all",
                    selectedIds.includes(item.recipient_id) &&
                      "border-amber-500/50 bg-amber-500/5"
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={selectedIds.includes(item.recipient_id)}
                        onCheckedChange={() => toggleSelect(item.recipient_id)}
                        className="mt-1"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-semibold text-white truncate">
                                {item.name || "No name"}
                              </h3>
                              <Badge
                                className={cn(
                                  "text-xs font-medium",
                                  getDaysColor(item.days_waiting)
                                )}
                              >
                                <Clock className="w-3 h-3 mr-1" />
                                {item.days_waiting} days
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-400 truncate">
                              {item.email}
                            </p>
                          </div>

                          <Button
                            size="sm"
                            onClick={() => handleSingleFollowUp(item)}
                            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500"
                          >
                            <Send className="w-3.5 h-3.5 mr-1" />
                            Follow Up
                          </Button>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-400">
                          {item.company && (
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5" />
                              <span>{item.company}</span>
                            </div>
                          )}
                          {item.application?.position_title && (
                            <div className="flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>{item.application.position_title}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5" />
                            <span>{item.total_emails_sent} emails sent</span>
                          </div>
                          {item.last_contacted_at && (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>
                                Last:{" "}
                                {new Date(
                                  item.last_contacted_at
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>

                        {item.follow_up_count > 0 && (
                          <div className="mt-2">
                            <Badge
                              variant="outline"
                              className="text-xs border-slate-700"
                            >
                              {item.follow_up_count} follow-up
                              {item.follow_up_count > 1 ? "s" : ""} sent
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Auto Follow-up Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-400" />
              Auto Follow-up Settings
            </DialogTitle>
            <DialogDescription>
              Configure automatic follow-up behavior for all recipients
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Enable Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <div className="flex items-center gap-3">
                <Zap
                  className={cn(
                    "w-5 h-5",
                    settings.auto_follow_up_enabled
                      ? "text-green-400"
                      : "text-slate-500"
                  )}
                />
                <div>
                  <p className="font-medium text-white">
                    Enable Auto Follow-up
                  </p>
                  <p className="text-sm text-slate-400">
                    Automatically send follow-ups based on your settings
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.auto_follow_up_enabled}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    auto_follow_up_enabled: checked,
                  }))
                }
              />
            </div>

            {/* Days Before Follow-up */}
            <div className="space-y-3">
              <Label className="text-slate-300">Days before follow-up</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[settings.days_before_follow_up]}
                  onValueChange={([value]) =>
                    setSettings((prev) => ({
                      ...prev,
                      days_before_follow_up: value,
                    }))
                  }
                  min={1}
                  max={14}
                  step={1}
                  className="flex-1"
                />
                <span className="w-12 text-center font-mono text-amber-400">
                  {settings.days_before_follow_up}d
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Send follow-up after this many days with no response
              </p>
            </div>

            {/* Max Follow-ups */}
            <div className="space-y-3">
              <Label className="text-slate-300">Maximum follow-ups</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[settings.max_follow_ups]}
                  onValueChange={([value]) =>
                    setSettings((prev) => ({ ...prev, max_follow_ups: value }))
                  }
                  min={1}
                  max={5}
                  step={1}
                  className="flex-1"
                />
                <span className="w-12 text-center font-mono text-purple-400">
                  {settings.max_follow_ups}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Stop after sending this many follow-up emails
              </p>
            </div>

            {/* Follow-up Interval */}
            <div className="space-y-3">
              <Label className="text-slate-300">
                Days between follow-ups
              </Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[settings.follow_up_interval_days]}
                  onValueChange={([value]) =>
                    setSettings((prev) => ({
                      ...prev,
                      follow_up_interval_days: value,
                    }))
                  }
                  min={2}
                  max={14}
                  step={1}
                  className="flex-1"
                />
                <span className="w-12 text-center font-mono text-cyan-400">
                  {settings.follow_up_interval_days}d
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Wait this many days between each follow-up
              </p>
            </div>

            {/* Stop on Reply */}
            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <div>
                <p className="font-medium text-white">Stop on reply</p>
                <p className="text-sm text-slate-400">
                  Stop follow-up sequence when recipient replies
                </p>
              </div>
              <Switch
                checked={settings.stop_on_reply}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, stop_on_reply: checked }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSettingsOpen(false)}
              className="border-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSettings}
              className="bg-gradient-to-r from-amber-600 to-orange-600"
            >
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Send Dialog */}
      <Dialog open={bulkSendOpen} onOpenChange={setBulkSendOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-amber-400" />
              Send Bulk Follow-ups
            </DialogTitle>
            <DialogDescription>
              Send follow-up emails to {selectedIds.length} selected recipients
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Subject Template */}
            <div className="space-y-2">
              <Label className="text-slate-300">Subject Line Template</Label>
              <Input
                value={subjectTemplate}
                onChange={(e) => setSubjectTemplate(e.target.value)}
                placeholder="Following up on {position}"
                className="bg-slate-800/50 border-slate-700"
              />
              <p className="text-xs text-slate-500">
                Use placeholders: {"{name}"}, {"{company}"}, {"{position}"},{" "}
                {"{days_waiting}"}
              </p>
            </div>

            {/* Body Template */}
            <div className="space-y-2">
              <Label className="text-slate-300">Email Body Template</Label>
              <Textarea
                value={bodyTemplate}
                onChange={(e) => setBodyTemplate(e.target.value)}
                placeholder="Hi {name},..."
                rows={10}
                className="bg-slate-800/50 border-slate-700 font-mono text-sm"
              />
            </div>

            {/* Preview */}
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between"
                >
                  <span className="text-slate-400">Preview with first recipient</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                {queue[0] && (
                  <div className="mt-2 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <p className="text-xs text-slate-500 mb-2">Subject:</p>
                    <p className="text-sm text-white mb-4">
                      {subjectTemplate
                        .replace("{name}", queue[0].name || "there")
                        .replace("{company}", queue[0].company || "your company")
                        .replace(
                          "{position}",
                          queue[0].application?.position_title || "the position"
                        )
                        .replace("{days_waiting}", String(queue[0].days_waiting))}
                    </p>
                    <p className="text-xs text-slate-500 mb-2">Body:</p>
                    <p className="text-sm text-slate-300 whitespace-pre-line">
                      {bodyTemplate
                        .replace("{name}", queue[0].name || "there")
                        .replace("{company}", queue[0].company || "your company")
                        .replace(
                          "{position}",
                          queue[0].application?.position_title || "the position"
                        )
                        .replace("{days_waiting}", String(queue[0].days_waiting))}
                    </p>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkSendOpen(false)}
              className="border-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkSend}
              disabled={sending}
              className="bg-gradient-to-r from-amber-600 to-orange-600"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send to {selectedIds.length} Recipients
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
