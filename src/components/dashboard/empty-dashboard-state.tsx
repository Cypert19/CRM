"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { LayoutDashboard, Plus } from "lucide-react";

type Props = {
  onCreateDashboard: () => void;
};

export function EmptyDashboardState({ onCreateDashboard }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <GlassCard className="py-16 text-center">
        <LayoutDashboard className="mx-auto h-12 w-12 text-text-tertiary/30" />
        <h3 className="mt-4 text-lg font-semibold text-text-primary">
          Create Your First Dashboard
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-text-tertiary">
          Build custom dashboards with KPI tiles, charts, and data tables.
          Drag and drop to arrange your perfect analytics view.
        </p>
        <button
          onClick={onCreateDashboard}
          className="gradient-button mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Create Dashboard
        </button>
      </GlassCard>
    </motion.div>
  );
}
