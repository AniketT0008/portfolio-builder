import { analyzeProjectContext } from "@/lib/ai/engine";
import { buildProjectContext } from "@/lib/ai/extract";
import type { TypedSupabaseClient } from "@/lib/supabase/types";
import type { Artifact, Json, Project } from "@/lib/types/database";

export async function createProjectFromGitHubRepo(
  supabase: TypedSupabaseClient,
  userId: string,
  repo: {
    full_name: string;
    html_url: string;
    name: string;
    description?: string | null;
  },
  autoAnalyze: boolean,
): Promise<{ project: Project; analyzed: boolean }> {
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      user_id: userId,
      name: repo.name,
      description: repo.description ?? null,
      source: "github_import",
      source_url: repo.html_url,
    })
    .select("*")
    .single<Project>();

  if (projectError || !project) {
    throw new Error(projectError?.message ?? "Could not create project.");
  }

  const { data: artifact, error: artifactError } = await supabase
    .from("artifacts")
    .insert({
      project_id: project.id,
      user_id: userId,
      type: "github_repo",
      github_url: repo.html_url,
      original_filename: repo.full_name,
    })
    .select("*")
    .single<Artifact>();

  if (artifactError || !artifact) {
    await supabase.from("projects").delete().eq("id", project.id);
    throw new Error(artifactError?.message ?? "Could not link repository.");
  }

  if (!autoAnalyze) {
    return { project, analyzed: false };
  }

  await supabase
    .from("projects")
    .update({ status: "analyzing" })
    .eq("id", project.id);

  try {
    const context = await buildProjectContext(project, [artifact], supabase);
    const extracted = await analyzeProjectContext(context);
    await supabase
      .from("projects")
      .update({
        extracted_data: extracted as unknown as Json,
        status: "ready",
      })
      .eq("id", project.id);
    return { project: { ...project, status: "ready", extracted_data: extracted as Json }, analyzed: true };
  } catch {
    await supabase
      .from("projects")
      .update({ status: "error" })
      .eq("id", project.id);
    return { project: { ...project, status: "error" }, analyzed: false };
  }
}

export async function createProjectFromLinkedInEntry(
  supabase: TypedSupabaseClient,
  userId: string,
  entry: {
    name: string;
    description?: string;
    highlights?: string[];
  },
  linkedinUrl: string,
): Promise<Project> {
  const notes = [
    entry.description ?? "",
    entry.highlights?.length
      ? `Highlights:\n${entry.highlights.map((h) => `- ${h}`).join("\n")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      user_id: userId,
      name: entry.name,
      description: entry.description ?? null,
      source: "linkedin_import",
      source_url: linkedinUrl,
    })
    .select("*")
    .single<Project>();

  if (projectError || !project) {
    throw new Error(projectError?.message ?? "Could not create project.");
  }

  if (notes.trim()) {
    await supabase.from("artifacts").insert({
      project_id: project.id,
      user_id: userId,
      type: "document",
      original_filename: "linkedin-import.txt",
      metadata: { source: "linkedin", pasted: notes },
    });
  }

  return project;
}

export async function createCustomAddonProject(
  supabase: TypedSupabaseClient,
  userId: string,
  data: { name: string; description?: string; notes?: string },
): Promise<Project> {
  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      user_id: userId,
      name: data.name,
      description: data.description ?? null,
      source: "custom",
    })
    .select("*")
    .single<Project>();

  if (error || !project) {
    throw new Error(error?.message ?? "Could not create project.");
  }

  if (data.notes?.trim()) {
    await supabase.from("artifacts").insert({
      project_id: project.id,
      user_id: userId,
      type: "document",
      original_filename: "notes.txt",
      metadata: { notes: data.notes.trim() },
    });
  }

  return project;
}
