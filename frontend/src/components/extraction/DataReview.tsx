"use client";

/**
 * Step 5: Data Review
 * Review extracted data with quality filtering and export options
 */

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Download,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Star,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { extractionAPI, ExtractionResult } from "@/lib/api";
import { toast } from "sonner";

interface DataReviewProps {
  jobId: number;
  onExportComplete: () => void;
}

export function DataReview({ jobId, onExportComplete }: DataReviewProps) {
  const [results, setResults] = useState<ExtractionResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<ExtractionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [minQuality, setMinQuality] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"quality" | "name" | "company">("quality");
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [exporting, setExporting] = useState(false);

  // Quality Distribution
  const [qualityStats, setQualityStats] = useState({
    high: 0, // >= 0.8
    medium: 0, // 0.6 - 0.8
    low: 0, // < 0.6
  });

  // Fetch results
  useEffect(() => {
    fetchResults();
  }, [jobId]);

  // Apply filters
  useEffect(() => {
    let filtered = [...results];

    // Quality filter
    filtered = filtered.filter((r) => r.quality_score >= minQuality / 100);

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.data.name?.toLowerCase().includes(query) ||
          r.data.email?.toLowerCase().includes(query) ||
          r.data.company?.toLowerCase().includes(query) ||
          r.data.title?.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "quality":
          return b.quality_score - a.quality_score;
        case "name":
          return (a.data.name || "").localeCompare(b.data.name || "");
        case "company":
          return (a.data.company || "").localeCompare(b.data.company || "");
        default:
          return 0;
      }
    });

    setFilteredResults(filtered);
  }, [results, minQuality, searchQuery, sortBy]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const { data } = await extractionAPI.getResults(jobId, {
        page: 1,
        limit: 200
      });

      const resultsList = data.items || [];
      setResults(resultsList);

      // Calculate quality stats (safely handle empty array)
      const high = resultsList.filter((r: any) => r.quality_score >= 0.8).length;
      const medium = resultsList.filter(
        (r: any) => r.quality_score >= 0.6 && r.quality_score < 0.8
      ).length;
      const low = resultsList.filter((r: any) => r.quality_score < 0.6).length;

      setQualityStats({ high, medium, low });
    } catch (error: any) {
      console.error("Failed to fetch results:", error);
      toast.error("Failed to load results", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (id: number) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const exportToExcel = async () => {
    try {
      setExporting(true);

      const { data } = await extractionAPI.exportResults(jobId, {
        format: "excel",
        include_metadata: true,
        filters: {
          min_quality: minQuality / 100,
        },
      });

      // Download file
      window.location.href = data.download_url;

      toast.success(`Exported ${data.total_records} records!`);

      // Advance to next step after brief delay
      setTimeout(() => {
        onExportComplete();
      }, 1500);
    } catch (error: any) {
      console.error("Export failed:", error);
      toast.error("Export failed", { description: error.message });
    } finally {
      setExporting(false);
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 0.8) return "text-green-400 bg-green-600/20";
    if (score >= 0.6) return "text-yellow-400 bg-yellow-600/20";
    return "text-red-400 bg-red-600/20";
  };

  const getQualityLabel = (score: number) => {
    if (score >= 0.8) return "High";
    if (score >= 0.6) return "Medium";
    return "Low";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Review & Export Data</h2>
          <p className="text-slate-400">
            {filteredResults.length} of {results.length} records shown
          </p>
        </div>

        <Button
          onClick={exportToExcel}
          size="lg"
          disabled={exporting || filteredResults.length === 0}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/50"
        >
          {exporting ? (
            <>Exporting...</>
          ) : (
            <>
              <FileSpreadsheet className="w-5 h-5 mr-2" />
              Export to Excel
            </>
          )}
        </Button>
      </div>

      {/* Quality Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30"
        >
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-6 h-6 text-green-400" />
            <div className="text-sm text-slate-300">High Quality (≥80%)</div>
          </div>
          <div className="text-3xl font-bold text-white">{qualityStats.high}</div>
          <div className="text-sm text-slate-400 mt-1">
            {results.length > 0 ? Math.round((qualityStats.high / results.length) * 100) : 0}% of total
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-xl bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border border-yellow-500/30"
        >
          <div className="flex items-center gap-3 mb-2">
            <Star className="w-6 h-6 text-yellow-400" />
            <div className="text-sm text-slate-300">Medium Quality (60-79%)</div>
          </div>
          <div className="text-3xl font-bold text-white">{qualityStats.medium}</div>
          <div className="text-sm text-slate-400 mt-1">
            {results.length > 0 ? Math.round((qualityStats.medium / results.length) * 100) : 0}% of total
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-xl bg-gradient-to-br from-red-600/20 to-pink-600/20 border border-red-500/30"
        >
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <div className="text-sm text-slate-300">{"Low Quality (<60%)"}</div>
          </div>
          <div className="text-3xl font-bold text-white">{qualityStats.low}</div>
          <div className="text-sm text-slate-400 mt-1">
            {results.length > 0 ? Math.round((qualityStats.low / results.length) * 100) : 0}% of total
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/30 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div>
            <Label className="text-slate-300 mb-2">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name, email, company, or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-900/50 border-slate-700"
              />
            </div>
          </div>

          {/* Quality Filter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-slate-300">Minimum Quality Score</Label>
              <span className="text-sm text-slate-400">{minQuality}%</span>
            </div>
            <Slider
              value={[minQuality]}
              onValueChange={(value) => setMinQuality(value[0])}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          {/* Sort */}
          <div>
            <Label className="text-slate-300 mb-2">Sort By</Label>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="bg-slate-900/50 border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quality">Quality Score</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="company">Company</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card className="bg-slate-800/30 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Extracted Records</CardTitle>
          <CardDescription>
            Click on any row to view details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700/50 hover:bg-transparent">
                  <TableHead className="text-slate-400">Name</TableHead>
                  <TableHead className="text-slate-400">Email</TableHead>
                  <TableHead className="text-slate-400">Company</TableHead>
                  <TableHead className="text-slate-400">Title</TableHead>
                  <TableHead className="text-slate-400 text-center">Quality</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResults.slice(0, 50).map((result, index) => {
                  const isExpanded = expandedRows.has(result.id);

                  return (
                    <React.Fragment key={result.id}>
                      <TableRow
                        onClick={() => toggleRow(result.id)}
                        className="border-slate-700/50 hover:bg-slate-700/30 cursor-pointer transition-colors"
                      >
                        <TableCell className="font-medium text-white">
                          {result.data.name || "-"}
                        </TableCell>
                        <TableCell className="text-slate-300 font-mono text-sm">
                          {result.data.email || "-"}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {result.data.company || "-"}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {result.data.title || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center">
                            <Badge
                              className={`${getQualityColor(result.quality_score)}`}
                            >
                              {getQualityLabel(result.quality_score)} (
                              {Math.round(result.quality_score * 100)}%)
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <button className="text-slate-400 hover:text-white transition-colors">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <TableRow className="border-slate-700/50">
                          <TableCell colSpan={6} className="bg-slate-900/50">
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="py-4 space-y-3"
                            >
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div>
                                  <div className="text-xs text-slate-500 mb-1">Phone</div>
                                  <div className="text-slate-300">
                                    {result.data.phone || "-"}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-slate-500 mb-1">Location</div>
                                  <div className="text-slate-300">
                                    {result.data.location || "-"}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-slate-500 mb-1">LinkedIn</div>
                                  {result.data.linkedin_url ? (
                                    <a
                                      href={result.data.linkedin_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-400 hover:underline text-sm"
                                    >
                                      View Profile
                                    </a>
                                  ) : (
                                    <div className="text-slate-300">-</div>
                                  )}
                                </div>
                              </div>

                              <div className="pt-3 border-t border-slate-700/50 grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <div className="text-xs text-slate-500 mb-1">
                                    Confidence Score
                                  </div>
                                  <div className="text-slate-300">
                                    {Math.round(result.confidence_score * 100)}%
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-slate-500 mb-1">
                                    Completeness
                                  </div>
                                  <div className="text-slate-300">
                                    {Math.round((result.completeness_score || 0) * 100)}%
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-slate-500 mb-1">
                                    Extraction Layer
                                  </div>
                                  <div className="text-slate-300">
                                    Layer {result.extraction_layer}
                                  </div>
                                </div>
                              </div>

                              <div className="pt-2">
                                <div className="text-xs text-slate-500 mb-1">Source URL</div>
                                <a
                                  href={result.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:underline text-sm break-all"
                                >
                                  {result.source_url}
                                </a>
                              </div>
                            </motion.div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredResults.length > 50 && (
            <div className="mt-4 text-center text-sm text-slate-400">
              Showing first 50 of {filteredResults.length} records. Export to view all.
            </div>
          )}

          {filteredResults.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-400">
                No records match your filters. Try adjusting the quality threshold or search query.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Next Step Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-xl bg-blue-600/10 border border-blue-500/30"
      >
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-white font-semibold mb-1">Ready to integrate?</h4>
            <p className="text-sm text-slate-400">
              Export your data or continue to import directly into Recipients
            </p>
          </div>
          <ArrowRight className="w-6 h-6 text-blue-400" />
        </div>
      </motion.div>
    </div>
  );
}
