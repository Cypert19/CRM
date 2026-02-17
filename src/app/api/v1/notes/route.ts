/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import { createNoteSchema } from "@/validators/notes";
import { withApiAuth } from "@/lib/api/handler";
import { apiSuccess, apiError } from "@/lib/api/response";

// GET /api/v1/notes?entity_type=Deal&entity_id=xxx
export const GET = withApiAuth(async (request, ctx) => {
  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get("entity_type");
  const entityId = searchParams.get("entity_id");

  const admin = createAdminClient();
  let query = admin
    .from("notes")
    .select("*, users!notes_author_id_fkey(id, full_name, avatar_url)")
    .eq("workspace_id", ctx.workspaceId)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (entityType === "Deal" && entityId) query = query.eq("deal_id", entityId);
  if (entityType === "Contact" && entityId) query = query.eq("contact_id", entityId);
  if (entityType === "Company" && entityId) query = query.eq("company_id", entityId);

  const { data, error } = await query;
  if (error) return apiError(error.message, 500);
  return apiSuccess(data);
});

// POST /api/v1/notes
export const POST = withApiAuth(async (request, ctx) => {
  const body = await request.json();
  const parsed = createNoteSchema.safeParse(body);
  if (!parsed.success)
    return apiError(parsed.error.errors[0]?.message ?? "Invalid input", 422);

  const admin = createAdminClient();
  const { data, error } = await (admin.from("notes") as any)
    .insert({
      ...parsed.data,
      workspace_id: ctx.workspaceId,
      author_id: ctx.createdByUserId,
    })
    .select()
    .single();

  if (error) return apiError(error.message, 500);

  await (admin.from("activities") as any).insert({
    workspace_id: ctx.workspaceId,
    activity_type: "note_created",
    actor_id: ctx.createdByUserId,
    entity_type: "Note",
    entity_id: data.id,
    metadata: { title: data.title || "Untitled", via: "api" },
  });

  return apiSuccess(data, 201);
});
