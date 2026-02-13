"use client";

/**
 * ML Intelligence Dashboard - Phase 4 GOD TIER Component
 *
 * Visualizes the advanced ML/DL Engine, Adaptive Control, and Optimization systems
 *
 * Features:
 * - Deep Q-Network action visualization
 * - LSTM engagement predictions
 * - Multi-Armed Bandit performance
 * - Anomaly detection alerts
 * - Adaptive throttle controls
 * - Real-time system health
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Brain,
  Zap,
  Activity,
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Cpu,
  Network,
  Target,
  Gauge,
  RefreshCw,
  Play,
  Pause,
  Settings,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import { warmupAPI, type TrainingStats, type AdaptiveDashboard, type OptimizerStatistics } from "@/lib/warmup-api";

// ============================================================================
// Sub-Components
// ============================================================================

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  color?: "blue" | "green" | "yellow" | "red" | "purple";
}

function MetricCard({ title, value, subtitle, icon, trend, trendValue, color = "blue" }: MetricCardProps) {
  const colorClasses = {
    blue: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    green: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    yellow: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    red: "bg-red-500/10 text-red-500 border-red-500/20",
    purple: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  };

  const trendIcons = {
    up: <ArrowUpRight className="w-4 h-4 text-emerald-500" />,
    down: <ArrowDownRight className="w-4 h-4 text-red-500" />,
    neutral: <Minus className="w-4 h-4 text-gray-500" />,
  };

  return (
    <div className={`rounded-xl border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium opacity-80">{title}</span>
        {icon}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && <p className="text-xs opacity-60 mt-1">{subtitle}</p>}
        </div>
        {trend && trendValue && (
          <div className="flex items-center gap-1 text-sm">
            {trendIcons[trend]}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}

function ProgressRing({ value, max = 100, size = 80, strokeWidth = 8, color = "#3b82f6", label }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percent = Math.min(value / max, 1);
  const offset = circumference - percent * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold">{Math.round(percent * 100)}%</span>
        {label && <span className="text-xs text-gray-400">{label}</span>}
      </div>
    </div>
  );
}

interface BanditVisualizationProps {
  arms: Array<{ arm: number; pulls: number; reward_rate?: number; average_reward?: number }>;
  title: string;
  type: "thompson" | "ucb1";
}

function BanditVisualization({ arms, title, type }: BanditVisualizationProps) {
  const maxPulls = Math.max(...arms.map((a) => a.pulls), 1);
  const armLabels = type === "thompson"
    ? ["Professional", "Casual", "Friendly", "Formal", "Creative"]
    : ["6AM", "8AM", "10AM", "12PM", "2PM", "4PM", "6PM", "8PM"];

  return (
    <div className="bg-gray-800/50 rounded-lg p-4">
      <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
        <Target className="w-4 h-4" />
        {title}
      </h4>
      <div className="space-y-2">
        {arms.slice(0, type === "thompson" ? 5 : 8).map((arm, idx) => {
          const rewardValue = arm.reward_rate ?? arm.average_reward ?? 0;
          const pullRatio = arm.pulls / maxPulls;
          return (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-20 truncate">
                {armLabels[idx] || `Arm ${idx}`}
              </span>
              <div className="flex-1 h-4 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${pullRatio * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-300 w-16 text-right">
                {(rewardValue * 100).toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface SystemHealthCardProps {
  status: string;
  service: string;
  details?: Record<string, unknown>;
}

function SystemHealthCard({ status, service, details }: SystemHealthCardProps) {
  const statusColors: Record<string, string> = {
    healthy: "bg-emerald-500",
    degraded: "bg-amber-500",
    critical: "bg-red-500",
    unknown: "bg-gray-500",
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${statusColors[status] || statusColors.unknown}`} />
        <span className="text-sm font-medium">{service}</span>
      </div>
      <span className="text-xs text-gray-400 capitalize">{status}</span>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

interface MLIntelligenceDashboardProps {
  className?: string;
  refreshInterval?: number;
}

export default function MLIntelligenceDashboard({
  className = "",
  refreshInterval = 30000,
}: MLIntelligenceDashboardProps) {
  const [trainingStats, setTrainingStats] = useState<TrainingStats | null>(null);
  const [adaptiveDashboard, setAdaptiveDashboard] = useState<AdaptiveDashboard | null>(null);
  const [optimizerStats, setOptimizerStats] = useState<OptimizerStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"ml" | "adaptive" | "optimizer">("ml");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [training, adaptive, optimizer] = await Promise.all([
        warmupAPI.getTrainingStats().catch(() => null),
        warmupAPI.getAdaptiveDashboard().catch(() => null),
        warmupAPI.getOptimizerStatistics().catch(() => null),
      ]);

      if (training) setTrainingStats(training);
      if (adaptive) setAdaptiveDashboard(adaptive);
      if (optimizer) setOptimizerStats(optimizer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch ML data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchData]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="flex flex-col items-center gap-4">
          <Brain className="w-12 h-12 text-purple-500 animate-pulse" />
          <p className="text-gray-400">Initializing ML Intelligence Engine...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500" />
          <p className="text-gray-400">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Brain className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold">ML Intelligence Engine</h2>
            <p className="text-sm text-gray-400">Phase 4 • DQN + LSTM + Bandits + Adaptive Control</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`p-2 rounded-lg transition-colors ${
              autoRefresh ? "bg-emerald-500/20 text-emerald-500" : "bg-gray-700 text-gray-400"
            }`}
            title={autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
          >
            {autoRefresh ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
          <button
            onClick={fetchData}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            title="Refresh now"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-700 pb-2">
        {[
          { id: "ml" as const, label: "ML Models", icon: <Cpu className="w-4 h-4" /> },
          { id: "adaptive" as const, label: "Adaptive Engine", icon: <Shield className="w-4 h-4" /> },
          { id: "optimizer" as const, label: "Optimizer", icon: <TrendingUp className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
              activeTab === tab.id
                ? "bg-gray-800 text-white border-b-2 border-purple-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ML Models Tab */}
      {activeTab === "ml" && trainingStats && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="DQN Experiences"
              value={trainingStats.dqn.total_experiences.toLocaleString()}
              subtitle="Training samples"
              icon={<Network className="w-5 h-5" />}
              color="purple"
            />
            <MetricCard
              title="Exploration Rate"
              value={`${(trainingStats.dqn.exploration_rate * 100).toFixed(1)}%`}
              subtitle="ε-greedy"
              icon={<Target className="w-5 h-5" />}
              trend={trainingStats.dqn.exploration_rate > 0.1 ? "down" : "neutral"}
              trendValue="Converging"
              color="blue"
            />
            <MetricCard
              title="LSTM Accuracy"
              value={`${(trainingStats.lstm.prediction_accuracy * 100).toFixed(1)}%`}
              subtitle="Engagement prediction"
              icon={<Activity className="w-5 h-5" />}
              color="green"
            />
            <MetricCard
              title="Anomalies Detected"
              value={trainingStats.anomaly_detector.anomalies_detected}
              subtitle={`FP Rate: ${(trainingStats.anomaly_detector.false_positive_rate * 100).toFixed(1)}%`}
              icon={<AlertTriangle className="w-5 h-5" />}
              color="yellow"
            />
          </div>

          {/* Model Details Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* DQN Network */}
            <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Network className="w-5 h-5 text-purple-500" />
                Deep Q-Network (DQN)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Training Iterations</p>
                  <p className="text-xl font-bold">{trainingStats.dqn.training_iterations.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Average Loss</p>
                  <p className="text-xl font-bold">{trainingStats.dqn.average_loss.toFixed(4)}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <ProgressRing
                  value={100 - trainingStats.dqn.exploration_rate * 100}
                  color="#a855f7"
                  label="Exploit"
                />
                <div className="text-right">
                  <p className="text-xs text-gray-400">Last Trained</p>
                  <p className="text-sm">{new Date(trainingStats.dqn.last_trained).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* LSTM Network */}
            <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-500" />
                LSTM Engagement Predictor
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Sequences Processed</p>
                  <p className="text-xl font-bold">{trainingStats.lstm.sequences_processed.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Prediction Accuracy</p>
                  <p className="text-xl font-bold text-emerald-500">
                    {(trainingStats.lstm.prediction_accuracy * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <ProgressRing
                  value={trainingStats.lstm.prediction_accuracy * 100}
                  color="#10b981"
                  label="Accuracy"
                />
                <div className="text-right">
                  <p className="text-xs text-gray-400">Last Trained</p>
                  <p className="text-sm">{new Date(trainingStats.lstm.last_trained).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Content Bandit */}
            <BanditVisualization
              arms={trainingStats.bandits.content_bandit.arm_stats}
              title="Content Style Bandit (Thompson Sampling)"
              type="thompson"
            />

            {/* Timing Bandit */}
            <BanditVisualization
              arms={trainingStats.bandits.timing_bandit.arm_stats}
              title="Send Time Bandit (UCB1)"
              type="ucb1"
            />
          </div>

          {/* Deliverability Model */}
          <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Gradient Boosting Deliverability Model
            </h3>
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Training Samples</p>
                <p className="text-xl font-bold">{trainingStats.deliverability_model.samples_trained.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Validation R²</p>
                <p className="text-xl font-bold text-blue-500">
                  {(trainingStats.deliverability_model.validation_r2 * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Overall Health</p>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm ${
                    trainingStats.overall_health === "healthy"
                      ? "bg-emerald-500/20 text-emerald-500"
                      : trainingStats.overall_health === "degraded"
                      ? "bg-amber-500/20 text-amber-500"
                      : "bg-red-500/20 text-red-500"
                  }`}
                >
                  {trainingStats.overall_health === "healthy" ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  {trainingStats.overall_health}
                </span>
              </div>
            </div>
            {/* Feature Importance */}
            <div>
              <p className="text-xs text-gray-400 mb-2">Feature Importance</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(trainingStats.deliverability_model.feature_importance)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 6)
                  .map(([feature, importance]) => (
                    <span
                      key={feature}
                      className="px-2 py-1 bg-gray-700 rounded text-xs"
                      title={`Importance: ${(importance * 100).toFixed(1)}%`}
                    >
                      {feature}: {(importance * 100).toFixed(0)}%
                    </span>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Adaptive Engine Tab */}
      {activeTab === "adaptive" && adaptiveDashboard && (
        <div className="space-y-6">
          {/* System Health Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="System Health"
              value={`${adaptiveDashboard.system_health.overall_score}%`}
              icon={<Shield className="w-5 h-5" />}
              color={adaptiveDashboard.system_health.overall_score >= 80 ? "green" : adaptiveDashboard.system_health.overall_score >= 50 ? "yellow" : "red"}
            />
            <MetricCard
              title="Active Accounts"
              value={adaptiveDashboard.active_accounts}
              subtitle={`${adaptiveDashboard.throttled_accounts} throttled`}
              icon={<Zap className="w-5 h-5" />}
              color="blue"
            />
            <MetricCard
              title="Signals Today"
              value={adaptiveDashboard.total_signals_today.toLocaleString()}
              icon={<Activity className="w-5 h-5" />}
              color="purple"
            />
            <MetricCard
              title="ML Predictions"
              value={adaptiveDashboard.ml_predictions_today.toLocaleString()}
              subtitle={`${adaptiveDashboard.optimization_adjustments_today} adjustments`}
              icon={<Brain className="w-5 h-5" />}
              color="purple"
            />
          </div>

          {/* Service Status */}
          <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-blue-500" />
              Service Status
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <SystemHealthCard status={adaptiveDashboard.system_health.ml_engine_status} service="ML Engine" />
              <SystemHealthCard status={adaptiveDashboard.system_health.optimizer_status} service="Optimizer" />
              <SystemHealthCard status={adaptiveDashboard.system_health.adaptive_engine_status} service="Adaptive Engine" />
            </div>
          </div>

          {/* Learning Progress */}
          <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              Learning Progress
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center">
                <ProgressRing
                  value={adaptiveDashboard.learning_progress.dqn_convergence * 100}
                  color="#a855f7"
                  size={100}
                />
                <p className="mt-2 text-sm text-gray-400">DQN Convergence</p>
              </div>
              <div className="flex flex-col items-center">
                <ProgressRing
                  value={adaptiveDashboard.learning_progress.bandit_exploration_balance * 100}
                  color="#3b82f6"
                  size={100}
                />
                <p className="mt-2 text-sm text-gray-400">Bandit Balance</p>
              </div>
              <div className="flex flex-col items-center">
                <ProgressRing
                  value={adaptiveDashboard.learning_progress.anomaly_detection_accuracy * 100}
                  color="#10b981"
                  size={100}
                />
                <p className="mt-2 text-sm text-gray-400">Anomaly Detection</p>
              </div>
            </div>
          </div>

          {/* Alerts & Top Performers */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Reputation Alerts */}
            <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Reputation Alerts
              </h3>
              {adaptiveDashboard.reputation_alerts.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-gray-500">
                  <div className="text-center">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                    <p>No active alerts</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {adaptiveDashboard.reputation_alerts.map((alert, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg ${
                        alert.severity === "critical"
                          ? "bg-red-500/10 border border-red-500/20"
                          : alert.severity === "warning"
                          ? "bg-amber-500/10 border border-amber-500/20"
                          : "bg-blue-500/10 border border-blue-500/20"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{alert.alert_type}</span>
                        <span className="text-xs text-gray-400">{alert.account_id}</span>
                      </div>
                      <p className="text-xs text-gray-300">{alert.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Performers */}
            <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Top Performing Accounts
              </h3>
              <div className="space-y-3">
                {adaptiveDashboard.top_performing_accounts.map((account, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                      <span className="text-sm">{account.account_id}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Health</p>
                        <p className="text-sm font-medium">{account.health_score}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Deliverability</p>
                        <p className="text-sm font-medium">{account.deliverability_score}%</p>
                      </div>
                      {account.trend === "up" ? (
                        <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                      ) : account.trend === "down" ? (
                        <ArrowDownRight className="w-4 h-4 text-red-500" />
                      ) : (
                        <Minus className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Optimizer Tab */}
      {activeTab === "optimizer" && optimizerStats && (
        <div className="space-y-6">
          {/* Volume Optimization */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="Current Volume"
              value={optimizerStats.volume_optimization.current_daily_volume.toLocaleString()}
              subtitle="emails/day"
              icon={<BarChart3 className="w-5 h-5" />}
              color="blue"
            />
            <MetricCard
              title="Recommended"
              value={optimizerStats.volume_optimization.recommended_daily_volume.toLocaleString()}
              subtitle="optimal volume"
              icon={<Target className="w-5 h-5" />}
              color="green"
            />
            <MetricCard
              title="Ramp Rate"
              value={`${(optimizerStats.volume_optimization.ramp_rate * 100).toFixed(1)}%`}
              subtitle="daily increase"
              icon={<TrendingUp className="w-5 h-5" />}
              color="purple"
            />
            <MetricCard
              title="Volume Ceiling"
              value={optimizerStats.volume_optimization.volume_ceiling.toLocaleString()}
              subtitle="max safe volume"
              icon={<Gauge className="w-5 h-5" />}
              color="yellow"
            />
          </div>

          {/* Time Series Forecast */}
          <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              7-Day Forecast (Holt-Winters)
            </h3>
            <div className="flex items-end gap-2 h-32">
              {optimizerStats.time_series.forecast_7d.map((value, idx) => {
                const maxValue = Math.max(...optimizerStats.time_series.forecast_7d);
                const height = (value / maxValue) * 100;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t transition-all duration-500"
                      style={{ height: `${height}%` }}
                      title={`Day ${idx + 1}: ${value.toFixed(0)}`}
                    />
                    <span className="text-xs text-gray-400">D{idx + 1}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center gap-4">
              <span className="text-sm text-gray-400">
                Trend: <span className="text-white capitalize">{optimizerStats.time_series.trend}</span>
              </span>
              <span className="text-sm text-gray-400">
                Seasonality:{" "}
                <span className={optimizerStats.time_series.seasonality_detected ? "text-emerald-500" : "text-gray-500"}>
                  {optimizerStats.time_series.seasonality_detected ? "Detected" : "Not Detected"}
                </span>
              </span>
            </div>
          </div>

          {/* Provider Stats & Load Balancing */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Provider Stats */}
            <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Network className="w-5 h-5 text-purple-500" />
                Provider Optimization
              </h3>
              <div className="space-y-3">
                {Object.entries(optimizerStats.provider_stats).map(([provider, stats]) => (
                  <div key={provider} className="p-3 bg-gray-700/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium capitalize">{provider}</span>
                      <span className="text-sm text-emerald-500">{(stats.success_rate * 100).toFixed(1)}% success</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>Optimal: {stats.optimal_hours.join(", ")}h</span>
                      <span>•</span>
                      <span>Volume: {(stats.volume_multiplier * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Load Balancing */}
            <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Gauge className="w-5 h-5 text-amber-500" />
                Cross-Account Load Balancing
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Active Accounts</p>
                  <p className="text-2xl font-bold">{optimizerStats.load_balancing.active_accounts}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Average Load</p>
                  <p className="text-2xl font-bold">{(optimizerStats.load_balancing.average_load * 100).toFixed(1)}%</p>
                </div>
              </div>
              <div className="p-3 bg-gray-700/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Max Load Account</span>
                  <span className="text-sm">{optimizerStats.load_balancing.max_load_account}</span>
                </div>
              </div>
              {optimizerStats.load_balancing.rebalancing_needed && (
                <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="text-sm text-amber-500">Rebalancing recommended</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
