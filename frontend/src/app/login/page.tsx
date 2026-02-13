"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/store/authStore";
import { authAPI } from "@/lib/api";
import { toast } from "sonner";
import {
  Lock,
  Mail,
  Loader2,
  User,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Briefcase,
  KeyRound,
  Server,
  Shield,
  Zap,
  Target,
  Send,
} from "lucide-react";
import type { User as UserType } from "@/types";

// Animated background particles
const FloatingParticle = ({ delay, duration, x, y }: { delay: number; duration: number; x: number; y: number }) => (
  <motion.div
    className="absolute w-2 h-2 bg-blue-500/20 rounded-full"
    initial={{ x: `${x}%`, y: `${y}%`, scale: 0, opacity: 0 }}
    animate={{
      y: [`${y}%`, `${y - 20}%`, `${y}%`],
      scale: [0, 1, 0],
      opacity: [0, 0.6, 0],
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
);

// Registration steps configuration
const registrationSteps = [
  { id: 1, title: "Account", icon: User, description: "Create your account" },
  { id: 2, title: "Profile", icon: Briefcase, description: "Tell us about yourself" },
  { id: 3, title: "Email Setup", icon: Mail, description: "Configure email sending" },
];

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [registerStep, setRegisterStep] = useState(1);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Registration form state
  const [registerForm, setRegisterForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    full_name: "",
    title: "",
    email_account: "",
    email_password: "",
    smtp_host: "smtp.gmail.com",
    smtp_port: 587,
  });

  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const router = useRouter();
  const { login, setUser } = useAuthStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Password strength calculator
  useEffect(() => {
    const pwd = registerForm.password;
    let strength = 0;
    if (pwd.length >= 6) strength += 1;
    if (pwd.length >= 8) strength += 1;
    if (/[A-Z]/.test(pwd)) strength += 1;
    if (/[0-9]/.test(pwd)) strength += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) strength += 1;
    setPasswordStrength(strength);
  }, [registerForm.password]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await authAPI.login({ username, password });
      localStorage.setItem("token", data.access_token);

      const userRes = await authAPI.getMe();
      const userData: UserType = userRes.data;

      login(data.access_token, userData);

      toast.success(`Welcome back, ${userData.full_name}!`, {
        icon: <Sparkles className="w-5 h-5 text-yellow-400" />,
      });

      setTimeout(() => {
        router.push("/dashboard");
      }, 100);
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "Login failed. Please check your credentials.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Email validation helper
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRegister = async () => {
    // Validate current step
    if (registerStep === 1) {
      if (!registerForm.username || !registerForm.email || !registerForm.password) {
        toast.error("Please fill in all required fields");
        return;
      }
      if (!isValidEmail(registerForm.email)) {
        toast.error("Please enter a valid email address");
        return;
      }
      if (registerForm.password !== registerForm.confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
      if (registerForm.password.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }
      setRegisterStep(2);
      return;
    }

    if (registerStep === 2) {
      if (!registerForm.full_name) {
        toast.error("Please enter your full name");
        return;
      }
      setRegisterStep(3);
      return;
    }

    // Final step - submit registration
    if (!registerForm.email_account || !registerForm.email_password) {
      toast.error("Please configure your email settings");
      return;
    }
    if (!isValidEmail(registerForm.email_account)) {
      toast.error("Please enter a valid email account address");
      return;
    }

    setRegisterLoading(true);

    try {
      // Register the user
      await authAPI.register({
        username: registerForm.username,
        email: registerForm.email,
        password: registerForm.password,
        full_name: registerForm.full_name,
        email_account: registerForm.email_account,
        email_password: registerForm.email_password,
        smtp_host: registerForm.smtp_host,
        smtp_port: registerForm.smtp_port,
        title: registerForm.title || undefined,
      });

      toast.success("Account created successfully!", {
        icon: <CheckCircle2 className="w-5 h-5 text-green-400" />,
      });

      // Auto-login after registration
      const { data } = await authAPI.login({
        username: registerForm.username,
        password: registerForm.password,
      });
      localStorage.setItem("token", data.access_token);

      const userRes = await authAPI.getMe();
      const userData: UserType = userRes.data;
      login(data.access_token, userData);

      setShowRegister(false);

      toast.success(`Welcome, ${userData.full_name}! Let's get started.`, {
        icon: <Sparkles className="w-5 h-5 text-yellow-400" />,
      });

      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "Registration failed. Please try again.";
      toast.error(errorMessage);
    } finally {
      setRegisterLoading(false);
    }
  };

  const resetRegisterForm = () => {
    setRegisterForm({
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      full_name: "",
      title: "",
      email_account: "",
      email_password: "",
      smtp_host: "smtp.gmail.com",
      smtp_port: 587,
    });
    setRegisterStep(1);
  };

  const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-lime-500", "bg-green-500"];
  const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 overflow-hidden relative">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20 [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <FloatingParticle
            key={i}
            delay={i * 0.5}
            duration={3 + Math.random() * 2}
            x={Math.random() * 100}
            y={Math.random() * 100}
          />
        ))}

        {/* Gradient orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/30 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, delay: 2 }}
        />
      </div>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md px-4"
      >
        <Card className="border-slate-700/50 bg-slate-900/80 backdrop-blur-xl shadow-2xl shadow-blue-500/10">
          <CardHeader className="space-y-4 pb-6">
            {/* Logo */}
            <motion.div
              className="flex justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Send className="w-8 h-8 text-white" />
                </div>
                <motion.div
                  className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
            </motion.div>

            <div className="text-center space-y-2">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                HR Resume Assistant
              </CardTitle>
              <CardDescription className="text-slate-400">
                Your intelligent job application companion
              </CardDescription>
            </div>

            {/* Feature badges */}
            <div className="flex justify-center gap-2">
              {[
                { icon: Zap, label: "Fast" },
                { icon: Target, label: "Smart" },
                { icon: Shield, label: "Secure" },
              ].map((badge, i) => (
                <motion.div
                  key={badge.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-1 px-2 py-1 bg-slate-800/50 rounded-full text-xs text-slate-400"
                >
                  <badge.icon className="w-3 h-3" />
                  {badge.label}
                </motion.div>
              ))}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-400" />
                  Username
                </label>
                <div className="relative group">
                  <Input
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-4 h-12 bg-slate-800/50 border-slate-700 text-white rounded-xl focus:border-blue-500 focus:ring-blue-500/20 transition-all group-hover:border-slate-600"
                    required
                  />
                </div>
              </motion.div>

              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-400" />
                  Password
                </label>
                <div className="relative group">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-4 pr-12 h-12 bg-slate-800/50 border-slate-700 text-white rounded-xl focus:border-blue-500 focus:ring-blue-500/20 transition-all group-hover:border-slate-600"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl font-semibold text-base shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 hover:scale-[1.02]"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Sign In
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  )}
                </Button>
              </motion.div>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900 px-2 text-slate-500">or</span>
              </div>
            </div>

            {/* Create Account Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 border-slate-700 bg-slate-800/30 hover:bg-slate-800/60 text-white rounded-xl font-semibold transition-all hover:border-blue-500/50 group"
                onClick={() => {
                  resetRegisterForm();
                  setShowRegister(true);
                }}
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400 group-hover:text-purple-300" />
                  Create New Account
                </span>
              </Button>
            </motion.div>

            {/* Demo credentials */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50"
            >
              <p className="text-xs text-slate-500 text-center mb-2">Demo Credentials</p>
              <div className="flex justify-center gap-4 text-xs">
                <div className="text-center">
                  <div className="text-blue-400 font-mono">admin</div>
                  <div className="text-slate-500">admin123</div>
                </div>
                <div className="text-slate-700">|</div>
                <div className="text-center">
                  <div className="text-purple-400 font-mono">pragya</div>
                  <div className="text-slate-500">pragya123</div>
                </div>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Registration Dialog */}
      <Dialog open={showRegister} onOpenChange={(open) => {
        setShowRegister(open);
        if (!open) resetRegisterForm();
      }}>
        <DialogContent className="sm:max-w-lg bg-slate-900 border-slate-700 p-0 overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                Create Account
              </DialogTitle>
              <DialogDescription className="text-blue-100">
                Join HR Resume Assistant and supercharge your job search
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Progress Steps */}
          <div className="px-6 pt-6">
            <div className="flex items-center justify-between relative">
              {/* Progress line */}
              <div className="absolute left-0 right-0 top-5 h-0.5 bg-slate-700">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                  initial={{ width: "0%" }}
                  animate={{ width: `${((registerStep - 1) / 2) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {registrationSteps.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = registerStep === step.id;
                const isCompleted = registerStep > step.id;

                return (
                  <div key={step.id} className="relative flex flex-col items-center z-10">
                    <motion.div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isCompleted
                          ? "bg-gradient-to-r from-blue-500 to-purple-500"
                          : isActive
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 ring-4 ring-blue-500/30"
                          : "bg-slate-800 border-2 border-slate-700"
                      }`}
                      animate={isActive ? { scale: [1, 1.05, 1] } : {}}
                      transition={{ duration: 0.5, repeat: isActive ? Infinity : 0 }}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      ) : (
                        <StepIcon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-500"}`} />
                      )}
                    </motion.div>
                    <span className={`text-xs mt-2 font-medium ${isActive ? "text-white" : "text-slate-500"}`}>
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Content */}
          <div className="px-6 py-6">
            <AnimatePresence mode="wait">
              {/* Step 1: Account Details */}
              {registerStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-400" />
                      Username <span className="text-red-400">*</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="Choose a unique username"
                      value={registerForm.username}
                      onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                      className="h-11 bg-slate-800/50 border-slate-700 text-white rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-400" />
                      Email Address <span className="text-red-400">*</span>
                    </label>
                    <Input
                      type="email"
                      placeholder="your.email@example.com"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      className="h-11 bg-slate-800/50 border-slate-700 text-white rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-blue-400" />
                      Password <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        type={showRegisterPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        className="h-11 pr-10 bg-slate-800/50 border-slate-700 text-white rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {/* Password strength indicator */}
                    {registerForm.password && (
                      <div className="space-y-1">
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-all ${
                                i < passwordStrength ? strengthColors[passwordStrength - 1] : "bg-slate-700"
                              }`}
                            />
                          ))}
                        </div>
                        <p className={`text-xs ${passwordStrength >= 3 ? "text-green-400" : "text-orange-400"}`}>
                          {strengthLabels[passwordStrength - 1] || "Enter password"}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-blue-400" />
                      Confirm Password <span className="text-red-400">*</span>
                    </label>
                    <Input
                      type="password"
                      placeholder="Confirm your password"
                      value={registerForm.confirmPassword}
                      onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                      className={`h-11 bg-slate-800/50 border-slate-700 text-white rounded-lg ${
                        registerForm.confirmPassword &&
                        registerForm.password !== registerForm.confirmPassword
                          ? "border-red-500"
                          : ""
                      }`}
                    />
                    {registerForm.confirmPassword && registerForm.password !== registerForm.confirmPassword && (
                      <p className="text-xs text-red-400">Passwords do not match</p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Profile Details */}
              {registerStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-sm text-blue-400">
                      Tell us a bit about yourself. This information will be used in your job applications.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-400" />
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="Your full name"
                      value={registerForm.full_name}
                      onChange={(e) => setRegisterForm({ ...registerForm, full_name: e.target.value })}
                      className="h-11 bg-slate-800/50 border-slate-700 text-white rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-blue-400" />
                      Professional Title
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g., Software Engineer, Product Manager"
                      value={registerForm.title}
                      onChange={(e) => setRegisterForm({ ...registerForm, title: e.target.value })}
                      className="h-11 bg-slate-800/50 border-slate-700 text-white rounded-lg"
                    />
                    <p className="text-xs text-slate-500">Optional - will be used in email signatures</p>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Email Configuration */}
              {registerStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg space-y-2">
                    <p className="text-sm text-purple-400 font-medium">Configure Your Email for Sending Applications</p>
                    <p className="text-xs text-slate-400">
                      We'll use this to send job applications on your behalf. For Gmail, use an{" "}
                      <a
                        href="https://support.google.com/accounts/answer/185833"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        App Password
                      </a>
                      .
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-purple-400" />
                      Email Account <span className="text-red-400">*</span>
                    </label>
                    <Input
                      type="email"
                      placeholder="your.email@gmail.com"
                      value={registerForm.email_account}
                      onChange={(e) => setRegisterForm({ ...registerForm, email_account: e.target.value })}
                      className="h-11 bg-slate-800/50 border-slate-700 text-white rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-purple-400" />
                      App Password <span className="text-red-400">*</span>
                    </label>
                    <Input
                      type="password"
                      placeholder="Your Gmail App Password"
                      value={registerForm.email_password}
                      onChange={(e) => setRegisterForm({ ...registerForm, email_password: e.target.value })}
                      className="h-11 bg-slate-800/50 border-slate-700 text-white rounded-lg"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                        <Server className="w-4 h-4 text-slate-400" />
                        SMTP Host
                      </label>
                      <Input
                        type="text"
                        value={registerForm.smtp_host}
                        onChange={(e) => setRegisterForm({ ...registerForm, smtp_host: e.target.value })}
                        className="h-11 bg-slate-800/50 border-slate-700 text-white rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">SMTP Port</label>
                      <Input
                        type="number"
                        value={registerForm.smtp_port}
                        onChange={(e) => setRegisterForm({ ...registerForm, smtp_port: parseInt(e.target.value) })}
                        className="h-11 bg-slate-800/50 border-slate-700 text-white rounded-lg"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer with navigation */}
          <div className="px-6 pb-6 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              className="text-slate-400 hover:text-white"
              onClick={() => {
                if (registerStep > 1) {
                  setRegisterStep(registerStep - 1);
                } else {
                  setShowRegister(false);
                }
              }}
              disabled={registerLoading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {registerStep === 1 ? "Cancel" : "Back"}
            </Button>

            <Button
              type="button"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 px-6"
              onClick={handleRegister}
              disabled={registerLoading}
            >
              {registerLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </span>
              ) : registerStep === 3 ? (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Create Account
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
