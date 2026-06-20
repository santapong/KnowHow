import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env, supabaseConfigured } from "@/lib/env";

const PROTECTED_PREFIXES = ["/shelf", "/upload", "/settings", "/instructor"];

function isProtectedPath(path: string) {
  return PROTECTED_PREFIXES.some((p) => path.startsWith(p));
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const path = request.nextUrl.pathname;

  // No Supabase env vars: still gate protected routes at the edge so users
  // see /login (with its "Supabase not configured" notice) instead of a
  // server-component redirect that falls back to a 1s meta-refresh.
  if (!supabaseConfigured) {
    if (isProtectedPath(path)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", path);
      return NextResponse.redirect(url);
    }
    return response;
  }

  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isProtectedPath(path) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  return response;
}
