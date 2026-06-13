import { NextResponse } from "next/server";

import { isAIConfigured } from "@/lib/ai/client";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    status: "ok",
    ai: isAIConfigured(),
    supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    time: new Date().toISOString(),
  });
}
