"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/workspace";
import { generateApiKey } from "@/lib/api/keys";
import type { ActionResponse } from "@/types/common";

type ApiKeyInfo = {
  id: string;
  key_prefix: string;
  name: string;
  description: string | null;
  created_by: string;
  last_used_at: string | null;
  expires_at: string | null;
  is_revoked: boolean;
  created_at: string;
  creator?: { full_name: string } | null;
};

/**
 * List all API keys for the current workspace (admin only).
 * Returns metadata only — never returns the key hash.
 */
export async function getApiKeys(): Promise<ActionResponse<ApiKeyInfo[]>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };
    if (ctx.role !== "Admin")
      return { success: false, error: "Only admins can manage API keys" };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("api_keys" as never)
      .select(
        "id, key_prefix, name, description, created_by, last_used_at, expires_at, is_revoked, created_at, users!api_keys_created_by_fkey(full_name)"
      )
      .eq("workspace_id", ctx.workspaceId)
      .order("created_at", { ascending: false });

    if (error) return { success: false, error: error.message };
    return { success: true, data: data as unknown as ApiKeyInfo[] };
  } catch {
    return { success: false, error: "Failed to fetch API keys" };
  }
}

/**
 * Create a new API key. Returns the raw key ONCE — it cannot be retrieved later.
 */
export async function createApiKey(input: {
  name: string;
  description?: string;
}): Promise<ActionResponse<{ id: string; raw_key: string; key_prefix: string }>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };
    if (ctx.role !== "Admin")
      return { success: false, error: "Only admins can create API keys" };

    if (!input.name || input.name.length < 1)
      return { success: false, error: "Key name is required" };

    const { raw, hash, prefix } = generateApiKey();
    const admin = createAdminClient();

    const { data, error } = await admin
      .from("api_keys" as never)
      .insert({
        workspace_id: ctx.workspaceId,
        key_prefix: prefix,
        key_hash: hash,
        name: input.name,
        description: input.description ?? null,
        created_by: ctx.userId,
      } as never)
      .select("id")
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath("/settings");
    return {
      success: true,
      data: {
        id: (data as { id: string }).id,
        raw_key: raw,
        key_prefix: prefix,
      },
    };
  } catch {
    return { success: false, error: "Failed to create API key" };
  }
}

/**
 * Revoke an API key (soft disable — key record is kept for audit).
 */
export async function revokeApiKey(id: string): Promise<ActionResponse> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };
    if (ctx.role !== "Admin")
      return { success: false, error: "Only admins can revoke API keys" };

    const admin = createAdminClient();
    const { error } = await admin
      .from("api_keys" as never)
      .update({ is_revoked: true } as never)
      .eq("id" as never, id as never)
      .eq("workspace_id" as never, ctx.workspaceId as never);

    if (error) return { success: false, error: error.message };

    revalidatePath("/settings");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to revoke API key" };
  }
}

/**
 * Permanently delete an API key.
 */
export async function deleteApiKey(id: string): Promise<ActionResponse> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };
    if (ctx.role !== "Admin")
      return { success: false, error: "Only admins can delete API keys" };

    const admin = createAdminClient();
    const { error } = await admin
      .from("api_keys" as never)
      .delete()
      .eq("id" as never, id as never)
      .eq("workspace_id" as never, ctx.workspaceId as never);

    if (error) return { success: false, error: error.message };

    revalidatePath("/settings");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete API key" };
  }
}
