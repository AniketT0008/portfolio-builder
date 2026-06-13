import { NextResponse, type NextRequest } from "next/server";

import { createServerClient, type CookieOptions } from "@supabase/ssr";

import type { Database } from "@/lib/types/database";
import {
  getServerSupabaseAnonKey,
  getServerSupabaseUrl,
  isServerSupabaseConfigured,
} from "@/lib/supabase/env.server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

const PUBLIC_ROUTES = ["/", "/login", "/signup", "/auth", "/api/health"];
const AUTH_ROUTES = ["/login", "/signup"];

/** Never call Supabase auth in middleware for these — keeps the landing page up. */
const MIDDLEWARE_PASSTHROUGH = ["/", "/api/health"];

function isPublic(pathname: string) {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function isPassthrough(pathname: string) {
  return MIDDLEWARE_PASSTHROUGH.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function loginRedirect(request: NextRequest, redirectedFrom?: string) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  if (redirectedFrom) {
    url.searchParams.set("redirectedFrom", redirectedFrom);
  }
  return NextResponse.redirect(url);
}

/**
 * Refreshes the Supabase auth session on protected routes and enforces route
 * protection. Public pages like `/` skip Supabase entirely so a bad/missing
 * env var cannot 500 the whole site on Vercel Edge.
 */
export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  try {
    let response = NextResponse.next({ request });

    // Landing + health check must always load, even if Supabase auth fails.
    if (isPassthrough(pathname)) {
      return response;
    }

    if (!isServerSupabaseConfigured()) {
      if (!isPublic(pathname)) {
        return loginRedirect(request);
      }
      return response;
    }

    const supabaseUrl = getServerSupabaseUrl();
    const supabaseAnonKey = getServerSupabaseAnonKey();
    if (!supabaseUrl || !supabaseAnonKey) {
      if (!isPublic(pathname)) {
        return loginRedirect(request);
      }
      return response;
    }

    const supabase = createServerClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(
            cookiesToSet: CookieToSet[],
            headers?: Record<string, string>,
          ) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            );
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
            if (headers) {
              Object.entries(headers).forEach(([key, value]) =>
                response.headers.set(key, value),
              );
            }
          },
        },
      },
    );

    let user = null;
    try {
      const { data } = await supabase.auth.getUser();
      user = data.user;
    } catch {
      if (!isPublic(pathname)) {
        return loginRedirect(request);
      }
      return response;
    }

    if (!user && !isPublic(pathname)) {
      return loginRedirect(request, pathname);
    }

    if (user && AUTH_ROUTES.includes(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }

    return response;
  } catch {
    if (isPublic(pathname)) {
      return NextResponse.next({ request });
    }
    return loginRedirect(request);
  }
}
