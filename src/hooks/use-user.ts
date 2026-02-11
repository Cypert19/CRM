"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type UserContext = {
  userId: string | null;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  loading: boolean;
};

export function useUser(): UserContext {
  const [ctx, setCtx] = useState<UserContext>({
    userId: null,
    email: null,
    fullName: null,
    avatarUrl: null,
    loading: true,
  });

  useEffect(() => {
    async function load() {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setCtx({ userId: null, email: null, fullName: null, avatarUrl: null, loading: false });
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .single();

      setCtx({
        userId: user.id,
        email: user.email ?? null,
        fullName: profile?.full_name ?? null,
        avatarUrl: profile?.avatar_url ?? null,
        loading: false,
      });
    }
    load();
  }, []);

  return ctx;
}
