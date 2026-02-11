"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { ensureWorkspace } from "@/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="gradient-text text-3xl font-bold">NexusCRM</h1>
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
