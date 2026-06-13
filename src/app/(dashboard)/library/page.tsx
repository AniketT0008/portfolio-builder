import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, Star } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import {
  GenerationCollection,
  type CollectionEntry,
} from "@/components/generate/generation-collection";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/supabase/auth";
import type { Generation, Project } from "@/lib/types/database";

export const metadata: Metadata = { title: "Library" };

export default async function LibraryPage() {
  const { supabase } = await requireUser();

  const { data: favorites } = await supabase
    .from("generations")
    .select("*")
    .eq("is_favorite", true)
    .order("created_at", { ascending: false });

  const list = (favorites ?? []) as Generation[];

  // Map project names for context.
  const projectIds = Array.from(new Set(list.map((g) => g.project_id)));
  const nameById = new Map<string, string>();
  if (projectIds.length > 0) {
    const { data: projects } = await supabase
      .from("projects")
      .select("id, name")
      .in("id", projectIds);
    for (const p of (projects ?? []) as Pick<Project, "id" | "name">[]) {
      nameById.set(p.id, p.name);
    }
  }

  const entries: CollectionEntry[] = list.map((g) => ({
    generation: g,
    projectId: g.project_id,
    projectName: nameById.get(g.project_id),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
          Library
        </h1>
        <p className="text-muted-foreground">
          Every output you&apos;ve favorited, across all your projects.
        </p>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No favorites yet"
          description="Star a generated output to pin it here for quick access."
          action={
            <Button asChild variant="gradient">
              <Link href="/projects">Go to projects</Link>
            </Button>
          }
        />
      ) : (
        <GenerationCollection entries={entries} />
      )}
    </div>
  );
}
