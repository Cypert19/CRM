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
