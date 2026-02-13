"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  RefreshCw,
  Zap,
  Clock,
  Mail,
  CheckCircle2,
  Sparkles,
  Calendar,
  MessageSquare,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import type { Recipient } from "@/types";

interface FollowUpScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipient: Recipient | null;
  onSuccess: () => void;
}

// Preset follow-up sequences
const PRESET_SEQUENCES = [
  {
    id: "professional",
    name: "Professional (3 Days)",
    icon: Mail,
    color: "from-blue-500 to-cyan-500",
    steps: [
      { delay: 3, strategy: "gentle_reminder" },
      { delay: 7, strategy: "value_addition" },
      { delay: 14, strategy: "final_attempt" },
    ],
    responseRate: "12-18%",
  },
  {
    id: "aggressive",
    name: "Aggressive (Daily)",
    icon: Zap,
    color: "from-orange-500 to-red-500",
    steps: [
      { delay: 1, strategy: "gentle_reminder" },
      { delay: 3, strategy: "value_addition" },
      { delay: 5, strategy: "final_attempt" },
    ],
    responseRate: "8-14%",
  },
  {
    id: "patient",
    name: "Patient (Weekly)",
    icon: Clock,
    color: "from-purple-500 to-pink-500",
    steps: [
      { delay: 7, strategy: "gentle_reminder" },
      { delay: 14, strategy: "value_addition" },
      { delay: 21, strategy: "final_attempt" },
    ],
    responseRate: "10-16%",
  },
  {
    id: "persistent",
    name: "Persistent (5 Steps)",
    icon: TrendingUp,
    color: "from-green-500 to-emerald-500",
    steps: [
      { delay: 2, strategy: "gentle_reminder" },
      { delay: 5, strategy: "value_addition" },
      { delay: 9, strategy: "case_study" },
      { delay: 14, strategy: "social_proof" },
      { delay: 21, strategy: "final_attempt" },
    ],
    responseRate: "15-22%",
  },
];

export function FollowUpScheduleDialog({
  open,
  onOpenChange,
  recipient,
  onSuccess,
}: FollowUpScheduleDialogProps) {
  const [selectedPreset, setSelectedPreset] = useState("professional");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [autoMode, setAutoMode] = useState(true);
  const [stopOnReply, setStopOnReply] = useState(true);
  const [loading, setLoading] = useState(false);

  const preset = PRESET_SEQUENCES.find((s) => s.id === selectedPreset) || PRESET_SEQUENCES[0];

  const handleSchedule = async () => {
    if (!recipient) return;

    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.success("Follow-up Sequence Scheduled!", {
        description: `${preset.steps.length} emails will be sent starting ${startDate}`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to schedule follow-up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-slate-800 shadow-2xl">
        {/* Animated Header */}
        <DialogHeader>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl border border-cyan-500/30">
              <RefreshCw className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Schedule Follow-up Sequence
              </DialogTitle>
              <DialogDescription className="text-slate-400 mt-1">
                Automate follow-ups for{" "}
                <span className="text-white font-semibold">{recipient?.name || recipient?.email}</span>
              </DialogDescription>
            </div>
          </motion.div>
        </DialogHeader>

        <Separator className="my-6 bg-slate-800" />

        <div className="space-y-6">
          {/* Preset Selection */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Label className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Choose Strategy
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {PRESET_SEQUENCES.map((sequence, index) => {
                const Icon = sequence.icon;
                const isSelected = selectedPreset === sequence.id;

                return (
                  <motion.button
                    key={sequence.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedPreset(sequence.id)}
                    className={`relative p-4 rounded-xl border-2 transition-all duration-300 text-left overflow-hidden group ${
                      isSelected
                        ? "border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/20"
                        : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                    }`}
                  >
                    {/* Animated gradient background */}
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-r ${sequence.color} opacity-0 group-hover:opacity-10 transition-opacity`}
                      animate={isSelected ? { opacity: 0.15 } : {}}
                    />

                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`p-2 rounded-lg bg-gradient-to-br ${sequence.color} bg-opacity-20`}
                          >
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <span className="font-semibold text-white">{sequence.name}</span>
                        </div>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="p-1 bg-cyan-500 rounded-full"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          </motion.div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Mail className="w-3 h-3" />
                          <span>{sequence.steps.length} emails</span>
                          <span className="text-slate-600">•</span>
                          <TrendingUp className="w-3 h-3" />
                          <span className="text-green-400">{sequence.responseRate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Shimmer effect */}
                    {isSelected && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatDelay: 1,
                        }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Sequence Preview */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedPreset}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-5 bg-slate-900/50 border border-slate-800 rounded-xl"
            >
              <h4 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                Sequence Timeline
              </h4>
              <div className="space-y-3">
                {preset.steps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.1 }}
                    className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
                      <span className="text-sm font-bold text-cyan-400">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">
                        Day {step.delay} - {step.strategy.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Sent {step.delay} days after initial email
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-slate-600 text-slate-400 bg-slate-800/50"
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      +{step.delay}d
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Configuration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <Label className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              Configuration
            </Label>

            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="start-date" className="text-sm text-slate-400">
                Start Date
              </Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-800/50 border-slate-700 focus:border-cyan-500"
              />
            </div>

            {/* Automation Options */}
            <div className="space-y-3 p-4 bg-slate-900/50 border border-slate-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Zap className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <Label htmlFor="auto-mode" className="text-sm font-medium text-white">
                      Auto-Mode (AI Approval)
                    </Label>
                    <p className="text-xs text-slate-500">Sends automatically without manual approval</p>
                  </div>
                </div>
                <Switch
                  id="auto-mode"
                  checked={autoMode}
                  onCheckedChange={setAutoMode}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>

              <Separator className="bg-slate-800" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <Label htmlFor="stop-reply" className="text-sm font-medium text-white">
                      Stop on Reply
                    </Label>
                    <p className="text-xs text-slate-500">Pause sequence when recipient replies</p>
                  </div>
                </div>
                <Switch
                  id="stop-reply"
                  checked={stopOnReply}
                  onCheckedChange={setStopOnReply}
                  className="data-[state=checked]:bg-purple-500"
                />
              </div>
            </div>
          </motion.div>

          {/* Summary Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="p-5 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-cyan-500/20 rounded-lg">
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-white mb-1">Sequence Summary</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {preset.steps.length} automated emails will be sent to{" "}
                  <span className="text-white font-medium">{recipient?.email}</span> starting{" "}
                  <span className="text-cyan-400 font-medium">{startDate}</span>.
                  {autoMode ? " Auto-mode enabled." : " Manual approval required."}
                  {stopOnReply && " Sequence stops on reply."}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {preset.responseRate} Expected
                  </Badge>
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                    <Mail className="w-3 h-3 mr-1" />
                    {preset.steps.length} Emails
                  </Badge>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer with Actions */}
        <DialogFooter className="mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-700 hover:bg-slate-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSchedule}
            disabled={loading}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-500/30"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Schedule Sequence
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
