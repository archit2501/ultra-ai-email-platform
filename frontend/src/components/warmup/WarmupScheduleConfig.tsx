"use client";

/**
 * WarmupScheduleConfig.tsx
 *
 * Configuration panel for warmup schedule and settings
 * Allows users to customize ramp-up rates, timing, and automation
 *
 * @version 2.0.0
 */

import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  Clock,
  Calendar,
  TrendingUp,
  Zap,
  Save,
  RefreshCw,
  Info,
  AlertCircle,
  Sun,
  Moon,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import warmupAPI from "@/lib/warmup-api";

// ============================================================================
// Types
// ============================================================================

interface WarmupSchedule {
  dailyVolume: number;
  rampUpRate: number; // Percentage increase per day
  maxDailyVolume: number;
  sendWindowStart: number; // Hour (0-23)
  sendWindowEnd: number; // Hour (0-23)
  timezone: string;
  daysActive: string[]; // ['mon', 'tue', ...]
  autoRespond: boolean;
  responseDelay: { min: number; max: number }; // Minutes
  readEmulation: boolean;
  spamRescue: boolean;
}

interface WarmupScheduleConfigProps {
  selectedAccountId?: string | null;
  onSave?: () => void;
  onUpdate?: (schedule: Partial<{
    timezone: string;
    startHour: number;
    endHour: number;
    activeDays: Record<string, boolean>;
    minDelay: number;
    maxDelay: number;
  }>) => void;
  schedule?: {
    timezone: string;
    startHour: number;
    endHour: number;
    activeDays: Record<string, boolean>;
    minDelay: number;
    maxDelay: number;
  };
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_SCHEDULE: WarmupSchedule = {
  dailyVolume: 5,
  rampUpRate: 20,
  maxDailyVolume: 50,
  sendWindowStart: 9,
  sendWindowEnd: 17,
  timezone: "America/New_York",
  daysActive: ["mon", "tue", "wed", "thu", "fri"],
  autoRespond: true,
  responseDelay: { min: 30, max: 180 },
  readEmulation: true,
  spamRescue: true,
};

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern (ET)" },
  { value: "America/Chicago", label: "Central (CT)" },
  { value: "America/Denver", label: "Mountain (MT)" },
  { value: "America/Los_Angeles", label: "Pacific (PT)" },
  { value: "Europe/London", label: "GMT/BST" },
  { value: "Europe/Paris", label: "CET" },
  { value: "Asia/Tokyo", label: "JST" },
  { value: "Asia/Kolkata", label: "IST" },
];

const DAYS = [
  { value: "mon", label: "M" },
  { value: "tue", label: "T" },
  { value: "wed", label: "W" },
  { value: "thu", label: "T" },
  { value: "fri", label: "F" },
  { value: "sat", label: "S" },
  { value: "sun", label: "S" },
];

// ============================================================================
// Components
// ============================================================================

function DaySelector({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (days: string[]) => void;
}) {
  const toggleDay = (day: string) => {
    if (selected.includes(day)) {
      onChange(selected.filter((d) => d !== day));
    } else {
      onChange([...selected, day]);
    }
  };

  return (
    <div className="flex gap-1">
      {DAYS.map((day) => (
        <button
          key={day.value}
          type="button"
          onClick={() => toggleDay(day.value)}
          className={cn(
            "w-8 h-8 rounded-full text-sm font-medium transition-colors",
            selected.includes(day.value)
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          {day.label}
        </button>
      ))}
    </div>
  );
}

function InfoTooltip({ content }: { content: string }) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <Info className="w-4 h-4 text-muted-foreground" />
      </TooltipTrigger>
      <TooltipContent className="max-w-[200px]">
        <p className="text-xs">{content}</p>
      </TooltipContent>
    </Tooltip>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function WarmupScheduleConfig({
  selectedAccountId,
  onSave,
  className,
}: WarmupScheduleConfigProps) {
  const [schedule, setSchedule] = useState<WarmupSchedule>(DEFAULT_SCHEDULE);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Update schedule field
  const updateSchedule = useCallback((updates: Partial<WarmupSchedule>) => {
    setSchedule((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  }, []);

  // Save configuration
  const handleSave = useCallback(async () => {
    if (!selectedAccountId) {
      toast.error("Please select an account first");
      return;
    }

    console.log("[WarmupScheduleConfig] Saving schedule:", {
      accountId: selectedAccountId,
      schedule,
    });
    setIsSaving(true);

    try {
      // Use warmupAPI instead of direct fetch
      const result = await warmupAPI.updateSchedule({
        timezone: schedule.timezone,
        active_hours: {
          start: schedule.sendWindowStart,
          end: schedule.sendWindowEnd,
        },
        active_days: schedule.daysActive.reduce((acc, day) => {
          acc[day] = true;
          return acc;
        }, {} as Record<string, boolean>),
        delays: {
          send: {
            min: schedule.responseDelay.min * 60, // Convert to seconds
            max: schedule.responseDelay.max * 60,
          },
        },
        preferences: {
          auto_respond: schedule.autoRespond,
          read_emulation: schedule.readEmulation,
          spam_rescue: schedule.spamRescue,
        },
      });

      console.log("[WarmupScheduleConfig] Schedule saved successfully:", result);
      toast.success("Warmup schedule saved successfully");
      setHasChanges(false);
      onSave?.();
    } catch (error) {
      console.error("[WarmupScheduleConfig] Error saving schedule:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save schedule");
    } finally {
      setIsSaving(false);
    }
  }, [selectedAccountId, schedule, onSave]);

  // Calculate projected ramp-up
  const projectedDays = Math.ceil(
    Math.log(schedule.maxDailyVolume / schedule.dailyVolume) /
      Math.log(1 + schedule.rampUpRate / 100)
  );

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          Warmup Schedule
        </CardTitle>
        <CardDescription>
          Configure email warmup volume, timing, and automation
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Volume Settings */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Volume & Ramp-up
          </h4>

          {/* Daily Volume Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                Starting Daily Volume
                <InfoTooltip content="Number of warmup emails to send per day initially" />
              </Label>
              <span className="text-sm font-medium">{schedule.dailyVolume} emails/day</span>
            </div>
            <Slider
              value={[schedule.dailyVolume]}
              onValueChange={([value]) => updateSchedule({ dailyVolume: value })}
              min={1}
              max={20}
              step={1}
              className="w-full"
            />
          </div>

          {/* Ramp-up Rate */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                Daily Ramp-up Rate
                <InfoTooltip content="Percentage increase in volume each day" />
              </Label>
              <span className="text-sm font-medium">{schedule.rampUpRate}%/day</span>
            </div>
            <Slider
              value={[schedule.rampUpRate]}
              onValueChange={([value]) => updateSchedule({ rampUpRate: value })}
              min={5}
              max={50}
              step={5}
              className="w-full"
            />
          </div>

          {/* Max Daily Volume */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                Maximum Daily Volume
                <InfoTooltip content="Cap on warmup emails per day after ramp-up" />
              </Label>
              <span className="text-sm font-medium">{schedule.maxDailyVolume} emails/day</span>
            </div>
            <Slider
              value={[schedule.maxDailyVolume]}
              onValueChange={([value]) => updateSchedule({ maxDailyVolume: value })}
              min={10}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          {/* Projection Badge */}
          <div className="p-3 bg-primary/10 rounded-lg flex items-center justify-between">
            <span className="text-sm">Time to reach max volume:</span>
            <Badge variant="secondary" className="font-mono">
              ~{projectedDays} days
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Timing Settings */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Timing & Schedule
          </h4>

          {/* Send Window */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Sun className="w-4 h-4" />
                Window Start
              </Label>
              <Select
                value={schedule.sendWindowStart.toString()}
                onValueChange={(v) => updateSchedule({ sendWindowStart: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {i.toString().padStart(2, "0")}:00
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Moon className="w-4 h-4" />
                Window End
              </Label>
              <Select
                value={schedule.sendWindowEnd.toString()}
                onValueChange={(v) => updateSchedule({ sendWindowEnd: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {i.toString().padStart(2, "0")}:00
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <Label>Timezone</Label>
            <Select
              value={schedule.timezone}
              onValueChange={(v) => updateSchedule({ timezone: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active Days */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Active Days
            </Label>
            <DaySelector
              selected={schedule.daysActive}
              onChange={(days) => updateSchedule({ daysActive: days })}
            />
          </div>
        </div>

        <Separator />

        {/* Automation Settings */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Automation
          </h4>

          {/* Auto Respond */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                Auto-respond to Partners
                <InfoTooltip content="Automatically generate and send AI replies to warmup emails" />
              </Label>
              <p className="text-xs text-muted-foreground">
                AI generates natural conversation replies
              </p>
            </div>
            <Switch
              checked={schedule.autoRespond}
              onCheckedChange={(checked) => updateSchedule({ autoRespond: checked })}
            />
          </div>

          {/* Response Delay */}
          {schedule.autoRespond && (
            <div className="pl-4 border-l-2 border-primary/30 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Response Delay Range</Label>
                <span className="text-sm text-muted-foreground">
                  {schedule.responseDelay.min}-{schedule.responseDelay.max} min
                </span>
              </div>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  value={schedule.responseDelay.min}
                  onChange={(e) =>
                    updateSchedule({
                      responseDelay: {
                        ...schedule.responseDelay,
                        min: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-20"
                  min={5}
                  max={schedule.responseDelay.max}
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="number"
                  value={schedule.responseDelay.max}
                  onChange={(e) =>
                    updateSchedule({
                      responseDelay: {
                        ...schedule.responseDelay,
                        max: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-20"
                  min={schedule.responseDelay.min}
                  max={480}
                />
                <span className="text-xs text-muted-foreground">minutes</span>
              </div>
            </div>
          )}

          {/* Read Emulation */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                Read Behavior Emulation
                <InfoTooltip content="Simulate human-like email reading patterns" />
              </Label>
              <p className="text-xs text-muted-foreground">
                Random open times, scroll depth, mark important
              </p>
            </div>
            <Switch
              checked={schedule.readEmulation}
              onCheckedChange={(checked) => updateSchedule({ readEmulation: checked })}
            />
          </div>

          {/* Spam Rescue */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                Auto Spam Rescue
                <InfoTooltip content="Automatically move emails from spam to inbox and mark as not spam" />
              </Label>
              <p className="text-xs text-muted-foreground">
                Rescue emails landing in spam folder
              </p>
            </div>
            <Switch
              checked={schedule.spamRescue}
              onCheckedChange={(checked) => updateSchedule({ spamRescue: checked })}
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div>
            {hasChanges && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-yellow-600 flex items-center gap-1"
              >
                <AlertCircle className="w-4 h-4" />
                Unsaved changes
              </motion.span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSchedule(DEFAULT_SCHEDULE);
                setHasChanges(false);
              }}
              disabled={!hasChanges}
            >
              Reset
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving || !selectedAccountId}
              className="gap-2"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Schedule
                </>
              )}
            </Button>
          </div>
        </div>

        {/* No Account Warning */}
        {!selectedAccountId && (
          <div className="p-3 bg-yellow-500/10 rounded-lg flex items-center gap-2 text-sm text-yellow-600">
            <AlertCircle className="w-4 h-4" />
            Select an account in the Accounts tab to configure its schedule
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default WarmupScheduleConfig;
