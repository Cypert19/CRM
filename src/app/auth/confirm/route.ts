import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Handles Supabase Auth confirmation links (invite, recovery, email signup).
 * Supabase sends links like: /auth/confirm?token_hash=xxx&type=invite
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as
    | "invite"
    | "recovery"
    | "signup"
    | "email"
    | null;

  if (!tokenHash || !type) {
    return NextResponse.redirect(`${origin}/login?error=missing_token`);
  }

  const supabase = await createClient();

  // Verify the OTP token
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type === "invite" ? "invite" : type === "recovery" ? "recovery" : "signup",
  });

  if (error || !data.user) {
    console.error("[auth/confirm] verifyOtp error:", error);
    return NextResponse.redirect(
      `${origin}/login?error=invalid_token&message=${encodeURIComponent(error?.message || "Token verification failed")}`
    );
  }

  // For invite type, activate the workspace membership
  if (type === "invite") {
    try {
      const admin = createAdminClient();

      // Find any "Invited" membership for this user and activate it
      const { data: invitedMembership } = await admin
        .from("workspace_members")
        .select("id, workspace_id")
        .eq("user_id", data.user.id)
        .eq("status", "Invited")
        .single();

      if (invitedMembership) {
        await admin
          .from("workspace_members")
          .update({ status: "Active" })
          .eq("id", invitedMembership.id);
      }

      // Update user record with real name if they set one during signup
      const fullName = data.user.user_metadata?.full_name;
      if (fullName) {
        await admin
          .from("users")
          .update({ full_name: fullName })
          .eq("id", data.user.id);
      }
    } catch (err) {
      console.error("[auth/confirm] Error activating invite membership:", err);
    }

    // Redirect invited users to set up their account (name + password)
    return NextResponse.redirect(`${origin}/accept-invite`);
  }

  // For recovery, redirect to password reset
  if (type === "recovery") {
    return NextResponse.redirect(`${origin}/reset-password`);
  }

  // For signup/email verification, go to dashboard
  return NextResponse.redirect(`${origin}/dashboard`);
}
