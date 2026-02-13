"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  FileText,
  Mail,
  Briefcase,
  TrendingUp,
  Eye,
  MessageSquare,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Building2,
  Inbox,
  Store,
  Upload,
  File,
  FolderOpen,
  Plus,
} from "lucide-react";
import { AnimatedCard, StatCard } from "@/components/ui/animated-card";
import { GlassPanel, FloatingGlassCard } from "@/components/ui/glass-panel";
import { AnimatedCounter, CircularProgress, LinearProgress } from "@/components/ui/animated-counter";
import { DonutChart, BarChart, Sparkline, ActivityTimeline } from "@/components/ui/charts";
import { DashboardSkeleton } from "@/components/ui/skeleton-loader";
import { SpotlightCard } from "@/components/ui/spotlight";
import { useAuthStore } from "@/store/authStore";
import { applicationsAPI, resumesAPI, templatesAPI, documentsAPI } from "@/lib/api";
import { usePageTitle, PAGE_TITLES } from "@/hooks/usePageTitle";
import Link from "next/link";

// Debug logging helper for Dashboard
const debugLog = (action: string, data?: unknown) => {
  console.log(`[Dashboard] ${action}`, data ?? '');
};

interface DashboardStats {
  totalApplications: number;
  totalResponses: number;
  totalResumes: number;
  totalTemplates: number;
  responseRate: number;
  sentCount: number;
  openedCount: number;
  repliedCount: number;
  interviewCount: number;
  applicationTrend: number[];
}

interface RecentApplication {
  id: number;
  company_name: string;
  position_title: string;
  status: string;
  created_at: string;
  recruiter_name?: string;
}

interface RecentDocument {
  id: number;
  name: string;
  type: "resume" | "info_doc";
  created_at: string;
  is_default?: boolean;
}

// Sample data for demo purposes (used when no real data exists)
const SAMPLE_APPLICATIONS: RecentApplication[] = [
  {
    id: 1,
    company_name: "Microsoft",
    position_title: "Senior Software Engineer",
    status: "interview",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    recruiter_name: "Sarah Johnson",
  },
  {
    id: 2,
    company_name: "Amazon Web Services",
    position_title: "Cloud Solutions Architect",
    status: "replied",
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    recruiter_name: "Michael Chen",
  },
  {
    id: 3,
    company_name: "Google",
    position_title: "Full Stack Developer",
    status: "opened",
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    recruiter_name: "Emily Rodriguez",
  },
  {
    id: 4,
    company_name: "Meta",
    position_title: "Frontend Engineer",
    status: "replied",
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    recruiter_name: "David Kim",
  },
  {
    id: 5,
    company_name: "Apple",
    position_title: "iOS Developer",
    status: "sent",
    created_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    recruiter_name: "Jessica Martinez",
  },
  {
    id: 6,
    company_name: "Netflix",
    position_title: "Backend Engineer",
    status: "opened",
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    recruiter_name: "Thomas Anderson",
  },
  {
    id: 7,
    company_name: "Tesla",
    position_title: "Software Engineer",
    status: "interview",
    created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    recruiter_name: "Lisa Wong",
  },
  {
    id: 8,
    company_name: "Salesforce",
    position_title: "Lead Developer",
    status: "replied",
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    recruiter_name: "Robert Taylor",
  },
  {
    id: 9,
    company_name: "IBM",
    position_title: "DevOps Engineer",
    status: "opened",
    created_at: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
    recruiter_name: "Amanda Lee",
  },
  {
    id: 10,
    company_name: "Oracle",
    position_title: "Database Architect",
    status: "sent",
    created_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    recruiter_name: "Christopher Brown",
  },
  {
    id: 11,
    company_name: "Adobe",
    position_title: "Creative Cloud Engineer",
    status: "opened",
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    recruiter_name: "Maria Garcia",
  },
  {
    id: 12,
    company_name: "Spotify",
    position_title: "Audio Platform Engineer",
    status: "replied",
    created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    recruiter_name: "Johan Andersson",
  },
  {
    id: 13,
    company_name: "Uber",
    position_title: "Mobile Engineer",
    status: "sent",
    created_at: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
    recruiter_name: "Priya Sharma",
  },
  {
    id: 14,
    company_name: "Airbnb",
    position_title: "Full Stack Engineer",
    status: "opened",
    created_at: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString(),
    recruiter_name: "Brian Chesky",
  },
  {
    id: 15,
    company_name: "LinkedIn",
    position_title: "Backend Developer",
    status: "interview",
    created_at: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000).toISOString(),
    recruiter_name: "Jennifer Park",
  },
  {
    id: 16,
    company_name: "Stripe",
    position_title: "Payment Systems Engineer",
    status: "replied",
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    recruiter_name: "Patrick Collison",
  },
  {
    id: 17,
    company_name: "Twitter",
    position_title: "Infrastructure Engineer",
    status: "sent",
    created_at: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000).toISOString(),
    recruiter_name: "Kayvon Beykpour",
  },
  {
    id: 18,
    company_name: "Pinterest",
    position_title: "Visual Search Engineer",
    status: "opened",
    created_at: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000).toISOString(),
    recruiter_name: "Ben Silbermann",
  },
  {
    id: 19,
    company_name: "Snap Inc",
    position_title: "AR Platform Developer",
    status: "sent",
    created_at: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
    recruiter_name: "Evan Spiegel",
  },
  {
    id: 20,
    company_name: "Square",
    position_title: "Fintech Engineer",
    status: "opened",
    created_at: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString(),
    recruiter_name: "Jack Dorsey",
  },
  {
    id: 21,
    company_name: "Shopify",
    position_title: "E-commerce Engineer",
    status: "replied",
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    recruiter_name: "Tobi Lütke",
  },
  {
    id: 22,
    company_name: "Atlassian",
    position_title: "Collaboration Tools Engineer",
    status: "sent",
    created_at: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString(),
    recruiter_name: "Mike Cannon-Brookes",
  },
  {
    id: 23,
    company_name: "Zoom",
    position_title: "Video Platform Engineer",
    status: "opened",
    created_at: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000).toISOString(),
    recruiter_name: "Eric Yuan",
  },
  {
    id: 24,
    company_name: "Slack",
    position_title: "Communication Platform Developer",
    status: "sent",
    created_at: new Date(Date.now() - 33 * 24 * 60 * 60 * 1000).toISOString(),
    recruiter_name: "Stewart Butterfield",
  },
  {
    id: 25,
    company_name: "DocuSign",
    position_title: "Security Engineer",
    status: "opened",
    created_at: new Date(Date.now() - 34 * 24 * 60 * 60 * 1000).toISOString(),
    recruiter_name: "Dan Springer",
  },
  {
    id: 26,
    company_name: "MongoDB",
    position_title: "Database Engineer",
    status: "sent",
    created_at: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
    recruiter_name: "Dev Ittycheria",
  },
  {
    id: 27,
    company_name: "Redis Labs",
    position_title: "Distributed Systems Engineer",
    status: "opened",
    created_at: new Date(Date.now() - 36 * 24 * 60 * 60 * 1000).toISOString(),
    recruiter_name: "Ofer Bengal",
  },
  {
    id: 28,
    company_name: "Twilio",
    position_title: "Communications API Developer",
    status: "interview",
    created_at: new Date(Date.now() - 37 * 24 * 60 * 60 * 1000).toISOString(),
    recruiter_name: "Jeff Lawson",
  },
  {
    id: 29,
    company_name: "DataDog",
    position_title: "Monitoring Platform Engineer",
    status: "sent",
    created_at: new Date(Date.now() - 38 * 24 * 60 * 60 * 1000).toISOString(),
    recruiter_name: "Olivier Pomel",
  },
  {
    id: 30,
    company_name: "Splunk",
    position_title: "Analytics Engineer",
    status: "opened",
    created_at: new Date(Date.now() - 39 * 24 * 60 * 60 * 1000).toISOString(),
    recruiter_name: "Doug Merritt",
  },
  {
    id: 31,
    company_name: "Elastic",
    position_title: "Search Platform Engineer",
    status: "sent",
    created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    recruiter_name: "Shay Banon",
  },
  {
    id: 32,
    company_name: "Confluent",
    position_title: "Streaming Platform Developer",
    status: "opened",
    created_at: new Date(Date.now() - 41 * 24 * 60 * 60 * 1000).toISOString(),
    recruiter_name: "Jay Kreps",
  },
  {
    id: 33,
    company_name: "Snowflake",
    position_title: "Data Warehouse Engineer",
    status: "replied",
    created_at: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000).toISOString(),
    recruiter_name: "Frank Slootman",
  },
  {
    id: 34,
    company_name: "Databricks",
    position_title: "Big Data Engineer",
    status: "sent",
    created_at: new Date(Date.now() - 43 * 24 * 60 * 60 * 1000).toISOString(),
    recruiter_name: "Ali Ghodsi",
  },
  {
    id: 35,
    company_name: "Cloudflare",
    position_title: "Network Engineer",
    status: "opened",
    created_at: new Date(Date.now() - 44 * 24 * 60 * 60 * 1000).toISOString(),
    recruiter_name: "Matthew Prince",
  },
  {
    id: 36,
    company_name: "HashiCorp",
    position_title: "Infrastructure as Code Engineer",
    status: "sent",
    created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    recruiter_name: "Mitchell Hashimoto",
  },
  {
    id: 37,
    company_name: "GitLab",
    position_title: "DevOps Platform Engineer",
    status: "opened",
    created_at: new Date(Date.now() - 46 * 24 * 60 * 60 * 1000).toISOString(),
    recruiter_name: "Sid Sijbrandij",
  },
  {
    id: 38,
    company_name: "GitHub",
    position_title: "Version Control Engineer",
    status: "replied",
    created_at: new Date(Date.now() - 47 * 24 * 60 * 60 * 1000).toISOString(),
    recruiter_name: "Nat Friedman",
  },
  {
    id: 39,
    company_name: "Figma",
    position_title: "Design Platform Engineer",
    status: "sent",
    created_at: new Date(Date.now() - 48 * 24 * 60 * 60 * 1000).toISOString(),
    recruiter_name: "Dylan Field",
  },
  {
    id: 40,
    company_name: "Notion",
    position_title: "Workspace Platform Developer",
    status: "opened",
    created_at: new Date(Date.now() - 49 * 24 * 60 * 60 * 1000).toISOString(),
    recruiter_name: "Ivan Zhao",
  },
  {
    id: 41,
    company_name: "Airtable",
    position_title: "Low-Code Platform Engineer",
    status: "interview",
    created_at: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
    recruiter_name: "Howie Liu",
  },
  {
    id: 42,
    company_name: "Dropbox",
    position_title: "Storage Platform Engineer",
    status: "sent",
    created_at: new Date(Date.now() - 51 * 24 * 60 * 60 * 1000).toISOString(),
    recruiter_name: "Drew Houston",
  },
  {
    id: 43,
    company_name: "Box",
    position_title: "Cloud Storage Developer",
    status: "opened",
    created_at: new Date(Date.now() - 52 * 24 * 60 * 60 * 1000).toISOString(),
    recruiter_name: "Aaron Levie",
  },
  {
    id: 44,
    company_name: "Asana",
    position_title: "Project Management Engineer",
    status: "sent",
    created_at: new Date(Date.now() - 53 * 24 * 60 * 60 * 1000).toISOString(),
    recruiter_name: "Dustin Moskovitz",
  },
  {
    id: 45,
    company_name: "Palantir",
    position_title: "Data Integration Engineer",
    status: "opened",
    created_at: new Date(Date.now() - 54 * 24 * 60 * 60 * 1000).toISOString(),
    recruiter_name: "Alex Karp",
  },
  {
    id: 46,
    company_name: "Unity Technologies",
    position_title: "Game Engine Developer",
    status: "replied",
    created_at: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString(),
    recruiter_name: "John Riccitiello",
  },
  {
    id: 47,
    company_name: "Epic Games",
    position_title: "Unreal Engine Developer",
    status: "interview",
    created_at: new Date(Date.now() - 56 * 24 * 60 * 60 * 1000).toISOString(),
    recruiter_name: "Tim Sweeney",
  },
];

export default function DashboardPage() {
  // Set page title
  usePageTitle(PAGE_TITLES.DASHBOARD);

  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    totalResponses: 0,
    totalResumes: 0,
    totalTemplates: 0,
    responseRate: 0,
    sentCount: 0,
    openedCount: 0,
    repliedCount: 0,
    interviewCount: 0,
    applicationTrend: [],
  });
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);
  const [recentDocuments, setRecentDocuments] = useState<RecentDocument[]>([]);

  useEffect(() => {
    // AbortController for cleanup on unmount to prevent memory leaks
    const abortController = new AbortController();
    let isMounted = true;

    const fetchDashboardData = async () => {
      debugLog("fetchDashboardData - Starting data fetch");
      try {
        setLoading(true);

        // Fetch all data in parallel for better performance
        const [appsResponse, resumesResponse, templatesResponse, docsResumesResponse, docsInfoResponse] = await Promise.all([
          applicationsAPI.list({ limit: 100 }),
          resumesAPI.list({ limit: 100 }).catch(() => ({ data: { items: [] } })),
          templatesAPI.list({ limit: 100 }).catch(() => ({ data: { items: [] } })),
          documentsAPI.listResumes().catch(() => ({ data: { resumes: [], total: 0 } })),
          documentsAPI.listInfoDocs().catch(() => ({ data: { info_docs: [], total: 0 } })),
        ]);

        // Check if component is still mounted before updating state
        if (!isMounted || abortController.signal.aborted) {
          debugLog("fetchDashboardData - Aborted (component unmounted)");
          return;
        }

        const applications = appsResponse.data.items || [];
        debugLog("fetchDashboardData - Applications fetched", { count: applications.length });

        // Use sample data if no real applications exist
        const hasRealData = applications.length > 0;
        const dataToUse = hasRealData ? applications : SAMPLE_APPLICATIONS;

        // Calculate stats from applications (real or sample)
        const total = dataToUse.length;
        const sent = dataToUse.filter((a: any) => a.status === "sent").length;
        const opened = dataToUse.filter((a: any) => a.status === "opened").length;
        const replied = dataToUse.filter((a: any) =>
          ["replied", "responded"].includes(a.status)
        ).length;
        const interviews = dataToUse.filter((a: any) => a.status === "interview").length;

        // Use sample counts if no real data
        const resumeCount = hasRealData ? (resumesResponse.data.items?.length || 0) : 3;
        const templateCount = hasRealData ? (templatesResponse.data.items?.length || 0) : 8;

        debugLog("fetchDashboardData - Stats calculated", {
          total,
          sent,
          opened,
          replied,
          interviews,
          resumeCount,
          templateCount,
          usingSampleData: !hasRealData,
        });

        // Generate trend data (last 7 days simulation)
        const trend = hasRealData
          ? [12, 15, 18, 14, 22, 19, total]
          : [35, 38, 42, 40, 45, 47, 47];

        const finalStats = {
          totalApplications: total,
          totalResponses: replied + interviews,
          totalResumes: resumeCount,
          totalTemplates: templateCount,
          responseRate: total > 0 ? Math.round(((replied + interviews) / total) * 100) : 0,
          sentCount: sent,
          openedCount: opened,
          repliedCount: replied,
          interviewCount: interviews,
          applicationTrend: trend,
        };

        // Final mounted check before state updates
        if (!isMounted) return;

        debugLog("fetchDashboardData - Final stats", finalStats);
        setStats(finalStats);

        // Set recent applications as RecentApplication type (using real or sample data)
        const recentApps: RecentApplication[] = hasRealData
          ? applications.slice(0, 5).map((app: any) => ({
              id: app.id,
              company_name: app.company_name || "Unknown Company",
              position_title: app.position_title || "Software Engineer",
              status: app.status,
              created_at: app.created_at,
              recruiter_name: app.recruiter_name,
            }))
          : SAMPLE_APPLICATIONS.slice(0, 5);

        setRecentApplications(recentApps);
        debugLog("fetchDashboardData - Recent applications set", {
          count: recentApps.length,
          usingSampleData: !hasRealData
        });

        // Process documents (resumes and info docs)
        const docResumes = docsResumesResponse.data?.resumes || [];
        const docInfos = docsInfoResponse.data?.info_docs || [];

        const combinedDocs: RecentDocument[] = [
          ...docResumes.map((r: any) => ({
            id: r.id,
            name: r.name || `Resume ${r.id}`,
            type: "resume" as const,
            created_at: r.created_at || new Date().toISOString(),
            is_default: r.is_default,
          })),
          ...docInfos.map((d: any) => ({
            id: d.id,
            name: d.name || `Info Doc ${d.id}`,
            type: "info_doc" as const,
            created_at: d.created_at || new Date().toISOString(),
            is_default: d.is_default,
          })),
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
         .slice(0, 5);

        setRecentDocuments(combinedDocs);
        debugLog("fetchDashboardData - Recent documents set", { count: combinedDocs.length });

      } catch (error) {
        // Don't log errors if aborted
        if (abortController.signal.aborted) return;
        debugLog("fetchDashboardData - Error", error);
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
          debugLog("fetchDashboardData - Complete");
        }
      }
    };

    fetchDashboardData();

    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
      abortController.abort();
      debugLog("fetchDashboardData - Cleanup (component unmounting)");
    };
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  const statusData = [
    { label: "Sent", value: stats.sentCount, color: "#3b82f6" },
    { label: "Opened", value: stats.openedCount, color: "#22c55e" },
    { label: "Replied", value: stats.repliedCount, color: "#a855f7" },
    { label: "Interview", value: stats.interviewCount, color: "#f97316" },
  ];

  // Weekly data scaled based on total applications
  const weeklyMultiplier = stats.totalApplications > 0 ? stats.totalApplications / 30 : 1;
  const weeklyData = [
    { label: "Mon", value: Math.round(4 * weeklyMultiplier), color: "#3b82f6" },
    { label: "Tue", value: Math.round(7 * weeklyMultiplier), color: "#3b82f6" },
    { label: "Wed", value: Math.round(3 * weeklyMultiplier), color: "#3b82f6" },
    { label: "Thu", value: Math.round(5 * weeklyMultiplier), color: "#3b82f6" },
    { label: "Fri", value: Math.round(8 * weeklyMultiplier), color: "#3b82f6" },
    { label: "Sat", value: Math.round(2 * weeklyMultiplier), color: "#3b82f6" },
    { label: "Sun", value: Math.round(1 * weeklyMultiplier), color: "#3b82f6" },
  ];

  const recentActivities = recentApplications.map((app, idx) => ({
    id: String(app.id || idx),
    title: `Applied to ${app.company_name}`,
    description: app.position_title || "Software Engineer",
    time: new Date(app.created_at).toLocaleDateString(),
    type: (app.status === "interview" ? "success" :
           app.status === "rejected" ? "error" :
           app.status === "sent" ? "info" : "warning") as "success" | "info" | "warning" | "error",
  }));

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent": return <Mail className="h-4 w-4" />;
      case "opened": return <Eye className="h-4 w-4" />;
      case "replied": return <MessageSquare className="h-4 w-4" />;
      case "interview": return <Calendar className="h-4 w-4" />;
      case "rejected": return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "opened": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "replied": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "interview": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "rejected": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  return (
    <div className="relative space-y-8 pb-8">
      {/* Metaminds Translucent Background Watermarks */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Large centered watermark */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-[0.015]"
          animate={{
            rotate: [0, 360],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 60,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <Image
            src="/metaminds-logo.jpg"
            alt=""
            fill
            className="object-contain blur-[2px]"
            priority
          />
        </motion.div>

        {/* Top right corner accent */}
        <motion.div
          className="absolute -top-20 -right-20 w-80 h-80 opacity-[0.025]"
          animate={{
            y: [0, 20, 0],
            x: [0, -10, 0],
          }}
          transition={{
            duration: 15,
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

        {/* Bottom left decorative */}
        <motion.div
          className="absolute -bottom-32 -left-32 w-96 h-96 opacity-[0.02]"
          animate={{
            rotate: [0, -180, 0],
            scale: [1, 0.9, 1],
          }}
          transition={{
            duration: 40,
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

      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            {getGreeting()}, {user?.full_name?.split(" ")[0] || "User"}
          </h1>
          <p className="text-slate-400 mt-1">
            Here&apos;s what&apos;s happening with your applications
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-3"
        >
          <GlassPanel className="px-4 py-2" border glow glowColor="blue">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-slate-300">System Online</span>
            </div>
          </GlassPanel>
        </motion.div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Applications"
          value={<AnimatedCounter value={stats.totalApplications} />}
          subtitle="All time"
          icon={<Briefcase className="h-5 w-5" />}
          trend={{ value: 12, isPositive: true }}
          gradient="blue"
          delay={0}
        />
        <StatCard
          title="Response Rate"
          value={<><AnimatedCounter value={stats.responseRate} />%</>}
          subtitle={`${stats.totalResponses} responses`}
          icon={<TrendingUp className="h-5 w-5" />}
          trend={{ value: 8, isPositive: true }}
          gradient="green"
          delay={0.1}
        />
        <StatCard
          title="Info Doc / Resume Versions"
          value={<AnimatedCounter value={stats.totalResumes} />}
          subtitle="Active versions"
          icon={<FileText className="h-5 w-5" />}
          gradient="purple"
          delay={0.2}
        />
        <StatCard
          title="Email Templates"
          value={<AnimatedCounter value={stats.totalTemplates} />}
          subtitle="Ready to use"
          icon={<Mail className="h-5 w-5" />}
          gradient="orange"
          delay={0.3}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Application Status Donut */}
        <SpotlightCard className="p-6 lg:col-span-1">
          <h3 className="text-lg font-semibold text-white mb-6">Application Status</h3>
          <DonutChart
            data={statusData}
            size={160}
            strokeWidth={20}
            centerValue={stats.totalApplications}
            centerLabel="Total"
            showLegend={true}
          />
        </SpotlightCard>

        {/* Weekly Activity Bar Chart */}
        <SpotlightCard className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Weekly Activity</h3>
            <div className="flex items-center gap-2">
              <Sparkline
                data={stats.applicationTrend}
                width={80}
                height={30}
                color="#22c55e"
              />
              <span className="text-green-400 text-sm font-medium flex items-center gap-1">
                <ArrowUpRight className="h-4 w-4" />
                +12%
              </span>
            </div>
          </div>
          <BarChart data={weeklyData} height={180} showValues />
        </SpotlightCard>
      </div>

      {/* Progress and Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Progress */}
        <FloatingGlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Pipeline Progress</h3>
          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <CircularProgress
                value={stats.responseRate}
                size={100}
                strokeWidth={8}
                color="blue"
                label="Response"
              />
              <div className="flex-1 space-y-4">
                <LinearProgress
                  value={(stats.sentCount / Math.max(stats.totalApplications, 1)) * 100}
                  color="blue"
                  label="Sent"
                  showValue
                />
                <LinearProgress
                  value={(stats.openedCount / Math.max(stats.totalApplications, 1)) * 100}
                  color="green"
                  label="Opened"
                  showValue
                />
                <LinearProgress
                  value={(stats.interviewCount / Math.max(stats.totalApplications, 1)) * 100}
                  color="orange"
                  label="Interview"
                  showValue
                />
              </div>
            </div>
          </div>
        </FloatingGlassCard>

        {/* Recent Activity */}
        <FloatingGlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Recent Activity</h3>
          {recentActivities.length > 0 ? (
            <ActivityTimeline activities={recentActivities} />
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Building2 className="h-12 w-12 text-slate-600 mb-3" />
              <p className="text-slate-400">No recent applications</p>
              <p className="text-sm text-slate-500 mt-1">Start applying to see activity here</p>
            </div>
          )}
        </FloatingGlassCard>
      </div>

      {/* Recent Applications Table */}
      <AnimatedCard delay={0.4} hover={false} gradient="none" className="overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Recent Applications</h3>
            <motion.a
              href="/applications"
              whileHover={{ x: 5 }}
              className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              View all <ArrowUpRight className="h-4 w-4" />
            </motion.a>
          </div>

          {recentApplications.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Company</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Position</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Recruiter</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentApplications.map((app, index) => (
                    <motion.tr
                      key={app.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
                            {app.company_name?.charAt(0)?.toUpperCase() || "C"}
                          </div>
                          <span className="text-white font-medium">{app.company_name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-300">
                        {app.position_title || "Software Engineer"}
                      </td>
                      <td className="py-4 px-4 text-slate-400">
                        {app.recruiter_name || "—"}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(app.status)}`}>
                          {getStatusIcon(app.status)}
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-400 text-sm">
                        {new Date(app.created_at).toLocaleDateString()}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-16 w-16 text-slate-600 mb-4" />
              <p className="text-lg text-slate-400">No applications yet</p>
              <p className="text-sm text-slate-500 mt-1">
                Create your first application to get started
              </p>
              <motion.a
                href="/applications"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Create Application
              </motion.a>
            </div>
          )}
        </div>
      </AnimatedCard>

      {/* Documents Section */}
      <AnimatedCard delay={0.5} hover={false} gradient="none" className="overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30">
                <FolderOpen className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Your Documents</h3>
                <p className="text-xs text-slate-400">Resumes & Company Info Docs</p>
              </div>
            </div>
            <Link
              href="/documents"
              className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              Manage all <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {recentDocuments.length > 0 ? (
            <div className="space-y-3 mb-6">
              {recentDocuments.map((doc, index) => (
                <motion.div
                  key={`${doc.type}-${doc.id}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:border-slate-600/50 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${
                    doc.type === "resume"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-purple-500/20 text-purple-400"
                  }`}>
                    {doc.type === "resume" ? <FileText className="h-4 w-4" /> : <File className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{doc.name}</p>
                    <p className="text-xs text-slate-400">
                      {doc.type === "resume" ? "Resume" : "Info Doc"} • {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {doc.is_default && (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      Default
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center mb-6">
              <FolderOpen className="h-12 w-12 text-slate-600 mb-3" />
              <p className="text-slate-400">No documents uploaded yet</p>
              <p className="text-sm text-slate-500 mt-1">Upload a resume or info doc to get started</p>
            </div>
          )}

          {/* Quick Upload Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link href="/documents?upload=resume">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 hover:border-green-500/50 cursor-pointer transition-all"
              >
                <div className="p-2 rounded-lg bg-green-500/20">
                  <Upload className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Upload Resume</p>
                  <p className="text-xs text-slate-400">For job applications</p>
                </div>
                <Plus className="h-4 w-4 text-green-400 ml-auto" />
              </motion.div>
            </Link>
            <Link href="/documents?upload=info">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 hover:border-purple-500/50 cursor-pointer transition-all"
              >
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Upload className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Upload Info Doc</p>
                  <p className="text-xs text-slate-400">For marketing/sales</p>
                </div>
                <Plus className="h-4 w-4 text-purple-400 ml-auto" />
              </motion.div>
            </Link>
          </div>
        </div>
      </AnimatedCard>

    </div>
  );
}
