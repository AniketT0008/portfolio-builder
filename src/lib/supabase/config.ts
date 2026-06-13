/**
 * Shared Supabase env helpers. Trims whitespace and accepts either the legacy
 * anon key or the newer publishable key name.
 */
export function getSupabaseUrl(): string | undefined {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url || !url.startsWith("http")) return undefined;
  return url;
}

export function getSupabaseAnonKey(): string | undefined {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  return key || undefined;
}

/** True when the public Supabase env vars are present and look valid. */
export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}
