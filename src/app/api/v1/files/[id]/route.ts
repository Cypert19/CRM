/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import { withApiAuth } from "@/lib/api/handler";
import { apiSuccess, apiError, apiNotFound } from "@/lib/api/response";

// DELETE /api/v1/files/:id
export const DELETE = withApiAuth(async (_request, ctx, params) => {
  const admin = createAdminClient();

  // Get file info first
  const { data: file } = await admin
    .from("files")
    .select("id, storage_path, original_filename")
    .eq("id", params.id)
    .eq("workspace_id", ctx.workspaceId)
    .single();

  if (!file) return apiNotFound("File");

  // Delete from storage
  if (file.storage_path) {
    await admin.storage.from("files").remove([file.storage_path]);
  }

  // Delete metadata
  const { error } = await admin
    .from("files")
    .delete()
    .eq("id", params.id)
    .eq("workspace_id", ctx.workspaceId);

  if (error) return apiError(error.message, 500);

  await (admin.from("activities") as any).insert({
    workspace_id: ctx.workspaceId,
    activity_type: "file_deleted",
    actor_id: ctx.createdByUserId,
    entity_type: "File",
    entity_id: params.id,
    metadata: { filename: file.original_filename, via: "api" },
  });

  return apiSuccess({ id: params.id, deleted: true });
});
