import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// NOTE: We intentionally omit the Database generic here.
// Using createServerClient<Database> causes `never` type inference on all
// table operations due to a compatibility issue between @supabase/ssr's
// GenericSchema constraint and our generated Database type. The admin client
// (from @supabase/supabase-js directly) handles the same Database type fine.
// Auth operations (.auth.getUser(), etc.) work correctly regardless.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  );
}
