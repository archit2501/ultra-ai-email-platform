"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Search, Mail, Eye, Send, ChevronLeft, ChevronRight, Sparkles, TrendingUp, RefreshCw, AlertCircle, Download, Save, FileText, RotateCcw, BookMarked, FolderOpen, Bookmark, Briefcase } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { EmailVariationCard } from "./EmailVariationCard";
import { ResearchHistoryPanel } from "./ResearchHistoryPanel";
import { EmailLibraryDrawer } from "./EmailLibraryDrawer";
import ContextSelectionDialog from "./ContextSelectionDialog";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { templatesAPI, recipientsAPI, resumesAPI } from "@/lib/api";
import type { EmailTemplate } from "@/types";
import {
  getResearchFromCache,
  getResearchFromCacheAsync,
  saveResearchToCache,
  shouldRegenerateResearch,
  type ResearchHistory,
} from "./utils/researchCache";
import {
  getLatestEmailBatch,
  saveEmailBatchToCache,
  type EmailHistory,
  type EmailVariation,
} from "./utils/emailCache";

interface Recipient {
  id: number;
  name?: string;
  email: string;
  company?: string;
  position?: string;
  country?: string;
}

import type { MobiAdzTier } from "./utils/mobiadzTemplates";
import { generateMobiAdzEmail } from "./utils/mobiadzTemplates";

interface UltraEmailPanelProps {
  open: boolean;
  recipient: Recipient;
  mode?: "job" | "market" | "themobiadz"; // Research mode: job (career), market (business/sales), or themobiadz (app/game companies)
  mobiadzTier?: MobiAdzTier | null; // Tier for TheMobiAdz mode
  onClose: () => void;
  onEmailSent: () => void;
}

type TabType = "research" | "generate" | "preview" | "send";

export function UltraEmailPanel({
  open,
  recipient,
  mode = "job",
  mobiadzTier = null,
  onClose,
  onEmailSent,
}: UltraEmailPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>("research");
  const [researching, setResearching] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);

  const [companyIntel, setCompanyIntel] = useState<any>(null);
  const [emailVariations, setEmailVariations] = useState<any[]>([]);
  const [selectedTone, setSelectedTone] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<any>(null);

  const [editedSubject, setEditedSubject] = useState("");
  const [editedBody, setEditedBody] = useState("");

  const [researchError, setResearchError] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [researchProgress, setResearchProgress] = useState(0);
  const [generationProgress, setGenerationProgress] = useState(0);

  // Context selection states
  const [showContextDialog, setShowContextDialog] = useState(false);
  const [selectedContextId, setSelectedContextId] = useState<number | null>(null);
  const [selectedContextType, setSelectedContextType] = useState<"resume" | "info_doc" | null>(null);

  // New states for enhancements
  const [savedEmails, setSavedEmails] = useState<Map<string, any>>(() => {
    // Load saved emails from localStorage on mount
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`saved-emails-${recipient.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return new Map(Object.entries(parsed));
        } catch (e) {
          console.error("Failed to parse saved emails:", e);
        }
      }
    }
    return new Map();
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [downloadingResearch, setDownloadingResearch] = useState(false);

  // Template states
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [saveTemplateDialogOpen, setSaveTemplateDialogOpen] = useState(false);
  const [saveAllTonesDialogOpen, setSaveAllTonesDialogOpen] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateFormData, setTemplateFormData] = useState({
    name: "",
    description: "",
    category: "ai_generated" as const,
    language: "english" as const,
  });

  // Cache states - God-tier history system
  const [cachedResearch, setCachedResearch] = useState<ResearchHistory | null>(null);
  const [cachedEmails, setCachedEmails] = useState<EmailHistory | null>(null);

  // GOD-TIER Send tab states - File attachments & Resume selection
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [availableResumes, setAvailableResumes] = useState<any[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [positionTitle, setPositionTitle] = useState("");
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [libraryDrawerOpen, setLibraryDrawerOpen] = useState(false);

  // Reset state when panel closes
  useEffect(() => {
    if (!open) {
      // Reset all states
      setActiveTab("research");
      setResearching(false);
      setGenerating(false);
      setSending(false);
      setCompanyIntel(null);
      setEmailVariations([]);
      setSelectedTone(null);
      setSelectedEmail(null);
      setEditedSubject("");
      setEditedBody("");
      setResearchError(null);
      setGenerationError(null);
      setResearchProgress(0);
      setGenerationProgress(0);
    }
  }, [open]);

  // Load cached data when panel opens (GOD-TIER hybrid cache system!)
  useEffect(() => {
    // Skip research for TheMobiAdz mode - it uses hardcoded templates
    if (open && recipient && mode !== "themobiadz") {
      console.log("🔍 [UltraEmailPanel] Panel opened for recipient:", {
        id: recipient.id,
        name: recipient.name,
        company: recipient.company,
        mode: mode,
      });

      // Use async function to check BOTH localStorage AND backend database
      const loadCachedData = async () => {
        // Check localStorage first, then backend database (hybrid caching!)
        const cached = await getResearchFromCacheAsync(recipient.id);

        if (cached) {
          console.log(`✨ [Cache] Using cached research! Age: ${cached.fresh ? 'FRESH ⚡' : 'CACHED 💾'}`);
          console.log(`📊 [Cache] Research details:`, {
            company: cached.companyName,
            generatedAt: cached.generatedAt,
            version: cached.version,
            techStack: cached.research.techStack?.length || 0,
            confidenceScore: cached.research.confidenceScore,
          });

          setCachedResearch(cached);
          setCompanyIntel(cached.research);
          setActiveTab("research"); // Show research tab with cache
        } else {
          console.log("🔬 [Cache] No cache found anywhere - starting fresh research");
          startResearch();
        }
      };

      loadCachedData();

      // Load cached emails
      const cachedEmailBatch = getLatestEmailBatch(recipient.id);
      if (cachedEmailBatch) {
        console.log("✨ [Cache] Found cached emails! Count:", cachedEmailBatch.emails.length);
        setCachedEmails(cachedEmailBatch);

        // Convert cached emails to emailVariations format
        const variations = cachedEmailBatch.emails.map((email: EmailVariation) => ({
          tone: email.tone,
          subject: email.subject,
          body: email.body,
          personalization_score: email.personalizationScore,
          matched_skills: email.matchedSkills,
          estimated_response_rate: email.estimatedResponseRate,
        }));
        setEmailVariations(variations);
      }
    }
  }, [open, recipient?.id, mode]);

  // Auto-start email generation after research
  useEffect(() => {
    if (companyIntel && !generating && emailVariations.length === 0) {
      generateEmails();
    }
  }, [companyIntel]);

  // GOD-TIER: Load available resumes for attachment selection
  useEffect(() => {
    const loadResumes = async () => {
      if (open) {
        try {
          setLoadingResumes(true);
          const response = await resumesAPI.list({ limit: 50 });
          setAvailableResumes(response.data.items || []);

          // Auto-select the most recent resume
          if (response.data.items && response.data.items.length > 0) {
            setSelectedResumeId(response.data.items[0].id);
          }

          console.log(`📄 [Resumes] Loaded ${response.data.items?.length || 0} resumes`);
        } catch (error) {
          console.error("❌ [Resumes] Failed to load:", error);
        } finally {
          setLoadingResumes(false);
        }
      }
    };

    loadResumes();
  }, [open]);

  // Initialize position title from recipient data
  useEffect(() => {
    if (open && recipient) {
      setPositionTitle(recipient.position || "");
    }
  }, [open, recipient?.position]);

  const startResearch = async () => {
    console.log("🔬 [Research] Starting company research for:", recipient.company);
    setResearching(true);
    setActiveTab("research");
    setResearchError(null);
    setResearchProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setResearchProgress((prev) => {
        const newProgress = Math.min(prev + 10, 90);
        console.log(`📊 [Research] Progress: ${newProgress}%`);
        return newProgress;
      });
    }, 3000);

    try {
      console.log(`📡 [Research] Calling API: /api/v1/recipients/${recipient.id}/research?mode=${mode}`);
      const { data } = await recipientsAPI.researchRecipient(recipient.id, mode);

      console.log("✅ [Research] Success! Data received:", {
        mode: mode,
        combinedConfidence: data.combined_confidence_score,
        companyConfidence: data.company_intelligence?.confidence_score,
        personSources: data.person_intelligence?.sources_found,
        techStackCount: data.company_intelligence?.tech_stack?.length,
        jobOpeningsCount: data.company_intelligence?.job_openings?.length,
      });
      setCompanyIntel(data.company_intelligence);
      setResearchProgress(100);

      // Save to cache (God-tier caching!)
      try {
        const companyName = recipient.company || "Unknown Company";
        const researchHistory = saveResearchToCache(
          recipient.id,
          companyName,
          {
            companyName: companyName,
            techStack: data.company_intelligence?.tech_stack || [],
            culture: data.company_intelligence?.culture || "",
            recentProjects: data.company_intelligence?.recent_projects || [],
            newsItems: data.company_intelligence?.news || [],
            confidenceScore: data.company_intelligence?.confidence_score || 0,
            scrapedPages: data.company_intelligence?.scraped_pages || 0,
            generatedAt: new Date().toISOString(),
          }
        );
        setCachedResearch(researchHistory);
        console.log("💾 [Cache] Research saved to cache!");
      } catch (error) {
        console.error("❌ [Cache] Failed to save research:", error);
      }

      toast.success(`Researched ${recipient.company}!`, {
        description: `Found ${data.company_intelligence?.tech_stack?.length || 0} technologies`,
        icon: "🔍",
      });
    } catch (error: any) {
      console.error("❌ [Research] Failed:", error.message);
      setResearchError(error.message);
      toast.error("Research failed", { description: error.message });
      // Don't set empty data, let user retry
    } finally {
      clearInterval(progressInterval);
      setResearching(false);
      console.log("🏁 [Research] Complete");
    }
  };

  const handleContextSelection = (contextId: number, contextType: "resume" | "info_doc") => {
    console.log(`📄 [Context] Selected ${contextType} with ID: ${contextId}`);
    setSelectedContextId(contextId);
    setSelectedContextType(contextType);
    setShowContextDialog(false);

    toast.success(`${contextType === "resume" ? "Resume" : "Info Doc"} selected!`, {
      description: "Proceeding to generate personalized emails",
      icon: "✅",
    });

    // Proceed with email generation
    generateEmails();
  };

  const generateEmails = async () => {
    console.log("✉️ [Generation] Starting email generation for:", recipient.name);
    setGenerating(true);
    setActiveTab("generate");
    setGenerationError(null);
    setGenerationProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => {
        const newProgress = Math.min(prev + 15, 90);
        console.log(`📊 [Generation] Progress: ${newProgress}%`);
        return newProgress;
      });
    }, 2000);

    try {
      console.log(`📡 [Generation] Calling API: /api/v1/recipients/${recipient.id}/generate-emails`);
      const { data } = await recipientsAPI.generateEmails(recipient.id);

      console.log("✅ [Generation] Success! Generated emails:", {
        count: data.email_variations?.length || 0,
        tones: data.email_variations?.map((e: any) => e.tone),
      });
      setEmailVariations(data.email_variations || []);
      setGenerationProgress(100);

      // Save to cache (God-tier email history!)
      try {
        const emailHistory = saveEmailBatchToCache(
          recipient.id,
          data.email_variations || []
        );
        setCachedEmails(emailHistory);
        console.log("💾 [Cache] Emails saved to cache!");
      } catch (error) {
        console.error("❌ [Cache] Failed to save emails:", error);
      }

      toast.success("Generated 5 email variations!", {
        description: "Select the tone that fits best",
        icon: "✉️",
      });
    } catch (error: any) {
      console.error("❌ [Generation] Failed:", error.message);
      setGenerationError(error.message);
      toast.error("Generation failed", { description: error.message });
    } finally {
      clearInterval(progressInterval);
      setGenerating(false);
      console.log("🏁 [Generation] Complete");
    }
  };

  const handleSelectTone = (tone: string, email: any) => {
    setSelectedTone(tone);
    setSelectedEmail(email);

    // Check if there's a saved version for this tone
    const savedVersion = savedEmails.get(tone);
    if (savedVersion) {
      // Load saved version
      setEditedSubject(savedVersion.subject);
      setEditedBody(savedVersion.body);
      toast.info("Loaded saved version", {
        description: `Last edited: ${new Date(savedVersion.saved_at).toLocaleString()}`,
        icon: "📂",
      });
    } else {
      // Use original generated version
      setEditedSubject(email.subject);
      setEditedBody(email.body);
    }

    setHasUnsavedChanges(false);
    setActiveTab("preview");
  };

  const handleSaveEmail = () => {
    if (selectedTone) {
      const savedEmail = {
        tone: selectedTone,
        subject: editedSubject,
        body: editedBody,
        personalization_score: selectedEmail.personalization_score,
        saved_at: new Date().toISOString(),
      };
      const updatedEmails = new Map(savedEmails).set(selectedTone, savedEmail);
      setSavedEmails(updatedEmails);
      setHasUnsavedChanges(false);

      // Persist to localStorage
      if (typeof window !== "undefined") {
        const emailsObject = Object.fromEntries(updatedEmails);
        localStorage.setItem(`saved-emails-${recipient.id}`, JSON.stringify(emailsObject));
      }

      toast.success("Email saved!", {
        description: "Your changes have been saved permanently",
        icon: "💾",
      });
    }
  };

  const handleDownloadResearch = (format: "md" | "txt" | "json" | "pdf" | "docx") => {
    if (!companyIntel) return;

    setDownloadingResearch(true);
    try {
      let content = "";
      let filename = "";
      let mimeType = "";

      const safeCompanyName = (recipient.company || "Unknown_Company").replace(/\s+/g, "_");

      if (format === "md") {
        content = generateMarkdownReport(companyIntel, recipient);
        filename = `${safeCompanyName}_research.md`;
        mimeType = "text/markdown";
      } else if (format === "txt") {
        content = generateTextReport(companyIntel, recipient);
        filename = `${safeCompanyName}_research.txt`;
        mimeType = "text/plain";
      } else if (format === "json") {
        content = JSON.stringify(companyIntel, null, 2);
        filename = `${safeCompanyName}_research.json`;
        mimeType = "application/json";
      } else if (format === "pdf") {
        // Generate PDF using browser print functionality
        generatePDFReport(companyIntel, recipient);
        setDownloadingResearch(false);
        return;
      } else if (format === "docx") {
        // Generate DOCX using HTML with Word-compatible formatting
        content = generateWordHTMLReport(companyIntel, recipient);
        filename = `${safeCompanyName}_research.docx`;
        mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      }

      // Create blob and download
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Research downloaded!", {
        description: `Saved as ${filename}`,
        icon: "📥",
      });
    } catch (error) {
      toast.error("Download failed", {
        description: "Could not generate research file",
      });
    } finally {
      setDownloadingResearch(false);
    }
  };

  const generatePDFReport = (intel: any, recipient: Recipient) => {
    // Create a print-friendly HTML page
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Pop-up blocked", {
        description: "Please allow pop-ups to download PDF",
      });
      return;
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Company Research Report - ${recipient.company}</title>
  <style>
    @page { margin: 1in; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      color: #0ea5e9;
      border-bottom: 3px solid #0ea5e9;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    h2 {
      color: #0284c7;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 5px;
      margin-top: 30px;
    }
    h3 {
      color: #0369a1;
      margin-top: 20px;
    }
    .header-info {
      background: #f1f5f9;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .confidence-score {
      display: inline-block;
      background: #10b981;
      color: white;
      padding: 5px 15px;
      border-radius: 20px;
      font-weight: bold;
    }
    .tech-stack {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 10px 0;
    }
    .tech-badge {
      background: #e0f2fe;
      color: #0369a1;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 14px;
    }
    .job-item {
      margin: 10px 0;
      padding-left: 20px;
      border-left: 3px solid #0ea5e9;
    }
    ul {
      list-style-type: none;
      padding-left: 0;
    }
    li {
      margin: 8px 0;
      padding-left: 20px;
      position: relative;
    }
    li:before {
      content: "▪";
      color: #0ea5e9;
      font-weight: bold;
      position: absolute;
      left: 0;
    }
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <h1>Company Research Report: ${recipient.company}</h1>

  <div class="header-info">
    <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
    <p><strong>Contact:</strong> ${recipient.name} (${recipient.email})</p>
    <p><strong>Position:</strong> ${recipient.position}</p>
    <p><strong>Confidence Score:</strong> <span class="confidence-score">${intel.confidence_score?.toFixed(0)}%</span></p>
  </div>

  ${intel.tech_stack && intel.tech_stack.length > 0 ? `
  <h2>Tech Stack</h2>
  <div class="tech-stack">
    ${intel.tech_stack.map((tech: string) => `<span class="tech-badge">${tech}</span>`).join("")}
  </div>
  ` : ""}

  ${intel.job_openings && intel.job_openings.length > 0 ? `
  <h2>Job Openings</h2>
  ${intel.job_openings.map((job: any) => `
    <div class="job-item">
      <h3>${job.title}</h3>
      <p><strong>Location:</strong> ${job.location || "Remote"}</p>
      <p><strong>Type:</strong> ${job.type || "Full-time"}</p>
    </div>
  `).join("")}
  ` : ""}

  ${intel.recent_projects && intel.recent_projects.length > 0 ? `
  <h2>Recent Projects</h2>
  ${intel.recent_projects.map((project: any) => `
    <h3>${project.title}</h3>
    <p>${project.description}</p>
  `).join("")}
  ` : ""}

  ${intel.culture_summary ? `
  <h2>Company Culture</h2>
  <p>${intel.culture_summary}</p>
  ` : ""}

  ${intel.news_items && intel.news_items.length > 0 ? `
  <h2>News & Updates</h2>
  <ul>
    ${intel.news_items.map((news: any) => `
      <li><strong>${news.title}</strong> (${news.date})<br>${news.summary}</li>
    `).join("")}
  </ul>
  ` : ""}

  <hr style="margin-top: 40px; border: none; border-top: 2px solid #e2e8f0;">
  <p style="text-align: center; color: #64748b; font-size: 12px;">
    Report generated by ULTRA AI Email Generation System
  </p>
</body>
</html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Wait for content to load, then trigger print
    setTimeout(() => {
      printWindow.print();
      toast.success("PDF ready!", {
        description: 'Use "Save as PDF" in the print dialog',
        icon: "🖨️",
      });
    }, 500);
  };

  const generateWordHTMLReport = (intel: any, recipient: Recipient) => {
    // Generate HTML that Microsoft Word can open and convert to DOCX
    return `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="UTF-8">
  <title>Company Research Report</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    body { font-family: Calibri, sans-serif; font-size: 11pt; line-height: 1.5; }
    h1 { color: #0EA5E9; font-size: 20pt; border-bottom: 3pt solid #0EA5E9; }
    h2 { color: #0284C7; font-size: 16pt; border-bottom: 1pt solid #CBD5E1; margin-top: 20pt; }
    h3 { color: #0369A1; font-size: 14pt; margin-top: 15pt; }
    .header-box { background-color: #F1F5F9; padding: 10pt; margin-bottom: 20pt; }
    .tech-badge { background-color: #E0F2FE; color: #0369A1; padding: 3pt 8pt; margin: 2pt; display: inline-block; }
    table { border-collapse: collapse; width: 100%; }
    td { padding: 5pt; }
  </style>
</head>
<body>
  <h1>Company Research Report: ${recipient.company}</h1>

  <div class="header-box">
    <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
    <p><strong>Contact:</strong> ${recipient.name} (${recipient.email})</p>
    <p><strong>Position:</strong> ${recipient.position}</p>
    <p><strong>Confidence Score:</strong> ${intel.confidence_score?.toFixed(0)}%</p>
  </div>

  ${intel.tech_stack && intel.tech_stack.length > 0 ? `
  <h2>Tech Stack</h2>
  <p>${intel.tech_stack.map((tech: string) => `<span class="tech-badge">${tech}</span>`).join(" ")}</p>
  ` : ""}

  ${intel.job_openings && intel.job_openings.length > 0 ? `
  <h2>Job Openings</h2>
  ${intel.job_openings.map((job: any) => `
    <h3>${job.title}</h3>
    <p><strong>Location:</strong> ${job.location || "Remote"}</p>
    <p><strong>Type:</strong> ${job.type || "Full-time"}</p>
  `).join("")}
  ` : ""}

  ${intel.recent_projects && intel.recent_projects.length > 0 ? `
  <h2>Recent Projects</h2>
  ${intel.recent_projects.map((project: any) => `
    <h3>${project.title}</h3>
    <p>${project.description}</p>
  `).join("")}
  ` : ""}

  ${intel.culture_summary ? `
  <h2>Company Culture</h2>
  <p>${intel.culture_summary}</p>
  ` : ""}

  ${intel.news_items && intel.news_items.length > 0 ? `
  <h2>News & Updates</h2>
  <ul>
    ${intel.news_items.map((news: any) => `
      <li><strong>${news.title}</strong> (${news.date})<br>${news.summary}</li>
    `).join("")}
  </ul>
  ` : ""}

  <hr>
  <p style="text-align: center; color: #64748B; font-size: 9pt;">
    Report generated by ULTRA AI Email Generation System
  </p>
</body>
</html>
    `;
  };

  const generateMarkdownReport = (intel: any, recipient: Recipient) => {
    return `# Company Research Report: ${recipient.company}

**Generated:** ${new Date().toLocaleString()}
**Contact:** ${recipient.name} (${recipient.email})
**Position:** ${recipient.position}

---

## Executive Summary

Confidence Score: **${intel.confidence_score?.toFixed(0)}%**

---

## Tech Stack

${intel.tech_stack && intel.tech_stack.length > 0
  ? intel.tech_stack.map((tech: string) => `- ${tech}`).join("\n")
  : "*No tech stack information found*"}

---

## Job Openings

${intel.job_openings && intel.job_openings.length > 0
  ? intel.job_openings.map((job: any) => `### ${job.title}\n- **Location:** ${job.location || "Remote"}\n- **Type:** ${job.type || "Full-time"}\n`).join("\n")
  : "*No job openings found*"}

---

## Recent Projects

${intel.recent_projects && intel.recent_projects.length > 0
  ? intel.recent_projects.map((project: any) => `### ${project.title}\n${project.description}\n`).join("\n")
  : "*No recent projects found*"}

---

## Company Culture

${intel.culture_summary || "*No culture information available*"}

---

## News & Updates

${intel.news_items && intel.news_items.length > 0
  ? intel.news_items.map((news: any) => `- **${news.title}** (${news.date})\n  ${news.summary}\n`).join("\n")
  : "*No recent news found*"}

---

*Report generated by ULTRA AI Email Generation System*
`;
  };

  const generateTextReport = (intel: any, recipient: Recipient) => {
    return `========================================
COMPANY RESEARCH REPORT
========================================

Company: ${recipient.company}
Generated: ${new Date().toLocaleString()}
Contact: ${recipient.name} (${recipient.email})
Position: ${recipient.position}

========================================
EXECUTIVE SUMMARY
========================================

Confidence Score: ${intel.confidence_score?.toFixed(0)}%

========================================
TECH STACK
========================================

${intel.tech_stack && intel.tech_stack.length > 0
  ? intel.tech_stack.join(", ")
  : "No tech stack information found"}

========================================
JOB OPENINGS
========================================

${intel.job_openings && intel.job_openings.length > 0
  ? intel.job_openings.map((job: any) => `${job.title}\nLocation: ${job.location || "Remote"}\nType: ${job.type || "Full-time"}\n`).join("\n")
  : "No job openings found"}

========================================
RECENT PROJECTS
========================================

${intel.recent_projects && intel.recent_projects.length > 0
  ? intel.recent_projects.map((project: any) => `${project.title}\n${project.description}\n`).join("\n")
  : "No recent projects found"}

========================================
COMPANY CULTURE
========================================

${intel.culture_summary || "No culture information available"}

========================================
NEWS & UPDATES
========================================

${intel.news_items && intel.news_items.length > 0
  ? intel.news_items.map((news: any) => `${news.title} (${news.date})\n${news.summary}\n`).join("\n")
  : "No recent news found"}

========================================
Report generated by ULTRA AI Email Generation System
========================================
`;
  };

  // GOD-TIER File handling functions
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);

    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(f => f.size <= 10 * 1024 * 1024); // Max 10MB

    if (validFiles.length !== files.length) {
      toast.error("Some files were too large", {
        description: "Maximum file size is 10MB"
      });
    }

    setAttachedFiles(prev => [...prev, ...validFiles]);
    console.log(`📎 [Files] Added ${validFiles.length} file(s)`);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const validFiles = files.filter(f => f.size <= 10 * 1024 * 1024);

      if (validFiles.length !== files.length) {
        toast.error("Some files were too large", {
          description: "Maximum file size is 10MB"
        });
      }

      setAttachedFiles(prev => [...prev, ...validFiles]);
      console.log(`📎 [Files] Selected ${validFiles.length} file(s)`);
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    console.log(`🗑️ [Files] Removed file at index ${index}`);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleSendEmail = async () => {
    setSending(true);

    try {
      // GOD-TIER: Include resume and position in send request
      await recipientsAPI.sendUltraEmail(recipient.id, {
        tone: selectedTone!,
        subject: editedSubject,
        body: editedBody,
        resume_id: selectedResumeId || undefined,
        position_title: positionTitle || recipient.position || "Opportunity",
      });

      toast.success(`Email sent to ${recipient.name}!`, {
        description: `Position: ${positionTitle || recipient.position}`,
      });
      onEmailSent();
      onClose();
    } catch (error: any) {
      toast.error("Send failed", { description: error.message });
    } finally {
      setSending(false);
    }
  };

  // Load templates when panel opens
  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  // Handle TheMobiAdz mode - skip research and directly generate email
  useEffect(() => {
    if (open && mode === "themobiadz" && mobiadzTier) {
      // Generate email from hardcoded template
      const emailData = generateMobiAdzEmail(mobiadzTier, {
        companyName: recipient.company || "Your Company",
        productName: (recipient as any).custom_fields?.app_or_product || undefined,
      });

      // Set the email content
      setEditedSubject(emailData.subject);
      setEditedBody(emailData.body);

      // Create a mock variation for the UI
      setEmailVariations([{
        tone: "professional",
        subject: emailData.subject,
        body: emailData.body,
        key_personalization: [`TheMobiAdz ${mobiadzTier.toUpperCase()} Template`],
      }]);

      // Set selected email
      setSelectedEmail({
        tone: "professional",
        subject: emailData.subject,
        body: emailData.body,
      });

      // Skip to preview/send tab directly
      setActiveTab("preview");
    }
  }, [open, mode, mobiadzTier, recipient]);

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const response = await templatesAPI.list({ category: "ai_generated", limit: 100 });
      setTemplates(response.data.items || []);
    } catch (error) {
      console.error("Failed to load templates:", error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const replaceTemplateVariables = (text: string): string => {
    return text
      .replace(/\{\{company_name\}\}/g, recipient.company || "")
      .replace(/\{\{recruiter_name\}\}/g, recipient.name || "")
      .replace(/\{\{recruiter_email\}\}/g, recipient.email || "")
      .replace(/\{\{position_title\}\}/g, recipient.position || "")
      .replace(/\{\{country\}\}/g, recipient.country || "");
  };

  const handleLoadTemplate = async (templateId: number) => {
    try {
      const response = await templatesAPI.getById(templateId);
      const template = response.data;

      // Replace variables with recipient data
      const subject = replaceTemplateVariables(template.subject_template);
      const body = replaceTemplateVariables(template.body_template_text || template.body_template_html);

      setEditedSubject(subject);
      setEditedBody(body);
      setHasUnsavedChanges(true);

      toast.success("Template loaded!", {
        description: `"${template.name}" has been loaded with personalized data`,
        icon: "📂",
      });
    } catch (error) {
      toast.error("Failed to load template", {
        description: "Could not load the selected template",
      });
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!templateFormData.name.trim()) {
      toast.error("Template name is required");
      return;
    }

    setSavingTemplate(true);
    try {
      await templatesAPI.create({
        name: templateFormData.name,
        description: templateFormData.description,
        category: templateFormData.category,
        language: templateFormData.language,
        tone: selectedTone as any,
        subject_template: editedSubject,
        body_template_html: editedBody,
        body_template_text: editedBody,
        target_position: recipient.position,
        target_industry: "",
        target_company_size: "",
        available_variables: JSON.stringify(["{{company_name}}", "{{recruiter_name}}", "{{position_title}}"]),
        is_active: true,
      });

      toast.success("Template saved!", {
        description: `"${templateFormData.name}" has been saved to your templates`,
        icon: "💾",
      });

      // Reset form and close dialog
      setTemplateFormData({
        name: "",
        description: "",
        category: "ai_generated",
        language: "english",
      });
      setSaveTemplateDialogOpen(false);

      // Reload templates
      await loadTemplates();
    } catch (error) {
      toast.error("Failed to save template", {
        description: "Could not save the template. Please try again.",
      });
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleSaveAllTonesAsTemplates = async () => {
    if (emailVariations.length === 0) {
      toast.error("No email variations to save");
      return;
    }

    setSavingTemplate(true);
    try {
      let successCount = 0;
      let failCount = 0;

      for (const email of emailVariations) {
        try {
          await templatesAPI.create({
            name: `${recipient.company} - ${email.tone.replace(/_/g, " ").toUpperCase()}`,
            description: `AI-generated ${email.tone} tone email for ${recipient.company}`,
            category: "ai_generated",
            language: "english",
            tone: email.tone as any,
            subject_template: email.subject,
            body_template_html: email.body,
            body_template_text: email.body,
            target_position: recipient.position,
            target_industry: "",
            target_company_size: "",
            available_variables: JSON.stringify(["{{company_name}}", "{{recruiter_name}}", "{{position_title}}"]),
            is_active: true,
          });
          successCount++;
        } catch (error) {
          failCount++;
          console.error(`Failed to save ${email.tone} template:`, error);
        }
      }

      if (successCount > 0) {
        toast.success(`Saved ${successCount} templates!`, {
          description: failCount > 0
            ? `${failCount} template(s) failed to save`
            : "All email variations have been saved as templates",
          icon: "🎉",
        });
      } else {
        toast.error("Failed to save templates", {
          description: "Could not save any templates. Please try again.",
        });
      }

      setSaveAllTonesDialogOpen(false);
      await loadTemplates();
    } catch (error) {
      toast.error("Failed to save templates", {
        description: "An error occurred while saving templates",
      });
    } finally {
      setSavingTemplate(false);
    }
  };

  const tabs = [
    { id: "research" as TabType, label: "1. Research", icon: Search },
    { id: "generate" as TabType, label: "2. Generate", icon: Mail },
    { id: "preview" as TabType, label: "3. Preview & Edit", icon: Eye },
    { id: "send" as TabType, label: "4. Send", icon: Send },
  ];

  // Handle backdrop click - only close if clicking directly on backdrop, not on dialogs
  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicking on the backdrop itself (target === currentTarget)
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-end"
          onClick={handleBackdropClick}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-none"
          />

          {/* Panel - Responsive: Mobile full-screen, Desktop side panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="relative h-full w-full sm:w-full md:max-w-2xl lg:max-w-4xl xl:max-w-5xl bg-gradient-to-br from-slate-950 to-slate-900 border-l border-slate-800 shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
        {/* Header - Responsive */}
        <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg flex-shrink-0">
              {(recipient.name || recipient.email)?.charAt(0).toUpperCase() || "?"}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-white flex items-center gap-1 sm:gap-2 truncate">
                <span className="truncate">{recipient.name || "Unknown Contact"}</span>
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-cyan-400 flex-shrink-0" />
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 truncate">
                {recipient.position} at {recipient.company}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Tabs - Responsive with horizontal scroll */}
        <div className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 md:p-4 border-b border-slate-800 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              disabled={
                (tab.id === "generate" && !companyIntel) ||
                (tab.id === "preview" && !selectedEmail)
              }
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                activeTab === tab.id
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50 disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content - Responsive padding */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          {/* Research Tab - God-Tier History System */}
          {activeTab === "research" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {researching ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="relative mb-6">
                    <Loader2 className="h-16 w-16 text-cyan-400 animate-spin" />
                    <div className="absolute inset-0 h-16 w-16 rounded-full bg-cyan-400/20 animate-ping" />
                  </div>
                  <p className="text-xl font-semibold text-slate-200 mb-2">
                    Researching {recipient.company}...
                  </p>
                  <p className="text-sm text-slate-500 mb-6">
                    Analyzing 10 pages for insights
                  </p>
                  <div className="w-full max-w-md">
                    <Progress value={researchProgress} className="h-2" />
                    <p className="text-xs text-slate-600 text-center mt-2">
                      {researchProgress}% complete
                    </p>
                  </div>
                </div>
              ) : (
                <ResearchHistoryPanel
                  cachedResearch={cachedResearch}
                  onRegenerate={startResearch}
                  onExport={(format) => handleDownloadResearch(format as "md" | "txt" | "json" | "pdf" | "docx")}
                  loading={researching}
                />
              )}

              {/* Continue button (only show if research complete and not researching) */}
              {companyIntel && !researching && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6"
                >
                  <Button
                    onClick={() => setShowContextDialog(true)}
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-lg"
                    size="lg"
                  >
                    <Briefcase className="h-4 w-4 mr-2" />
                    {mode === "job" ? "Select Resume" : "Select Info Doc"}
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Generate Tab */}
          {activeTab === "generate" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {generating ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="relative mb-6">
                    <Loader2 className="h-16 w-16 text-cyan-400 animate-spin" />
                    <div className="absolute inset-0 h-16 w-16 rounded-full bg-cyan-400/20 animate-ping" />
                  </div>
                  <p className="text-xl font-semibold text-slate-200 mb-2">
                    Generating 5 email variations...
                  </p>
                  <p className="text-sm text-slate-500 mb-6">
                    Using AI to personalize each tone
                  </p>
                  <div className="w-full max-w-md">
                    <Progress value={generationProgress} className="h-2" />
                    <p className="text-xs text-slate-600 text-center mt-2">
                      {generationProgress}% complete
                    </p>
                  </div>
                </div>
              ) : generationError ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <AlertCircle className="h-16 w-16 text-red-400 mb-4" />
                  <p className="text-xl font-semibold text-slate-200 mb-2">Generation Failed</p>
                  <p className="text-sm text-slate-500 mb-6 text-center max-w-md">
                    {generationError}
                  </p>
                  <Button onClick={generateEmails} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Retry Generation
                  </Button>
                </div>
              ) : emailVariations.length > 0 ? (
                <div className="space-y-4">
                  <Card className="p-4 sm:p-6 bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                        <Mail className="h-5 w-5 text-cyan-400" />
                        Select Email Tone
                      </h3>

                      {/* View Library Button - God-tier history access */}
                      <Button
                        onClick={() => setLibraryDrawerOpen(true)}
                        variant="outline"
                        size="sm"
                        className="gap-2 border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 text-purple-300 hover:text-purple-200"
                      >
                        <BookMarked className="h-4 w-4" />
                        View Library
                      </Button>
                    </div>

                    {/* Tone Selector Dropdown */}
                    <div className="mb-4">
                      <label className="text-sm text-slate-400 mb-2 block">Choose your preferred tone:</label>
                      <Select
                        value={selectedTone || undefined}
                        onValueChange={(value) => {
                          const email = emailVariations.find((e) => e.tone === value);
                          if (email) handleSelectTone(value, email);
                        }}
                      >
                        <SelectTrigger className="w-full bg-slate-800 border-slate-700 h-12">
                          <SelectValue placeholder="Select a tone..." />
                        </SelectTrigger>
                        <SelectContent>
                          {emailVariations.map((email, idx) => (
                            <SelectItem key={idx} value={email.tone}>
                              <div className="flex items-center justify-between w-full gap-4">
                                <span className="font-medium">{email.tone.replace(/_/g, " ").toUpperCase()}</span>
                                <span className="text-xs text-slate-400">
                                  Score: {email.personalization_score?.toFixed(0)}%
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Selected Email Preview */}
                    {selectedTone && selectedEmail && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4 pt-4 border-t border-slate-700"
                      >
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">SUBJECT LINE</label>
                          <p className="text-sm text-white font-medium">{selectedEmail.subject}</p>
                        </div>

                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">EMAIL PREVIEW</label>
                          <div className="bg-slate-950 rounded-lg p-4 max-h-60 overflow-y-auto">
                            <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                              {selectedEmail.body.substring(0, 400)}
                              {selectedEmail.body.length > 400 && "..."}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-slate-950 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-500">Personalization</span>
                              <TrendingUp className="h-3 w-3 text-green-400" />
                            </div>
                            <p className="text-lg font-bold text-green-400 mt-1">
                              {selectedEmail.personalization_score?.toFixed(0)}%
                            </p>
                          </div>

                          <div className="bg-slate-950 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-500">Response Rate</span>
                              <Sparkles className="h-3 w-3 text-cyan-400" />
                            </div>
                            <p className="text-lg font-bold text-cyan-400 mt-1">
                              {selectedEmail.estimated_response_rate || "8-12%"}
                            </p>
                          </div>
                        </div>

                        {selectedEmail.matched_skills && selectedEmail.matched_skills.length > 0 && (
                          <div>
                            <label className="text-xs text-slate-500 mb-2 block">MATCHED SKILLS</label>
                            <div className="flex flex-wrap gap-2">
                              {selectedEmail.matched_skills.slice(0, 8).map((skill: string, idx: number) => (
                                <Badge key={idx} variant="secondary" className="bg-emerald-500/10 text-emerald-300 border-emerald-500/20 text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {selectedEmail.matched_skills.length > 8 && (
                                <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs">
                                  +{selectedEmail.matched_skills.length - 8}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        <Button
                          onClick={() => setActiveTab("preview")}
                          className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-lg"
                          size="lg"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Edit & Preview Full Email
                        </Button>
                      </motion.div>
                    )}

                    {/* Quick comparison view */}
                    {!selectedTone && (
                      <div className="pt-4 border-t border-slate-700">
                        <p className="text-sm text-slate-400 mb-3">Quick Comparison:</p>
                        <div className="space-y-2">
                          {emailVariations.map((email, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSelectTone(email.tone, email)}
                              className="w-full text-left p-3 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/30 transition-all"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-white">
                                  {email.tone.replace(/_/g, " ").toUpperCase()}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  {email.personalization_score?.toFixed(0)}%
                                </Badge>
                              </div>
                              <p className="text-xs text-slate-400 truncate">
                                {email.subject}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>

                  {/* Save All 5 Tones as Templates Button */}
                  <Card className="p-4 sm:p-6 bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30 shadow-xl">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/20">
                        <BookMarked className="h-5 w-5 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-white mb-1">
                          Save All Email Variations
                        </h4>
                        <p className="text-xs text-slate-400 mb-3">
                          Save all 5 AI-generated email tones as reusable templates for future campaigns
                        </p>
                        <Button
                          onClick={() => setSaveAllTonesDialogOpen(true)}
                          variant="outline"
                          className="w-full border-purple-500/50 hover:bg-purple-500/10 hover:border-purple-400"
                          disabled={emailVariations.length === 0}
                        >
                          <Bookmark className="h-4 w-4 mr-2" />
                          Save All {emailVariations.length} Tones as Templates
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              ) : null}
            </motion.div>
          )}

          {/* Preview Tab */}
          {activeTab === "preview" && selectedEmail && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Template Selector */}
              <Card className="p-4 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/30">
                <div className="flex items-center gap-3">
                  <FolderOpen className="h-5 w-5 text-blue-400 flex-shrink-0" />
                  <div className="flex-1">
                    <label className="text-sm font-medium text-white mb-1 block">
                      Load from Template
                    </label>
                    <Select onValueChange={(value) => handleLoadTemplate(parseInt(value))} disabled={loadingTemplates}>
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue placeholder={loadingTemplates ? "Loading templates..." : "Select a template to load..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.length === 0 ? (
                          <SelectItem value="none" disabled>
                            No templates available
                          </SelectItem>
                        ) : (
                          templates.map((template) => (
                            <SelectItem key={template.id} value={template.id.toString()}>
                              <div className="flex items-center justify-between w-full gap-4">
                                <span className="font-medium truncate">{template.name}</span>
                                {template.tone && (
                                  <Badge variant="secondary" className="text-xs">
                                    {template.tone.replace(/_/g, " ")}
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>

              {/* Split View: Email Content | Metadata */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left: Email Editor (2/3 width on large screens) */}
                <Card className="lg:col-span-2 p-4 sm:p-6 bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                      <Eye className="h-5 w-5 text-cyan-400" />
                      Email Preview & Editor
                    </h3>
                    <Badge variant="secondary" className="bg-purple-500/10 text-purple-300 border-purple-500/20">
                      {selectedTone?.replace(/_/g, " ").toUpperCase()}
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-slate-500 mb-2 block font-medium">TO</label>
                      <div className="text-sm text-slate-300 bg-slate-950 rounded-lg px-4 py-2 border border-slate-800">
                        {recipient.name} &lt;{recipient.email}&gt;
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-500 mb-2 block font-medium">SUBJECT LINE</label>
                      <Input
                        type="text"
                        value={editedSubject}
                        onChange={(e) => {
                          setEditedSubject(e.target.value);
                          setHasUnsavedChanges(true);
                        }}
                        className="bg-slate-950 border-slate-700 text-white focus:ring-2 focus:ring-cyan-500"
                        placeholder="Enter email subject..."
                      />
                      <p className="text-xs text-slate-600 mt-1">
                        {editedSubject.length} characters
                      </p>
                    </div>

                    <div>
                      <label className="text-xs text-slate-500 mb-2 block font-medium">EMAIL BODY</label>
                      <Textarea
                        value={editedBody}
                        onChange={(e) => {
                          setEditedBody(e.target.value);
                          setHasUnsavedChanges(true);
                        }}
                        rows={16}
                        className="bg-slate-950 border-slate-700 text-white focus:ring-2 focus:ring-cyan-500 font-mono text-sm leading-relaxed"
                        placeholder="Compose your email..."
                      />
                      <div className="flex items-center justify-between text-xs text-slate-600 mt-1">
                        <span>{editedBody.split(" ").length} words</span>
                        <span>{editedBody.length} characters</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-2">
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSaveEmail}
                          variant="outline"
                          className="flex-1 border-slate-700 hover:bg-slate-800 hover:border-cyan-500/50"
                          disabled={!hasUnsavedChanges}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {hasUnsavedChanges ? "Save Changes" : "Saved"}
                        </Button>
                        <Button
                          onClick={() => {
                            setEditedSubject(selectedEmail.subject);
                            setEditedBody(selectedEmail.body);
                            setHasUnsavedChanges(false);
                            toast.info("Reset to original");
                          }}
                          variant="ghost"
                          className="hover:bg-slate-800"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </div>
                      {/* Save as Template Button */}
                      <Button
                        onClick={() => {
                          setTemplateFormData({
                            name: `${recipient.company} - ${selectedTone?.replace(/_/g, " ").toUpperCase()}`,
                            description: `AI-generated email for ${recipient.name} at ${recipient.company}`,
                            category: "ai_generated",
                            language: "english",
                          });
                          setSaveTemplateDialogOpen(true);
                        }}
                        variant="outline"
                        className="w-full border-purple-500/50 hover:bg-purple-500/10 hover:border-purple-400"
                      >
                        <Bookmark className="h-4 w-4 mr-2" />
                        Save as Template
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Right: Metadata & Stats (1/3 width on large screens) */}
                <Card className="p-4 sm:p-6 bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 shadow-xl">
                  <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-cyan-400" />
                    Email Analytics
                  </h4>

                  <div className="space-y-4">
                    {/* Personalization Score */}
                    <div className="bg-slate-950 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-500 font-medium">PERSONALIZATION</span>
                        <Sparkles className="h-3 w-3 text-green-400" />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-green-400">
                          {selectedEmail.personalization_score?.toFixed(0)}
                        </span>
                        <span className="text-sm text-slate-500">/ 100</span>
                      </div>
                      <Progress
                        value={selectedEmail.personalization_score || 0}
                        className="h-2 mt-2"
                      />
                    </div>

                    {/* Response Rate */}
                    <div className="bg-slate-950 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-500 font-medium">EST. RESPONSE</span>
                        <Mail className="h-3 w-3 text-cyan-400" />
                      </div>
                      <div className="text-2xl font-bold text-cyan-400">
                        {selectedEmail.estimated_response_rate || "8-12%"}
                      </div>
                    </div>

                    {/* Matched Skills */}
                    {selectedEmail.matched_skills && selectedEmail.matched_skills.length > 0 && (
                      <div>
                        <label className="text-xs text-slate-500 mb-2 block font-medium">MATCHED SKILLS</label>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedEmail.matched_skills.slice(0, 6).map((skill: string, idx: number) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="bg-emerald-500/10 text-emerald-300 border-emerald-500/20 text-xs"
                            >
                              {skill}
                            </Badge>
                          ))}
                          {selectedEmail.matched_skills.length > 6 && (
                            <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs">
                              +{selectedEmail.matched_skills.length - 6}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Word Count & Reading Time */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-950 rounded-lg p-3">
                        <span className="text-xs text-slate-500 block mb-1">WORDS</span>
                        <span className="text-lg font-bold text-white">
                          {editedBody.split(" ").length}
                        </span>
                      </div>
                      <div className="bg-slate-950 rounded-lg p-3">
                        <span className="text-xs text-slate-500 block mb-1">READ TIME</span>
                        <span className="text-lg font-bold text-white">
                          {Math.ceil(editedBody.split(" ").length / 200)}min
                        </span>
                      </div>
                    </div>

                    {/* Saved Version Indicator */}
                    {savedEmails.has(selectedTone || "") && (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-xs text-green-400">
                          <Save className="h-3 w-3" />
                          <span>Saved version available</span>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Bottom Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={() => setActiveTab("generate")}
                  variant="outline"
                  className="flex-1 border-slate-700 hover:bg-slate-800"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back to Tone Selection
                </Button>
                <Button
                  onClick={() => setActiveTab("send")}
                  disabled={!editedSubject.trim() || !editedBody.trim()}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg"
                  size="lg"
                >
                  Continue to Send
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* GOD-TIER Send Tab - File Attachments & Resume Selection */}
          {activeTab === "send" && selectedEmail && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
                    <Send className="h-6 w-6 text-white" />
                  </div>
                  Send Email
                </h3>
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-none px-3 py-1">
                  Ready to Send
                </Badge>
              </div>

              {/* Resume Selection */}
              <Card className="p-6 bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border-blue-500/30">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-400" />
                    <h4 className="font-semibold text-white">Resume Attachment</h4>
                  </div>

                  {loadingResumes ? (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading resumes...
                    </div>
                  ) : availableResumes.length > 0 ? (
                    <Select value={selectedResumeId?.toString() || ""} onValueChange={(v) => setSelectedResumeId(parseInt(v))}>
                      <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                        <SelectValue placeholder="Select a resume" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableResumes.map((resume) => (
                          <SelectItem key={resume.id} value={resume.id.toString()}>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-blue-400" />
                              <span>{resume.file_name || `Resume v${resume.version}`}</span>
                              <span className="text-xs text-slate-500">
                                ({new Date(resume.created_at).toLocaleDateString()})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                      No resumes found. Upload one in Settings → Resumes.
                    </div>
                  )}
                </div>
              </Card>

              {/* Additional Files */}
              <Card className="p-6 bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Download className="h-5 w-5 text-purple-400" />
                    <h4 className="font-semibold text-white">Additional Attachments</h4>
                    <Badge variant="secondary" className="text-xs">
                      Optional
                    </Badge>
                  </div>

                  {/* File Drop Zone */}
                  <div
                    onDrop={handleFileDrop}
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                    onDragLeave={() => setIsDraggingFile(false)}
                    className={`border-2 border-dashed rounded-lg p-8 transition-all ${
                      isDraggingFile
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <input
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                      accept=".pdf,.doc,.docx,.txt"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <div className="flex flex-col items-center gap-3 text-center">
                        <div className="p-3 rounded-full bg-purple-500/20">
                          <Download className="h-6 w-6 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">Drop files here or click to browse</p>
                          <p className="text-sm text-slate-400 mt-1">
                            PDF, DOC, DOCX, TXT • Max 10MB per file
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* Attached Files List */}
                  {attachedFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-slate-300">
                        Attached Files ({attachedFiles.length})
                      </p>
                      {attachedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-slate-950 rounded-lg p-3 border border-slate-700"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-purple-400" />
                            <div>
                              <p className="text-sm text-white font-medium">{file.name}</p>
                              <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              {/* Position Title */}
              <Card className="p-6 bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-500/30">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-5 w-5 text-cyan-400" />
                    <h4 className="font-semibold text-white">Position Title</h4>
                  </div>
                  <Input
                    value={positionTitle}
                    onChange={(e) => setPositionTitle(e.target.value)}
                    placeholder="e.g., Senior Software Engineer"
                    className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
                  />
                  <p className="text-xs text-slate-400">
                    This will be used for application tracking in your pipeline
                  </p>
                </div>
              </Card>

              {/* Email Summary */}
              <Card className="p-6 bg-gradient-to-br from-slate-900/50 to-slate-800/50 border-slate-700">
                <div className="space-y-4">
                  <h4 className="font-semibold text-white flex items-center gap-2">
                    <Mail className="h-5 w-5 text-slate-400" />
                    Email Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">To</p>
                      <p className="text-white font-medium">{recipient.email}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Subject</p>
                      <p className="text-white font-medium truncate">{editedSubject}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Tone</p>
                      <Badge variant="secondary" className="capitalize">
                        {selectedTone?.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-slate-500">Position</p>
                      <p className="text-white font-medium">{positionTitle || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Resume</p>
                      <p className="text-white font-medium">
                        {selectedResumeId ? (
                          availableResumes.find(r => r.id === selectedResumeId)?.file_name || "Selected"
                        ) : (
                          <span className="text-amber-400">None selected</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Attachments</p>
                      <p className="text-white font-medium">
                        {attachedFiles.length > 0 ? `${attachedFiles.length} file(s)` : "None"}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Bottom Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={() => setActiveTab("preview")}
                  variant="outline"
                  className="flex-1 border-slate-700 hover:bg-slate-800"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back to Preview
                </Button>
                <Button
                  onClick={handleSendEmail}
                  disabled={sending || !editedSubject.trim() || !editedBody.trim()}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  size="lg"
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Email Now
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

        </div>

        {/* Footer Navigation - Responsive */}
        <div className="flex items-center justify-between p-2 sm:p-3 md:p-4 border-t border-slate-800 gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const tabs: TabType[] = ["research", "generate", "preview", "send"];
              const currentIndex = tabs.indexOf(activeTab);
              if (currentIndex > 0) setActiveTab(tabs[currentIndex - 1]);
            }}
            disabled={activeTab === "research"}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <Button
            onClick={() => {
              const tabs: TabType[] = ["research", "generate", "preview", "send"];
              const currentIndex = tabs.indexOf(activeTab);
              if (currentIndex < tabs.length - 1) setActiveTab(tabs[currentIndex + 1]);
            }}
            disabled={
              activeTab === "send" ||
              (activeTab === "research" && !companyIntel) ||
              (activeTab === "generate" && !selectedEmail) ||
              (activeTab === "preview" && (!editedSubject.trim() || !editedBody.trim()))
            }
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
          </motion.div>

          {/* Save as Template Dialog */}
          <Dialog open={saveTemplateDialogOpen} onOpenChange={setSaveTemplateDialogOpen}>
            <DialogContent className="bg-slate-900 border-slate-700 text-white">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Bookmark className="h-5 w-5 text-purple-400" />
                  Save as Template
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  Save this email as a reusable template. Use variables like {"{{company_name}}"} for personalization.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="template-name" className="text-sm font-medium text-slate-300">
                    Template Name *
                  </Label>
                  <Input
                    id="template-name"
                    value={templateFormData.name}
                    onChange={(e) => setTemplateFormData({ ...templateFormData, name: e.target.value })}
                    placeholder="e.g., Tech Company - Professional Tone"
                    className="mt-2 bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="template-description" className="text-sm font-medium text-slate-300">
                    Description (Optional)
                  </Label>
                  <Textarea
                    id="template-description"
                    value={templateFormData.description}
                    onChange={(e) => setTemplateFormData({ ...templateFormData, description: e.target.value })}
                    placeholder="Describe when to use this template..."
                    rows={3}
                    className="mt-2 bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-xs text-blue-300 font-medium mb-1">💡 Available Variables:</p>
                  <div className="flex flex-wrap gap-2 text-xs text-blue-200">
                    <code className="bg-slate-800 px-2 py-1 rounded">{"{{company_name}}"}</code>
                    <code className="bg-slate-800 px-2 py-1 rounded">{"{{recruiter_name}}"}</code>
                    <code className="bg-slate-800 px-2 py-1 rounded">{"{{position_title}}"}</code>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setSaveTemplateDialogOpen(false)}
                  className="border-slate-700 hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveAsTemplate}
                  disabled={savingTemplate || !templateFormData.name.trim()}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {savingTemplate ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Template
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Save All Tones Dialog */}
          <Dialog open={saveAllTonesDialogOpen} onOpenChange={setSaveAllTonesDialogOpen}>
            <DialogContent className="bg-slate-900 border-slate-700 text-white">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <BookMarked className="h-5 w-5 text-purple-400" />
                  Save All Email Variations as Templates
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  This will save all {emailVariations.length} AI-generated email variations as reusable templates.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-slate-300 font-medium">Templates to be created:</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {emailVariations.map((email, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg border border-slate-700"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">
                            {recipient.company} - {email.tone.replace(/_/g, " ").toUpperCase()}
                          </p>
                          <p className="text-xs text-slate-400 truncate">{email.subject}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {email.personalization_score?.toFixed(0)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-xs text-amber-300">
                    ⚠️ Each template will be saved with the company name and tone type for easy identification.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setSaveAllTonesDialogOpen(false)}
                  className="border-slate-700 hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveAllTonesAsTemplates}
                  disabled={savingTemplate}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {savingTemplate ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <BookMarked className="h-4 w-4 mr-2" />
                      Save All {emailVariations.length} Templates
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Email Library Drawer - God-Tier Email History */}
          <EmailLibraryDrawer
            open={libraryDrawerOpen}
            onClose={() => setLibraryDrawerOpen(false)}
            recipientId={recipient.id}
            recipientName={recipient.name || "Unknown"}
            onSelectEmail={(email, batchId) => {
              // Convert EmailVariation back to the format used by emailVariations
              const emailVariation = {
                tone: email.tone,
                subject: email.subject,
                body: email.body,
                personalization_score: email.personalizationScore,
                matched_skills: email.matchedSkills,
                estimated_response_rate: email.estimatedResponseRate,
              };
              handleSelectTone(email.tone, emailVariation);
              setLibraryDrawerOpen(false);
            }}
            onGenerateNew={async () => {
              setLibraryDrawerOpen(false);
              await generateEmails();
            }}
          />

          {/* Context Selection Dialog - Choose Resume or Info Doc */}
          <ContextSelectionDialog
            open={showContextDialog}
            mode={mode}
            recipientName={recipient.name || "Unknown"}
            recipientCompany={recipient.company || "Unknown Company"}
            onSelect={handleContextSelection}
            onClose={() => setShowContextDialog(false)}
            onUploadNew={() => {
              setShowContextDialog(false);
              toast.info("Upload feature", {
                description: "Navigate to Documents page to upload new files",
              });
            }}
          />
        </div>
      )}
    </AnimatePresence>
  );
}
