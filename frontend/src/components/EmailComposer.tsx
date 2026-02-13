"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { applicationsAPI } from "@/lib/api";
import { toast } from "sonner";
import { Send, Save, Loader2, Mail } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import "react-quill/dist/quill.snow.css";

// Dynamic import to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

// Flexible application type for EmailComposer
interface EmailApplication {
  id: number;
  company_name?: string;
  position_title?: string;
  recruiter_name?: string;
  recruiter_email: string;
  email_subject?: string;
  email_body_html?: string;
}

interface EmailComposerProps {
  open: boolean;
  onClose: () => void;
  applicationId: number;
  application?: EmailApplication;
  onEmailSent?: () => void;
}

export function EmailComposer({
  open,
  onClose,
  applicationId,
  application,
  onEmailSent,
}: EmailComposerProps) {
  const { user } = useAuthStore();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && application) {
      console.log("🎬 [EmailComposer] Dialog opened for application:", applicationId);
      console.log("   Application details:", {
        company: application.company_name,
        position: application.position_title,
        recruiter: application.recruiter_email,
      });
      loadEmailContent();
    }
    return () => {
      if (open) {
        console.log("🛑 [EmailComposer] Dialog closing");
      }
    };
  }, [open, application]);

  const loadEmailContent = () => {
    if (!application) {
      setLoading(false);
      return;
    }

    console.log("🔄 [EmailComposer] Loading email content...");
    setLoading(true);

    // Generate default email if not saved
    const defaultSubject =
      application.email_subject ||
      `Application for ${application.position_title || "Position"} at ${application.company_name || "Company"}`;

    // Use logged-in user's name and email for the signature
    const userName = user?.full_name || "User";
    const userEmail = user?.email || "";

    const defaultBody =
      application.email_body_html ||
      `<p>Dear ${application.recruiter_name || "Hiring Manager"},</p>

<p>I hope this email finds you well. I am writing to express my strong interest in the <strong>${application.position_title || "position"}</strong> at <strong>${application.company_name || "your company"}</strong>.</p>

<p>With my background and skills, I believe I would be a great fit for your team.</p>

<p>I have attached my resume for your review. I would welcome the opportunity to discuss how my experience and skills can contribute to your team's success.</p>

<p>Thank you for considering my application. I look forward to hearing from you.</p>

<p>Best regards,<br/>
<strong>${userName}</strong><br/>
${userEmail}</p>`;

    const usingExisting = !!application.email_subject;
    console.log(usingExisting ? "✅ [EmailComposer] Loaded existing draft" : "📝 [EmailComposer] Generated default template");
    console.log("   Subject:", defaultSubject);

    setSubject(defaultSubject);
    setBody(defaultBody);
    setLoading(false);
  };

  const handleSave = async () => {
    console.log("🔘 [EmailComposer] Button clicked: Save Draft");
    console.log("   Application ID:", applicationId);
    console.log("   Subject:", subject);

    setSaving(true);
    try {
      const payload = {
        email_subject: subject,
        email_body_html: body,
      };
      console.log("📤 [EmailComposer] Saving draft...");

      await applicationsAPI.update(applicationId, payload);

      console.log("✅ [EmailComposer] Draft saved successfully!");
      toast.success("Email draft saved successfully");
    } catch (error: any) {
      console.error("❌ [EmailComposer] Error saving draft:", error);
      console.error("   Error details:", error.response?.data);
      toast.error(error.response?.data?.detail || "Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    console.log("🔘 [EmailComposer] Button clicked: Send Email");
    console.log("   Application ID:", applicationId);
    console.log("   To:", application?.recruiter_email);
    console.log("   Subject:", subject);

    if (!subject.trim()) {
      console.error("❌ [EmailComposer] Validation failed: Subject is empty");
      toast.error("Please enter a subject");
      return;
    }

    if (!body.trim() || body.trim() === "<p><br></p>") {
      console.error("❌ [EmailComposer] Validation failed: Body is empty");
      toast.error("Please enter email content");
      return;
    }

    console.log("✓ [EmailComposer] Validation passed");
    setSending(true);
    try {
      // Save draft first
      console.log("📤 [EmailComposer] Step 1: Saving draft before sending...");
      await applicationsAPI.update(applicationId, {
        email_subject: subject,
        email_body_html: body,
      });
      console.log("✓ [EmailComposer] Draft saved");

      // Send email
      console.log("📤 [EmailComposer] Step 2: Sending email...");
      const { data } = await applicationsAPI.sendEmail(applicationId, {});

      console.log("✅ [EmailComposer] Email sent successfully!");
      console.log("   Sent to:", data.to_email);
      console.log("   Email log ID:", data.id);

      toast.success(`Email sent successfully to ${data.to_email}!`);

      if (onEmailSent) {
        console.log("🔄 [EmailComposer] Triggering onEmailSent callback");
        onEmailSent();
      }

      onClose();
    } catch (error: any) {
      console.error("❌ [EmailComposer] Error sending email:", error);
      console.error("   Error details:", error.response?.data);
      const message = error.response?.data?.detail || "Failed to send email";
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link"],
      ["clean"],
    ],
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
            <Mail className="w-6 h-6 text-blue-400" />
            Compose Email
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Recipient Info */}
            <div className="glass p-4 rounded-lg border border-slate-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                  {application?.recruiter_name?.[0] || "H"}
                </div>
                <div>
                  <p className="text-white font-medium">
                    {application?.recruiter_name || "Hiring Manager"}
                  </p>
                  <p className="text-slate-400 text-sm">{application?.recruiter_email}</p>
                  <p className="text-slate-500 text-xs">
                    {application?.company_name} - {application?.position_title}
                  </p>
                </div>
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-white">
                Subject
              </Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            {/* Email Body */}
            <div className="space-y-2">
              <Label htmlFor="body" className="text-white">
                Message
              </Label>
              <div className="bg-white rounded-lg overflow-hidden">
                <ReactQuill
                  theme="snow"
                  value={body}
                  onChange={setBody}
                  modules={quillModules}
                  style={{ height: "300px", marginBottom: "42px" }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-700">
              <div className="text-sm text-slate-400">
                Resume will be attached automatically
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleSave}
                  disabled={saving || sending}
                  className="border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Draft
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleSend}
                  disabled={sending || saving}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Email
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
