import { NextResponse } from "next/server";

import { runGeneration } from "@/lib/ai/engine";
import { extractedDataSchema } from "@/lib/ai/types";
import { isAIConfigured } from "@/lib/ai/client";
import { createClient } from "@/lib/supabase/server";
import { isServerSupabaseConfigured } from "@/lib/supabase/env.server";
import type { GenerationSettings } from "@/lib/constants";
import type { Generation, Json, Project } from "@/lib/types/database";
import { generationRequestSchema } from "@/lib/validation";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  if (!isServerSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured on the server." },
      { status: 503 },
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAIConfigured()) {
    return NextResponse.json(
      { error: "AI is not configured. Set GEMINI_MODEL (your AIza API key) on the server." },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = generationRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 422 },
    );
  }
  const { type, settings } = parsed.data;
  const projectId = params.id;

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single<Project>();

  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const dataResult = extractedDataSchema.safeParse(project.extracted_data);
  if (!project.extracted_data || !dataResult.success) {
    return NextResponse.json(
      { error: "Analyze this project before generating outputs." },
      { status: 409 },
    );
  }

  try {
    const content = await runGeneration(
      type,
      dataResult.data,
      settings as GenerationSettings,
    );

    // Version = next number for this (project, type) pair.
    const { count } = await supabase
      .from("generations")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("type", type);

    const { data: inserted, error: insertError } = await supabase
      .from("generations")
      .insert({
        project_id: projectId,
        user_id: user.id,
        type,
        content: content as unknown as Json,
        settings: settings as unknown as Json,
        version: (count ?? 0) + 1,
      })
      .select("*")
      .single<Generation>();

    if (insertError) throw insertError;

    return NextResponse.json({ generation: inserted });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Generation failed unexpectedly.",
      },
      { status: 500 },
    );
  }
}
