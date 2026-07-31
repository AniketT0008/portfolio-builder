import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ProjectWorkspace } from "@/components/projects/project-workspace";
import { requireUser } from "@/lib/supabase/auth";
import type { Artifact, Generation, Project } from "@/lib/types/database";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const { supabase } = await requireUser();
  const { data } = await supabase
    .from("projects")
    .select("name")
    .eq("id", params.id)
    .single();
  return { title: data?.name ?? "Project" };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { user, supabase } = await requireUser();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", params.id)
    .single<Project>();

  if (!project) notFound();

  const [{ data: artifacts }, { data: generations }] = await Promise.all([
    supabase
      .from("artifacts")
      .select("*")
      .eq("project_id", project.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("generations")
      .select("*")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Projects
      </Link>

      <ProjectWorkspace
        project={project}
        initialArtifacts={(artifacts ?? []) as Artifact[]}
        initialGenerations={(generations ?? []) as Generation[]}
        userId={user.id}
      />
    </div>
  );
}
