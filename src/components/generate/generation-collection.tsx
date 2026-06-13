"use client";

import * as React from "react";

import { GenerationItem } from "@/components/generate/generation-item";
import type { Generation } from "@/lib/types/database";

export interface CollectionEntry {
  generation: Generation;
  projectName?: string;
  projectId?: string;
}

export function GenerationCollection({
  entries,
}: {
  entries: CollectionEntry[];
}) {
  const [items, setItems] = React.useState(entries);

  function handleDeleted(id: string) {
    setItems((prev) => prev.filter((e) => e.generation.id !== id));
  }

  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
        Nothing here yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((entry) => (
        <GenerationItem
          key={entry.generation.id}
          generation={entry.generation}
          projectName={entry.projectName}
          projectId={entry.projectId}
          onDeleted={handleDeleted}
        />
      ))}
    </div>
  );
}
