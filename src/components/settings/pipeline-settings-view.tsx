"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/gradient-button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import {
  createPipeline,
  updatePipeline,
  archivePipeline,
} from "@/actions/pipelines";
import {
  createPipelineStage,
  updatePipelineStage,
  deletePipelineStage,
} from "@/actions/workspace";
import { toast } from "sonner";
import type { Tables } from "@/types/database";
import { motion, AnimatePresence } from "framer-motion";
import {
  GripVertical,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Trophy,
  XCircle,
  ChevronDown,
  Archive,
} from "lucide-react";

type Pipeline = Tables<"pipelines"> & {
  pipeline_stages: Tables<"pipeline_stages">[];
};

const STAGE_COLORS = [
  "#3B82F6", // blue
  "#F97316", // orange
  "#8B5CF6", // violet
  "#10B981", // green
  "#F59E0B", // amber
  "#EF4444", // red
  "#EC4899", // pink
  "#6366F1", // indigo
];

// ─── Top-Level Component ──────────────────────────────────────────────────────

export function PipelineSettingsView({ pipelines: initialPipelines }: { pipelines: Pipeline[] }) {
  const [pipelines, setPipelines] = useState(initialPipelines);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const handlePipelineCreated = (newPipeline: Pipeline) => {
    setPipelines((prev) => [...prev, newPipeline]);
  };

  const handlePipelineUpdated = (updated: Tables<"pipelines">) => {
    setPipelines((prev) =>
      prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
    );
  };

  const handlePipelineArchived = (id: string) => {
    setPipelines((prev) => prev.filter((p) => p.id !== id));
  };

  if (pipelines.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4" />
            Create Pipeline
          </Button>
        </div>
        <GlassCard>
          <p className="text-text-secondary">No pipelines found. Create a pipeline to get started.</p>
        </GlassCard>
        <CreatePipelineDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onCreated={handlePipelineCreated}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4" />
          Create Pipeline
        </Button>
      </div>

      {pipelines.map((pipeline) => (
        <PipelineSection
          key={pipeline.id}
          pipeline={pipeline}
          defaultExpanded={pipeline.is_default}
          onUpdated={handlePipelineUpdated}
          onArchived={handlePipelineArchived}
        />
      ))}

      <CreatePipelineDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreated={handlePipelineCreated}
      />
    </div>
  );
}

// ─── Create Pipeline Dialog ───────────────────────────────────────────────────

function CreatePipelineDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (pipeline: Pipeline) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);

    const result = await createPipeline({
      name: name.trim(),
      description: description.trim() || undefined,
    });

    setLoading(false);

    if (result.success && result.data) {
      toast.success("Pipeline created with Won & Lost stages");
      onCreated(result.data);
      setName("");
      setDescription("");
      onOpenChange(false);
    } else {
      toast.error(result.error || "Failed to create pipeline");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Pipeline</DialogTitle>
          <DialogDescription>
            Create a new deal pipeline. Won and Lost stages will be added automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            label="Pipeline Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Enterprise Sales, Partnerships"
            required
            maxLength={100}
          />
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-text-secondary">
              Description <span className="text-text-tertiary">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this pipeline's purpose..."
              maxLength={500}
              rows={2}
              className="glass-panel-dense focus-ring w-full rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={loading || !name.trim()}
          >
            <Plus className="h-3.5 w-3.5" />
            {loading ? "Creating..." : "Create Pipeline"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Pipeline Section (Collapsible) ──────────────────────────────────────────

function PipelineSection({
  pipeline,
  defaultExpanded,
  onUpdated,
  onArchived,
}: {
  pipeline: Pipeline;
  defaultExpanded: boolean;
  onUpdated: (updated: Tables<"pipelines">) => void;
  onArchived: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(pipeline.name);
  const [editDescription, setEditDescription] = useState(pipeline.description || "");
  const [editLoading, setEditLoading] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  // Lift stages state here so it persists across collapse/expand cycles
  const [stages, setStages] = useState(
    [...(pipeline.pipeline_stages ?? [])].sort((a, b) => a.display_order - b.display_order)
  );
  const stageCount = stages.length;

  const startEdit = () => {
    setEditName(pipeline.name);
    setEditDescription(pipeline.description || "");
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditName(pipeline.name);
    setEditDescription(pipeline.description || "");
  };

  const saveEdit = async () => {
    if (!editName.trim()) return;
    setEditLoading(true);

    const result = await updatePipeline({
      id: pipeline.id,
      name: editName.trim(),
      description: editDescription.trim() || undefined,
    });

    setEditLoading(false);

    if (result.success && result.data) {
      toast.success("Pipeline updated");
      onUpdated(result.data);
      setIsEditing(false);
    } else {
      toast.error(result.error || "Failed to update pipeline");
    }
  };

  const handleArchive = async () => {
    const result = await archivePipeline(pipeline.id);
    if (result.success) {
      toast.success("Pipeline archived");
      onArchived(pipeline.id);
    } else {
      toast.error(result.error || "Failed to archive pipeline");
    }
  };

  return (
    <div className="space-y-3">
      {/* Pipeline Header */}
      <GlassCard>
        {isEditing ? (
          /* Inline Edit Mode */
          <div className="space-y-3">
            <Input
              label="Pipeline Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Pipeline name"
              maxLength={100}
              required
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-text-secondary">
                Description
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Pipeline description..."
                maxLength={500}
                rows={2}
                className="glass-panel-dense focus-ring w-full rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={cancelEdit} disabled={editLoading}>
                <X className="h-3.5 w-3.5" />
                Cancel
              </Button>
              <Button size="sm" onClick={saveEdit} disabled={editLoading || !editName.trim()}>
                <Check className="h-3.5 w-3.5" />
                {editLoading ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        ) : (
          /* View Mode — Clickable header */
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="flex flex-1 items-center gap-3 text-left min-w-0"
            >
              <motion.div
                animate={{ rotate: expanded ? 0 : -90 }}
                transition={{ duration: 0.15 }}
              >
                <ChevronDown className="h-4 w-4 text-text-tertiary shrink-0" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-text-primary truncate">
                    {pipeline.name}
                  </span>
                  {pipeline.is_default && (
                    <span className="rounded-full bg-accent-violet/20 px-2 py-0.5 text-[10px] font-medium text-accent-violet shrink-0">
                      Default
                    </span>
                  )}
                  <span className="text-[10px] text-text-tertiary shrink-0">
                    {stageCount} {stageCount === 1 ? "stage" : "stages"}
                  </span>
                </div>
                {pipeline.description && (
                  <p className="mt-0.5 text-xs text-text-tertiary truncate">
                    {pipeline.description}
                  </p>
                )}
              </div>
            </button>

            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="icon" onClick={startEdit}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              {!pipeline.is_default && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowArchiveConfirm(true)}
                >
                  <Archive className="h-3.5 w-3.5 text-signal-danger" />
                </Button>
              )}
            </div>
          </div>
        )}
      </GlassCard>

      {/* Collapsible Stages List */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <PipelineStagesList
              pipelineId={pipeline.id}
              stages={stages}
              onStagesChange={setStages}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Archive Confirmation */}
      <ConfirmDeleteDialog
        open={showArchiveConfirm}
        onOpenChange={setShowArchiveConfirm}
        title="Archive Pipeline"
        description="This pipeline and its stages will be archived. Pipelines with active deals cannot be archived."
        entityName={pipeline.name}
        onConfirm={handleArchive}
      />
    </div>
  );
}

// ─── Pipeline Stages List (existing — unchanged logic) ────────────────────────

function PipelineStagesList({
  pipelineId,
  stages,
  onStagesChange,
}: {
  pipelineId: string;
  stages: Tables<"pipeline_stages">[];
  onStagesChange: (stages: Tables<"pipeline_stages">[]) => void;
}) {
  const setStages = onStagesChange;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editProbability, setEditProbability] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(STAGE_COLORS[0]);
  const [newProbability, setNewProbability] = useState("");
  const [loading, setLoading] = useState(false);

  const startEdit = (stage: Tables<"pipeline_stages">) => {
    setEditingId(stage.id);
    setEditName(stage.name);
    setEditColor(stage.color);
    setEditProbability(String(stage.default_probability));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditColor("");
    setEditProbability("");
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    setLoading(true);

    const result = await updatePipelineStage({
      id: editingId,
      name: editName.trim(),
      color: editColor,
      default_probability: Number(editProbability) || 0,
    });

    setLoading(false);
    if (result.success && result.data) {
      setStages(
        stages.map((s) => (s.id === editingId ? { ...s, ...result.data } : s))
      );
      toast.success("Stage updated");
      cancelEdit();
    } else {
      toast.error(result.error || "Failed to update stage");
    }
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setLoading(true);

    const result = await createPipelineStage({
      pipeline_id: pipelineId,
      name: newName.trim(),
      color: newColor,
      display_order: stages.length,
      default_probability: Number(newProbability) || 0,
    });

    setLoading(false);
    if (result.success && result.data) {
      setStages([...stages, result.data!]);
      toast.success("Stage created");
      setNewName("");
      setNewColor(STAGE_COLORS[0]);
      setNewProbability("");
      setShowAddForm(false);
    } else {
      toast.error(result.error || "Failed to create stage");
    }
  };

  const handleDelete = async (id: string) => {
    const stage = stages.find((s) => s.id === id);
    if (!stage) return;

    if (stage.is_won || stage.is_lost) {
      toast.error("Cannot delete the Won or Lost stage");
      return;
    }

    setLoading(true);
    const result = await deletePipelineStage(id);
    setLoading(false);

    if (result.success) {
      setStages(stages.filter((s) => s.id !== id));
      toast.success("Stage deleted");
    } else {
      toast.error(result.error || "Failed to delete stage");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-text-secondary">
          Pipeline Stages ({stages.length})
        </h4>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowAddForm(true)}
          disabled={showAddForm}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Stage
        </Button>
      </div>

      {/* Stage list */}
      <div className="space-y-2">
        {stages.map((stage, index) => (
          <GlassCard key={stage.id}>
            {editingId === stage.id ? (
              /* Edit mode */
              <div className="space-y-3">
                <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-end">
                  <Input
                    label="Stage Name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Stage name"
                  />
                  <div className="space-y-1.5">
                    <label className="block text-xs text-text-secondary">Probability %</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={editProbability}
                      onChange={(e) => setEditProbability(e.target.value)}
                      className="glass-panel-dense focus-ring h-10 w-20 rounded-lg px-3 text-sm text-text-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs text-text-secondary">Color</label>
                  <div className="flex gap-2">
                    {STAGE_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setEditColor(color)}
                        className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                        style={{
                          backgroundColor: color,
                          borderColor: editColor === color ? "white" : "transparent",
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={cancelEdit} disabled={loading}>
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={saveEdit} disabled={loading}>
                    <Check className="h-3.5 w-3.5" />
                    {loading ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            ) : (
              /* View mode */
              <div className="flex items-center gap-3">
                <GripVertical className="h-4 w-4 text-text-tertiary/50" />
                <div
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: stage.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary truncate">
                      {stage.name}
                    </span>
                    {stage.is_won && (
                      <Trophy className="h-3.5 w-3.5 text-signal-success shrink-0" />
                    )}
                    {stage.is_lost && (
                      <XCircle className="h-3.5 w-3.5 text-signal-danger shrink-0" />
                    )}
                  </div>
                  <span className="text-xs text-text-tertiary">
                    Order: {index + 1} · Probability: {stage.default_probability}%
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => startEdit(stage)}
                    disabled={loading}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  {!stage.is_won && !stage.is_lost && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(stage.id)}
                      disabled={loading}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-signal-danger" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </GlassCard>
        ))}
      </div>

      {/* Add new stage form */}
      {showAddForm && (
        <GlassCard>
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-text-primary">Add New Stage</h4>
            <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
              <Input
                label="Stage Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., Discovery, Proposal Sent"
                required
              />
              <div className="space-y-1.5">
                <label className="block text-xs text-text-secondary">Probability %</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={newProbability}
                  onChange={(e) => setNewProbability(e.target.value)}
                  placeholder="0"
                  className="glass-panel-dense focus-ring h-10 w-20 rounded-lg px-3 text-sm text-text-primary"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs text-text-secondary">Color</label>
              <div className="flex gap-2">
                {STAGE_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewColor(color)}
                    className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: color,
                      borderColor: newColor === color ? "white" : "transparent",
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddForm(false);
                  setNewName("");
                  setNewProbability("");
                }}
                disabled={loading}
              >
                <X className="h-3.5 w-3.5" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleAdd} disabled={loading || !newName.trim()}>
                <Plus className="h-3.5 w-3.5" />
                {loading ? "Adding..." : "Add Stage"}
              </Button>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
