"use client";

/**
 * Step 2: Source Configuration
 * Configure data sources (URLs, Files, Directories) + API Keys + Options
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link2,
  FileText,
  Database,
  Plus,
  X,
  Upload,
  Key,
  Settings,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface SourceConfigurationProps {
  sources: {
    urls?: string[];
    files?: string[];
    directories?: any[];
  };
  onUpdateSources: (sources: any) => void;
  options: {
    depth: number;
    follow_external: boolean;
    use_playwright: boolean;
    rate_limit: number;
    max_records: number;
  };
  onUpdateOptions: (options: any) => void;
}

export function SourceConfiguration({
  sources,
  onUpdateSources,
  options,
  onUpdateOptions,
}: SourceConfigurationProps) {
  const [activeTab, setActiveTab] = useState("urls");
  const [newUrl, setNewUrl] = useState("");
  const [urlError, setUrlError] = useState("");

  // API Keys State
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [apiKeys, setApiKeys] = useState({
    google_api_key: "",
    google_search_engine_id: "",
    anthropic_api_key: "",
    shodan_api_key: "",
    hunter_api_key: "",
    apollo_api_key: "",
  });
  const [showKeys, setShowKeys] = useState<{[key: string]: boolean}>({});

  // URL Management
  const addUrl = () => {
    const trimmedUrl = newUrl.trim();

    // Validation
    try {
      new URL(trimmedUrl);
      setUrlError("");

      onUpdateSources({
        ...sources,
        urls: [...(sources.urls || []), trimmedUrl],
      });

      setNewUrl("");
    } catch (error) {
      setUrlError("Please enter a valid URL (e.g., https://example.com)");
    }
  };

  const removeUrl = (index: number) => {
    const newUrls = [...(sources.urls || [])];
    newUrls.splice(index, 1);
    onUpdateSources({ ...sources, urls: newUrls });
  };

  // File Upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileNames = Array.from(files).map((f) => f.name);
      onUpdateSources({
        ...sources,
        files: [...(sources.files || []), ...fileNames],
      });
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...(sources.files || [])];
    newFiles.splice(index, 1);
    onUpdateSources({ ...sources, files: newFiles });
  };

  // Calculate total sources
  const totalSources =
    (sources.urls?.length || 0) +
    (sources.files?.length || 0) +
    (sources.directories?.length || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Configure Data Sources
        </h2>
        <p className="text-slate-400">
          Add URLs to scrape, upload CSV files, or search public directories
        </p>
      </div>

      {/* Source Count Banner */}
      {totalSources > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <CheckCircle2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-white font-semibold">
                {totalSources} source{totalSources !== 1 ? "s" : ""} configured
              </div>
              <div className="text-sm text-slate-400">
                {sources.urls?.length || 0} URLs • {sources.files?.length || 0} Files
              </div>
            </div>
          </div>
          <div className="text-sm text-slate-400">
            Est. time: {Math.ceil(totalSources * options.depth * 0.5)}min
          </div>
        </motion.div>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
          <TabsTrigger value="urls" className="flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            URLs
          </TabsTrigger>
          <TabsTrigger value="files" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Files
          </TabsTrigger>
          <TabsTrigger value="directories" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Directories
          </TabsTrigger>
        </TabsList>

        {/* URLs Tab */}
        <TabsContent value="urls" className="space-y-4 mt-6">
          <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700/50">
            <h3 className="text-white font-semibold mb-4">Add URLs</h3>

            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="https://example.com/team"
                  value={newUrl}
                  onChange={(e) => {
                    setNewUrl(e.target.value);
                    setUrlError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && addUrl()}
                  className={`
                    bg-slate-900/50 border-slate-700
                    ${urlError ? "border-red-500" : ""}
                  `}
                />
                {urlError && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {urlError}
                  </p>
                )}
              </div>
              <Button
                onClick={addUrl}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add URL
              </Button>
            </div>

            {/* URL List */}
            {sources.urls && sources.urls.length > 0 && (
              <div className="mt-4 space-y-2">
                <Label className="text-sm text-slate-400">
                  URLs to extract ({sources.urls.length})
                </Label>
                <AnimatePresence>
                  {sources.urls.map((url, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center gap-2 p-3 rounded-lg bg-slate-900/50 border border-slate-700/50 group"
                    >
                      <Link2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="text-sm text-slate-300 flex-1 truncate">
                        {url}
                      </span>
                      <button
                        onClick={() => removeUrl(index)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded"
                      >
                        <X className="w-4 h-4 text-red-400" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files" className="space-y-4 mt-6">
          <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700/50">
            <h3 className="text-white font-semibold mb-4">Upload CSV Files</h3>

            <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center hover:border-blue-500 transition-colors">
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-300 mb-2">
                Drag and drop CSV files here, or click to browse
              </p>
              <p className="text-sm text-slate-500 mb-4">
                Supports CSV format with email/contact columns
              </p>
              <Input
                type="file"
                accept=".csv"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <Label htmlFor="file-upload">
                <span className="inline-flex items-center justify-center cursor-pointer whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                  <FileText className="w-4 h-4 mr-2" />
                  Select Files
                </span>
              </Label>
            </div>

            {/* File List */}
            {sources.files && sources.files.length > 0 && (
              <div className="mt-4 space-y-2">
                <Label className="text-sm text-slate-400">
                  Uploaded files ({sources.files.length})
                </Label>
                <AnimatePresence>
                  {sources.files.map((file, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center gap-2 p-3 rounded-lg bg-slate-900/50 border border-slate-700/50 group"
                    >
                      <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="text-sm text-slate-300 flex-1">{file}</span>
                      <button
                        onClick={() => removeFile(index)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded"
                      >
                        <X className="w-4 h-4 text-red-400" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Directories Tab */}
        <TabsContent value="directories" className="space-y-4 mt-6">
          <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700/50">
            <h3 className="text-white font-semibold mb-4">Search Directories</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-slate-300 mb-2">Job Titles</Label>
                <Input
                  placeholder="HR Manager, Recruiter, Talent Acquisition"
                  className="bg-slate-900/50 border-slate-700"
                />
              </div>
              <div>
                <Label className="text-sm text-slate-300 mb-2">Locations</Label>
                <Input
                  placeholder="Luxembourg, Paris, Brussels"
                  className="bg-slate-900/50 border-slate-700"
                />
              </div>
              <div>
                <Label className="text-sm text-slate-300 mb-2">Industries</Label>
                <Input
                  placeholder="Technology, Finance, Healthcare"
                  className="bg-slate-900/50 border-slate-700"
                />
              </div>

              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                <Database className="w-4 h-4 mr-2" />
                Search Apollo.io / Hunter.io
              </Button>
            </div>

            <div className="mt-4 p-4 rounded-lg bg-blue-600/10 border border-blue-500/30">
              <p className="text-sm text-slate-400">
                <Key className="w-4 h-4 inline mr-1" />
                API keys required for directory search. Configure below.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Advanced Options Accordion */}
      <Accordion type="single" collapsible className="w-full">
        {/* Extraction Options */}
        <AccordionItem
          value="options"
          className="border border-slate-700/50 rounded-xl bg-slate-800/30 px-6"
        >
          <AccordionTrigger className="text-white hover:no-underline">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              <span>Extraction Options</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pt-4">
            {/* Crawl Depth */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-slate-300">Crawl Depth (Layers)</Label>
                <span className="text-sm text-slate-400">
                  {options.depth} layer{options.depth !== 1 ? "s" : ""}
                </span>
              </div>
              <Slider
                value={[options.depth]}
                onValueChange={(value) =>
                  onUpdateOptions({ ...options, depth: value[0] })
                }
                min={1}
                max={9}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-slate-500">
                More layers = deeper extraction but slower speed
              </p>
            </div>

            {/* Max Records */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-slate-300">Max Records</Label>
                <span className="text-sm text-slate-400">
                  {options.max_records.toLocaleString()}
                </span>
              </div>
              <Slider
                value={[options.max_records]}
                onValueChange={(value) =>
                  onUpdateOptions({ ...options, max_records: value[0] })
                }
                min={100}
                max={10000}
                step={100}
                className="w-full"
              />
            </div>

            {/* Rate Limit */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-slate-300">Rate Limit (req/sec)</Label>
                <span className="text-sm text-slate-400">{options.rate_limit}</span>
              </div>
              <Slider
                value={[options.rate_limit]}
                onValueChange={(value) =>
                  onUpdateOptions({ ...options, rate_limit: value[0] })
                }
                min={1}
                max={50}
                step={1}
                className="w-full"
              />
            </div>

            {/* Switches */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
                <div>
                  <Label className="text-slate-300">Use JavaScript Rendering</Label>
                  <p className="text-xs text-slate-500">
                    Enable for React/Vue/Angular sites (slower)
                  </p>
                </div>
                <Switch
                  checked={options.use_playwright}
                  onCheckedChange={(checked) =>
                    onUpdateOptions({ ...options, use_playwright: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
                <div>
                  <Label className="text-slate-300">Follow External Links</Label>
                  <p className="text-xs text-slate-500">
                    Crawl links to other domains
                  </p>
                </div>
                <Switch
                  checked={options.follow_external}
                  onCheckedChange={(checked) =>
                    onUpdateOptions({ ...options, follow_external: checked })
                  }
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* API Keys */}
        <AccordionItem
          value="api-keys"
          className="border border-slate-700/50 rounded-xl bg-slate-800/30 px-6 mt-4"
        >
          <AccordionTrigger className="text-white hover:no-underline">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              <span>API Keys (Optional)</span>
              <span className="text-xs text-slate-500 ml-2">
                Enable advanced features
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            {Object.entries(apiKeys).map(([key, value]) => {
              const isVisible = showKeys[key] || false;
              const keyLabel = key
                .replace(/_/g, " ")
                .replace(/api key/i, "API Key")
                .replace(/id/i, "ID")
                .split(" ")
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ");

              return (
                <div key={key} className="space-y-2">
                  <Label className="text-slate-300">{keyLabel}</Label>
                  <div className="relative">
                    <Input
                      type={isVisible ? "text" : "password"}
                      value={value}
                      onChange={(e) =>
                        setApiKeys({ ...apiKeys, [key]: e.target.value })
                      }
                      placeholder={`Enter ${keyLabel}`}
                      className="bg-slate-900/50 border-slate-700 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowKeys({ ...showKeys, [key]: !isVisible })
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                    >
                      {isVisible ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}

            <div className="mt-4 p-4 rounded-lg bg-blue-600/10 border border-blue-500/30">
              <p className="text-sm text-slate-400">
                API keys are encrypted and stored securely. They enable features
                like directory search, email enrichment, and LLM extraction.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Warning if no sources */}
      {totalSources === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 rounded-xl bg-yellow-600/10 border border-yellow-500/30"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-400 font-semibold">No sources configured</p>
              <p className="text-sm text-slate-400 mt-1">
                Please add at least one URL, file, or directory search to continue.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
