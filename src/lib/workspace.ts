import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type WorkspaceContext = {
  userId: string;
  workspaceId: string;
  role: string;
};

/**
 * Gets the current user's workspace context using the admin client.
 * This bypasses RLS to reliably fetch workspace membership.
 * Returns null if user is not authenticated or has no workspace.
 */
export async function getWorkspaceContext(): Promise<WorkspaceContext | null> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    const admin = createAdminClient();
    const { data: member } = await admin
      .from("workspace_members")
      .select("workspace_id, role")
      .eq("user_id", user.id)
      .eq("status", "Active")
      .single();

    if (!member) return null;

    return {
      userId: user.id,
      workspaceId: member.workspace_id,
      role: member.role,
    };
  } catch {
    return null;
  }
}
