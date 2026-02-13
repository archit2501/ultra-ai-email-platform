"use client";

/**
 * Content Optimizer - Phase 4 AI-Powered Email Content Optimization
 *
 * Uses ML models to optimize email content for better deliverability and engagement
 *
 * Features:
 * - Subject line variations with predicted open rates
 * - Body content suggestions
 * - Tone analysis and recommendations
 * - Spam risk detection
 * - Multi-Armed Bandit content style recommendations
 */

import React, { useState, useCallback } from "react";
import {
  Sparkles,
  Send,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Copy,
  Lightbulb,
  Gauge,
  TrendingUp,
  MessageSquare,
  FileText,
  Target,
  Shield,
} from "lucide-react";
import { warmupAPI, type ContentOptimization } from "@/lib/warmup-api";

interface ContentOptimizerProps {
  initialSubject?: string;
  initialBody?: string;
  targetProvider?: string;
  onSelectSubject?: (subject: string) => void;
  onApplySuggestion?: (suggestion: string) => void;
  className?: string;
}

export default function ContentOptimizer({
  initialSubject = "",
  initialBody = "",
  targetProvider,
  onSelectSubject,
  onApplySuggestion,
  className = "",
}: ContentOptimizerProps) {
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [provider, setProvider] = useState(targetProvider || "gmail");
  const [optimization, setOptimization] = useState<ContentOptimization | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleOptimize = useCallback(async () => {
    if (!subject && !body) {
      setError("Please enter a subject line or email body to optimize");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await warmupAPI.optimizeContent(
        subject || undefined,
        body || undefined,
        provider
      );
      setOptimization(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to optimize content");
    } finally {
      setLoading(false);
    }
  }, [subject, body, provider]);

  const handleCopySubject = useCallback((text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    onSelectSubject?.(text);
  }, [onSelectSubject]);

  const getSpamRiskColor = (score: number) => {
    if (score < 30) return "text-emerald-500";
    if (score < 60) return "text-amber-500";
    return "text-red-500";
  };

  const getSpamRiskLabel = (score: number) => {
    if (score < 30) return "Low Risk";
    if (score < 60) return "Medium Risk";
    return "High Risk";
  };

  const getToneIcon = (tone: string) => {
    const icons: Record<string, React.ReactNode> = {
      professional: <Target className="w-4 h-4" />,
      casual: <MessageSquare className="w-4 h-4" />,
      friendly: <Sparkles className="w-4 h-4" />,
      formal: <FileText className="w-4 h-4" />,
      creative: <Lightbulb className="w-4 h-4" />,
    };
    return icons[tone.toLowerCase()] || <MessageSquare className="w-4 h-4" />;
  };

  return (
    <div className={`bg-gray-800/50 rounded-xl border border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Sparkles className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h3 className="font-semibold">AI Content Optimizer</h3>
              <p className="text-sm text-gray-400">ML-powered email optimization</p>
            </div>
          </div>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="gmail">Gmail</option>
            <option value="outlook">Outlook</option>
            <option value="yahoo">Yahoo</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Input Section */}
      <div className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Subject Line
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter your email subject line..."
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email Body
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Enter your email body content..."
            rows={4}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
        </div>

        <button
          onClick={handleOptimize}
          disabled={loading || (!subject && !body)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 rounded-lg font-medium transition-all"
        >
          {loading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Optimizing...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Optimize Content
            </>
          )}
        </button>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-500">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>

      {/* Results Section */}
      {optimization && (
        <div className="border-t border-gray-700">
          {/* Subject Variations */}
          {optimization.optimized.subject_variations.length > 0 && (
            <div className="p-4 border-b border-gray-700">
              <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <Send className="w-4 h-4" />
                Subject Line Variations
              </h4>
              <div className="space-y-2">
                {optimization.optimized.subject_variations.map((variation, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors group"
                  >
                    <div className="flex-1 mr-4">
                      <p className="text-sm">{variation.text}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-emerald-500 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {(variation.predicted_open_rate * 100).toFixed(1)}% predicted open rate
                        </span>
                        <span className="text-xs text-gray-400">
                          {(variation.confidence * 100).toFixed(0)}% confidence
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopySubject(variation.text, idx)}
                      className="p-2 opacity-0 group-hover:opacity-100 bg-gray-600 hover:bg-gray-500 rounded-lg transition-all"
                      title="Copy & Select"
                    >
                      {copiedIndex === idx ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Body Suggestions */}
          {optimization.optimized.body_suggestions.length > 0 && (
            <div className="p-4 border-b border-gray-700">
              <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Content Suggestions
              </h4>
              <div className="space-y-2">
                {optimization.optimized.body_suggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm">{suggestion.suggestion}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${
                              suggestion.impact === "high"
                                ? "bg-emerald-500/20 text-emerald-500"
                                : suggestion.impact === "medium"
                                ? "bg-amber-500/20 text-amber-500"
                                : "bg-gray-500/20 text-gray-400"
                            }`}
                          >
                            {suggestion.impact} impact
                          </span>
                          <span className="text-xs text-gray-400">
                            Priority: {suggestion.priority}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => onApplySuggestion?.(suggestion.suggestion)}
                        className="p-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors"
                        title="Apply suggestion"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tone Analysis & Spam Risk */}
          <div className="p-4 grid md:grid-cols-2 gap-4">
            {/* Tone Analysis */}
            <div className="bg-gray-700/30 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Tone Analysis
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Current Tone</span>
                  <span className="flex items-center gap-2 text-sm capitalize">
                    {getToneIcon(optimization.optimized.tone_analysis.current_tone)}
                    {optimization.optimized.tone_analysis.current_tone}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Recommended</span>
                  <span className="flex items-center gap-2 text-sm text-emerald-500 capitalize">
                    {getToneIcon(optimization.optimized.tone_analysis.recommended_tone)}
                    {optimization.optimized.tone_analysis.recommended_tone}
                  </span>
                </div>
                {optimization.optimized.tone_analysis.adjustment_needed && (
                  <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-500 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Tone adjustment recommended
                  </div>
                )}
              </div>
            </div>

            {/* Spam Risk */}
            <div className="bg-gray-700/30 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Spam Risk Analysis
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Risk Score</span>
                  <div className="flex items-center gap-2">
                    <Gauge className={`w-4 h-4 ${getSpamRiskColor(optimization.optimized.spam_risk.score)}`} />
                    <span className={`text-sm font-medium ${getSpamRiskColor(optimization.optimized.spam_risk.score)}`}>
                      {optimization.optimized.spam_risk.score}% - {getSpamRiskLabel(optimization.optimized.spam_risk.score)}
                    </span>
                  </div>
                </div>
                {optimization.optimized.spam_risk.triggers.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Triggers Found:</p>
                    <div className="flex flex-wrap gap-1">
                      {optimization.optimized.spam_risk.triggers.map((trigger, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">
                          {trigger}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {optimization.optimized.spam_risk.recommendations.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Recommendations:</p>
                    <ul className="text-xs text-gray-300 space-y-1">
                      {optimization.optimized.spam_risk.recommendations.slice(0, 3).map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bandit Recommendation */}
          <div className="p-4 border-t border-gray-700">
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-4">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-500" />
                AI Content Style Recommendation
              </h4>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">
                    Based on{" "}
                    <span className="text-purple-400">Thompson Sampling</span> bandit analysis
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Historical performance: {(optimization.bandit_recommendation.historical_performance * 100).toFixed(1)}% success rate
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-purple-400">
                    Style {optimization.bandit_recommendation.content_style + 1}
                  </p>
                  <p className="text-xs text-gray-400">
                    {(optimization.bandit_recommendation.confidence * 100).toFixed(0)}% confidence
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
