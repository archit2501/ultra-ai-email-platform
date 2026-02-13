"use client";

/**
 * INFO DOC VIEWER DIALOG - Professional Parsed Info Doc Display with Inline Editing
 *
 * Features:
 * - All fields are always editable (inline editing)
 * - Automatic change detection shows floating save button
 * - Animated sections with glass morphism design
 * - Company info with branding colors
 * - Products/Services showcase
 * - Pricing tiers visualization
 * - Team members display
 * - Benefits and USPs
 * - Contact information
 */

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Building2,
  Globe,
  Mail,
  Phone,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Youtube,
  FileText,
  Package,
  DollarSign,
  Users,
  Sparkles,
  Save,
  CheckCircle,
  Star,
  Zap,
  Target,
  TrendingUp,
  Loader2,
  ChevronDown,
  ExternalLink,
  AlertCircle,
  Crown,
  Lightbulb,
  MessageSquare,
  Briefcase,
  Award,
  Factory,
  Rocket,
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

interface InfoDocViewerDialogProps {
  open: boolean;
  onClose: () => void;
  infoDoc: any;
  onUpdate?: () => void;
  onViewOriginal?: () => void;
}

// Document type configs
const DOC_TYPE_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  product: { icon: Package, color: "blue", label: "Product" },
  service: { icon: Briefcase, color: "purple", label: "Service" },
  company: { icon: Building2, color: "green", label: "Company" },
  portfolio: { icon: Award, color: "orange", label: "Portfolio" },
};

// Industry icons
const INDUSTRY_ICONS: Record<string, any> = {
  technology: Rocket,
  healthcare: Target,
  finance: DollarSign,
  "e-commerce": Package,
  education: Lightbulb,
  marketing: TrendingUp,
  hr: Users,
  logistics: Factory,
};

export default function InfoDocViewerDialog({
  open,
  onClose,
  infoDoc,
  onUpdate,
  onViewOriginal
}: InfoDocViewerDialogProps) {
  const [saving, setSaving] = useState(false);
  const [reparsing, setReparsing] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    company: true,
    products: true,
    benefits: true,
    pricing: true,
    team: false,
    contact: true,
  });

  // Original data for comparison
  const [originalData, setOriginalData] = useState<any>({});

  // Editable data
  const [editData, setEditData] = useState<any>({});

  // Initialize data when infoDoc changes
  useEffect(() => {
    if (infoDoc) {
      const initialData = {
        company_name: infoDoc.company_name || "",
        tagline: infoDoc.tagline || "",
        industry: infoDoc.industry || "",
        products_services: infoDoc.products_services || [],
        key_benefits: infoDoc.key_benefits || [],
        unique_selling_points: infoDoc.unique_selling_points || [],
        problem_solved: infoDoc.problem_solved || "",
        pricing_tiers: infoDoc.pricing_tiers || [],
        contact_info: infoDoc.contact_info || {},
        team_members: infoDoc.team_members || [],
      };
      setOriginalData(JSON.parse(JSON.stringify(initialData)));
      setEditData(initialData);
    }
  }, [infoDoc]);

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
      await documentsAPI.updateInfoDoc(infoDoc.id, editData);
      toast.success("Info document updated successfully!");
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
    if (!infoDoc?.id) return;

    setReparsing(true);
    try {
      await documentsAPI.reparseInfoDoc(infoDoc.id);
      toast.success("Info document re-parsed successfully!");
      onUpdate?.();
      onClose();
    } catch (error) {
      console.error("Failed to re-parse:", error);
      toast.error("Failed to re-parse document");
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

  const docTypeConfig = DOC_TYPE_CONFIG[infoDoc?.doc_type] || DOC_TYPE_CONFIG.company;
  const DocTypeIcon = docTypeConfig.icon;
  const IndustryIcon = INDUSTRY_ICONS[infoDoc?.industry] || Building2;
  const confidenceScore = infoDoc?.parsing_confidence_score || 0;

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
                  <div className={cn(
                    "p-3 rounded-xl shadow-lg",
                    docTypeConfig.color === "blue" && "bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/25",
                    docTypeConfig.color === "purple" && "bg-gradient-to-br from-purple-500 to-purple-600 shadow-purple-500/25",
                    docTypeConfig.color === "green" && "bg-gradient-to-br from-green-500 to-green-600 shadow-green-500/25",
                    docTypeConfig.color === "orange" && "bg-gradient-to-br from-orange-500 to-orange-600 shadow-orange-500/25",
                  )}>
                    <DocTypeIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-white">{infoDoc?.name || "Info Document"}</h2>
                      <Badge variant="outline" className={cn(
                        "text-xs capitalize",
                        docTypeConfig.color === "blue" && "border-blue-500/30 text-blue-400",
                        docTypeConfig.color === "purple" && "border-purple-500/30 text-purple-400",
                        docTypeConfig.color === "green" && "border-green-500/30 text-green-400",
                        docTypeConfig.color === "orange" && "border-orange-500/30 text-orange-400",
                      )}>
                        {docTypeConfig.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-slate-400">{infoDoc?.filename}</span>
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
              {/* Company Info Hero */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 p-6"
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                  }} />
                </div>

                <div className="relative">
                  <div className="flex flex-col md:flex-row md:items-start gap-6">
                    {/* Company Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-xl shadow-purple-500/25">
                        <Building2 className="w-10 h-10 text-white" />
                      </div>
                    </div>

                    {/* Company Details - Editable */}
                    <div className="flex-1 space-y-4">
                      {/* Company Name */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Company Name</label>
                        <Input
                          value={editData.company_name}
                          onChange={(e) => setEditData({ ...editData, company_name: e.target.value })}
                          className="text-xl font-bold bg-slate-800/50 border-slate-700 text-white focus:border-purple-500/50"
                          placeholder="Enter company name"
                        />
                      </div>

                      {/* Tagline */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tagline</label>
                        <Input
                          value={editData.tagline}
                          onChange={(e) => setEditData({ ...editData, tagline: e.target.value })}
                          className="bg-slate-800/50 border-slate-700 text-slate-300 italic focus:border-purple-500/50"
                          placeholder="Company tagline or slogan"
                        />
                      </div>

                      {/* Industry */}
                      <div className="flex items-center gap-3">
                        <div className="space-y-1 flex-1">
                          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Industry</label>
                          <Input
                            value={editData.industry}
                            onChange={(e) => setEditData({ ...editData, industry: e.target.value })}
                            className="bg-slate-800/50 border-slate-700 text-purple-400 focus:border-purple-500/50"
                            placeholder="e.g., Technology, Healthcare, Finance"
                          />
                        </div>
                        {infoDoc?.word_count && (
                          <span className="text-xs text-slate-500 mt-6">
                            {infoDoc.word_count.toLocaleString()} words
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Problem Solved */}
              <SectionCard
                title="Problem We Solve"
                icon={Target}
                color="red"
                expanded={true}
                onToggle={() => {}}
              >
                <Textarea
                  value={editData.problem_solved}
                  onChange={(e) => setEditData({ ...editData, problem_solved: e.target.value })}
                  className="min-h-[100px] bg-slate-800/50 border-slate-700 text-white resize-none focus:border-red-500/50"
                  placeholder="Describe the problem your product/service solves..."
                />
              </SectionCard>

              {/* Products & Services */}
              <SectionCard
                title="Products & Services"
                icon={Package}
                color="blue"
                expanded={expandedSections.products}
                onToggle={() => toggleSection("products")}
                badge={`${infoDoc?.products_services?.length || 0} items`}
              >
                {infoDoc?.products_services?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {infoDoc.products_services.map((product: any, i: number) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-4 rounded-xl bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-blue-500/20 hover:border-blue-500/40 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                              <Package className="w-4 h-4 text-blue-400" />
                            </div>
                            <h4 className="font-semibold text-white">{product.name}</h4>
                          </div>
                          {product.category && (
                            <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-400 capitalize">
                              {product.category}
                            </Badge>
                          )}
                        </div>

                        {product.description && (
                          <p className="text-sm text-slate-400 mb-3">{product.description}</p>
                        )}

                        {product.pricing && (
                          <div className="flex items-center gap-2 mb-3">
                            <DollarSign className="w-4 h-4 text-green-400" />
                            <span className="text-sm font-medium text-green-400">{product.pricing}</span>
                          </div>
                        )}

                        {product.features?.length > 0 && (
                          <div className="space-y-1">
                            {product.features.slice(0, 4).map((feature: string, j: number) => (
                              <div key={j} className="flex items-center gap-2 text-xs text-slate-400">
                                <CheckCircle className="w-3 h-3 text-green-400" />
                                <span>{feature}</span>
                              </div>
                            ))}
                            {product.features.length > 4 && (
                              <span className="text-xs text-slate-500">
                                +{product.features.length - 4} more features
                              </span>
                            )}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No products or services detected" />
                )}
              </SectionCard>

              {/* Key Benefits */}
              <SectionCard
                title="Key Benefits"
                icon={Sparkles}
                color="green"
                expanded={expandedSections.benefits}
                onToggle={() => toggleSection("benefits")}
                badge={`${infoDoc?.key_benefits?.length || 0} benefits`}
              >
                {infoDoc?.key_benefits?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {infoDoc.key_benefits.map((benefit: string, i: number) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20"
                      >
                        <div className="p-1.5 rounded-full bg-green-500/20 mt-0.5">
                          <CheckCircle className="w-3 h-3 text-green-400" />
                        </div>
                        <span className="text-sm text-slate-300">{benefit}</span>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No key benefits detected" />
                )}
              </SectionCard>

              {/* Unique Selling Points */}
              <SectionCard
                title="Unique Selling Points"
                icon={Zap}
                color="yellow"
                expanded={true}
                onToggle={() => {}}
                badge={`${infoDoc?.unique_selling_points?.length || 0} USPs`}
              >
                {infoDoc?.unique_selling_points?.length > 0 ? (
                  <div className="space-y-3">
                    {infoDoc.unique_selling_points.map((usp: string, i: number) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-r from-yellow-500/5 to-orange-500/5 border border-yellow-500/20"
                      >
                        <div className="p-2 rounded-lg bg-yellow-500/10">
                          <Star className="w-4 h-4 text-yellow-400" />
                        </div>
                        <span className="text-slate-300">{usp}</span>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No unique selling points detected" />
                )}
              </SectionCard>

              {/* Pricing Tiers */}
              <SectionCard
                title="Pricing Plans"
                icon={DollarSign}
                color="emerald"
                expanded={expandedSections.pricing}
                onToggle={() => toggleSection("pricing")}
                badge={`${infoDoc?.pricing_tiers?.length || 0} plans`}
              >
                {infoDoc?.pricing_tiers?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {infoDoc.pricing_tiers.map((tier: any, i: number) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={cn(
                          "relative p-5 rounded-xl border transition-all",
                          tier.is_popular
                            ? "bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/10"
                            : tier.is_enterprise
                            ? "bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30"
                            : "bg-slate-800/30 border-slate-700/50 hover:border-slate-600"
                        )}
                      >
                        {tier.is_popular && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <span className="px-3 py-1 text-xs font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-full">
                              Most Popular
                            </span>
                          </div>
                        )}

                        {tier.is_enterprise && (
                          <div className="absolute -top-3 right-4">
                            <Crown className="w-5 h-5 text-purple-400" />
                          </div>
                        )}

                        <div className="text-center mb-4">
                          <h4 className="text-lg font-semibold text-white mb-1">{tier.name}</h4>
                          <div className="flex items-baseline justify-center gap-1">
                            <span className="text-3xl font-bold text-white">{tier.price}</span>
                            {tier.billing_cycle && (
                              <span className="text-sm text-slate-400">/{tier.billing_cycle}</span>
                            )}
                          </div>
                          {tier.currency && tier.currency !== "USD" && (
                            <span className="text-xs text-slate-500">{tier.currency}</span>
                          )}
                        </div>

                        {tier.features?.length > 0 && (
                          <div className="space-y-2">
                            {tier.features.slice(0, 6).map((feature: string, j: number) => (
                              <div key={j} className="flex items-center gap-2 text-sm text-slate-300">
                                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                                <span className="line-clamp-1">{feature}</span>
                              </div>
                            ))}
                            {tier.features.length > 6 && (
                              <span className="text-xs text-slate-500 block text-center mt-2">
                                +{tier.features.length - 6} more features
                              </span>
                            )}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No pricing information detected" />
                )}
              </SectionCard>

              {/* Team Members */}
              <SectionCard
                title="Team Members"
                icon={Users}
                color="purple"
                expanded={expandedSections.team}
                onToggle={() => toggleSection("team")}
                badge={`${infoDoc?.team_members?.length || 0} people`}
              >
                {infoDoc?.team_members?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {infoDoc.team_members.map((member: any, i: number) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-purple-500/30 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-lg">
                          {member.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white truncate">{member.name}</h4>
                          {(member.role || member.title) && (
                            <p className="text-sm text-slate-400 truncate">{member.role || member.title}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            {member.email && (
                              <a href={`mailto:${member.email}`} className="text-blue-400 hover:text-blue-300">
                                <Mail className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {member.linkedin && (
                              <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                                <Linkedin className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No team members detected" />
                )}
              </SectionCard>

              {/* Contact Information */}
              <SectionCard
                title="Contact Information"
                icon={MessageSquare}
                color="cyan"
                expanded={expandedSections.contact}
                onToggle={() => toggleSection("contact")}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Emails */}
                  {infoDoc?.contact_info?.emails?.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-slate-400 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email Addresses
                      </h4>
                      <div className="space-y-1">
                        {infoDoc.contact_info.emails.map((email: string, i: number) => (
                          <a
                            key={i}
                            href={`mailto:${email}`}
                            className="block text-blue-400 hover:text-blue-300 text-sm"
                          >
                            {email}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Phones */}
                  {infoDoc?.contact_info?.phones?.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-slate-400 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Phone Numbers
                      </h4>
                      <div className="space-y-1">
                        {infoDoc.contact_info.phones.map((phone: string, i: number) => (
                          <a
                            key={i}
                            href={`tel:${phone}`}
                            className="block text-green-400 hover:text-green-300 text-sm"
                          >
                            {phone}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Websites */}
                  {infoDoc?.contact_info?.websites?.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-slate-400 flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Websites
                      </h4>
                      <div className="space-y-1">
                        {infoDoc.contact_info.websites.map((url: string, i: number) => (
                          <a
                            key={i}
                            href={url.startsWith("http") ? url : `https://${url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-purple-400 hover:text-purple-300 text-sm"
                          >
                            <span className="truncate">{url}</span>
                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Social Media */}
                  {Object.keys(infoDoc?.contact_info?.social_media || {}).length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-slate-400">Social Media</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(infoDoc.contact_info.social_media).map(([platform, url]: [string, any]) => {
                          const IconMap: Record<string, any> = {
                            linkedin: Linkedin,
                            twitter: Twitter,
                            facebook: Facebook,
                            instagram: Instagram,
                            youtube: Youtube,
                          };
                          const Icon = IconMap[platform] || Globe;

                          return (
                            <a
                              key={platform}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-blue-500/30 transition-colors"
                            >
                              <Icon className="w-4 h-4 text-blue-400" />
                              <span className="text-sm text-slate-300 capitalize">{platform}</span>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {!infoDoc?.contact_info?.emails?.length &&
                 !infoDoc?.contact_info?.phones?.length &&
                 !infoDoc?.contact_info?.websites?.length && (
                  <EmptyState message="No contact information detected" />
                )}
              </SectionCard>
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
    emerald: { icon: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/10" },
    amber: { icon: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/10" },
    cyan: { icon: "text-cyan-400", border: "border-cyan-500/30", bg: "bg-cyan-500/10" },
    pink: { icon: "text-pink-400", border: "border-pink-500/30", bg: "bg-pink-500/10" },
    yellow: { icon: "text-yellow-400", border: "border-yellow-500/30", bg: "bg-yellow-500/10" },
    orange: { icon: "text-orange-400", border: "border-orange-500/30", bg: "bg-orange-500/10" },
    red: { icon: "text-red-400", border: "border-red-500/30", bg: "bg-red-500/10" },
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

// Empty State Component
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-8 text-slate-500">
      <AlertCircle className="w-4 h-4 mr-2" />
      <span className="text-sm">{message}</span>
    </div>
  );
}
