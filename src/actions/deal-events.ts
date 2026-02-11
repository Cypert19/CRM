"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createDealEventSchema, updateDealEventSchema } from "@/validators/deal-events";
import { getWorkspaceContext } from "@/lib/workspace";
import type { ActionResponse } from "@/types/common";
import type { Tables } from "@/types/database";

export async function getDealEvents(dealId: string): Promise<ActionResponse<Tables<"deal_events">[]>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("deal_events")
      .select("*")
      .eq("deal_id", dealId)
      .eq("workspace_id", ctx.workspaceId)
      .order("start_time", { ascending: true });

    if (error) return { success: false, error: error.message };
    return { success: true, data: data as Tables<"deal_events">[] };
  } catch {
    return { success: false, error: "Failed to fetch deal events" };
  }
}

export async function createDealEvent(input: unknown): Promise<ActionResponse<Tables<"deal_events">>> {
  try {
    const parsed = createDealEventSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("deal_events")
      .insert({
        ...parsed.data,
        workspace_id: ctx.workspaceId,
        creator_id: ctx.userId,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath(`/deals/${parsed.data.deal_id}`);
    return { success: true, data: data as Tables<"deal_events"> };
  } catch {
    return { success: false, error: "Failed to create deal event" };
  }
}

export async function updateDealEvent(input: unknown): Promise<ActionResponse<Tables<"deal_events">>> {
  try {
    const parsed = updateDealEventSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const { id, ...updates } = parsed.data;
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("deal_events")
      .update(updates)
      .eq("id", id)
      .eq("workspace_id", ctx.workspaceId)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath(`/deals/${data.deal_id}`);
    return { success: true, data: data as Tables<"deal_events"> };
  } catch {
    return { success: false, error: "Failed to update deal event" };
  }
}

export async function deleteDealEvent(id: string): Promise<ActionResponse> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const admin = createAdminClient();

    // Get the deal_id before deleting for revalidation
    const { data: event } = await admin
      .from("deal_events")
      .select("deal_id")
      .eq("id", id)
      .eq("workspace_id", ctx.workspaceId)
      .single();

    const { error } = await admin
      .from("deal_events")
      .delete()
      .eq("id", id)
      .eq("workspace_id", ctx.workspaceId);

    if (error) return { success: false, error: error.message };

    if (event) revalidatePath(`/deals/${event.deal_id}`);
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete deal event" };
  }
}
