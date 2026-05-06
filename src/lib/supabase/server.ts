import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { assertServiceRoleConfigured, env } from "@/lib/env";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // setAll inside RSC is a no-op; middleware refreshes the cookie.
        }
      },
    },
  });
}

export async function createServiceClient() {
  assertServiceRoleConfigured();
  const { createClient: createSupabaseClient } = await import(
    "@supabase/supabase-js"
  );
  return createSupabaseClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
