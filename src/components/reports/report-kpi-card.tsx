"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { AnimatedCounter } from "./animated-counter";
import type { ReactNode } from "react";

type ReportKPICardProps = {
  label: string;
  value: number;
  format?: "currency" | "number" | "percent" | "days";
  icon: ReactNode;
  glow?: "violet" | "cyan" | "success" | "warning" | "danger";
  subtitle?: string;
  delay?: number;
};

export function ReportKPICard({
  label,
  value,
  format = "number",
  icon,
  glow,
  subtitle,
  delay = 0,
}: ReportKPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      <GlassCard glow={glow} className="relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full opacity-10 blur-2xl"
          style={{
            background: glow === "violet" ? "#F97316"
              : glow === "cyan" ? "#F97316"
              : glow === "success" ? "#10B981"
              : glow === "danger" ? "#F43F5E"
              : glow === "warning" ? "#F59E0B"
              : "#F97316",
          }}
        />

        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
              {label}
            </p>
            <div className="mt-2">
              <AnimatedCounter
                value={value}
                format={format}
                className="text-2xl font-bold text-text-primary"
              />
            </div>
            {subtitle && (
              <p className="mt-1 text-xs text-text-tertiary">{subtitle}</p>
            )}
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bg-elevated/50">
            {icon}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
