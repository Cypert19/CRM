"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import type { PipelineStageReport } from "@/actions/reports";

type Props = {
  stages: PipelineStageReport[];
};

export function PipelineStageChart({ stages }: Props) {
  const maxValue = Math.max(...stages.map((s) => s.value), 1);

  const formatValue = (v: number) => {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
    return `$${v}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.8 }}
    >
      <GlassCard>
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-text-primary">Pipeline by Stage</h3>
          <p className="text-xs text-text-tertiary">Deal distribution across pipeline stages</p>
        </div>

        {stages.length > 0 ? (
          <div className="space-y-4">
            {stages.map((stage, index) => {
              const pct = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;
              return (
                <div key={stage.name} className="group">
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: stage.color }}
                      />
                      <span className="text-xs font-medium text-text-primary">{stage.name}</span>
                      {stage.is_won && (
                        <span className="rounded-full bg-signal-success/20 px-1.5 py-0.5 text-[9px] font-medium text-signal-success">
                          WON
                        </span>
                      )}
                      {stage.is_lost && (
                        <span className="rounded-full bg-signal-danger/20 px-1.5 py-0.5 text-[9px] font-medium text-signal-danger">
                          LOST
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-text-tertiary">{stage.count} deals</span>
                      <span className="font-medium text-text-primary">{formatValue(stage.value)}</span>
                    </div>
                  </div>

                  <div className="relative h-3 overflow-hidden rounded-full bg-bg-elevated/50">
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${stage.color}CC, ${stage.color})`,
                        boxShadow: `0 0 12px ${stage.color}40`,
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(pct, 2)}%` }}
                      transition={{
                        duration: 1,
                        delay: 0.3 + index * 0.12,
                        ease: [0.25, 0.46, 0.45, 0.94],
                      }}
                    />
                    {/* Shimmer effect */}
                    <motion.div
                      className="absolute inset-y-0 left-0 w-full"
                      style={{
                        background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)`,
                        width: `${Math.max(pct, 2)}%`,
                      }}
                      initial={{ x: "-100%" }}
                      animate={{ x: "200%" }}
                      transition={{
                        duration: 1.5,
                        delay: 1 + index * 0.12,
                        ease: "easeInOut",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center">
            <p className="text-sm text-text-tertiary">No deals in pipeline</p>
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}
