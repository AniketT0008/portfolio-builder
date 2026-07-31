/**
 * Shared Supabase env helpers for Client Components.
 * Server code should prefer env.server.ts for process.env reads.
 */

import {
  cleanEnvValue,
  isValidSupabaseAnonKey,
  normalizeSupabaseUrl,
  sanitizeSupabaseAnonKey,
} from "@/lib/supabase/env-shared";

declare global {
  interface Window {
    __NEXT_PUBLIC_ENV__?: Record<string, string>;
  }
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
  return normalizeSupabaseUrl(readPublicEnv("NEXT_PUBLIC_SUPABASE_URL"));
}

export function getSupabaseAnonKey(): string | undefined {
  return sanitizeSupabaseAnonKey(
    readPublicEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") ||
      readPublicEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  );
}

/** Raw anon env value before validation (for error messages). */
export function getRawSupabaseAnonKey(): string | undefined {
  return (
    readPublicEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") ||
    readPublicEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
  );
}

export function getSiteUrl(): string | undefined {
  return readPublicEnv("NEXT_PUBLIC_SITE_URL");
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

export function isAnonKeyMisconfigured(): boolean {
  const raw = getRawSupabaseAnonKey();
  return Boolean(raw && !isValidSupabaseAnonKey(raw));
}
