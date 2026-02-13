"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Users,
  Target,
  FileText,
  CheckSquare,
  AlertTriangle,
  ArrowLeft,
  Download,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/gradient-button";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EntityReviewTable } from "./entity-review-table";
import { checkDuplicates } from "@/actions/import";
import type {
  ParsedImportData,
  ImportPayload,
  PipelineStageOption,
  DuplicateReport,
} from "@/types/import";

type Props = {
  data: ParsedImportData;
  stages: PipelineStageOption[];
  defaultPipelineId: string | null;
  onConfirm: (payload: ImportPayload) => void;
  onBack: () => void;
};

const TAB_CONFIG = [
  { key: "companies" as const, label: "Companies", icon: Building2 },
  { key: "contacts" as const, label: "Contacts", icon: Users },
  { key: "deals" as const, label: "Deals", icon: Target },
  { key: "notes" as const, label: "Notes", icon: FileText },
  { key: "tasks" as const, label: "Tasks", icon: CheckSquare },
];

export function ImportReview({ data, stages, defaultPipelineId, onConfirm, onBack }: Props) {
  const [importData, setImportData] = useState<ParsedImportData>(data);
  const [stageMappings, setStageMappings] = useState<Record<string, string>>(
    () => {
      // Initialize from AI mappings, filtering out nulls
      const mappings: Record<string, string> = {};
      for (const [stageName, stageId] of Object.entries(data.stageMappings)) {
        if (stageId) mappings[stageName] = stageId;
      }
      return mappings;
    }
  );
  const [duplicates, setDuplicates] = useState<DuplicateReport>({
    contacts: [],
    companies: [],
  });

  // Check for duplicates on mount
  useEffect(() => {
    async function loadDuplicates() {
      const contactsForCheck = importData.contacts.map((c) => ({
        _tempId: c._tempId,
        email: c.email,
        first_name: c.first_name,
        last_name: c.last_name,
      }));
      const companiesForCheck = importData.companies.map((c) => ({
        _tempId: c._tempId,
        company_name: c.company_name,
        domain: c.domain,
      }));

      const result = await checkDuplicates(contactsForCheck, companiesForCheck);
      if (result.success && result.data) {
        setDuplicates(result.data);

        // Mark duplicates with warnings
        setImportData((prev) => ({
          ...prev,
          contacts: prev.contacts.map((c) => {
            const dupe = result.data!.contacts.find((d) => d.tempId === c._tempId);
            if (dupe) {
              return {
                ...c,
                _status: c._status === "error" ? "error" : "warning",
                _warnings: [
                  ...c._warnings,
                  `Possible duplicate: ${dupe.existingName} (matched by ${dupe.matchField})`,
                ],
              };
            }
            return c;
          }),
          companies: prev.companies.map((c) => {
            const dupe = result.data!.companies.find((d) => d.tempId === c._tempId);
            if (dupe) {
              return {
                ...c,
                _status: c._status === "error" ? "error" : "warning",
                _warnings: [
                  ...c._warnings,
                  `Possible duplicate: ${dupe.existingName} (matched by ${dupe.matchField})`,
                ],
              };
            }
            return c;
          }),
        }));
      }
    }
    loadDuplicates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toggle include/exclude
  const toggleInclude = (entityType: keyof ParsedImportData, tempId: string) => {
    if (entityType === "stageMappings" || entityType === "warnings" || entityType === "summary") return;
    setImportData((prev) => ({
      ...prev,
      [entityType]: prev[entityType].map((item) =>
        item._tempId === tempId ? { ...item, _included: !item._included } : item
      ),
    }));
  };

  // Unmapped stages that need user attention
  const unmappedStages = useMemo(() => {
    return Object.entries(data.stageMappings)
      .filter(([, stageId]) => !stageId)
      .map(([stageName]) => stageName)
      .filter((name) => !stageMappings[name]);
  }, [data.stageMappings, stageMappings]);

  const hasDealsWithUnmappedStages =
    importData.deals.some((d) => d._included && d._stageName && !stageMappings[d._stageName] && !data.stageMappings[d._stageName]);

  // Count included records
  const includedCounts = useMemo(() => ({
    companies: importData.companies.filter((c) => c._included).length,
    contacts: importData.contacts.filter((c) => c._included).length,
    deals: importData.deals.filter((d) => d._included).length,
    notes: importData.notes.filter((n) => n._included).length,
    tasks: importData.tasks.filter((t) => t._included).length,
  }), [importData]);

  const totalIncluded =
    includedCounts.companies +
    includedCounts.contacts +
    includedCounts.deals +
    includedCounts.notes +
    includedCounts.tasks;

  // Strip review metadata from an entity
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function stripReviewMeta(entity: any) {
    const { _included, _status, _errors, _warnings, ...rest } = entity;
    void _included; void _status; void _errors; void _warnings;
    return rest;
  }

  // Build import payload
  const handleConfirm = () => {
    const payload: ImportPayload = {
      companies: importData.companies
        .filter((c) => c._included)
        .map(stripReviewMeta),
      contacts: importData.contacts
        .filter((c) => c._included)
        .map(stripReviewMeta),
      deals: importData.deals
        .filter((d) => d._included)
        .map((d) => {
          const deal = stripReviewMeta(d);
          // Apply stage mappings
          if (deal._stageName) {
            const mappedStageId =
              stageMappings[deal._stageName] || data.stageMappings[deal._stageName];
            if (mappedStageId) {
              deal.stage_id = mappedStageId;
              // Find the pipeline_id for this stage
              const stage = stages.find((s) => s.id === mappedStageId);
              if (stage) deal.pipeline_id = stage.pipeline_id;
            }
          }
          // Fallback: use default pipeline's first stage
          if (!deal.stage_id && defaultPipelineId && stages.length > 0) {
            const defaultStage = stages.find((s) => s.pipeline_id === defaultPipelineId);
            if (defaultStage) {
              deal.stage_id = defaultStage.id;
              deal.pipeline_id = defaultPipelineId;
            }
          }
          return deal;
        }),
      notes: importData.notes
        .filter((n) => n._included)
        .map(stripReviewMeta),
      tasks: importData.tasks
        .filter((t) => t._included)
        .map(stripReviewMeta),
    };

    onConfirm(payload);
  };

  // Find first tab with data
  const firstTabWithData = TAB_CONFIG.find(
    (tab) =>
      tab.key === "companies" ? importData.companies.length > 0 :
      tab.key === "contacts" ? importData.contacts.length > 0 :
      tab.key === "deals" ? importData.deals.length > 0 :
      tab.key === "notes" ? importData.notes.length > 0 :
      importData.tasks.length > 0
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Review Import Data</h3>
          <p className="text-xs text-text-tertiary">{data.summary}</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-accent-primary/10 px-3 py-1.5">
          <span className="text-xs font-medium text-accent-primary">
            {totalIncluded} record{totalIncluded !== 1 ? "s" : ""} selected
          </span>
        </div>
      </div>

      {/* Warnings from AI */}
      {data.warnings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <GlassCard className="border border-signal-warning/20 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-signal-warning" />
              <div className="space-y-1">
                {data.warnings.map((warning, i) => (
                  <p key={i} className="text-xs text-signal-warning">{warning}</p>
                ))}
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Stage Mapping Panel */}
      {(unmappedStages.length > 0 || hasDealsWithUnmappedStages) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <GlassCard className="border border-accent-primary/20 p-4">
            <h4 className="mb-3 text-xs font-semibold text-text-primary">
              Map Pipeline Stages
            </h4>
            <p className="mb-4 text-xs text-text-tertiary">
              Some deal stages from the import don&apos;t match your existing pipeline. Map them below:
            </p>
            <div className="space-y-3">
              {Object.entries(data.stageMappings)
                .filter(([, stageId]) => !stageId)
                .map(([stageName]) => (
                  <div key={stageName} className="flex items-center gap-4">
                    <span className="w-40 truncate text-sm text-text-secondary">
                      &ldquo;{stageName}&rdquo;
                    </span>
                    <span className="text-xs text-text-tertiary">→</span>
                    <Select
                      value={stageMappings[stageName] || ""}
                      onValueChange={(value) =>
                        setStageMappings((prev) => ({ ...prev, [stageName]: value }))
                      }
                    >
                      <SelectTrigger className="h-8 w-56 text-xs">
                        <SelectValue placeholder="Select a stage" />
                      </SelectTrigger>
                      <SelectContent>
                        {stages.map((stage) => (
                          <SelectItem key={stage.id} value={stage.id}>
                            {stage.name}
                            {stage.pipeline_name ? ` (${stage.pipeline_name})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Entity Tabs */}
      <Tabs defaultValue={firstTabWithData?.key || "companies"} className="mt-4">
        <TabsList>
          {TAB_CONFIG.map((tab) => {
            const count =
              tab.key === "companies" ? importData.companies.length :
              tab.key === "contacts" ? importData.contacts.length :
              tab.key === "deals" ? importData.deals.length :
              tab.key === "notes" ? importData.notes.length :
              importData.tasks.length;

            if (count === 0) return null;

            return (
              <TabsTrigger key={tab.key} value={tab.key} className="gap-2">
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
                <span className="ml-1 rounded-full bg-bg-elevated px-1.5 py-0.5 text-[10px] font-medium">
                  {count}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="companies">
          <EntityReviewTable
            entityType="companies"
            items={importData.companies}
            duplicates={duplicates.companies}
            onToggleInclude={(id) => toggleInclude("companies", id)}
          />
        </TabsContent>
        <TabsContent value="contacts">
          <EntityReviewTable
            entityType="contacts"
            items={importData.contacts}
            duplicates={duplicates.contacts}
            onToggleInclude={(id) => toggleInclude("contacts", id)}
          />
        </TabsContent>
        <TabsContent value="deals">
          <EntityReviewTable
            entityType="deals"
            items={importData.deals}
            onToggleInclude={(id) => toggleInclude("deals", id)}
          />
        </TabsContent>
        <TabsContent value="notes">
          <EntityReviewTable
            entityType="notes"
            items={importData.notes}
            onToggleInclude={(id) => toggleInclude("notes", id)}
          />
        </TabsContent>
        <TabsContent value="tasks">
          <EntityReviewTable
            entityType="tasks"
            items={importData.tasks}
            onToggleInclude={(id) => toggleInclude("tasks", id)}
          />
        </TabsContent>
      </Tabs>

      {/* Footer Actions */}
      <div className="mt-6 flex items-center justify-between border-t border-border-glass pt-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={totalIncluded === 0}
        >
          <Download className="h-3.5 w-3.5" />
          Import {totalIncluded} Record{totalIncluded !== 1 ? "s" : ""}
        </Button>
      </div>
    </div>
  );
}
