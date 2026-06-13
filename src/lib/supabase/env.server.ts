/**
 * Server / Edge / Middleware env readers. Uses process.env directly — never
 * import this file from Client Components.
 */

function cleanEnvValue(value: string | undefined): string | undefined {
  if (!value) return undefined;
  // Remove BOM / zero-width chars sometimes pasted from docs.
  let v = value.replace(/^\uFEFF/, "").trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim();
  }
  return v || undefined;
}

function firstEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const v = cleanEnvValue(process.env[name]);
    if (v) return v;
  }
  return undefined;
}

/** Accept full URL, host-only, or bare project ref. */
function normalizeSupabaseUrl(raw: string | undefined): string | undefined {
  const v = cleanEnvValue(raw);
  if (!v) return undefined;

  let url = v;
  if (!/^https?:\/\//i.test(url)) {
    if (url.includes(".supabase.co")) {
      url = `https://${url.replace(/^\/+/, "")}`;
    } else if (/^[a-z0-9-]+$/i.test(url)) {
      url = `https://${url}.supabase.co`;
    } else {
      return undefined;
    }
  }

  if (!/^https?:\/\//i.test(url)) return undefined;
  return url;
}

export function getServerSupabaseUrl(): string | undefined {
  const raw = firstEnv(
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PROJECT_URL",
  );
  return normalizeSupabaseUrl(raw);
}

export function getServerSupabaseAnonKey(): string | undefined {
  return (
    firstEnv(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "SUPABASE_ANON_KEY",
    ) || undefined
  );
}

export function getServerSiteUrl(): string | undefined {
  return firstEnv("NEXT_PUBLIC_SITE_URL", "SITE_URL");
}

export function getServerGeminiKey(): string | undefined {
  // Primary env var name used in Vercel: GEMINI_MODEL (holds the AIza API key).
  // GEMINI_API_KEY is kept as a fallback alias.
  return firstEnv("GEMINI_MODEL", "GEMINI_API_KEY", "GOOGLE_API_KEY");
}

export function isServerSupabaseConfigured(): boolean {
  return Boolean(getServerSupabaseUrl() && getServerSupabaseAnonKey());
}

export function isServerAIConfigured(): boolean {
  return Boolean(getServerGeminiKey());
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
    debug: {
      // Raw env value in Vercel (may be project ref only, e.g. lptkjqaolnynnuxhxokz)
      supabaseUrlEnvPresent: Boolean(rawUrl),
      supabaseUrlRawLength: rawUrl?.length ?? 0,
      supabaseUrlRawHasHttpPrefix: rawUrl
        ? /^https?:\/\//i.test(rawUrl.trim())
        : false,
      supabaseUrlNormalized: Boolean(url),
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
