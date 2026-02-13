"use client";

import { useState, useCallback } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles,
  Wand2,
  Send,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Mail,
  Clock,
  Target,
  MessageSquare,
  Copy,
  Edit3,
  ArrowRight,
  Loader2,
  Zap,
  Brain,
} from "lucide-react";
import { toast } from "sonner";
import { followUpCopilotAPI } from "@/lib/followup-api";

// Types
interface GeneratedStep {
  step_number: number;
  delay_days: number;
  strategy: string;
  tone: string;
  subject: string;
  body: string;
}

interface GeneratedSequence {
  name: string;
  description: string;
  steps: GeneratedStep[];
}

interface AIMetadata {
  model_used: string;
  tokens_used: number;
  generation_time_ms?: number;
  quality_score?: number;
  personalization_score?: number;
}

interface CopilotContext {
  company_name?: string;
  position?: string;
  industry?: string;
  original_subject?: string;
  original_body?: string;
}

interface AISequenceCopilotProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSequenceGenerated?: (sequence: GeneratedSequence, aiMetadata: AIMetadata) => void;
  context?: CopilotContext;
}

// Tone options
const TONE_OPTIONS = [
  { value: "professional", label: "Professional", description: "Formal and business-like" },
  { value: "friendly", label: "Friendly", description: "Warm and approachable" },
  { value: "persistent", label: "Persistent", description: "Determined but respectful" },
  { value: "value_add", label: "Value-Add", description: "Focus on providing value" },
];

// Strategy suggestions
const STRATEGY_EXAMPLES = [
  "Create a 4-email sequence for software engineering job applications",
  "Generate an aggressive 5-email sequence for sales outreach",
  "Make a gentle 3-email sequence with value-focused content",
  "Build a persistent follow-up sequence for consulting opportunities",
];

export default function AISequenceCopilot({
  open,
  onOpenChange,
  onSequenceGenerated,
  context,
}: AISequenceCopilotProps) {
  // State
  const [activeTab, setActiveTab] = useState<"generate" | "preview">("generate");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  // Form state
  const [userRequest, setUserRequest] = useState("");
  const [numSteps, setNumSteps] = useState(4);
  const [defaultTone, setDefaultTone] = useState("professional");
  const [additionalContext, setAdditionalContext] = useState<CopilotContext>(context || {});

  // Generated sequence state
  const [generatedSequence, setGeneratedSequence] = useState<GeneratedSequence | null>(null);
  const [aiMetadata, setAiMetadata] = useState<AIMetadata | null>(null);
  const [editingStep, setEditingStep] = useState<number | null>(null);

  // Check copilot availability on mount
  const checkAvailability = useCallback(async () => {
    try {
      const status = await followUpCopilotAPI.getStatus();
      setIsAvailable(status.available);
    } catch (error) {
      console.error("[AISequenceCopilot] Failed to check status:", error);
      setIsAvailable(false);
    }
  }, []);

  // Generate sequence
  const handleGenerate = async () => {
    if (!userRequest.trim()) {
      toast.error("Please describe the sequence you want to create");
      return;
    }

    setIsGenerating(true);
    console.log("[AISequenceCopilot] Generating sequence...", {
      userRequest,
      numSteps,
      defaultTone,
      context: additionalContext,
    });

    try {
      const result = await followUpCopilotAPI.generateSequence({
        user_request: userRequest,
        num_steps: numSteps,
        default_tone: defaultTone,
        context: additionalContext,
      });

      if (result.success) {
        setGeneratedSequence({
          name: result.sequence.name || "AI Generated Sequence",
          description: result.sequence.description || "",
          steps: result.sequence.steps.map((step: any) => ({
            step_number: step.step_number,
            delay_days: step.delay_days,
            strategy: step.strategy,
            tone: step.tone,
            subject: step.subject_template || step.subject,
            body: step.body_template || step.body,
          })),
        });
        setAiMetadata(result.ai_metadata);
        setActiveTab("preview");
        toast.success("Sequence generated successfully!");
        console.log("[AISequenceCopilot] Sequence generated:", result);
      } else {
        throw new Error("Failed to generate sequence");
      }
    } catch (error: any) {
      console.error("[AISequenceCopilot] Generation error:", error);
      toast.error(error.message || "Failed to generate sequence. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Save and use sequence
  const handleUseSequence = () => {
    if (generatedSequence && aiMetadata && onSequenceGenerated) {
      onSequenceGenerated(generatedSequence, aiMetadata);
      toast.success("Sequence saved!");
      onOpenChange(false);
    }
  };

  // Edit a step
  const handleEditStep = (stepNumber: number, field: keyof GeneratedStep, value: string | number) => {
    if (!generatedSequence) return;

    setGeneratedSequence({
      ...generatedSequence,
      steps: generatedSequence.steps.map((step) =>
        step.step_number === stepNumber ? { ...step, [field]: value } : step
      ),
    });
  };

  // Copy email content
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  // Regenerate single step
  const handleRegenerateStep = async (stepNumber: number) => {
    if (!generatedSequence) return;

    setIsGenerating(true);
    try {
      const step = generatedSequence.steps.find((s) => s.step_number === stepNumber);
      if (!step) return;

      const result = await followUpCopilotAPI.generateEmail({
        step_number: stepNumber,
        strategy: step.strategy,
        tone: step.tone,
        context: additionalContext,
        previous_emails: generatedSequence.steps
          .filter((s) => s.step_number < stepNumber)
          .map((s) => ({ subject: s.subject, body: s.body })),
      });

      if (result.success) {
        handleEditStep(stepNumber, "subject", result.email.subject);
        handleEditStep(stepNumber, "body", result.email.body);
        toast.success(`Step ${stepNumber} regenerated!`);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to regenerate step");
    } finally {
      setIsGenerating(false);
    }
  };

  // Use example
  const useExample = (example: string) => {
    setUserRequest(example);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20">
              <Brain className="h-5 w-5 text-purple-500" />
            </div>
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              AI Sequence Copilot
            </span>
            <Badge variant="secondary" className="ml-2">
              GPT-4 Powered
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Describe your follow-up sequence and let AI generate personalized email content
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "generate" | "preview")} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              Generate
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={!generatedSequence} className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Preview ({generatedSequence?.steps.length || 0} emails)
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto py-4">
            <TabsContent value="generate" className="mt-0 space-y-6">
              {/* AI Request Input */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  Describe your sequence
                </Label>
                <Textarea
                  value={userRequest}
                  onChange={(e) => setUserRequest(e.target.value)}
                  placeholder="E.g., Create a 4-email sequence for software engineering job applications with a professional but friendly tone..."
                  className="min-h-[100px] resize-none"
                />

                {/* Example suggestions */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-muted-foreground">Examples:</span>
                  {STRATEGY_EXAMPLES.map((example, i) => (
                    <button
                      key={i}
                      onClick={() => useExample(example)}
                      className="text-xs text-purple-500 hover:text-purple-600 hover:underline"
                    >
                      "{example.slice(0, 40)}..."
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Number of steps */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Number of follow-ups
                  </Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[numSteps]}
                      onValueChange={(v) => setNumSteps(v[0])}
                      min={2}
                      max={8}
                      step={1}
                      className="flex-1"
                    />
                    <Badge variant="outline" className="min-w-[60px] justify-center">
                      {numSteps} emails
                    </Badge>
                  </div>
                </div>

                {/* Default tone */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Default tone
                  </Label>
                  <Select value={defaultTone} onValueChange={setDefaultTone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TONE_OPTIONS.map((tone) => (
                        <SelectItem key={tone.value} value={tone.value}>
                          <div className="flex flex-col">
                            <span>{tone.label}</span>
                            <span className="text-xs text-muted-foreground">{tone.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Optional context */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Additional context (optional)
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Company name"
                    value={additionalContext.company_name || ""}
                    onChange={(e) =>
                      setAdditionalContext({ ...additionalContext, company_name: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Position/Role"
                    value={additionalContext.position || ""}
                    onChange={(e) =>
                      setAdditionalContext({ ...additionalContext, position: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Industry"
                    value={additionalContext.industry || ""}
                    onChange={(e) =>
                      setAdditionalContext({ ...additionalContext, industry: e.target.value })
                    }
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="mt-0 space-y-4">
              {generatedSequence && (
                <>
                  {/* Sequence info */}
                  <Card className="border-purple-500/20 bg-purple-500/5">
                    <CardHeader className="py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{generatedSequence.name}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {generatedSequence.description}
                          </p>
                        </div>
                        {aiMetadata && (
                          <div className="text-right text-xs text-muted-foreground">
                            <p>Model: {aiMetadata.model_used}</p>
                            <p>Tokens: {aiMetadata.tokens_used}</p>
                            {aiMetadata.generation_time_ms && (
                              <p>Time: {aiMetadata.generation_time_ms}ms</p>
                            )}
                          </div>
                        )}
                      </div>
                    </CardHeader>
                  </Card>

                  {/* Email steps */}
                  <div className="space-y-4">
                    {generatedSequence.steps.map((step, index) => (
                      <motion.div
                        key={step.step_number}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-pink-500" />
                          <CardContent className="py-4 pl-5">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <Badge variant="outline">Step {step.step_number}</Badge>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  Day {step.delay_days}
                                </div>
                                <Badge variant="secondary">{step.strategy}</Badge>
                                <Badge variant="secondary">{step.tone}</Badge>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRegenerateStep(step.step_number)}
                                  disabled={isGenerating}
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setEditingStep(
                                      editingStep === step.step_number ? null : step.step_number
                                    )
                                  }
                                >
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(`${step.subject}\n\n${step.body}`)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            <AnimatePresence mode="wait">
                              {editingStep === step.step_number ? (
                                <motion.div
                                  key="editing"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="space-y-3"
                                >
                                  <Input
                                    value={step.subject}
                                    onChange={(e) =>
                                      handleEditStep(step.step_number, "subject", e.target.value)
                                    }
                                    placeholder="Subject line"
                                    className="font-medium"
                                  />
                                  <Textarea
                                    value={step.body}
                                    onChange={(e) =>
                                      handleEditStep(step.step_number, "body", e.target.value)
                                    }
                                    placeholder="Email body"
                                    className="min-h-[150px]"
                                  />
                                </motion.div>
                              ) : (
                                <motion.div
                                  key="preview"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                >
                                  <p className="font-medium text-sm mb-2">{step.subject}</p>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">
                                    {step.body}
                                  </p>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>
          </div>
        </Tabs>

        <Separator />

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>

          {activeTab === "generate" ? (
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !userRequest.trim()}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Sequence
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleUseSequence}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Use This Sequence
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
