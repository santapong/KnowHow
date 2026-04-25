import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";

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
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  const { createClient: createSupabaseClient } = await import(
    "@supabase/supabase-js"
  );
  return createSupabaseClient(env.supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
