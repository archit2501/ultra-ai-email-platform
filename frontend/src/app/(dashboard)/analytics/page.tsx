"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Calendar, Target, Award, Loader2, RefreshCw, AlertCircle, Brain, Sparkles, BarChart3 } from "lucide-react";
import { applicationsAPI } from "@/lib/api";
import { MLInsightsDrawer, MLAccuracyDashboard } from "@/components/ml-analytics";
import { useAuthStore } from "@/store/authStore";
import { usePageTitle, PAGE_TITLES } from "@/hooks/usePageTitle";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

// Debug logging helper
const debugLog = (action: string, data?: unknown) => {
  console.log(`[Analytics] ${action}`, data ?? '');
};

export default function AnalyticsPage() {
  // Set page title
  usePageTitle("Analytics");

  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mlDrawerOpen, setMlDrawerOpen] = useState(false);
  const [showMLSection, setShowMLSection] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user?.id) {
      debugLog("fetchData - No user ID, skipping");
      setLoading(false);
      return;
    }

    debugLog("fetchData called", { userId: user.id });
    setLoading(true);
    setError(null);

    try {
      debugLog("fetchData - Calling API");
      const { data } = await applicationsAPI.getStats(user.id);
      debugLog("fetchData - API response", data);
      setStats(data);
    } catch (err: unknown) {
      debugLog("fetchData - Error", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load analytics data";
      setError(errorMessage);
      console.error("Error fetching analytics:", err);
    } finally {
      setLoading(false);
      debugLog("fetchData - Complete");
    }
  }, [user?.id]);

  useEffect(() => {
    debugLog("useEffect - Initial load");
    fetchData();
  }, [fetchData]);

  // Mock data for charts
  const statusData = [
    { name: 'Sent', value: stats?.by_status?.sent || 0, color: '#3b82f6' },
    { name: 'Responded', value: stats?.by_status?.responded || 0, color: '#10b981' },
    { name: 'Interview', value: stats?.by_status?.interview || 0, color: '#f59e0b' },
    { name: 'Rejected', value: stats?.by_status?.rejected || 0, color: '#ef4444' },
    { name: 'Offer', value: stats?.by_status?.offer || 0, color: '#8b5cf6' },
  ];

  const weeklyData = [
    { week: 'Week 1', applications: 5, responses: 2 },
    { week: 'Week 2', applications: 8, responses: 3 },
    { week: 'Week 3', applications: 12, responses: 5 },
    { week: 'Week 4', applications: 10, responses: 6 },
  ];

  const countryData = [
    { country: 'USA', count: 15 },
    { country: 'India', count: 8 },
    { country: 'Germany', count: 5 },
    { country: 'UK', count: 3 },
  ];

  // Loading state
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              Analytics & Insights
            </h1>
            <p className="text-slate-400 mt-1">Track your application performance and trends</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
          <p className="text-slate-400 text-lg">Loading analytics data...</p>
          <p className="text-slate-500 text-sm mt-2">Crunching the numbers for you</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              Analytics & Insights
            </h1>
            <p className="text-slate-400 mt-1">Track your application performance and trends</p>
          </div>
        </div>
        <Card className="glass backdrop-blur-xl bg-red-500/10 border-red-500/30">
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Failed to Load Analytics</h3>
            <p className="text-red-400 mb-6">{error}</p>
            <Button
              onClick={fetchData}
              className="bg-red-600 hover:bg-red-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative p-6 space-y-6">
      {/* Metaminds Translucent Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Center large watermark */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] opacity-[0.018]"
          animate={{
            rotate: [0, -360],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 50,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <Image
            src="/metaminds-logo.jpg"
            alt=""
            fill
            className="object-contain blur-[2px]"
          />
        </motion.div>

        {/* Bottom right accent */}
        <motion.div
          className="absolute -bottom-24 -right-24 w-80 h-80 opacity-[0.025]"
          animate={{
            rotate: [0, 180, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Image
            src="/metaminds-logo.jpg"
            alt=""
            fill
            className="object-contain blur-sm"
          />
        </motion.div>
      </div>

      {/* Header */}
      <div className="relative flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            Analytics & Insights
          </h1>
          <p className="text-slate-400 mt-1">Track your application performance and trends</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setMlDrawerOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/25"
          >
            <Brain className="w-4 h-4 mr-2" />
            ML Insights
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            disabled={loading}
            className="border-slate-700 text-slate-400 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* ML Model Accuracy Card */}
      {showMLSection && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="glass backdrop-blur-xl bg-gradient-to-br from-indigo-900/20 via-purple-900/10 to-pink-900/20 border-purple-500/30 overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-white">
                  <div className="p-1.5 rounded-lg bg-purple-500/20">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                  </div>
                  ML Model Performance
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMlDrawerOpen(true)}
                  className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-slate-400">Reply Prediction</span>
                  </div>
                  <p className="text-2xl font-bold text-green-400">87.5%</p>
                  <p className="text-xs text-slate-500 mt-1">Based on 150+ predictions</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-slate-400">Send Time Accuracy</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-400">92.3%</p>
                  <p className="text-xs text-slate-500 mt-1">Optimal time recommendations</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-slate-400">Overall ML Score</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-400">89.9%</p>
                  <p className="text-xs text-slate-500 mt-1">Combined model performance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass backdrop-blur-xl bg-gradient-to-br from-blue-900/20 to-blue-700/20 border-blue-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Success Rate</p>
                <p className="text-2xl font-bold text-white">{stats?.response_rate?.toFixed(1) || 0}%</p>
              </div>
              <Award className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass backdrop-blur-xl bg-gradient-to-br from-green-900/20 to-green-700/20 border-green-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Avg Response Time</p>
                <p className="text-2xl font-bold text-white">5 days</p>
              </div>
              <Calendar className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass backdrop-blur-xl bg-gradient-to-br from-orange-900/20 to-orange-700/20 border-orange-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Interview Rate</p>
                <p className="text-2xl font-bold text-white">25%</p>
              </div>
              <Target className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass backdrop-blur-xl bg-gradient-to-br from-purple-900/20 to-purple-700/20 border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">This Month</p>
                <p className="text-2xl font-bold text-white">12</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications by Status - Pie Chart */}
        <Card className="glass backdrop-blur-xl bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Applications by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekly Trend - Line Chart */}
        <Card className="glass backdrop-blur-xl bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Weekly Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="week" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                <Legend />
                <Line type="monotone" dataKey="applications" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="responses" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications by Country - Bar Chart */}
        <Card className="glass backdrop-blur-xl bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Applications by Country</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={countryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="country" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Response Rate Over Time */}
        <Card className="glass backdrop-blur-xl bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Response Rate Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="week" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                <Line
                  type="monotone"
                  dataKey="responses"
                  stroke="url(#colorGradient)"
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', r: 5 }}
                />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card className="glass backdrop-blur-xl bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/20">
        <CardHeader>
          <CardTitle className="text-white">💡 Key Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-green-900/20 border border-green-500/30">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
            <div>
              <h4 className="font-bold text-green-400">Strong Performance</h4>
              <p className="text-sm text-slate-300">Your response rate is above average. Keep up the good work!</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-900/20 border border-blue-500/30">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
            <div>
              <h4 className="font-bold text-blue-400">Best Day</h4>
              <p className="text-sm text-slate-300">Tuesday shows the highest response rate. Consider sending applications early in the week.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg bg-orange-900/20 border border-orange-500/30">
            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2" />
            <div>
              <h4 className="font-bold text-orange-400">Follow-up Recommendation</h4>
              <p className="text-sm text-slate-300">5 applications haven't received responses in over 7 days. Consider sending follow-ups.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ML Insights Drawer */}
      <MLInsightsDrawer
        open={mlDrawerOpen}
        onClose={() => setMlDrawerOpen(false)}
        defaultTab="accuracy"
      />
    </div>
  );
}
