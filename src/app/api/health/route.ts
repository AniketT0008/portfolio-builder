import { NextResponse } from "next/server";

import {
  getServerEnvDiagnostics,
  isServerAIConfigured,
  isServerSupabaseConfigured,
  probeSupabaseReachability,
} from "@/lib/supabase/env.server";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks = getServerEnvDiagnostics();
  const reachability = isServerSupabaseConfigured()
    ? await probeSupabaseReachability()
    : { reachable: false, status: null, error: "missing_env" as const };

  const ok =
    isServerSupabaseConfigured() &&
    reachability.reachable &&
    !checks.anonKeyMisconfigured;

  return NextResponse.json({
    status: ok ? "ok" : "degraded",
    ai: isServerAIConfigured(),
    supabase: isServerSupabaseConfigured(),
    supabaseReachable: reachability.reachable,
    checks: {
      ...checks,
      supabaseReachable: reachability.reachable,
      supabaseReachabilityStatus: reachability.status,
      supabaseReachabilityError: reachability.error,
    },
    time: new Date().toISOString(),
  });
}
