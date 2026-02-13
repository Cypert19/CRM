"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResponse } from "@/types/common";

/**
 * Ensures a user record exists in the users table.
 * Called during signup and login flows.
 */
export async function ensureUserRecord(): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { success: false, error: "Not authenticated" };

    const admin = createAdminClient();

    // Check if user record already exists
    const { data: existing } = await admin
      .from("users")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!existing) {
      const { error: insertError } = await (admin
        .from("users") as any)
        .insert({
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
          avatar_url: user.user_metadata?.avatar_url || null,
        });

      if (insertError) {
        console.error("[ensureUserRecord] insert error:", insertError);
        return { success: false, error: `Failed to create user record: ${insertError.message}` };
      }
    }

    return { success: true };
  } catch (e) {
    console.error("[ensureUserRecord] CAUGHT ERROR:", e);
    return { success: false, error: "Failed to ensure user record" };
  }
}

/**
 * Creates a workspace with a default pipeline for the current user.
 * Also ensures the user record exists.
 */
export async function createWorkspaceForUser(
  workspaceName: string
): Promise<ActionResponse<{ workspaceId: string }>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { success: false, error: "Not authenticated" };

    const admin = createAdminClient();

    // Ensure user record exists first
    const userResult = await ensureUserRecord();
    if (!userResult.success) {
      console.error("[createWorkspaceForUser] ensureUserRecord failed:", userResult.error);
      return { success: false, error: userResult.error || "Failed to create user record" };
    }

    // Check if user already has a workspace (prevent duplicates)
    const { data: existingMember } = await admin
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id)
      .eq("status", "Active")
      .single();

    if (existingMember) {
      return { success: true, data: { workspaceId: existingMember.workspace_id } };
    }

    const slug = workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    // Create workspace
    const { data: workspace, error: wsError } = await (admin
      .from("workspaces") as any)
      .insert({ name: workspaceName, slug: `${slug}-${Date.now().toString(36)}` })
      .select("id")
      .single();

    if (wsError || !workspace) {
      console.error("[createWorkspaceForUser] workspace error:", wsError);
      return { success: false, error: `Failed to create workspace: ${wsError?.message || "unknown"}` };
    }

    // Add user as Admin member
    const { error: memberError } = await (admin
      .from("workspace_members") as any)
      .insert({ workspace_id: workspace.id, user_id: user.id, role: "Admin", status: "Active" });

    if (memberError) {
      console.error("[createWorkspaceForUser] member error:", memberError);
      return { success: false, error: `Failed to add workspace member: ${memberError.message}` };
    }

    // Create default pipeline with stages
    const { data: pipeline, error: pipeError } = await (admin
      .from("pipelines") as any)
      .insert({ workspace_id: workspace.id, name: "Sales Pipeline", is_default: true })
      .select("id")
      .single();

    if (pipeError || !pipeline) {
      console.error("[createWorkspaceForUser] pipeline error:", pipeError);
      return { success: false, error: `Failed to create default pipeline: ${pipeError?.message || "unknown"}` };
    }

    const defaultStages = [
      { name: "Lead", color: "#3B82F6", display_order: 0, default_probability: 10, is_won: false, is_lost: false },
      { name: "Qualified", color: "#8B5CF6", display_order: 1, default_probability: 25, is_won: false, is_lost: false },
      { name: "Proposal", color: "#F59E0B", display_order: 2, default_probability: 50, is_won: false, is_lost: false },
      { name: "Negotiation", color: "#F97316", display_order: 3, default_probability: 75, is_won: false, is_lost: false },
      { name: "Won", color: "#10B981", display_order: 4, default_probability: 100, is_won: true, is_lost: false },
      { name: "Lost", color: "#F43F5E", display_order: 5, default_probability: 0, is_won: false, is_lost: true },
    ];

    const { error: stagesError } = await (admin
      .from("pipeline_stages") as any)
      .insert(defaultStages.map((s) => ({ ...s, workspace_id: workspace.id, pipeline_id: pipeline.id })));

    if (stagesError) {
      console.error("[createWorkspaceForUser] stages error:", stagesError);
      return { success: false, error: `Failed to create pipeline stages: ${stagesError.message}` };
    }

    return { success: true, data: { workspaceId: workspace.id } };
  } catch (e) {
    console.error("[createWorkspaceForUser] CAUGHT ERROR:", e);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Ensures the current user has a workspace. If not, creates one.
 * Called on login to handle users who signed up but never got a workspace.
 */
export async function ensureWorkspace(): Promise<ActionResponse<{ workspaceId: string }>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { success: false, error: "Not authenticated" };

    // Ensure user record
    const userResult = await ensureUserRecord();
    if (!userResult.success) {
      console.error("[ensureWorkspace] ensureUserRecord failed:", userResult.error);
    }

    const admin = createAdminClient();

    // Check for existing workspace
    const { data: existingMember } = await admin
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id)
      .eq("status", "Active")
      .single();

    if (existingMember) {
      return { success: true, data: { workspaceId: existingMember.workspace_id } };
    }

    // No workspace — create one using metadata or default name
    const workspaceName = user.user_metadata?.workspace_name || `${user.email?.split("@")[0]}'s Workspace`;
    const result = await createWorkspaceForUser(workspaceName);
    return result;
  } catch (e) {
    console.error("[ensureWorkspace] CAUGHT ERROR:", e);
    return { success: false, error: "Failed to ensure workspace" };
  }
}

export async function getCurrentWorkspace() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: member } = await supabase
    .from("workspace_members")
    .select("workspace_id, role, workspaces(*)")
    .eq("user_id", user.id)
    .eq("status", "Active")
    .single();

  return member;
}
