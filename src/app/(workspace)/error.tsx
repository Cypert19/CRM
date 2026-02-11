"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/gradient-button";

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-signal-danger/10 blur-2xl" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-bg-card">
          <span className="text-2xl">!</span>
        </div>
      </div>
      <h2 className="text-lg font-semibold text-text-primary">Something went wrong</h2>
      <p className="mt-1.5 max-w-sm text-sm text-text-secondary">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <Button onClick={reset} className="mt-6">
        Try again
      </Button>
    </div>
  );
}
