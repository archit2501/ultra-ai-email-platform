"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Brain,
  Building2,
  Code2,
  Briefcase,
  Newspaper,
  Globe,
  RefreshCw,
  Calendar,
  ExternalLink,
  TrendingUp,
} from "lucide-react";
import { intelligenceAPI, CompanyResearchData } from "@/lib/api";
import { CompanyResearchViewer } from "./CompanyResearchViewer";

export function IntelligenceResearchView() {
  const [loading, setLoading] = useState(true);
  const [research, setResearch] = useState<CompanyResearchData[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedResearch, setSelectedResearch] = useState<CompanyResearchData | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  const fetchResearch = async () => {
    try {
      setLoading(true);
      const response = await intelligenceAPI.listResearch(100);
      setResearch(response.data.research_cache);
      setTotal(response.data.total);
    } catch (error) {
      console.error("Failed to fetch intelligence research:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResearch();
  }, []);

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

  const handleResearchClick = (item: CompanyResearchData) => {
    setSelectedResearch(item);
    setViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setViewerOpen(false);
    setSelectedResearch(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600">
              <Brain className="w-6 h-6 text-white" />
            </div>
            Company Intelligence
          </h1>
          <p className="text-slate-400 mt-2">
            View AI-researched company data and insights
          </p>
        </div>
        <Button onClick={fetchResearch} variant="outline" className="border-slate-600">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <Card className="glass border-slate-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-white">{total}</div>
            <div className="text-sm text-slate-400">Companies Researched</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400">
              {research.filter(r => r.completeness_score >= 50).length}
            </div>
            <div className="text-sm text-slate-400">Quality Research</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400">
              {research.reduce((sum, r) => sum + (Array.isArray(r.data_sources) ? r.data_sources.length : 0), 0)}
            </div>
            <div className="text-sm text-slate-400">Data Sources</div>
          </div>
        </div>
      </Card>

      {/* Research Cards */}
      {research.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {research.map((item) => (
            <Card
              key={item.id}
              className="glass border-slate-700 p-6 hover:border-slate-600 transition-colors cursor-pointer"
              onClick={() => handleResearchClick(item)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-700">
                    <Building2 className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{item.company_name}</h3>
                    {item.company_website && (
                      <a
                        href={item.company_website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-slate-400 hover:text-blue-400 flex items-center gap-1"
                      >
                        <Globe className="w-3 h-3" />
                        {item.company_website.replace(/^https?:\/\//, "")}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
                <Badge
                  className={`bg-gradient-to-r ${getScoreBgColor(item.completeness_score)} text-white text-xs`}
                >
                  {Math.round(item.completeness_score)}% Complete
                </Badge>
              </div>

              {/* Completeness Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400">Data Completeness</span>
                  <span className={`text-xs font-bold ${getScoreColor(item.completeness_score)}`}>
                    {Math.round(item.completeness_score)}%
                  </span>
                </div>
                <Progress value={item.completeness_score} className="h-2" />
              </div>

              {/* About Summary */}
              {item.about_summary && (
                <div className="mb-4">
                  <p className="text-sm text-slate-300 line-clamp-3">
                    {item.about_summary}
                  </p>
                </div>
              )}

              {/* Tech Stack */}
              {item.tech_stack && Object.keys(item.tech_stack).length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Code2 className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-semibold text-slate-400">Tech Stack</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {Object.keys(item.tech_stack).slice(0, 10).map((tech, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="text-xs border-cyan-500/30 text-cyan-400"
                      >
                        {tech}
                      </Badge>
                    ))}
                    {Object.keys(item.tech_stack).length > 10 && (
                      <Badge variant="secondary" className="text-xs">
                        +{Object.keys(item.tech_stack).length - 10}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Job Openings */}
              {item.job_openings && Array.isArray(item.job_openings) && item.job_openings.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase className="w-4 h-4 text-green-400" />
                    <span className="text-xs font-semibold text-slate-400">
                      Job Openings ({item.job_openings.length})
                    </span>
                  </div>
                  <div className="space-y-1">
                    {item.job_openings.slice(0, 3).map((job: any, idx) => (
                      <div key={idx} className="text-xs text-slate-300 flex items-center gap-2">
                        <TrendingUp className="w-3 h-3 text-green-400" />
                        {typeof job === 'string' ? job : job.title || 'Job Opening'}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent News */}
              {item.recent_news && Array.isArray(item.recent_news) && item.recent_news.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Newspaper className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs font-semibold text-slate-400">
                      Recent News ({item.recent_news.length})
                    </span>
                  </div>
                  <div className="space-y-1">
                    {item.recent_news.slice(0, 2).map((news: any, idx) => (
                      <div key={idx} className="text-xs text-slate-300">
                        {typeof news === 'string' ? news : news.title || 'News Item'}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(item.last_refreshed).toLocaleDateString()}
                  </div>
                  {item.data_sources && Array.isArray(item.data_sources) && (
                    <div className="flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {item.data_sources.length} sources
                    </div>
                  )}
                </div>
                <Badge variant="secondary" className="text-xs">
                  {item.research_depth}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="glass border-slate-700 p-12 text-center">
          <Brain className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Research Data Yet</h3>
          <p className="text-slate-400 mb-4">
            Research companies to see their intelligence data here
          </p>
        </Card>
      )}

      {/* Company Research Viewer Modal */}
      <CompanyResearchViewer
        research={selectedResearch}
        open={viewerOpen}
        onClose={handleCloseViewer}
      />
    </div>
  );
}
