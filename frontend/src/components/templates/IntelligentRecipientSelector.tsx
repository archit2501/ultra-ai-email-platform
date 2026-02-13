"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  Check,
  X,
  Mail,
  Building,
  MapPin,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  Sparkles,
  Send,
  UserCheck,
  Globe,
  Target,
  Zap,
  TrendingUp,
  Group,
  UserPlus,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { recipientsAPI, recipientGroupsAPI } from "@/lib/api";

interface Recipient {
  id: number;
  name?: string;
  email: string;
  company?: string;
  position?: string;
  location?: string;
}

interface Group {
  id: number;
  name: string;
  description?: string;
  total_recipients?: number;
  active_recipients?: number;
  recipients?: Recipient[];
}

interface IntelligentRecipientSelectorProps {
  open: boolean;
  onClose: () => void;
  onSend: (recipients: Recipient[], mode: "individuals" | "groups" | "all") => Promise<void>;
  templateName?: string;
}

export function IntelligentRecipientSelector({
  open,
  onClose,
  onSend,
  templateName = "this template",
}: IntelligentRecipientSelectorProps) {
  const [activeTab, setActiveTab] = useState<"individuals" | "groups" | "all">("individuals");
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<Set<number>>(new Set());
  const [selectedGroups, setSelectedGroups] = useState<Set<number>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showAllConfirmation, setShowAllConfirmation] = useState(false);

  // Load recipients and groups
  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load recipients
      const recipientsRes = await recipientsAPI.list({ limit: 1000 });
      setRecipients(recipientsRes.data.items || []);

      // Load groups
      const groupsRes = await recipientGroupsAPI.list({ limit: 100 });
      setGroups(groupsRes.data.items || []);
    } catch (error) {
      toast.error("Failed to load recipients and groups");
    } finally {
      setLoading(false);
    }
  };

  // Filter recipients by search
  const filteredRecipients = recipients.filter(
    (r) =>
      (r.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.company || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.position || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter groups by search
  const filteredGroups = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggle recipient selection
  const toggleRecipient = (id: number) => {
    setSelectedRecipients((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Toggle group selection
  const toggleGroup = async (groupId: number) => {
    setSelectedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });

    // Load group members if not already loaded
    const group = groups.find((g) => g.id === groupId);
    if (group && !group.recipients) {
      try {
        const res = await recipientGroupsAPI.getRecipients(groupId);
        setGroups((prev) =>
          prev.map((g) =>
            g.id === groupId ? { ...g, recipients: res.data.items || [] } : g
          )
        );
      } catch (error) {
        console.error("Failed to load group members");
      }
    }
  };

  // Toggle group expansion
  const toggleGroupExpansion = (groupId: number) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  // Select all in current tab
  const selectAll = () => {
    if (activeTab === "individuals") {
      setSelectedRecipients(new Set(filteredRecipients.map((r) => r.id)));
    } else if (activeTab === "groups") {
      setSelectedGroups(new Set(filteredGroups.map((g) => g.id)));
    }
  };

  // Deselect all
  const deselectAll = () => {
    if (activeTab === "individuals") {
      setSelectedRecipients(new Set());
    } else if (activeTab === "groups") {
      setSelectedGroups(new Set());
    }
  };

  // Calculate total recipients to send to
  const getTotalRecipients = useCallback(() => {
    if (activeTab === "all") {
      return recipients.length;
    }

    let count = selectedRecipients.size;

    // Add group members
    selectedGroups.forEach((groupId) => {
      const group = groups.find((g) => g.id === groupId);
      if (group) {
        count += group.total_recipients || 0;
      }
    });

    return count;
  }, [activeTab, selectedRecipients, selectedGroups, recipients, groups]);

  // Get final recipient list
  const getFinalRecipients = useCallback((): Recipient[] => {
    if (activeTab === "all") {
      return recipients;
    }

    const finalSet = new Set<number>();

    // Add selected individuals
    selectedRecipients.forEach((id) => finalSet.add(id));

    // Add group members
    selectedGroups.forEach((groupId) => {
      const group = groups.find((g) => g.id === groupId);
      if (group && group.recipients) {
        group.recipients.forEach((r) => finalSet.add(r.id));
      }
    });

    return recipients.filter((r) => finalSet.has(r.id));
  }, [activeTab, selectedRecipients, selectedGroups, recipients, groups]);

  // Handle send
  const handleSend = async () => {
    const totalRecipients = getTotalRecipients();

    if (totalRecipients === 0) {
      toast.error("Please select at least one recipient");
      return;
    }

    if (activeTab === "all" && !showAllConfirmation) {
      setShowAllConfirmation(true);
      return;
    }

    setSending(true);
    try {
      const finalRecipients = getFinalRecipients();
      await onSend(finalRecipients, activeTab);

      toast.success(`Email sent to ${finalRecipients.length} recipient${finalRecipients.length > 1 ? "s" : ""}!`, {
        description: `Template "${templateName}" was sent successfully`,
        icon: "🚀",
      });

      // Reset and close
      setSelectedRecipients(new Set());
      setSelectedGroups(new Set());
      setShowAllConfirmation(false);
      onClose();
    } catch (error: any) {
      toast.error("Failed to send email", {
        description: error.message || "An error occurred",
      });
    } finally {
      setSending(false);
    }
  };

  const totalRecipients = getTotalRecipients();
  const hasLargeSend = totalRecipients > 50;

  return (
    <>
      <Dialog open={open && !showAllConfirmation} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] bg-slate-900 border-slate-700 overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <motion.div
                className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600"
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <Send className="h-6 w-6 text-white" />
              </motion.div>
              <span className="text-white">Select Recipients</span>
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-base">
              Choose who will receive <span className="text-cyan-400 font-semibold">{templateName}</span>
            </DialogDescription>
          </DialogHeader>

          {/* Statistics Banner */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass backdrop-blur-xl bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 p-4 rounded-lg"
          >
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{totalRecipients}</div>
                <div className="text-xs text-slate-400">Recipients Selected</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400">{selectedRecipients.size}</div>
                <div className="text-xs text-slate-400">Individuals</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{selectedGroups.size}</div>
                <div className="text-xs text-slate-400">Groups</div>
              </div>
            </div>
            {hasLargeSend && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 flex items-center gap-2 text-yellow-400 text-sm"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>Large send detected. Please ensure your email warming settings allow this volume.</span>
              </motion.div>
            )}
          </motion.div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-3 bg-slate-800">
              <TabsTrigger value="individuals" className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Individuals ({recipients.length})
              </TabsTrigger>
              <TabsTrigger value="groups" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Groups ({groups.length})
              </TabsTrigger>
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Send to All
              </TabsTrigger>
            </TabsList>

            {/* Search Bar */}
            {(activeTab === "individuals" || activeTab === "groups") && (
              <div className="p-4 border-b border-slate-800">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                  <Input
                    className="pl-12 bg-slate-800 border-slate-700 text-white"
                    placeholder={`Search ${activeTab}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={selectAll}
                    className="flex-1 border-slate-700"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Select All ({activeTab === "individuals" ? filteredRecipients.length : filteredGroups.length})
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={deselectAll}
                    className="flex-1 border-slate-700"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Deselect All
                  </Button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-purple-400" />
              </div>
            ) : (
              <>
                {/* Individuals Tab */}
                <TabsContent value="individuals" className="flex-1 overflow-y-auto p-4 space-y-2 mt-0">
                  <AnimatePresence mode="popLayout">
                    {filteredRecipients.map((recipient, index) => (
                      <motion.div
                        key={recipient.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.02 }}
                        whileHover={{ scale: 1.02, x: 5 }}
                        onClick={() => toggleRecipient(recipient.id)}
                        className={`glass backdrop-blur-xl p-4 rounded-lg border cursor-pointer transition-all ${
                          selectedRecipients.has(recipient.id)
                            ? "bg-purple-900/30 border-purple-500/50 shadow-lg shadow-purple-500/20"
                            : "bg-white/5 border-slate-700 hover:border-slate-600"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <Checkbox
                            checked={selectedRecipients.has(recipient.id)}
                            onCheckedChange={() => toggleRecipient(recipient.id)}
                            className="mt-1"
                          />
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                            {(recipient.name || recipient.email).charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-white font-semibold truncate">{recipient.name || recipient.email}</h4>
                              {selectedRecipients.has(recipient.id) && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="flex-shrink-0"
                                >
                                  <Badge className="bg-purple-500">
                                    <Check className="h-3 w-3" />
                                  </Badge>
                                </motion.div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                              <Mail className="h-3 w-3" />
                              <span className="truncate">{recipient.email}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {recipient.company && (
                                <Badge variant="secondary" className="bg-slate-800">
                                  <Building className="h-3 w-3 mr-1" />
                                  {recipient.company}
                                </Badge>
                              )}
                              {recipient.position && (
                                <Badge variant="secondary" className="bg-slate-800">
                                  <Briefcase className="h-3 w-3 mr-1" />
                                  {recipient.position}
                                </Badge>
                              )}
                              {recipient.location && (
                                <Badge variant="secondary" className="bg-slate-800">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {recipient.location}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {filteredRecipients.length === 0 && (
                    <div className="text-center py-12">
                      <UserCheck className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400">No recipients found</p>
                    </div>
                  )}
                </TabsContent>

                {/* Groups Tab */}
                <TabsContent value="groups" className="flex-1 overflow-y-auto p-4 space-y-2 mt-0">
                  <AnimatePresence mode="popLayout">
                    {filteredGroups.map((group, index) => (
                      <motion.div
                        key={group.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.02 }}
                        whileHover={{ scale: 1.02 }}
                        className={`glass backdrop-blur-xl p-4 rounded-lg border transition-all ${
                          selectedGroups.has(group.id)
                            ? "bg-purple-900/30 border-purple-500/50 shadow-lg shadow-purple-500/20"
                            : "bg-white/5 border-slate-700 hover:border-slate-600"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <Checkbox
                            checked={selectedGroups.has(group.id)}
                            onCheckedChange={() => toggleGroup(group.id)}
                            className="mt-1"
                          />
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white flex-shrink-0">
                            <Users className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <h4 className="text-white font-semibold">{group.name}</h4>
                                {selectedGroups.has(group.id) && (
                                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                    <Badge className="bg-purple-500">
                                      <Check className="h-3 w-3" />
                                    </Badge>
                                  </motion.div>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleGroupExpansion(group.id);
                                }}
                                className="h-6 w-6 p-0"
                              >
                                {expandedGroups.has(group.id) ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            {group.description && (
                              <p className="text-sm text-slate-400 mb-2">{group.description}</p>
                            )}
                            <Badge variant="secondary" className="bg-slate-800">
                              <UserPlus className="h-3 w-3 mr-1" />
                              {group.total_recipients} member{group.total_recipients !== 1 ? "s" : ""}
                            </Badge>

                            {/* Expanded members list */}
                            <AnimatePresence>
                              {expandedGroups.has(group.id) && group.recipients && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="mt-3 space-y-2 pl-4 border-l-2 border-purple-500/30"
                                >
                                  {group.recipients.map((member) => (
                                    <div
                                      key={member.id}
                                      className="flex items-center gap-2 text-sm text-slate-300"
                                    >
                                      <div className="h-6 w-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs flex-shrink-0">
                                        {(member.name || member.email).charAt(0).toUpperCase()}
                                      </div>
                                      <span className="truncate">{member.name || member.email}</span>
                                      <span className="text-slate-500">•</span>
                                      <span className="truncate text-slate-500 text-xs">{member.email}</span>
                                    </div>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {filteredGroups.length === 0 && (
                    <div className="text-center py-12">
                      <Group className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400">No groups found</p>
                    </div>
                  )}
                </TabsContent>

                {/* Send to All Tab */}
                <TabsContent value="all" className="flex-1 overflow-y-auto p-6 mt-0">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass backdrop-blur-xl bg-gradient-to-br from-orange-900/30 to-red-900/30 border-2 border-orange-500/50 p-8 rounded-xl text-center"
                  >
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                      className="inline-block mb-4"
                    >
                      <Globe className="h-20 w-20 text-orange-400" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-white mb-3">Send to All Recipients</h3>
                    <p className="text-slate-300 mb-6 max-w-md mx-auto">
                      This will send <span className="text-orange-400 font-bold">{templateName}</span> to all{" "}
                      <span className="text-cyan-400 font-bold">{recipients.length}</span> recipients in your database.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-2 text-yellow-400">
                        <AlertCircle className="h-5 w-5" />
                        <span className="font-medium">This action will send {recipients.length} emails</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                        <Zap className="h-4 w-4" />
                        <span>Ensure email warming limits are configured properly</span>
                      </div>
                    </div>
                  </motion.div>
                </TabsContent>
              </>
            )}
          </Tabs>

          <DialogFooter className="border-t border-slate-800 pt-4">
            <Button variant="outline" onClick={onClose} className="border-slate-700">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending || totalRecipients === 0}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:opacity-90"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send to {totalRecipients} Recipient{totalRecipients !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send to All Confirmation Dialog */}
      <Dialog open={showAllConfirmation} onOpenChange={setShowAllConfirmation}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-red-500/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertCircle className="h-6 w-6" />
              Confirm Send to All
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              You are about to send this email to <strong className="text-red-400">{recipients.length} recipients</strong>. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="glass backdrop-blur-xl bg-red-900/20 border border-red-500/30 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-slate-300">
                <p className="font-medium text-red-400 mb-2">Important Considerations:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>All {recipients.length} recipients will receive this email</li>
                  <li>Check your email warming settings to avoid spam filters</li>
                  <li>This may take several minutes to complete</li>
                  <li>Review your daily send limits before proceeding</li>
                </ul>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAllConfirmation(false)} className="border-slate-700">
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending}
              className="bg-gradient-to-r from-red-500 to-orange-600"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Yes, Send to All {recipients.length}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
