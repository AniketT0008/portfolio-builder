import { NextResponse } from "next/server";

import { isOpenAIConfigured } from "@/lib/openai/client";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    status: "ok",
    openai: isOpenAIConfigured(),
    supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    time: new Date().toISOString(),
  });
}
