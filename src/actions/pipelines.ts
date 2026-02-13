"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/workspace";
import type { ActionResponse } from "@/types/common";
import type { Tables } from "@/types/database";

export async function getPipelines(): Promise<ActionResponse<(Tables<"pipelines"> & { pipeline_stages: Tables<"pipeline_stages">[] })[]>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("pipelines")
      .select("*, pipeline_stages(*)")
      .eq("workspace_id", ctx.workspaceId)
      .eq("is_archived", false)
      .order("created_at", { ascending: true });

    if (error) return { success: false, error: error.message };
    return { success: true, data: data as unknown as (Tables<"pipelines"> & { pipeline_stages: Tables<"pipeline_stages">[] })[] };
  } catch {
    return { success: false, error: "Failed to fetch pipelines" };
  }
}

export async function getPipelineStages(pipelineId: string): Promise<ActionResponse<Tables<"pipeline_stages">[]>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("pipeline_stages")
      .select("*")
      .eq("pipeline_id", pipelineId)
      .eq("workspace_id", ctx.workspaceId)
      .order("display_order", { ascending: true });

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch {
    return { success: false, error: "Failed to fetch stages" };
  }
}

// ─── Pipeline CRUD ────────────────────────────────────────────────────────────

type PipelineWithStages = Tables<"pipelines"> & { pipeline_stages: Tables<"pipeline_stages">[] };

export async function createPipeline(input: {
  name: string;
  description?: string;
}): Promise<ActionResponse<PipelineWithStages>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const name = input.name?.trim();
    if (!name || name.length > 100) {
      return { success: false, error: "Pipeline name is required (max 100 characters)" };
    }

    const description = input.description?.trim() || null;

    const admin = createAdminClient();

    // Create the pipeline
    const { data: pipeline, error: pipeError } = await admin
      .from("pipelines")
      .insert({
        workspace_id: ctx.workspaceId,
        name,
        description,
        is_default: false,
        is_archived: false,
      })
      .select()
      .single();

    if (pipeError || !pipeline) {
      return { success: false, error: pipeError?.message || "Failed to create pipeline" };
    }

    // Auto-create Won and Lost terminal stages
    const defaultStages = [
      { name: "Won", color: "#10B981", display_order: 0, default_probability: 100, is_won: true, is_lost: false },
      { name: "Lost", color: "#F43F5E", display_order: 1, default_probability: 0, is_won: false, is_lost: true },
    ];

    const { data: stages, error: stagesError } = await admin
      .from("pipeline_stages")
      .insert(
        defaultStages.map((s) => ({
          ...s,
          workspace_id: ctx.workspaceId,
          pipeline_id: pipeline.id,
        }))
      )
      .select();

    if (stagesError) {
      return { success: false, error: "Pipeline created but failed to add default stages" };
    }

    revalidatePath("/settings/pipelines");
    revalidatePath("/deals");

    return {
      success: true,
      data: { ...pipeline, pipeline_stages: stages ?? [] } as PipelineWithStages,
    };
  } catch {
    return { success: false, error: "Failed to create pipeline" };
  }
}

export async function updatePipeline(input: {
  id: string;
  name?: string;
  description?: string;
}): Promise<ActionResponse<Tables<"pipelines">>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const { id, ...fields } = input;
    const updates: Record<string, unknown> = {};

    if (fields.name !== undefined) {
      const name = fields.name.trim();
      if (!name || name.length > 100) {
        return { success: false, error: "Pipeline name is required (max 100 characters)" };
      }
      updates.name = name;
    }

    if (fields.description !== undefined) {
      updates.description = fields.description.trim() || null;
    }

    if (Object.keys(updates).length === 0) {
      return { success: false, error: "No fields to update" };
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("pipelines")
      .update(updates)
      .eq("id", id)
      .eq("workspace_id", ctx.workspaceId)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath("/settings/pipelines");
    revalidatePath("/deals");
    return { success: true, data };
  } catch {
    return { success: false, error: "Failed to update pipeline" };
  }
}

export async function archivePipeline(id: string): Promise<ActionResponse> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const admin = createAdminClient();

    // Fetch pipeline to check ownership and default status
    const { data: pipeline, error: fetchError } = await admin
      .from("pipelines")
      .select("id, is_default")
      .eq("id", id)
      .eq("workspace_id", ctx.workspaceId)
      .single();

    if (fetchError || !pipeline) {
      return { success: false, error: "Pipeline not found" };
    }

    if (pipeline.is_default) {
      return { success: false, error: "Cannot archive the default pipeline" };
    }

    // Check for active (non-deleted) deals in this pipeline
    const { data: deals } = await admin
      .from("deals")
      .select("id")
      .eq("pipeline_id", id)
      .eq("workspace_id", ctx.workspaceId)
      .is("deleted_at", null)
      .limit(1);

    if (deals && deals.length > 0) {
      return { success: false, error: "Cannot archive a pipeline with active deals. Move or delete deals first." };
    }

    // Archive the pipeline
    const { error } = await admin
      .from("pipelines")
      .update({ is_archived: true })
      .eq("id", id)
      .eq("workspace_id", ctx.workspaceId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/settings/pipelines");
    revalidatePath("/deals");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to archive pipeline" };
  }
}

// ─── Stage Helpers ────────────────────────────────────────────────────────────

export async function updateStageOrder(stages: { id: string; display_order: number }[]): Promise<ActionResponse> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const admin = createAdminClient();
    for (const stage of stages) {
      const { error } = await admin
        .from("pipeline_stages")
        .update({ display_order: stage.display_order })
        .eq("id", stage.id)
        .eq("workspace_id", ctx.workspaceId);
      if (error) return { success: false, error: error.message };
    }
    revalidatePath("/settings/pipelines");
    revalidatePath("/deals");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to reorder stages" };
  }
}
