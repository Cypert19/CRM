"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type RealtimeConfig = {
  table: string;
  queryKeys: string[][];
  enabled?: boolean;
};

export function useRealtime({ table, queryKeys, enabled = true }: RealtimeConfig) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const supabase = createBrowserSupabaseClient();

    const channel = supabase
      .channel(`realtime-${table}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => {
          // Invalidate all related queries on any change
          for (const key of queryKeys) {
            queryClient.invalidateQueries({ queryKey: key });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, enabled, queryClient, queryKeys]);
}
