import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  getServerSiteUrl,
  isServerSupabaseConfigured,
} from "@/lib/supabase/env.server";

function safeRedirectPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }
  return next;
}

function redirectBase(request: Request, origin: string): string {
  const siteUrl = getServerSiteUrl();
  const isLocal = process.env.NODE_ENV === "development";
  if (isLocal) return origin;
  if (siteUrl) return siteUrl;
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) return `https://${forwardedHost}`;
  return origin;
}

/**
 * OAuth + email-confirmation callback. Exchanges the `code` for a session,
 * then redirects to `next` (defaults to the dashboard).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeRedirectPath(searchParams.get("next"));
  const base = redirectBase(request, origin);

  // Provider / Supabase may bounce back with error_* instead of a code.
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
    const supabase = createClient();
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
          // Best-effort profile sync — ignore if migrations haven't added the column yet.
          await supabase
            .from("profiles")
            .update({ github_username: ghUser.trim() })
            .eq("id", user.id);
        }
      }

      return NextResponse.redirect(`${base}${next}`);
    }

    return NextResponse.redirect(
      `${base}/login?error=${encodeURIComponent(
        error.message || "Could not exchange auth code for a session.",
      )}`,
    );
  }

  return NextResponse.redirect(
    `${base}/login?error=${encodeURIComponent(
      "Could not sign you in. Missing auth code — try again.",
    )}`,
  );
}
