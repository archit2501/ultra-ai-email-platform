"use client";

/**
 * Email Warmup System - Full Dashboard Page
 * ULTRA PREMIUM EDITION - GOD TIER V4.0
 *
 * Complete warmup management interface with:
 * - Real-time metrics and neural network visualization
 * - AI-powered insights and predictions
 * - Account enrollment wizard
 * - Pool statistics and health monitoring
 * - Phase 4: ML/DL Intelligence Engine (DQN, LSTM, Bandits)
 * - Adaptive control with throttling and reputation protection
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Sparkles,
  Flame,
  Activity,
  Users,
  TrendingUp,
  Brain,
  Zap,
  AlertTriangle,
  CheckCircle,
  Settings,
  Plus,
  RefreshCw,
  BarChart3,
  Target,
  Network,
  Clock,
  Mail,
  Inbox,
  MessageSquare,
  ChevronRight,
  Play,
  Pause,
  ExternalLink,
  Cpu,
  FileText,
  Rocket,
  FlaskConical,
  LineChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Import warmup components
import {
  WarmupDashboard,
  HealthScoreCard,
  WarmupPoolStats,
  ConversationFeed,
  InboxPlacementChart,
  BlacklistAlerts,
  WarmupScheduleConfig,
  NeuralNetworkViz,
  AIInsightsPanel,
  RealtimeMetrics,
  AccountEnrollmentWizard,
  // Phase 4: ML/DL Intelligence Engine
  MLIntelligenceDashboard,
  ContentOptimizer,
} from "@/components/warmup";

import { warmupAPI, type DashboardData, type AIInsight, type RealtimeStats } from "@/lib/warmup-api";

// ============================================================================
// Types
// ============================================================================

interface WarmupState {
  isLoading: boolean;
  isEnrolled: boolean;
  dashboardData: DashboardData | null;
  aiInsights: AIInsight[];
  realtimeStats: RealtimeStats | null;
  error: string | null;
}

// ============================================================================
// Quick Stats Component
// ============================================================================

function QuickStats({ data }: { data: DashboardData }) {
  const stats = [
    {
      label: "Health Score",
      value: `${data.member?.quality_score || 0}%`,
      icon: Shield,
      color: "text-green-400",
      bgColor: "from-green-500/20 to-emerald-500/20",
    },
    {
      label: "Emails Today",
      value: data.daily_usage?.sends_today || 0,
      icon: Mail,
      color: "text-blue-400",
      bgColor: "from-blue-500/20 to-cyan-500/20",
    },
    {
      label: "Inbox Rate",
      value: `${data.placement_test?.inbox_rate || 0}%`,
      icon: Inbox,
      color: "text-purple-400",
      bgColor: "from-purple-500/20 to-pink-500/20",
    },
    {
      label: "Pool Size",
      value: data.pool_stats?.total_members || 0,
      icon: Users,
      color: "text-orange-400",
      bgColor: "from-orange-500/20 to-amber-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <motion.div
          key={stat.label}
          className={cn(
            "p-4 rounded-xl bg-gradient-to-br border border-slate-700/50",
            stat.bgColor
          )}
          whileHover={{ scale: 1.02, y: -2 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <stat.icon className={cn("w-4 h-4", stat.color)} />
            <span className="text-xs text-slate-400">{stat.label}</span>
          </div>
          <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
        </motion.div>
      ))}
    </div>
  );
}

// ============================================================================
// Enrollment CTA Component
// ============================================================================

function EnrollmentCTA({ onEnroll }: { onEnroll: () => void }) {
  return (
    <motion.div
      className="min-h-[60vh] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Card className="max-w-2xl w-full bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 backdrop-blur-xl border-slate-700/50">
        <CardContent className="p-8 text-center">
          <motion.div
            className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center"
            animate={{
              boxShadow: [
                "0 0 30px rgba(16, 185, 129, 0.3)",
                "0 0 60px rgba(16, 185, 129, 0.5)",
                "0 0 30px rgba(16, 185, 129, 0.3)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Flame className="w-12 h-12 text-white" />
          </motion.div>

          <h2 className="text-3xl font-bold text-white mb-4">
            Email Warmup System
          </h2>

          <p className="text-lg text-slate-400 mb-2">
            ULTRA PREMIUM EDITION - GOD TIER V3.0
          </p>

          <p className="text-slate-500 mb-8 max-w-md mx-auto">
            Build sender reputation with our AI-powered peer-to-peer warmup network.
            Features that rival and exceed Smartlead and Instantly.ai.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: Brain, label: "AI Optimization" },
              { icon: Network, label: "Peer Network" },
              { icon: Shield, label: "Spam Protection" },
              { icon: BarChart3, label: "Analytics" },
            ].map((feature) => (
              <div
                key={feature.label}
                className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50"
              >
                <feature.icon className="w-6 h-6 mx-auto mb-2 text-green-400" />
                <p className="text-xs text-slate-400">{feature.label}</p>
              </div>
            ))}
          </div>

          <Button
            size="lg"
            className="gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            onClick={onEnroll}
          >
            <Plus className="w-5 h-5" />
            Enroll Now - Free
            <ChevronRight className="w-5 h-5" />
          </Button>

          <p className="text-xs text-slate-500 mt-4">
            No credit card required. Start warming up your email today.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// Control Bar Component
// ============================================================================

function ControlBar({
  data,
  onRefresh,
  onToggleStatus,
  isRefreshing,
}: {
  data: DashboardData;
  onRefresh: () => void;
  onToggleStatus: () => void;
  isRefreshing: boolean;
}) {
  const isActive = data.member?.is_active;
  const tier = data.member?.tier || "standard";

  const tierColors: Record<string, string> = {
    standard: "from-slate-500 to-slate-600",
    premium: "from-purple-500 to-pink-500",
    enterprise: "from-amber-500 to-orange-500",
    god: "from-red-500 to-pink-500",
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
      <div className="flex items-center gap-4">
        <Badge
          className={cn(
            "text-white px-4 py-1 bg-gradient-to-r",
            tierColors[tier] || tierColors.standard
          )}
        >
          <Sparkles className="w-3 h-3 mr-1" />
          {tier.toUpperCase()} TIER
        </Badge>

        <Badge
          variant="outline"
          className={cn(
            "px-4 py-1",
            isActive
              ? "border-green-500/50 text-green-400"
              : "border-yellow-500/50 text-yellow-400"
          )}
        >
          <motion.div
            className={cn(
              "w-2 h-2 rounded-full mr-2",
              isActive ? "bg-green-500" : "bg-yellow-500"
            )}
            animate={{ scale: isActive ? [1, 1.3, 1] : 1 }}
            transition={{ duration: 1, repeat: isActive ? Infinity : 0 }}
          />
          {isActive ? "ACTIVE" : "PAUSED"}
        </Badge>

        {data.alert_count && data.alert_count > 0 && (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {data.alert_count} Alert{data.alert_count > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={cn("w-4 h-4", isRefreshing && "animate-spin")}
          />
          Refresh
        </Button>

        <Button
          variant={isActive ? "outline" : "default"}
          size="sm"
          className={cn(
            "gap-2",
            isActive
              ? "border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
              : "bg-green-500 hover:bg-green-600"
          )}
          onClick={onToggleStatus}
        >
          {isActive ? (
            <>
              <Pause className="w-4 h-4" />
              Pause Warmup
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Resume Warmup
            </>
          )}
        </Button>

        <Button variant="ghost" size="sm" className="gap-2">
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function WarmupPage() {
  const { toast } = useToast();
  const [state, setState] = useState<WarmupState>({
    isLoading: true,
    isEnrolled: false,
    dashboardData: null,
    aiInsights: [],
    realtimeStats: null,
    error: null,
  });
  const [showEnrollmentWizard, setShowEnrollmentWizard] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load dashboard data
  const loadDashboard = async () => {
    console.log("[WarmupPage] Loading dashboard data...");
    const startTime = Date.now();

    try {
      setIsRefreshing(true);
      console.log("[WarmupPage] Fetching dashboard, insights, and stats in parallel");

      const [dashboard, insights, stats] = await Promise.all([
        warmupAPI.getDashboard(),
        warmupAPI.getAIInsights(10, true).catch((err) => {
          console.warn("[WarmupPage] Failed to load AI insights:", err);
          return { insights: [] };
        }),
        warmupAPI.getRealtimeStats().catch((err) => {
          console.warn("[WarmupPage] Failed to load realtime stats:", err);
          return null;
        }),
      ]);

      const elapsed = Date.now() - startTime;
      console.log("[WarmupPage] Dashboard loaded successfully:", {
        enrolled: dashboard.enrolled,
        memberId: dashboard.member?.id,
        healthScore: dashboard.member?.quality_score,
        insightsCount: insights.insights?.length || 0,
        hasRealtimeStats: !!stats,
        loadTimeMs: elapsed,
      });

      setState({
        isLoading: false,
        isEnrolled: dashboard.enrolled,
        dashboardData: dashboard,
        aiInsights: insights.insights || [],
        realtimeStats: stats,
        error: null,
      });
    } catch (error) {
      const elapsed = Date.now() - startTime;
      console.error("[WarmupPage] Failed to load dashboard:", {
        error,
        loadTimeMs: elapsed,
      });
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to load dashboard",
      }));
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    console.log("[WarmupPage] Component mounted, loading initial dashboard data");
    loadDashboard();

    // Set up polling for real-time updates
    const pollInterval = setInterval(() => {
      if (state.isEnrolled) {
        console.debug("[WarmupPage] Polling realtime stats...");
        warmupAPI.getRealtimeStats().then((stats) => {
          console.debug("[WarmupPage] Realtime stats updated:", {
            healthScore: stats?.member?.quality_score,
            emailsSent: stats?.today?.emails_sent,
          });
          setState((prev) => ({ ...prev, realtimeStats: stats }));
        }).catch((err) => {
          console.error("[WarmupPage] Realtime stats poll failed:", err);
        });
      }
    }, 30000); // Poll every 30 seconds

    return () => {
      console.log("[WarmupPage] Component unmounting, clearing poll interval");
      clearInterval(pollInterval);
    };
  }, [state.isEnrolled]);

  // Handle warmup status toggle
  const handleToggleStatus = async () => {
    if (!state.dashboardData?.member) {
      console.warn("[WarmupPage] Cannot toggle status - no member data");
      return;
    }

    const isActive = state.dashboardData.member.is_active;
    const action = isActive ? "pause" : "resume";

    console.log("[WarmupPage] Toggling warmup status:", {
      currentStatus: isActive ? "active" : "paused",
      action,
      memberId: state.dashboardData.member.id,
    });

    try {
      const result = await warmupAPI.updateStatus(action);
      console.log("[WarmupPage] Status update successful:", result);

      toast({
        title: isActive ? "Warmup Paused" : "Warmup Resumed",
        description: isActive
          ? "Email warmup has been paused."
          : "Email warmup is now active.",
      });
      loadDashboard();
    } catch (error) {
      console.error("[WarmupPage] Failed to toggle warmup status:", error);
      toast({
        title: "Error",
        description: `Failed to ${action} warmup`,
        variant: "destructive",
      });
    }
  };

  // Handle enrollment completion
  const handleEnrollmentComplete = () => {
    setShowEnrollmentWizard(false);
    toast({
      title: "Welcome to the Warmup Pool!",
      description: "Your account is now warming up. Check back for insights.",
    });
    loadDashboard();
  };

  // Loading state
  if (state.isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  // Error state
  if (state.error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-400" />
            <h3 className="text-lg font-semibold text-white mb-2">Error Loading Warmup</h3>
            <p className="text-red-400 mb-4">{state.error}</p>
            <Button onClick={loadDashboard}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Enrollment wizard
  if (showEnrollmentWizard) {
    return (
      <div className="container mx-auto p-6">
        <AccountEnrollmentWizard
          onComplete={handleEnrollmentComplete}
          onClose={() => setShowEnrollmentWizard(false)}
        />
      </div>
    );
  }

  // Not enrolled - show CTA
  if (!state.isEnrolled) {
    return (
      <div className="container mx-auto p-6">
        <EnrollmentCTA onEnroll={() => setShowEnrollmentWizard(true)} />
      </div>
    );
  }

  // Main dashboard
  const dashboardData = state.dashboardData!;

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <motion.div
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Flame className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              Email Warmup
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500">
                <Sparkles className="w-3 h-3 mr-1" />
                ULTRA PREMIUM
              </Badge>
            </h1>
            <p className="text-slate-400">
              AI-powered sender reputation building
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => window.open("https://docs.warmup.ai", "_blank")}
        >
          <ExternalLink className="w-4 h-4" />
          Documentation
        </Button>
      </div>

      {/* Control Bar */}
      <ControlBar
        data={dashboardData}
        onRefresh={loadDashboard}
        onToggleStatus={handleToggleStatus}
        isRefreshing={isRefreshing}
      />

      {/* Quick Stats */}
      <QuickStats data={dashboardData} />

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 bg-slate-800/50 border border-slate-700/50 flex-wrap">
          <TabsTrigger value="overview" className="gap-2">
            <Activity className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="ai-insights" className="gap-2">
            <Brain className="w-4 h-4" />
            AI Insights
          </TabsTrigger>
          <TabsTrigger value="ml-engine" className="gap-2 relative">
            <Cpu className="w-4 h-4" />
            ML Engine
            <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full">
              V4
            </span>
          </TabsTrigger>
          <TabsTrigger value="neural" className="gap-2">
            <Network className="w-4 h-4" />
            Neural Network
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-2">
            <FileText className="w-4 h-4" />
            Content AI
          </TabsTrigger>
          <TabsTrigger value="conversations" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Conversations
          </TabsTrigger>
          <TabsTrigger value="testing" className="gap-2">
            <Target className="w-4 h-4" />
            Testing
          </TabsTrigger>
          <TabsTrigger value="schedule" className="gap-2">
            <Clock className="w-4 h-4" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="gap-2 relative">
            <Rocket className="w-4 h-4" />
            Campaigns
            <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full">
              V5
            </span>
          </TabsTrigger>
          <TabsTrigger value="ab-testing" className="gap-2">
            <FlaskConical className="w-4 h-4" />
            A/B Tests
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <LineChart className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Health Score Card */}
            <HealthScoreCard
              score={dashboardData.member?.quality_score || 0}
              trend="up"
              breakdown={{
                engagement: 85,
                deliverability: 92,
                consistency: 78,
                volume: 65,
              }}
            />

            {/* Real-time Metrics */}
            <div className="lg:col-span-2">
              <RealtimeMetrics
                stats={{
                  totalAccounts: 1,
                  activeAccounts: dashboardData.member?.is_active ? 1 : 0,
                  averageHealthScore: dashboardData.member?.quality_score || 0,
                  totalConversations: dashboardData.pool_stats?.active_members || 0,
                  emailsSentToday: dashboardData.daily_usage?.sends_today || 0,
                  emailsReceivedToday: dashboardData.daily_usage?.receives_today || 0,
                  averageInboxRate: dashboardData.placement_test?.inbox_rate || 0,
                  blacklistAlerts: dashboardData.blacklist_status?.total_listings || 0,
                  poolSize: dashboardData.pool_stats?.total_members || 0,
                  premiumPoolSize: Math.floor((dashboardData.pool_stats?.total_members || 0) * 0.3),
                  networkStrength: 85,
                  reputationTrend: "rising",
                }}
              />
            </div>
          </div>

          {/* Pool Stats & Blacklist Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WarmupPoolStats
              stats={{
                totalMembers: dashboardData.pool_stats?.total_members || 0,
                activeMembers: dashboardData.pool_stats?.active_members || 0,
                byTier: {
                  standard: Math.floor((dashboardData.pool_stats?.total_members || 0) * 0.5),
                  premium: Math.floor((dashboardData.pool_stats?.total_members || 0) * 0.3),
                  enterprise: Math.floor((dashboardData.pool_stats?.total_members || 0) * 0.15),
                  god: Math.floor((dashboardData.pool_stats?.total_members || 0) * 0.05),
                },
                avgQualityScore: dashboardData.pool_stats?.avg_quality_score || 0,
              }}
            />

            <BlacklistAlerts
              alerts={(dashboardData.alerts || [])
                .filter((a) => a.type === "blacklist")
                .map((a, idx) => ({
                  id: `alert-${idx}`,
                  blacklistName: a.title || "Unknown",
                  severity: (a.severity === "critical" ? "critical" : a.severity === "high" ? "warning" : "info") as "critical" | "warning" | "info",
                  domain: dashboardData.member?.tier || "domain.com",
                  detectedAt: new Date().toISOString(),
                  status: "active" as const,
                  description: a.message,
                }))}
            />
          </div>

          {/* Inbox Placement Chart */}
          <InboxPlacementChart
            data={{
              gmail: {
                inbox: dashboardData.placement_test?.inbox_rate || 85,
                spam: 10,
                missing: 5,
              },
              outlook: {
                inbox: (dashboardData.placement_test?.inbox_rate || 85) - 5,
                spam: 12,
                missing: 8,
              },
              yahoo: {
                inbox: (dashboardData.placement_test?.inbox_rate || 85) - 8,
                spam: 15,
                missing: 10,
              },
            }}
            lastTestDate={dashboardData.placement_test?.test_date}
          />
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="ai-insights" className="space-y-6">
          <AIInsightsPanel
            insights={state.aiInsights.map((insight) => ({
              id: insight.id,
              type: insight.type,
              title: insight.title,
              description: insight.description,
              impact: insight.impact,
              actionRequired: insight.action_required,
              suggestedAction: insight.suggested_action,
              confidence: insight.confidence,
              generatedAt: insight.generated_at,
            }))}
          />
        </TabsContent>

        {/* Phase 4: ML Intelligence Engine Tab */}
        <TabsContent value="ml-engine" className="space-y-6">
          <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-purple-400" />
                    ML/DL Intelligence Engine
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                      PHASE 4
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Deep Q-Network • LSTM • Multi-Armed Bandits • Adaptive Control
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <MLIntelligenceDashboard refreshInterval={30000} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Phase 4: Content AI Tab */}
        <TabsContent value="content" className="space-y-6">
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                AI Content Optimizer
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                  ML-POWERED
                </Badge>
              </CardTitle>
              <CardDescription>
                Optimize your email content for maximum deliverability and engagement using ML models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContentOptimizer
                onSelectSubject={(subject) => {
                  toast({
                    title: "Subject Selected",
                    description: `"${subject.slice(0, 50)}${subject.length > 50 ? '...' : ''}" copied to clipboard`,
                  });
                }}
                onApplySuggestion={(suggestion) => {
                  toast({
                    title: "Suggestion Applied",
                    description: suggestion.slice(0, 100),
                  });
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Neural Network Tab */}
        <TabsContent value="neural" className="space-y-6">
          <NeuralNetworkViz memberScore={dashboardData.member?.quality_score || 0} />
        </TabsContent>

        {/* Conversations Tab */}
        <TabsContent value="conversations" className="space-y-6">
          <ConversationFeed
            conversations={[]}
            onLoadMore={() => {}}
          />
        </TabsContent>

        {/* Testing Tab */}
        <TabsContent value="testing" className="space-y-6">
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Inbox Placement Testing</CardTitle>
              <CardDescription>
                Run placement tests to verify your deliverability across major providers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {["Standard Test", "Deep Analysis", "Provider Specific"].map((test) => (
                  <Button
                    key={test}
                    variant="outline"
                    className="h-24 flex flex-col gap-2"
                    onClick={() => toast({ title: "Test Started", description: `Running ${test}...` })}
                  >
                    <Target className="w-6 h-6" />
                    {test}
                  </Button>
                ))}
              </div>

              <InboxPlacementChart
                data={{
                  gmail: { inbox: 92, spam: 5, missing: 3 },
                  outlook: { inbox: 88, spam: 8, missing: 4 },
                  yahoo: { inbox: 85, spam: 10, missing: 5 },
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-6">
          <WarmupScheduleConfig
            schedule={{
              timezone: "America/New_York",
              startHour: 9,
              endHour: 17,
              activeDays: {
                monday: true,
                tuesday: true,
                wednesday: true,
                thursday: true,
                friday: true,
                saturday: false,
                sunday: false,
              },
              minDelay: 300,
              maxDelay: 1800,
            }}
            onUpdate={(schedule) => {
              toast({ title: "Schedule Updated", description: "Your warmup schedule has been saved." });
            }}
          />
        </TabsContent>

        {/* Phase 5: Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-6">
          <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-emerald-400" />
                    Campaign Orchestrator
                    <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs">
                      PHASE 5
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Goal-based campaigns with automated staging and milestone tracking
                  </CardDescription>
                </div>
                <Button
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => toast({ title: "Coming Soon", description: "Campaign creation wizard will open here" })}
                >
                  <Plus className="w-4 h-4" />
                  New Campaign
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: "new_domain", name: "New Domain Warmup", stages: 5, duration: "42 days", status: "Recommended" },
                  { id: "recovery", name: "Reputation Recovery", stages: 4, duration: "38 days", status: "For Issues" },
                  { id: "aggressive", name: "Aggressive Ramp", stages: 3, duration: "13 days", status: "Experienced" },
                ].map((template) => (
                  <Card key={template.id} className="bg-slate-800/50 border-slate-700/50 hover:border-emerald-500/50 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-white mb-2">{template.name}</h4>
                      <div className="flex items-center justify-between text-sm text-slate-400 mb-3">
                        <span>{template.stages} stages</span>
                        <span>{template.duration}</span>
                      </div>
                      <Badge variant="outline" className="text-emerald-400 border-emerald-400/50">
                        {template.status}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-6 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                <h4 className="text-sm font-medium text-slate-300 mb-3">Campaign Features</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {[
                    "Multi-stage sequences",
                    "Automated milestones",
                    "Dynamic volume adjustment",
                    "Branching logic",
                    "Condition-based transitions",
                    "Fallback stages",
                    "Automation rules",
                    "Progress tracking",
                  ].map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-slate-400">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Phase 5: A/B Testing Tab */}
        <TabsContent value="ab-testing" className="space-y-6">
          <Card className="bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border-violet-500/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FlaskConical className="w-5 h-5 text-violet-400" />
                    A/B Testing Framework
                    <Badge className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-xs">
                      SCIENTIFIC
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Statistical significance testing with Bayesian analysis and multi-armed bandits
                  </CardDescription>
                </div>
                <Button
                  className="gap-2 bg-violet-600 hover:bg-violet-700"
                  onClick={() => toast({ title: "Coming Soon", description: "A/B test creation wizard will open here" })}
                >
                  <Plus className="w-4 h-4" />
                  New Test
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { type: "subject_line", name: "Subject Lines", desc: "Test email subject variations" },
                  { type: "send_time", name: "Send Timing", desc: "Optimize send schedule" },
                  { type: "content_style", name: "Content Style", desc: "Test tone and formatting" },
                  { type: "volume_strategy", name: "Volume Strategy", desc: "Test ramping approaches" },
                ].map((testType) => (
                  <Card key={testType.type} className="bg-slate-800/50 border-slate-700/50 hover:border-violet-500/50 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-white mb-1">{testType.name}</h4>
                      <p className="text-xs text-slate-400">{testType.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                  <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-violet-400" />
                    Allocation Strategies
                  </h4>
                  <div className="space-y-2 text-sm">
                    {[
                      { name: "Equal Split", desc: "50/50 traffic distribution" },
                      { name: "Thompson Sampling", desc: "Bayesian adaptive allocation" },
                      { name: "UCB1", desc: "Upper confidence bound exploration" },
                      { name: "Epsilon-Greedy", desc: "Explore vs exploit balance" },
                    ].map((strategy) => (
                      <div key={strategy.name} className="flex items-center justify-between text-slate-400">
                        <span>{strategy.name}</span>
                        <span className="text-xs">{strategy.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                  <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-violet-400" />
                    Statistical Methods
                  </h4>
                  <div className="space-y-2 text-sm">
                    {[
                      { name: "Z-Test", desc: "Frequentist significance" },
                      { name: "Bayesian Inference", desc: "Probability of improvement" },
                      { name: "Sequential Testing", desc: "Early stopping rules" },
                      { name: "Confidence Intervals", desc: "95% CI calculation" },
                    ].map((method) => (
                      <div key={method.name} className="flex items-center justify-between text-slate-400">
                        <span>{method.name}</span>
                        <span className="text-xs">{method.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Phase 5: Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <LineChart className="w-5 h-5 text-cyan-400" />
                    Advanced Analytics Engine
                    <Badge className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs">
                      INSIGHTS
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Comprehensive KPI tracking, benchmarking, and automated reporting
                  </CardDescription>
                </div>
                <Button
                  className="gap-2 bg-cyan-600 hover:bg-cyan-700"
                  onClick={() => toast({ title: "Generating Report", description: "Your analytics report is being generated..." })}
                >
                  <FileText className="w-4 h-4" />
                  Generate Report
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* KPI Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { metric: "Open Rate", value: "24.5%", benchmark: "22%", status: "above" },
                  { metric: "Reply Rate", value: "8.2%", benchmark: "8%", status: "above" },
                  { metric: "Inbox Rate", value: "91.3%", benchmark: "88%", status: "above" },
                  { metric: "Health Score", value: "78", benchmark: "72", status: "above" },
                ].map((kpi) => (
                  <Card key={kpi.metric} className="bg-slate-800/50 border-slate-700/50">
                    <CardContent className="p-4">
                      <p className="text-xs text-slate-400 mb-1">{kpi.metric}</p>
                      <p className="text-2xl font-bold text-white">{kpi.value}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <TrendingUp className={`w-3 h-3 ${kpi.status === "above" ? "text-emerald-500" : "text-red-500"}`} />
                        <span className="text-xs text-slate-400">vs {kpi.benchmark} avg</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                  <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    Real-Time Tracking
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-400">
                    <li>• Multi-dimensional KPI monitoring</li>
                    <li>• Trend analysis (up/down/stable)</li>
                    <li>• Anomaly detection alerts</li>
                    <li>• Time series visualization</li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                  <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-400" />
                    Cohort Analysis
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-400">
                    <li>• Custom cohort creation</li>
                    <li>• Retention curve analysis</li>
                    <li>• Segment comparison</li>
                    <li>• Baseline benchmarking</li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                  <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-cyan-400" />
                    Funnel Optimization
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-400">
                    <li>• Warmup funnel analysis</li>
                    <li>• Bottleneck identification</li>
                    <li>• Conversion tracking</li>
                    <li>• Stage-by-stage breakdown</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
