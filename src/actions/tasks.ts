"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createTaskSchema, updateTaskSchema } from "@/validators/tasks";
import { getWorkspaceContext } from "@/lib/workspace";
import type { ActionResponse } from "@/types/common";
import type { Tables } from "@/types/database";

export type TaskWithRelations = Tables<"tasks"> & {
  users?: { id: string; full_name: string; avatar_url: string | null } | null;
  creator?: { id: string; full_name: string; avatar_url: string | null } | null;
  deals?: { id: string; title: string; value: number } | null;
  contacts?: { id: string; first_name: string; last_name: string; email: string | null } | null;
};

export async function getTask(id: string): Promise<ActionResponse<TaskWithRelations>> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("tasks")
      .select(`
        *,
        users!tasks_assignee_id_fkey(id, full_name, avatar_url),
        creator:users!tasks_creator_id_fkey(id, full_name, avatar_url),
        deals!tasks_deal_id_fkey(id, title, value),
        contacts!tasks_contact_id_fkey(id, first_name, last_name, email)
      `)
      .eq("id", id)
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data: data as unknown as TaskWithRelations };
  } catch {
    return { success: false, error: "Failed to fetch task" };
  }
}

export async function getTasks(filters?: { assignee_id?: string; deal_id?: string; status?: string }): Promise<ActionResponse<TaskWithRelations[]>> {
  try {
    const admin = createAdminClient();
    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found" };

    let query = admin
      .from("tasks")
      .select(`
        *,
        users!tasks_assignee_id_fkey(id, full_name, avatar_url),
        deals!tasks_deal_id_fkey(id, title),
        contacts!tasks_contact_id_fkey(id, first_name, last_name)
      `)
      .eq("workspace_id", ctx.workspaceId)
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (filters?.assignee_id) query = query.eq("assignee_id", filters.assignee_id);
    if (filters?.deal_id) query = query.eq("deal_id", filters.deal_id);
    if (filters?.status) query = query.eq("status", filters.status as Tables<"tasks">["status"]);

    const { data, error } = await query;
    if (error) return { success: false, error: error.message };
    return { success: true, data: data as unknown as TaskWithRelations[] };
  } catch {
    return { success: false, error: "Failed to fetch tasks" };
  }
}

export async function createTask(input: unknown): Promise<ActionResponse<Tables<"tasks">>> {
  try {
    const parsed = createTaskSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

    const ctx = await getWorkspaceContext();
    if (!ctx) return { success: false, error: "No workspace found. Please log out and log back in." };

    const admin = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin.from("tasks") as any)
      .insert({
        ...parsed.data,
        workspace_id: ctx.workspaceId,
        creator_id: ctx.userId,
        assignee_id: parsed.data.assignee_id ?? ctx.userId,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from("activities") as any).insert({
      workspace_id: ctx.workspaceId,
      activity_type: "task_created",
      actor_id: ctx.userId,
      entity_type: "Task",
      entity_id: data.id,
      metadata: { title: data.title },
    });

    revalidatePath("/tasks");
    if (parsed.data.deal_id) revalidatePath(`/deals/${parsed.data.deal_id}`);
    return { success: true, data };
  } catch {
    return { success: false, error: "Failed to create task" };
  }
}

export async function updateTask(input: unknown): Promise<ActionResponse<Tables<"tasks">>> {
  try {
    const parsed = updateTaskSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

    const { id, ...updates } = parsed.data;

    // Auto-set completed_at when marking as Done (if not already provided)
    if (updates.status === "Done" && !updates.completed_at) {
      updates.completed_at = new Date().toISOString();
    }

    const admin = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin.from("tasks") as any).update(updates).eq("id", id).select().single();
    if (error) return { success: false, error: error.message };

    const ctx = await getWorkspaceContext();
    if (ctx) {
      const activityType = updates.status === "Done" ? "task_completed" : "task_updated";
      await admin.from("activities").insert({
        workspace_id: ctx.workspaceId,
        activity_type: activityType,
        actor_id: ctx.userId,
        entity_type: "Task",
        entity_id: data.id,
        metadata: { title: data.title } as unknown as Record<string, unknown>,
      } as never);
    }

    revalidatePath("/tasks");
    revalidatePath(`/tasks/${id}`);
    if (data.deal_id) revalidatePath(`/deals/${data.deal_id}`);
    return { success: true, data };
  } catch {
    return { success: false, error: "Failed to update task" };
  }
}

export async function deleteTask(id: string): Promise<ActionResponse> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("tasks").delete().eq("id", id);
    if (error) return { success: false, error: error.message };
    revalidatePath("/tasks");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete task" };
  }
}
