"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createDealSchema, updateDealSchema, moveDealStageSchema } from "@/validators/deals";
import { getWorkspaceContext } from "@/lib/workspace";
import type { ActionResponse } from "@/types/common";
import type { Tables } from "@/types/database";

export async function getDeals(pipelineId?: string): Promise<ActionResponse<Tables<"deals">[]>> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("deals")
      .select("*, contacts(id, first_name, last_name, email), companies(id, company_name), users!deals_owner_id_fkey(id, full_name, avatar_url)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (pipelineId) {
      query = query.eq("pipeline_id", pipelineId);
    }

    const { data, error } = await query;
    if (error) return { success: false, error: error.message };
    return { success: true, data: data as unknown as Tables<"deals">[] };
  } catch {
    return { success: false, error: "Failed to fetch deals" };
  }
}

export async function getDeal(id: string): Promise<ActionResponse<Tables<"deals">>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("deals")
      .select("*, contacts(id, first_name, last_name, email), companies(id, company_name), users!deals_owner_id_fkey(id, full_name, avatar_url)")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data: data as unknown as Tables<"deals"> };
  } catch {
    return { success: false, error: "Failed to fetch deal" };
  }
}

export async function createDeal(input: unknown): Promise<ActionResponse<Tables<"deals">>> {
  try {
    const parsed = createDealSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found. Please log out and log back in." };

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("deals")
      .insert({ ...parsed.data, workspace_id: ctx.workspaceId, owner_id: ctx.userId })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    // Log activity
    await supabase.from("activities").insert({
      workspace_id: ctx.workspaceId,
      activity_type: "deal_created",
      actor_id: ctx.userId,
      entity_type: "Deal",
      entity_id: data.id,
      metadata: { title: data.title, value: data.value },
    });

    revalidatePath("/deals");
    revalidatePath("/dashboard");
    revalidatePath("/reports");
    return { success: true, data };
  } catch {
    return { success: false, error: "Failed to create deal" };
  }
}

export async function updateDeal(input: unknown): Promise<ActionResponse<Tables<"deals">>> {
  try {
    const parsed = updateDealSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const { id, ...updates } = parsed.data;
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();

    const { data, error } = await admin
      .from("deals")
      .update(updates)
      .eq("id", id)
      .eq("workspace_id", ctx.workspaceId)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath("/deals");
    revalidatePath(`/deals/${id}`);
    revalidatePath("/dashboard");
    revalidatePath("/reports");
    return { success: true, data };
  } catch {
    return { success: false, error: "Failed to update deal" };
  }
}

export async function moveDealStage(input: unknown): Promise<ActionResponse<Tables<"deals">>> {
  try {
    const parsed = moveDealStageSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

    const ctx = await getWorkspaceContext();
    const supabase = await createClient();

    // Get old stage for activity log
    const { data: oldDeal } = await supabase.from("deals").select("stage_id, pipeline_stages!deals_stage_id_fkey(name)").eq("id", parsed.data.id).single();

    // Check if target stage is won/lost to set closed_at
    const { data: targetStage } = await supabase
      .from("pipeline_stages")
      .select("is_won, is_lost")
      .eq("id", parsed.data.stage_id)
      .single();

    const updatePayload: Record<string, unknown> = { stage_id: parsed.data.stage_id };
    if (parsed.data.lost_reason) updatePayload.lost_reason = parsed.data.lost_reason;

    // Set closed_at when moving to won/lost, clear it when moving back to open
    if (targetStage?.is_won || targetStage?.is_lost) {
      updatePayload.closed_at = new Date().toISOString();
    } else {
      updatePayload.closed_at = null;
    }

    const { data, error } = await supabase
      .from("deals")
      .update(updatePayload)
      .eq("id", parsed.data.id)
      .select("*, pipeline_stages!deals_stage_id_fkey(name, is_won, is_lost)")
      .single();

    if (error) return { success: false, error: error.message };

    if (ctx) {
      const stage = (data as Record<string, unknown>).pipeline_stages as Record<string, unknown> | null;
      const activityType = stage?.is_won ? "deal_won" : stage?.is_lost ? "deal_lost" : "deal_stage_changed";

      await supabase.from("activities").insert({
        workspace_id: ctx.workspaceId,
        activity_type: activityType,
        actor_id: ctx.userId,
        entity_type: "Deal",
        entity_id: data.id,
        metadata: {
          from_stage: (oldDeal as Record<string, unknown>)?.pipeline_stages,
          to_stage: stage?.name,
        },
      });
    }

    revalidatePath("/deals");
    revalidatePath("/dashboard");
    revalidatePath("/reports");
    return { success: true, data: data as unknown as Tables<"deals"> };
  } catch {
    return { success: false, error: "Failed to move deal" };
  }
}

export async function getDealWithRelations(id: string): Promise<ActionResponse<Record<string, unknown>>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();

    // Fetch deal with all relations
    const { data: deal, error } = await admin
      .from("deals")
      .select("*, contacts(id, first_name, last_name, email), companies(id, company_name), users!deals_owner_id_fkey(id, full_name, avatar_url), pipeline_stages!deals_stage_id_fkey(id, name, color, is_won, is_lost)")
      .eq("id", id)
      .eq("workspace_id", ctx.workspaceId)
      .is("deleted_at", null)
      .single();

    if (error) return { success: false, error: error.message };

    // Fetch counts for tabs in parallel
    const [tasksResult, notesResult, filesResult, eventsResult, dealContactsResult] = await Promise.all([
      admin.from("tasks").select("id", { count: "exact", head: true }).eq("deal_id", id),
      admin.from("notes").select("id", { count: "exact", head: true }).eq("deal_id", id),
      admin.from("files").select("id", { count: "exact", head: true }).eq("deal_id", id),
      admin.from("deal_events").select("id", { count: "exact", head: true }).eq("deal_id", id),
      admin.from("deal_contacts").select("id", { count: "exact", head: true }).eq("deal_id", id),
    ]);

    return {
      success: true,
      data: {
        ...deal,
        _counts: {
          tasks: tasksResult.count ?? 0,
          notes: notesResult.count ?? 0,
          files: filesResult.count ?? 0,
          events: eventsResult.count ?? 0,
          deal_contacts: dealContactsResult.count ?? 0,
        },
      },
    };
  } catch {
    return { success: false, error: "Failed to fetch deal" };
  }
}

export async function deleteDeal(id: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("deals")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return { success: false, error: error.message };

    revalidatePath("/deals");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete deal" };
  }
}
