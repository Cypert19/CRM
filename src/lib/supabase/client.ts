import { createBrowserClient } from "@supabase/ssr";

// NOTE: We omit the Database generic because @supabase/ssr's GenericSchema
// constraint doesn't resolve correctly with our generated Database type,
// causing all table operations to return `never`. The admin client (using
// @supabase/supabase-js directly) handles the Database type correctly.
export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
