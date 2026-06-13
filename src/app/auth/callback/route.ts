import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getServerSiteUrl } from "@/lib/supabase/env.server";

function safeRedirectPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }
  return next;
}

/**
 * OAuth + email-confirmation callback. Exchanges the `code` for a session,
 * then redirects to `next` (defaults to the dashboard).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeRedirectPath(searchParams.get("next"));
  const siteUrl = getServerSiteUrl();

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocal = process.env.NODE_ENV === "development";
      if (isLocal) {
        return NextResponse.redirect(`${origin}${next}`);
      }
      if (siteUrl) {
        return NextResponse.redirect(`${siteUrl}${next}`);
      }
      if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  const errorBase = siteUrl || origin;
  return NextResponse.redirect(
    `${errorBase}/login?error=${encodeURIComponent("Could not sign you in. Please try again.")}`,
  );
}
