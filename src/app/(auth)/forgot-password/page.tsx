"use client";

import { useState } from "react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="text-center">
        <h1 className="gradient-text text-2xl font-bold">Check your email</h1>
        <p className="mt-3 text-text-secondary">
          We sent a password reset link to <span className="text-text-primary">{email}</span>
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm text-accent-primary hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="gradient-text text-2xl font-bold">Reset password</h1>
        <p className="mt-2 text-text-secondary">
          Enter your email to receive a reset link
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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

        {error && <p className="text-sm text-signal-danger">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="gradient-button focus-ring w-full rounded-lg py-2.5 text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        <Link href="/login" className="text-accent-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
