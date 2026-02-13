"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Building2,
  Globe,
  Code2,
  Briefcase,
  Newspaper,
  FileDown,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Calendar,
  ExternalLink,
  Target,
  Users,
  TrendingUp,
  BookOpen,
  Award,
  X,
} from "lucide-react";
import { CompanyResearchData } from "@/lib/api";

interface CompanyResearchViewerProps {
  research: CompanyResearchData | null;
  open: boolean;
  onClose: () => void;
}

export function CompanyResearchViewer({
  research,
  open,
  onClose,
}: CompanyResearchViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [currentSection, setCurrentSection] = useState(0);

  if (!research) return null;

  // Define sections for navigation
  const sections = [
    { id: "overview", label: "Overview", icon: Building2 },
    { id: "tech", label: "Tech Stack", icon: Code2 },
    { id: "jobs", label: "Job Openings", icon: Briefcase },
    { id: "news", label: "Recent News", icon: Newspaper },
    { id: "culture", label: "Company Culture", icon: Users },
  ];

  const handleZoomIn = () => {
    if (zoom < 150) setZoom(zoom + 10);
  };

  const handleZoomOut = () => {
    if (zoom > 70) setZoom(zoom - 10);
  };

  const handleDownload = () => {
    const dataStr = JSON.stringify(research, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${research.company_name}_research.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const goToNextSection = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const goToPreviousSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "from-green-500 to-emerald-600";
    if (score >= 50) return "from-yellow-500 to-orange-600";
    return "from-red-500 to-rose-600";
  };

  // Parse tech stack data
  const techStack = research.tech_stack || {};
  const techEntries = Object.entries(techStack);

  // Parse job openings
  const jobOpenings = Array.isArray(research.job_openings)
    ? research.job_openings
    : [];

  // Parse recent news
  const recentNews = Array.isArray(research.recent_news)
    ? research.recent_news
    : [];

  // Parse company culture - ensure it's always a string
  const companyCultureRaw =
    typeof research.company_culture === "string"
      ? research.company_culture
      : research.company_culture?.summary ||
        research.company_culture?.description ||
        "";
  const companyCulture = typeof companyCultureRaw === "string" ? companyCultureRaw : "";

  const currentSectionData = sections[currentSection];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 glass border-slate-700">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-700">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-white">
                  {research.company_name}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-1">
                  {research.company_website && (
                    <a
                      href={research.company_website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-slate-400 hover:text-blue-400 flex items-center gap-1"
                    >
                      <Globe className="w-4 h-4" />
                      {research.company_website.replace(/^https?:\/\//, "")}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
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

          {/* Completeness Badge */}
          <div className="flex items-center gap-3 mt-4">
            <Badge
              className={`bg-gradient-to-r ${getScoreBgColor(
                research.completeness_score
              )} text-white`}
            >
              {Math.round(research.completeness_score)}% Complete
            </Badge>
            <Badge variant="outline" className="border-slate-600">
              {research.research_depth}
            </Badge>
            {research.data_sources && Array.isArray(research.data_sources) && (
              <Badge variant="secondary">
                {research.data_sources.length} sources
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Controls Bar */}
        <div className="px-6 py-3 border-b border-slate-700 flex items-center justify-between bg-slate-800/50">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousSection}
              disabled={currentSection === 0}
              className="border-slate-600"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextSection}
              disabled={currentSection === sections.length - 1}
              className="border-slate-600"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 70}
              className="border-slate-600"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm text-slate-400 min-w-[60px] text-center">
              {zoom}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 150}
              className="border-slate-600"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="border-slate-600 ml-2"
            >
              <FileDown className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        {/* Section Navigation */}
        <div className="px-6 py-3 border-b border-slate-700 overflow-x-auto">
          <div className="flex items-center gap-2">
            {sections.map((section, index) => {
              const Icon = section.icon;
              return (
                <Button
                  key={section.id}
                  variant={currentSection === index ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentSection(index)}
                  className={
                    currentSection === index
                      ? "bg-purple-600 hover:bg-purple-700"
                      : ""
                  }
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {section.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="h-[calc(90vh-280px)]">
          <div
            className="p-6 space-y-6"
            style={{ fontSize: `${zoom}%`, lineHeight: 1.6 }}
          >
            {/* Overview Section */}
            {currentSection === 0 && (
              <div className="space-y-6">
                <Card className="glass border-slate-700 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">
                      Company Overview
                    </h3>
                  </div>
                  {research.about_summary ? (
                    <p className="text-slate-300">{research.about_summary}</p>
                  ) : (
                    <p className="text-slate-500 italic">
                      No overview available
                    </p>
                  )}
                </Card>

                <Card className="glass border-slate-700 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-semibold text-white">
                      Research Metadata
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-slate-400">
                        Last Refreshed
                      </div>
                      <div className="text-white">
                        {new Date(research.last_refreshed).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-400">Created At</div>
                      <div className="text-white">
                        {new Date(research.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-400">Expires At</div>
                      <div className="text-white">
                        {new Date(research.expires_at).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-400">Research ID</div>
                      <div className="text-white">{research.id}</div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Tech Stack Section */}
            {currentSection === 1 && (
              <Card className="glass border-slate-700 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Code2 className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-semibold text-white">
                    Technology Stack
                  </h3>
                </div>
                {techEntries.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {techEntries.map(([tech, value], idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="text-sm border-cyan-500/30 text-cyan-400 px-3 py-1"
                        >
                          {tech}
                          {typeof value === "number" && value > 1 && (
                            <span className="ml-2 text-cyan-300">
                              ×{value}
                            </span>
                          )}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-700">
                      <div className="text-sm text-slate-400">
                        Total Technologies: {techEntries.length}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 italic">
                    No tech stack information available
                  </p>
                )}
              </Card>
            )}

            {/* Job Openings Section */}
            {currentSection === 2 && (
              <Card className="glass border-slate-700 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase className="w-5 h-5 text-green-400" />
                  <h3 className="text-lg font-semibold text-white">
                    Job Openings ({jobOpenings.length})
                  </h3>
                </div>
                {jobOpenings.length > 0 ? (
                  <div className="space-y-3">
                    {jobOpenings.map((job: any, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-lg bg-slate-800/50 border border-slate-700"
                      >
                        <div className="flex items-start gap-3">
                          <TrendingUp className="w-5 h-5 text-green-400 mt-1" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-white">
                              {typeof job === "string"
                                ? job
                                : job.title || "Job Opening"}
                            </h4>
                            {typeof job === "object" && job.location && (
                              <div className="text-sm text-slate-400 mt-1">
                                <Target className="w-3 h-3 inline mr-1" />
                                {job.location}
                              </div>
                            )}
                            {typeof job === "object" && job.description && (
                              <p className="text-sm text-slate-300 mt-2">
                                {job.description}
                              </p>
                            )}
                            {typeof job === "object" && job.url && (
                              <a
                                href={job.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-400 hover:text-blue-300 mt-2 inline-flex items-center gap-1"
                              >
                                View Job
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 italic">
                    No job openings found
                  </p>
                )}
              </Card>
            )}

            {/* Recent News Section */}
            {currentSection === 3 && (
              <Card className="glass border-slate-700 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Newspaper className="w-5 h-5 text-yellow-400" />
                  <h3 className="text-lg font-semibold text-white">
                    Recent News ({recentNews.length})
                  </h3>
                </div>
                {recentNews.length > 0 ? (
                  <div className="space-y-3">
                    {recentNews.map((news: any, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-lg bg-slate-800/50 border border-slate-700"
                      >
                        <div className="flex items-start gap-3">
                          <BookOpen className="w-5 h-5 text-yellow-400 mt-1" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-white">
                              {typeof news === "string"
                                ? news
                                : news.title || "News Item"}
                            </h4>
                            {typeof news === "object" && news.date && (
                              <div className="text-xs text-slate-500 mt-1">
                                {news.date}
                              </div>
                            )}
                            {typeof news === "object" && news.description && (
                              <p className="text-sm text-slate-300 mt-2">
                                {news.description}
                              </p>
                            )}
                            {typeof news === "object" && news.url && (
                              <a
                                href={news.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-400 hover:text-blue-300 mt-2 inline-flex items-center gap-1"
                              >
                                Read More
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 italic">No recent news found</p>
                )}
              </Card>
            )}

            {/* Company Culture Section */}
            {currentSection === 4 && (
              <Card className="glass border-slate-700 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-pink-400" />
                  <h3 className="text-lg font-semibold text-white">
                    Company Culture
                  </h3>
                </div>
                {companyCulture ? (
                  <div className="space-y-4">
                    <p className="text-slate-300">{companyCulture}</p>
                    {(() => {
                      const culture = research.company_culture as Record<string, unknown> | undefined;
                      const values = culture?.values;
                      if (values && Array.isArray(values)) {
                        return (
                          <div className="mt-4 pt-4 border-t border-slate-700">
                            <h4 className="text-sm font-semibold text-slate-400 mb-2">
                              Core Values
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {values.map((value, idx) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className="border-pink-500/30 text-pink-400"
                                >
                                  <Award className="w-3 h-3 mr-1" />
                                  {String(value)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                ) : (
                  <p className="text-slate-500 italic">
                    No company culture information available
                  </p>
                )}
              </Card>
            )}
          </div>
        </ScrollArea>

        {/* Footer Navigation */}
        <div className="px-6 py-4 border-t border-slate-700 flex items-center justify-between">
          <div className="text-sm text-slate-400">
            Section {currentSection + 1} of {sections.length}:{" "}
            {currentSectionData.label}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousSection}
              disabled={currentSection === 0}
              className="border-slate-600"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextSection}
              disabled={currentSection === sections.length - 1}
              className="border-slate-600"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
