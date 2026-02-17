import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashApiKey } from "./keys";

export type ApiContext = {
  workspaceId: string;
  apiKeyId: string;
  apiKeyName: string;
  createdByUserId: string;
};

/**
 * Authenticate an API request using a Bearer token.
 * Returns the API context if valid, null otherwise.
 */
export async function authenticateApiKey(
  request: NextRequest
): Promise<ApiContext | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const rawKey = authHeader.slice(7).trim();
  if (!rawKey.startsWith("nxk_")) return null;

  const keyHash = hashApiKey(rawKey);
  const admin = createAdminClient();

  const { data: apiKey, error } = await admin
    .from("api_keys" as never)
    .select("id, workspace_id, name, created_by, is_revoked, expires_at")
    .eq("key_hash", keyHash)
    .single();

  if (error || !apiKey) return null;

  const key = apiKey as Record<string, unknown>;
  if (key.is_revoked) return null;
  if (key.expires_at && new Date(key.expires_at as string) < new Date())
    return null;

  // Update last_used_at asynchronously (fire and forget)
  admin
    .from("api_keys" as never)
    .update({ last_used_at: new Date().toISOString() } as never)
    .eq("id" as never, key.id as never)
    .then(() => {});

  return {
    workspaceId: key.workspace_id as string,
    apiKeyId: key.id as string,
    apiKeyName: key.name as string,
    createdByUserId: key.created_by as string,
  };
}
