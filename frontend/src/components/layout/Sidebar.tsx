

"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Mail,
  Briefcase,
  Users,
  LogOut,
  ChevronLeft,
  BarChart3,
  Layers,
  Zap,
  Bell,
  Settings,
  Brain,
  RefreshCw,
  Sparkles,
  Inbox,
  Store,
  FlaskConical,
  TrendingUp,
  UserCircle2,
  UsersRound,
  FolderOpen,
  Flame,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Campaigns", href: "/campaigns", icon: Mail, badge: "NEW" },
  { name: "Pipeline", href: "/pipeline", icon: Briefcase },
  { name: "Outreach", href: "/outreach", icon: UserCircle2, badge: "ULTRA AI" },
  { name: "Email Warmup", href: "/warmup", icon: Flame, badge: "GOD" },
  { name: "Resources", href: "/resources", icon: FolderOpen },
  { name: "Marketplace", href: "/marketplace-consolidated", icon: Sparkles, badge: "TOOLS" },
  { name: "Insights", href: "/insights", icon: TrendingUp },
  { name: "Admin", href: "/admin", icon: Settings, adminOnly: true },

  // ========== COMMENTED OUT - OLD PAGES (USE CONSOLIDATED VERSIONS INSTEAD) ==========
  // { name: "Applications", href: "/applications", icon: Briefcase },
  // { name: "Recipients", href: "/recipients", icon: UserCircle2, badge: "ULTRA AI" },
  // { name: "Lead Extraction", href: "/extraction", icon: Sparkles, badge: "ULTRA AI" },
  // { name: "MobiAdz", href: "/mobiadz-extraction", icon: Store, badge: "ULTRA" },
  // { name: "Intelligence", href: "/company-intelligence", icon: Brain, badge: "AI" },
  // { name: "Analytics", href: "/analytics", icon: TrendingUp },
  // { name: "Templates", href: "/templates", icon: Mail },
  // { name: "Documents", href: "/documents", icon: FolderOpen },
  // { name: "Email Controls", href: "/email-controls", icon: Zap },
  // { name: "Settings", href: "/settings", icon: Settings },
  // { name: "Users", href: "/users", icon: Users, adminOnly: true },
];

// 🎯 Top bar pages - Quick access features
export const topBarPages = [
  { name: "Inbox", href: "/inbox", icon: Inbox, tooltip: "Email Inbox" },

  // ========== COMMENTED OUT - OLD PAGES ==========
  // { name: "Template Analytics", href: "/template-analytics", icon: TrendingUp, tooltip: "Template Performance" },
  // { name: "Notifications", href: "/notifications", icon: Bell, tooltip: "Notifications" },
];

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const isSuperAdmin = user?.role === "super_admin";

  const filteredNav = navigation.filter(
    (item) => !item.adminOnly || isSuperAdmin
  );

  return (
    <div
      className={cn(
        "bg-slate-900 border-r border-slate-800 h-screen sticky top-0 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Enhanced Header with Logo and Animated Branding */}
        <div className="relative p-4 border-b border-slate-800/50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          {/* Animated background sparkles */}
          {!collapsed && (
            <motion.div
              className="absolute inset-0 opacity-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.1 }}
              transition={{ duration: 2 }}
            >
              <Sparkles className="absolute top-2 right-8 w-4 h-4 text-blue-400 animate-pulse" />
              <Sparkles className="absolute bottom-3 left-12 w-3 h-3 text-purple-400 animate-pulse delay-100" style={{ animationDelay: "0.5s" }} />
            </motion.div>
          )}

          <div className="relative flex items-center justify-between">
            {!collapsed ? (
              <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* Metaminds Logo with Glow Effect - Clickable */}
                <motion.a
                  href="https://metaminds.firm.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative"
                  whileHover={{ scale: 1.05, rotate: 3 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-30 blur-xl rounded-full"></div>
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden ring-2 ring-blue-500/30 shadow-lg shadow-blue-500/20">
                    <Image
                      src="/metaminds-logo.jpg"
                      alt="Metaminds"
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                  {/* Pulse animation ring */}
                  <motion.div
                    className="absolute inset-0 rounded-lg border-2 border-blue-400"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 0, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </motion.a>

                {/* Animated Brand Text */}
                <div className="flex flex-col">
                  <motion.div
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                      Outreach Platform
                    </h1>
                    <motion.div
                      animate={{ rotate: [0, 10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    </motion.div>
                  </motion.div>
                  <motion.p
                    className="text-[10px] text-slate-500 font-medium tracking-wider uppercase"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    by Metaminds
                  </motion.p>
                </div>
              </motion.div>
            ) : (
              // Collapsed state - Show only logo with tooltip effect - Clickable
              <motion.a
                href="https://metaminds.firm.in"
                target="_blank"
                rel="noopener noreferrer"
                className="relative mx-auto"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring" }}
              >
                <div className="absolute inset-0 bg-blue-500/20 blur-lg rounded-full"></div>
                <div className="relative w-10 h-10 rounded-lg overflow-hidden ring-2 ring-blue-500/40">
                  <Image
                    src="/metaminds-logo.jpg"
                    alt="Metaminds"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </motion.a>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
            >
              <ChevronLeft
                className={cn(
                  "h-5 w-5 transition-transform duration-300",
                  collapsed && "rotate-180"
                )}
              />
            </Button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {filteredNav.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-all relative",
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/50"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="font-medium flex-1">{item.name}</span>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded uppercase tracking-wider">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Button
            variant="ghost"
            onClick={logout}
            className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span className="ml-3">Logout</span>}
          </Button>
        </div>
      </div>
    </div>
  );
}
