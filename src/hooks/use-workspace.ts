"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type WorkspaceContext = {
  workspaceId: string | null;
  role: string | null;
  loading: boolean;
};

export function useWorkspace(): WorkspaceContext {
  const [ctx, setCtx] = useState<WorkspaceContext>({
    workspaceId: null,
    role: null,
    loading: true,
  });

  useEffect(() => {
    async function load() {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setCtx({ workspaceId: null, role: null, loading: false });
        return;
      }

      const { data: member } = await supabase
        .from("workspace_members")
        .select("workspace_id, role")
        .eq("user_id", user.id)
        .eq("status", "Active")
        .single();

      setCtx({
        workspaceId: member?.workspace_id ?? null,
        role: member?.role ?? null,
        loading: false,
      });
    }
    load();
  }, []);

  return ctx;
}
