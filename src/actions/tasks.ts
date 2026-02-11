"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createTaskSchema, updateTaskSchema } from "@/validators/tasks";
import { getWorkspaceContext } from "@/lib/workspace";
import type { ActionResponse } from "@/types/common";
import type { Tables } from "@/types/database";

export async function getTasks(filters?: { assignee_id?: string; deal_id?: string; status?: string }): Promise<ActionResponse<Tables<"tasks">[]>> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("tasks")
      .select("*, users!tasks_assignee_id_fkey(id, full_name, avatar_url)")
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (filters?.assignee_id) query = query.eq("assignee_id", filters.assignee_id);
    if (filters?.deal_id) query = query.eq("deal_id", filters.deal_id);
    if (filters?.status) query = query.eq("status", filters.status);

    const { data, error } = await query;
    if (error) return { success: false, error: error.message };
    return { success: true, data: data as unknown as Tables<"tasks">[] };
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

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        ...parsed.data,
        workspace_id: ctx.workspaceId,
        creator_id: ctx.userId,
        assignee_id: parsed.data.assignee_id ?? ctx.userId,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    await supabase.from("activities").insert({
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
    const supabase = await createClient();

    const { data, error } = await supabase.from("tasks").update(updates).eq("id", id).select().single();
    if (error) return { success: false, error: error.message };

    if (updates.status === "Done") {
      const ctx = await getWorkspaceContext();
      if (ctx) {
        await supabase.from("activities").insert({
          workspace_id: ctx.workspaceId,
          activity_type: "task_completed",
          actor_id: ctx.userId,
          entity_type: "Task",
          entity_id: data.id,
          metadata: { title: data.title },
        });
      }
    }

    revalidatePath("/tasks");
    if (data.deal_id) revalidatePath(`/deals/${data.deal_id}`);
    return { success: true, data };
  } catch {
    return { success: false, error: "Failed to update task" };
  }
}

export async function deleteTask(id: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) return { success: false, error: error.message };
    revalidatePath("/tasks");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete task" };
  }
}
