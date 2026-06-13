/**
 * Server / Edge / Middleware env readers. Uses process.env directly — never
 * import this file from Client Components.
 */

function cleanEnvValue(value: string | undefined): string | undefined {
  if (!value) return undefined;
  let v = value.trim();
  // Strip accidental wrapping quotes pasted from docs or dashboards.
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim();
  }
  return v || undefined;
}

export function getServerSupabaseUrl(): string | undefined {
  const url = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (!url || !url.startsWith("http")) return undefined;
  return url;
}

export function getServerSupabaseAnonKey(): string | undefined {
  return (
    cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
    undefined
  );
}

export function getServerSiteUrl(): string | undefined {
  return cleanEnvValue(process.env.NEXT_PUBLIC_SITE_URL);
}

export function getServerGeminiKey(): string | undefined {
  return cleanEnvValue(process.env.GEMINI_API_KEY);
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
  return {
    hasSupabaseUrl: Boolean(url),
    hasSupabaseAnonKey: Boolean(anon),
    supabaseUrlHost: url ? safeHost(url) : null,
    hasGeminiKey: isServerAIConfigured(),
    hasSiteUrl: Boolean(getServerSiteUrl()),
  };
}

function safeHost(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}
