import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import type { Database } from "@/lib/types/database";
import {
  getServerSiteUrl,
  getServerSupabaseAnonKey,
  getServerSupabaseUrl,
  isServerSupabaseConfigured,
} from "@/lib/supabase/env.server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

function safeRedirectPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }
  return next;
}

/**
 * Starts GitHub OAuth on the server so the PKCE code verifier is written via
 * Set-Cookie on the redirect response. Client-side signInWithOAuth often loses
 * that cookie across the GitHub → Supabase → app hop in Next.js SSR.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const next = safeRedirectPath(searchParams.get("next"));
  const scopes = searchParams.get("scopes") || "read:user user:email";
  const siteUrl = getServerSiteUrl() || origin;

  if (!isServerSupabaseConfigured()) {
    return NextResponse.redirect(
      `${siteUrl}/login?error=${encodeURIComponent(
        "Supabase is not configured on the server.",
      )}`,
    );
  }

  const supabaseUrl = getServerSupabaseUrl()!;
  const supabaseAnonKey = getServerSupabaseAnonKey()!;
  const pendingCookies: CookieToSet[] = [];

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        pendingCookies.push(...cookiesToSet);
      },
    },
  });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
      scopes,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) {
    const message =
      error?.message ||
      "Could not start GitHub sign-in. Enable the GitHub provider in Supabase Auth.";
    const res = NextResponse.redirect(
      `${siteUrl}/login?error=${encodeURIComponent(message)}`,
    );
    pendingCookies.forEach(({ name, value, options }) =>
      res.cookies.set(name, value, options),
    );
    return res;
  }

  const res = NextResponse.redirect(data.url);
  pendingCookies.forEach(({ name, value, options }) =>
    res.cookies.set(name, value, options),
  );
  return res;
}
