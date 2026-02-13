"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { ensureWorkspace } from "@/actions/auth";

export default function LoginPage() {
  return (
    <Suspense fallback={
      <>
        <div className="mb-8 text-center">
          <h1 className="gradient-text text-3xl font-bold">Nexus AI</h1>
          <p className="mt-2 text-text-secondary">Loading...</p>
        </div>
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
        </div>
      </>
    }>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Handle hash fragment redirects from Supabase (invite, recovery, etc.)
  // and query param errors
  useEffect(() => {
    const handleAuthRedirect = async () => {
      const supabase = createBrowserSupabaseClient();

      // Check for error in query params (from our /auth/confirm route)
      const errorParam = searchParams.get("error");
      if (errorParam === "invite_expired") {
        setError("Your invitation link has expired. Please ask your admin to resend the invite.");
        setCheckingAuth(false);
        return;
      }
      if (errorParam === "invalid_token") {
        const message = searchParams.get("message") || "Invalid or expired link";
        setError(message);
        setCheckingAuth(false);
        return;
      }

      // Check for hash fragment errors (from Supabase implicit flow)
      if (typeof window !== "undefined" && window.location.hash) {
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        );
        const hashError = hashParams.get("error_description");
        if (hashError) {
          if (hashError.includes("expired")) {
            setError("Your invitation link has expired. Please ask your admin to resend the invite.");
          } else {
            setError(hashError.replace(/\+/g, " "));
          }
          // Clear the hash
          window.history.replaceState(null, "", window.location.pathname);
          setCheckingAuth(false);
          return;
        }

        // Check for successful auth in hash (access_token from implicit flow)
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const type = hashParams.get("type");

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (!sessionError) {
            // Clear the hash
            window.history.replaceState(null, "", window.location.pathname);

            if (type === "invite" || type === "recovery") {
              // Invited user — send to accept-invite page to set password
              router.push("/accept-invite");
              return;
            }

            await ensureWorkspace();
            router.push("/dashboard");
            router.refresh();
            return;
          }
        }
      }

      // Check if user is already authenticated (e.g., from a valid invite link)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // User is already logged in — might have come from an invite
        // Check if they have an active workspace
        await ensureWorkspace();
        router.push("/dashboard");
        router.refresh();
        return;
      }

      setCheckingAuth(false);
    };

    handleAuthRedirect();
  }, [router, searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Ensure user record and workspace exist (creates if missing)
    await ensureWorkspace();

    router.push("/dashboard");
    router.refresh();
  };

  const handleOAuth = async (provider: "google" | "azure") => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  };

  if (checkingAuth) {
    return (
      <>
        <div className="mb-8 text-center">
          <h1 className="gradient-text text-3xl font-bold">Nexus AI</h1>
          <p className="mt-2 text-text-secondary">Checking authentication...</p>
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
          Sign in to your account
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs text-text-secondary">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="focus-ring glass-panel-dense w-full rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary"
            placeholder="you@company.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-xs text-text-secondary">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="focus-ring glass-panel-dense w-full rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary"
            placeholder="Enter your password"
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
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border-glass" />
        <span className="text-xs text-text-tertiary">or continue with</span>
        <div className="h-px flex-1 bg-border-glass" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleOAuth("google")}
          className="focus-ring glass-panel-dense flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
        >
          Google
        </button>
        <button
          onClick={() => handleOAuth("azure")}
          className="focus-ring glass-panel-dense flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
        >
          Microsoft
        </button>
      </div>

      <div className="mt-6 text-center text-sm text-text-secondary">
        <Link href="/forgot-password" className="hover:text-accent-primary">
          Forgot password?
        </Link>
        <span className="mx-2">·</span>
        <Link href="/signup" className="hover:text-accent-primary">
          Create account
        </Link>
      </div>
    </>
  );
}
