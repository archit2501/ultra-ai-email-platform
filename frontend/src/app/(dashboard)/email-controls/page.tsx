"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import {
  TrendingUp,
  Shield,
  Sparkles,
  Info,
  Zap,
  Clock,
  Heart,
  Inbox,
  ArrowRight,
  Mail,
} from "lucide-react";
import { EmailWarmingSettings } from "@/components/EmailWarmingSettings";
import { RateLimitingSettings } from "@/components/RateLimitingSettings";
import { SendTimeSettings } from "@/components/SendTimeSettings";
import { WarmupHealthDashboard } from "@/components/WarmupHealthDashboard";
import { Button } from "@/components/ui/button";

export default function EmailControlsPage() {
  const [activeTab, setActiveTab] = useState("warming");

  return (
    <div className="relative p-6 space-y-6 min-h-screen">
      {/* Metaminds Translucent Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[480px] h-[480px] opacity-[0.019]"
          animate={{
            rotate: [0, 90, 0],
            scale: [1, 1.08, 1],
          }}
          transition={{
            duration: 38,
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

      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative text-center mb-8"
      >
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
            <Zap className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
          Email Controls Center
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Advanced email sending controls to maximize deliverability and maintain
          sender reputation
        </p>
      </motion.div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="glass border-blue-500/30 p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-blue-500/20">
              <Info className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-2">
                Why Use Email Controls?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-300">
                <div className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-white">Email Warming</p>
                    <p className="text-slate-400 text-xs">
                      Gradually build sender reputation by increasing volume over time.
                      Prevents spam filtering.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-white">Rate Limiting</p>
                    <p className="text-slate-400 text-xs">
                      Control sending volume to stay within provider limits and avoid
                      account suspension.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-white">Send Time Optimization</p>
                    <p className="text-slate-400 text-xs">
                      Send emails at optimal times for +20-30% higher open rates.
                      Research-backed data.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Inbox Integration Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="glass backdrop-blur-xl bg-gradient-to-r from-cyan-900/30 via-blue-900/30 to-purple-900/30 border-cyan-500/30 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
                  <Inbox className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-white">Email Inbox Integration</h3>
                    <Mail className="w-4 h-4 text-cyan-400" />
                  </div>
                  <p className="text-sm text-slate-300">
                    Connect your email accounts and track all responses in one unified inbox
                  </p>
                </div>
              </div>
              <Button
                onClick={() => window.location.href = '/inbox'}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/25"
              >
                <Inbox className="w-4 h-4 mr-2" />
                Open Inbox
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="glass grid w-full max-w-3xl mx-auto grid-cols-4 p-1">
            <TabsTrigger
              value="warming"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Warming
            </TabsTrigger>
            <TabsTrigger
              value="health"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-600 data-[state=active]:to-pink-600 data-[state=active]:text-white"
            >
              <Heart className="w-4 h-4 mr-2" />
              Health
            </TabsTrigger>
            <TabsTrigger
              value="rate-limits"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white"
            >
              <Shield className="w-4 h-4 mr-2" />
              Rate Limits
            </TabsTrigger>
            <TabsTrigger
              value="send-time"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-teal-600 data-[state=active]:text-white"
            >
              <Clock className="w-4 h-4 mr-2" />
              Send Time
            </TabsTrigger>
          </TabsList>

          <TabsContent value="warming">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <EmailWarmingSettings />
            </motion.div>
          </TabsContent>

          <TabsContent value="health">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <WarmupHealthDashboard />
            </motion.div>
          </TabsContent>

          <TabsContent value="rate-limits">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <RateLimitingSettings />
            </motion.div>
          </TabsContent>

          <TabsContent value="send-time">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <SendTimeSettings />
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Quick Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <Card className="glass border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="font-bold text-white">Getting Started</h3>
          </div>
          <p className="text-sm text-slate-400">
            New accounts should start with{" "}
            <span className="text-blue-400 font-medium">Conservative warming</span> for
            14 days to build reputation safely.
          </p>
        </Card>

        <Card className="glass border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <Shield className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="font-bold text-white">Safety First</h3>
          </div>
          <p className="text-sm text-slate-400">
            Always set rate limits{" "}
            <span className="text-green-400 font-medium">10-20% below</span> your email
            provider's maximum to maintain a safety margin.
          </p>
        </Card>

        <Card className="glass border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-cyan-500/20">
              <Clock className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="font-bold text-white">Optimal Timing</h3>
          </div>
          <p className="text-sm text-slate-400">
            <span className="text-cyan-400 font-medium">Tuesday 10am</span> is universally
            the best time to send emails. Tech companies see +25% open rates.
          </p>
        </Card>

        <Card className="glass border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="font-bold text-white">Best Results</h3>
          </div>
          <p className="text-sm text-slate-400">
            Use <span className="text-purple-400 font-medium">all three together</span>{" "}
            - warming + rate limiting + optimal timing = maximum deliverability.
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
