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

export async function inviteMember(input: {
  email: string;
  role: "Admin" | "Manager" | "Member";
}): Promise<ActionResponse<{ email: string; role: string; status: string }>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };
    if (ctx.role !== "Admin") return { success: false, error: "Only admins can invite members" };

    const admin = createAdminClient();
    const emailLower = input.email.trim().toLowerCase();

    // Check if the user already exists in our auth system
    const { data: existingUsers } = await admin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === emailLower
    );

    if (existingUser) {
      // User exists — check if they're already a workspace member
      const { data: existingMember } = await admin
        .from("workspace_members")
        .select("id, status")
        .eq("workspace_id", ctx.workspaceId)
        .eq("user_id", existingUser.id)
        .single();

      if (existingMember) {
        if (existingMember.status === "Active") {
          return { success: false, error: "This person is already a member of this workspace" };
        }
        if (existingMember.status === "Invited") {
          return { success: false, error: "This person has already been invited" };
        }
        if (existingMember.status === "Deactivated") {
          // Reactivate
          const { error: reactivateError } = await admin
            .from("workspace_members")
            .update({ status: "Active", role: input.role })
            .eq("id", existingMember.id);

          if (reactivateError) return { success: false, error: reactivateError.message };

          revalidatePath("/settings/members");
          return { success: true, data: { email: emailLower, role: input.role, status: "Reactivated" } };
        }
      }

      // User exists but is not in this workspace — add them directly as Active
      const { error: insertError } = await admin
        .from("workspace_members")
        .insert({
          workspace_id: ctx.workspaceId,
          user_id: existingUser.id,
          role: input.role,
          status: "Active",
        });

      if (insertError) return { success: false, error: insertError.message };

      revalidatePath("/settings/members");
      return { success: true, data: { email: emailLower, role: input.role, status: "Active" } };
    }

    // User doesn't exist — invite via Supabase Auth (sends invite email)
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://crm.avolis.ai";
    const { data: invitedUser, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
      emailLower,
      {
        data: { invited_to_workspace: ctx.workspaceId },
        redirectTo: `${siteUrl}/auth/confirm`,
      }
    );

    if (inviteError) return { success: false, error: inviteError.message };
    if (!invitedUser?.user) return { success: false, error: "Failed to create invitation" };

    // Create a user record with a placeholder name
    const { error: userInsertError } = await admin
      .from("users")
      .upsert({
        id: invitedUser.user.id,
        email: emailLower,
        full_name: emailLower.split("@")[0],
      }, { onConflict: "id" });

    if (userInsertError) {
      console.error("Failed to create user record:", userInsertError);
    }

    // Add them to workspace as Invited
    const { error: memberInsertError } = await admin
      .from("workspace_members")
      .insert({
        workspace_id: ctx.workspaceId,
        user_id: invitedUser.user.id,
        role: input.role,
        status: "Invited",
      });

    if (memberInsertError) return { success: false, error: memberInsertError.message };

    revalidatePath("/settings/members");
    return { success: true, data: { email: emailLower, role: input.role, status: "Invited" } };
  } catch (err) {
    console.error("inviteMember error:", err);
    return { success: false, error: "Failed to invite member" };
  }
}

export async function removeMember(memberId: string): Promise<ActionResponse> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };
    if (ctx.role !== "Admin") return { success: false, error: "Only admins can remove members" };

    const admin = createAdminClient();

    // Get the member to check we're not removing ourselves
    const { data: member, error: fetchError } = await admin
      .from("workspace_members")
      .select("user_id, status")
      .eq("id", memberId)
      .eq("workspace_id", ctx.workspaceId)
      .single();

    if (fetchError || !member) return { success: false, error: "Member not found" };
    if (member.user_id === ctx.userId) return { success: false, error: "You cannot remove yourself from the workspace" };

    // Deactivate instead of hard-delete (preserves history)
    const { error } = await admin
      .from("workspace_members")
      .update({ status: "Deactivated" })
      .eq("id", memberId)
      .eq("workspace_id", ctx.workspaceId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/settings/members");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to remove member" };
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
