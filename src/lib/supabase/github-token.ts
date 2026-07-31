import type { User } from "@supabase/supabase-js";

import type { TypedSupabaseClient } from "@/lib/supabase/types";

/** Best-effort GitHub token from OAuth session or server env fallback. */
export async function getGitHubAccessToken(
  supabase: TypedSupabaseClient,
): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.provider_token) return session.provider_token;
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  return null;
}

export function githubUsernameFromUser(user: User): string | null {
  const meta = user.user_metadata ?? {};
  const candidates = [
    meta.user_name,
    meta.preferred_username,
    meta.login,
    meta.nickname,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return null;
}
