"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createCompanySchema, updateCompanySchema } from "@/validators/companies";
import { getWorkspaceContext } from "@/lib/workspace";
import type { ActionResponse } from "@/types/common";
import type { Tables } from "@/types/database";

export async function getCompanies(): Promise<ActionResponse<Tables<"companies">[]>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("companies")
      .select("*")
      .eq("workspace_id", ctx.workspaceId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch {
    return { success: false, error: "Failed to fetch companies" };
  }
}

export async function getCompany(id: string): Promise<ActionResponse<Tables<"companies">>> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("companies")
      .select("*, contacts(id, first_name, last_name, email, job_title), deals(id, title, value, stage_id)")
      .eq("id", id)
      .eq("workspace_id", ctx.workspaceId)
      .is("deleted_at", null)
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data: data as unknown as Tables<"companies"> };
  } catch {
    return { success: false, error: "Failed to fetch company" };
  }
}

export async function createCompany(input: unknown): Promise<ActionResponse<Tables<"companies">>> {
  try {
    const parsed = createCompanySchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found. Please log out and log back in." };

    const admin = createAdminClient();

    const { data, error } = await admin
      .from("companies")
      .insert({ ...parsed.data, workspace_id: ctx.workspaceId, owner_id: ctx.userId })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    await admin.from("activities").insert({
      workspace_id: ctx.workspaceId,
      activity_type: "company_created",
      actor_id: ctx.userId,
      entity_type: "Company",
      entity_id: data.id,
      metadata: { name: data.company_name },
    });

    revalidatePath("/companies");
    return { success: true, data };
  } catch {
    return { success: false, error: "Failed to create company" };
  }
}

export async function updateCompany(input: unknown): Promise<ActionResponse<Tables<"companies">>> {
  try {
    const parsed = updateCompanySchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const { id, ...updates } = parsed.data;
    const admin = createAdminClient();

    const { data, error } = await admin
      .from("companies")
      .update(updates)
      .eq("id", id)
      .eq("workspace_id", ctx.workspaceId)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath("/companies");
    revalidatePath(`/companies/${id}`);
    return { success: true, data };
  } catch {
    return { success: false, error: "Failed to update company" };
  }
}

export async function deleteCompany(id: string): Promise<ActionResponse> {
  try {
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    const admin = createAdminClient();
    const { error } = await admin
      .from("companies")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("workspace_id", ctx.workspaceId);

    if (error) return { success: false, error: error.message };
    revalidatePath("/companies");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete company" };
  }
}
