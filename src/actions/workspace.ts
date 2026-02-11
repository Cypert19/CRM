"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/workspace";
import type { ActionResponse } from "@/types/common";
import type { Tables } from "@/types/database";

export async function getWorkspace(): Promise<ActionResponse<Tables<"workspaces">>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("workspaces")
      .select("*")
      .eq("id", ctx.workspaceId)
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch {
    return { success: false, error: "Failed to fetch workspace" };
  }
}

export async function updateWorkspace(input: {
  name?: string;
  default_currency?: string;
  default_timezone?: string;
  fiscal_year_start_month?: number;
}): Promise<ActionResponse<Tables<"workspaces">>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };
    if (ctx.role !== "Admin") return { success: false, error: "Only admins can update workspace settings" };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("workspaces")
      .update(input)
      .eq("id", ctx.workspaceId)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath("/settings");
    return { success: true, data };
  } catch {
    return { success: false, error: "Failed to update workspace" };
  }
}

export async function getWorkspaceMembers(): Promise<ActionResponse<(Tables<"workspace_members"> & { users: Tables<"users"> })[]>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("workspace_members")
      .select("*, users(*)")
      .eq("workspace_id", ctx.workspaceId)
      .order("created_at", { ascending: true });

    if (error) return { success: false, error: error.message };
    return { success: true, data: data as unknown as (Tables<"workspace_members"> & { users: Tables<"users"> })[] };
  } catch {
    return { success: false, error: "Failed to fetch members" };
  }
}

export async function updateMemberRole(memberId: string, role: "Admin" | "Manager" | "Member"): Promise<ActionResponse> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };
    if (ctx.role !== "Admin") return { success: false, error: "Only admins can change roles" };

    const admin = createAdminClient();
    const { error } = await admin
      .from("workspace_members")
      .update({ role })
      .eq("id", memberId)
      .eq("workspace_id", ctx.workspaceId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/settings/members");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update member role" };
  }
}

export async function createPipelineStage(input: {
  pipeline_id: string;
  name: string;
  color: string;
  display_order: number;
  default_probability?: number;
  is_won?: boolean;
  is_lost?: boolean;
}): Promise<ActionResponse<Tables<"pipeline_stages">>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("pipeline_stages")
      .insert({ ...input, workspace_id: ctx.workspaceId })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath("/settings/pipelines");
    revalidatePath("/deals");
    return { success: true, data };
  } catch {
    return { success: false, error: "Failed to create stage" };
  }
}

export async function updatePipelineStage(input: {
  id: string;
  name?: string;
  color?: string;
  display_order?: number;
  default_probability?: number;
  is_won?: boolean;
  is_lost?: boolean;
}): Promise<ActionResponse<Tables<"pipeline_stages">>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const { id, ...updates } = input;
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("pipeline_stages")
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
    return { success: false, error: "Failed to update stage" };
  }
}

export async function deletePipelineStage(id: string): Promise<ActionResponse> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const admin = createAdminClient();

    // Check if any deals use this stage
    const { data: deals } = await admin
      .from("deals")
      .select("id")
      .eq("stage_id", id)
      .eq("workspace_id", ctx.workspaceId)
      .limit(1);

    if (deals && deals.length > 0) {
      return { success: false, error: "Cannot delete a stage that has deals. Move deals first." };
    }

    const { error } = await admin
      .from("pipeline_stages")
      .delete()
      .eq("id", id)
      .eq("workspace_id", ctx.workspaceId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/settings/pipelines");
    revalidatePath("/deals");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete stage" };
  }
}
