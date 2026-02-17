/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import { withApiAuth } from "@/lib/api/handler";
import { apiSuccess, apiError } from "@/lib/api/response";

// GET /api/v1/reports/team-productivity
export const GET = withApiAuth(async (_request, ctx) => {
  const admin = createAdminClient();

  // Get workspace members
  const { data: members } = await admin
    .from("workspace_members")
    .select("user_id, role, users(id, full_name, avatar_url)")
    .eq("workspace_id", ctx.workspaceId)
    .eq("status", "Active");

  // Get all tasks
  const { data: tasks } = await admin
    .from("tasks")
    .select("id, status, assignee_id, completed_at, created_at, estimated_minutes, actual_minutes, due_date")
    .eq("workspace_id", ctx.workspaceId);

  const memberStats = (members ?? []).map((m) => {
    const user = m.users as { id: string; full_name: string; avatar_url: string | null } | null;
    const memberTasks = (tasks ?? []).filter((t) => t.assignee_id === m.user_id);
    const completed = memberTasks.filter((t) => t.status === "Done");
    const overdue = memberTasks.filter(
      (t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== "Done" && t.status !== "Cancelled"
    );

    return {
      user_id: m.user_id,
      full_name: user?.full_name ?? "Unknown",
      avatar_url: user?.avatar_url ?? null,
      role: m.role,
      total_tasks: memberTasks.length,
      completed_tasks: completed.length,
      overdue_tasks: overdue.length,
      completion_rate: memberTasks.length > 0 ? Math.round((completed.length / memberTasks.length) * 100) : 0,
    };
  });

  return apiSuccess({
    members: memberStats,
    totals: {
      total_tasks: (tasks ?? []).length,
      completed: (tasks ?? []).filter((t) => t.status === "Done").length,
      overdue: (tasks ?? []).filter(
        (t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== "Done" && t.status !== "Cancelled"
      ).length,
    },
  });
});
