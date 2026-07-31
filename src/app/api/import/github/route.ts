import { NextResponse } from "next/server";

import { createProjectFromGitHubRepo } from "@/lib/import/projects";
import { createClient } from "@/lib/supabase/server";
import { isServerSupabaseConfigured } from "@/lib/supabase/env.server";
import { isAIConfigured } from "@/lib/ai/client";
import { githubImportSchema } from "@/lib/validation";

export const maxDuration = 120;
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = githubImportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { repos, autoAnalyze } = parsed.data;
  if (autoAnalyze && !isAIConfigured()) {
    return NextResponse.json(
      { error: "AI is not configured for auto-analyze." },
      { status: 503 },
    );
  }

  const results: Array<{ full_name: string; project_id: string; analyzed: boolean }> = [];
  const errors: Array<{ full_name: string; error: string }> = [];

  for (const repo of repos) {
    try {
      const { project, analyzed } = await createProjectFromGitHubRepo(
        supabase,
        user.id,
        repo,
        autoAnalyze,
      );
      results.push({
        full_name: repo.full_name,
        project_id: project.id,
        analyzed,
      });
    } catch (err) {
      errors.push({
        full_name: repo.full_name,
        error: err instanceof Error ? err.message : "Import failed",
      });
    }
  }

  return NextResponse.json({
    imported: results.length,
    results,
    errors,
  });
}
