"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  FileStack,
  Loader2,
  MoreVertical,
  Sparkles,
  Trash2,
  TriangleAlert,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";

import { Icon } from "@/components/icon";
import { ArtifactList } from "@/components/projects/artifact-list";
import { ArtifactUploader } from "@/components/projects/artifact-uploader";
import { ExtractedDataView } from "@/components/projects/extracted-data-view";
import { StatusBadge } from "@/components/projects/status-badge";
import { GenerateDialog } from "@/components/generate/generate-dialog";
import { GenerationItem } from "@/components/generate/generation-item";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CATEGORY_LABELS,
  GENERATION_CATALOG,
  type GenerationCategory,
  type GenerationMeta,
} from "@/lib/constants";
import {
  extractedDataSchema,
  type ExtractedData,
} from "@/lib/ai/types";
import { createClient } from "@/lib/supabase/client";
import type {
  Artifact,
  Generation,
  Project,
  ProjectStatus,
} from "@/lib/types/database";

function parseExtracted(project: Project): ExtractedData | null {
  if (!project.extracted_data) return null;
  const result = extractedDataSchema.safeParse(project.extracted_data);
  return result.success ? result.data : null;
}

export function ProjectWorkspace({
  project,
  initialArtifacts,
  initialGenerations,
  userId,
}: {
  project: Project;
  initialArtifacts: Artifact[];
  initialGenerations: Generation[];
  userId: string;
}) {
  const router = useRouter();
  const supabase = React.useMemo(() => createClient(), []);

  const [artifacts, setArtifacts] =
    React.useState<Artifact[]>(initialArtifacts);
  const [generations, setGenerations] =
    React.useState<Generation[]>(initialGenerations);
  const [status, setStatus] = React.useState<ProjectStatus>(project.status);
  const [extracted, setExtracted] = React.useState<ExtractedData | null>(
    parseExtracted(project),
  );
  const [analyzing, setAnalyzing] = React.useState(false);
  const [selected, setSelected] = React.useState<GenerationMeta | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [latestId, setLatestId] = React.useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [deletingProject, setDeletingProject] = React.useState(false);

  const ready = status === "ready" && extracted !== null;

  async function analyze() {
    if (artifacts.length === 0) {
      toast.error("Add at least one artifact first.");
      return;
    }
    setAnalyzing(true);
    setStatus("analyzing");
    try {
      const res = await fetch(`/api/projects/${project.id}/analyze`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Analysis failed.");
      setExtracted(extractedDataSchema.parse(json.extracted_data));
      setStatus("ready");
      toast.success("Analysis complete — you're ready to generate.");
    } catch (err) {
      setStatus("error");
      toast.error(err instanceof Error ? err.message : "Analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  }

  function openGenerate(meta: GenerationMeta) {
    if (!ready) {
      toast.error("Analyze the project before generating.");
      return;
    }
    setSelected(meta);
    setDialogOpen(true);
  }

  function onGenerated(generation: Generation) {
    setGenerations((prev) => [generation, ...prev]);
    setLatestId(generation.id);
  }

  async function deleteProject() {
    setDeletingProject(true);
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", project.id);
    if (error) {
      setDeletingProject(false);
      toast.error("Could not delete project.");
      return;
    }
    toast.success("Project deleted");
    router.push("/projects");
    router.refresh();
  }

  const grouped = GENERATION_CATALOG.reduce(
    (acc, g) => {
      (acc[g.category] ??= []).push(g);
      return acc;
    },
    {} as Record<GenerationCategory, GenerationMeta[]>,
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {project.name}
            </h1>
            <StatusBadge status={status} />
          </div>
          {project.description && (
            <p className="max-w-2xl text-muted-foreground">
              {project.description}
            </p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 />
              Delete project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left column: artifacts + analysis */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileStack className="h-4 w-4 text-primary" />
                Artifacts
              </CardTitle>
              <CardDescription>
                Repos, files and docs that describe your project.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ArtifactUploader
                projectId={project.id}
                userId={userId}
                onAdded={(a) => setArtifacts((prev) => [...prev, a])}
              />
              <ArtifactList
                artifacts={artifacts}
                onRemoved={(id) =>
                  setArtifacts((prev) => prev.filter((a) => a.id !== id))
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Wand2 className="h-4 w-4 text-primary" />
                AI analysis
              </CardTitle>
              <CardDescription>
                Extract the substance of your project once, reuse it everywhere.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={analyze}
                disabled={analyzing || artifacts.length === 0}
                variant={ready ? "outline" : "gradient"}
                className="w-full"
              >
                {analyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
                {analyzing
                  ? "Analyzing your project…"
                  : ready
                    ? "Re-analyze"
                    : "Analyze project"}
              </Button>

              {status === "error" && !analyzing && (
                <p className="flex items-center gap-2 text-sm text-destructive">
                  <TriangleAlert className="h-4 w-4" />
                  Analysis failed. Check your artifacts and try again.
                </p>
              )}

              {extracted ? (
                <ExtractedDataView data={extracted} />
              ) : (
                !analyzing && (
                  <p className="text-sm text-muted-foreground">
                    Run analysis to unlock generation.
                  </p>
                )
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: generate + outputs */}
        <div className="space-y-6 lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" />
                Generate
              </CardTitle>
              <CardDescription>
                {ready
                  ? "Pick an output. Tune tone, length and audience before generating."
                  : "Analyze your project to unlock these outputs."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {(Object.keys(grouped) as GenerationCategory[]).map(
                (category) => (
                  <div key={category}>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {CATEGORY_LABELS[category]}
                    </h4>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {grouped[category].map((meta) => (
                        <button
                          key={meta.type}
                          onClick={() => openGenerate(meta)}
                          disabled={!ready}
                          className="group flex items-center gap-3 rounded-lg border bg-card p-3 text-left transition-all hover:border-primary/40 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span
                            className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gradient-to-br ${meta.accent} text-white`}
                          >
                            <Icon name={meta.icon} className="h-4 w-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium">
                              {meta.short}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {meta.description}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ),
              )}
            </CardContent>
          </Card>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold">
                Outputs{" "}
                {generations.length > 0 && (
                  <span className="text-muted-foreground">
                    ({generations.length})
                  </span>
                )}
              </h3>
            </div>
            {generations.length === 0 ? (
              <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
                Your generated outputs will appear here.
              </p>
            ) : (
              <div className="space-y-3">
                {generations.map((g) => (
                  <GenerationItem
                    key={g.id}
                    generation={g}
                    defaultOpen={g.id === latestId}
                    onDeleted={(id) =>
                      setGenerations((prev) =>
                        prev.filter((x) => x.id !== id),
                      )
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <GenerateDialog
        projectId={project.id}
        meta={selected}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onGenerated={onGenerated}
      />

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this project?</DialogTitle>
            <DialogDescription>
              This permanently removes the project, its artifacts and all
              generated outputs. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setConfirmDelete(false)}
              disabled={deletingProject}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteProject}
              disabled={deletingProject}
            >
              {deletingProject ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
