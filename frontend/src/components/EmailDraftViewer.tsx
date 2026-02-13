"use client";

import { useState } from "react";
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
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mail,
  Edit3,
  Eye,
  Save,
  X,
  Star,
  Send,
  FileDown,
  Calendar,
  Zap,
  TrendingUp,
  Copy,
  Check,
  Sparkles,
  Target,
} from "lucide-react";
import { toast } from "sonner";

interface EmailDraft {
  id: number;
  subject_line: string;
  email_body: string;
  email_html?: string;
  tone: string;
  personalization_level?: number;
  confidence_score?: number;
  is_favorite?: boolean;
  is_used?: boolean;
  created_at?: string;
  used_at?: string;
  company_name?: string;
  generation_params?: any;
}

interface EmailDraftViewerProps {
  draft: EmailDraft | null;
  open: boolean;
  onClose: () => void;
  onSave?: (draft: EmailDraft) => Promise<void>;
  onSend?: (draft: EmailDraft) => Promise<void>;
}

export function EmailDraftViewer({
  draft,
  open,
  onClose,
  onSave,
  onSend,
}: EmailDraftViewerProps) {
  const [editMode, setEditMode] = useState(false);
  const [editedSubject, setEditedSubject] = useState("");
  const [editedBody, setEditedBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  // Initialize edit fields when draft changes
  useState(() => {
    if (draft) {
      setEditedSubject(draft.subject_line);
      setEditedBody(draft.email_body);
    }
  });

  if (!draft) return null;

  const getToneColor = (tone: string) => {
    const colors: Record<string, string> = {
      professional: "bg-blue-500",
      friendly: "bg-green-500",
      enthusiastic: "bg-orange-500",
      formal: "bg-purple-500",
      casual: "bg-pink-500",
      story_driven: "bg-cyan-500",
      value_first: "bg-emerald-500",
      consultant: "bg-indigo-500",
    };
    return colors[tone.toLowerCase()] || "bg-slate-500";
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-orange-400";
  };

  const handleEdit = () => {
    setEditedSubject(draft.subject_line);
    setEditedBody(draft.email_body);
    setEditMode(true);
  };

  const handleCancel = () => {
    setEditMode(false);
    setEditedSubject(draft.subject_line);
    setEditedBody(draft.email_body);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updatedDraft = {
        ...draft,
        subject_line: editedSubject,
        email_body: editedBody,
      };
      if (onSave) {
        await onSave(updatedDraft);
      }
      toast.success("Draft saved successfully!");
      setEditMode(false);
    } catch (error) {
      toast.error("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    try {
      setSending(true);
      const draftToSend = editMode
        ? { ...draft, subject_line: editedSubject, email_body: editedBody }
        : draft;
      if (onSend) {
        await onSend(draftToSend);
      }
      toast.success("Email sent successfully!");
      onClose();
    } catch (error) {
      toast.error("Failed to send email. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleCopy = () => {
    const textToCopy = editMode ? editedBody : draft.email_body;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast.success("Email content copied to clipboard.");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const content = `Subject: ${editMode ? editedSubject : draft.subject_line}\n\n${
      editMode ? editedBody : draft.email_body
    }`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `email_draft_${draft.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const personalizationScore = draft.personalization_level || 0;
  const confidenceScore = draft.confidence_score || 0;
  const generationParams = draft.generation_params || {};

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 glass border-slate-700">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-700">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-white">
                  Email Draft Preview
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-1">
                  {draft.company_name && (
                    <span className="text-sm text-slate-400">
                      For: {draft.company_name}
                    </span>
                  )}
                  <Badge className={`${getToneColor(draft.tone)} text-white text-xs`}>
                    {draft.tone}
                  </Badge>
                  {draft.is_favorite && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <Tabs defaultValue="preview" className="flex-1">
          <div className="px-6 py-3 border-b border-slate-700">
            <TabsList className="bg-slate-800">
              <TabsTrigger value="preview" className="data-[state=active]:bg-purple-600">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="edit" className="data-[state=active]:bg-purple-600">
                <Edit3 className="w-4 h-4 mr-2" />
                Edit
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-purple-600">
                <TrendingUp className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[calc(90vh-280px)]">
            {/* Preview Tab */}
            <TabsContent value="preview" className="p-6 space-y-6 m-0">
              <Card className="glass border-slate-700 p-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-slate-400 text-sm">Subject Line</Label>
                    <div className="mt-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                      <p className="text-white font-medium">{draft.subject_line}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-slate-400 text-sm">Email Body</Label>
                    <div className="mt-2 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {draft.email_body}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t border-slate-700">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      className="border-slate-600"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 mr-2 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 mr-2" />
                      )}
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownload}
                      className="border-slate-600"
                    >
                      <FileDown className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Edit Tab */}
            <TabsContent value="edit" className="p-6 space-y-6 m-0">
              <Card className="glass border-slate-700 p-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="subject" className="text-slate-300">
                      Subject Line
                    </Label>
                    <Input
                      id="subject"
                      value={editedSubject}
                      onChange={(e) => setEditedSubject(e.target.value)}
                      className="mt-2 bg-slate-800 border-slate-700 text-white"
                      placeholder="Enter subject line..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="body" className="text-slate-300">
                      Email Body
                    </Label>
                    <Textarea
                      id="body"
                      value={editedBody}
                      onChange={(e) => setEditedBody(e.target.value)}
                      rows={15}
                      className="mt-2 bg-slate-800 border-slate-700 text-white font-mono"
                      placeholder="Enter email body..."
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t border-slate-700">
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      className="border-slate-600"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="p-6 space-y-6 m-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personalization Score */}
                <Card className="glass border-slate-700 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-400">
                        Personalization Score
                      </h3>
                      <p className={`text-3xl font-bold ${getScoreColor(personalizationScore)}`}>
                        {Math.round(personalizationScore)}%
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full transition-all"
                      style={{ width: `${personalizationScore}%` }}
                    />
                  </div>
                </Card>

                {/* Confidence Score */}
                <Card className="glass border-slate-700 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <Target className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-400">
                        Confidence Score
                      </h3>
                      <p className={`text-3xl font-bold ${getScoreColor(confidenceScore)}`}>
                        {Math.round(confidenceScore)}%
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-cyan-600 h-2 rounded-full transition-all"
                      style={{ width: `${confidenceScore}%` }}
                    />
                  </div>
                </Card>
              </div>

              {/* Metadata */}
              <Card className="glass border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Draft Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-slate-400">Draft ID</div>
                    <div className="text-white font-mono">{draft.id}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">Tone</div>
                    <Badge className={`${getToneColor(draft.tone)} text-white mt-1`}>
                      {draft.tone}
                    </Badge>
                  </div>
                  {draft.created_at && (
                    <div>
                      <div className="text-sm text-slate-400">Created At</div>
                      <div className="text-white flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(draft.created_at).toLocaleString()}
                      </div>
                    </div>
                  )}
                  {draft.used_at && (
                    <div>
                      <div className="text-sm text-slate-400">Used At</div>
                      <div className="text-white flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(draft.used_at).toLocaleString()}
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-slate-400">Status</div>
                    <div className="flex items-center gap-2 mt-1">
                      {draft.is_favorite && (
                        <Badge variant="outline" className="border-yellow-500/30 text-yellow-400">
                          <Star className="w-3 h-3 mr-1 fill-yellow-400" />
                          Favorite
                        </Badge>
                      )}
                      {draft.is_used && (
                        <Badge variant="outline" className="border-green-500/30 text-green-400">
                          <Check className="w-3 h-3 mr-1" />
                          Used
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Generation Parameters */}
              {generationParams && Object.keys(generationParams).length > 0 && (
                <Card className="glass border-slate-700 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Generation Parameters
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(generationParams).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm text-slate-400 capitalize">
                          {key.replace(/_/g, " ")}
                        </span>
                        <span className="text-sm text-white font-mono">
                          {typeof value === "object" ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-slate-700 flex items-center justify-between">
          <Button variant="outline" onClick={onClose} className="border-slate-600">
            Close
          </Button>
          <div className="flex items-center gap-2">
            {onSend && (
              <Button
                onClick={handleSend}
                disabled={sending}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                <Send className="w-4 h-4 mr-2" />
                {sending ? "Sending..." : "Send Email"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
