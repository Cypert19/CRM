"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { ensureWorkspace } from "@/actions/auth";

/**
 * Accept Invite page — handles the Supabase invite redirect.
 * After clicking the invite email link, Supabase verifies the token and
 * redirects here with an active session. The user sets their password
 * and gets activated in the workspace.
 */
export default function AcceptInvitePage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if user has a valid session from the invite link
    const checkSession = async () => {
      const supabase = createBrowserSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // No session — the invite link may have expired or was invalid
        router.push("/login?error=invite_expired");
        return;
      }

      // Pre-fill name if available
      if (user.user_metadata?.full_name) {
        setFullName(user.user_metadata.full_name);
      }

      setChecking(false);
    };

    checkSession();
  }, [router]);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!fullName.trim()) {
      setError("Please enter your name");
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createBrowserSupabaseClient();

    // Update password
    const { error: pwError } = await supabase.auth.updateUser({
      password,
      data: { full_name: fullName.trim() },
    });

    if (pwError) {
      setError(pwError.message);
      setLoading(false);
      return;
    }

    // Ensure workspace membership is activated and user record is created
    await ensureWorkspace();

    router.push("/dashboard");
    router.refresh();
  };

  if (checking) {
    return (
      <>
        <div className="mb-8 text-center">
          <h1 className="gradient-text text-3xl font-bold">Nexus AI</h1>
          <p className="mt-2 text-text-secondary">Setting up your account...</p>
        </div>
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="gradient-text text-3xl font-bold">Nexus AI</h1>
        <p className="mt-2 text-text-secondary">
          Welcome! Set up your account to get started.
        </p>
      </div>

      <form onSubmit={handleSetup} className="space-y-4">
        <div>
          <label htmlFor="fullName" className="mb-1.5 block text-xs text-text-secondary">
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="focus-ring glass-panel-dense w-full rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary"
            placeholder="John Smith"
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-xs text-text-secondary">
            Set Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="focus-ring glass-panel-dense w-full rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary"
            placeholder="Min. 8 characters"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-1.5 block text-xs text-text-secondary">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="focus-ring glass-panel-dense w-full rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary"
            placeholder="Confirm your password"
          />
        </div>

        {error && (
          <p className="text-sm text-signal-danger">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="gradient-button focus-ring w-full rounded-lg py-2.5 text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Setting up..." : "Complete Setup"}
        </button>
      </form>
    </>
  );
}
