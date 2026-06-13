import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { FileStack, Sparkles } from "lucide-react";

import { StatusBadge } from "@/components/projects/status-badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Project } from "@/lib/types/database";
import { truncate } from "@/lib/utils";

export function ProjectCard({
  project,
  artifactCount = 0,
  generationCount = 0,
}: {
  project: Project;
  artifactCount?: number;
  generationCount?: number;
}) {
  return (
    <Link href={`/projects/${project.id}`} className="group block">
      <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold leading-tight tracking-tight">
              {project.name}
            </h3>
            <StatusBadge status={project.status} />
          </div>
        </CardHeader>
        <CardContent>
          <p className="min-h-[2.5rem] text-sm text-muted-foreground">
            {project.description
              ? truncate(project.description, 120)
              : "No description yet."}
          </p>
          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <FileStack className="h-3.5 w-3.5" />
              {artifactCount} artifact{artifactCount === 1 ? "" : "s"}
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              {generationCount} generated
            </span>
            <span className="ml-auto">
              {formatDistanceToNow(new Date(project.updated_at), {
                addSuffix: true,
              })}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
