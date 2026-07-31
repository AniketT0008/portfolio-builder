import { NextResponse } from "next/server";

import { isServerAIConfigured, isServerSupabaseConfigured, getServerEnvDiagnostics } from "@/lib/supabase/env.server";

export const dynamic = "force-dynamic";

export function GET() {
  const checks = getServerEnvDiagnostics();
  return NextResponse.json({
    status: "ok",
    ai: isServerAIConfigured(),
    supabase: isServerSupabaseConfigured(),
    checks,
    time: new Date().toISOString(),
  });
}
