"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  User,
  Mail,
  Phone,
  MapPin,
  Link as LinkIcon,
  Github,
  Linkedin,
  Award,
  Briefcase,
  GraduationCap,
  Code,
  FolderGit2,
  Star,
  FileText,
  Globe,
  Heart,
  Trophy,
  BookOpen,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ParsedResumeData {
  name: string | null;
  contact: {
    email: string | null;
    phone: string | null;
    linkedin: string | null;
    github: string | null;
    website: string | null;
    location: string | null;
  };
  summary: string | null;
  education: string[];
  experience: string[];
  projects: string[];
  skills_raw: string[];
  skills_categorized: {
    languages: string[];
    tools: string[];
    frameworks: string[];
    technologies: string[];
    databases: string[];
    cloud: string[];
    soft_skills: string[];
    other: string[];
  };
  achievements: string[];
  awards: string[];
  certifications: string[];
  publications: string[];
  languages: string[];
  volunteering: string[];
  interests: string[];
  confidence_score: number;
  warnings: string[];
}

interface ParsedResumeViewerProps {
  resumeData: ParsedResumeData;
  editable?: boolean;
  onSave?: (data: ParsedResumeData) => Promise<void>;
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  count?: number;
}

function CollapsibleSection({ title, icon, children, defaultOpen = false, count }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-slate-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-slate-900/50 hover:bg-slate-900 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="text-cyan-400">{icon}</div>
          <span className="font-medium text-slate-200">{title}</span>
          {count !== undefined && count > 0 && (
            <Badge variant="secondary" className="ml-2">
              {count}
            </Badge>
          )}
        </div>
        <div className="text-slate-400">
          {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 bg-slate-950/30">
          {children}
        </div>
      )}
    </div>
  );
}

export function ParsedResumeViewer({ resumeData, editable = false, onSave }: ParsedResumeViewerProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedData, setEditedData] = useState<ParsedResumeData>(resumeData);
  const [isSaving, setIsSaving] = useState(false);

  const data = isEditMode ? editedData : resumeData;

  // Calculate total skills
  const totalSkills = Object.values(data.skills_categorized).reduce(
    (sum, skills) => sum + skills.length,
    0
  );

  const handleSave = async () => {
    if (!onSave) return;

    setIsSaving(true);
    try {
      await onSave(editedData);
      setIsEditMode(false);
      toast.success("Profile updated!", {
        description: "Your resume data has been saved",
        icon: "💾",
      });
    } catch (error: any) {
      toast.error("Failed to save", {
        description: error.message || "Could not update profile",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedData(resumeData);
    setIsEditMode(false);
  };

  const addSkill = (category: keyof typeof editedData.skills_categorized) => {
    const skillName = prompt(`Add a new skill to ${category}:`);
    if (skillName && skillName.trim()) {
      setEditedData({
        ...editedData,
        skills_categorized: {
          ...editedData.skills_categorized,
          [category]: [...editedData.skills_categorized[category], skillName.trim()],
        },
      });
    }
  };

  const removeSkill = (category: keyof typeof editedData.skills_categorized, index: number) => {
    setEditedData({
      ...editedData,
      skills_categorized: {
        ...editedData.skills_categorized,
        [category]: editedData.skills_categorized[category].filter((_, i) => i !== index),
      },
    });
  };

  const addItem = (field: keyof ParsedResumeData) => {
    const itemText = prompt(`Add new ${field}:`);
    if (itemText && itemText.trim()) {
      setEditedData({
        ...editedData,
        [field]: [...(editedData[field] as string[]), itemText.trim()],
      });
    }
  };

  const removeItem = (field: keyof ParsedResumeData, index: number) => {
    setEditedData({
      ...editedData,
      [field]: (editedData[field] as string[]).filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Edit Controls */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <User className="h-6 w-6 text-cyan-400" />
              {isEditMode ? (
                <Input
                  value={editedData.name || ""}
                  onChange={(e) => setEditedData({ ...editedData, name: e.target.value })}
                  className="text-2xl font-bold bg-slate-900 border-slate-700"
                  placeholder="Your name"
                />
              ) : (
                <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  {data.name || "Name not found"}
                </h2>
              )}
            </div>

            {/* Contact Info */}
            <div className="flex flex-wrap gap-4 text-sm text-slate-400 mt-4">
              {isEditMode ? (
                <>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <Input
                      value={editedData.contact.email || ""}
                      onChange={(e) =>
                        setEditedData({
                          ...editedData,
                          contact: { ...editedData.contact, email: e.target.value },
                        })
                      }
                      placeholder="email@example.com"
                      className="h-8 bg-slate-900 border-slate-700"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <Input
                      value={editedData.contact.phone || ""}
                      onChange={(e) =>
                        setEditedData({
                          ...editedData,
                          contact: { ...editedData.contact, phone: e.target.value },
                        })
                      }
                      placeholder="+1 234 567 8900"
                      className="h-8 bg-slate-900 border-slate-700"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <Input
                      value={editedData.contact.location || ""}
                      onChange={(e) =>
                        setEditedData({
                          ...editedData,
                          contact: { ...editedData.contact, location: e.target.value },
                        })
                      }
                      placeholder="City, Country"
                      className="h-8 bg-slate-900 border-slate-700"
                    />
                  </div>
                </>
              ) : (
                <>
                  {data.contact.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{data.contact.email}</span>
                    </div>
                  )}
                  {data.contact.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{data.contact.phone}</span>
                    </div>
                  )}
                  {data.contact.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{data.contact.location}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Links */}
            {isEditMode ? (
              <div className="flex flex-col gap-2 mt-3">
                <div className="flex items-center gap-2">
                  <Linkedin className="h-4 w-4 text-cyan-400" />
                  <Input
                    value={editedData.contact.linkedin || ""}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        contact: { ...editedData.contact, linkedin: e.target.value },
                      })
                    }
                    placeholder="LinkedIn URL"
                    className="h-8 bg-slate-900 border-slate-700"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Github className="h-4 w-4 text-cyan-400" />
                  <Input
                    value={editedData.contact.github || ""}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        contact: { ...editedData.contact, github: e.target.value },
                      })
                    }
                    placeholder="GitHub URL"
                    className="h-8 bg-slate-900 border-slate-700"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-cyan-400" />
                  <Input
                    value={editedData.contact.website || ""}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        contact: { ...editedData.contact, website: e.target.value },
                      })
                    }
                    placeholder="Website URL"
                    className="h-8 bg-slate-900 border-slate-700"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 mt-3">
                {data.contact.linkedin && (
                  <a
                    href={data.contact.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <Linkedin className="h-4 w-4" />
                    <span>LinkedIn</span>
                  </a>
                )}
                {data.contact.github && (
                  <a
                    href={data.contact.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <Github className="h-4 w-4" />
                    <span>GitHub</span>
                  </a>
                )}
                {data.contact.website && (
                  <a
                    href={data.contact.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <LinkIcon className="h-4 w-4" />
                    <span>Website</span>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Edit Controls */}
          <div className="flex flex-col items-end gap-2">
            <div className="text-sm text-slate-400">Parsing Confidence</div>
            <div
              className={`text-2xl font-bold ${
                data.confidence_score >= 80
                  ? "text-green-400"
                  : data.confidence_score >= 60
                  ? "text-yellow-400"
                  : "text-red-400"
              }`}
            >
              {data.confidence_score.toFixed(0)}%
            </div>

            {editable && (
              <div className="flex gap-2 mt-4">
                {isEditMode ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="border-slate-700"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={isSaving}
                      className="bg-gradient-to-r from-cyan-600 to-blue-600"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => setIsEditMode(true)}
                    className="bg-gradient-to-r from-cyan-600 to-blue-600"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit Profile
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-200 mb-3">Summary</h3>
        {isEditMode ? (
          <Textarea
            value={editedData.summary || ""}
            onChange={(e) => setEditedData({ ...editedData, summary: e.target.value })}
            rows={4}
            className="bg-slate-900 border-slate-700"
            placeholder="Professional summary..."
          />
        ) : (
          <p className="text-sm text-slate-400 leading-relaxed">{data.summary || "No summary available"}</p>
        )}
      </Card>

      {/* Skills - Categorized */}
      <CollapsibleSection
        title="Skills"
        icon={<Code className="h-5 w-5" />}
        count={totalSkills}
        defaultOpen={true}
      >
        <div className="space-y-4">
          {Object.entries(data.skills_categorized).map(([category, skills]) => {
            if (skills.length === 0 && !isEditMode) return null;

            return (
              <div key={category}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-slate-300 capitalize">
                    {category.replace(/_/g, " ")} ({skills.length})
                  </h4>
                  {isEditMode && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => addSkill(category as keyof typeof editedData.skills_categorized)}
                      className="h-6 text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className={`${
                        category === "languages"
                          ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                          : category === "frameworks"
                          ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                          : category === "cloud"
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                          : ""
                      }`}
                    >
                      {skill}
                      {isEditMode && (
                        <button
                          onClick={() => removeSkill(category as keyof typeof editedData.skills_categorized, idx)}
                          className="ml-2 hover:text-red-400"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CollapsibleSection>

      {/* Experience */}
      <CollapsibleSection
        title="Experience"
        icon={<Briefcase className="h-5 w-5" />}
        count={data.experience.length}
        defaultOpen={true}
      >
        <div className="space-y-4">
          {data.experience.map((exp, idx) => (
            <div key={idx} className="border-l-2 border-cyan-500/30 pl-4 relative">
              {isEditMode && (
                <button
                  onClick={() => removeItem("experience", idx)}
                  className="absolute -left-2 top-0 text-red-400 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              {isEditMode ? (
                <Textarea
                  value={exp}
                  onChange={(e) => {
                    const updated = [...editedData.experience];
                    updated[idx] = e.target.value;
                    setEditedData({ ...editedData, experience: updated });
                  }}
                  rows={3}
                  className="bg-slate-900 border-slate-700 text-sm"
                />
              ) : (
                <p className="text-sm text-slate-300 whitespace-pre-wrap">{exp}</p>
              )}
            </div>
          ))}
          {isEditMode && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => addItem("experience")}
              className="w-full border-slate-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Experience
            </Button>
          )}
        </div>
      </CollapsibleSection>

      {/* Projects */}
      {(data.projects.length > 0 || isEditMode) && (
        <CollapsibleSection
          title="Projects"
          icon={<FolderGit2 className="h-5 w-5" />}
          count={data.projects.length}
        >
          <div className="space-y-3">
            {data.projects.map((project, idx) => (
              <div key={idx} className="border-l-2 border-purple-500/30 pl-4 relative">
                {isEditMode && (
                  <button
                    onClick={() => removeItem("projects", idx)}
                    className="absolute -left-2 top-0 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                {isEditMode ? (
                  <Textarea
                    value={project}
                    onChange={(e) => {
                      const updated = [...editedData.projects];
                      updated[idx] = e.target.value;
                      setEditedData({ ...editedData, projects: updated });
                    }}
                    rows={2}
                    className="bg-slate-900 border-slate-700 text-sm"
                  />
                ) : (
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">{project}</p>
                )}
              </div>
            ))}
            {isEditMode && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => addItem("projects")}
                className="w-full border-slate-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Project
              </Button>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* Certifications */}
      {(data.certifications.length > 0 || isEditMode) && (
        <CollapsibleSection
          title="Certifications"
          icon={<Award className="h-5 w-5" />}
          count={data.certifications.length}
        >
          <div className="space-y-2">
            {data.certifications.map((cert, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <Award className="h-4 w-4 text-yellow-400 mt-1 flex-shrink-0" />
                {isEditMode ? (
                  <div className="flex-1 flex gap-2">
                    <Input
                      value={cert}
                      onChange={(e) => {
                        const updated = [...editedData.certifications];
                        updated[idx] = e.target.value;
                        setEditedData({ ...editedData, certifications: updated });
                      }}
                      className="bg-slate-900 border-slate-700 text-sm"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeItem("certifications", idx)}
                      className="text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-slate-300">{cert}</p>
                )}
              </div>
            ))}
            {isEditMode && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => addItem("certifications")}
                className="w-full border-slate-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Certification
              </Button>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* Warnings */}
      {data.warnings.length > 0 && !isEditMode && (
        <Card className="p-4 bg-yellow-500/5 border-yellow-500/30">
          <h4 className="text-sm font-medium text-yellow-400 mb-2">Parsing Warnings</h4>
          <ul className="text-xs text-slate-400 space-y-1">
            {data.warnings.map((warning, idx) => (
              <li key={idx}>• {warning}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
