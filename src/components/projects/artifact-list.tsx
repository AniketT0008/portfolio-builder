"use client";

import * as React from "react";
import { ExternalLink, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { ARTIFACT_META, STORAGE_BUCKET } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { Artifact } from "@/lib/types/database";
import { formatBytes } from "@/lib/utils";

export function ArtifactList({
  artifacts,
  onRemoved,
}: {
  artifacts: Artifact[];
  onRemoved: (id: string) => void;
}) {
  const supabase = React.useMemo(() => createClient(), []);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  async function remove(artifact: Artifact) {
    setDeletingId(artifact.id);
    try {
      if (artifact.file_path) {
        await supabase.storage
          .from(STORAGE_BUCKET)
          .remove([artifact.file_path]);
      }
      const { error } = await supabase
        .from("artifacts")
        .delete()
        .eq("id", artifact.id);
      if (error) throw error;
      onRemoved(artifact.id);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not remove artifact.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (artifacts.length === 0) {
    return (
      <p className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
        No artifacts yet. Add a repo or upload files above.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {artifacts.map((artifact) => {
        const meta = ARTIFACT_META[artifact.type];
        return (
          <li
            key={artifact.id}
            className="flex items-center gap-3 rounded-lg border bg-card p-3"
          >
            <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <Icon name={meta.icon} className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {artifact.original_filename ?? meta.label}
              </p>
              <p className="text-xs text-muted-foreground">
                {meta.label}
                {artifact.file_size_bytes
                  ? ` · ${formatBytes(artifact.file_size_bytes)}`
                  : ""}
              </p>
            </div>
            {artifact.github_url && (
              <Button variant="ghost" size="icon" asChild>
                <a
                  href={artifact.github_url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open repository"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => remove(artifact)}
              disabled={deletingId === artifact.id}
              aria-label="Remove artifact"
            >
              {deletingId === artifact.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 text-destructive" />
              )}
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
