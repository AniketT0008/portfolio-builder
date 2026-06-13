/**
 * Server / Edge / Middleware env readers. Uses process.env directly — never
 * import this file from Client Components.
 */

import {
  cleanEnvValue,
  normalizeSupabaseUrl,
  sanitizeSupabaseAnonKey,
  isValidSupabaseAnonKey,
} from "@/lib/supabase/env-shared";

function firstEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const v = cleanEnvValue(process.env[name]);
    if (v) return v;
  }
  return undefined;
}

function rawSupabaseAnonKey(): string | undefined {
  return firstEnv(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_ANON_KEY",
  );
}

export function getServerSupabaseUrl(): string | undefined {
  return normalizeSupabaseUrl(
    firstEnv(
      "NEXT_PUBLIC_SUPABASE_URL",
      "SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_PROJECT_URL",
    ),
  );
}

export function getServerSupabaseAnonKey(): string | undefined {
  return sanitizeSupabaseAnonKey(rawSupabaseAnonKey());
}

export function getServerSiteUrl(): string | undefined {
  return firstEnv("NEXT_PUBLIC_SITE_URL", "SITE_URL");
}

export function getServerGeminiKey(): string | undefined {
  return firstEnv("GEMINI_MODEL", "GEMINI_API_KEY", "GOOGLE_API_KEY");
}

export function isServerSupabaseConfigured(): boolean {
  return Boolean(getServerSupabaseUrl() && getServerSupabaseAnonKey());
}

export function isServerAIConfigured(): boolean {
  return Boolean(getServerGeminiKey());
}

export function isServerAnonKeyMisconfigured(): boolean {
  const raw = rawSupabaseAnonKey();
  return Boolean(raw && !isValidSupabaseAnonKey(raw));
}

/** Safe diagnostics for /api/health — never returns secret values. */
export function getServerEnvDiagnostics() {
  const url = getServerSupabaseUrl();
  const anon = getServerSupabaseAnonKey();
  const rawUrl = firstEnv(
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PROJECT_URL",
  );
  const rawAnon = rawSupabaseAnonKey();
  const rawGemini = firstEnv(
    "GEMINI_MODEL",
    "GEMINI_API_KEY",
    "GOOGLE_API_KEY",
  );

  return {
    hasSupabaseUrl: Boolean(url),
    hasSupabaseAnonKey: Boolean(anon),
    supabaseUrlHost: url ? safeHost(url) : null,
    hasGeminiKey: isServerAIConfigured(),
    hasSiteUrl: Boolean(getServerSiteUrl()),
    anonKeyMisconfigured: isServerAnonKeyMisconfigured(),
    debug: {
      supabaseUrlEnvPresent: Boolean(rawUrl),
      supabaseUrlRawLength: rawUrl?.length ?? 0,
      supabaseUrlRawHasHttpPrefix: rawUrl
        ? /^https?:\/\//i.test(rawUrl.trim())
        : false,
      supabaseUrlNormalized: Boolean(url),
      anonKeyEnvPresent: Boolean(rawAnon),
      anonKeyLooksLikeUrl: rawAnon
        ? /^https?:\/\//i.test(rawAnon) || rawAnon.includes(".supabase.co")
        : false,
      geminiModelEnvPresent: Boolean(rawGemini),
      geminiModelRawLength: rawGemini?.length ?? 0,
    },
  };
}

function safeHost(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}
