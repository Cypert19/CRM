"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/workspace";
import type { ActionResponse } from "@/types/common";
import type { Tables } from "@/types/database";

// ─── Profile Types ──────────────────────────────────────────────────────────

export type UserProfile = Tables<"users"> & {
  role?: string;
  workspace_name?: string;
};

// ─── Get Current User Profile ───────────────────────────────────────────────

export async function getProfile(): Promise<ActionResponse<UserProfile>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return { success: false, error: "Not authenticated" };

    const admin = createAdminClient();

    // Get user profile
    const { data: profile, error: profileError } = await admin
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return { success: false, error: "Profile not found" };
    }

    // Get workspace role
    const ctx = await getWorkspaceContext();
    let role: string | undefined;
    let workspaceName: string | undefined;

    if (ctx) {
      const { data: member } = await admin
        .from("workspace_members")
        .select("role, workspaces(name)")
        .eq("user_id", user.id)
        .eq("workspace_id", ctx.workspaceId)
        .single();

      if (member) {
        role = member.role;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        workspaceName = (member.workspaces as any)?.name;
      }
    }

    return {
      success: true,
      data: { ...profile, role, workspace_name: workspaceName },
    };
  } catch {
    return { success: false, error: "Failed to fetch profile" };
  }
}

// ─── Update Profile ─────────────────────────────────────────────────────────

export async function updateProfile(input: {
  full_name?: string;
  avatar_url?: string | null;
}): Promise<ActionResponse<Tables<"users">>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return { success: false, error: "Not authenticated" };

    // Validate
    if (input.full_name !== undefined) {
      const name = input.full_name.trim();
      if (name.length < 1) return { success: false, error: "Name is required" };
      if (name.length > 100) return { success: false, error: "Name must be 100 characters or less" };
      input.full_name = name;
    }

    const admin = createAdminClient();

    const { data, error } = await admin
      .from("users")
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    // Also update the auth user metadata so avatar_url and full_name persist
    await supabase.auth.updateUser({
      data: {
        full_name: data.full_name,
        avatar_url: data.avatar_url,
      },
    });

    revalidatePath("/settings/profile");
    revalidatePath("/settings/members");
    return { success: true, data };
  } catch {
    return { success: false, error: "Failed to update profile" };
  }
}

// ─── Change Password ────────────────────────────────────────────────────────

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return { success: false, error: "Not authenticated" };

    // Validate new password
    if (input.newPassword.length < 8) {
      return { success: false, error: "New password must be at least 8 characters" };
    }

    // Verify current password by trying to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: input.currentPassword,
    });

    if (signInError) {
      return { success: false, error: "Current password is incorrect" };
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: input.newPassword,
    });

    if (updateError) return { success: false, error: updateError.message };

    return { success: true };
  } catch {
    return { success: false, error: "Failed to change password" };
  }
}

// ─── Upload Avatar ──────────────────────────────────────────────────────────

export async function uploadAvatar(formData: FormData): Promise<ActionResponse<{ url: string }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return { success: false, error: "Not authenticated" };

    const file = formData.get("avatar") as File | null;
    if (!file) return { success: false, error: "No file provided" };

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: "File must be a JPEG, PNG, GIF, or WebP image" };
    }

    // Validate file size (2MB max for avatars)
    if (file.size > 2 * 1024 * 1024) {
      return { success: false, error: "Avatar must be smaller than 2MB" };
    }

    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const ext = file.name.split(".").pop() || "jpg";
    const storagePath = `${ctx.workspaceId}/avatars/${user.id}/avatar.${ext}`;

    const admin = createAdminClient();

    // Delete old avatar if exists
    await admin.storage.from("files").remove([storagePath]);

    // Upload new avatar
    const buffer = await file.arrayBuffer();
    const { error: uploadError } = await admin.storage
      .from("files")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) return { success: false, error: `Upload failed: ${uploadError.message}` };

    // Get public URL (signed URL since bucket is private)
    const { data: urlData } = admin.storage
      .from("files")
      .getPublicUrl(storagePath);

    const avatarUrl = urlData.publicUrl;

    // Update user profile with new avatar URL
    const { error: updateError } = await admin
      .from("users")
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (updateError) return { success: false, error: updateError.message };

    // Update auth user metadata too
    await supabase.auth.updateUser({
      data: { avatar_url: avatarUrl },
    });

    revalidatePath("/settings/profile");
    revalidatePath("/settings/members");
    return { success: true, data: { url: avatarUrl } };
  } catch {
    return { success: false, error: "Failed to upload avatar" };
  }
}

// ─── Remove Avatar ──────────────────────────────────────────────────────────

export async function removeAvatar(): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return { success: false, error: "Not authenticated" };

    const admin = createAdminClient();

    // Update user profile to remove avatar
    const { error } = await admin
      .from("users")
      .update({ avatar_url: null, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (error) return { success: false, error: error.message };

    // Update auth user metadata
    await supabase.auth.updateUser({
      data: { avatar_url: null },
    });

    revalidatePath("/settings/profile");
    revalidatePath("/settings/members");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to remove avatar" };
  }
}

// ─── Get Notification Preferences ───────────────────────────────────────────

export async function getNotificationPreferences(): Promise<
  ActionResponse<Tables<"notification_preferences">>
> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const admin = createAdminClient();

    // Try to get existing preferences
    const { data, error } = await admin
      .from("notification_preferences")
      .select("*")
      .eq("workspace_id", ctx.workspaceId)
      .eq("user_id", ctx.userId)
      .single();

    if (error && error.code === "PGRST116") {
      // No row found — create default preferences
      const { data: created, error: createError } = await admin
        .from("notification_preferences")
        .insert({
          workspace_id: ctx.workspaceId,
          user_id: ctx.userId,
        })
        .select()
        .single();

      if (createError) return { success: false, error: createError.message };
      return { success: true, data: created };
    }

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch {
    return { success: false, error: "Failed to fetch notification preferences" };
  }
}

// ─── Update Notification Preferences ────────────────────────────────────────

type NotificationField =
  | "deal_assigned"
  | "stage_changed"
  | "task_assigned"
  | "task_due_soon"
  | "task_overdue"
  | "mention_in_note"
  | "new_note_on_deal"
  | "ai_insight"
  | "weekly_summary";

type NotificationValue = "realtime" | "daily" | "weekly" | "off";

export async function updateNotificationPreferences(
  updates: Partial<Record<NotificationField, NotificationValue>>
): Promise<ActionResponse> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const admin = createAdminClient();

    // Ensure preferences row exists
    const { data: existing } = await admin
      .from("notification_preferences")
      .select("id")
      .eq("workspace_id", ctx.workspaceId)
      .eq("user_id", ctx.userId)
      .single();

    if (!existing) {
      // Create row with updates
      const { error } = await admin
        .from("notification_preferences")
        .insert({
          workspace_id: ctx.workspaceId,
          user_id: ctx.userId,
          ...updates,
        });
      if (error) return { success: false, error: error.message };
    } else {
      // Update existing
      const { error } = await admin
        .from("notification_preferences")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
      if (error) return { success: false, error: error.message };
    }

    revalidatePath("/settings/profile");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update notification preferences" };
  }
}
