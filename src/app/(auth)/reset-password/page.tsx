"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/login");
    }
  };

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="gradient-text text-2xl font-bold">Set new password</h1>
        <p className="mt-2 text-text-secondary">Choose a strong password</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="mb-1.5 block text-xs text-text-secondary">
            New Password
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

        {error && <p className="text-sm text-signal-danger">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="gradient-button focus-ring w-full rounded-lg py-2.5 text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </>
  );
}
