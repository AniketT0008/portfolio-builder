import type { Metadata } from "next";
import Link from "next/link";
import { FolderKanban, Plus } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { ProjectCard } from "@/components/projects/project-card";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/supabase/auth";
import { getProjectsWithCounts } from "@/lib/data";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const { supabase } = await requireUser();
  const projects = await getProjectsWithCounts(supabase);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Every project you&apos;ve brought into ProjectForge.
          </p>
        </div>
        <Button asChild variant="gradient">
          <Link href="/projects/new">
            <Plus className="h-4 w-4" />
            New project
          </Link>
        </Button>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create your first project, link a GitHub repo or upload files, and let ProjectForge do the writing."
          action={
            <Button asChild variant="gradient">
              <Link href="/projects/new">
                <Plus className="h-4 w-4" />
                Create your first project
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              artifactCount={project.artifactCount}
              generationCount={project.generationCount}
            />
          ))}
        </div>
      )}
    </div>
  );
}
