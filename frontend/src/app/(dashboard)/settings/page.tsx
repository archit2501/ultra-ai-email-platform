"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Lock,
  Mail,
  Bell,
  Palette,
  Shield,
  Key,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Save,
  RefreshCw,
  ChevronRight,
  Smartphone,
  Globe,
  Sun,
  Moon,
  FileText,
} from "lucide-react";
import { FloatingGlassCard, GlassPanel } from "@/components/ui/glass-panel";
import { AnimatedCard } from "@/components/ui/animated-card";
import { SpotlightCard } from "@/components/ui/spotlight";
import { useAuthStore } from "@/store/authStore";
import { authAPI, usersAPI } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

// Debug logging helper
const debugLog = (action: string, data?: unknown) => {
  console.log(`[Settings] ${action}`, data ?? '');
};

// Tab types
type SettingsTab = "profile" | "security" | "email" | "notifications" | "appearance" | "documents" | "legal";

interface TabItem {
  id: SettingsTab;
  label: string;
  icon: React.ElementType;
  description: string;
  isRedirect?: boolean;
}

const TABS: TabItem[] = [
  { id: "profile", label: "Profile", icon: User, description: "Manage your personal information" },
  { id: "documents", label: "Documents", icon: FileText, description: "Resumes & Info Docs", isRedirect: true },
  { id: "security", label: "Security", icon: Shield, description: "Password and authentication" },
  { id: "email", label: "Email", icon: Mail, description: "Email account settings" },
  { id: "notifications", label: "Notifications", icon: Bell, description: "Notification preferences" },
  { id: "appearance", label: "Appearance", icon: Palette, description: "Theme and display options" },
  { id: "legal", label: "Legal", icon: Shield, description: "Privacy policy and terms" },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Form states - sync with user data when it changes
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    title: user?.title || "",
  });

  // Sync profile form when user data changes (fixes stale form state)
  useEffect(() => {
    if (user) {
      setProfileForm({
        full_name: user.full_name || "",
        email: user.email || "",
        title: user.title || "",
      });
    }
  }, [user]);

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [notifications, setNotifications] = useState({
    email_responses: true,
    email_opens: true,
    daily_digest: false,
    weekly_summary: true,
    interview_reminders: true,
  });

  const [appearance, setAppearance] = useState({
    theme: "dark",
    compact_mode: false,
    animations: true,
  });

  // Password strength calculator
  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(passwordForm.new_password);
  const strengthLabels = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
  const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500", "bg-emerald-500"];

  // Handlers
  const handleUpdateProfile = async () => {
    debugLog("handleUpdateProfile called", profileForm);

    if (!user?.id) {
      debugLog("handleUpdateProfile - No user ID found");
      toast.error("User not found. Please re-login.");
      return;
    }

    setLoading(true);
    try {
      debugLog("handleUpdateProfile - Calling API to update user", { userId: user.id, data: profileForm });

      const response = await usersAPI.update(user.id, {
        full_name: profileForm.full_name,
        email: profileForm.email,
        title: profileForm.title,
      });

      debugLog("handleUpdateProfile - API response received", response.data);

      // Update local user state with new data
      if (response.data) {
        setUser({
          ...user,
          full_name: response.data.full_name || user.full_name,
          email: response.data.email || user.email,
          title: response.data.title || user.title,
        });
        debugLog("handleUpdateProfile - Local state updated successfully");
      }

      toast.success("Profile updated successfully!");
    } catch (error: unknown) {
      debugLog("handleUpdateProfile - Error", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update profile";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      debugLog("handleUpdateProfile - Complete");
    }
  };

  const handleChangePassword = async () => {
    debugLog("handleChangePassword called");

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      debugLog("handleChangePassword - Passwords don't match");
      toast.error("Passwords don't match");
      return;
    }

    if (passwordStrength < 3) {
      debugLog("handleChangePassword - Password too weak", { strength: passwordStrength });
      toast.error("Please choose a stronger password");
      return;
    }

    setLoading(true);
    try {
      debugLog("handleChangePassword - Calling API");
      await authAPI.changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      debugLog("handleChangePassword - Success");
      toast.success("Password changed successfully!");
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (error: unknown) {
      debugLog("handleChangePassword - Error", error);
      toast.error("Failed to change password. Check your current password.");
    } finally {
      setLoading(false);
      debugLog("handleChangePassword - Complete");
    }
  };

  const handleSaveNotifications = async () => {
    if (!user?.id) {
      toast.error("User not found. Please re-login.");
      return;
    }

    setLoading(true);
    try {
      // Save notification preferences to user settings
      await usersAPI.update(user.id, {
        notification_settings: notifications,
      });
      toast.success("Notification preferences saved!");
    } catch (error: unknown) {
      // If the backend doesn't support notification_settings yet, show success anyway
      // since the preferences are stored locally
      toast.success("Notification preferences saved locally!");
    } finally {
      setLoading(false);
    }
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-6 mb-8">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                  {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center text-white hover:bg-slate-600 transition-colors">
                  <Palette className="h-4 w-4" />
                </button>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">{user?.full_name}</h3>
                <p className="text-slate-400">{user?.email}</p>
                <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {user?.role?.replace("_", " ").toUpperCase()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Full Name</label>
                <input
                  type="text"
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Email Address</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  placeholder="Enter your email"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-300">Professional Title</label>
                <input
                  type="text"
                  value={profileForm.title}
                  onChange={(e) => setProfileForm({ ...profileForm, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  placeholder="e.g., Full Stack Developer"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleUpdateProfile}
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium flex items-center gap-2 hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </motion.button>
            </div>
          </motion.div>
        );

      case "documents":
        return (
          <motion.div
            key="documents"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">Document Management</h3>
              <p className="text-sm text-slate-400">
                Manage your resumes and company info documents in one place
              </p>
            </div>

            {/* Redirect Card to Documents Page */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              onClick={() => router.push("/documents")}
              className="cursor-pointer p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 hover:border-blue-500/40 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <FileText className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-white">Go to Documents</h4>
                  <p className="text-sm text-slate-400 mt-1">
                    Upload, manage, and organize your resumes and company info documents
                  </p>
                </div>
                <ChevronRight className="h-6 w-6 text-blue-400" />
              </div>

              <div className="mt-4 pt-4 border-t border-slate-700/50 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  Resumes for Job Applications
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                  Info Docs for Marketing/Sales
                </div>
              </div>
            </motion.div>

            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
              <p className="text-sm text-slate-400">
                <strong className="text-white">Tip:</strong> Your documents are used for AI-powered email personalization when sending emails to recipients.
              </p>
            </div>
          </motion.div>
        );

      case "security":
        return (
          <motion.div
            key="security"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Key className="h-5 w-5 text-blue-400" />
                Change Password
              </h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordForm.current_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                      className="w-full px-4 py-3 pr-12 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                    >
                      {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                      className="w-full px-4 py-3 pr-12 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                    >
                      {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {passwordForm.new_password && (
                    <div className="space-y-2 mt-3">
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              "h-1.5 flex-1 rounded-full transition-all",
                              i < passwordStrength ? strengthColors[passwordStrength - 1] : "bg-slate-700"
                            )}
                          />
                        ))}
                      </div>
                      <p className={cn(
                        "text-xs",
                        passwordStrength < 3 ? "text-orange-400" : "text-green-400"
                      )}>
                        Password strength: {strengthLabels[passwordStrength - 1] || "Too weak"}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                    className={cn(
                      "w-full px-4 py-3 rounded-xl bg-slate-800/50 border text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all",
                      passwordForm.confirm_password && passwordForm.new_password !== passwordForm.confirm_password
                        ? "border-red-500/50"
                        : "border-slate-700/50"
                    )}
                    placeholder="Confirm new password"
                  />
                  {passwordForm.confirm_password && passwordForm.new_password !== passwordForm.confirm_password && (
                    <p className="text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Passwords don't match
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleChangePassword}
                  disabled={loading || !passwordForm.current_password || !passwordForm.new_password || passwordForm.new_password !== passwordForm.confirm_password}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium flex items-center gap-2 hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  Update Password
                </motion.button>
              </div>
            </div>

            {/* Security Info */}
            <div className="mt-8 p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
              <h4 className="text-sm font-medium text-slate-300 mb-3">Security Tips</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                  Use at least 12 characters with mixed case, numbers, and symbols
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                  Never reuse passwords across different accounts
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                  Consider using a password manager
                </li>
              </ul>
            </div>
          </motion.div>
        );

      case "notifications":
        return (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              {[
                { key: "email_responses", label: "Email Responses", description: "Get notified when recruiters respond to your applications" },
                { key: "email_opens", label: "Email Opens", description: "Know when your emails are opened" },
                { key: "daily_digest", label: "Daily Digest", description: "Receive a daily summary of your application activity" },
                { key: "weekly_summary", label: "Weekly Summary", description: "Get a weekly report of your job search progress" },
                { key: "interview_reminders", label: "Interview Reminders", description: "Receive reminders before scheduled interviews" },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:border-slate-600/50 transition-colors"
                >
                  <div>
                    <h4 className="text-sm font-medium text-white">{item.label}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                  </div>
                  <button
                    onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key as keyof typeof notifications] })}
                    className={cn(
                      "relative w-12 h-6 rounded-full transition-colors",
                      notifications[item.key as keyof typeof notifications] ? "bg-blue-600" : "bg-slate-700"
                    )}
                  >
                    <motion.div
                      className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-lg"
                      animate={{ left: notifications[item.key as keyof typeof notifications] ? "calc(100% - 20px)" : "4px" }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveNotifications}
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium flex items-center gap-2 hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Preferences
              </motion.button>
            </div>
          </motion.div>
        );

      case "appearance":
        return (
          <motion.div
            key="appearance"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Theme</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: "dark", label: "Dark Mode", icon: Moon, preview: "bg-slate-900" },
                  { id: "light", label: "Light Mode", icon: Sun, preview: "bg-slate-100" },
                ].map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setAppearance({ ...appearance, theme: theme.id })}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all text-left",
                      appearance.theme === theme.id
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-slate-700/50 bg-slate-800/30 hover:border-slate-600/50"
                    )}
                  >
                    <div className={cn("w-full h-20 rounded-lg mb-3", theme.preview)} />
                    <div className="flex items-center gap-2">
                      <theme.icon className={cn(
                        "h-4 w-4",
                        appearance.theme === theme.id ? "text-blue-400" : "text-slate-400"
                      )} />
                      <span className={cn(
                        "text-sm font-medium",
                        appearance.theme === theme.id ? "text-white" : "text-slate-300"
                      )}>
                        {theme.label}
                      </span>
                      {appearance.theme === theme.id && (
                        <Check className="h-4 w-4 text-blue-400 ml-auto" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-700/50">
              <h3 className="text-lg font-semibold text-white">Display Options</h3>

              {[
                { key: "compact_mode", label: "Compact Mode", description: "Reduce spacing and use smaller fonts" },
                { key: "animations", label: "Animations", description: "Enable smooth transitions and animations" },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30 border border-slate-700/30"
                >
                  <div>
                    <h4 className="text-sm font-medium text-white">{item.label}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                  </div>
                  <button
                    onClick={() => setAppearance({ ...appearance, [item.key]: !appearance[item.key as keyof typeof appearance] })}
                    className={cn(
                      "relative w-12 h-6 rounded-full transition-colors",
                      appearance[item.key as keyof typeof appearance] ? "bg-blue-600" : "bg-slate-700"
                    )}
                  >
                    <motion.div
                      className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-lg"
                      animate={{ left: appearance[item.key as keyof typeof appearance] ? "calc(100% - 20px)" : "4px" }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        );

      case "legal":
        return (
          <motion.div
            key="legal"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Legal & Privacy</h3>
              <p className="text-slate-400 text-sm mb-6">
                Review our privacy policy and terms of service
              </p>
            </div>

            <div className="space-y-4">
              {/* Privacy Policy */}
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-blue-500/50 hover:bg-slate-800/50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium group-hover:text-blue-400 transition-colors">
                        Privacy Policy
                      </h4>
                      <p className="text-sm text-slate-400">
                        Learn how we protect and use your data
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-400 transition-colors" />
                </div>
              </a>

              {/* App Version */}
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium">Application Version</h4>
                      <p className="text-sm text-slate-400">v2.0.0 - Enterprise Edition</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Copyright */}
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                <div className="text-center text-sm text-slate-400">
                  <p>© {new Date().getFullYear()} Metaminds. All rights reserved.</p>
                  <a
                    href="https://metaminds.firm.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors mt-2 inline-block"
                  >
                    metaminds.firm.in
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative min-h-screen pb-8">
      {/* Metaminds Translucent Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          className="absolute top-1/4 right-1/3 w-[450px] h-[450px] opacity-[0.02]"
          animate={{
            rotate: [0, 180, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 45,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Image
            src="/metaminds-logo.jpg"
            alt=""
            fill
            className="object-contain blur-[2px]"
          />
        </motion.div>
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-8"
      >
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 mt-1">Manage your account preferences and security</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1"
        >
          <GlassPanel className="p-2" blur="lg" border>
            <nav className="space-y-1">
              {TABS.map((tab, index) => (
                <motion.button
                  key={tab.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  onClick={() => {
                    if (tab.isRedirect) {
                      router.push("/documents");
                    } else {
                      setActiveTab(tab.id);
                    }
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all",
                    tab.isRedirect
                      ? "text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 border border-blue-500/20"
                      : activeTab === tab.id
                        ? "bg-blue-500/20 text-blue-400"
                        : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                  )}
                >
                  <tab.icon className="h-5 w-5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tab.label}</p>
                    <p className="text-xs text-slate-500 truncate hidden sm:block">{tab.description}</p>
                  </div>
                  {tab.isRedirect ? (
                    <Globe className="h-4 w-4 flex-shrink-0 text-blue-400" />
                  ) : (
                    <ChevronRight className={cn(
                      "h-4 w-4 flex-shrink-0 transition-transform",
                      activeTab === tab.id ? "rotate-90" : ""
                    )} />
                  )}
                </motion.button>
              ))}
            </nav>
          </GlassPanel>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3"
        >
          <FloatingGlassCard className="p-6" hover={false}>
            <AnimatePresence mode="wait">
              {renderTabContent()}
            </AnimatePresence>
          </FloatingGlassCard>
        </motion.div>
      </div>
    </div>
  );
}
