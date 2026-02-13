"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface EmailVariationCardProps {
  tone: string;
  subject: string;
  body: string;
  personalizationScore: number;
  matchedSkills: Array<{ candidate_skill: string; match_confidence: number }>;
  estimatedResponseRate: string;
  selected?: boolean;
  onSelect: () => void;
}

export function EmailVariationCard({
  tone,
  subject,
  body,
  personalizationScore,
  matchedSkills,
  estimatedResponseRate,
  selected = false,
  onSelect,
}: EmailVariationCardProps) {
  const scoreColor =
    personalizationScore >= 70
      ? "text-green-400 border-green-500/30"
      : personalizationScore >= 50
      ? "text-yellow-400 border-yellow-500/30"
      : "text-red-400 border-red-500/30";

  const toneColors: Record<string, string> = {
    professional: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    enthusiastic: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    story_driven: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    value_first: "bg-green-500/20 text-green-300 border-green-500/30",
    consultant: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  };

  const toneColor = toneColors[tone] || "bg-slate-500/20 text-slate-300";

  return (
    <Card
      className={`p-4 transition-all cursor-pointer ${
        selected
          ? "ring-2 ring-cyan-500 border-cyan-500 bg-cyan-500/5"
          : "hover:border-slate-600"
      }`}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <Badge className={toneColor}>
          {tone.replace("_", " ").toUpperCase()}
        </Badge>
        {selected && (
          <div className="flex items-center gap-1 text-cyan-400">
            <Check className="h-4 w-4" />
            <span className="text-xs">Selected</span>
          </div>
        )}
      </div>

      {/* Subject */}
      <h4 className="text-sm font-medium text-slate-200 mb-2 line-clamp-2">
        {subject}
      </h4>

      {/* Body Preview */}
      <p className="text-xs text-slate-400 mb-3 line-clamp-3">{body.substring(0, 150)}...</p>

      {/* Scores */}
      <div className="flex items-center justify-between mb-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Score:</span>
          <span className={scoreColor + " font-semibold"}>
            {personalizationScore.toFixed(0)}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Response:</span>
          <span className="text-slate-300">{estimatedResponseRate}</span>
        </div>
      </div>

      {/* Matched Skills */}
      {matchedSkills && matchedSkills.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-slate-500 mb-1">Matched Skills:</div>
          <div className="flex flex-wrap gap-1">
            {matchedSkills.slice(0, 3).map((skill, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {skill.candidate_skill}
              </Badge>
            ))}
            {matchedSkills.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{matchedSkills.length - 3}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Select Button */}
      <Button
        size="sm"
        variant={selected ? "default" : "outline"}
        className="w-full"
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        {selected ? "Selected" : "Select This Tone"}
      </Button>
    </Card>
  );
}
