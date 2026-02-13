"use client";

/**
 * RESUME VIEWER DIALOG - Professional Parsed Resume Display with Inline Editing
 *
 * Features:
 * - All fields are always editable (inline editing)
 * - Automatic change detection shows floating save button
 * - Animated sections with glass morphism design
 * - Categorized skills with visual indicators
 * - Timeline view for experience and education
 * - Confidence score visualization
 */

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User,
  Mail,
  Phone,
  Linkedin,
  Github,
  Globe,
  MapPin,
  FileText,
  Briefcase,
  GraduationCap,
  Code,
  Award,
  Star,
  Sparkles,
  Save,
  CheckCircle,
  Building2,
  Calendar,
  ExternalLink,
  Zap,
  Target,
  Heart,
  Loader2,
  ChevronDown,
  AlertCircle,
  Languages,
  Undo2,
  Eye,
  Download,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { documentsAPI } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ResumeViewerDialogProps {
  open: boolean;
  onClose: () => void;
  resume: any;
  onUpdate?: () => void;
  onViewOriginal?: () => void;
}

// Skill category colors
const SKILL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  languages: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
  frameworks: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" },
  databases: { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/30" },
  cloud: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/30" },
  tools: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/30" },
  technologies: { bg: "bg-pink-500/10", text: "text-pink-400", border: "border-pink-500/30" },
  soft_skills: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
  other: { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/30" },
};

export default function ResumeViewerDialog({
  open,
  onClose,
  resume,
  onUpdate,
  onViewOriginal
}: ResumeViewerDialogProps) {
  const [saving, setSaving] = useState(false);
  const [reparsing, setReparsing] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    contact: true,
    summary: true,
    skills: true,
    experience: true,
    education: true,
    projects: false,
    certifications: false,
    achievements: false,
  });

  // Original data for comparison
  const [originalData, setOriginalData] = useState<any>({});

  // Editable data
  const [editData, setEditData] = useState<any>({});

  // Initialize data when resume changes
  useEffect(() => {
    if (resume?.parsed_data) {
      const initialData = {
        name: resume.parsed_data.name || "",
        email: resume.parsed_data.email || "",
        phone: resume.parsed_data.phone || "",
        location: resume.parsed_data.location || "",
        linkedin_url: resume.parsed_data.linkedin_url || "",
        github_url: resume.parsed_data.github_url || "",
        portfolio_url: resume.parsed_data.portfolio_url || "",
        professional_summary: resume.parsed_data.professional_summary || "",
        technical_skills: resume.parsed_data.technical_skills || [],
        soft_skills: resume.parsed_data.soft_skills || [],
        work_experience: resume.parsed_data.work_experience || [],
        education: resume.parsed_data.education || [],
        projects: resume.parsed_data.projects || [],
        certifications: resume.parsed_data.certifications || [],
        achievements: resume.parsed_data.achievements || [],
        awards: resume.parsed_data.awards || [],
        publications: resume.parsed_data.publications || [],
        languages_spoken: resume.parsed_data.languages_spoken || [],
      };
      setOriginalData(JSON.parse(JSON.stringify(initialData)));
      setEditData(initialData);
    }
  }, [resume]);

  // Detect if there are unsaved changes
  const hasChanges = useMemo(() => {
    return JSON.stringify(editData) !== JSON.stringify(originalData);
  }, [editData, originalData]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await documentsAPI.updateResume(resume.id, { parsed_data: editData });
      toast.success("Resume updated successfully!");
      // Update original data to reflect saved state
      setOriginalData(JSON.parse(JSON.stringify(editData)));
      onUpdate?.();
    } catch (error) {
      console.error("Failed to save:", error);
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setEditData(JSON.parse(JSON.stringify(originalData)));
    toast.info("Changes discarded");
  };

  const handleReparse = async () => {
    if (!resume?.id) return;

    setReparsing(true);
    try {
      await documentsAPI.reparseResume(resume.id);
      toast.success("Resume re-parsed successfully!");
      onUpdate?.();
      onClose();
    } catch (error) {
      console.error("Failed to re-parse:", error);
      toast.error("Failed to re-parse resume");
    } finally {
      setReparsing(false);
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getConfidenceGradient = (score: number) => {
    if (score >= 80) return "from-green-500 to-emerald-500";
    if (score >= 60) return "from-yellow-500 to-amber-500";
    return "from-red-500 to-orange-500";
  };

  if (!open) return null;

  const parsed = resume?.parsed_data || {};
  const confidenceScore = parsed.parsing_confidence_score || resume?.parsing_confidence_score || 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-700/50 shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-slate-900/95 via-slate-900/95 to-slate-950/95 backdrop-blur-xl border-b border-slate-700/50 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{resume?.name || "Resume"}</h2>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-slate-400">{resume?.filename}</span>
                      {/* Confidence Score */}
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${confidenceScore}%` }}
                            transition={{ duration: 1, delay: 0.3 }}
                            className={`h-full bg-gradient-to-r ${getConfidenceGradient(confidenceScore)}`}
                          />
                        </div>
                        <span className={`text-xs font-medium ${getConfidenceColor(confidenceScore)}`}>
                          {confidenceScore.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Re-parse Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReparse}
                    disabled={reparsing || hasChanges}
                    className="border-slate-600 hover:bg-slate-700/50 text-slate-300"
                    title={hasChanges ? "Save or discard changes before re-parsing" : "Re-parse with AI"}
                  >
                    {reparsing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Re-parse
                  </Button>
                  {/* View Original Button */}
                  {onViewOriginal && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onViewOriginal}
                      className="border-slate-600 hover:bg-slate-700/50 text-slate-300"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Original
                    </Button>
                  )}
                  <button
                    onClick={onClose}
                    disabled={reparsing}
                    className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Floating Save Button - Appears when changes detected */}
            <AnimatePresence>
              {hasChanges && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.95 }}
                  className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
                >
                  <div className="flex items-center gap-3 px-6 py-3 bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-2xl shadow-2xl shadow-black/50">
                    <div className="flex items-center gap-2 text-amber-400">
                      <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      <span className="text-sm font-medium">Unsaved changes</span>
                    </div>
                    <div className="w-px h-6 bg-slate-600" />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleDiscard}
                      className="text-slate-400 hover:text-white hover:bg-slate-700"
                    >
                      <Undo2 className="w-4 h-4 mr-2" />
                      Discard
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-500/25"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6 space-y-6 pb-24">
              {/* Personal Info Section */}
              <SectionCard
                title="Personal Information"
                icon={User}
                color="blue"
                expanded={expandedSections.contact}
                onToggle={() => toggleSection("contact")}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <EditableField
                    icon={User}
                    label="Full Name"
                    value={editData.name}
                    onChange={(v) => setEditData({ ...editData, name: v })}
                    color="blue"
                  />
                  {/* Email */}
                  <EditableField
                    icon={Mail}
                    label="Email"
                    value={editData.email}
                    onChange={(v) => setEditData({ ...editData, email: v })}
                    color="green"
                  />
                  {/* Phone */}
                  <EditableField
                    icon={Phone}
                    label="Phone"
                    value={editData.phone}
                    onChange={(v) => setEditData({ ...editData, phone: v })}
                    color="purple"
                  />
                  {/* Location */}
                  <EditableField
                    icon={MapPin}
                    label="Location"
                    value={editData.location}
                    onChange={(v) => setEditData({ ...editData, location: v })}
                    color="orange"
                  />
                  {/* LinkedIn */}
                  <EditableField
                    icon={Linkedin}
                    label="LinkedIn"
                    value={editData.linkedin_url}
                    onChange={(v) => setEditData({ ...editData, linkedin_url: v })}
                    color="cyan"
                    isLink
                  />
                  {/* GitHub */}
                  <EditableField
                    icon={Github}
                    label="GitHub"
                    value={editData.github_url}
                    onChange={(v) => setEditData({ ...editData, github_url: v })}
                    color="slate"
                    isLink
                  />
                  {/* Portfolio */}
                  <EditableField
                    icon={Globe}
                    label="Portfolio"
                    value={editData.portfolio_url}
                    onChange={(v) => setEditData({ ...editData, portfolio_url: v })}
                    color="pink"
                    isLink
                    className="md:col-span-2"
                  />
                </div>
              </SectionCard>

              {/* Professional Summary */}
              <SectionCard
                title="Professional Summary"
                icon={Sparkles}
                color="purple"
                expanded={expandedSections.summary}
                onToggle={() => toggleSection("summary")}
              >
                <Textarea
                  value={editData.professional_summary}
                  onChange={(e) => setEditData({ ...editData, professional_summary: e.target.value })}
                  className="min-h-[120px] bg-slate-800/50 border-slate-700 text-white resize-none focus:border-purple-500/50 focus:ring-purple-500/20 transition-all"
                  placeholder="Enter professional summary..."
                />
              </SectionCard>

              {/* Skills Section */}
              <SectionCard
                title="Skills & Expertise"
                icon={Code}
                color="green"
                expanded={expandedSections.skills}
                onToggle={() => toggleSection("skills")}
                badge={`${(parsed.technical_skills?.length || 0) + (parsed.soft_skills?.length || 0)} skills`}
              >
                {/* Categorized Skills */}
                {parsed.skills_categorized ? (
                  <div className="space-y-4">
                    {Object.entries(parsed.skills_categorized).map(([category, skills]: [string, any]) => {
                      if (!skills || skills.length === 0) return null;
                      const colors = SKILL_COLORS[category] || SKILL_COLORS.other;
                      const categoryLabel = category.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

                      return (
                        <div key={category}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs font-medium uppercase tracking-wider ${colors.text}`}>
                              {categoryLabel}
                            </span>
                            <span className="text-xs text-slate-500">({skills.length})</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {skills.map((skill: string, i: number) => (
                              <motion.span
                                key={i}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.02 }}
                                className={cn(
                                  "px-3 py-1.5 rounded-lg text-sm font-medium border",
                                  colors.bg, colors.text, colors.border
                                )}
                              >
                                {skill}
                              </motion.span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Technical Skills */}
                    {parsed.technical_skills?.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="w-4 h-4 text-blue-400" />
                          <span className="text-sm font-medium text-blue-400">Technical Skills</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {parsed.technical_skills.map((skill: string, i: number) => (
                            <Badge key={i} variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Soft Skills */}
                    {parsed.soft_skills?.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Heart className="w-4 h-4 text-pink-400" />
                          <span className="text-sm font-medium text-pink-400">Soft Skills</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {parsed.soft_skills.map((skill: string, i: number) => (
                            <Badge key={i} variant="outline" className="bg-pink-500/10 text-pink-400 border-pink-500/30">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </SectionCard>

              {/* Work Experience */}
              <SectionCard
                title="Work Experience"
                icon={Briefcase}
                color="amber"
                expanded={expandedSections.experience}
                onToggle={() => toggleSection("experience")}
                badge={`${parsed.work_experience?.length || 0} positions`}
              >
                {parsed.work_experience?.length > 0 ? (
                  <div className="space-y-4">
                    {parsed.work_experience.map((exp: any, i: number) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="relative pl-6 border-l-2 border-amber-500/30"
                      >
                        <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-amber-500/20 border-2 border-amber-500" />
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                          <div>
                            <h4 className="font-semibold text-white">{exp.position || exp.title}</h4>
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                              <Building2 className="w-3.5 h-3.5" />
                              <span>{exp.company}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Calendar className="w-3 h-3" />
                            <span>{exp.start_date} - {exp.end_date || "Present"}</span>
                          </div>
                        </div>
                        {exp.description && (
                          <p className="text-sm text-slate-400 mb-2">{exp.description}</p>
                        )}
                        {exp.achievements?.length > 0 && (
                          <ul className="space-y-1">
                            {exp.achievements.map((achievement: string, j: number) => (
                              <li key={j} className="flex items-start gap-2 text-sm text-slate-300">
                                <CheckCircle className="w-3.5 h-3.5 text-green-400 mt-0.5 flex-shrink-0" />
                                <span>{achievement}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No work experience found" />
                )}
              </SectionCard>

              {/* Education */}
              <SectionCard
                title="Education"
                icon={GraduationCap}
                color="cyan"
                expanded={expandedSections.education}
                onToggle={() => toggleSection("education")}
                badge={`${parsed.education?.length || 0} degrees`}
              >
                {parsed.education?.length > 0 ? (
                  <div className="space-y-4">
                    {parsed.education.map((edu: any, i: number) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="relative pl-6 border-l-2 border-cyan-500/30"
                      >
                        <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-cyan-500/20 border-2 border-cyan-500" />
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                          <div>
                            <h4 className="font-semibold text-white">{edu.degree}</h4>
                            <p className="text-sm text-slate-400">{edu.institution}</p>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            {edu.graduation_year && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {edu.graduation_year}
                              </span>
                            )}
                            {edu.gpa && (
                              <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded-full">
                                GPA: {edu.gpa}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No education found" />
                )}
              </SectionCard>

              {/* Projects */}
              <SectionCard
                title="Projects"
                icon={Target}
                color="pink"
                expanded={expandedSections.projects}
                onToggle={() => toggleSection("projects")}
                badge={`${parsed.projects?.length || 0} projects`}
              >
                {parsed.projects?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {parsed.projects.map((project: any, i: number) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-pink-500/30 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-white">{project.name}</h4>
                          {project.url && (
                            <a
                              href={project.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded hover:bg-slate-700/50 transition-colors"
                            >
                              <ExternalLink className="w-4 h-4 text-pink-400" />
                            </a>
                          )}
                        </div>
                        {project.description && (
                          <p className="text-sm text-slate-400 mb-3">{project.description}</p>
                        )}
                        {project.technologies?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {project.technologies.map((tech: string, j: number) => (
                              <span key={j} className="px-2 py-0.5 text-xs bg-pink-500/10 text-pink-400 rounded">
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No projects found" />
                )}
              </SectionCard>

              {/* Certifications */}
              <SectionCard
                title="Certifications"
                icon={Award}
                color="yellow"
                expanded={expandedSections.certifications}
                onToggle={() => toggleSection("certifications")}
                badge={`${parsed.certifications?.length || 0} certs`}
              >
                {parsed.certifications?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {parsed.certifications.map((cert: any, i: number) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20"
                      >
                        <div className="p-2 rounded-lg bg-yellow-500/10">
                          <Award className="w-4 h-4 text-yellow-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {typeof cert === "string" ? cert : cert.name}
                          </p>
                          {cert.year && (
                            <p className="text-xs text-slate-500">{cert.year}</p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No certifications found" />
                )}
              </SectionCard>

              {/* Achievements & Awards */}
              <SectionCard
                title="Achievements & Awards"
                icon={Star}
                color="orange"
                expanded={expandedSections.achievements}
                onToggle={() => toggleSection("achievements")}
                badge={`${(parsed.achievements?.length || 0) + (parsed.awards?.length || 0)} items`}
              >
                {(parsed.achievements?.length > 0 || parsed.awards?.length > 0) ? (
                  <div className="space-y-2">
                    {[...(parsed.achievements || []), ...(parsed.awards || [])].map((item: any, i: number) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-3 p-3 rounded-lg bg-orange-500/5 border border-orange-500/20"
                      >
                        <Star className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-slate-300">{typeof item === "string" ? item : item.name || item.title}</p>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No achievements or awards found" />
                )}
              </SectionCard>

              {/* Languages */}
              {parsed.languages_spoken?.length > 0 && (
                <SectionCard
                  title="Languages"
                  icon={Languages}
                  color="indigo"
                  expanded={true}
                  onToggle={() => {}}
                >
                  <div className="flex flex-wrap gap-3">
                    {parsed.languages_spoken.map((lang: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30"
                      >
                        <Languages className="w-4 h-4 text-indigo-400" />
                        <span className="text-sm text-white">
                          {typeof lang === "string" ? lang : lang.language}
                        </span>
                        {lang.proficiency && (
                          <span className="text-xs text-indigo-400">({lang.proficiency})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </SectionCard>
              )}

              {/* Warnings */}
              {parsed.warnings?.length > 0 && (
                <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-yellow-400" />
                    <span className="font-medium text-yellow-400">Parsing Notes</span>
                  </div>
                  <ul className="space-y-1">
                    {parsed.warnings.map((warning: string, i: number) => (
                      <li key={i} className="text-sm text-yellow-300/80 flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-yellow-400" />
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Collapsible Section Card Component
function SectionCard({
  title,
  icon: Icon,
  color,
  expanded,
  onToggle,
  badge,
  children
}: {
  title: string;
  icon: any;
  color: string;
  expanded: boolean;
  onToggle: () => void;
  badge?: string;
  children: React.ReactNode;
}) {
  const colorClasses: Record<string, { icon: string; border: string; bg: string }> = {
    blue: { icon: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-500/10" },
    purple: { icon: "text-purple-400", border: "border-purple-500/30", bg: "bg-purple-500/10" },
    green: { icon: "text-green-400", border: "border-green-500/30", bg: "bg-green-500/10" },
    amber: { icon: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/10" },
    cyan: { icon: "text-cyan-400", border: "border-cyan-500/30", bg: "bg-cyan-500/10" },
    pink: { icon: "text-pink-400", border: "border-pink-500/30", bg: "bg-pink-500/10" },
    yellow: { icon: "text-yellow-400", border: "border-yellow-500/30", bg: "bg-yellow-500/10" },
    orange: { icon: "text-orange-400", border: "border-orange-500/30", bg: "bg-orange-500/10" },
    indigo: { icon: "text-indigo-400", border: "border-indigo-500/30", bg: "bg-indigo-500/10" },
    slate: { icon: "text-slate-400", border: "border-slate-500/30", bg: "bg-slate-500/10" },
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <motion.div
      layout
      className={cn(
        "rounded-xl border transition-colors overflow-hidden",
        colors.border,
        expanded ? "bg-slate-800/20" : "bg-slate-800/10 hover:bg-slate-800/20"
      )}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4"
      >
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", colors.bg)}>
            <Icon className={cn("w-5 h-5", colors.icon)} />
          </div>
          <span className="font-semibold text-white">{title}</span>
          {badge && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-slate-700 text-slate-300">
              {badge}
            </span>
          )}
        </div>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-slate-400" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 pb-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Editable Field Component - Always editable inline
function EditableField({
  icon: Icon,
  label,
  value,
  onChange,
  color,
  isLink,
  className
}: {
  icon: any;
  label: string;
  value: string;
  onChange: (v: string) => void;
  color: string;
  isLink?: boolean;
  className?: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: "text-blue-400 focus:border-blue-500/50 focus:ring-blue-500/20",
    green: "text-green-400 focus:border-green-500/50 focus:ring-green-500/20",
    purple: "text-purple-400 focus:border-purple-500/50 focus:ring-purple-500/20",
    orange: "text-orange-400 focus:border-orange-500/50 focus:ring-orange-500/20",
    cyan: "text-cyan-400 focus:border-cyan-500/50 focus:ring-cyan-500/20",
    pink: "text-pink-400 focus:border-pink-500/50 focus:ring-pink-500/20",
    slate: "text-slate-400 focus:border-slate-500/50 focus:ring-slate-500/20",
  };

  const iconColor = colorClasses[color]?.split(" ")[0] || "text-blue-400";
  const focusClasses = colorClasses[color] || colorClasses.blue;

  return (
    <div className={cn("space-y-1", className)}>
      <label className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
        <Icon className={cn("w-3.5 h-3.5", iconColor)} />
        {label}
      </label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "bg-slate-800/50 border-slate-700 text-white transition-all",
          focusClasses
        )}
        placeholder={`Enter ${label.toLowerCase()}...`}
      />
      {isLink && value && (
        <a
          href={value.startsWith("http") ? value : `https://${value}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-400 hover:underline flex items-center gap-1 mt-1"
        >
          <ExternalLink className="w-3 h-3" />
          Open link
        </a>
      )}
    </div>
  );
}

// Empty State Component
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-8 text-slate-500">
      <AlertCircle className="w-4 h-4 mr-2" />
      <span className="text-sm">{message}</span>
    </div>
  );
}
