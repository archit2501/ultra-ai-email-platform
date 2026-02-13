"use client";

/**
 * Step 3: Filter Builder
 * Set search criteria with AI-powered suggestions
 */

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Filter,
  Sparkles,
  Plus,
  X,
  Building2,
  MapPin,
  Briefcase,
  Users,
  DollarSign,
  Code,
  TrendingUp,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SectorType = "clients" | "companies" | "recruiters" | "customers";

interface FilterBuilderProps {
  sector: SectorType;
  filters: {
    basic?: {
      job_titles?: string[];
      locations?: string[];
      industries?: string[];
      company_sizes?: string[];
    };
    advanced?: {
      revenue_ranges?: string[];
      tech_stack?: string[];
      funding_status?: string[];
      keywords?: string[];
    };
  };
  onUpdateFilters: (filters: any) => void;
}

// AI Suggestions by Sector
const AI_SUGGESTIONS = {
  recruiters: {
    job_titles: [
      "HR Manager",
      "Talent Acquisition Specialist",
      "Recruiter",
      "Headhunter",
      "Talent Partner",
      "People Operations Manager",
    ],
    industries: [
      "Technology",
      "Finance",
      "Healthcare",
      "Consulting",
      "Manufacturing",
    ],
    keywords: [
      "hiring",
      "recruitment",
      "talent",
      "onboarding",
      "workforce",
    ],
  },
  companies: {
    industries: [
      "SaaS",
      "E-commerce",
      "Fintech",
      "Healthcare Tech",
      "AI/ML",
      "Cybersecurity",
    ],
    company_sizes: ["1-10", "11-50", "51-200", "201-500", "500+"],
    keywords: [
      "innovative",
      "fast-growing",
      "startup",
      "enterprise",
      "platform",
    ],
  },
  clients: {
    job_titles: [
      "CEO",
      "CTO",
      "VP",
      "Director",
      "Head of",
      "Chief",
      "Founder",
    ],
    industries: [
      "Enterprise Software",
      "Professional Services",
      "Manufacturing",
      "Retail",
    ],
    keywords: [
      "decision maker",
      "executive",
      "leadership",
      "strategy",
      "growth",
    ],
  },
  customers: {
    job_titles: [
      "Sales Manager",
      "Business Development",
      "Account Executive",
      "Sales Director",
    ],
    industries: ["B2B Services", "Retail", "E-commerce", "Wholesale"],
    keywords: [
      "buyer",
      "procurement",
      "purchasing",
      "vendor",
      "supplier",
    ],
  },
};

const TECH_STACKS = [
  "React",
  "Vue.js",
  "Angular",
  "Node.js",
  "Python",
  "Java",
  "AWS",
  "Azure",
  "GCP",
  "Docker",
  "Kubernetes",
  "PostgreSQL",
  "MongoDB",
  "Redis",
  "GraphQL",
  "TypeScript",
];

const LOCATIONS = [
  "Luxembourg",
  "Paris",
  "Brussels",
  "Amsterdam",
  "London",
  "Berlin",
  "Munich",
  "Zurich",
  "Geneva",
  "Frankfurt",
];

const FUNDING_STATUS = [
  "Bootstrapped",
  "Seed",
  "Series A",
  "Series B",
  "Series C+",
  "Public",
  "Acquired",
];

export function FilterBuilder({
  sector,
  filters,
  onUpdateFilters,
}: FilterBuilderProps) {
  const [showAiSuggestions, setShowAiSuggestions] = useState(true);
  const [newJobTitle, setNewJobTitle] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newIndustry, setNewIndustry] = useState("");

  const suggestions = AI_SUGGESTIONS[sector];

  // Add filter helpers
  const addJobTitle = () => {
    if (newJobTitle.trim()) {
      onUpdateFilters({
        ...filters,
        basic: {
          ...filters.basic,
          job_titles: [...(filters.basic?.job_titles || []), newJobTitle.trim()],
        },
      });
      setNewJobTitle("");
    }
  };

  const removeJobTitle = (title: string) => {
    onUpdateFilters({
      ...filters,
      basic: {
        ...filters.basic,
        job_titles: filters.basic?.job_titles?.filter((t) => t !== title) || [],
      },
    });
  };

  const addLocation = () => {
    if (newLocation.trim()) {
      onUpdateFilters({
        ...filters,
        basic: {
          ...filters.basic,
          locations: [...(filters.basic?.locations || []), newLocation.trim()],
        },
      });
      setNewLocation("");
    }
  };

  const removeLocation = (location: string) => {
    onUpdateFilters({
      ...filters,
      basic: {
        ...filters.basic,
        locations: filters.basic?.locations?.filter((l) => l !== location) || [],
      },
    });
  };

  const addIndustry = () => {
    if (newIndustry.trim()) {
      onUpdateFilters({
        ...filters,
        basic: {
          ...filters.basic,
          industries: [...(filters.basic?.industries || []), newIndustry.trim()],
        },
      });
      setNewIndustry("");
    }
  };

  const removeIndustry = (industry: string) => {
    onUpdateFilters({
      ...filters,
      basic: {
        ...filters.basic,
        industries: filters.basic?.industries?.filter((i) => i !== industry) || [],
      },
    });
  };

  const addFromSuggestion = (type: string, value: string) => {
    switch (type) {
      case "job_titles":
        if (!filters.basic?.job_titles?.includes(value)) {
          onUpdateFilters({
            ...filters,
            basic: {
              ...filters.basic,
              job_titles: [...(filters.basic?.job_titles || []), value],
            },
          });
        }
        break;
      case "locations":
        if (!filters.basic?.locations?.includes(value)) {
          onUpdateFilters({
            ...filters,
            basic: {
              ...filters.basic,
              locations: [...(filters.basic?.locations || []), value],
            },
          });
        }
        break;
      case "industries":
        if (!filters.basic?.industries?.includes(value)) {
          onUpdateFilters({
            ...filters,
            basic: {
              ...filters.basic,
              industries: [...(filters.basic?.industries || []), value],
            },
          });
        }
        break;
      case "tech_stack":
        if (!filters.advanced?.tech_stack?.includes(value)) {
          onUpdateFilters({
            ...filters,
            advanced: {
              ...filters.advanced,
              tech_stack: [...(filters.advanced?.tech_stack || []), value],
            },
          });
        }
        break;
    }
  };

  const toggleTechStack = (tech: string) => {
    const current = filters.advanced?.tech_stack || [];
    const updated = current.includes(tech)
      ? current.filter((t) => t !== tech)
      : [...current, tech];

    onUpdateFilters({
      ...filters,
      advanced: {
        ...filters.advanced,
        tech_stack: updated,
      },
    });
  };

  const toggleFundingStatus = (status: string) => {
    const current = filters.advanced?.funding_status || [];
    const updated = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status];

    onUpdateFilters({
      ...filters,
      advanced: {
        ...filters.advanced,
        funding_status: updated,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Set Search Criteria</h2>
        <p className="text-slate-400">
          Define filters to target your ideal {sector}. Leave empty for no filtering.
        </p>
      </div>

      {/* AI Suggestions Banner */}
      {showAiSuggestions && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="relative p-6 rounded-xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 overflow-hidden"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10"
            animate={{
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h3 className="text-white font-semibold">
                  AI-Powered Suggestions
                </h3>
              </div>
              <button
                onClick={() => setShowAiSuggestions(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-slate-300 mb-4">
              Based on your {sector} sector selection, we recommend these filters:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Job Titles */}
              {"job_titles" in suggestions && suggestions.job_titles && (
                <div>
                  <Label className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                    <Briefcase className="w-3 h-3" />
                    Job Titles
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.job_titles.map((title) => (
                      <button
                        key={title}
                        onClick={() => addFromSuggestion("job_titles", title)}
                        className={`
                          px-3 py-1 rounded-full text-xs transition-all
                          ${
                            filters.basic?.job_titles?.includes(title)
                              ? "bg-purple-600 text-white"
                              : "bg-purple-600/20 text-purple-300 hover:bg-purple-600/30"
                          }
                        `}
                      >
                        {filters.basic?.job_titles?.includes(title) && "✓ "}
                        {title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Industries */}
              {suggestions.industries && (
                <div>
                  <Label className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    Industries
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.industries.map((industry) => (
                      <button
                        key={industry}
                        onClick={() => addFromSuggestion("industries", industry)}
                        className={`
                          px-3 py-1 rounded-full text-xs transition-all
                          ${
                            filters.basic?.industries?.includes(industry)
                              ? "bg-pink-600 text-white"
                              : "bg-pink-600/20 text-pink-300 hover:bg-pink-600/30"
                          }
                        `}
                      >
                        {filters.basic?.industries?.includes(industry) && "✓ "}
                        {industry}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Filters */}
        <Card className="bg-slate-800/30 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Basic Filters
            </CardTitle>
            <CardDescription>
              Core criteria for your extraction
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Job Titles */}
            <div className="space-y-2">
              <Label className="text-slate-300 flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Job Titles
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., HR Manager"
                  value={newJobTitle}
                  onChange={(e) => setNewJobTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addJobTitle()}
                  className="bg-slate-900/50 border-slate-700"
                />
                <Button
                  onClick={addJobTitle}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {filters.basic?.job_titles && filters.basic.job_titles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {filters.basic.job_titles.map((title) => (
                    <Badge
                      key={title}
                      variant="secondary"
                      className="bg-blue-600/20 text-blue-300 hover:bg-blue-600/30"
                    >
                      {title}
                      <button
                        onClick={() => removeJobTitle(title)}
                        className="ml-2 hover:text-blue-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Locations */}
            <div className="space-y-2">
              <Label className="text-slate-300 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Locations
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., Luxembourg"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addLocation()}
                  className="bg-slate-900/50 border-slate-700"
                />
                <Button
                  onClick={addLocation}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Popular Locations */}
              <div className="flex flex-wrap gap-2">
                {LOCATIONS.slice(0, 5).map((loc) => (
                  <button
                    key={loc}
                    onClick={() => addFromSuggestion("locations", loc)}
                    className={`
                      px-2 py-1 rounded-md text-xs transition-colors
                      ${
                        filters.basic?.locations?.includes(loc)
                          ? "bg-green-600 text-white"
                          : "bg-slate-700/50 text-slate-400 hover:bg-slate-700"
                      }
                    `}
                  >
                    {loc}
                  </button>
                ))}
              </div>

              {filters.basic?.locations && filters.basic.locations.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {filters.basic.locations.map((location) => (
                    <Badge
                      key={location}
                      variant="secondary"
                      className="bg-green-600/20 text-green-300 hover:bg-green-600/30"
                    >
                      {location}
                      <button
                        onClick={() => removeLocation(location)}
                        className="ml-2 hover:text-green-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Industries */}
            <div className="space-y-2">
              <Label className="text-slate-300 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Industries
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., Technology"
                  value={newIndustry}
                  onChange={(e) => setNewIndustry(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addIndustry()}
                  className="bg-slate-900/50 border-slate-700"
                />
                <Button
                  onClick={addIndustry}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {filters.basic?.industries && filters.basic.industries.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {filters.basic.industries.map((industry) => (
                    <Badge
                      key={industry}
                      variant="secondary"
                      className="bg-purple-600/20 text-purple-300 hover:bg-purple-600/30"
                    >
                      {industry}
                      <button
                        onClick={() => removeIndustry(industry)}
                        className="ml-2 hover:text-purple-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Advanced Filters */}
        <Card className="bg-slate-800/30 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Advanced Filters
            </CardTitle>
            <CardDescription>
              Optional advanced criteria
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tech Stack */}
            <div className="space-y-2">
              <Label className="text-slate-300 flex items-center gap-2">
                <Code className="w-4 h-4" />
                Tech Stack
              </Label>
              <div className="flex flex-wrap gap-2">
                {TECH_STACKS.slice(0, 12).map((tech) => (
                  <button
                    key={tech}
                    onClick={() => toggleTechStack(tech)}
                    className={`
                      px-3 py-1.5 rounded-md text-xs transition-all
                      ${
                        filters.advanced?.tech_stack?.includes(tech)
                          ? "bg-cyan-600 text-white shadow-lg shadow-cyan-500/50"
                          : "bg-slate-700/50 text-slate-400 hover:bg-slate-700"
                      }
                    `}
                  >
                    {filters.advanced?.tech_stack?.includes(tech) && "✓ "}
                    {tech}
                  </button>
                ))}
              </div>
            </div>

            {/* Funding Status */}
            <div className="space-y-2">
              <Label className="text-slate-300 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Funding Status
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {FUNDING_STATUS.map((status) => (
                  <button
                    key={status}
                    onClick={() => toggleFundingStatus(status)}
                    className={`
                      px-3 py-2 rounded-lg text-sm transition-all text-left
                      ${
                        filters.advanced?.funding_status?.includes(status)
                          ? "bg-yellow-600/30 text-yellow-300 border-2 border-yellow-500/50"
                          : "bg-slate-700/30 text-slate-400 border border-slate-700/50 hover:bg-slate-700/50"
                      }
                    `}
                  >
                    {filters.advanced?.funding_status?.includes(status) && "✓ "}
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Company Size (if companies sector) */}
            {sector === "companies" && (
              <div className="space-y-2">
                <Label className="text-slate-300 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Company Size
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {["1-10", "11-50", "51-200", "201-500", "500+"].map((size) => {
                    const isSelected =
                      filters.basic?.company_sizes?.includes(size);
                    return (
                      <button
                        key={size}
                        onClick={() => {
                          const current = filters.basic?.company_sizes || [];
                          const updated = isSelected
                            ? current.filter((s) => s !== size)
                            : [...current, size];

                          onUpdateFilters({
                            ...filters,
                            basic: {
                              ...filters.basic,
                              company_sizes: updated,
                            },
                          });
                        }}
                        className={`
                          px-3 py-2 rounded-lg text-sm transition-all
                          ${
                            isSelected
                              ? "bg-orange-600/30 text-orange-300 border-2 border-orange-500/50"
                              : "bg-slate-700/30 text-slate-400 border border-slate-700/50 hover:bg-slate-700/50"
                          }
                        `}
                      >
                        {isSelected && "✓ "}
                        {size} employees
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Keywords */}
            <div className="space-y-2">
              <Label className="text-slate-300 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Keywords (Optional)
              </Label>
              <Input
                placeholder="e.g., AI, machine learning, startup"
                className="bg-slate-900/50 border-slate-700"
              />
              <p className="text-xs text-slate-500">
                Comma-separated keywords to search for in content
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Box */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-xl bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/30"
      >
        <h3 className="text-white font-semibold mb-3">Filter Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-slate-400">Job Titles</div>
            <div className="text-white font-semibold">
              {filters.basic?.job_titles?.length || 0}
            </div>
          </div>
          <div>
            <div className="text-slate-400">Locations</div>
            <div className="text-white font-semibold">
              {filters.basic?.locations?.length || 0}
            </div>
          </div>
          <div>
            <div className="text-slate-400">Industries</div>
            <div className="text-white font-semibold">
              {filters.basic?.industries?.length || 0}
            </div>
          </div>
          <div>
            <div className="text-slate-400">Tech Stack</div>
            <div className="text-white font-semibold">
              {filters.advanced?.tech_stack?.length || 0}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
