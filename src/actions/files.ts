"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace";
import type { ActionResponse } from "@/types/common";
import type { Tables } from "@/types/database";

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
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete file" };
  }
}
