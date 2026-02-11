"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/workspace";
import type { ActionResponse } from "@/types/common";
import type { Tables } from "@/types/database";

type DealContactWithDetails = Tables<"deal_contacts"> & {
  contacts: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    job_title: string | null;
  };
};

export async function getDealContacts(
  dealId: string
): Promise<ActionResponse<DealContactWithDetails[]>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("deal_contacts")
      .select(
        "*, contacts(id, first_name, last_name, email, phone, job_title)"
      )
      .eq("deal_id", dealId)
      .eq("workspace_id", ctx.workspaceId)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) return { success: false, error: error.message };
    return {
      success: true,
      data: data as unknown as DealContactWithDetails[],
    };
  } catch {
    return { success: false, error: "Failed to fetch deal contacts" };
  }
}

export async function addDealContact(input: {
  deal_id: string;
  contact_id: string;
  role?: string | null;
  is_primary?: boolean;
}): Promise<ActionResponse<Tables<"deal_contacts">>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const admin = createAdminClient();

    // Check if contact is already linked
    const { data: existing } = await admin
      .from("deal_contacts")
      .select("id")
      .eq("deal_id", input.deal_id)
      .eq("contact_id", input.contact_id)
      .eq("workspace_id", ctx.workspaceId)
      .maybeSingle();

    if (existing)
      return { success: false, error: "Contact is already linked to this deal" };

    const { data, error } = await admin
      .from("deal_contacts")
      .insert({
        workspace_id: ctx.workspaceId,
        deal_id: input.deal_id,
        contact_id: input.contact_id,
        role: input.role as Tables<"deal_contacts">["role"],
        is_primary: input.is_primary ?? false,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath(`/deals/${input.deal_id}`);
    return { success: true, data: data as Tables<"deal_contacts"> };
  } catch {
    return { success: false, error: "Failed to add deal contact" };
  }
}

export async function updateDealContactRole(input: {
  id: string;
  role?: string | null;
  is_primary?: boolean;
}): Promise<ActionResponse<Tables<"deal_contacts">>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const admin = createAdminClient();
    const updates: Record<string, unknown> = {};
    if (input.role !== undefined) updates.role = input.role;
    if (input.is_primary !== undefined) updates.is_primary = input.is_primary;

    const { data, error } = await admin
      .from("deal_contacts")
      .update(updates)
      .eq("id", input.id)
      .eq("workspace_id", ctx.workspaceId)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath(`/deals/${data.deal_id}`);
    return { success: true, data: data as Tables<"deal_contacts"> };
  } catch {
    return { success: false, error: "Failed to update deal contact" };
  }
}

export async function removeDealContact(id: string): Promise<ActionResponse> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const admin = createAdminClient();

    const { data: dc } = await admin
      .from("deal_contacts")
      .select("deal_id")
      .eq("id", id)
      .eq("workspace_id", ctx.workspaceId)
      .single();

    const { error } = await admin
      .from("deal_contacts")
      .delete()
      .eq("id", id)
      .eq("workspace_id", ctx.workspaceId);

    if (error) return { success: false, error: error.message };

    if (dc) revalidatePath(`/deals/${dc.deal_id}`);
    return { success: true };
  } catch {
    return { success: false, error: "Failed to remove deal contact" };
  }
}
