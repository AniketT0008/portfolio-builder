/**
 * True when the public Supabase env vars are present. Safe to call on the
 * server and in the browser (NEXT_PUBLIC_* values are inlined at build time).
 * Used to degrade gracefully instead of throwing when the project hasn't been
 * connected to a Supabase instance yet.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
