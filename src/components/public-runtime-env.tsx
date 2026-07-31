import { getServerSupabaseAnonKey, getServerSupabaseUrl, getServerSiteUrl } from "@/lib/supabase/env.server";

declare global {
  interface Window {
    __NEXT_PUBLIC_ENV__?: Record<string, string>;
  }
}

/**
 * Injects public env vars from the server at request time. On Vercel, client
 * bundles only see NEXT_PUBLIC_* values that existed at build time; this script
 * lets the browser pick up vars added later without a rebuild.
 */
export function PublicRuntimeEnv() {
  const payload: Record<string, string> = {};

  const supabaseUrl = getServerSupabaseUrl();
  const supabaseAnonKey = getServerSupabaseAnonKey();
  const siteUrl = getServerSiteUrl();

  if (supabaseUrl) payload.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl;
  if (supabaseAnonKey) payload.NEXT_PUBLIC_SUPABASE_ANON_KEY = supabaseAnonKey;
  if (siteUrl) payload.NEXT_PUBLIC_SITE_URL = siteUrl;

  if (Object.keys(payload).length === 0) return null;

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `window.__NEXT_PUBLIC_ENV__=${JSON.stringify(payload)};`,
      }}
    />
  );
}
