"use client";

import * as React from "react";
import { Github, Loader2, Plus, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  inferArtifactType,
  MAX_FILE_BYTES,
  STORAGE_BUCKET,
} from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { Artifact } from "@/lib/types/database";
import { formatBytes, parseGitHubUrl } from "@/lib/utils";

function safeName(name: string) {
  return name.replace(/[^\w.\-]+/g, "_").slice(0, 80);
}

export function ArtifactUploader({
  projectId,
  userId,
  onAdded,
}: {
  projectId: string;
  userId: string;
  onAdded: (artifact: Artifact) => void;
}) {
  const supabase = React.useMemo(() => createClient(), []);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const [githubUrl, setGithubUrl] = React.useState("");
  const [addingRepo, setAddingRepo] = React.useState(false);

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;
    setUploading(true);
    try {
      for (const file of list) {
        if (file.size > MAX_FILE_BYTES) {
          toast.error(
            `${file.name} is ${formatBytes(file.size)} — over the ${formatBytes(
              MAX_FILE_BYTES,
            )} limit.`,
          );
          continue;
        }
        const type = inferArtifactType(file.name, file.type);
        const path = `${userId}/${projectId}/${crypto.randomUUID()}-${safeName(
          file.name,
        )}`;

        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(path, file, {
            contentType: file.type || undefined,
            upsert: false,
          });
        if (uploadError) {
          toast.error(`Upload failed for ${file.name}: ${uploadError.message}`);
          continue;
        }

        const { data: artifact, error: insertError } = await supabase
          .from("artifacts")
          .insert({
            project_id: projectId,
            user_id: userId,
            type,
            file_path: path,
            original_filename: file.name,
            file_size_bytes: file.size,
            mime_type: file.type || null,
          })
          .select("*")
          .single();

        if (insertError || !artifact) {
          toast.error(`Could not save ${file.name}.`);
          continue;
        }
        onAdded(artifact as Artifact);
      }
      toast.success("Artifacts added");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function addRepo(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseGitHubUrl(githubUrl);
    if (!parsed) {
      toast.error("Enter a valid GitHub repo URL (e.g. github.com/owner/repo).");
      return;
    }
    setAddingRepo(true);
    try {
      const { data: artifact, error } = await supabase
        .from("artifacts")
        .insert({
          project_id: projectId,
          user_id: userId,
          type: "github_repo",
          github_url: githubUrl.trim(),
          original_filename: `${parsed.owner}/${parsed.repo}`,
        })
        .select("*")
        .single();
      if (error || !artifact) throw error ?? new Error("Insert failed");
      onAdded(artifact as Artifact);
      setGithubUrl("");
      toast.success(`Linked ${parsed.owner}/${parsed.repo}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not link repository.",
      );
    } finally {
      setAddingRepo(false);
    }
  }

  return (
    <Tabs defaultValue="upload">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="upload">
          <UploadCloud className="h-4 w-4" />
          Upload files
        </TabsTrigger>
        <TabsTrigger value="github">
          <Github className="h-4 w-4" />
          GitHub repo
        </TabsTrigger>
      </TabsList>

      <TabsContent value="upload">
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (e.dataTransfer.files) uploadFiles(e.dataTransfer.files);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
            dragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-accent/40"
          }`}
        >
          {uploading ? (
            <Loader2 className="mb-3 h-7 w-7 animate-spin text-primary" />
          ) : (
            <UploadCloud className="mb-3 h-7 w-7 text-muted-foreground" />
          )}
          <p className="text-sm font-medium">
            Drop files here or click to browse
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            ZIP, images, video, PDF, docs, CAD — up to {formatBytes(MAX_FILE_BYTES)} each
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && uploadFiles(e.target.files)}
          />
        </div>
      </TabsContent>

      <TabsContent value="github">
        <form onSubmit={addRepo} className="flex gap-2">
          <Input
            placeholder="https://github.com/owner/repo"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            disabled={addingRepo}
          />
          <Button type="submit" disabled={addingRepo} className="shrink-0">
            {addingRepo ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Link
          </Button>
        </form>
        <p className="mt-2 text-xs text-muted-foreground">
          Public repositories give the richest analysis — we read the README,
          languages and file structure.
        </p>
      </TabsContent>
    </Tabs>
  );
}
