"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Heart,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  AlertCircle,
  Bell,
  CheckCircle,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Trophy,
  Star,
  Rocket,
  Calendar,
  Mail,
  Sparkles,
  Clock,
  RefreshCw,
  ChevronRight,
  Activity,
  BarChart3,
  Target,
  Zap,
  Info,
  Check,
  X,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  warmupHealthAPI,
  type HealthDashboard,
  type HealthScore,
  type HealthAlert,
  type HealthMilestone,
} from "@/lib/api";

// Color mapping for Tailwind classes (must be complete class names for build-time detection)
const statusColorClasses: Record<string, { bg: string; text: string; border: string }> = {
  green: { bg: "bg-green-500/20", text: "text-green-400", border: "border-green-500/50" },
  emerald: { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/50" },
  yellow: { bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/50" },
  orange: { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/50" },
  red: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/50" },
  blue: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/50" },
  purple: { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/50" },
  cyan: { bg: "bg-cyan-500/20", text: "text-cyan-400", border: "border-cyan-500/50" },
};

// Score bar color classes
const scoreBarColors: Record<string, { text: string; gradient: string }> = {
  green: { text: "text-green-400", gradient: "from-green-600 to-green-400" },
  red: { text: "text-red-400", gradient: "from-red-600 to-red-400" },
  yellow: { text: "text-yellow-400", gradient: "from-yellow-600 to-yellow-400" },
  purple: { text: "text-purple-400", gradient: "from-purple-600 to-purple-400" },
  blue: { text: "text-blue-400", gradient: "from-blue-600 to-blue-400" },
  cyan: { text: "text-cyan-400", gradient: "from-cyan-600 to-cyan-400" },
  orange: { text: "text-orange-400", gradient: "from-orange-600 to-orange-400" },
};

// Health score gauge component
function HealthGauge({ score, status, statusColor }: { score: number; status: string; statusColor: string }) {
  const getGradient = () => {
    if (score >= 90) return "from-emerald-500 to-green-400";
    if (score >= 70) return "from-green-500 to-lime-400";
    if (score >= 50) return "from-yellow-500 to-amber-400";
    if (score >= 30) return "from-orange-500 to-amber-500";
    return "from-red-500 to-rose-400";
  };

  const rotation = (score / 100) * 180 - 90; // -90 to 90 degrees

  // Get proper Tailwind classes from mapping
  const colorClasses = statusColorClasses[statusColor] || statusColorClasses.blue;

  return (
    <div className="relative flex flex-col items-center">
      {/* Gauge Background */}
      <div className="relative w-48 h-24 overflow-hidden">
        {/* Background arc */}
        <div className="absolute w-48 h-48 rounded-full border-[16px] border-slate-700/50"
             style={{ clipPath: "polygon(0 50%, 100% 50%, 100% 0, 0 0)" }} />

        {/* Score arc */}
        <motion.div
          initial={{ rotate: -90 }}
          animate={{ rotate: rotation }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`absolute w-48 h-48 rounded-full border-[16px] border-transparent bg-gradient-to-r ${getGradient()}`}
          style={{
            clipPath: "polygon(0 50%, 100% 50%, 100% 0, 0 0)",
            borderColor: "transparent",
            background: `conic-gradient(from 180deg, transparent 0deg, transparent ${90 - rotation}deg, currentColor ${90 - rotation}deg, currentColor 180deg, transparent 180deg)`,
          }}
        />

        {/* Center decoration */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-16 bg-slate-900 rounded-t-full" />
      </div>

      {/* Score Display */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring" }}
        className="absolute bottom-2 flex flex-col items-center"
      >
        <span className={`text-4xl font-bold bg-gradient-to-r ${getGradient()} bg-clip-text text-transparent`}>
          {Math.round(score)}
        </span>
        <Badge className={`${colorClasses.bg} ${colorClasses.text} ${colorClasses.border} mt-1`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      </motion.div>
    </div>
  );
}

// Component score bar
function ScoreBar({ label, score, rate, icon: Icon, color }: {
  label: string;
  score: number;
  rate?: number;
  icon: any;
  color: string
}) {
  // Get proper Tailwind classes from mapping
  const colorClasses = scoreBarColors[color] || scoreBarColors.blue;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${colorClasses.text}`} />
          <span className="text-slate-300">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {rate !== undefined && (
            <span className="text-xs text-slate-500">{rate.toFixed(1)}%</span>
          )}
          <span className={`font-medium ${colorClasses.text}`}>{Math.round(score)}</span>
        </div>
      </div>
      <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full bg-gradient-to-r ${colorClasses.gradient} rounded-full`}
        />
      </div>
    </div>
  );
}

// Alert card component
function AlertCard({ alert, onRead, onResolve }: {
  alert: HealthAlert;
  onRead: () => void;
  onResolve: () => void
}) {
  const severityConfig = {
    critical: { bg: "bg-red-500/10", border: "border-red-500/50", icon: AlertTriangle, color: "text-red-400" },
    warning: { bg: "bg-yellow-500/10", border: "border-yellow-500/50", icon: AlertCircle, color: "text-yellow-400" },
    info: { bg: "bg-blue-500/10", border: "border-blue-500/50", icon: Info, color: "text-blue-400" },
  };

  const config = severityConfig[alert.severity as keyof typeof severityConfig] || severityConfig.info;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`p-4 rounded-lg border ${config.border} ${config.bg} ${!alert.is_read ? "ring-1 ring-offset-1 ring-offset-slate-900" : ""}`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${config.bg}`}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-medium text-white truncate">{alert.title}</h4>
            <Badge variant="outline" className={`${config.border} ${config.color} text-xs`}>
              {alert.severity}
            </Badge>
          </div>
          <p className="text-sm text-slate-400 mt-1">{alert.message}</p>
          {alert.recommended_actions && alert.recommended_actions.length > 0 && (
            <div className="mt-2 space-y-1">
              {alert.recommended_actions.slice(0, 2).map((action, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-500">
                  <ChevronRight className="w-3 h-3" />
                  <span>{action.action}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 mt-3">
            {!alert.is_read && (
              <Button size="sm" variant="ghost" onClick={onRead} className="text-xs h-7">
                <Check className="w-3 h-3 mr-1" />
                Mark Read
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={onResolve} className="text-xs h-7 text-green-400 hover:text-green-300">
              <CheckCircle className="w-3 h-3 mr-1" />
              Resolve
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Milestone badge component
function MilestoneBadge({ milestone }: { milestone: HealthMilestone }) {
  const badgeIcons: Record<string, any> = {
    trophy: Trophy,
    star: Star,
    rocket: Rocket,
    calendar: Calendar,
    mail: Mail,
    sparkles: Sparkles,
    heart: Heart,
    shield: Shield,
  };

  const Icon = badgeIcons[milestone.badge_icon || "star"] || Star;

  const colorClasses: Record<string, string> = {
    gold: "from-yellow-400 to-amber-500 shadow-yellow-500/30",
    silver: "from-slate-300 to-slate-400 shadow-slate-400/30",
    bronze: "from-amber-600 to-orange-500 shadow-orange-500/30",
    blue: "from-blue-400 to-cyan-500 shadow-blue-500/30",
    green: "from-green-400 to-emerald-500 shadow-green-500/30",
    purple: "from-purple-400 to-pink-500 shadow-purple-500/30",
    red: "from-red-400 to-rose-500 shadow-red-500/30",
    cyan: "from-cyan-400 to-teal-500 shadow-cyan-500/30",
  };

  const colorClass = colorClasses[milestone.badge_color || "blue"] || colorClasses.blue;

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      whileHover={{ scale: 1.1, rotate: 5 }}
      className="flex flex-col items-center gap-2 p-3"
    >
      <div className={`relative p-3 rounded-full bg-gradient-to-br ${colorClass} shadow-lg`}>
        <Icon className="w-6 h-6 text-white" />
        {milestone.is_achieved !== false && (
          <div className="absolute -bottom-1 -right-1 p-1 bg-green-500 rounded-full">
            <Check className="w-2 h-2 text-white" />
          </div>
        )}
      </div>
      <div className="text-center">
        <p className="text-xs font-medium text-white truncate max-w-[80px]">{milestone.title}</p>
        {milestone.achieved_at && (
          <p className="text-[10px] text-slate-500">
            {new Date(milestone.achieved_at).toLocaleDateString()}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// Main component
export function WarmupHealthDashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<HealthDashboard | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "alerts" | "milestones">("overview");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("[WarmupHealth] Component mounted, loading dashboard...");
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    console.log("[WarmupHealth] loadDashboard - Starting data fetch");
    setLoading(true);
    setError(null);
    try {
      const { data } = await warmupHealthAPI.getDashboard();
      console.log("[WarmupHealth] Dashboard data loaded successfully:", data);
      setDashboard(data);
    } catch (error: any) {
      console.error("[WarmupHealth] Error loading health dashboard:", error);
      const errorMessage = error.response?.data?.detail || error.message || "Failed to load health dashboard";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      console.log("[WarmupHealth] loadDashboard - Complete");
    }
  };

  const handleCalculateScore = async () => {
    setCalculating(true);
    try {
      await warmupHealthAPI.calculateScore();
      toast.success("Health score calculated!");
      loadDashboard();
    } catch (error) {
      console.error("Error calculating score:", error);
      toast.error("Failed to calculate health score");
    } finally {
      setCalculating(false);
    }
  };

  const handleMarkAlertRead = async (alertId: number) => {
    try {
      await warmupHealthAPI.markAlertRead(alertId);
      loadDashboard();
    } catch (error) {
      toast.error("Failed to mark alert as read");
    }
  };

  const handleResolveAlert = async (alertId: number) => {
    try {
      await warmupHealthAPI.resolveAlert(alertId);
      toast.success("Alert resolved!");
      loadDashboard();
    } catch (error) {
      toast.error("Failed to resolve alert");
    }
  };

  const getTrendIcon = (trend: number) => {
    if (trend === 1) return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (trend === -1) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="glass border-red-500/50">
        <CardContent className="py-12 text-center">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h3 className="text-xl font-bold text-white mb-2">Error Loading Dashboard</h3>
          <p className="text-slate-400 mb-4">{error}</p>
          <Button onClick={loadDashboard} className="bg-gradient-to-r from-red-600 to-orange-600">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!dashboard) {
    return (
      <Card className="glass border-slate-700">
        <CardContent className="py-12 text-center">
          <Heart className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <h3 className="text-xl font-bold text-white mb-2">No Health Data Yet</h3>
          <p className="text-slate-400 mb-4">Start your warming campaign to begin tracking health.</p>
          <Button onClick={handleCalculateScore} className="bg-gradient-to-r from-cyan-600 to-blue-600">
            <Activity className="w-4 h-4 mr-2" />
            Calculate Health Score
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Quick Stats */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600"
          >
            <Heart className="w-8 h-8 text-white" />
          </motion.div>
          <div>
            <h2 className="text-2xl font-bold text-white">Email Health Monitor</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl">{dashboard.quick_stats.health_emoji}</span>
              <span className="text-slate-400">{dashboard.quick_stats.health_label}</span>
              {dashboard.quick_stats.trend_emoji && (
                <span className="text-lg">{dashboard.quick_stats.trend_emoji}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Alert Badge */}
          {(dashboard.alert_counts.critical > 0 || dashboard.alert_counts.warning > 0) && (
            <Badge
              variant="outline"
              className={`${
                dashboard.alert_counts.critical > 0
                  ? "border-red-500 text-red-400 animate-pulse"
                  : "border-yellow-500 text-yellow-400"
              }`}
            >
              <Bell className="w-3 h-3 mr-1" />
              {dashboard.alert_counts.critical + dashboard.alert_counts.warning} Alerts
            </Badge>
          )}

          <Button
            onClick={handleCalculateScore}
            disabled={calculating}
            variant="outline"
            className="border-slate-600"
          >
            {calculating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Recalculate
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 p-1 glass rounded-xl w-fit">
        {[
          { id: "overview", label: "Overview", icon: Activity },
          { id: "alerts", label: `Alerts (${dashboard.alerts.length})`, icon: Bell },
          { id: "milestones", label: `Milestones (${dashboard.milestones.length})`, icon: Trophy },
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={activeTab === tab.id
              ? "bg-gradient-to-r from-cyan-600 to-blue-600"
              : "text-slate-400 hover:text-white"}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Health Score Card */}
          <Card className="glass border-slate-700 lg:col-span-1">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Health Score</h3>
                {dashboard.health_score && getTrendIcon(dashboard.health_score.trends.score)}
              </div>
            </CardHeader>
            <CardContent>
              {dashboard.health_score ? (
                <div className="space-y-6">
                  <HealthGauge
                    score={dashboard.health_score.overall_score}
                    status={dashboard.health_score.health_status}
                    statusColor={dashboard.health_score.status_color}
                  />

                  {/* Component Scores */}
                  <div className="space-y-3 pt-4">
                    <ScoreBar
                      label="Delivery"
                      score={dashboard.health_score.components.delivery.score}
                      rate={dashboard.health_score.components.delivery.rate}
                      icon={CheckCircle}
                      color="green"
                    />
                    <ScoreBar
                      label="Bounce"
                      score={dashboard.health_score.components.bounce.score}
                      rate={dashboard.health_score.components.bounce.rate}
                      icon={X}
                      color="red"
                    />
                    <ScoreBar
                      label="Spam"
                      score={dashboard.health_score.components.spam.score}
                      rate={dashboard.health_score.components.spam.rate}
                      icon={ShieldAlert}
                      color="yellow"
                    />
                    <ScoreBar
                      label="Consistency"
                      score={dashboard.health_score.components.consistency.score}
                      icon={Target}
                      color="purple"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                  <p className="text-slate-400">No score calculated yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Warming Progress & Recommendations */}
          <Card className="glass border-slate-700 lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <h3 className="text-lg font-bold text-white">Warming Progress & Recommendations</h3>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Warming Status */}
              {dashboard.warming_status && (
                <div className="p-4 glass rounded-lg border border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge className={`${
                        dashboard.warming_status.status === "active"
                          ? "bg-green-500/20 text-green-400 border-green-500/50"
                          : dashboard.warming_status.status === "completed"
                          ? "bg-blue-500/20 text-blue-400 border-blue-500/50"
                          : "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
                      }`}>
                        {dashboard.warming_status.status.toUpperCase()}
                      </Badge>
                      <span className="text-sm text-slate-400">
                        Day {dashboard.warming_status.current_day} of {dashboard.warming_status.max_day}
                      </span>
                    </div>
                    <span className="text-sm text-slate-400">
                      {dashboard.warming_status.sent_today}/{dashboard.warming_status.daily_limit} today
                    </span>
                  </div>
                  <Progress
                    value={dashboard.warming_status.progress_percent}
                    className="h-3 bg-slate-700"
                  />
                  <div className="flex justify-between mt-2 text-xs text-slate-500">
                    <span>Progress: {dashboard.warming_status.progress_percent}%</span>
                    <span>Total: {dashboard.warming_status.total_sent} emails</span>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {dashboard.health_score?.recommendations && dashboard.health_score.recommendations.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <Target className="w-4 h-4 text-cyan-400" />
                    Recommendations
                  </h4>
                  {dashboard.health_score.recommendations.map((rec, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`p-3 rounded-lg border ${
                        rec.impact === "critical"
                          ? "border-red-500/50 bg-red-500/10"
                          : rec.impact === "high"
                          ? "border-orange-500/50 bg-orange-500/10"
                          : rec.impact === "positive"
                          ? "border-green-500/50 bg-green-500/10"
                          : "border-slate-700 bg-slate-800/30"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Badge variant="outline" className="text-xs mt-0.5">
                          #{rec.priority}
                        </Badge>
                        <div>
                          <p className="text-sm font-medium text-white">{rec.action}</p>
                          <p className="text-xs text-slate-400 mt-1">{rec.reason}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Domain Reputation */}
              {dashboard.domain_reputation && (
                <div className="p-4 glass rounded-lg border border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-cyan-400" />
                      <h4 className="font-medium text-white">Domain: {dashboard.domain_reputation.domain}</h4>
                    </div>
                    <Badge className={`${
                      dashboard.domain_reputation.overall_reputation >= 70
                        ? "bg-green-500/20 text-green-400"
                        : dashboard.domain_reputation.overall_reputation >= 50
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                    }`}>
                      {dashboard.domain_reputation.overall_reputation}% Reputation
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-2 rounded-lg bg-slate-800/50">
                      <div className={`text-lg ${dashboard.domain_reputation.authentication.spf ? "text-green-400" : "text-red-400"}`}>
                        {dashboard.domain_reputation.authentication.spf ? "✓" : "✗"}
                      </div>
                      <p className="text-xs text-slate-400">SPF</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-slate-800/50">
                      <div className={`text-lg ${dashboard.domain_reputation.authentication.dkim ? "text-green-400" : "text-red-400"}`}>
                        {dashboard.domain_reputation.authentication.dkim ? "✓" : "✗"}
                      </div>
                      <p className="text-xs text-slate-400">DKIM</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-slate-800/50">
                      <div className={`text-lg ${dashboard.domain_reputation.authentication.dmarc ? "text-green-400" : "text-red-400"}`}>
                        {dashboard.domain_reputation.authentication.dmarc ? "✓" : "✗"}
                      </div>
                      <p className="text-xs text-slate-400">DMARC</p>
                    </div>
                  </div>

                  {dashboard.domain_reputation.blacklist.is_blacklisted && (
                    <div className="mt-3 p-2 bg-red-500/10 border border-red-500/50 rounded-lg">
                      <p className="text-xs text-red-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Domain is blacklisted!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Alerts Tab */}
      {activeTab === "alerts" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="glass border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-yellow-400" />
                  <h3 className="text-lg font-bold text-white">Health Alerts</h3>
                </div>
                {dashboard.alerts.some(a => !a.is_read) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => warmupHealthAPI.markAllAlertsRead().then(loadDashboard)}
                    className="text-xs"
                  >
                    Mark All Read
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {dashboard.alerts.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500/50" />
                  <h4 className="text-lg font-medium text-white mb-2">All Clear!</h4>
                  <p className="text-slate-400">No active alerts. Your email health is good.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  <AnimatePresence>
                    {dashboard.alerts.map((alert) => (
                      <AlertCard
                        key={alert.id}
                        alert={alert}
                        onRead={() => handleMarkAlertRead(alert.id)}
                        onResolve={() => handleResolveAlert(alert.id)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Milestones Tab */}
      {activeTab === "milestones" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="glass border-slate-700">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <h3 className="text-lg font-bold text-white">Achievements</h3>
              </div>
              <p className="text-sm text-slate-400">
                Milestones earned during your warming journey
              </p>
            </CardHeader>
            <CardContent>
              {dashboard.milestones.length === 0 ? (
                <div className="text-center py-12">
                  <Rocket className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                  <h4 className="text-lg font-medium text-white mb-2">Your Journey Begins</h4>
                  <p className="text-slate-400">
                    Complete warming tasks to earn milestones and badges!
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 justify-center">
                  {dashboard.milestones.map((milestone) => (
                    <MilestoneBadge key={milestone.id} milestone={milestone} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Score History Chart */}
      {activeTab === "overview" && dashboard.score_history.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass border-slate-700">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-bold text-white">Score History</h3>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-40 flex items-end gap-1">
                {dashboard.score_history.slice(-30).map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ height: 0 }}
                    animate={{ height: `${item.score}%` }}
                    transition={{ delay: idx * 0.02, duration: 0.3 }}
                    className={`flex-1 rounded-t ${
                      item.score >= 90 ? "bg-emerald-500" :
                      item.score >= 70 ? "bg-green-500" :
                      item.score >= 50 ? "bg-yellow-500" :
                      item.score >= 30 ? "bg-orange-500" :
                      "bg-red-500"
                    } hover:opacity-80 transition-opacity cursor-pointer`}
                    title={`${new Date(item.date).toLocaleDateString()}: ${item.score.toFixed(0)}%`}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-slate-500">
                <span>30 days ago</span>
                <span>Today</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quick Tip */}
      {dashboard.quick_stats.tip && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="p-4 glass rounded-lg border border-cyan-500/30 bg-cyan-500/5"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/20">
              <Info className="w-5 h-5 text-cyan-400" />
            </div>
            <p className="text-sm text-slate-300">{dashboard.quick_stats.tip}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
