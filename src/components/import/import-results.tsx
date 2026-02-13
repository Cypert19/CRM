"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Building2,
  Users,
  Target,
  FileText,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  LayoutDashboard,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/gradient-button";
import type { ImportResult } from "@/types/import";

type Props = {
  result: ImportResult;
  onReset: () => void;
};

const ENTITY_CONFIG = [
  { key: "companies" as const, label: "Companies", icon: Building2, color: "text-accent-primary" },
  { key: "contacts" as const, label: "Contacts", icon: Users, color: "text-accent-primary" },
  { key: "deals" as const, label: "Deals", icon: Target, color: "text-accent-primary" },
  { key: "notes" as const, label: "Notes", icon: FileText, color: "text-accent-primary" },
  { key: "tasks" as const, label: "Tasks", icon: CheckSquare, color: "text-accent-primary" },
];

export function ImportResults({ result, onReset }: Props) {
  const router = useRouter();
  const [showErrors, setShowErrors] = useState(false);

  const hasErrors = result.totalFailed > 0;
  const allFailed = result.totalCreated === 0 && result.totalFailed > 0;

  return (
    <div className="flex flex-col items-center py-8">
      {/* Success/Warning Icon */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.6 }}
        className="mb-6"
      >
        {allFailed ? (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-signal-danger/10">
            <XCircle className="h-8 w-8 text-signal-danger" />
          </div>
        ) : hasErrors ? (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-signal-warning/10">
            <AlertTriangle className="h-8 w-8 text-signal-warning" />
          </div>
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-signal-success/10">
            <CheckCircle2 className="h-8 w-8 text-signal-success" />
          </div>
        )}
      </motion.div>

      {/* Summary Message */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8 text-center"
      >
        <h3 className="text-lg font-semibold text-text-primary">
          {allFailed
            ? "Import Failed"
            : hasErrors
              ? "Import Completed with Errors"
              : "Import Successful"}
        </h3>
        <p className="mt-1 text-sm text-text-tertiary">
          {result.totalCreated} record{result.totalCreated !== 1 ? "s" : ""} created
          {hasErrors
            ? ` · ${result.totalFailed} failed`
            : ""}
        </p>
      </motion.div>

      {/* Entity Breakdown */}
      <div className="mb-8 grid w-full max-w-lg grid-cols-5 gap-3">
        {ENTITY_CONFIG.map((entity, i) => {
          const count = result.counts[entity.key];
          const hasCount = count.success > 0 || count.failed > 0;
          if (!hasCount) return null;

          return (
            <motion.div
              key={entity.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
            >
              <GlassCard className="flex flex-col items-center p-4">
                <entity.icon className={`mb-2 h-5 w-5 ${entity.color}`} />
                <p className="text-lg font-bold text-text-primary">{count.success}</p>
                <p className="text-[10px] text-text-tertiary">{entity.label}</p>
                {count.failed > 0 && (
                  <p className="mt-1 text-[10px] text-signal-danger">
                    {count.failed} failed
                  </p>
                )}
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* Error Details */}
      {hasErrors && result.errors.length > 0 && (
        <div className="mb-8 w-full max-w-lg">
          <button
            onClick={() => setShowErrors(!showErrors)}
            className="flex w-full items-center justify-between rounded-xl bg-signal-danger/5 px-4 py-3 text-sm text-signal-danger transition-colors hover:bg-signal-danger/10"
          >
            <span>
              {result.errors.length} error{result.errors.length !== 1 ? "s" : ""}
            </span>
            {showErrors ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {showErrors && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-2 max-h-60 overflow-y-auto rounded-xl bg-bg-card/50 p-3"
            >
              {result.errors.map((err, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 border-b border-border-glass py-2 last:border-0"
                >
                  <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-signal-danger" />
                  <div className="min-w-0">
                    <span className="text-xs font-medium text-text-secondary">
                      {err.entityType}
                    </span>
                    <p className="text-xs text-text-tertiary">{err.error}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={onReset}>
          <RotateCcw className="h-3.5 w-3.5" />
          Import More
        </Button>
        <Button onClick={() => router.push("/dashboard")}>
          <LayoutDashboard className="h-3.5 w-3.5" />
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
