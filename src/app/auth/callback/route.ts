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

function redirectBase(request: NextRequest, origin: string): string {
  const siteUrl = getServerSiteUrl();
  const isLocal = process.env.NODE_ENV === "development";
  if (isLocal) return origin;
  if (siteUrl) return siteUrl;
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) return `https://${forwardedHost}`;
  return origin;
}

function applyCookies(res: NextResponse, cookiesToSet: CookieToSet[]) {
  cookiesToSet.forEach(({ name, value, options }) =>
    res.cookies.set(name, value, options),
  );
}

/**
 * OAuth + email-confirmation callback. Exchanges the `code` for a session,
 * then redirects to `next` (defaults to the dashboard).
 *
 * Cookie writes must land on the redirect response — relying on cookies()
 * alone can drop the session (and fail PKCE) on Next.js route handlers.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeRedirectPath(searchParams.get("next"));
  const base = redirectBase(request, origin);

  const oauthError =
    searchParams.get("error_description") || searchParams.get("error");
  if (oauthError) {
    return NextResponse.redirect(
      `${base}/login?error=${encodeURIComponent(oauthError)}`,
    );
  }

  if (!isServerSupabaseConfigured()) {
    return NextResponse.redirect(
      `${base}/login?error=${encodeURIComponent(
        "Supabase is not configured on the server.",
      )}`,
    );
  }

  if (code) {
    const pendingCookies: CookieToSet[] = [];
    const supabase = createServerClient<Database>(
      getServerSupabaseUrl()!,
      getServerSupabaseAnonKey()!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: CookieToSet[]) {
            pendingCookies.push(...cookiesToSet);
          },
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const ghUser =
          user.user_metadata?.user_name ??
          user.user_metadata?.preferred_username;
        if (typeof ghUser === "string" && ghUser.trim()) {
          await supabase
            .from("profiles")
            .update({ github_username: ghUser.trim() })
            .eq("id", user.id);
        }
      }

      const res = NextResponse.redirect(`${base}${next}`);
      applyCookies(res, pendingCookies);
      return res;
    }

    const res = NextResponse.redirect(
      `${base}/login?error=${encodeURIComponent(
        error.message || "Could not exchange auth code for a session.",
      )}`,
    );
    applyCookies(res, pendingCookies);
    return res;
  }

  return NextResponse.redirect(
    `${base}/login?error=${encodeURIComponent(
      "Could not sign you in. Missing auth code — try again.",
    )}`,
  );
}
