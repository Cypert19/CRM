"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createContactSchema, updateContactSchema } from "@/validators/contacts";
import { getWorkspaceContext } from "@/lib/workspace";
import type { ActionResponse } from "@/types/common";
import type { Tables } from "@/types/database";

export async function getContacts(): Promise<ActionResponse<Tables<"contacts">[]>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("contacts")
      .select("*, companies(id, company_name)")
      .eq("workspace_id", ctx.workspaceId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) return { success: false, error: error.message };
    return { success: true, data: data as unknown as Tables<"contacts">[] };
  } catch {
    return { success: false, error: "Failed to fetch contacts" };
  }
}

export async function getContact(id: string): Promise<ActionResponse<Tables<"contacts">>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("contacts")
      .select("*, companies(id, company_name), deal_contacts(deal_id, role, deals(id, title, value, stage_id))")
      .eq("id", id)
      .eq("workspace_id", ctx.workspaceId)
      .is("deleted_at", null)
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data: data as unknown as Tables<"contacts"> };
  } catch {
    return { success: false, error: "Failed to fetch contact" };
  }
}

export async function createContact(input: unknown): Promise<ActionResponse<Tables<"contacts">>> {
  try {
    const parsed = createContactSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found. Please log out and log back in." };

    const admin = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin.from("contacts") as any)
      .insert({ ...parsed.data, workspace_id: ctx.workspaceId, owner_id: ctx.userId })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from("activities") as any).insert({
      workspace_id: ctx.workspaceId,
      activity_type: "contact_created",
      actor_id: ctx.userId,
      entity_type: "Contact",
      entity_id: data.id,
      metadata: { name: `${data.first_name} ${data.last_name}` },
    });

    revalidatePath("/contacts");
    return { success: true, data };
  } catch {
    return { success: false, error: "Failed to create contact" };
  }
}

export async function updateContact(input: unknown): Promise<ActionResponse<Tables<"contacts">>> {
  try {
    const parsed = updateContactSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const { id, ...updates } = parsed.data;
    const admin = createAdminClient();

    const { data, error } = await admin
      .from("contacts")
      .update(updates)
      .eq("id", id)
      .eq("workspace_id", ctx.workspaceId)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath("/contacts");
    revalidatePath(`/contacts/${id}`);
    return { success: true, data };
  } catch {
    return { success: false, error: "Failed to update contact" };
  }
}

export async function deleteContact(id: string): Promise<ActionResponse> {
  try {
    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin.from("contacts") as any)
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return { success: false, error: error.message };
    revalidatePath("/contacts");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete contact" };
  }
}
