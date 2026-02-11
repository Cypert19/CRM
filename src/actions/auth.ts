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
    const { data: existing, error: existingError } = await admin
      .from("users")
      .select("id")
      .eq("id", user.id)
      .single();

    console.log("[ensureUserRecord] existing user:", existing, "error:", existingError?.message);

    if (!existing) {
      const insertData = {
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
        avatar_url: user.user_metadata?.avatar_url || null,
      };
      console.log("[ensureUserRecord] inserting user:", insertData);
      const { error: insertError } = await admin
        .from("users")
        .insert(insertData);

      console.log("[ensureUserRecord] insert result:", insertError?.message || "SUCCESS");
      if (insertError) return { success: false, error: `Failed to create user record: ${insertError.message}` };
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
    await ensureUserRecord();

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
    const { data: workspace, error: wsError } = await admin
      .from("workspaces")
      .insert({ name: workspaceName, slug: `${slug}-${Date.now().toString(36)}` })
      .select("id")
      .single();

    if (wsError || !workspace) return { success: false, error: "Failed to create workspace" };

    // Add user as Admin member
    const { error: memberError } = await admin
      .from("workspace_members")
      .insert({ workspace_id: workspace.id, user_id: user.id, role: "Admin", status: "Active" });

    if (memberError) return { success: false, error: "Failed to add workspace member" };

    // Create default pipeline with stages
    const { data: pipeline, error: pipeError } = await admin
      .from("pipelines")
      .insert({ workspace_id: workspace.id, name: "Sales Pipeline", is_default: true })
      .select("id")
      .single();

    if (pipeError || !pipeline) return { success: false, error: "Failed to create default pipeline" };

    const defaultStages = [
      { name: "Lead", color: "#3B82F6", display_order: 0, default_probability: 10 },
      { name: "Qualified", color: "#8B5CF6", display_order: 1, default_probability: 25 },
      { name: "Proposal", color: "#F59E0B", display_order: 2, default_probability: 50 },
      { name: "Negotiation", color: "#F97316", display_order: 3, default_probability: 75 },
      { name: "Won", color: "#10B981", display_order: 4, default_probability: 100, is_won: true },
      { name: "Lost", color: "#F43F5E", display_order: 5, default_probability: 0, is_lost: true },
    ];

    const { error: stagesError } = await admin
      .from("pipeline_stages")
      .insert(defaultStages.map((s) => ({ ...s, workspace_id: workspace.id, pipeline_id: pipeline.id })));

    if (stagesError) return { success: false, error: "Failed to create pipeline stages" };

    return { success: true, data: { workspaceId: workspace.id } };
  } catch {
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
    console.log("[ensureWorkspace] user:", user?.id, user?.email, "authError:", authError?.message);
    if (authError || !user) return { success: false, error: "Not authenticated" };

    // Ensure user record
    const userResult = await ensureUserRecord();
    console.log("[ensureWorkspace] ensureUserRecord result:", userResult);

    const admin = createAdminClient();

    // Check for existing workspace
    const { data: existingMember, error: memberCheckError } = await admin
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id)
      .eq("status", "Active")
      .single();

    console.log("[ensureWorkspace] existingMember:", existingMember, "memberCheckError:", memberCheckError?.message);

    if (existingMember) {
      return { success: true, data: { workspaceId: existingMember.workspace_id } };
    }

    // No workspace — create one using metadata or default name
    const workspaceName = user.user_metadata?.workspace_name || `${user.email?.split("@")[0]}'s Workspace`;
    console.log("[ensureWorkspace] Creating workspace:", workspaceName);
    const result = await createWorkspaceForUser(workspaceName);
    console.log("[ensureWorkspace] createWorkspaceForUser result:", result);
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
