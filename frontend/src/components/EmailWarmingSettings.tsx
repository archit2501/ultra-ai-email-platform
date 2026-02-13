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
  TrendingUp,
  Zap,
  Shield,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Target,
  Activity,
  BarChart3,
  Settings,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { emailWarmingAPI } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

interface WarmingPreset {
  id: string;
  name: string;
  description: string;
  duration_days: number;
  final_limit: number;
  recommended_for: string;
  schedule: Record<number, number>;
}

interface WarmingConfig {
  id: number;
  strategy: string;
  status: string;
  current_day: number;
  emails_sent_today: number;
  total_emails_sent: number;
  success_rate: number;
  bounce_rate: number;
  auto_progress: boolean;
}

interface WarmingProgress {
  enabled: boolean;
  status: string;
  strategy: string;
  current_day: number;
  max_day: number;
  progress_percentage: number;
  daily_limit: number;
  emails_sent_today: number;
  remaining_today: number;
  total_emails_sent: number;
  success_rate: number;
  bounce_rate: number;
  start_date: string | null;
  completion_date: string | null;
}

interface DailyLog {
  day_number: number;
  date: string;
  daily_limit: number;
  emails_sent: number;
  emails_delivered: number;
  emails_bounced: number;
  emails_failed: number;
  delivery_rate: number;
  bounce_rate: number;
  limit_reached: boolean;
  notes: string | null;
}

export function EmailWarmingSettings() {
  const [loading, setLoading] = useState(true);
  const [presets, setPresets] = useState<WarmingPreset[]>([]);
  const [config, setConfig] = useState<WarmingConfig | null>(null);
  const [progress, setProgress] = useState<WarmingProgress | null>(null);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>("moderate");
  const [autoProgress, setAutoProgress] = useState(true);
  const [showCustomSchedule, setShowCustomSchedule] = useState(false);
  const [customSchedule, setCustomSchedule] = useState<Record<number, number>>({});
  const [actionLoading, setActionLoading] = useState(false);

  // Track mounted state to prevent state updates after unmount
  const mountedRef = useRef(true);

  const loadData = useCallback(async () => {
    if (!mountedRef.current) return;

    setLoading(true);
    try {
      const { data: presetsData } = await emailWarmingAPI.getPresets();
      setPresets(presetsData.presets || []);

      try {
        const { data: configData } = await emailWarmingAPI.getConfig();
        setConfig(configData);
        setSelectedPreset(configData.strategy);
        setAutoProgress(configData.auto_progress);
      } catch (error: any) {
        // 404 is expected when no config exists yet
        if (error.response?.status !== 404) {
          throw error;
        }
      }

      try {
        const { data: progressData } = await emailWarmingAPI.getProgress();
        setProgress(progressData.progress);
      } catch {
        // Progress may not exist yet
      }

      try {
        const { data: logsData } = await emailWarmingAPI.getDailyLogs();
        setDailyLogs(logsData.logs || []);
      } catch {
        // Logs may not exist yet
      }
    } catch {
      if (mountedRef.current) {
        toast.error("Failed to load warming data");
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

    return () => {
      mountedRef.current = false;
    };
  }, [loadData]);

  const handleCreateConfig = async () => {
    setActionLoading(true);
    try {
      await emailWarmingAPI.createConfig({
        strategy: selectedPreset,
        custom_schedule: showCustomSchedule ? customSchedule : undefined,
        auto_progress: autoProgress,
      });
      toast.success("Warming configuration created!");
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to create config");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStrategy = async () => {
    setActionLoading(true);
    try {
      await emailWarmingAPI.updateConfig({
        strategy: selectedPreset,
        custom_schedule: showCustomSchedule ? customSchedule : undefined,
        auto_progress: autoProgress,
      });
      toast.success("Strategy updated!");
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to update");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStart = async () => {
    setActionLoading(true);
    try {
      const { data } = await emailWarmingAPI.start();
      toast.success(`Warming started! Day 1 limit: ${data.daily_limit} emails`);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to start");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePause = async () => {
    setActionLoading(true);
    try {
      await emailWarmingAPI.pause();
      toast.success("Warming paused");
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to pause");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    setActionLoading(true);
    try {
      await emailWarmingAPI.resume();
      toast.success("Warming resumed");
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to resume");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "paused":
        return "bg-yellow-500";
      case "completed":
        return "bg-blue-500";
      case "failed":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Activity className="w-4 h-4" />;
      case "paused":
        return <Pause className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "failed":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getPresetIcon = (presetId: string) => {
    switch (presetId) {
      case "conservative":
        return <Shield className="w-5 h-5" />;
      case "moderate":
        return <TrendingUp className="w-5 h-5" />;
      case "aggressive":
        return <Zap className="w-5 h-5" />;
      case "custom":
        return <Settings className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  const selectedPresetData = presets.find((p) => p.id === selectedPreset);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Email Warming
          </h2>
          <p className="text-slate-400 mt-1">
            Gradually increase sending volume to build sender reputation
          </p>
        </div>
        {progress && progress.status === "active" && (
          <Badge className={`${getStatusColor(progress.status)} text-white`}>
            {getStatusIcon(progress.status)}
            <span className="ml-2">Day {progress.current_day}</span>
          </Badge>
        )}
      </div>

      {/* Progress Overview */}
      {progress && progress.enabled && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          {/* Current Status */}
          <Card className="glass border-blue-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-5 h-5 text-blue-400" />
                <Badge className={getStatusColor(progress.status)}>
                  {progress.status}
                </Badge>
              </div>
              <div className="text-2xl font-bold text-white">
                {progress.current_day}/{progress.max_day}
              </div>
              <p className="text-sm text-slate-400">Days Progress</p>
              <div className="w-full bg-slate-700 rounded-full h-2 mt-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                  style={{ width: `${progress.progress_percentage}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Today's Limit */}
          <Card className="glass border-purple-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-5 h-5 text-purple-400" />
                <Badge variant="outline" className="border-purple-500 text-purple-400">
                  {progress.emails_sent_today}/{progress.daily_limit}
                </Badge>
              </div>
              <div className="text-2xl font-bold text-white">
                {progress.remaining_today}
              </div>
              <p className="text-sm text-slate-400">Emails Remaining Today</p>
              <div className="w-full bg-slate-700 rounded-full h-2 mt-3">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${((progress.emails_sent_today / progress.daily_limit) * 100) || 0}%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Total Sent */}
          <Card className="glass border-green-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <BarChart3 className="w-5 h-5 text-green-400" />
                <Badge variant="outline" className="border-green-500 text-green-400">
                  {progress.success_rate.toFixed(1)}%
                </Badge>
              </div>
              <div className="text-2xl font-bold text-white">
                {progress.total_emails_sent}
              </div>
              <p className="text-sm text-slate-400">Total Emails Sent</p>
              <p className="text-xs text-green-400 mt-2">
                ✓ {progress.success_rate.toFixed(1)}% success rate
              </p>
            </CardContent>
          </Card>

          {/* Bounce Rate */}
          <Card className="glass border-yellow-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                <Badge
                  variant="outline"
                  className={`${
                    progress.bounce_rate > 5
                      ? "border-red-500 text-red-400"
                      : "border-yellow-500 text-yellow-400"
                  }`}
                >
                  {progress.bounce_rate > 5 ? "⚠️ High" : "✓ Good"}
                </Badge>
              </div>
              <div className="text-2xl font-bold text-white">
                {progress.bounce_rate.toFixed(1)}%
              </div>
              <p className="text-sm text-slate-400">Bounce Rate</p>
              <p className="text-xs text-slate-500 mt-2">
                Target: &lt;5% for best reputation
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Configuration Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strategy Selection */}
        <Card className="glass border-slate-700">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <h3 className="text-xl font-bold text-white">Warming Strategy</h3>
            </div>
            <p className="text-sm text-slate-400">Choose your warming schedule</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Preset Cards */}
            <div className="grid grid-cols-2 gap-3">
              {presets.filter((p) => p.id !== "custom").map((preset) => (
                <motion.div
                  key={preset.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedPreset(preset.id);
                    setShowCustomSchedule(false);
                  }}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedPreset === preset.id
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {getPresetIcon(preset.id)}
                    <h4 className="font-bold text-white text-sm">{preset.name.split(" ")[0]}</h4>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400">{preset.duration_days} days</p>
                    <p className="text-lg font-bold text-white">
                      {preset.final_limit} <span className="text-xs text-slate-400">emails/day</span>
                    </p>
                    <p className="text-xs text-slate-500">{preset.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Selected Preset Details */}
            {selectedPresetData && selectedPresetData.id !== "custom" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass p-4 rounded-lg border border-blue-500/30"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <h4 className="font-bold text-white">Schedule Preview</h4>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-3">
                  {Object.entries(selectedPresetData.schedule).slice(0, 14).map(([day, limit]) => (
                    <div
                      key={day}
                      className="text-center p-2 bg-slate-800/50 rounded"
                    >
                      <p className="text-xs text-slate-500">D{day}</p>
                      <p className="text-sm font-bold text-white">{limit}</p>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-slate-400">
                  <p className="mb-1">
                    <span className="text-blue-400">✓</span> Recommended for:{" "}
                    {selectedPresetData.recommended_for}
                  </p>
                  <p>
                    <span className="text-purple-400">✓</span> Duration:{" "}
                    {selectedPresetData.duration_days} days
                  </p>
                </div>
              </motion.div>
            )}

            {/* Auto Progress Toggle */}
            <div className="flex items-center justify-between p-4 glass rounded-lg border border-slate-700">
              <div>
                <Label htmlFor="auto-progress" className="text-white font-medium">
                  Auto Progress
                </Label>
                <p className="text-xs text-slate-400">
                  Automatically advance to next day after 24 hours
                </p>
              </div>
              <Switch
                id="auto-progress"
                checked={autoProgress}
                onCheckedChange={setAutoProgress}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {!config ? (
                <Button
                  onClick={handleCreateConfig}
                  disabled={actionLoading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Create Configuration
                </Button>
              ) : (
                <>
                  {progress?.status === "not_started" && (
                    <Button
                      onClick={handleStart}
                      disabled={actionLoading}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600"
                    >
                      {actionLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4 mr-2" />
                      )}
                      Start Warming
                    </Button>
                  )}
                  {progress?.status === "active" && (
                    <Button
                      onClick={handlePause}
                      disabled={actionLoading}
                      variant="outline"
                      className="flex-1 border-yellow-500 text-yellow-400"
                    >
                      {actionLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Pause className="w-4 h-4 mr-2" />
                      )}
                      Pause
                    </Button>
                  )}
                  {progress?.status === "paused" && (
                    <Button
                      onClick={handleResume}
                      disabled={actionLoading}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600"
                    >
                      {actionLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4 mr-2" />
                      )}
                      Resume
                    </Button>
                  )}
                  <Button
                    onClick={handleUpdateStrategy}
                    disabled={actionLoading}
                    variant="outline"
                    className="border-blue-500 text-blue-400"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RotateCcw className="w-4 h-4 mr-2" />
                    )}
                    Update
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Daily Logs */}
        <Card className="glass border-slate-700">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              <h3 className="text-xl font-bold text-white">Daily Performance</h3>
            </div>
            <p className="text-sm text-slate-400">Track your warming progress</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              <AnimatePresence>
                {dailyLogs.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No warming logs yet</p>
                    <p className="text-xs">Start warming to see daily performance</p>
                  </div>
                ) : (
                  dailyLogs.map((log, idx) => (
                    <motion.div
                      key={log.day_number}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="glass p-4 rounded-lg border border-slate-700 hover:border-purple-500/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-purple-500 text-purple-400">
                            Day {log.day_number}
                          </Badge>
                          {log.limit_reached && (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          )}
                        </div>
                        <span className="text-xs text-slate-400">
                          {new Date(log.date).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div>
                          <p className="text-xs text-slate-500">Sent</p>
                          <p className="text-sm font-bold text-white">
                            {log.emails_sent}/{log.daily_limit}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Delivered</p>
                          <p className="text-sm font-bold text-green-400">
                            {log.delivery_rate.toFixed(0)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Bounced</p>
                          <p
                            className={`text-sm font-bold ${
                              log.bounce_rate > 5 ? "text-red-400" : "text-yellow-400"
                            }`}
                          >
                            {log.bounce_rate.toFixed(1)}%
                          </p>
                        </div>
                      </div>

                      <div className="w-full bg-slate-700 rounded-full h-1.5">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full"
                          style={{
                            width: `${((log.emails_sent / log.daily_limit) * 100) || 0}%`,
                          }}
                        />
                      </div>

                      {log.notes && (
                        <p className="text-xs text-yellow-400 mt-2 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {log.notes}
                        </p>
                      )}
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
