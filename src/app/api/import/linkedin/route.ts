import { NextResponse } from "next/server";

import { parseLinkedInProjects } from "@/lib/ai/code-studio";
import {
  createCustomAddonProject,
  createProjectFromLinkedInEntry,
} from "@/lib/import/projects";
import { isAIConfigured } from "@/lib/ai/client";
import { createClient } from "@/lib/supabase/server";
import { isServerSupabaseConfigured } from "@/lib/supabase/env.server";
import { linkedinImportSchema, customProjectImportSchema } from "@/lib/validation";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/** POST — parse LinkedIn text into project suggestions (no DB writes). */
export async function PUT(request: Request) {
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

  const { linkedin_url, pasted_text } = body as {
    linkedin_url?: string;
    pasted_text?: string;
  };

  if (!linkedin_url || !pasted_text || pasted_text.length < 20) {
    return NextResponse.json(
      { error: "Provide linkedin_url and pasted_text (min 20 chars)." },
      { status: 400 },
    );
  }

  try {
    const projects = await parseLinkedInProjects(linkedin_url, pasted_text);
    return NextResponse.json({ projects });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Parse failed." },
      { status: 500 },
    );
  }
}

/** POST — import selected LinkedIn projects or a custom add-on. */
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
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const mode = (body as { mode?: string }).mode ?? "linkedin";

  if (mode === "custom") {
    const parsed = customProjectImportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    try {
      const project = await createCustomAddonProject(
        supabase,
        user.id,
        parsed.data,
      );
      return NextResponse.json({ project_id: project.id, name: project.name });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Import failed." },
        { status: 500 },
      );
    }
  }

  const parsed = linkedinImportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { linkedin_url, selected } = parsed.data;
  if (!selected?.length) {
    return NextResponse.json(
      { error: "Select at least one project to import." },
      { status: 400 },
    );
  }

  await supabase
    .from("profiles")
    .update({ linkedin_url })
    .eq("id", user.id);

  const results: Array<{ name: string; project_id: string }> = [];
  const errors: Array<{ name: string; error: string }> = [];

  for (const entry of selected) {
    try {
      const project = await createProjectFromLinkedInEntry(
        supabase,
        user.id,
        entry,
        linkedin_url,
      );
      results.push({ name: entry.name, project_id: project.id });
    } catch (err) {
      errors.push({
        name: entry.name,
        error: err instanceof Error ? err.message : "Import failed",
      });
    }
  }

  return NextResponse.json({ imported: results.length, results, errors });
}
