"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Brain,
  Target,
  Sparkles,
  Building2,
  Code2,
  Mail,
  Star,
  Heart,
  Copy,
  RefreshCw,
  Zap,
  TrendingUp,
  ChevronRight,
  Check,
  AlertCircle,
  Loader2,
  Search,
  FileText,
  Github,
  Users,
  Briefcase,
  GraduationCap,
  Award,
  Lightbulb,
  Send,
  Eye,
  Trash2,
} from "lucide-react";
import {
  companyIntelligenceAPI,
  SkillProfile,
  SkillMatch,
  EmailDraft,
  IntelligenceDashboard,
  CompanyResearch,
  CompanyProject,
} from "@/lib/api";

// ============= SKILL PROFILE CARD =============

interface SkillProfileCardProps {
  profile: SkillProfile | null;
  onRefresh: () => void;
  loading: boolean;
}

function SkillProfileCard({ profile, onRefresh, loading }: SkillProfileCardProps) {
  const skillCategories = [
    { key: "programming_languages", label: "Languages", icon: Code2, color: "from-blue-500 to-indigo-600" },
    { key: "frameworks", label: "Frameworks", icon: Zap, color: "from-purple-500 to-pink-600" },
    { key: "databases", label: "Databases", icon: FileText, color: "from-green-500 to-emerald-600" },
    { key: "cloud_devops", label: "Cloud/DevOps", icon: Building2, color: "from-orange-500 to-red-600" },
    { key: "tools", label: "Tools", icon: Briefcase, color: "from-cyan-500 to-teal-600" },
    { key: "soft_skills", label: "Soft Skills", icon: Users, color: "from-rose-500 to-pink-600" },
  ];

  return (
    <Card className="glass border-slate-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Your Skill Profile</h3>
            <p className="text-sm text-slate-400">AI-analyzed from your resume</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          className="text-slate-400 hover:text-white"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {profile ? (
        <>
          {/* Completeness Score */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Profile Completeness</span>
              <span className="text-sm font-bold text-white">
                {Math.round(profile.completeness_score * 100)}%
              </span>
            </div>
            <Progress value={profile.completeness_score * 100} className="h-2" />
          </div>

          {/* Primary Expertise */}
          {profile.primary_expertise && profile.primary_expertise.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400" />
                Primary Expertise
              </h4>
              <div className="flex flex-wrap gap-2">
                {profile.primary_expertise.map((skill, idx) => (
                  <Badge
                    key={idx}
                    className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 border-yellow-500/30"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Skill Categories */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {skillCategories.map(({ key, label, icon: Icon, color }) => {
              const skills = (profile as unknown as Record<string, string[]>)[key] || [];
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-800/50 rounded-lg p-3"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1.5 rounded-md bg-gradient-to-r ${color}`}>
                      <Icon className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-slate-300">{label}</span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {skills.length}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {skills.slice(0, 4).map((skill, idx) => (
                      <span key={idx} className="text-xs text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded">
                        {skill}
                      </span>
                    ))}
                    {skills.length > 4 && (
                      <span className="text-xs text-slate-500">+{skills.length - 4}</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Projects & Experience */}
          {(profile.projects?.length > 0 || profile.work_experience?.length > 0) && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.projects && profile.projects.length > 0 && (
                <div className="bg-slate-800/30 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-cyan-400" />
                    Projects ({profile.projects.length})
                  </h4>
                  <div className="space-y-2">
                    {profile.projects.slice(0, 3).map((project, idx) => (
                      <div key={idx} className="text-sm">
                        <span className="text-white font-medium">{project.name}</span>
                        {project.technologies && (
                          <span className="text-slate-500 text-xs ml-2">
                            {project.technologies.slice(0, 2).join(", ")}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {profile.work_experience && profile.work_experience.length > 0 && (
                <div className="bg-slate-800/30 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-green-400" />
                    Experience ({profile.work_experience.length})
                  </h4>
                  <div className="space-y-2">
                    {profile.work_experience.slice(0, 3).map((exp, idx) => (
                      <div key={idx} className="text-sm">
                        <span className="text-white font-medium">{exp.company}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8">
          <Brain className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 mb-4">No skill profile yet</p>
          <Button onClick={onRefresh} disabled={loading}>
            <Sparkles className="w-4 h-4 mr-2" />
            Analyze My Skills
          </Button>
        </div>
      )}
    </Card>
  );
}

// ============= MATCH CARD =============

interface MatchCardProps {
  match: SkillMatch;
  onGenerateEmail: (match: SkillMatch) => void;
  onViewDetails: (match: SkillMatch) => void;
}

function MatchCard({ match, onGenerateEmail, onViewDetails }: MatchCardProps) {
  const strengthColors: Record<string, string> = {
    perfect: "from-green-500 to-emerald-600",
    strong: "from-blue-500 to-indigo-600",
    moderate: "from-yellow-500 to-orange-600",
    weak: "from-orange-500 to-red-600",
    minimal: "from-red-500 to-rose-600",
  };

  const strengthLabels: Record<string, string> = {
    perfect: "Perfect Match",
    strong: "Strong Match",
    moderate: "Good Match",
    weak: "Potential Match",
    minimal: "Limited Match",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 rounded-lg p-4 hover:bg-slate-800/70 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-700">
            <Building2 className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h4 className="font-semibold text-white">{match.company_name}</h4>
            {match.industry && (
              <span className="text-xs text-slate-400">{match.industry}</span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold bg-gradient-to-r ${strengthColors[match.match_strength]} bg-clip-text text-transparent`}>
            {Math.round(match.overall_score)}%
          </div>
          <Badge className={`bg-gradient-to-r ${strengthColors[match.match_strength]} text-white text-xs`}>
            {strengthLabels[match.match_strength]}
          </Badge>
        </div>
      </div>

      {/* Matched Skills */}
      {match.matched_skills && match.matched_skills.length > 0 && (
        <div className="mb-3">
          <span className="text-xs text-slate-400 block mb-2">Matching Skills</span>
          <div className="flex flex-wrap gap-1">
            {match.matched_skills.slice(0, 5).map((skill, idx) => (
              <Badge key={idx} variant="outline" className="text-xs border-green-500/30 text-green-400">
                <Check className="w-3 h-3 mr-1" />
                {skill}
              </Badge>
            ))}
            {match.matched_skills.length > 5 && (
              <Badge variant="secondary" className="text-xs">
                +{match.matched_skills.length - 5}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Talking Points */}
      {match.talking_points && match.talking_points.length > 0 && (
        <div className="mb-4">
          <span className="text-xs text-slate-400 block mb-2">Key Points</span>
          <ul className="space-y-1">
            {match.talking_points.slice(0, 2).map((point, idx) => (
              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                <Zap className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          onClick={() => onGenerateEmail(match)}
        >
          <Mail className="w-4 h-4 mr-2" />
          Generate Email
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="border-slate-600"
          onClick={() => onViewDetails(match)}
        >
          <Eye className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

// ============= EMAIL DRAFT CARD =============

interface DraftCardProps {
  draft: EmailDraft;
  onCopy: (draft: EmailDraft) => void;
  onToggleFavorite: (draft: EmailDraft) => void;
  onDelete: (draft: EmailDraft) => void;
  onView: (draft: EmailDraft) => void;
}

function DraftCard({ draft, onCopy, onToggleFavorite, onDelete, onView }: DraftCardProps) {
  const toneColors: Record<string, string> = {
    professional: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    friendly: "bg-green-500/20 text-green-300 border-green-500/30",
    enthusiastic: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    formal: "bg-slate-500/20 text-slate-300 border-slate-500/30",
    casual: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 rounded-lg p-4 hover:bg-slate-800/70 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-white truncate">{draft.company_name}</h4>
            {draft.is_favorite && (
              <Heart className="w-4 h-4 text-pink-400 fill-pink-400" />
            )}
            {draft.is_used && (
              <Badge variant="secondary" className="text-xs">Used</Badge>
            )}
          </div>
          <p className="text-sm text-slate-400 truncate">{draft.subject_line}</p>
        </div>
        <Badge className={toneColors[draft.tone]}>
          {draft.tone}
        </Badge>
      </div>

      {/* Preview */}
      <div className="bg-slate-900/50 rounded-lg p-3 mb-3">
        <p className="text-xs text-slate-300 line-clamp-3">
          {draft.email_body.substring(0, 150)}...
        </p>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center">
          <div className="text-lg font-bold text-green-400">
            {Math.round(draft.confidence_score * 100)}%
          </div>
          <div className="text-xs text-slate-500">Confidence</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-blue-400">
            {Math.round(draft.relevance_score * 100)}%
          </div>
          <div className="text-xs text-slate-500">Relevance</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-purple-400">
            {Math.round(draft.personalization_level * 100)}%
          </div>
          <div className="text-xs text-slate-500">Personal</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 border-slate-600"
          onClick={() => onView(draft)}
        >
          <Eye className="w-4 h-4 mr-2" />
          View
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="border-slate-600"
          onClick={() => onCopy(draft)}
        >
          <Copy className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          className={draft.is_favorite ? "border-pink-500/50 text-pink-400" : "border-slate-600"}
          onClick={() => onToggleFavorite(draft)}
        >
          <Heart className={`w-4 h-4 ${draft.is_favorite ? "fill-current" : ""}`} />
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
          onClick={() => onDelete(draft)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

// ============= EMAIL DRAFT MODAL =============

interface DraftModalProps {
  draft: EmailDraft | null;
  onClose: () => void;
  onCopy: (text: string) => void;
}

function DraftModal({ draft, onClose, onCopy }: DraftModalProps) {
  if (!draft) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">{draft.company_name}</h3>
              <p className="text-sm text-slate-400">{draft.subject_line}</p>
            </div>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Subject Alternatives */}
          {draft.subject_alternatives && draft.subject_alternatives.length > 0 && (
            <div className="mb-4">
              <span className="text-sm font-medium text-slate-400 block mb-2">
                Alternative Subject Lines
              </span>
              <div className="space-y-1">
                {draft.subject_alternatives.map((alt, idx) => (
                  <div
                    key={idx}
                    className="text-sm text-slate-300 bg-slate-700/50 px-3 py-2 rounded cursor-pointer hover:bg-slate-700"
                    onClick={() => onCopy(alt)}
                  >
                    {alt}
                    <Copy className="w-3 h-3 inline-block ml-2 opacity-50" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Email Body */}
          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-400">Email Body</span>
              <Button size="sm" variant="ghost" onClick={() => onCopy(draft.email_body)}>
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
            </div>
            <div className="prose prose-invert prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-slate-300 font-sans text-sm leading-relaxed">
                {draft.email_body}
              </pre>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============= MAIN DASHBOARD =============

export function CompanyIntelligenceDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<IntelligenceDashboard | null>(null);
  const [profile, setProfile] = useState<SkillProfile | null>(null);
  const [matches, setMatches] = useState<SkillMatch[]>([]);
  const [drafts, setDrafts] = useState<EmailDraft[]>([]);
  const [selectedDraft, setSelectedDraft] = useState<EmailDraft | null>(null);
  const [generating, setGenerating] = useState<number | null>(null);
  const [resumeText, setResumeText] = useState("");

  // Fetch dashboard data
  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const response = await companyIntelligenceAPI.getDashboard();
      setDashboard(response.data.dashboard);
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch skill profile
  const fetchProfile = useCallback(async () => {
    try {
      const response = await companyIntelligenceAPI.getSkillProfile();
      setProfile(response.data.profile);
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  }, []);

  // Fetch matches
  const fetchMatches = useCallback(async () => {
    try {
      const response = await companyIntelligenceAPI.getAllMatches({ limit: 20 });
      setMatches(response.data.matches);
    } catch (error) {
      console.error("Failed to fetch matches:", error);
    }
  }, []);

  // Fetch drafts
  const fetchDrafts = useCallback(async () => {
    try {
      const response = await companyIntelligenceAPI.getAllDrafts({ limit: 50 });
      setDrafts(response.data.drafts);
    } catch (error) {
      console.error("Failed to fetch drafts:", error);
    }
  }, []);

  // Extract skills from resume
  const extractSkills = async () => {
    try {
      setLoading(true);
      const response = await companyIntelligenceAPI.extractSkills(resumeText || undefined);
      setProfile(response.data.profile);
      await fetchDashboard();
    } catch (error) {
      console.error("Failed to extract skills:", error);
    } finally {
      setLoading(false);
    }
  };

  // Generate email for match
  const generateEmail = async (match: SkillMatch) => {
    try {
      setGenerating(match.company_id);
      const response = await companyIntelligenceAPI.generateEmailDraft({
        company_id: match.company_id,
        skill_match_id: match.id,
      });
      setDrafts((prev) => [response.data.draft, ...prev]);
      setSelectedDraft(response.data.draft);
    } catch (error) {
      console.error("Failed to generate email:", error);
    } finally {
      setGenerating(null);
    }
  };

  // Toggle favorite
  const toggleFavorite = async (draft: EmailDraft) => {
    try {
      await companyIntelligenceAPI.toggleFavorite(draft.id);
      setDrafts((prev) =>
        prev.map((d) => (d.id === draft.id ? { ...d, is_favorite: !d.is_favorite } : d))
      );
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  // Delete draft
  const deleteDraft = async (draft: EmailDraft) => {
    try {
      await companyIntelligenceAPI.deleteDraft(draft.id);
      setDrafts((prev) => prev.filter((d) => d.id !== draft.id));
    } catch (error) {
      console.error("Failed to delete draft:", error);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  useEffect(() => {
    fetchDashboard();
    fetchProfile();
    fetchMatches();
    fetchDrafts();
  }, [fetchDashboard, fetchProfile, fetchMatches, fetchDrafts]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600">
            <Brain className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-500 bg-clip-text text-transparent mb-2">
          Company Intelligence
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          AI-powered skill matching, company research, and personalized email drafting
        </p>
      </motion.div>

      {/* Quick Stats */}
      {dashboard && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <Card className="glass border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Code2 className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {dashboard.skill_profile.total_skills}
                </div>
                <div className="text-xs text-slate-400">Skills Analyzed</div>
              </div>
            </div>
          </Card>

          <Card className="glass border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Target className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {dashboard.matches.strong}
                </div>
                <div className="text-xs text-slate-400">Strong Matches</div>
              </div>
            </div>
          </Card>

          <Card className="glass border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Mail className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {dashboard.drafts.total}
                </div>
                <div className="text-xs text-slate-400">Email Drafts</div>
              </div>
            </div>
          </Card>

          <Card className="glass border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-pink-500/20">
                <Heart className="w-5 h-5 text-pink-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {dashboard.drafts.favorites}
                </div>
                <div className="text-xs text-slate-400">Favorites</div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Main Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="glass grid w-full max-w-2xl mx-auto grid-cols-4 p-1">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
            >
              <Brain className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="matches"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white"
            >
              <Target className="w-4 h-4 mr-2" />
              Matches
            </TabsTrigger>
            <TabsTrigger
              value="drafts"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white"
            >
              <Mail className="w-4 h-4 mr-2" />
              Drafts
            </TabsTrigger>
            <TabsTrigger
              value="analyze"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-red-600 data-[state=active]:text-white"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Analyze
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <SkillProfileCard
                profile={profile}
                onRefresh={extractSkills}
                loading={loading}
              />
            </motion.div>
          </TabsContent>

          {/* Matches Tab */}
          <TabsContent value="matches">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <Card className="glass border-slate-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white">Skill Matches</h3>
                    <p className="text-sm text-slate-400">
                      Companies matching your skills
                    </p>
                  </div>
                  <Button variant="outline" onClick={fetchMatches}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>

                {matches.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {matches.map((match) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        onGenerateEmail={generateEmail}
                        onViewDetails={() => {}}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Target className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 mb-4">No matches yet</p>
                    <p className="text-sm text-slate-500">
                      Research companies to find matches
                    </p>
                  </div>
                )}
              </Card>
            </motion.div>
          </TabsContent>

          {/* Drafts Tab */}
          <TabsContent value="drafts">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <Card className="glass border-slate-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white">Email Drafts</h3>
                    <p className="text-sm text-slate-400">
                      AI-generated personalized emails
                    </p>
                  </div>
                  <Button variant="outline" onClick={fetchDrafts}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>

                {drafts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {drafts.map((draft) => (
                      <DraftCard
                        key={draft.id}
                        draft={draft}
                        onCopy={(d) => copyToClipboard(d.email_body)}
                        onToggleFavorite={toggleFavorite}
                        onDelete={deleteDraft}
                        onView={setSelectedDraft}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Mail className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 mb-4">No email drafts yet</p>
                    <p className="text-sm text-slate-500">
                      Generate emails from skill matches
                    </p>
                  </div>
                )}
              </Card>
            </motion.div>
          </TabsContent>

          {/* Analyze Tab */}
          <TabsContent value="analyze">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="glass border-slate-700 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-600">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Analyze Resume</h3>
                    <p className="text-sm text-slate-400">
                      Paste your resume text for skill extraction
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Textarea
                    placeholder="Paste your resume text here..."
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    className="min-h-[200px] bg-slate-800/50 border-slate-700"
                  />

                  <Button
                    onClick={extractSkills}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Brain className="w-4 h-4 mr-2" />
                    )}
                    Analyze & Extract Skills
                  </Button>
                </div>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Draft Modal */}
      <AnimatePresence>
        {selectedDraft && (
          <DraftModal
            draft={selectedDraft}
            onClose={() => setSelectedDraft(null)}
            onCopy={copyToClipboard}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
