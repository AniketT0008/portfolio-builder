"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  FileCode2,
  Github,
  Linkedin,
  Loader2,
  Rocket,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import type { CodeStudioSession } from "@/lib/types/database";
import type { CodeFile } from "@/lib/ai/code-studio";

const TEXT_EXTENSIONS = [
  "js", "jsx", "ts", "tsx", "py", "java", "c", "cpp", "h", "go", "rs",
  "rb", "php", "html", "css", "scss", "json", "md", "txt", "yml", "yaml",
  "sql", "sh", "vue", "svelte",
];

function isTextFile(name: string) {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  return TEXT_EXTENSIONS.includes(ext) || !name.includes(".");
}

async function filesFromZip(file: File): Promise<CodeFile[]> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const out: CodeFile[] = [];

  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    if (!isTextFile(path)) continue;
    if (path.includes("__MACOSX") || path.includes("node_modules/")) continue;
    const content = await entry.async("string");
    out.push({ path, content: content.slice(0, 50000) });
    if (out.length >= 40) break;
  }
  return out;
}

async function filesFromFileList(list: FileList | File[]): Promise<CodeFile[]> {
  const files = Array.from(list);
  const out: CodeFile[] = [];

  for (const file of files) {
    if (file.name.endsWith(".zip")) {
      out.push(...(await filesFromZip(file)));
      continue;
    }
    if (!isTextFile(file.name)) continue;
    const content = await file.text();
    out.push({ path: file.name, content: content.slice(0, 50000) });
    if (out.length >= 40) break;
  }
  return out;
}

export function CodeStudioWorkspace({
  initialSessions,
}: {
  initialSessions: CodeStudioSession[];
}) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [sessions, setSessions] =
    React.useState<CodeStudioSession[]>(initialSessions);
  const [activeId, setActiveId] = React.useState<string | null>(
    initialSessions[0]?.id ?? null,
  );
  const [projectName, setProjectName] = React.useState("My project");
  const [uploading, setUploading] = React.useState(false);
  const [refactoring, setRefactoring] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);
  const [repoName, setRepoName] = React.useState("");
  const [isPrivate, setIsPrivate] = React.useState(false);
  const [createProject, setCreateProject] = React.useState(true);

  const active = sessions.find((s) => s.id === activeId) ?? null;
  const refactoredFiles = (active?.refactored_files ?? []) as CodeFile[];

  async function uploadFiles(files: FileList | File[]) {
    setUploading(true);
    try {
      const parsed = await filesFromFileList(files);
      if (parsed.length === 0) {
        toast.error("No text/code files found. Try a ZIP or source files.");
        return;
      }
      const res = await fetch("/api/code-studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName, files: parsed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data.error ?? data));
      const session = data.session as CodeStudioSession;
      setSessions((prev) => [session, ...prev]);
      setActiveId(session.id);
      setRepoName(session.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-"));
      toast.success(`Uploaded ${parsed.length} file(s)`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function runRefactor() {
    if (!active) return;
    setRefactoring(true);
    try {
      const res = await fetch(`/api/code-studio/${active.id}/refactor`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Refactor failed");
      const session = data.session as CodeStudioSession;
      setSessions((prev) =>
        prev.map((s) => (s.id === session.id ? session : s)),
      );
      setRepoName(
        session.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-"),
      );
      toast.success("Project restructured — README & LinkedIn post ready");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Refactor failed");
    } finally {
      setRefactoring(false);
    }
  }

  async function publishToGitHub() {
    if (!active || !repoName.trim()) return;
    setPublishing(true);
    try {
      const res = await fetch(`/api/code-studio/${active.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo_name: repoName.trim(),
          private: isPrivate,
          create_project: createProject,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Publish failed");
      const session = data.session as CodeStudioSession;
      setSessions((prev) =>
        prev.map((s) => (s.id === session.id ? session : s)),
      );
      toast.success("Pushed to GitHub!");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">New upload</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="cs-name">Project name</Label>
              <Input
                id="cs-name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>
            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  inputRef.current?.click();
              }}
              className="flex cursor-pointer flex-col items-center rounded-lg border-2 border-dashed p-6 text-center hover:border-primary/50 hover:bg-accent/30"
            >
              {uploading ? (
                <Loader2 className="mb-2 h-6 w-6 animate-spin text-primary" />
              ) : (
                <UploadCloud className="mb-2 h-6 w-6 text-muted-foreground" />
              )}
              <p className="text-sm font-medium">ZIP or source files</p>
              <input
                ref={inputRef}
                type="file"
                multiple
                accept=".zip,.js,.ts,.tsx,.jsx,.py,.java,.go,.rs,.html,.css,.md,.json,.txt"
                className="hidden"
                onChange={(e) =>
                  e.target.files && uploadFiles(e.target.files)
                }
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-1">
          <p className="px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Sessions
          </p>
          {sessions.length === 0 ? (
            <p className="px-1 text-sm text-muted-foreground">No uploads yet</p>
          ) : (
            sessions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveId(s.id)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  activeId === s.id
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-accent"
                }`}
              >
                <p className="font-medium truncate">{s.name}</p>
                <p className="text-xs capitalize text-muted-foreground">
                  {s.status}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      <div>
        {!active ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <FileCode2 className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">Upload code to get started</p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                AI will reorganize your project, write a README, draft a
                LinkedIn post, and push everything to a new GitHub repo.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="refactor" className="space-y-4">
            <TabsList>
              <TabsTrigger value="refactor">Refactor</TabsTrigger>
              <TabsTrigger value="readme">README</TabsTrigger>
              <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
              <TabsTrigger value="publish">Publish</TabsTrigger>
            </TabsList>

            <TabsContent value="refactor">
              <Card>
                <CardHeader>
                  <CardTitle>Restructure & polish</CardTitle>
                  <CardDescription>
                    AI reorganizes files into a clean layout, fixes naming, and
                    prepares docs. Source:{" "}
                    {((active.source_files ?? []) as CodeFile[]).length} files
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {active.status === "uploaded" || active.status === "error" ? (
                    <Button
                      variant="gradient"
                      onClick={runRefactor}
                      disabled={refactoring}
                    >
                      {refactoring ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      Run AI refactor
                    </Button>
                  ) : (
                    <>
                      {active.metadata &&
                        typeof active.metadata === "object" &&
                        "structureNotes" in (active.metadata as object) && (
                          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                            {(
                              (active.metadata as { structureNotes?: string[] })
                                .structureNotes ?? []
                            ).map((note, i) => (
                              <li key={i}>{note}</li>
                            ))}
                          </ul>
                        )}
                      <div className="max-h-96 overflow-y-auto rounded-lg border bg-muted/30 p-3 font-mono text-xs">
                        {refactoredFiles.map((f) => (
                          <div key={f.path} className="border-b py-2 last:border-0">
                            <p className="font-semibold text-primary">{f.path}</p>
                            <pre className="mt-1 whitespace-pre-wrap text-muted-foreground">
                              {f.content.slice(0, 600)}
                              {f.content.length > 600 ? "\n…" : ""}
                            </pre>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="readme">
              <Card>
                <CardHeader>
                  <CardTitle>Generated README</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                  {active.readme_content ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {active.readme_content}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-muted-foreground">
                      Run refactor first to generate a README.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="linkedin">
              <Card>
                <CardHeader>
                  <CardTitle>LinkedIn announcement</CardTitle>
                  <CardDescription>
                    Copy or edit before posting to LinkedIn.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {active.linkedin_post ? (
                    <div className="whitespace-pre-wrap rounded-lg border bg-muted/30 p-4 text-sm">
                      {active.linkedin_post}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      Run refactor first to generate a post.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="publish">
              <Card>
                <CardHeader>
                  <CardTitle>Push to GitHub</CardTitle>
                  <CardDescription>
                    Creates a new repo and uploads refactored files. Sign in
                    with GitHub and enable provider tokens in Supabase Auth.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {active.github_repo_url ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <a
                        href={active.github_repo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-primary hover:underline"
                      >
                        <Github className="h-4 w-4" />
                        {active.github_repo_url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      {active.project_id && (
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/projects/${active.project_id}`}>
                            Open project
                          </Link>
                        </Button>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="repo-name">Repository name</Label>
                        <Input
                          id="repo-name"
                          value={repoName}
                          onChange={(e) => setRepoName(e.target.value)}
                          placeholder="my-awesome-project"
                        />
                      </div>
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="private-repo"
                            checked={isPrivate}
                            onCheckedChange={(v) => setIsPrivate(v === true)}
                          />
                          <Label htmlFor="private-repo" className="font-normal">
                            Private repository
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="create-proj"
                            checked={createProject}
                            onCheckedChange={(v) =>
                              setCreateProject(v === true)
                            }
                          />
                          <Label htmlFor="create-proj" className="font-normal">
                            Also create ProjectForge project
                          </Label>
                        </div>
                      </div>
                      <Button
                        variant="gradient"
                        onClick={publishToGitHub}
                        disabled={
                          publishing ||
                          (active.status !== "refactored" &&
                            active.status !== "published")
                        }
                      >
                        {publishing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Rocket className="h-4 w-4" />
                        )}
                        Create repo & push
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
