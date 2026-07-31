import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  FolderKanban,
  Plus,
  Sparkles,
  Star,
  Wand2,
} from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { ProjectCard } from "@/components/projects/project-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/supabase/auth";
import { getProjectsWithCounts } from "@/lib/data";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { profile, user, supabase } = await requireUser();

  const projects = await getProjectsWithCounts(supabase);
  const [{ count: generationCount }, { count: favoriteCount }] =
    await Promise.all([
      supabase
        .from("generations")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("generations")
        .select("*", { count: "exact", head: true })
        .eq("is_favorite", true),
    ]);

  const readyCount = projects.filter((p) => p.status === "ready").length;
  const firstName = (profile?.full_name ?? user.email ?? "there").split(
    " ",
  )[0];

  const stats = [
    { label: "Projects", value: projects.length, icon: FolderKanban },
    { label: "Analyzed", value: readyCount, icon: Wand2 },
    { label: "Generations", value: generationCount ?? 0, icon: Sparkles },
    { label: "Favorites", value: favoriteCount ?? 0, icon: Star },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="text-muted-foreground">
            Turn your latest build into something worth showing off.
          </p>
        </div>
        <Button asChild variant="gradient">
          <Link href="/projects/new">
            <Plus className="h-4 w-4" />
            New project
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold tabular-nums">
                  {s.value}
                </div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent projects</h2>
        {projects.length > 0 && (
          <Button asChild variant="ghost" size="sm">
            <Link href="/projects">
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Let's forge your first project"
          description="Link a GitHub repo or upload your files. ProjectForge will analyze it and generate résumé bullets, READMEs, decks and more."
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
          {projects.slice(0, 6).map((project) => (
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
