"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createNoteSchema, updateNoteSchema } from "@/validators/notes";
import { getWorkspaceContext } from "@/lib/workspace";
import type { ActionResponse } from "@/types/common";
import type { Tables } from "@/types/database";

export async function getNotes(entityType?: string, entityId?: string): Promise<ActionResponse<Tables<"notes">[]>> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("notes")
      .select("*, users!notes_author_id_fkey(id, full_name, avatar_url)")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (entityType === "deal" && entityId) query = query.eq("deal_id", entityId);
    if (entityType === "contact" && entityId) query = query.eq("contact_id", entityId);
    if (entityType === "company" && entityId) query = query.eq("company_id", entityId);

    const { data, error } = await query;
    if (error) return { success: false, error: error.message };
    return { success: true, data: data as unknown as Tables<"notes">[] };
  } catch {
    return { success: false, error: "Failed to fetch notes" };
  }
}

export async function createNote(input: unknown): Promise<ActionResponse<Tables<"notes">>> {
  try {
    const parsed = createNoteSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found. Please log out and log back in." };

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("notes")
      .insert({ ...parsed.data, workspace_id: ctx.workspaceId, author_id: ctx.userId })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    await supabase.from("activities").insert({
      workspace_id: ctx.workspaceId,
      activity_type: "note_created",
      actor_id: ctx.userId,
      entity_type: "Note",
      entity_id: data.id,
      metadata: { title: data.title },
    });

    revalidatePath("/notes");
    return { success: true, data };
  } catch {
    return { success: false, error: "Failed to create note" };
  }
}

export async function updateNote(input: unknown): Promise<ActionResponse<Tables<"notes">>> {
  try {
    const parsed = updateNoteSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

    const { id, ...updates } = parsed.data;
    const supabase = await createClient();

    const { data, error } = await supabase.from("notes").update(updates).eq("id", id).select().single();
    if (error) return { success: false, error: error.message };

    revalidatePath("/notes");
    revalidatePath(`/notes/${id}`);
    return { success: true, data };
  } catch {
    return { success: false, error: "Failed to update note" };
  }
}

export async function deleteNote(id: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) return { success: false, error: error.message };
    revalidatePath("/notes");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete note" };
  }
}
