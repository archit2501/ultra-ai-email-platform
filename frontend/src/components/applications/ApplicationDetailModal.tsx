"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building,
  Briefcase,
  Mail,
  Send,
  Calendar,
  Clock,
  User,
  Star,
  StarOff,
  ExternalLink,
  MessageCircle,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  History,
  StickyNote,
  Edit3,
  Trash2,
  Loader2,
  MoreHorizontal,
  Globe,
  Phone,
  Zap,
  Award,
  Target,
  TrendingUp,
} from "lucide-react";
import { applicationsAPI } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";

// Status configurations
const STATUS_CONFIG: Record<string, { color: string; bgColor: string; icon: React.ComponentType<{ className?: string }> }> = {
  draft: { color: "text-slate-400", bgColor: "bg-slate-500/20", icon: FileText },
  sent: { color: "text-blue-400", bgColor: "bg-blue-500/20", icon: Send },
  opened: { color: "text-cyan-400", bgColor: "bg-cyan-500/20", icon: Mail },
  responded: { color: "text-purple-400", bgColor: "bg-purple-500/20", icon: MessageCircle },
  interview: { color: "text-amber-400", bgColor: "bg-amber-500/20", icon: Calendar },
  offer: { color: "text-green-400", bgColor: "bg-green-500/20", icon: Award },
  accepted: { color: "text-emerald-400", bgColor: "bg-emerald-500/20", icon: CheckCircle },
  rejected: { color: "text-red-400", bgColor: "bg-red-500/20", icon: XCircle },
};

const PIPELINE_STAGES = [
  "draft", "sent", "opened", "responded", "interview", "offer", "accepted", "rejected"
];

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
  notes?: string | null;
  priority?: number;
  is_starred?: boolean;
  response_received?: boolean;
  job_posting_url?: string;
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

interface TimelineEvent {
  id: string;
  type: "status" | "note" | "email" | "history";
  title: string;
  description: string;
  date: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface ApplicationDetailModalProps {
  application: Application | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (app: Application) => void;
  onDelete?: (id: number) => void;
}

export function ApplicationDetailModal({
  application,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}: ApplicationDetailModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [notes, setNotes] = useState<ApplicationNote[]>([]);
  const [history, setHistory] = useState<ApplicationHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");

  // Load notes and history when modal opens
  useEffect(() => {
    if (isOpen && application) {
      loadDetails();
    }
  }, [isOpen, application?.id]);

  const loadDetails = async () => {
    if (!application) return;
    setLoading(true);

    try {
      const [notesRes, historyRes] = await Promise.all([
        applicationsAPI.getNotes(application.id),
        applicationsAPI.getHistory(application.id),
      ]);
      setNotes(notesRes.data?.data || []);
      setHistory(historyRes.data?.data || []);
    } catch (error) {
      console.error("Failed to load details:", error);
    } finally {
      setLoading(false);
    }
  };

  // Build timeline events
  const buildTimeline = (): TimelineEvent[] => {
    if (!application) return [];

    const events: TimelineEvent[] = [];

    // Created event
    events.push({
      id: "created",
      type: "status",
      title: "Application Created",
      description: `Applied to ${application.company_name}`,
      date: application.created_at,
      icon: FileText,
      color: "text-slate-400",
    });

    // Sent event
    if (application.sent_at) {
      events.push({
        id: "sent",
        type: "email",
        title: "Email Sent",
        description: `Email sent to ${application.recruiter_name || application.recruiter_email}`,
        date: application.sent_at,
        icon: Send,
        color: "text-blue-400",
      });
    }

    // Opened event
    if (application.opened_at) {
      events.push({
        id: "opened",
        type: "email",
        title: "Email Opened",
        description: "Recruiter opened your email",
        date: application.opened_at,
        icon: Mail,
        color: "text-cyan-400",
      });
    }

    // Reply event
    if (application.replied_at) {
      events.push({
        id: "replied",
        type: "email",
        title: "Reply Received",
        description: "Recruiter responded to your application",
        date: application.replied_at,
        icon: MessageCircle,
        color: "text-purple-400",
      });
    }

    // History events
    history.forEach((h) => {
      events.push({
        id: `history-${h.id}`,
        type: "history",
        title: `${h.field_name} Updated`,
        description: `Changed from "${h.old_value}" to "${h.new_value}"`,
        date: h.created_at,
        icon: History,
        color: "text-amber-400",
      });
    });

    // Note events
    notes.forEach((n) => {
      events.push({
        id: `note-${n.id}`,
        type: "note",
        title: "Note Added",
        description: n.content,
        date: n.created_at,
        icon: StickyNote,
        color: "text-green-400",
      });
    });

    // Sort by date descending
    return events.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  const handleAddNote = async () => {
    if (!application || !newNote.trim()) return;

    setAddingNote(true);
    try {
      const res = await applicationsAPI.addNote(application.id, {
        content: newNote,
        note_type: "general",
      });
      setNotes([res.data, ...notes]);
      setNewNote("");
      toast.success("Note added");
    } catch (error) {
      toast.error("Failed to add note");
    } finally {
      setAddingNote(false);
    }
  };

  const handleStatusChange = async () => {
    if (!application || !newStatus) return;

    setChangingStatus(true);
    try {
      await applicationsAPI.updateStatus(application.id, {
        status: newStatus,
        note: statusNote || undefined,
      });

      const updatedApp = { ...application, status: newStatus };
      onUpdate?.(updatedApp);
      setNewStatus("");
      setStatusNote("");
      toast.success(`Status updated to ${newStatus}`);
      loadDetails(); // Reload history
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setChangingStatus(false);
    }
  };

  const handleSendEmail = async () => {
    if (!application) return;

    try {
      await applicationsAPI.sendEmail(application.id, {});
      toast.success("Email sent successfully!");
      onUpdate?.({ ...application, status: "sent", sent_at: new Date().toISOString() });
      loadDetails();
    } catch (error) {
      toast.error("Failed to send email");
    }
  };

  const handleDelete = async () => {
    if (!application) return;

    if (confirm("Are you sure you want to delete this application?")) {
      try {
        await applicationsAPI.delete(application.id);
        toast.success("Application deleted");
        onDelete?.(application.id);
        onClose();
      } catch (error) {
        toast.error("Failed to delete application");
      }
    }
  };

  if (!application) return null;

  const statusConfig = STATUS_CONFIG[application.status.toLowerCase()] || STATUS_CONFIG.draft;
  const StatusIcon = statusConfig.icon;
  const timeline = buildTimeline();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-slate-900 border-slate-700 p-0">
        {/* Header */}
        <div className="p-6 pb-0">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                {/* Company Avatar */}
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-500/20">
                  {application.company_name?.charAt(0)?.toUpperCase() || "C"}
                </div>

                <div>
                  <DialogTitle className="text-xl font-semibold text-white flex items-center gap-2">
                    {application.company_name}
                    {application.is_starred && (
                      <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                    )}
                  </DialogTitle>
                  <DialogDescription className="text-slate-400 mt-1">
                    {application.position_title || "Position not specified"}
                  </DialogDescription>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={cn("gap-1.5", statusConfig.bgColor, statusConfig.color)}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {application.status}
                    </Badge>
                    {application.priority && application.priority > 0 && (
                      <Badge variant="outline" className="border-orange-500/30 text-orange-400">
                        Priority {application.priority}
                      </Badge>
                    )}
                    {application.response_received && (
                      <Badge variant="outline" className="border-green-500/30 text-green-400">
                        Replied
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-700 hover:border-blue-500/50 hover:text-blue-400"
                  onClick={handleSendEmail}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-red-400"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-6 pt-4">
          <TabsList className="bg-slate-800/50 border border-slate-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700">
              Overview
            </TabsTrigger>
            <TabsTrigger value="timeline" className="data-[state=active]:bg-slate-700">
              Timeline
            </TabsTrigger>
            <TabsTrigger value="notes" className="data-[state=active]:bg-slate-700">
              Notes
              {notes.length > 0 && (
                <Badge className="ml-2 bg-slate-600 text-xs">{notes.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="actions" className="data-[state=active]:bg-slate-700">
              Actions
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[50vh] mt-4 pr-4">
            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-0 space-y-6">
              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Recruiter</Label>
                  <p className="text-white flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400" />
                    {application.recruiter_name || "Not specified"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Email</Label>
                  <p className="text-white flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="truncate">{application.recruiter_email}</span>
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Applied On</Label>
                  <p className="text-white flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    {format(new Date(application.created_at), "PPP")}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Last Activity</Label>
                  <p className="text-white flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    {formatDistanceToNow(new Date(application.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>

              {/* Progress Tracker */}
              <div>
                <Label className="text-xs text-slate-500 mb-3 block">Application Progress</Label>
                <div className="flex items-center gap-1">
                  {PIPELINE_STAGES.map((stage, index) => {
                    const isActive = stage === application.status.toLowerCase();
                    const isPast = PIPELINE_STAGES.indexOf(application.status.toLowerCase()) > index;
                    const config = STATUS_CONFIG[stage];
                    const StageIcon = config?.icon || FileText;

                    return (
                      <div key={stage} className="flex-1">
                        <div className="relative">
                          <div
                            className={cn(
                              "h-2 rounded-full transition-all",
                              isActive
                                ? "bg-blue-500"
                                : isPast
                                ? "bg-green-500"
                                : "bg-slate-700"
                            )}
                          />
                          {isActive && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-8 left-1/2 -translate-x-1/2"
                            >
                              <div className={cn("p-2 rounded-lg", config?.bgColor)}>
                                <StageIcon className={cn("h-4 w-4", config?.color)} />
                              </div>
                            </motion.div>
                          )}
                        </div>
                        <p className={cn(
                          "text-xs mt-1 text-center capitalize",
                          isActive ? "text-white font-medium" : "text-slate-500"
                        )}>
                          {stage}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Email Timeline Summary */}
              {(application.sent_at || application.opened_at || application.replied_at) && (
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <Label className="text-xs text-slate-500 mb-3 block">Email Activity</Label>
                  <div className="space-y-3">
                    {application.sent_at && (
                      <div className="flex items-center gap-3 text-sm">
                        <Send className="h-4 w-4 text-blue-400" />
                        <span className="text-slate-400">Sent</span>
                        <span className="text-white ml-auto">
                          {format(new Date(application.sent_at), "PPp")}
                        </span>
                      </div>
                    )}
                    {application.opened_at && (
                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="h-4 w-4 text-cyan-400" />
                        <span className="text-slate-400">Opened</span>
                        <span className="text-white ml-auto">
                          {format(new Date(application.opened_at), "PPp")}
                        </span>
                      </div>
                    )}
                    {application.replied_at && (
                      <div className="flex items-center gap-3 text-sm">
                        <MessageCircle className="h-4 w-4 text-purple-400" />
                        <span className="text-slate-400">Replied</span>
                        <span className="text-white ml-auto">
                          {format(new Date(application.replied_at), "PPp")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Job URL */}
              {application.job_posting_url && (
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <Label className="text-xs text-slate-500 mb-2 block">Job Posting</Label>
                  <a
                    href={application.job_posting_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
                  >
                    <Globe className="h-4 w-4" />
                    <span className="truncate">{application.job_posting_url}</span>
                    <ExternalLink className="h-3 w-3 ml-auto flex-shrink-0" />
                  </a>
                </div>
              )}
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="mt-0">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : timeline.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-slate-500">
                  <History className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No activity yet</p>
                </div>
              ) : (
                <div className="relative pl-8 space-y-6">
                  {/* Timeline line */}
                  <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-slate-700" />

                  {timeline.map((event, index) => {
                    const EventIcon = event.icon;
                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="relative"
                      >
                        {/* Timeline dot */}
                        <div
                          className={cn(
                            "absolute -left-8 w-6 h-6 rounded-full flex items-center justify-center bg-slate-800 border-2 border-slate-700",
                            event.color
                          )}
                        >
                          <EventIcon className="h-3 w-3" />
                        </div>

                        {/* Event content */}
                        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-white">
                                {event.title}
                              </h4>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {event.description}
                              </p>
                            </div>
                            <span className="text-xs text-slate-500">
                              {formatDistanceToNow(new Date(event.date), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes" className="mt-0 space-y-4">
              {/* Add Note Form */}
              <div className="bg-slate-800/50 rounded-xl p-4">
                <Label className="text-xs text-slate-500 mb-2 block">Add a Note</Label>
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Write your note here..."
                  className="bg-slate-900 border-slate-700 min-h-[100px]"
                />
                <Button
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || addingNote}
                  className="mt-3 bg-blue-600 hover:bg-blue-700"
                >
                  {addingNote ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <StickyNote className="h-4 w-4 mr-2" />
                  )}
                  Add Note
                </Button>
              </div>

              {/* Notes List */}
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : notes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-slate-500">
                  <StickyNote className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No notes yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notes.map((note, index) => (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50"
                    >
                      <p className="text-sm text-white">{note.content}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-slate-500">
                          {format(new Date(note.created_at), "PPp")}
                        </span>
                        <Badge variant="outline" className="text-xs border-slate-700">
                          {note.note_type}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Actions Tab */}
            <TabsContent value="actions" className="mt-0 space-y-4">
              {/* Change Status */}
              <div className="bg-slate-800/50 rounded-xl p-4">
                <Label className="text-xs text-slate-500 mb-3 block">Update Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="bg-slate-900 border-slate-700">
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {PIPELINE_STAGES.map((stage) => {
                      const config = STATUS_CONFIG[stage];
                      const StageIcon = config?.icon || FileText;
                      return (
                        <SelectItem
                          key={stage}
                          value={stage}
                          className="text-white hover:bg-slate-700 capitalize"
                        >
                          <span className="flex items-center gap-2">
                            <StageIcon className={cn("h-4 w-4", config?.color)} />
                            {stage}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                <Textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Add a note about this status change (optional)"
                  className="mt-3 bg-slate-900 border-slate-700"
                  rows={2}
                />

                <Button
                  onClick={handleStatusChange}
                  disabled={!newStatus || changingStatus}
                  className="mt-3 bg-blue-600 hover:bg-blue-700"
                >
                  {changingStatus ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  Update Status
                </Button>
              </div>

              {/* Quick Actions */}
              <div className="bg-slate-800/50 rounded-xl p-4">
                <Label className="text-xs text-slate-500 mb-3 block">Quick Actions</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="border-slate-700 hover:border-blue-500/50 hover:text-blue-400 h-12"
                    onClick={handleSendEmail}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Email
                  </Button>
                  <Button
                    variant="outline"
                    className="border-slate-700 hover:border-amber-500/50 hover:text-amber-400 h-12"
                    onClick={() => {
                      // Toggle starred
                      const updatedApp = { ...application, is_starred: !application.is_starred };
                      onUpdate?.(updatedApp);
                    }}
                  >
                    {application.is_starred ? (
                      <>
                        <StarOff className="h-4 w-4 mr-2" />
                        Unstar
                      </>
                    ) : (
                      <>
                        <Star className="h-4 w-4 mr-2" />
                        Star
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="border-slate-700 hover:border-green-500/50 hover:text-green-400 h-12"
                    onClick={() => router.push(`/pipeline?highlight=${application.id}`)}
                  >
                    <Target className="h-4 w-4 mr-2" />
                    View in Pipeline
                  </Button>
                  <Button
                    variant="outline"
                    className="border-slate-700 hover:border-red-500/50 hover:text-red-400 h-12"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Footer */}
        <DialogFooter className="p-6 pt-4 border-t border-slate-800">
          <Button variant="ghost" onClick={onClose} className="border-slate-700">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
