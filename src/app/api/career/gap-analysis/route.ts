import { NextResponse } from "next/server";

import { analyzeResumeGap } from "@/lib/ai/career-tools";
import { isAIConfigured } from "@/lib/ai/client";
import { createClient } from "@/lib/supabase/server";
import { isServerSupabaseConfigured } from "@/lib/supabase/env.server";
import { gapAnalysisRequestSchema } from "@/lib/validation";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isServerSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured." }, { status: 503 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAIConfigured()) {
    return NextResponse.json({ error: "AI not configured." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = gapAnalysisRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const result = await analyzeResumeGap(
      parsed.data.resume_text,
      parsed.data.job_posting_text,
    );
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Analysis failed." },
      { status: 500 },
    );
  }
}
