"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { createWorkspaceForUser } from "@/actions/auth";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          workspace_name: workspaceName,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Create workspace, user record, and default pipeline
    const wsResult = await createWorkspaceForUser(workspaceName);
    if (!wsResult.success) {
      setError(wsResult.error || "Failed to create workspace");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="gradient-text text-3xl font-bold">NexusCRM</h1>
        <p className="mt-2 text-text-secondary">Create your workspace</p>
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
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
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs text-text-secondary">
            Work Email
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
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="focus-ring glass-panel-dense w-full rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary"
            placeholder="Min. 8 characters"
          />
        </div>

        <div>
          <label htmlFor="workspace" className="mb-1.5 block text-xs text-text-secondary">
            Workspace Name
          </label>
          <input
            id="workspace"
            type="text"
            required
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            className="focus-ring glass-panel-dense w-full rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary"
            placeholder="Acme Corp"
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
          {loading ? "Creating workspace..." : "Create Workspace"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        Already have an account?{" "}
        <Link href="/login" className="text-accent-primary hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
