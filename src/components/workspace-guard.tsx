"use client";

import { useEffect, useRef } from "react";
import { ensureWorkspace } from "@/actions/auth";

/**
 * Client component that ensures workspace exists on mount.
 * Runs once per session. Silent — no UI.
 */
export function WorkspaceGuard() {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    ensureWorkspace().then((result) => {
      if (!result.success) {
        console.error("[WorkspaceGuard] Failed to ensure workspace:", result.error);
      } else {
        console.log("[WorkspaceGuard] Workspace ready:", result.data?.workspaceId);
      }
    });
  }, []);

  return null;
}
