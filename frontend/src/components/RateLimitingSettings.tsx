"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  Gauge,
  Rocket,
  Mail,
  Building2,
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Calendar,
  Activity,
  TrendingUp,
  Loader2,
  Zap,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { rateLimitingAPI } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

interface RateLimitPreset {
  id: string;
  name: string;
  daily_limit: number | null;
  hourly_limit: number | null;
  description: string;
  recommended_for: string;
}

interface RateLimitConfig {
  id: number;
  preset: string;
  daily_limit: number;
  hourly_limit: number;
  weekly_limit: number | null;
  monthly_limit: number | null;
  emails_sent_today: number;
  emails_sent_this_hour: number;
  enabled: boolean;
}

interface UsageStats {
  enabled: boolean;
  preset: string;
  limits: {
    daily: number;
    hourly: number;
    weekly: number | null;
    monthly: number | null;
  };
  usage: {
    today: number;
    this_hour: number;
    this_week: number;
    this_month: number;
  };
  remaining: {
    daily: number;
    hourly: number;
    weekly: number | null;
    monthly: number | null;
  };
  percentage_used: {
    daily: number;
    hourly: number;
  };
  next_reset: {
    hourly: string | null;
    daily: string | null;
  };
}

export function RateLimitingSettings() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [presets, setPresets] = useState<RateLimitPreset[]>([]);
  const [config, setConfig] = useState<RateLimitConfig | null>(null);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>("moderate");
  const [customMode, setCustomMode] = useState(false);
  const [customLimits, setCustomLimits] = useState({
    daily: 100,
    hourly: 25,
    weekly: 0,
    monthly: 0,
  });
  const [actionLoading, setActionLoading] = useState(false);

  // Track mounted state to prevent state updates after unmount
  const mountedRef = useRef(true);

  const loadData = useCallback(async () => {
    if (!mountedRef.current) return;

    setLoading(true);
    setError(null);
    try {
      const { data: presetsData } = await rateLimitingAPI.getPresets();
      setPresets(presetsData.presets || []);

      try {
        const { data: configData } = await rateLimitingAPI.getConfig();
        setConfig(configData);
        setSelectedPreset(configData.preset);
        if (configData.preset === "custom") {
          setCustomMode(true);
          setCustomLimits({
            daily: configData.daily_limit,
            hourly: configData.hourly_limit,
            weekly: configData.weekly_limit || 0,
            monthly: configData.monthly_limit || 0,
          });
        }
      } catch (error: any) {
        // 404 is expected when no config exists yet
        if (error.response?.status !== 404) {
          throw error;
        }
      }

      try {
        const { data: statsData } = await rateLimitingAPI.getUsageStats();
        if (mountedRef.current) {
          setStats(statsData.stats);
        }
      } catch {
        // Stats may not exist yet
      }
    } catch {
      if (mountedRef.current) {
        setError("Failed to load rate limit data. Please try again.");
        toast.error("Failed to load rate limit data");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadData();
    const interval = setInterval(loadData, 30000);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [loadData]);

  const handleCreateConfig = async () => {
    setActionLoading(true);
    try {
      await rateLimitingAPI.createConfig({
        preset: selectedPreset,
        daily_limit: customMode ? customLimits.daily : undefined,
        hourly_limit: customMode ? customLimits.hourly : undefined,
      });
      toast.success("Rate limit configuration created!");
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to create config");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateConfig = async () => {
    setActionLoading(true);
    try {
      await rateLimitingAPI.updateConfig({
        preset: customMode ? "custom" : selectedPreset,
        daily_limit: customMode ? customLimits.daily : undefined,
        hourly_limit: customMode ? customLimits.hourly : undefined,
        weekly_limit: customMode && customLimits.weekly > 0 ? customLimits.weekly : undefined,
        monthly_limit: customMode && customLimits.monthly > 0 ? customLimits.monthly : undefined,
      });
      toast.success("Rate limits updated!");
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to update");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggle = async (enabled: boolean) => {
    setActionLoading(true);
    try {
      if (enabled) {
        await rateLimitingAPI.enable();
        toast.success("Rate limiting enabled");
      } else {
        await rateLimitingAPI.disable();
        toast.success("Rate limiting disabled");
      }
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to toggle");
    } finally {
      setActionLoading(false);
    }
  };

  const getPresetIcon = (presetId: string) => {
    switch (presetId) {
      case "conservative":
        return <Shield className="w-5 h-5" />;
      case "moderate":
        return <Gauge className="w-5 h-5" />;
      case "aggressive":
        return <Rocket className="w-5 h-5" />;
      case "gmail_free":
        return <Mail className="w-5 h-5" />;
      case "gmail_workspace":
        return <Building2 className="w-5 h-5" />;
      case "outlook":
        return <Mail className="w-5 h-5" />;
      case "custom":
        return <Settings className="w-5 h-5" />;
      default:
        return <Zap className="w-5 h-5" />;
    }
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-400";
    if (percentage >= 80) return "text-yellow-400";
    if (percentage >= 50) return "text-blue-400";
    return "text-green-400";
  };

  const getUsageBgGradient = (percentage: number) => {
    if (percentage >= 90) return "from-red-500 to-orange-500";
    if (percentage >= 80) return "from-yellow-500 to-orange-500";
    if (percentage >= 50) return "from-blue-500 to-cyan-500";
    return "from-green-500 to-emerald-500";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-green-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-400" />
        <p className="text-red-400 text-center">{error}</p>
        <Button
          onClick={loadData}
          variant="outline"
          className="border-red-500 text-red-400 hover:bg-red-500/10"
        >
          <XCircle className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
            Rate Limiting
          </h2>
          <p className="text-slate-400 mt-1">
            Control email sending volume to avoid provider limits
          </p>
        </div>
        {config && (
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-slate-600 text-slate-300">
              {config.preset}
            </Badge>
            <Switch
              checked={config.enabled}
              onCheckedChange={handleToggle}
              disabled={actionLoading}
            />
          </div>
        )}
      </div>

      {/* Real-time Usage Stats */}
      {stats && stats.enabled && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          {/* Hourly Usage */}
          <Card className="glass border-green-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-5 h-5 text-green-400" />
                <Badge
                  variant="outline"
                  className={`border-green-500 ${getUsageColor(stats.percentage_used.hourly)}`}
                >
                  {stats.percentage_used.hourly}%
                </Badge>
              </div>
              <div className="text-2xl font-bold text-white">
                {stats.remaining.hourly}
              </div>
              <p className="text-sm text-slate-400">
                Remaining This Hour ({stats.usage.this_hour}/{stats.limits.hourly})
              </p>
              <div className="w-full bg-slate-700 rounded-full h-2 mt-3">
                <div
                  className={`bg-gradient-to-r ${getUsageBgGradient(
                    stats.percentage_used.hourly
                  )} h-2 rounded-full transition-all`}
                  style={{ width: `${stats.percentage_used.hourly}%` }}
                />
              </div>
              {stats.next_reset.hourly && (
                <p className="text-xs text-slate-500 mt-2">
                  Resets: {new Date(stats.next_reset.hourly).toLocaleTimeString()}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Daily Usage */}
          <Card className="glass border-blue-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                <Badge
                  variant="outline"
                  className={`border-blue-500 ${getUsageColor(stats.percentage_used.daily)}`}
                >
                  {stats.percentage_used.daily}%
                </Badge>
              </div>
              <div className="text-2xl font-bold text-white">
                {stats.remaining.daily}
              </div>
              <p className="text-sm text-slate-400">
                Remaining Today ({stats.usage.today}/{stats.limits.daily})
              </p>
              <div className="w-full bg-slate-700 rounded-full h-2 mt-3">
                <div
                  className={`bg-gradient-to-r ${getUsageBgGradient(
                    stats.percentage_used.daily
                  )} h-2 rounded-full transition-all`}
                  style={{ width: `${stats.percentage_used.daily}%` }}
                />
              </div>
              {stats.next_reset.daily && (
                <p className="text-xs text-slate-500 mt-2">
                  Resets: {new Date(stats.next_reset.daily).toLocaleDateString()}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Weekly Usage */}
          <Card className="glass border-purple-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-5 h-5 text-purple-400" />
                <Badge variant="outline" className="border-purple-500 text-purple-400">
                  This Week
                </Badge>
              </div>
              <div className="text-2xl font-bold text-white">
                {stats.usage.this_week}
              </div>
              <p className="text-sm text-slate-400">
                Emails Sent This Week
                {stats.limits.weekly && ` / ${stats.limits.weekly}`}
              </p>
              {stats.limits.weekly ? (
                <div className="w-full bg-slate-700 rounded-full h-2 mt-3">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${((stats.usage.this_week / stats.limits.weekly) * 100) || 0}%`,
                    }}
                  />
                </div>
              ) : (
                <p className="text-xs text-slate-500 mt-3">No weekly limit set</p>
              )}
            </CardContent>
          </Card>

          {/* Monthly Usage */}
          <Card className="glass border-orange-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-5 h-5 text-orange-400" />
                <Badge variant="outline" className="border-orange-500 text-orange-400">
                  This Month
                </Badge>
              </div>
              <div className="text-2xl font-bold text-white">
                {stats.usage.this_month}
              </div>
              <p className="text-sm text-slate-400">
                Emails Sent This Month
                {stats.limits.monthly && ` / ${stats.limits.monthly}`}
              </p>
              {stats.limits.monthly ? (
                <div className="w-full bg-slate-700 rounded-full h-2 mt-3">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${((stats.usage.this_month / stats.limits.monthly) * 100) || 0}%`,
                    }}
                  />
                </div>
              ) : (
                <p className="text-xs text-slate-500 mt-3">No monthly limit set</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Configuration Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Preset Selection */}
        <Card className="glass border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-green-400" />
                <h3 className="text-xl font-bold text-white">Limit Presets</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCustomMode(!customMode)}
                className={`${
                  customMode
                    ? "border-blue-500 text-blue-400"
                    : "border-slate-600 text-slate-400"
                }`}
              >
                <Settings className="w-4 h-4 mr-2" />
                Custom
              </Button>
            </div>
            <p className="text-sm text-slate-400">Choose your rate limits</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {!customMode ? (
              <>
                {/* Preset Cards */}
                <div className="space-y-2">
                  {presets.filter((p) => p.id !== "custom").map((preset) => (
                    <motion.div
                      key={preset.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSelectedPreset(preset.id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedPreset === preset.id
                          ? "border-green-500 bg-green-500/10"
                          : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getPresetIcon(preset.id)}
                          <div>
                            <h4 className="font-bold text-white">{preset.name}</h4>
                            <p className="text-xs text-slate-400">{preset.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {preset.daily_limit && (
                            <p className="text-lg font-bold text-white">
                              {preset.daily_limit}
                              <span className="text-xs text-slate-400">/day</span>
                            </p>
                          )}
                          {preset.hourly_limit && (
                            <p className="text-xs text-slate-400">
                              {preset.hourly_limit}/hour
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        {preset.recommended_for}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </>
            ) : (
              <>
                {/* Custom Limits Input */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="glass p-4 rounded-lg border border-blue-500/30">
                    <div className="flex items-center gap-2 mb-3">
                      <Settings className="w-4 h-4 text-blue-400" />
                      <h4 className="font-bold text-white">Custom Limits</h4>
                    </div>

                    <div className="space-y-3">
                      {/* Hourly Limit */}
                      <div>
                        <Label className="text-white text-sm">
                          Hourly Limit <span className="text-red-400">*</span>
                        </Label>
                        <Input
                          type="number"
                          value={customLimits.hourly}
                          onChange={(e) =>
                            setCustomLimits({
                              ...customLimits,
                              hourly: parseInt(e.target.value) || 0,
                            })
                          }
                          className="bg-slate-800 border-slate-700 text-white mt-1"
                          placeholder="e.g., 25"
                        />
                        <p className="text-xs text-slate-400 mt-1">
                          Maximum emails per hour
                        </p>
                      </div>

                      {/* Daily Limit */}
                      <div>
                        <Label className="text-white text-sm">
                          Daily Limit <span className="text-red-400">*</span>
                        </Label>
                        <Input
                          type="number"
                          value={customLimits.daily}
                          onChange={(e) =>
                            setCustomLimits({
                              ...customLimits,
                              daily: parseInt(e.target.value) || 0,
                            })
                          }
                          className="bg-slate-800 border-slate-700 text-white mt-1"
                          placeholder="e.g., 100"
                        />
                        <p className="text-xs text-slate-400 mt-1">
                          Maximum emails per day
                        </p>
                      </div>

                      {/* Weekly Limit (Optional) */}
                      <div>
                        <Label className="text-white text-sm">
                          Weekly Limit <span className="text-slate-500">(optional)</span>
                        </Label>
                        <Input
                          type="number"
                          value={customLimits.weekly}
                          onChange={(e) =>
                            setCustomLimits({
                              ...customLimits,
                              weekly: parseInt(e.target.value) || 0,
                            })
                          }
                          className="bg-slate-800 border-slate-700 text-white mt-1"
                          placeholder="e.g., 700"
                        />
                        <p className="text-xs text-slate-400 mt-1">
                          Leave 0 for no weekly limit
                        </p>
                      </div>

                      {/* Monthly Limit (Optional) */}
                      <div>
                        <Label className="text-white text-sm">
                          Monthly Limit <span className="text-slate-500">(optional)</span>
                        </Label>
                        <Input
                          type="number"
                          value={customLimits.monthly}
                          onChange={(e) =>
                            setCustomLimits({
                              ...customLimits,
                              monthly: parseInt(e.target.value) || 0,
                            })
                          }
                          className="bg-slate-800 border-slate-700 text-white mt-1"
                          placeholder="e.g., 3000"
                        />
                        <p className="text-xs text-slate-400 mt-1">
                          Leave 0 for no monthly limit
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-blue-500/10 rounded border border-blue-500/30">
                      <p className="text-xs text-blue-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Make sure limits are within your email provider's restrictions
                      </p>
                    </div>
                  </div>
                </motion.div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-4">
              {!config ? (
                <Button
                  onClick={handleCreateConfig}
                  disabled={actionLoading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Create Configuration
                </Button>
              ) : (
                <Button
                  onClick={handleUpdateConfig}
                  disabled={actionLoading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Update Limits
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tips & Info */}
        <Card className="glass border-slate-700">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <h3 className="text-xl font-bold text-white">Best Practices</h3>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {/* Provider Limits */}
              <div className="glass p-4 rounded-lg border border-yellow-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-yellow-400" />
                  <h4 className="font-bold text-white text-sm">Email Provider Limits</h4>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Gmail (Free):</span>
                    <span className="text-white font-medium">500/day, 100/hour</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Gmail Workspace:</span>
                    <span className="text-white font-medium">2000/day, 500/hour</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Outlook:</span>
                    <span className="text-white font-medium">300/day, 100/hour</span>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="space-y-2">
                <div className="flex items-start gap-2 p-3 bg-green-500/10 rounded border border-green-500/30">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-white font-medium">Start Conservative</p>
                    <p className="text-xs text-slate-400">
                      Begin with lower limits and increase gradually as you warm up
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 bg-blue-500/10 rounded border border-blue-500/30">
                  <Activity className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-white font-medium">Monitor Usage</p>
                    <p className="text-xs text-slate-400">
                      Keep an eye on hourly usage to avoid hitting limits
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 bg-purple-500/10 rounded border border-purple-500/30">
                  <Shield className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-white font-medium">Combine with Warming</p>
                    <p className="text-xs text-slate-400">
                      Use rate limits alongside email warming for best results
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 bg-orange-500/10 rounded border border-orange-500/30">
                  <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-white font-medium">Avoid Hard Limits</p>
                    <p className="text-xs text-slate-400">
                      Stay 10-20% below provider limits for safety margin
                    </p>
                  </div>
                </div>
              </div>

              {/* Current Status */}
              {stats && (
                <div className="glass p-4 rounded-lg border border-slate-700">
                  <h4 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-green-400" />
                    Current Status
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Status:</span>
                      <Badge
                        variant="outline"
                        className={
                          stats.enabled
                            ? "border-green-500 text-green-400"
                            : "border-slate-500 text-slate-400"
                        }
                      >
                        {stats.enabled ? "Active" : "Disabled"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Preset:</span>
                      <span className="text-white font-medium">{stats.preset}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Hourly Usage:</span>
                      <span
                        className={`font-medium ${getUsageColor(
                          stats.percentage_used.hourly
                        )}`}
                      >
                        {stats.percentage_used.hourly}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Daily Usage:</span>
                      <span
                        className={`font-medium ${getUsageColor(
                          stats.percentage_used.daily
                        )}`}
                      >
                        {stats.percentage_used.daily}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
