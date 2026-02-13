
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Zap, Sparkles } from "lucide-react";
import { Sidebar, topBarPages } from "@/components/layout/Sidebar";
import Link from "next/link";
import { CommandPaletteProvider } from "@/components/ui/command-palette";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { NotificationBell } from "@/components/notifications";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { KeyboardShortcutsIndicator } from "@/components/ui/KeyboardShortcutsHelp";
import { useAuthStore } from "@/store/authStore";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ThemeCustomizer } from "@/components/ui/theme-customizer";
import { WarmupHealthBadge } from "@/components/warmup/WarmupHealthBadge";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const token = useAuthStore((state) => state.token);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const router = useRouter();

  // Proper client-side auth check - wait for hydration first
  useEffect(() => {
    // CRITICAL: Wait for Zustand to finish hydrating from localStorage
    if (!hasHydrated) {
      console.log("⏳ [Dashboard Layout] Waiting for state hydration...");
      return;
    }

    console.log("🔐 [Dashboard Layout] Checking authentication...");
    console.log("   Token exists:", !!token);

    if (!token) {
      console.log("   ❌ No token found - redirecting to login");
      router.push("/login");
    } else {
      console.log("   ✅ Token found - user is authenticated");
      setIsChecking(false);
    }
  }, [token, hasHydrated, router]);

  // Show loading while hydrating OR checking auth or if no token
  if (!hasHydrated || isChecking || !token) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-400">
            {!hasHydrated ? "Initializing..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <NotificationProvider>
      <CommandPaletteProvider>
        <div className="flex h-screen bg-slate-950">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Header Bar with Logo, Tagline & Notifications */}
          <header className="h-14 border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-between px-6 gap-4">
            {/* Left: Logo + AI-Powered Tagline */}
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Metaminds Logo */}
              <motion.a
                href="https://metaminds.firm.in"
                target="_blank"
                rel="noopener noreferrer"
                className="relative w-8 h-8 rounded-md overflow-hidden ring-1 ring-blue-500/30 hover:ring-blue-400/50 transition-all"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Image
                  src="/metaminds-logo.jpg"
                  alt="Metaminds"
                  fill
                  className="object-cover"
                  priority
                />
              </motion.a>

              {/* AI-Powered Tagline */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-700/50">
                <motion.div
                  animate={{
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Zap className="w-4 h-4 text-yellow-400" />
                </motion.div>
                <h2 className="text-sm font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                  AI-Driven Outreach Intelligence
                </h2>
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                </motion.div>
              </div>
            </motion.div>

            {/* Right: Top Bar Icons, Theme Controls & Notifications */}
            <div className="flex items-center gap-2">
              {/* Top Bar Pages - Coming Soon Features */}
              <div className="flex items-center gap-1 mr-2 pr-2 border-r border-slate-700/50">
                {topBarPages.map((page) => {
                  const IconComponent = page.icon;
                  return (
                    <motion.div
                      key={page.name}
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link
                        href={page.href}
                        className="relative group p-2 rounded-lg hover:bg-slate-800/50 transition-all duration-200"
                        title={page.tooltip}
                      >
                        <IconComponent className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              {/* Email Warmup Health Badge - Real-time sender reputation status */}
              <WarmupHealthBadge className="mr-2" />

              <ThemeCustomizer />
              <ThemeToggle />
              <NotificationBell />
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="p-8">
              {children}
            </div>
          </main>
        </div>

        {/* Phase 2 Components */}
        <FloatingActionButton />
        <KeyboardShortcutsIndicator />
      </div>
      </CommandPaletteProvider>
    </NotificationProvider>
  );
}
