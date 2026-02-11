import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    // Check auth user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated", authError: authError?.message });
    }

    // Check users table
    const { data: userRecord, error: userError } = await admin
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    // Check workspace_members
    const { data: members, error: memberError } = await admin
      .from("workspace_members")
      .select("*")
      .eq("user_id", user.id);

    // Check all workspaces
    const { data: workspaces, error: wsError } = await admin
      .from("workspaces")
      .select("*")
      .limit(5);

    // Check all users
    const { data: allUsers, error: allUsersError } = await admin
      .from("users")
      .select("id, email, full_name")
      .limit(5);

    return NextResponse.json({
      authUser: { id: user.id, email: user.email, metadata: user.user_metadata },
      userRecord: userRecord || null,
      userError: userError?.message || null,
      members: members || [],
      memberError: memberError?.message || null,
      workspaces: workspaces || [],
      wsError: wsError?.message || null,
      allUsers: allUsers || [],
      allUsersError: allUsersError?.message || null,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}
