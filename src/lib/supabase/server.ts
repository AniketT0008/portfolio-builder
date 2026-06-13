import { cookies } from "next/headers";

import { createServerClient, type CookieOptions } from "@supabase/ssr";

import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/config";
import type { Database } from "@/lib/types/database";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Server-side Supabase client for Server Components, Route Handlers and
 * Server Actions. Reads/writes the auth cookies bound to the request.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    getSupabaseUrl()!,
    getSupabaseAnonKey()!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // `setAll` was called from a Server Component. This can be ignored
            // when middleware is refreshing the session (see middleware.ts).
          }
        },
      },
    },
  );
}

/**
 * Privileged client backed by the service-role key. SERVER ONLY.
 * Bypasses RLS — only use for trusted, well-scoped operations.
 */
export function createServiceClient() {
  const cookieStore = cookies();
  return createServerClient<Database>(
    getSupabaseUrl()!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!.trim(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          /* no-op: service client never mutates auth cookies */
        },
      },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}
