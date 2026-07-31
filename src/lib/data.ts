import type { Project } from "@/lib/types/database";
import type { TypedSupabaseClient } from "@/lib/supabase/types";

export interface ProjectWithCounts extends Project {
  artifactCount: number;
  generationCount: number;
}

/** Fetch a user's projects and attach artifact/generation counts. */
export async function getProjectsWithCounts(
  supabase: TypedSupabaseClient,
): Promise<ProjectWithCounts[]> {
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });

  const list = (projects ?? []) as Project[];
  if (list.length === 0) return [];

  const ids = list.map((p) => p.id);

  const [{ data: artifacts }, { data: generations }] = await Promise.all([
    supabase.from("artifacts").select("project_id").in("project_id", ids),
    supabase.from("generations").select("project_id").in("project_id", ids),
  ]);

  const countBy = (rows: { project_id: string }[] | null) => {
    const map = new Map<string, number>();
    for (const row of rows ?? []) {
      map.set(row.project_id, (map.get(row.project_id) ?? 0) + 1);
    }
    return map;
  };

  const artifactCounts = countBy(artifacts as { project_id: string }[] | null);
  const generationCounts = countBy(
    generations as { project_id: string }[] | null,
  );

  return list.map((p) => ({
    ...p,
    artifactCount: artifactCounts.get(p.id) ?? 0,
    generationCount: generationCounts.get(p.id) ?? 0,
  }));
}
