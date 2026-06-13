/**
 * Shared Supabase env helpers. Trims whitespace and accepts either the legacy
 * anon key or the newer publishable key name.
 *
 * On Vercel, NEXT_PUBLIC_* values are normally inlined at build time. The root
 * layout also injects them at request time via PublicRuntimeEnv so vars added
 * after deploy still work in Client Components.
 */

declare global {
  interface Window {
    __NEXT_PUBLIC_ENV__?: Record<string, string>;
  }
}

function cleanEnvValue(value: string | undefined): string | undefined {
  if (!value) return undefined;
  let v = value.trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim();
  }
  return v || undefined;
}

function readPublicEnv(name: string): string | undefined {
  const fromProcess = cleanEnvValue(process.env[name]);
  if (fromProcess) return fromProcess;

  if (typeof window !== "undefined") {
    const fromRuntime = cleanEnvValue(window.__NEXT_PUBLIC_ENV__?.[name]);
    if (fromRuntime) return fromRuntime;
  }

  return undefined;
}

export function getSupabaseUrl(): string | undefined {
  const url = readPublicEnv("NEXT_PUBLIC_SUPABASE_URL");
  if (!url || !url.startsWith("http")) return undefined;
  return url;
}

export function getSupabaseAnonKey(): string | undefined {
  const key =
    readPublicEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") ||
    readPublicEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  return key || undefined;
}

export function getSiteUrl(): string | undefined {
  const url = readPublicEnv("NEXT_PUBLIC_SITE_URL");
  return url || undefined;
}

/** True when the public Supabase env vars are present and look valid. */
export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}
