"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace";
import type { ActionResponse } from "@/types/common";
import type { Tables } from "@/types/database";

// ─── Existing File Actions ──────────────────────────────────────────────────

export async function getFiles(entityType?: string, entityId?: string): Promise<ActionResponse<Tables<"files">[]>> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("files")
      .select("*, users!files_uploaded_by_fkey(id, full_name)")
      .order("created_at", { ascending: false });

    if (entityType === "deal" && entityId) query = query.eq("deal_id", entityId);
    if (entityType === "contact" && entityId) query = query.eq("contact_id", entityId);
    if (entityType === "company" && entityId) query = query.eq("company_id", entityId);

    const { data, error } = await query;
    if (error) return { success: false, error: error.message };
    return { success: true, data: data as unknown as Tables<"files">[] };
  } catch {
    return { success: false, error: "Failed to fetch files" };
  }
}

export async function createFileRecord(record: {
  original_filename: string;
  storage_path: string;
  mime_type: string;
  file_size_bytes: number;
  deal_id?: string | null;
  contact_id?: string | null;
  company_id?: string | null;
  description?: string | null;
}): Promise<ActionResponse<Tables<"files">>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found. Please log out and log back in." };

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("files")
      .insert({ ...record, workspace_id: ctx.workspaceId, uploaded_by: ctx.userId })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    await supabase.from("activities").insert({
      workspace_id: ctx.workspaceId,
      activity_type: "file_uploaded",
      actor_id: ctx.userId,
      entity_type: "File",
      entity_id: data.id,
      metadata: { filename: data.original_filename },
    });

    revalidatePath("/files");
    return { success: true, data };
  } catch {
    return { success: false, error: "Failed to create file record" };
  }
}

export async function deleteFile(id: string, storagePath: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    // Delete from storage
    const { error: storageError } = await supabase.storage.from("files").remove([storagePath]);
    if (storageError) return { success: false, error: storageError.message };

    // Delete metadata record
    const { error } = await supabase.from("files").delete().eq("id", id);
    if (error) return { success: false, error: error.message };

    revalidatePath("/files");
    revalidatePath("/deals");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete file" };
  }
}

// ─── Knowledge Base Actions ─────────────────────────────────────────────────

export type KBFileRecord = Omit<Tables<"files">, "extracted_text"> & {
  has_extracted_text: boolean;
  uploader?: { id: string; full_name: string } | null;
};

/**
 * Get knowledge base files for a deal, optionally filtered by category.
 * Strips extracted_text from response (only sends has_extracted_text boolean).
 */
export async function getKBFiles(
  dealId: string,
  category?: string | null
): Promise<ActionResponse<KBFileRecord[]>> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("files")
      .select("*, users!files_uploaded_by_fkey(id, full_name)")
      .eq("deal_id", dealId)
      .order("created_at", { ascending: false });

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query;
    if (error) return { success: false, error: error.message };

    const mapped: KBFileRecord[] = (data || []).map((f: Record<string, unknown>) => {
      const { extracted_text, users, ...rest } = f as Tables<"files"> & { users?: { id: string; full_name: string } | null };
      return {
        ...rest,
        has_extracted_text: !!extracted_text,
        uploader: users || null,
      };
    });

    return { success: true, data: mapped };
  } catch {
    return { success: false, error: "Failed to fetch knowledge base files" };
  }
}

/**
 * Get distinct categories used across a deal's KB files.
 */
export async function getKBCategories(
  dealId: string
): Promise<ActionResponse<string[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("files")
      .select("category")
      .eq("deal_id", dealId)
      .not("category", "is", null);

    if (error) return { success: false, error: error.message };

    const categories = [
      ...new Set(
        (data || [])
          .map((r: { category: string | null }) => r.category)
          .filter(Boolean) as string[]
      ),
    ];

    return { success: true, data: categories };
  } catch {
    return { success: false, error: "Failed to fetch categories" };
  }
}

/**
 * Update file metadata (category or description).
 */
export async function updateFileMetadata(
  id: string,
  updates: { category?: string | null; description?: string | null }
): Promise<ActionResponse<Tables<"files">>> {
  try {
    const supabase = await createClient();
    const { data, error } = await (supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from("files") as any)
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath("/files");
    revalidatePath("/deals");
    return { success: true, data };
  } catch {
    return { success: false, error: "Failed to update file metadata" };
  }
}
