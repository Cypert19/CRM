"use client";

import { Sparkles, Lightbulb, AlertTriangle, TrendingUp } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";

type Insight = {
  id: string;
  type: "tip" | "warning" | "opportunity";
  message: string;
};

const insightIcons = {
  tip: Lightbulb,
  warning: AlertTriangle,
  opportunity: TrendingUp,
};

const insightColors = {
  tip: "text-accent-cyan",
  warning: "text-signal-warning",
  opportunity: "text-signal-success",
};

type AIInsightsPanelProps = {
  insights: Insight[];
};

export function AIInsightsPanel({ insights }: AIInsightsPanelProps) {
  return (
    <GlassCard glow="cyan">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-accent-primary to-accent-cyan">
          <Sparkles className="h-3 w-3 text-white" />
        </div>
        <h3 className="text-sm font-semibold text-text-primary">
          AI Insights
        </h3>
      </div>

      <div className="space-y-3">
        {insights.length === 0 ? (
          <p className="text-sm text-text-tertiary">
            AI insights will appear here once you have data in your pipeline.
          </p>
        ) : (
          insights.map((insight) => {
            const Icon = insightIcons[insight.type];
            const color = insightColors[insight.type];
            return (
              <div
                key={insight.id}
                className="flex items-start gap-2.5 rounded-lg bg-bg-card/30 p-3"
              >
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${color}`} />
                <p className="text-sm text-text-secondary">{insight.message}</p>
              </div>
            );
          })
        )}
      </div>
    </GlassCard>
  );
}
