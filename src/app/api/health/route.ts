import { NextResponse } from "next/server";

import { isAIConfigured } from "@/lib/ai/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    status: "ok",
    ai: isAIConfigured(),
    supabase: isSupabaseConfigured(),
    time: new Date().toISOString(),
  });
}
