"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Upload, FileSearch, CheckCircle2, Database, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/ui/glass-card";
import { FileUploadZone } from "./file-upload-zone";
import { ParseProgress } from "./parse-progress";
import { ImportReview } from "./import-review";
import { ImportResults } from "./import-results";
import { executeImport } from "@/actions/import";
import { getPipelines } from "@/actions/pipelines";
import type {
  ImportPhase,
  ParsedImportData,
  ImportPayload,
  ImportResult,
  RawAIParseResponse,
  ImportEntity,
  PipelineStageOption,
} from "@/types/import";
import { cn } from "@/lib/utils";

// ─── Phase Steps ────────────────────────────────────────────────────────────

const PHASE_STEPS = [
  { key: "upload", label: "Upload", icon: Upload },
  { key: "parsing", label: "Analyze", icon: FileSearch },
  { key: "review", label: "Review", icon: CheckCircle2 },
  { key: "importing", label: "Import", icon: Database },
] as const;

function getPhaseIndex(phase: ImportPhase): number {
  if (phase === "complete") return 4;
  return PHASE_STEPS.findIndex((s) => s.key === phase);
}

// ─── Wrap raw AI entities with review metadata ──────────────────────────────

function wrapEntities<T extends { _tempId: string }>(
  entities: T[]
): ImportEntity<T>[] {
  return entities.map((entity) => ({
    ...entity,
    _included: true,
    _status: "ok" as const,
    _errors: [],
    _warnings: [],
  }));
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ImportView() {
  const [phase, setPhase] = useState<ImportPhase>("upload");
  const [parsedData, setParsedData] = useState<ParsedImportData | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [stages, setStages] = useState<PipelineStageOption[]>([]);
  const [defaultPipelineId, setDefaultPipelineId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ── Load Pipeline Stages ────────────────────────────────────────────────
  const loadStages = useCallback(async () => {
    const result = await getPipelines();
    if (result.success && result.data) {
      const stageOptions: PipelineStageOption[] = [];
      let defaultPid: string | null = null;

      for (const pipeline of result.data) {
        if (!defaultPid) defaultPid = pipeline.id;
        for (const stage of pipeline.pipeline_stages || []) {
          stageOptions.push({
            id: stage.id,
            name: stage.name,
            pipeline_id: stage.pipeline_id,
            pipeline_name: pipeline.name,
          });
        }
      }

      setStages(stageOptions);
      setDefaultPipelineId(defaultPid);
    }
  }, []);

  // ── Handle File Ready (start parsing) ─────────────────────────────────
  const handleFileReady = useCallback(
    async (file: { name: string; content: string; fileType: string }) => {
      setPhase("parsing");

      // Load stages in parallel
      loadStages();

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch("/api/import/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: file.content,
            fileType: file.fileType,
            fileName: file.name,
          }),
          signal: controller.signal,
        });

        // The response streams keepalive spaces followed by JSON.
        // Read the full body as text and trim whitespace before parsing.
        const responseText = (await response.text()).trim();

        if (!response.ok) {
          const errorData = JSON.parse(responseText || "{}");

          // Log full diagnostics for developers
          if (errorData.details) {
            console.error("[import] Parse diagnostics:", errorData.details);
          }

          throw new Error(
            errorData.error || `Server error: ${response.status}`
          );
        }

        let rawData: RawAIParseResponse;
        try {
          rawData = JSON.parse(responseText);
        } catch {
          throw new Error("Failed to parse server response. Please try again.");
        }

        // Check if the response is actually an error payload
        if ("error" in rawData && typeof (rawData as Record<string, unknown>).error === "string") {
          throw new Error((rawData as Record<string, unknown>).error as string);
        }

        // Wrap with review metadata
        const parsed: ParsedImportData = {
          companies: wrapEntities(rawData.companies || []),
          contacts: wrapEntities(rawData.contacts || []),
          deals: wrapEntities(rawData.deals || []),
          notes: wrapEntities(rawData.notes || []),
          tasks: wrapEntities(rawData.tasks || []),
          stageMappings: rawData.stageMappings || {},
          warnings: rawData.warnings || [],
          summary: rawData.summary || "Import data analyzed",
        };

        // Validate: add warnings/errors to entities with issues
        parsed.contacts = parsed.contacts.map((c) => {
          if (!c.first_name || !c.last_name) {
            return {
              ...c,
              _status: "error" as const,
              _errors: [...c._errors, "First name and last name are required"],
            };
          }
          return c;
        });

        parsed.deals = parsed.deals.map((d) => {
          if (!d.title) {
            return {
              ...d,
              _status: "error" as const,
              _errors: [...d._errors, "Deal title is required"],
            };
          }
          if (!d.stage_id && d._stageName && !rawData.stageMappings[d._stageName]) {
            return {
              ...d,
              _status: "warning" as const,
              _warnings: [
                ...d._warnings,
                `Stage "${d._stageName}" needs to be mapped to an existing pipeline stage`,
              ],
            };
          }
          return d;
        });

        parsed.companies = parsed.companies.map((c) => {
          if (!c.company_name) {
            return {
              ...c,
              _status: "error" as const,
              _errors: [...c._errors, "Company name is required"],
            };
          }
          return c;
        });

        const totalEntities =
          parsed.companies.length +
          parsed.contacts.length +
          parsed.deals.length +
          parsed.notes.length +
          parsed.tasks.length;

        if (totalEntities === 0) {
          const warningContext = rawData.warnings?.length > 0
            ? ` AI notes: ${rawData.warnings.join("; ")}`
            : "";
          toast.error(
            `No entities could be extracted from this file.${warningContext} Try a different format or check the file contents.`
          );
          setPhase("upload");
          return;
        }

        setParsedData(parsed);
        setPhase("review");
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          setPhase("upload");
          return;
        }
        console.error("[import] Parse failed:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to analyze file. Please try again."
        );
        setPhase("upload");
      } finally {
        abortControllerRef.current = null;
      }
    },
    [loadStages]
  );

  // ── Handle Cancel Parse ───────────────────────────────────────────────
  const handleCancelParse = useCallback(() => {
    abortControllerRef.current?.abort();
    setPhase("upload");
  }, []);

  // ── Handle Import Confirm ─────────────────────────────────────────────
  const handleImportConfirm = useCallback(async (payload: ImportPayload) => {
    setPhase("importing");

    try {
      const result = await executeImport(payload);

      if (result.success && result.data) {
        setImportResult(result.data);
        setPhase("complete");

        if (result.data.totalFailed === 0) {
          toast.success(`Successfully imported ${result.data.totalCreated} records!`);
        } else {
          toast.warning(
            `Imported ${result.data.totalCreated} records with ${result.data.totalFailed} errors.`
          );
        }
      } else {
        toast.error(result.error || "Import failed");
        setPhase("review");
      }
    } catch {
      toast.error("Import failed. Please try again.");
      setPhase("review");
    }
  }, []);

  // ── Reset ─────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setPhase("upload");
    setParsedData(null);
    setImportResult(null);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────
  const currentPhaseIndex = getPhaseIndex(phase);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Phase Indicator */}
      <div className="mb-6 flex items-center justify-center gap-2">
        {PHASE_STEPS.map((step, i) => {
          const isActive = i === currentPhaseIndex;
          const isCompleted = i < currentPhaseIndex;
          const StepIcon = step.icon;

          return (
            <div key={step.key} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                  isActive && "bg-accent-primary/10 text-accent-primary",
                  isCompleted && "text-signal-success",
                  !isActive && !isCompleted && "text-text-tertiary"
                )}
              >
                <StepIcon className="h-3.5 w-3.5" />
                {step.label}
              </div>
              {i < PHASE_STEPS.length - 1 && (
                <ArrowRight
                  className={cn(
                    "h-3 w-3",
                    isCompleted ? "text-signal-success" : "text-text-tertiary/30"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      <GlassCard>
        {phase === "upload" && (
          <div>
            <div className="mb-6">
              <h2 className="text-base font-semibold text-text-primary">
                Import CRM Data
              </h2>
              <p className="mt-1 text-xs text-text-tertiary">
                Upload a file exported from another CRM. Our AI will analyze it and extract
                deals, contacts, companies, notes, and tasks with their relationships.
              </p>
            </div>
            <FileUploadZone onFileReady={handleFileReady} />
          </div>
        )}

        {phase === "parsing" && (
          <ParseProgress onCancel={handleCancelParse} />
        )}

        {phase === "review" && parsedData && (
          <ImportReview
            data={parsedData}
            stages={stages}
            defaultPipelineId={defaultPipelineId}
            onConfirm={handleImportConfirm}
            onBack={handleReset}
          />
        )}

        {phase === "importing" && (
          <ParseProgress message="Creating records in your CRM…" />
        )}

        {phase === "complete" && importResult && (
          <ImportResults result={importResult} onReset={handleReset} />
        )}
      </GlassCard>
    </motion.div>
  );
}
