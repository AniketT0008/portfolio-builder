"use client";

import * as React from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  ChevronDown,
  FolderKanban,
  Loader2,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { CopyButton } from "@/components/copy-button";
import { Icon } from "@/components/icon";
import {
  GenerationViewer,
  generationToText,
} from "@/components/generate/generation-viewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { GENERATION_MAP } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { Generation } from "@/lib/types/database";
import { cn } from "@/lib/utils";

export function GenerationItem({
  generation,
  defaultOpen = false,
  onDeleted,
  projectName,
  projectId,
}: {
  generation: Generation;
  defaultOpen?: boolean;
  onDeleted: (id: string) => void;
  projectName?: string;
  projectId?: string;
}) {
  const supabase = React.useMemo(() => createClient(), []);
  const meta = GENERATION_MAP[generation.type];
  const [open, setOpen] = React.useState(defaultOpen);
  const [favorite, setFavorite] = React.useState(generation.is_favorite);
  const [deleting, setDeleting] = React.useState(false);

  async function toggleFavorite() {
    const next = !favorite;
    setFavorite(next);
    const { error } = await supabase
      .from("generations")
      .update({ is_favorite: next })
      .eq("id", generation.id);
    if (error) {
      setFavorite(!next);
      toast.error("Could not update favorite.");
    }
  }

  async function remove() {
    setDeleting(true);
    const { error } = await supabase
      .from("generations")
      .delete()
      .eq("id", generation.id);
    if (error) {
      setDeleting(false);
      toast.error("Could not delete generation.");
      return;
    }
    toast.success("Deleted");
    onDeleted(generation.id);
  }

  return (
    <Card>
      <CardHeader className="p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex flex-1 items-center gap-3 text-left"
            aria-expanded={open}
          >
            <div
              className={cn(
                "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white",
                meta.accent,
              )}
            >
              <Icon name={meta.icon} className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium leading-tight">
                {meta.short}
              </p>
              <p className="text-xs text-muted-foreground">
                v{generation.version} ·{" "}
                {formatDistanceToNow(new Date(generation.created_at), {
                  addSuffix: true,
                })}
              </p>
            </div>
            <ChevronDown
              className={cn(
                "ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                open && "rotate-180",
              )}
            />
          </button>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFavorite}
              aria-label="Toggle favorite"
            >
              <Star
                className={cn(
                  "h-4 w-4",
                  favorite && "fill-amber-400 text-amber-400",
                )}
              />
            </Button>
            <CopyButton
              value={generationToText(generation.type, generation.content)}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={remove}
              disabled={deleting}
              aria-label="Delete generation"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 text-destructive" />
              )}
            </Button>
          </div>
        </div>

        {projectName && projectId && (
          <Link
            href={`/projects/${projectId}`}
            className="mt-2 inline-flex w-fit items-center gap-1 text-xs text-primary hover:underline"
          >
            <FolderKanban className="h-3 w-3" />
            {projectName}
          </Link>
        )}

        {generation.settings &&
          typeof generation.settings === "object" &&
          !Array.isArray(generation.settings) && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {Object.entries(
                generation.settings as Record<string, unknown>,
              )
                .filter(([, v]) => typeof v === "string" && v)
                .map(([k, v]) => (
                  <Badge key={k} variant="outline" className="text-[10px]">
                    {String(v)}
                  </Badge>
                ))}
            </div>
          )}
      </CardHeader>

      {open && (
        <CardContent className="border-t p-4 pt-4">
          <GenerationViewer
            type={generation.type}
            content={generation.content}
          />
        </CardContent>
      )}
    </Card>
  );
}
