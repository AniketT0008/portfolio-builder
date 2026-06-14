import { NextResponse } from "next/server";

import {
  createRepository,
  getAuthenticatedUser,
  pushFilesToRepo,
  type GitHubFileInput,
} from "@/lib/github/client";
import { createClient } from "@/lib/supabase/server";
import { getGitHubAccessToken } from "@/lib/supabase/github-token";
import { isServerSupabaseConfigured } from "@/lib/supabase/env.server";
import { codeStudioPublishSchema } from "@/lib/validation";
import type { CodeFile } from "@/lib/ai/code-studio";
import type { CodeStudioSession, Json, Project } from "@/lib/types/database";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
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

  const token = await getGitHubAccessToken(supabase);
  if (!token) {
    return NextResponse.json(
      {
        error:
          "GitHub not connected. Sign in with GitHub or add GITHUB_TOKEN on the server. Enable 'Save provider tokens' in Supabase Auth settings.",
      },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = codeStudioPublishSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { repo_name, private: isPrivate, create_project } = parsed.data;
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

  if (session.status !== "refactored" && session.status !== "published") {
    return NextResponse.json(
      { error: "Run refactor first before publishing." },
      { status: 400 },
    );
  }

  const files = (session.refactored_files ?? []) as CodeFile[];
  if (files.length === 0) {
    return NextResponse.json({ error: "No refactored files to publish." }, { status: 400 });
  }

  const ghUser = await getAuthenticatedUser(token);
  if (!ghUser) {
    return NextResponse.json(
      { error: "GitHub token is invalid or expired. Reconnect GitHub." },
      { status: 403 },
    );
  }

  try {
    const repo = await createRepository(
      token,
      repo_name,
      session.metadata &&
        typeof session.metadata === "object" &&
        "summary" in (session.metadata as object)
        ? String((session.metadata as { summary?: string }).summary ?? "")
        : session.name,
      isPrivate,
    );

    const githubFiles: GitHubFileInput[] = files.map((f) => ({
      path: f.path,
      content: f.content,
    }));

    const pushResult = await pushFilesToRepo(
      token,
      ghUser.login,
      repo_name,
      githubFiles,
    );

    let projectId: string | null = session.project_id;

    if (create_project && !projectId) {
      const { data: project } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          name: session.name,
          description:
            session.metadata &&
            typeof session.metadata === "object" &&
            "summary" in (session.metadata as object)
              ? String((session.metadata as { summary?: string }).summary ?? "")
              : null,
          source: "github_import",
          source_url: repo.html_url,
        })
        .select("*")
        .single<Project>();

      if (project) {
        projectId = project.id;
        await supabase.from("artifacts").insert({
          project_id: project.id,
          user_id: user.id,
          type: "github_repo",
          github_url: repo.html_url,
          original_filename: repo.full_name,
        });
      }
    }

    const { data: updated } = await supabase
      .from("code_studio_sessions")
      .update({
        status: "published",
        github_repo_url: repo.html_url,
        project_id: projectId,
        github_push_result: pushResult as unknown as Json,
      })
      .eq("id", sessionId)
      .select("*")
      .single<CodeStudioSession>();

    return NextResponse.json({
      session: updated,
      repo_url: repo.html_url,
      push: pushResult,
      project_id: projectId,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Publish failed." },
      { status: 500 },
    );
  }
}
