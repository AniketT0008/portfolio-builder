import { NextResponse } from "next/server";

import { analyzeProjectContext } from "@/lib/ai/engine";
import { buildProjectContext } from "@/lib/ai/extract";
import { isAIConfigured } from "@/lib/ai/client";
import { createClient } from "@/lib/supabase/server";
import { isServerSupabaseConfigured } from "@/lib/supabase/env.server";
import type { Artifact, Json, Project } from "@/lib/types/database";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
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
      { error: "AI is not configured. Set GEMINI_API_KEY on the server." },
      { status: 503 },
    );
  }

  const projectId = params.id;

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single<Project>();

  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { data: artifacts } = await supabase
    .from("artifacts")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  const list = (artifacts ?? []) as Artifact[];
  if (list.length === 0) {
    return NextResponse.json(
      { error: "Add at least one artifact before analyzing." },
      { status: 400 },
    );
  }

  await supabase
    .from("projects")
    .update({ status: "analyzing" })
    .eq("id", projectId);

  try {
    const context = await buildProjectContext(project, list, supabase);
    const extracted = await analyzeProjectContext(context);

    const { error: updateError } = await supabase
      .from("projects")
      .update({
        extracted_data: extracted as unknown as Json,
        status: "ready",
      })
      .eq("id", projectId);

    if (updateError) throw updateError;

    return NextResponse.json({ status: "ready", extracted_data: extracted });
  } catch (err) {
    await supabase
      .from("projects")
      .update({ status: "error" })
      .eq("id", projectId);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Analysis failed unexpectedly.",
      },
      { status: 500 },
    );
  }
}
