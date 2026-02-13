"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Send,
  Loader2,
  Sparkles,
  Eye,
  Calendar,
  Clock,
  Zap,
  Mail,
  User,
  Building2,
  Code,
  CheckCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { groupCampaignsAPI, recipientGroupsAPI, templatesAPI, recipientsAPI } from "@/lib/api";
import type { RecipientGroup, EmailTemplate, Recipient, GroupCampaignCreate } from "@/types";

const campaignSchema = z.object({
  campaign_name: z.string().min(1, "Campaign name is required"),
  group_id: z.number().min(1, "Group is required"),
  template_id: z.number().optional(),
  subject_template: z.string().optional(),
  body_template: z.string().optional(),
  send_delay_seconds: z.number().min(0).max(300).optional(),
  scheduled_at: z.string().optional(),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

interface GroupCampaignComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedGroupId?: number;
  onSuccess?: () => void;
}

const PERSONALIZATION_VARIABLES = [
  { var: "{{recipient.name}}", desc: "Recipient's full name", example: "John Doe" },
  { var: "{{recipient.first_name}}", desc: "First name only", example: "John" },
  { var: "{{recipient.email}}", desc: "Email address", example: "john@company.com" },
  { var: "{{recipient.company}}", desc: "Company name", example: "Acme Corp" },
  { var: "{{recipient.position}}", desc: "Job position", example: "Senior Engineer" },
  { var: "{{recipient.country}}", desc: "Country", example: "United States" },
  { var: "{{candidate.name}}", desc: "Your name", example: "Jane Smith" },
  { var: "{{candidate.title}}", desc: "Your title", example: "Software Developer" },
];

export function GroupCampaignComposer({
  open,
  onOpenChange,
  preselectedGroupId,
  onSuccess,
}: GroupCampaignComposerProps) {
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<RecipientGroup[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<RecipientGroup | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<{
    rendered_subject: string;
    rendered_body: string;
    sample_recipient?: Recipient;
  } | null>(null);
  const [activeTab, setActiveTab] = useState("compose");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      campaign_name: "",
      group_id: preselectedGroupId || 0,
      send_delay_seconds: 30,
      subject_template: "",
      body_template: "",
    },
  });

  const watchGroupId = watch("group_id");
  const watchTemplateId = watch("template_id");
  const watchSubject = watch("subject_template");
  const watchBody = watch("body_template");

  useEffect(() => {
    if (open) {
      fetchGroups();
      fetchTemplates();
      if (preselectedGroupId) {
        setValue("group_id", preselectedGroupId);
      }
    }
  }, [open, preselectedGroupId]);

  useEffect(() => {
    if (watchGroupId) {
      const group = groups.find((g) => g.id === watchGroupId);
      setSelectedGroup(group || null);
    }
  }, [watchGroupId, groups]);

  useEffect(() => {
    if (watchTemplateId) {
      const template = templates.find((t) => t.id === watchTemplateId);
      if (template) {
        setSelectedTemplate(template);
        setValue("subject_template", template.subject_template || "");
        setValue("body_template", template.body_template_text || "");
      }
    }
  }, [watchTemplateId, templates]);

  const fetchGroups = async () => {
    try {
      const { data } = await recipientGroupsAPI.list({ limit: 1000 });
      setGroups(data.items || data);
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data } = await templatesAPI.list({ limit: 1000 });
      setTemplates(data.items || data);
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    }
  };

  const handlePreview = async () => {
    if (!watchGroupId) {
      toast.error("Please select a group first");
      return;
    }

    setPreviewLoading(true);
    try {
      const { data } = await groupCampaignsAPI.preview({
        group_id: watchGroupId,
        template_id: watchTemplateId,
        subject_template: watchSubject,
        body_template: watchBody,
      });

      setPreviewData(data);
      setActiveTab("preview");
      toast.success("Preview generated successfully!");
    } catch (error: any) {
      toast.error("Failed to generate preview");
    } finally {
      setPreviewLoading(false);
    }
  };

  const onSubmit = async (data: CampaignFormData) => {
    if (!data.subject_template || !data.body_template) {
      toast.error("Please provide email subject and body");
      return;
    }

    setLoading(true);
    try {
      const payload: GroupCampaignCreate = {
        campaign_name: data.campaign_name,
        group_id: data.group_id,
        template_id: data.template_id,
        subject_template: data.subject_template,
        body_template: data.body_template,
        send_delay_seconds: data.send_delay_seconds || 30,
        scheduled_at: data.scheduled_at,
      };

      const { data: campaign } = await groupCampaignsAPI.create(payload);

      toast.success("Campaign created successfully!", {
        description: "Campaign is ready to send",
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error("Failed to create campaign", {
        description: error.response?.data?.detail || "Please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  const insertVariable = (variable: string) => {
    const currentBody = watch("body_template") || "";
    setValue("body_template", currentBody + variable);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-accent/20 to-primary/20 rounded-lg">
              <Send className="w-5 h-5 text-accent" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Create Group Campaign</DialogTitle>
              <DialogDescription>
                Send personalized emails to all recipients in a group
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
          <TabsList className="bg-slate-800/50">
            <TabsTrigger value="compose">
              <Mail className="w-4 h-4 mr-2" />
              Compose
            </TabsTrigger>
            <TabsTrigger value="personalize">
              <Sparkles className="w-4 h-4 mr-2" />
              Personalize
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={!previewData}>
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="schedule">
              <Calendar className="w-4 h-4 mr-2" />
              Schedule
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6">
            {/* Compose Tab */}
            <TabsContent value="compose" className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="campaign_name" className="text-slate-300">
                    Campaign Name <span className="text-error">*</span>
                  </Label>
                  <Input
                    id="campaign_name"
                    placeholder="e.g., Q1 Outreach Campaign"
                    {...register("campaign_name")}
                    className="mt-1.5 bg-card border-border focus:border-accent"
                  />
                  {errors.campaign_name && (
                    <p className="text-error text-sm mt-1">{errors.campaign_name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="group_id" className="text-slate-300">
                    Recipient Group <span className="text-error">*</span>
                  </Label>
                  <Select
                    value={watchGroupId?.toString()}
                    onValueChange={(value) => setValue("group_id", Number(value))}
                  >
                    <SelectTrigger className="mt-1.5 bg-card border-border">
                      <SelectValue placeholder="Select group" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id.toString()}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: group.color }}
                            />
                            <span>{group.name}</span>
                            <Badge variant="outline" className="ml-2">
                              {group.total_recipients}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedGroup && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedGroup.total_recipients} recipients • {selectedGroup.group_type}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="template_id" className="text-slate-300">
                    Email Template (Optional)
                  </Label>
                  <Select
                    value={watchTemplateId?.toString()}
                    onValueChange={(value) => setValue("template_id", Number(value))}
                  >
                    <SelectTrigger className="mt-1.5 bg-card border-border">
                      <SelectValue placeholder="Start from template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No template (blank)</SelectItem>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id!.toString()}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="subject_template" className="text-slate-300">
                    Email Subject <span className="text-error">*</span>
                  </Label>
                  <Input
                    id="subject_template"
                    placeholder="e.g., Hi {{recipient.first_name}}, let's connect!"
                    {...register("subject_template")}
                    className="mt-1.5 bg-card border-border focus:border-accent"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="body_template" className="text-slate-300">
                    Email Body <span className="text-error">*</span>
                  </Label>
                  <Textarea
                    id="body_template"
                    placeholder="Compose your email here... Use variables like {{recipient.name}} for personalization"
                    {...register("body_template")}
                    className="mt-1.5 bg-card border-border focus:border-accent min-h-[200px] font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Click "Personalize" tab to see available variables
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreview}
                  disabled={previewLoading || !watchGroupId}
                  className="border-border"
                >
                  {previewLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Eye className="w-4 h-4 mr-2" />
                  )}
                  Preview
                </Button>
              </div>
            </TabsContent>

            {/* Personalize Tab */}
            <TabsContent value="personalize" className="space-y-4">
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent" />
                    Available Variables
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Click any variable to insert it into your email body. Each recipient will see
                    their own personalized information.
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    {PERSONALIZATION_VARIABLES.map((item) => (
                      <Card
                        key={item.var}
                        className="bg-card border-border hover:border-accent cursor-pointer transition-all"
                        onClick={() => insertVariable(item.var)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between mb-2">
                            <code className="text-accent text-sm font-mono">{item.var}</code>
                            <Badge variant="outline" className="text-xs">
                              Click to insert
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">{item.desc}</p>
                          <p className="text-xs text-muted-foreground">
                            Example: <span className="text-slate-300">{item.example}</span>
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-info/10 border-info/30">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-info mb-1">Pro Tip</h4>
                      <p className="text-sm text-slate-300">
                        Use personalization variables to make each email unique. Studies show that
                        personalized emails have 26% higher open rates and 760% increase in revenue!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="space-y-4">
              {previewData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {previewData.sample_recipient && (
                    <Card className="bg-card border-border">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <User className="w-4 h-4 text-info" />
                          <h3 className="font-semibold text-white">Sample Recipient</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">Name</p>
                            <p className="text-white">{previewData.sample_recipient.name || "—"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Email</p>
                            <p className="text-white">{previewData.sample_recipient.email}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Company</p>
                            <p className="text-white">
                              {previewData.sample_recipient.company || "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Position</p>
                            <p className="text-white">
                              {previewData.sample_recipient.position || "—"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card className="bg-card border-border">
                    <CardContent className="p-0">
                      <div className="bg-card px-4 py-3 border-b border-border">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Subject:</span>
                          <span className="text-white font-medium">
                            {previewData.rendered_subject}
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <div
                          className="prose prose-invert max-w-none text-sm text-slate-300 whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{
                            __html: previewData.rendered_body.replace(/\n/g, "<br />"),
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-success/10 border-success/30">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold text-success mb-1">Preview looks good!</h4>
                          <p className="text-sm text-slate-300">
                            This is how the email will look for this recipient. Each recipient will
                            see their own personalized version.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </TabsContent>

            {/* Schedule Tab */}
            <TabsContent value="schedule" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="send_delay_seconds" className="text-slate-300 mb-2 block">
                    Delay Between Emails: {watch("send_delay_seconds") || 30} seconds
                  </Label>
                  <Input
                    id="send_delay_seconds"
                    type="range"
                    min="10"
                    max="300"
                    step="10"
                    {...register("send_delay_seconds", { valueAsNumber: true })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>10s (Fast)</span>
                    <span>150s (Moderate)</span>
                    <span>300s (Safe)</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Higher delays reduce spam risk but take longer to send
                  </p>
                </div>

                <div>
                  <Label htmlFor="scheduled_at" className="text-slate-300">
                    Schedule for Later (Optional)
                  </Label>
                  <Input
                    id="scheduled_at"
                    type="datetime-local"
                    {...register("scheduled_at")}
                    className="mt-1.5 bg-card border-border focus:border-accent"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty to send immediately after creating
                  </p>
                </div>

                {selectedGroup && (
                  <Card className="bg-card border-border">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-warning" />
                        Estimated Send Time
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Recipients:</span>
                          <span className="text-white font-medium">
                            {selectedGroup.total_recipients}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Delay per email:</span>
                          <span className="text-white font-medium">
                            {watch("send_delay_seconds") || 30}s
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-border pt-2 mt-2">
                          <span className="text-muted-foreground">Total time:</span>
                          <span className="text-white font-semibold">
                            ~
                            {Math.ceil(
                              (selectedGroup.total_recipients *
                                (watch("send_delay_seconds") || 30)) /
                                60
                            )}{" "}
                            minutes
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <DialogFooter className="gap-2 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="border-border"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !watchGroupId || !watchSubject || !watchBody}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Create Campaign
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
