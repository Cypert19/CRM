"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/workspace";
import { createTranscriptSchema, updateTranscriptSchema, deleteTranscriptSchema } from "@/validators/transcripts";
import type { ActionResponse } from "@/types/common";
import type { TranscriptWithCreator } from "@/types/transcript";

export async function getTranscripts(dealId: string): Promise<ActionResponse<TranscriptWithCreator[]>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const admin = createAdminClient();

    const { data, error } = await admin
      .from("deal_transcripts")
      .select("*, creator:users!deal_transcripts_created_by_fkey(id, full_name, avatar_url)")
      .eq("deal_id", dealId)
      .eq("workspace_id", ctx.workspaceId)
      .order("created_at", { ascending: false });

    if (error) return { success: false, error: error.message };
    return {
      success: true,
      data: (data ?? []).map((t) => ({
        ...t,
        ai_extracted_tasks: Array.isArray(t.ai_extracted_tasks) ? t.ai_extracted_tasks : [],
      })) as unknown as TranscriptWithCreator[],
    };
  } catch {
    return { success: false, error: "Failed to fetch transcripts" };
  }
}

export async function createTranscript(input: unknown): Promise<ActionResponse<{ id: string }>> {
  try {
    const parsed = createTranscriptSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const admin = createAdminClient();

    const { data, error } = await admin
      .from("deal_transcripts")
      .insert({
        workspace_id: ctx.workspaceId,
        deal_id: parsed.data.deal_id,
        title: parsed.data.title,
        transcript_text: parsed.data.transcript_text,
        created_by: ctx.userId,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath(`/deals/${parsed.data.deal_id}`);
    return { success: true, data: { id: data.id } };
  } catch {
    return { success: false, error: "Failed to create transcript" };
  }
}

export async function updateTranscript(input: unknown): Promise<ActionResponse> {
  try {
    const parsed = updateTranscriptSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const admin = createAdminClient();
    const { id, ...updates } = parsed.data;

    const { error } = await admin
      .from("deal_transcripts")
      .update(updates)
      .eq("id", id)
      .eq("workspace_id", ctx.workspaceId);

    if (error) return { success: false, error: error.message };

    return { success: true };
  } catch {
    return { success: false, error: "Failed to update transcript" };
  }
}

export async function deleteTranscript(input: unknown): Promise<ActionResponse> {
  try {
    const parsed = deleteTranscriptSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const admin = createAdminClient();

    // Get deal_id before deleting for revalidation
    const { data: transcript } = await admin
      .from("deal_transcripts")
      .select("deal_id")
      .eq("id", parsed.data.id)
      .eq("workspace_id", ctx.workspaceId)
      .single();

    const { error } = await admin
      .from("deal_transcripts")
      .delete()
      .eq("id", parsed.data.id)
      .eq("workspace_id", ctx.workspaceId);

    if (error) return { success: false, error: error.message };

    if (transcript?.deal_id) revalidatePath(`/deals/${transcript.deal_id}`);
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete transcript" };
  }
}
