/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import { createTaskSchema } from "@/validators/tasks";
import { withApiAuth } from "@/lib/api/handler";
import { apiSuccess, apiError } from "@/lib/api/response";

// GET /api/v1/tasks?assignee_id=&deal_id=&status=
export const GET = withApiAuth(async (request, ctx) => {
  const { searchParams } = new URL(request.url);
  const assigneeId = searchParams.get("assignee_id");
  const dealId = searchParams.get("deal_id");
  const status = searchParams.get("status");

  const admin = createAdminClient();
  let query = admin
    .from("tasks")
    .select(
      "*, users!tasks_assignee_id_fkey(id, full_name, avatar_url), deals!tasks_deal_id_fkey(id, title), contacts!tasks_contact_id_fkey(id, first_name, last_name)"
    )
    .eq("workspace_id", ctx.workspaceId)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (assigneeId) query = query.eq("assignee_id", assigneeId);
  if (dealId) query = query.eq("deal_id", dealId);
  if (status) query = query.eq("status", status as any);

  const { data, error } = await query;
  if (error) return apiError(error.message, 500);
  return apiSuccess(data);
});

// POST /api/v1/tasks
export const POST = withApiAuth(async (request, ctx) => {
  const body = await request.json();
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success)
    return apiError(parsed.error.errors[0]?.message ?? "Invalid input", 422);

  // Default due_date to 7 days from now if not provided
  if (!parsed.data.due_date) {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    parsed.data.due_date = d.toISOString().split("T")[0];
  }

  const admin = createAdminClient();
  const { data, error } = await (admin.from("tasks") as any)
    .insert({
      ...parsed.data,
      workspace_id: ctx.workspaceId,
      creator_id: ctx.createdByUserId,
      assignee_id: parsed.data.assignee_id ?? ctx.createdByUserId,
    })
    .select()
    .single();

  if (error) return apiError(error.message, 500);

  await (admin.from("activities") as any).insert({
    workspace_id: ctx.workspaceId,
    activity_type: "task_created",
    actor_id: ctx.createdByUserId,
    entity_type: "Task",
    entity_id: data.id,
    metadata: { title: data.title, via: "api" },
  });

  return apiSuccess(data, 201);
});
