/** Shared env parsing — safe to import from client or server. */

export function cleanEnvValue(value: string | undefined): string | undefined {
  if (!value) return undefined;
  let v = value.replace(/^\uFEFF/, "").trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim();
  }
  return v || undefined;
}

/** Strip trailing slashes so OAuth redirect URLs stay consistent. */
export function normalizeSiteUrl(
  raw: string | undefined,
): string | undefined {
  const v = cleanEnvValue(raw);
  if (!v) return undefined;
  try {
    const url = new URL(v);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    return url.origin + url.pathname.replace(/\/+$/, "");
  } catch {
    return undefined;
  }
}

/** Accept full URL, host-only, or bare project ref. */
export function normalizeSupabaseUrl(
  raw: string | undefined,
): string | undefined {
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

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return undefined;
    }
    // Canonical project URL — no trailing slash / path noise.
    return parsed.origin;
  } catch {
    return undefined;
  }
}

/** Reject the common mistake of pasting the project URL as the anon key. */
export function isValidSupabaseAnonKey(key: string | undefined): boolean {
  if (!key) return false;
  if (/^https?:\/\//i.test(key) || key.includes(".supabase.co")) return false;
  if (key.startsWith("eyJ")) return true;
  if (key.startsWith("sb_publishable_")) return true;
  return false;
}

export function sanitizeSupabaseAnonKey(
  raw: string | undefined,
): string | undefined {
  const key = cleanEnvValue(raw);
  if (!key || !isValidSupabaseAnonKey(key)) return undefined;
  return key;
}
