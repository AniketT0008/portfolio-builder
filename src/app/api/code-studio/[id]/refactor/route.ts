import { NextResponse } from "next/server";

import { refactorCodeProject, type CodeFile } from "@/lib/ai/code-studio";
import { isAIConfigured } from "@/lib/ai/client";
import { createClient } from "@/lib/supabase/server";
import { isServerSupabaseConfigured } from "@/lib/supabase/env.server";
import type { CodeStudioSession, Json } from "@/lib/types/database";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
) {
  if (!isServerSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured." }, { status: 503 });
  }

  if (!isAIConfigured()) {
    return NextResponse.json({ error: "AI not configured." }, { status: 503 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionId = params.id;

  const { data: session, error: fetchError } = await supabase
    .from("code_studio_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single<CodeStudioSession>();

  if (fetchError || !session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  const sourceFiles = (session.source_files ?? []) as CodeFile[];
  if (sourceFiles.length === 0) {
    return NextResponse.json({ error: "No source files in session." }, { status: 400 });
  }

  await supabase
    .from("code_studio_sessions")
    .update({ status: "analyzing" })
    .eq("id", sessionId);

  try {
    const result = await refactorCodeProject(sourceFiles, session.name);

    const { data: updated, error: updateError } = await supabase
      .from("code_studio_sessions")
      .update({
        name: result.projectName,
        status: "refactored",
        refactored_files: result.files as unknown as Json,
        readme_content: result.readme,
        linkedin_post: result.linkedinPost,
        metadata: {
          summary: result.summary,
          structureNotes: result.structureNotes,
        } as unknown as Json,
      })
      .eq("id", sessionId)
      .select("*")
      .single<CodeStudioSession>();

    if (updateError) throw updateError;

    return NextResponse.json({ session: updated, result });
  } catch (err) {
    await supabase
      .from("code_studio_sessions")
      .update({ status: "error" })
      .eq("id", sessionId);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Refactor failed." },
      { status: 500 },
    );
  }
}
