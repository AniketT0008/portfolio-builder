import { NextResponse } from "next/server";

import { buildMultiProjectResume } from "@/lib/ai/career-tools";
import { isAIConfigured } from "@/lib/ai/client";
import { extractedDataSchema } from "@/lib/ai/types";
import { createClient } from "@/lib/supabase/server";
import { isServerSupabaseConfigured } from "@/lib/supabase/env.server";
import type { Project } from "@/lib/types/database";
import { multiResumeRequestSchema } from "@/lib/validation";

export const maxDuration = 90;
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

  const parsed = multiResumeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .in("id", parsed.data.project_ids);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const list = (projects ?? []) as Project[];
  const ready = list
    .map((p) => {
      const ext = extractedDataSchema.safeParse(p.extracted_data);
      if (!ext.success || p.status !== "ready") return null;
      return { id: p.id, name: p.name, extracted: ext.data };
    })
    .filter(Boolean) as Array<{
    id: string;
    name: string;
    extracted: ReturnType<typeof extractedDataSchema.parse>;
  }>;

  if (ready.length === 0) {
    return NextResponse.json(
      {
        error:
          "Selected projects must be analyzed first (status: ready). Open each project and run Analyze.",
      },
      { status: 400 },
    );
  }

  try {
    const result = await buildMultiProjectResume(ready);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Resume build failed." },
      { status: 500 },
    );
  }
}
