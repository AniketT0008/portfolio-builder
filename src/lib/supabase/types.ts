import type { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/types/database";

/**
 * The concrete Supabase client type for our Database, as returned by
 * `@supabase/ssr`. Both the browser and server clients resolve to this exact
 * type, so helper functions can accept either.
 */
export type TypedSupabaseClient = ReturnType<
  typeof createBrowserClient<Database>
>;
