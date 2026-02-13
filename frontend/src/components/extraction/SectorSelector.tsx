"use client";

/**
 * Step 1: Enhanced Sector & Demographics Selection
 * Choose target sector with demographics, company types, and geographic filters
 */

import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Building2,
  UserCog,
  ShoppingCart,
  CheckCircle2,
  Globe,
  MapPin,
  Briefcase,
  Target,
  Rocket,
  ChevronDown,
  ChevronUp,
  Building,
  Factory,
  Store,
  Landmark,
  GraduationCap,
  Heart,
  Cpu,
  Banknote,
  ShoppingBag,
  Truck,
  Plane,
  Utensils,
  Film,
  Stethoscope,
  Scale,
  Home,
  Wifi,
  Leaf,
  Wrench,
  X,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export type SectorType = "clients" | "companies" | "recruiters" | "customers";

export interface DemographicsConfig {
  regions: string[];
  companySizes: string[];
  industries: string[];
  customKeywords: string[];
}

interface SectorSelectorProps {
  selectedSector?: SectorType;
  onSelectSector: (sector: SectorType) => void;
  demographics?: DemographicsConfig;
  onUpdateDemographics?: (demographics: DemographicsConfig) => void;
}

const SECTORS = [
  {
    id: "recruiters" as const,
    label: "Recruiters",
    icon: UserCog,
    description: "Extract HR recruiters and talent acquisition specialists",
    examples: ["Talent Acquisition Manager", "HR Recruiter", "Headhunter"],
    color: "from-blue-600 to-cyan-500",
    glowColor: "shadow-blue-500/50",
    borderColor: "border-blue-500",
    bgColor: "bg-blue-500/20",
    textColor: "text-blue-400",
  },
  {
    id: "companies" as const,
    label: "Companies",
    icon: Building2,
    description: "Extract company information and decision makers",
    examples: ["Company websites", "About pages", "Team directories"],
    color: "from-purple-600 to-pink-500",
    glowColor: "shadow-purple-500/50",
    borderColor: "border-purple-500",
    bgColor: "bg-purple-500/20",
    textColor: "text-purple-400",
  },
  {
    id: "clients" as const,
    label: "Potential Clients",
    icon: Users,
    description: "Extract potential clients and business contacts",
    examples: ["Industry leaders", "Business owners", "Department heads"],
    color: "from-green-600 to-emerald-500",
    glowColor: "shadow-green-500/50",
    borderColor: "border-green-500",
    bgColor: "bg-emerald-500/20",
    textColor: "text-emerald-400",
  },
  {
    id: "customers" as const,
    label: "Customers",
    icon: ShoppingCart,
    description: "Extract customer leads and sales prospects",
    examples: ["Sales leads", "Marketing contacts", "Business prospects"],
    color: "from-orange-600 to-yellow-500",
    glowColor: "shadow-orange-500/50",
    borderColor: "border-orange-500",
    bgColor: "bg-orange-500/20",
    textColor: "text-orange-400",
  },
];

const REGIONS = [
  { id: "north_america", label: "North America", flag: "🇺🇸" },
  { id: "europe", label: "Europe", flag: "🇪🇺" },
  { id: "asia_pacific", label: "Asia Pacific", flag: "🌏" },
  { id: "india", label: "India", flag: "🇮🇳" },
  { id: "uk", label: "United Kingdom", flag: "🇬🇧" },
  { id: "middle_east", label: "Middle East", flag: "🌍" },
  { id: "latin_america", label: "Latin America", flag: "🌎" },
  { id: "australia", label: "Australia/NZ", flag: "🇦🇺" },
];

const COMPANY_SIZES = [
  { id: "startup", label: "Startup (1-10)", icon: Rocket },
  { id: "small", label: "Small (11-50)", icon: Store },
  { id: "medium", label: "Medium (51-200)", icon: Building },
  { id: "large", label: "Large (201-1000)", icon: Building2 },
  { id: "enterprise", label: "Enterprise (1000+)", icon: Landmark },
];

const INDUSTRIES = [
  { id: "technology", label: "Technology", icon: Cpu },
  { id: "finance", label: "Finance & Banking", icon: Banknote },
  { id: "healthcare", label: "Healthcare", icon: Stethoscope },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "retail", label: "Retail & E-commerce", icon: ShoppingBag },
  { id: "manufacturing", label: "Manufacturing", icon: Factory },
  { id: "logistics", label: "Logistics & Supply", icon: Truck },
  { id: "travel", label: "Travel & Hospitality", icon: Plane },
  { id: "food", label: "Food & Beverage", icon: Utensils },
  { id: "media", label: "Media & Entertainment", icon: Film },
  { id: "legal", label: "Legal Services", icon: Scale },
  { id: "realestate", label: "Real Estate", icon: Home },
  { id: "telecom", label: "Telecom", icon: Wifi },
  { id: "nonprofit", label: "Non-Profit", icon: Heart },
  { id: "energy", label: "Energy & Environment", icon: Leaf },
  { id: "services", label: "Professional Services", icon: Wrench },
];

export function SectorSelector({
  selectedSector,
  onSelectSector,
  demographics = { regions: [], companySizes: [], industries: [], customKeywords: [] },
  onUpdateDemographics,
}: SectorSelectorProps) {
  const [hoveredSector, setHoveredSector] = useState<SectorType | null>(null);
  const [showDemographics, setShowDemographics] = useState(false);
  const [customKeyword, setCustomKeyword] = useState("");

  const toggleRegion = (regionId: string) => {
    if (!onUpdateDemographics) return;
    const newRegions = demographics.regions.includes(regionId)
      ? demographics.regions.filter(r => r !== regionId)
      : [...demographics.regions, regionId];
    onUpdateDemographics({ ...demographics, regions: newRegions });
  };

  const toggleCompanySize = (sizeId: string) => {
    if (!onUpdateDemographics) return;
    const newSizes = demographics.companySizes.includes(sizeId)
      ? demographics.companySizes.filter(s => s !== sizeId)
      : [...demographics.companySizes, sizeId];
    onUpdateDemographics({ ...demographics, companySizes: newSizes });
  };

  const toggleIndustry = (industryId: string) => {
    if (!onUpdateDemographics) return;
    const newIndustries = demographics.industries.includes(industryId)
      ? demographics.industries.filter(i => i !== industryId)
      : [...demographics.industries, industryId];
    onUpdateDemographics({ ...demographics, industries: newIndustries });
  };

  const addCustomKeyword = () => {
    if (!onUpdateDemographics || !customKeyword.trim()) return;
    if (!demographics.customKeywords.includes(customKeyword.trim())) {
      onUpdateDemographics({
        ...demographics,
        customKeywords: [...demographics.customKeywords, customKeyword.trim()],
      });
    }
    setCustomKeyword("");
  };

  const removeCustomKeyword = (keyword: string) => {
    if (!onUpdateDemographics) return;
    onUpdateDemographics({
      ...demographics,
      customKeywords: demographics.customKeywords.filter(k => k !== keyword),
    });
  };

  const selectedSectorData = SECTORS.find(s => s.id === selectedSector);

  return (
    <div>
      {/* Header */}
      <div className="mb-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 mb-4"
        >
          <Target className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-blue-300">Step 1: Define Your Target</span>
        </motion.div>
        <h2 className="text-3xl font-bold text-white mb-3">
          Choose Your Target Sector
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Select the type of contacts you want to extract and define your target demographics for laser-focused results.
        </p>
      </div>

      {/* Sector Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {SECTORS.map((sector) => {
          const Icon = sector.icon;
          const isSelected = selectedSector === sector.id;
          const isHovered = hoveredSector === sector.id;

          return (
            <motion.button
              key={sector.id}
              onClick={() => onSelectSector(sector.id)}
              onMouseEnter={() => setHoveredSector(sector.id)}
              onMouseLeave={() => setHoveredSector(null)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative group text-left"
            >
              {/* Glass Card */}
              <div
                className={`
                  relative p-6 rounded-2xl border-2 transition-all duration-300
                  ${
                    isSelected
                      ? `border-transparent bg-gradient-to-br ${sector.color} shadow-2xl ${sector.glowColor}`
                      : "border-slate-700/50 bg-slate-800/30 backdrop-blur-sm hover:border-slate-600"
                  }
                `}
              >
                {/* Spotlight Effect */}
                {(isHovered || isSelected) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`
                      absolute inset-0 rounded-2xl opacity-20
                      bg-gradient-to-br ${sector.color}
                    `}
                  />
                )}

                {/* Content */}
                <div className="relative z-10">
                  {/* Header Row */}
                  <div className="flex items-start justify-between mb-4">
                    {/* Icon */}
                    <div
                      className={`
                        p-3 rounded-xl transition-colors duration-300
                        ${
                          isSelected
                            ? "bg-white/20"
                            : "bg-slate-700/50 group-hover:bg-slate-700"
                        }
                      `}
                    >
                      <Icon
                        className={`
                          w-8 h-8 transition-colors duration-300
                          ${isSelected ? "text-white" : "text-slate-400 group-hover:text-white"}
                        `}
                      />
                    </div>

                    {/* Selected Indicator */}
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 15 }}
                      >
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      </motion.div>
                    )}
                  </div>

                  {/* Title */}
                  <h3
                    className={`
                      text-xl font-bold mb-2 transition-colors duration-300
                      ${isSelected ? "text-white" : "text-slate-200"}
                    `}
                  >
                    {sector.label}
                  </h3>

                  {/* Description */}
                  <p
                    className={`
                      text-sm mb-4 transition-colors duration-300
                      ${isSelected ? "text-white/90" : "text-slate-400"}
                    `}
                  >
                    {sector.description}
                  </p>

                  {/* Examples */}
                  <div className="space-y-2">
                    <div
                      className={`
                        text-xs font-semibold uppercase tracking-wider transition-colors duration-300
                        ${isSelected ? "text-white/80" : "text-slate-500"}
                      `}
                    >
                      Examples:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {sector.examples.map((example, idx) => (
                        <span
                          key={idx}
                          className={`
                            px-2 py-1 rounded-md text-xs transition-colors duration-300
                            ${
                              isSelected
                                ? "bg-white/20 text-white"
                                : "bg-slate-700/50 text-slate-400"
                            }
                          `}
                        >
                          {example}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Gradient Border Animation */}
                {isSelected && (
                  <motion.div
                    className={`
                      absolute inset-0 rounded-2xl
                      bg-gradient-to-br ${sector.color}
                      opacity-50 blur-xl -z-10
                    `}
                    animate={{
                      opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Demographics Section */}
      {selectedSector && onUpdateDemographics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Demographics Toggle */}
          <button
            onClick={() => setShowDemographics(!showDemographics)}
            className={`
              w-full p-5 rounded-2xl border-2 transition-all duration-300 flex items-center justify-between
              ${showDemographics
                ? `${selectedSectorData?.borderColor} ${selectedSectorData?.bgColor}`
                : "border-slate-700/50 bg-slate-800/30 hover:border-slate-600"}
            `}
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${selectedSectorData?.bgColor}`}>
                <Globe className={`w-6 h-6 ${selectedSectorData?.textColor}`} />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold text-white">Target Demographics</h3>
                <p className="text-sm text-slate-400">
                  Define regions, company sizes, and industries (optional but recommended)
                </p>
              </div>
            </div>
            <div className={`p-2 rounded-lg ${showDemographics ? selectedSectorData?.bgColor : "bg-slate-700/50"}`}>
              {showDemographics
                ? <ChevronUp className={`w-5 h-5 ${selectedSectorData?.textColor}`} />
                : <ChevronDown className="w-5 h-5 text-slate-400" />
              }
            </div>
          </button>

          {/* Demographics Content */}
          <AnimatePresence>
            {showDemographics && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="space-y-6 p-6 rounded-2xl border border-slate-700/50 bg-slate-800/20">
                  {/* Geographic Regions */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <MapPin className={`w-5 h-5 ${selectedSectorData?.textColor}`} />
                      <h4 className="text-lg font-semibold text-white">Geographic Regions</h4>
                      <span className="text-xs text-slate-500">(Select all that apply)</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {REGIONS.map((region) => {
                        const isActive = demographics.regions.includes(region.id);
                        return (
                          <button
                            key={region.id}
                            onClick={() => toggleRegion(region.id)}
                            className={`
                              p-3 rounded-xl border-2 transition-all flex items-center gap-2
                              ${isActive
                                ? `${selectedSectorData?.borderColor} ${selectedSectorData?.bgColor}`
                                : "border-slate-700/50 bg-slate-800/30 hover:border-slate-600"}
                            `}
                          >
                            <span className="text-lg">{region.flag}</span>
                            <span className={`text-sm ${isActive ? "text-white" : "text-slate-300"}`}>
                              {region.label}
                            </span>
                            {isActive && <CheckCircle2 className={`w-4 h-4 ml-auto ${selectedSectorData?.textColor}`} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Company Sizes */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Building className={`w-5 h-5 ${selectedSectorData?.textColor}`} />
                      <h4 className="text-lg font-semibold text-white">Company Size</h4>
                      <span className="text-xs text-slate-500">(Select all that apply)</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {COMPANY_SIZES.map((size) => {
                        const Icon = size.icon;
                        const isActive = demographics.companySizes.includes(size.id);
                        return (
                          <button
                            key={size.id}
                            onClick={() => toggleCompanySize(size.id)}
                            className={`
                              p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2
                              ${isActive
                                ? `${selectedSectorData?.borderColor} ${selectedSectorData?.bgColor}`
                                : "border-slate-700/50 bg-slate-800/30 hover:border-slate-600"}
                            `}
                          >
                            <Icon className={`w-5 h-5 ${isActive ? selectedSectorData?.textColor : "text-slate-400"}`} />
                            <span className={`text-xs text-center ${isActive ? "text-white" : "text-slate-300"}`}>
                              {size.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Industries */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Briefcase className={`w-5 h-5 ${selectedSectorData?.textColor}`} />
                      <h4 className="text-lg font-semibold text-white">Industries</h4>
                      <span className="text-xs text-slate-500">(Select all that apply)</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {INDUSTRIES.map((industry) => {
                        const Icon = industry.icon;
                        const isActive = demographics.industries.includes(industry.id);
                        return (
                          <button
                            key={industry.id}
                            onClick={() => toggleIndustry(industry.id)}
                            className={`
                              p-3 rounded-xl border-2 transition-all flex items-center gap-2
                              ${isActive
                                ? `${selectedSectorData?.borderColor} ${selectedSectorData?.bgColor}`
                                : "border-slate-700/50 bg-slate-800/30 hover:border-slate-600"}
                            `}
                          >
                            <Icon className={`w-4 h-4 ${isActive ? selectedSectorData?.textColor : "text-slate-400"}`} />
                            <span className={`text-sm ${isActive ? "text-white" : "text-slate-300"}`}>
                              {industry.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Keywords */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Target className={`w-5 h-5 ${selectedSectorData?.textColor}`} />
                      <h4 className="text-lg font-semibold text-white">Custom Keywords</h4>
                      <span className="text-xs text-slate-500">(Add specific search terms)</span>
                    </div>
                    <div className="flex gap-3 mb-3">
                      <Input
                        placeholder="e.g., 'SaaS', 'B2B', 'Series A'..."
                        value={customKeyword}
                        onChange={(e) => setCustomKeyword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addCustomKeyword()}
                        className="bg-slate-900/50 border-slate-700 text-white"
                      />
                      <button
                        onClick={addCustomKeyword}
                        className={`px-4 rounded-xl ${selectedSectorData?.bgColor} ${selectedSectorData?.borderColor} border-2 transition-colors hover:opacity-80`}
                      >
                        <Plus className={`w-5 h-5 ${selectedSectorData?.textColor}`} />
                      </button>
                    </div>
                    {demographics.customKeywords.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {demographics.customKeywords.map((keyword) => (
                          <span
                            key={keyword}
                            className={`
                              px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm
                              ${selectedSectorData?.bgColor} ${selectedSectorData?.textColor}
                            `}
                          >
                            {keyword}
                            <button
                              onClick={() => removeCustomKeyword(keyword)}
                              className="hover:opacity-70"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Summary Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-xl ${selectedSectorData?.bgColor} border ${selectedSectorData?.borderColor}`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${selectedSectorData?.bgColor}`}>
                <CheckCircle2 className={`w-5 h-5 ${selectedSectorData?.textColor}`} />
              </div>
              <div className="flex-1">
                <h4 className="text-white font-semibold mb-1">
                  {selectedSectorData?.label} Selected
                </h4>
                <div className="text-slate-300 text-sm space-y-1">
                  {demographics.regions.length > 0 && (
                    <p>
                      <span className="text-slate-400">Regions:</span>{" "}
                      {demographics.regions.map(r => REGIONS.find(reg => reg.id === r)?.label).join(", ")}
                    </p>
                  )}
                  {demographics.companySizes.length > 0 && (
                    <p>
                      <span className="text-slate-400">Company Sizes:</span>{" "}
                      {demographics.companySizes.map(s => COMPANY_SIZES.find(sz => sz.id === s)?.label).join(", ")}
                    </p>
                  )}
                  {demographics.industries.length > 0 && (
                    <p>
                      <span className="text-slate-400">Industries:</span>{" "}
                      {demographics.industries.map(i => INDUSTRIES.find(ind => ind.id === i)?.label).join(", ")}
                    </p>
                  )}
                  {demographics.customKeywords.length > 0 && (
                    <p>
                      <span className="text-slate-400">Keywords:</span>{" "}
                      {demographics.customKeywords.join(", ")}
                    </p>
                  )}
                  {demographics.regions.length === 0 && demographics.companySizes.length === 0 &&
                   demographics.industries.length === 0 && demographics.customKeywords.length === 0 && (
                    <p className="text-slate-400">No demographics configured - will search all targets</p>
                  )}
                </div>
              </div>
              <div className={`px-4 py-2 rounded-lg font-semibold text-sm ${selectedSectorData?.bgColor} ${selectedSectorData?.textColor}`}>
                Click Next
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
