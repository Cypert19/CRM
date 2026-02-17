/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import { updateTaskSchema } from "@/validators/tasks";
import { withApiAuth } from "@/lib/api/handler";
import { apiSuccess, apiError, apiNotFound } from "@/lib/api/response";

// GET /api/v1/tasks/:id
export const GET = withApiAuth(async (_request, ctx, params) => {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tasks")
    .select(
      "*, users!tasks_assignee_id_fkey(id, full_name, avatar_url), creator:users!tasks_creator_id_fkey(id, full_name, avatar_url), deals!tasks_deal_id_fkey(id, title, value), contacts!tasks_contact_id_fkey(id, first_name, last_name, email)"
    )
    .eq("id", params.id)
    .eq("workspace_id", ctx.workspaceId)
    .single();

  if (error) return apiNotFound("Task");
  return apiSuccess(data);
});

// PATCH /api/v1/tasks/:id
export const PATCH = withApiAuth(async (request, ctx, params) => {
  const body = await request.json();
  const parsed = updateTaskSchema.safeParse({ ...body, id: params.id });
  if (!parsed.success)
    return apiError(parsed.error.errors[0]?.message ?? "Invalid input", 422);

  const { id, ...updates } = parsed.data;

  // Auto-set completed_at when marking as Done
  if (updates.status === "Done" && !updates.completed_at) {
    updates.completed_at = new Date().toISOString();
  }

  const admin = createAdminClient();
  const { data, error } = await (admin.from("tasks") as any)
    .update(updates)
    .eq("id", id)
    .eq("workspace_id", ctx.workspaceId)
    .select()
    .single();

  if (error) return apiError(error.message, 500);
  if (!data) return apiNotFound("Task");

  const activityType = updates.status === "Done" ? "task_completed" : "task_updated";
  await (admin.from("activities") as any).insert({
    workspace_id: ctx.workspaceId,
    activity_type: activityType,
    actor_id: ctx.createdByUserId,
    entity_type: "Task",
    entity_id: id,
    metadata: { title: data.title, via: "api" },
  });

  return apiSuccess(data);
});

// DELETE /api/v1/tasks/:id
export const DELETE = withApiAuth(async (_request, ctx, params) => {
  const admin = createAdminClient();
  const { error } = await admin
    .from("tasks")
    .delete()
    .eq("id", params.id)
    .eq("workspace_id", ctx.workspaceId);

  if (error) return apiError(error.message, 500);
  return apiSuccess({ id: params.id, deleted: true });
});
