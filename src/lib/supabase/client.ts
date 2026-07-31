import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/config";
import type { Database } from "@/lib/types/database";

/**
 * Browser-side Supabase client (Client Components).
 * Safe to call repeatedly — `createBrowserClient` is internally memoized.
 */
export function createClient() {
  return createBrowserClient<Database>(
    getSupabaseUrl()!,
    getSupabaseAnonKey()!,
  );
}
