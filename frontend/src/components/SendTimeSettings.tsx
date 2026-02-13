"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  Calendar,
  TrendingUp,
  Zap,
  Target,
  Globe,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  RefreshCw,
  BarChart3,
  Loader2,
  Building2,
  Timer,
  Sparkles,
  CalendarDays,
  MapPin,
  Briefcase,
  Coffee,
  MessageSquare,
  ArrowRight,
  Star,
  ChevronRight,
  Info,
  Sun,
  Moon,
} from "lucide-react";
import { toast } from "sonner";
import {
  sendTimeAPI,
  type IndustryInfo,
  type OptimalTimeResponse,
  type WeeklySlot,
  type ScheduledEmail,
  type SendTimePreferences,
  type CountryInfo,
  type CountryOptimalTimeResponse,
  type CountryWeeklySlot,
  type CountryQuickCheckResponse,
} from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

export function SendTimeSettings() {
  const [loading, setLoading] = useState(true);
  const [industries, setIndustries] = useState<IndustryInfo[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState<string>("default");
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [optimalTime, setOptimalTime] = useState<OptimalTimeResponse | null>(null);
  const [weeklySlots, setWeeklySlots] = useState<WeeklySlot[]>([]);
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([]);
  const [preferences, setPreferences] = useState<SendTimePreferences | null>(null);
  const [stats, setStats] = useState<{
    user_stats: { pending: number; sent: number; cancelled: number; failed: number };
    system_stats: { pending: number; due_now: number; sent_today: number; failed_today: number };
  } | null>(null);
  const [checkingNow, setCheckingNow] = useState(false);
  const [quickCheckResult, setQuickCheckResult] = useState<{ should_send_now: boolean; reason: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Country-specific state
  const [countries, setCountries] = useState<CountryInfo[]>([]);
  const [countryOptimalTime, setCountryOptimalTime] = useState<CountryOptimalTimeResponse | null>(null);
  const [countrySchedule, setCountrySchedule] = useState<CountryWeeklySlot[]>([]);
  const [countryQuickCheck, setCountryQuickCheck] = useState<CountryQuickCheckResponse | null>(null);
  const [countryLoading, setCountryLoading] = useState(false);
  const [activeView, setActiveView] = useState<"industry" | "country">("country");

  // Define loadData first so other functions can reference it
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: industriesData } = await sendTimeAPI.getIndustries();
      setIndustries(industriesData || []);

      try {
        const { data: countriesData } = await sendTimeAPI.getCountries();
        setCountries(countriesData || []);
      } catch {
        // Countries API may not be available
      }

      try {
        const { data: prefsData } = await sendTimeAPI.getPreferences();
        setPreferences(prefsData);
        if (prefsData.default_industry) {
          setSelectedIndustry(prefsData.default_industry);
        }
      } catch {
        // No preferences found, using defaults
      }

      try {
        const { data: scheduledData } = await sendTimeAPI.getScheduledEmails();
        setScheduledEmails(scheduledData || []);
      } catch {
        // Scheduled emails may not exist
      }

      try {
        const { data: statsData } = await sendTimeAPI.getStats();
        setStats(statsData);
      } catch {
        // Stats may not be available
      }
    } catch {
      toast.error("Failed to load send time data");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadOptimalTime = useCallback(async (industry: string, country: string) => {
    try {
      const { data } = await sendTimeAPI.getOptimalTime({
        industry,
        recipient_country: country || undefined,
      });
      setOptimalTime(data);
    } catch {
      // Error loading optimal time
    }
  }, []);

  const loadWeeklySlots = useCallback(async (industry: string, country: string) => {
    try {
      const { data } = await sendTimeAPI.getWeeklySchedule({
        industry,
        recipient_country: country || undefined,
        max_slots: 10,
      });
      setWeeklySlots(data || []);
    } catch {
      // Error loading weekly slots
    }
  }, []);

  const loadCountryData = useCallback(async (country: string, industry: string) => {
    if (!country) return;

    setCountryLoading(true);
    try {
      const { data: optimalData } = await sendTimeAPI.getCountryOptimalTime({
        country,
        industry,
      });
      setCountryOptimalTime(optimalData);

      const { data: scheduleData } = await sendTimeAPI.getCountrySchedule(country, 10);
      setCountrySchedule(scheduleData || []);

      const { data: quickData } = await sendTimeAPI.countryQuickCheck(country, 2);
      setCountryQuickCheck(quickData);
    } catch {
      toast.error("Failed to load country data");
    } finally {
      setCountryLoading(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load industry-specific data when selection changes
  useEffect(() => {
    if (selectedIndustry && activeView === "industry") {
      loadOptimalTime(selectedIndustry, selectedCountry);
      loadWeeklySlots(selectedIndustry, selectedCountry);
    }
  }, [selectedIndustry, selectedCountry, activeView, loadOptimalTime, loadWeeklySlots]);

  // Load country-specific data when selection changes
  useEffect(() => {
    if (selectedCountry && activeView === "country") {
      loadCountryData(selectedCountry, selectedIndustry);
    }
  }, [selectedCountry, selectedIndustry, activeView, loadCountryData]);

  const handleQuickCheck = async () => {
    setCheckingNow(true);
    try {
      if (activeView === "country" && selectedCountry) {
        const { data } = await sendTimeAPI.countryQuickCheck(selectedCountry, 2);
        setCountryQuickCheck(data);
        if (data.should_send_now) {
          toast.success(`${data.flag} ${data.recommendation}`);
        } else {
          toast.info(data.reason);
        }
      } else {
        const { data } = await sendTimeAPI.quickCheck({
          industry: selectedIndustry,
          recipient_country: selectedCountry || undefined,
          tolerance_hours: preferences?.tolerance_hours || 2,
        });
        setQuickCheckResult(data);

        if (data.should_send_now) {
          toast.success("Now is a good time to send!");
        } else {
          toast.info(data.reason);
        }
      }
    } catch (error) {
      console.error("Error checking time:", error);
      toast.error("Failed to check optimal time");
    } finally {
      setCheckingNow(false);
    }
  };

  const handleCancelScheduled = async (id: number) => {
    try {
      await sendTimeAPI.cancelScheduledEmail(id);
      toast.success("Scheduled email cancelled");
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to cancel");
    }
  };

  const handleUpdatePreferences = async (updates: Partial<SendTimePreferences>) => {
    setActionLoading(true);
    try {
      const { data } = await sendTimeAPI.updatePreferences(updates);
      setPreferences(data.preferences);
      toast.success("Preferences updated");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to update preferences");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "sent":
        return "bg-green-500";
      case "cancelled":
        return "bg-gray-500";
      case "failed":
        return "bg-red-500";
      default:
        return "bg-blue-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "sent":
        return <CheckCircle className="w-4 h-4" />;
      case "cancelled":
        return <XCircle className="w-4 h-4" />;
      case "failed":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getIndustryIcon = (industry: string) => {
    switch (industry) {
      case "tech":
        return <Zap className="w-5 h-5" />;
      case "finance":
        return <TrendingUp className="w-5 h-5" />;
      case "healthcare":
        return <Target className="w-5 h-5" />;
      default:
        return <Building2 className="w-5 h-5" />;
    }
  };

  // Get region color for country cards
  const getRegionColor = (country: string) => {
    const europeCountries = ["Germany", "France", "UK", "Switzerland", "Ireland", "Denmark", "Poland", "Luxembourg"];
    const asiaCountries = ["Singapore", "India", "Dubai", "UAE"];
    const americasCountries = ["USA"];
    const oceaniaCountries = ["Australia"];

    if (europeCountries.includes(country)) return "from-blue-500 to-indigo-600";
    if (asiaCountries.includes(country)) return "from-amber-500 to-orange-600";
    if (americasCountries.includes(country)) return "from-red-500 to-rose-600";
    if (oceaniaCountries.includes(country)) return "from-emerald-500 to-teal-600";
    return "from-purple-500 to-pink-600";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with View Toggle */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
            Send Time Optimization
          </h2>
          <p className="text-slate-400 mt-1">
            Send emails at the optimal time for maximum open rates
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 p-1 glass rounded-xl">
          <Button
            variant={activeView === "country" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveView("country")}
            className={activeView === "country"
              ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white"
              : "text-slate-400 hover:text-white"}
          >
            <Globe className="w-4 h-4 mr-2" />
            By Country
          </Button>
          <Button
            variant={activeView === "industry" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveView("industry")}
            className={activeView === "industry"
              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
              : "text-slate-400 hover:text-white"}
          >
            <Building2 className="w-4 h-4 mr-2" />
            By Industry
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <Card className="glass border-blue-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <Badge variant="outline" className="border-blue-500 text-blue-400">
                  Pending
                </Badge>
              </div>
              <div className="text-2xl font-bold text-white">
                {stats.user_stats.pending}
              </div>
              <p className="text-sm text-slate-400">Scheduled Emails</p>
            </CardContent>
          </Card>

          <Card className="glass border-green-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <Badge variant="outline" className="border-green-500 text-green-400">
                  Success
                </Badge>
              </div>
              <div className="text-2xl font-bold text-white">
                {stats.user_stats.sent}
              </div>
              <p className="text-sm text-slate-400">Sent at Optimal Time</p>
            </CardContent>
          </Card>

          <Card className="glass border-yellow-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Timer className="w-5 h-5 text-yellow-400" />
                <Badge variant="outline" className="border-yellow-500 text-yellow-400">
                  Today
                </Badge>
              </div>
              <div className="text-2xl font-bold text-white">
                {stats.system_stats.sent_today}
              </div>
              <p className="text-sm text-slate-400">Sent Today</p>
            </CardContent>
          </Card>

          <Card className="glass border-purple-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <Badge variant="outline" className="border-purple-500 text-purple-400">
                  Boost
                </Badge>
              </div>
              <div className="text-2xl font-bold text-white">
                {countryOptimalTime?.expected_boost || optimalTime?.expected_boost || "+20%"}
              </div>
              <p className="text-sm text-slate-400">Expected Open Rate</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Country View */}
      {activeView === "country" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Country Selection Grid */}
          <Card className="glass border-slate-700">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Select Recipient Country</h3>
                  <p className="text-sm text-slate-400">Choose where your recipient is located for optimized send times</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
                {countries.map((country, idx) => (
                  <motion.div
                    key={country.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    whileHover={{ scale: 1.05, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedCountry(country.name)}
                    className={`relative cursor-pointer rounded-xl p-4 transition-all duration-300 ${
                      selectedCountry === country.name
                        ? "ring-2 ring-cyan-400 shadow-lg shadow-cyan-500/20"
                        : "hover:ring-1 hover:ring-slate-600"
                    }`}
                    style={{
                      background: selectedCountry === country.name
                        ? `linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(59, 130, 246, 0.15))`
                        : "rgba(15, 23, 42, 0.6)",
                    }}
                  >
                    {/* Flag & Name */}
                    <div className="text-center">
                      <span className="text-3xl mb-2 block">{country.flag}</span>
                      <p className="text-sm font-medium text-white truncate">{country.name}</p>
                      <p className="text-xs text-slate-400">{country.expected_boost}</p>
                    </div>

                    {/* Selection Indicator */}
                    {selectedCountry === country.name && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 p-1 bg-cyan-500 rounded-full"
                      >
                        <CheckCircle className="w-3 h-3 text-white" />
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Country Details */}
          {selectedCountry && countryOptimalTime && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Country Insights Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card className={`relative overflow-hidden border-0`}>
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${getRegionColor(selectedCountry)} opacity-10`} />

                  <CardHeader className="relative">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{countryOptimalTime.flag}</span>
                        <div>
                          <h3 className="text-xl font-bold text-white">{selectedCountry}</h3>
                          <p className="text-sm text-slate-400">{countryOptimalTime.timezone}</p>
                        </div>
                      </div>
                      <Badge className={`bg-gradient-to-r ${getRegionColor(selectedCountry)} text-white border-0 text-lg px-3 py-1`}>
                        {countryOptimalTime.expected_boost}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="relative space-y-4">
                    {/* Quick Check Result */}
                    {countryQuickCheck && (
                      <div className={`p-4 rounded-xl border ${
                        countryQuickCheck.should_send_now
                          ? "border-green-500/50 bg-green-500/10"
                          : "border-amber-500/50 bg-amber-500/10"
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {countryQuickCheck.should_send_now ? (
                              <CheckCircle className="w-5 h-5 text-green-400" />
                            ) : (
                              <Clock className="w-5 h-5 text-amber-400" />
                            )}
                            <span className={`font-bold ${
                              countryQuickCheck.should_send_now ? "text-green-400" : "text-amber-400"
                            }`}>
                              {countryQuickCheck.recommendation}
                            </span>
                          </div>
                          {!countryQuickCheck.should_send_now && countryQuickCheck.wait_hours && (
                            <Badge variant="outline" className="border-amber-500 text-amber-400">
                              Wait {countryQuickCheck.wait_hours}h
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-300 mt-2">{countryQuickCheck.reason}</p>
                      </div>
                    )}

                    {/* Work Culture */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 glass rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Briefcase className="w-4 h-4 text-blue-400" />
                          <span className="text-xs text-slate-400">Work Hours</span>
                        </div>
                        <p className="text-sm text-white font-medium">{countryOptimalTime.work_hours}</p>
                      </div>
                      <div className="p-3 glass rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Coffee className="w-4 h-4 text-amber-400" />
                          <span className="text-xs text-slate-400">Lunch Break</span>
                        </div>
                        <p className="text-sm text-white font-medium">{countryOptimalTime.lunch_time}</p>
                      </div>
                    </div>

                    {/* Culture Insights */}
                    <div className="p-3 glass rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-purple-400" />
                        <span className="text-xs text-slate-400">Work Culture</span>
                      </div>
                      <p className="text-sm text-slate-300">{countryOptimalTime.work_culture}</p>
                    </div>

                    <div className="p-3 glass rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Send className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs text-slate-400">Email Culture</span>
                      </div>
                      <p className="text-sm text-slate-300">{countryOptimalTime.email_culture}</p>
                    </div>

                    {/* Best Days & Hours */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 glass rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-green-400" />
                          <span className="text-xs text-slate-400">Best Days</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {countryOptimalTime.best_days?.map(day => (
                            <Badge key={day} variant="outline" className="border-green-500/50 text-green-400 text-xs">
                              {day.slice(0, 3)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="p-3 glass rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-cyan-400" />
                          <span className="text-xs text-slate-400">Response Time</span>
                        </div>
                        <p className="text-sm text-white font-medium">{countryOptimalTime.response_time}</p>
                      </div>
                    </div>

                    {/* Primary Hours */}
                    <div className="p-3 glass rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Sun className="w-4 h-4 text-yellow-400" />
                        <span className="text-xs text-slate-400">Primary Hours (Best)</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {countryOptimalTime.primary_hours?.map(hour => (
                          <Badge key={hour} className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                            {hour}:00
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Secondary Hours */}
                    <div className="p-3 glass rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Moon className="w-4 h-4 text-blue-400" />
                        <span className="text-xs text-slate-400">Secondary Hours</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {countryOptimalTime.secondary_hours?.map(hour => (
                          <Badge key={hour} variant="outline" className="border-blue-500/50 text-blue-400">
                            {hour}:00
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Quick Check Button */}
                    <Button
                      onClick={handleQuickCheck}
                      disabled={checkingNow}
                      className={`w-full bg-gradient-to-r ${getRegionColor(selectedCountry)} hover:opacity-90`}
                    >
                      {checkingNow ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Zap className="w-4 h-4 mr-2" />
                      )}
                      Check If Now Is Optimal for {selectedCountry}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Country Weekly Schedule */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card className="glass border-slate-700 h-full">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-purple-400" />
                      <h3 className="text-xl font-bold text-white">Weekly Schedule</h3>
                    </div>
                    <p className="text-sm text-slate-400">
                      Best times for {selectedCountry} in the next 7 days
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                      {countryLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                        </div>
                      ) : countrySchedule.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                          <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No schedule available</p>
                        </div>
                      ) : (
                        countrySchedule.map((slot, idx) => (
                          <motion.div
                            key={`${slot.date}-${slot.hour}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`p-3 rounded-lg border transition-all ${
                              slot.is_primary
                                ? "border-yellow-500/50 bg-yellow-500/10"
                                : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="text-center min-w-[60px]">
                                  <p className="text-xs text-slate-500">{slot.day}</p>
                                  <p className="text-lg font-bold text-white">{slot.time}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-white">{slot.datetime_local}</p>
                                  <p className="text-xs text-slate-400">{slot.timezone}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge
                                  className={
                                    slot.is_primary
                                      ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0"
                                      : "bg-slate-700 text-slate-300 border-0"
                                  }
                                >
                                  {slot.expected_boost}
                                </Badge>
                                <p className={`text-xs mt-1 ${
                                  slot.is_primary ? "text-yellow-400" : "text-slate-500"
                                }`}>
                                  {slot.slot_type || (slot.is_primary ? "Primary" : "Secondary")}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}

          {/* No Country Selected */}
          {!selectedCountry && (
            <Card className="glass border-slate-700">
              <CardContent className="py-12 text-center">
                <Globe className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                <h3 className="text-xl font-bold text-white mb-2">Select a Country</h3>
                <p className="text-slate-400 max-w-md mx-auto">
                  Choose your recipient's country above to see optimized send times,
                  work culture insights, and the best hours to reach them.
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}

      {/* Industry View */}
      {activeView === "industry" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Optimal Time Calculator */}
            <Card className="glass border-slate-700">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <h3 className="text-xl font-bold text-white">Optimal Time Calculator</h3>
                </div>
                <p className="text-sm text-slate-400">Find the best time to send your emails</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Industry Selection */}
                <div className="space-y-2">
                  <Label className="text-white">Target Industry</Label>
                  <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((industry) => (
                        <SelectItem key={industry.value} value={industry.value}>
                          <div className="flex items-center gap-2">
                            {getIndustryIcon(industry.value)}
                            <span>{industry.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Country Selection */}
                <div className="space-y-2">
                  <Label className="text-white">Recipient Country (Optional)</Label>
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue placeholder="Select country for timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Auto-detect</SelectItem>
                      {countries.map(country => (
                        <SelectItem key={country.name} value={country.name}>
                          <div className="flex items-center gap-2">
                            <span>{country.flag}</span>
                            <span>{country.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Optimal Time Result */}
                {optimalTime && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="glass p-4 rounded-lg border border-blue-500/30"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <h4 className="font-bold text-white">Next Optimal Time</h4>
                      </div>
                      {optimalTime.is_now_optimal ? (
                        <Badge className="bg-green-500">Send Now!</Badge>
                      ) : (
                        <Badge variant="outline" className="border-yellow-500 text-yellow-400">
                          Wait {optimalTime.wait_hours}h
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-white">
                        {optimalTime.send_at_local}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <Globe className="w-4 h-4" />
                          {optimalTime.timezone}
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4 text-green-400" />
                          {optimalTime.expected_boost}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        {optimalTime.reason}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Quick Check Button */}
                <Button
                  onClick={handleQuickCheck}
                  disabled={checkingNow}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                >
                  {checkingNow ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4 mr-2" />
                  )}
                  Quick Check: Should I Send Now?
                </Button>

                {/* Quick Check Result */}
                {quickCheckResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg border ${
                      quickCheckResult.should_send_now
                        ? "border-green-500/50 bg-green-500/10"
                        : "border-yellow-500/50 bg-yellow-500/10"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {quickCheckResult.should_send_now ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <Clock className="w-5 h-5 text-yellow-400" />
                      )}
                      <span className={quickCheckResult.should_send_now ? "text-green-400" : "text-yellow-400"}>
                        {quickCheckResult.should_send_now ? "Yes! Now is a good time" : "Not optimal right now"}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mt-2">{quickCheckResult.reason}</p>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            {/* Weekly Schedule */}
            <Card className="glass border-slate-700">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-purple-400" />
                  <h3 className="text-xl font-bold text-white">Weekly Schedule</h3>
                </div>
                <p className="text-sm text-slate-400">Best times for the next 7 days</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                  <AnimatePresence>
                    {weeklySlots.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">
                        <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Select an industry to see optimal times</p>
                      </div>
                    ) : (
                      weeklySlots.map((slot, idx) => (
                        <motion.div
                          key={`${slot.date}-${slot.hour}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={`p-3 rounded-lg border transition-colors ${
                            slot.is_primary
                              ? "border-purple-500/50 bg-purple-500/10"
                              : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="text-center min-w-[60px]">
                                <p className="text-xs text-slate-500">{slot.day}</p>
                                <p className="text-lg font-bold text-white">{slot.time}</p>
                              </div>
                              <div>
                                <p className="text-sm text-white">{slot.datetime_local}</p>
                                <p className="text-xs text-slate-400">{slot.timezone}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge
                                variant="outline"
                                className={
                                  slot.is_primary
                                    ? "border-purple-500 text-purple-400"
                                    : "border-slate-600 text-slate-400"
                                }
                              >
                                {slot.expected_boost}
                              </Badge>
                              {slot.is_primary && (
                                <p className="text-xs text-purple-400 mt-1">Primary</p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Industry Info Cards */}
          <Card className="glass border-slate-700">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-xl font-bold text-white">Industry Best Practices</h3>
              </div>
              <p className="text-sm text-slate-400">Research-backed optimal times by industry (2025)</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {industries.slice(0, 6).map((industry) => (
                  <motion.div
                    key={industry.value}
                    whileHover={{ scale: 1.02 }}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedIndustry === industry.value
                        ? "border-cyan-500 bg-cyan-500/10"
                        : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                    }`}
                    onClick={() => setSelectedIndustry(industry.value)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {getIndustryIcon(industry.value)}
                      <h4 className="font-bold text-white">{industry.label}</h4>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-400">
                        <span className="text-cyan-400">Days:</span> {industry.best_days.join(", ")}
                      </p>
                      <p className="text-xs text-slate-400">
                        <span className="text-cyan-400">Hours:</span>{" "}
                        {industry.best_hours.map((h) => `${h}:00`).join(", ")}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">{industry.reason}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Common Sections - Scheduled Emails & Preferences */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scheduled Emails */}
        <Card className="glass border-slate-700">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-teal-400" />
              <h3 className="text-xl font-bold text-white">Scheduled Emails</h3>
            </div>
            <p className="text-sm text-slate-400">Emails waiting to be sent at optimal times</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
              <AnimatePresence>
                {scheduledEmails.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Send className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No scheduled emails</p>
                    <p className="text-xs">Schedule emails from the Applications page</p>
                  </div>
                ) : (
                  scheduledEmails.map((email, idx) => (
                    <motion.div
                      key={email.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-4 glass rounded-lg border border-slate-700 hover:border-teal-500/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={getStatusColor(email.status)}>
                          {getStatusIcon(email.status)}
                          <span className="ml-1 capitalize">{email.status}</span>
                        </Badge>
                        {email.status === "pending" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCancelScheduled(email.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm text-white">
                          Application #{email.application_id}
                        </p>
                        <p className="text-xs text-slate-400">
                          Scheduled: {new Date(email.scheduled_for).toLocaleString()}
                        </p>
                        {email.expected_boost && (
                          <p className="text-xs text-green-400">
                            Expected: {email.expected_boost}
                          </p>
                        )}
                        {email.reason && (
                          <p className="text-xs text-slate-500">{email.reason}</p>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="glass border-slate-700">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-400" />
              <h3 className="text-xl font-bold text-white">Preferences</h3>
            </div>
            <p className="text-sm text-slate-400">Customize your send time optimization</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Auto Schedule Toggle */}
            <div className="flex items-center justify-between p-4 glass rounded-lg border border-slate-700">
              <div>
                <Label className="text-white font-medium">Auto Schedule</Label>
                <p className="text-xs text-slate-400">
                  Automatically schedule emails for optimal times
                </p>
              </div>
              <Switch
                checked={preferences?.auto_schedule_enabled ?? true}
                onCheckedChange={(checked) =>
                  handleUpdatePreferences({ auto_schedule_enabled: checked })
                }
                disabled={actionLoading}
              />
            </div>

            {/* Prefer Morning */}
            <div className="flex items-center justify-between p-4 glass rounded-lg border border-slate-700">
              <div>
                <Label className="text-white font-medium">Prefer Morning</Label>
                <p className="text-xs text-slate-400">
                  Prioritize morning slots (8am-12pm)
                </p>
              </div>
              <Switch
                checked={preferences?.prefer_morning ?? true}
                onCheckedChange={(checked) =>
                  handleUpdatePreferences({ prefer_morning: checked, prefer_afternoon: !checked })
                }
                disabled={actionLoading}
              />
            </div>

            {/* Avoid Mondays */}
            <div className="flex items-center justify-between p-4 glass rounded-lg border border-slate-700">
              <div>
                <Label className="text-white font-medium">Avoid Mondays</Label>
                <p className="text-xs text-slate-400">
                  Skip Mondays (busy catch-up day)
                </p>
              </div>
              <Switch
                checked={preferences?.avoid_mondays ?? true}
                onCheckedChange={(checked) =>
                  handleUpdatePreferences({ avoid_mondays: checked })
                }
                disabled={actionLoading}
              />
            </div>

            {/* Avoid Fridays */}
            <div className="flex items-center justify-between p-4 glass rounded-lg border border-slate-700">
              <div>
                <Label className="text-white font-medium">Avoid Fridays</Label>
                <p className="text-xs text-slate-400">
                  Skip Fridays (low engagement)
                </p>
              </div>
              <Switch
                checked={preferences?.avoid_fridays ?? true}
                onCheckedChange={(checked) =>
                  handleUpdatePreferences({ avoid_fridays: checked })
                }
                disabled={actionLoading}
              />
            </div>

            {/* Tolerance Hours */}
            <div className="p-4 glass rounded-lg border border-slate-700">
              <Label className="text-white font-medium">Tolerance Hours</Label>
              <p className="text-xs text-slate-400 mb-3">
                How far from optimal time is acceptable
              </p>
              <Select
                value={String(preferences?.tolerance_hours ?? 2)}
                onValueChange={(value) =>
                  handleUpdatePreferences({ tolerance_hours: parseInt(value) })
                }
              >
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 hour</SelectItem>
                  <SelectItem value="2">2 hours (Recommended)</SelectItem>
                  <SelectItem value="3">3 hours</SelectItem>
                  <SelectItem value="4">4 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Refresh Button */}
            <Button
              onClick={loadData}
              variant="outline"
              className="w-full border-slate-600"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
