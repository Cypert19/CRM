"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/gradient-button";
import { Input } from "@/components/ui/input";
import {
  createPipelineStage,
  updatePipelineStage,
  deletePipelineStage,
} from "@/actions/workspace";
import { toast } from "sonner";
import type { Tables } from "@/types/database";
import {
  GripVertical,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Trophy,
  XCircle,
} from "lucide-react";

type Pipeline = Tables<"pipelines"> & {
  pipeline_stages: Tables<"pipeline_stages">[];
};

const STAGE_COLORS = [
  "#3B82F6", // blue
  "#8B5CF6", // violet
  "#06B6D4", // cyan
  "#10B981", // green
  "#F59E0B", // amber
  "#EF4444", // red
  "#EC4899", // pink
  "#6366F1", // indigo
];

export function PipelineSettingsView({ pipelines }: { pipelines: Pipeline[] }) {
  const pipeline = pipelines[0]; // For MVP, show the default pipeline

  if (!pipeline) {
    return (
      <GlassCard>
        <p className="text-text-secondary">No pipelines found. Create a pipeline to get started.</p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">{pipeline.name}</h3>
            <p className="mt-1 text-xs text-text-tertiary">
              {pipeline.description || "Configure the stages deals move through"}
            </p>
          </div>
          {pipeline.is_default && (
            <span className="rounded-full bg-accent-violet/20 px-2.5 py-0.5 text-xs font-medium text-accent-violet">
              Default
            </span>
          )}
        </div>
      </GlassCard>

      <PipelineStagesList
        pipelineId={pipeline.id}
        stages={pipeline.pipeline_stages?.sort((a, b) => a.display_order - b.display_order) ?? []}
      />
    </div>
  );
}

function PipelineStagesList({
  pipelineId,
  stages: initialStages,
}: {
  pipelineId: string;
  stages: Tables<"pipeline_stages">[];
}) {
  const [stages, setStages] = useState(initialStages);
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
      setStages((prev) =>
        prev.map((s) => (s.id === editingId ? { ...s, ...result.data } : s))
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
      setStages((prev) => [...prev, result.data!]);
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
      setStages((prev) => prev.filter((s) => s.id !== id));
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
