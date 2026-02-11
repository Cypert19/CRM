"use client";

import { GlassCard } from "@/components/ui/glass-card";

type FunnelStage = {
  name: string;
  count: number;
  value: number;
  color: string;
};

type PipelineFunnelProps = {
  stages: FunnelStage[];
};

export function PipelineFunnel({ stages }: PipelineFunnelProps) {
  const maxValue = Math.max(...stages.map((s) => s.value), 1);

  return (
    <GlassCard>
      <h3 className="mb-4 text-sm font-semibold text-text-primary">
        Pipeline Funnel
      </h3>
      <div className="space-y-3">
        {stages.map((stage) => {
          const widthPct = Math.max((stage.value / maxValue) * 100, 8);
          return (
            <div key={stage.name} className="group">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-text-secondary">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                  {stage.name}
                </span>
                <span className="font-mono text-text-tertiary">
                  {stage.count} deals
                </span>
              </div>
              <div className="h-8 w-full overflow-hidden rounded-lg bg-bg-card/50">
                <div
                  className="flex h-full items-center rounded-lg px-3 transition-all duration-500"
                  style={{
                    width: `${widthPct}%`,
                    background: `linear-gradient(90deg, ${stage.color}40, ${stage.color}20)`,
                    boxShadow: `0 0 12px ${stage.color}30`,
                  }}
                >
                  <span className="font-mono text-xs text-text-primary">
                    ${(stage.value / 1000).toFixed(0)}k
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
