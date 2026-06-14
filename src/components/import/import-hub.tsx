"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Github,
  Linkedin,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type GitHubRepo = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  fork: boolean;
  private: boolean;
};

type LinkedInProject = {
  name: string;
  description: string;
  highlights: string[];
};

export function ImportHub({
  initialGithubUsername,
  initialLinkedinUrl,
}: {
  initialGithubUsername?: string | null;
  initialLinkedinUrl?: string | null;
}) {
  const router = useRouter();

  // GitHub state
  const [githubUsername, setGithubUsername] = React.useState(
    initialGithubUsername ?? "",
  );
  const [repos, setRepos] = React.useState<GitHubRepo[]>([]);
  const [selectedRepos, setSelectedRepos] = React.useState<Set<number>>(
    new Set(),
  );
  const [loadingRepos, setLoadingRepos] = React.useState(false);
  const [importingGithub, setImportingGithub] = React.useState(false);
  const [autoAnalyze, setAutoAnalyze] = React.useState(true);
  const [hasToken, setHasToken] = React.useState(false);

  // LinkedIn state
  const [linkedinUrl, setLinkedinUrl] = React.useState(
    initialLinkedinUrl ?? "",
  );
  const [pastedText, setPastedText] = React.useState("");
  const [parsedProjects, setParsedProjects] = React.useState<LinkedInProject[]>(
    [],
  );
  const [selectedLinkedIn, setSelectedLinkedIn] = React.useState<Set<number>>(
    new Set(),
  );
  const [parsingLinkedIn, setParsingLinkedIn] = React.useState(false);
  const [importingLinkedIn, setImportingLinkedIn] = React.useState(false);

  // Custom add-on
  const [customName, setCustomName] = React.useState("");
  const [customDesc, setCustomDesc] = React.useState("");
  const [customNotes, setCustomNotes] = React.useState("");
  const [addingCustom, setAddingCustom] = React.useState(false);

  async function fetchRepos() {
    setLoadingRepos(true);
    try {
      const qs = githubUsername.trim()
        ? `?username=${encodeURIComponent(githubUsername.trim())}`
        : "";
      const res = await fetch(`/api/import/github/repos${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load repos");
      setRepos(data.repos ?? []);
      setHasToken(Boolean(data.hasToken));
      if (data.username && !githubUsername) setGithubUsername(data.username);
      toast.success(`Found ${data.repos?.length ?? 0} repositories`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load repos");
    } finally {
      setLoadingRepos(false);
    }
  }

  React.useEffect(() => {
    fetchRepos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleRepo(id: number) {
    setSelectedRepos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function importGitHub() {
    const chosen = repos.filter((r) => selectedRepos.has(r.id));
    if (chosen.length === 0) {
      toast.error("Select at least one repository.");
      return;
    }
    setImportingGithub(true);
    try {
      const res = await fetch("/api/import/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repos: chosen.map((r) => ({
            full_name: r.full_name,
            html_url: r.html_url,
            name: r.name,
            description: r.description,
          })),
          autoAnalyze,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data.error ?? data));
      toast.success(`Imported ${data.imported} project(s) from GitHub`);
      if (data.errors?.length) {
        toast.message(`${data.errors.length} repo(s) failed to import`);
      }
      router.push("/projects");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImportingGithub(false);
    }
  }

  async function parseLinkedIn() {
    if (!linkedinUrl.trim() || pastedText.length < 20) {
      toast.error("Add your LinkedIn URL and paste profile/projects text.");
      return;
    }
    setParsingLinkedIn(true);
    try {
      const res = await fetch("/api/import/linkedin", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          linkedin_url: linkedinUrl.trim(),
          pasted_text: pastedText,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Parse failed");
      setParsedProjects(data.projects ?? []);
      setSelectedLinkedIn(
        new Set((data.projects ?? []).map((_: LinkedInProject, i: number) => i)),
      );
      toast.success(`Found ${data.projects?.length ?? 0} projects`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Parse failed");
    } finally {
      setParsingLinkedIn(false);
    }
  }

  async function importLinkedIn() {
    const chosen = parsedProjects.filter((_, i) => selectedLinkedIn.has(i));
    if (chosen.length === 0) {
      toast.error("Select at least one project.");
      return;
    }
    setImportingLinkedIn(true);
    try {
      const res = await fetch("/api/import/linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          linkedin_url: linkedinUrl.trim(),
          pasted_text: pastedText,
          selected: chosen,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data.error ?? data));
      toast.success(`Imported ${data.imported} LinkedIn project(s)`);
      router.push("/projects");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImportingLinkedIn(false);
    }
  }

  async function addCustomProject(e: React.FormEvent) {
    e.preventDefault();
    if (!customName.trim()) return;
    setAddingCustom(true);
    try {
      const res = await fetch("/api/import/linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "custom",
          name: customName.trim(),
          description: customDesc.trim() || undefined,
          notes: customNotes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data.error ?? data));
      toast.success(`Added "${data.name}"`);
      setCustomName("");
      setCustomDesc("");
      setCustomNotes("");
      router.push(`/projects/${data.project_id}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add project");
    } finally {
      setAddingCustom(false);
    }
  }

  return (
    <Tabs defaultValue="github" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="github">
          <Github className="h-4 w-4" />
          GitHub
        </TabsTrigger>
        <TabsTrigger value="linkedin">
          <Linkedin className="h-4 w-4" />
          LinkedIn
        </TabsTrigger>
        <TabsTrigger value="custom">
          <Plus className="h-4 w-4" />
          Add-ons
        </TabsTrigger>
      </TabsList>

      <TabsContent value="github" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Import from GitHub</CardTitle>
            <CardDescription>
              Pull your public repos (or private repos if signed in with GitHub)
              into resume-ready projects. Each repo becomes a project with full
              AI analysis available.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1 space-y-2">
                <Label htmlFor="gh-user">GitHub username</Label>
                <Input
                  id="gh-user"
                  placeholder="your-username"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={fetchRepos}
                  disabled={loadingRepos}
                >
                  {loadingRepos ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Load repos
                </Button>
              </div>
            </div>

            {hasToken && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                GitHub connected — private repos included.
              </p>
            )}

            <div className="flex items-center gap-2">
              <Checkbox
                id="auto-analyze"
                checked={autoAnalyze}
                onCheckedChange={(v) => setAutoAnalyze(v === true)}
              />
              <Label htmlFor="auto-analyze" className="text-sm font-normal">
                Auto-analyze each imported repo with AI
              </Label>
            </div>

            <div className="max-h-80 space-y-2 overflow-y-auto rounded-lg border p-2">
              {repos.length === 0 ? (
                <p className="p-4 text-center text-sm text-muted-foreground">
                  No repos loaded. Set your username in{" "}
                  <Link href="/settings" className="text-primary hover:underline">
                    Settings
                  </Link>{" "}
                  or click Load repos.
                </p>
              ) : (
                repos.map((repo) => (
                  <label
                    key={repo.id}
                    className="flex cursor-pointer items-start gap-3 rounded-md p-2 hover:bg-accent/50"
                  >
                    <Checkbox
                      checked={selectedRepos.has(repo.id)}
                      onCheckedChange={() => toggleRepo(repo.id)}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{repo.full_name}</span>
                        {repo.private && (
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase">
                            private
                          </span>
                        )}
                        {repo.language && (
                          <span className="text-xs text-muted-foreground">
                            {repo.language}
                          </span>
                        )}
                      </div>
                      {repo.description && (
                        <p className="text-sm text-muted-foreground">
                          {repo.description}
                        </p>
                      )}
                    </div>
                  </label>
                ))
              )}
            </div>

            <Button
              variant="gradient"
              onClick={importGitHub}
              disabled={importingGithub || selectedRepos.size === 0}
              className="w-full sm:w-auto"
            >
              {importingGithub ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Github className="h-4 w-4" />
              )}
              Import {selectedRepos.size || ""} selected
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="linkedin" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Import from LinkedIn</CardTitle>
            <CardDescription>
              LinkedIn blocks direct scraping. Paste your experience, projects,
              or featured section — AI extracts resume-ready projects you can
              refine with all the same tools.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="li-url">LinkedIn profile URL</Label>
              <Input
                id="li-url"
                placeholder="https://linkedin.com/in/your-name"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="li-paste">
                Paste profile text (Experience, Projects, Featured)
              </Label>
              <Textarea
                id="li-paste"
                rows={8}
                placeholder="Copy sections from your LinkedIn profile and paste here..."
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={parseLinkedIn}
              disabled={parsingLinkedIn}
            >
              {parsingLinkedIn ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Extract projects with AI
            </Button>

            {parsedProjects.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  {parsedProjects.map((p, i) => (
                    <label
                      key={i}
                      className="flex cursor-pointer items-start gap-3 rounded-md border p-3 hover:bg-accent/30"
                    >
                      <Checkbox
                        checked={selectedLinkedIn.has(i)}
                        onCheckedChange={() =>
                          setSelectedLinkedIn((prev) => {
                            const next = new Set(prev);
                            if (next.has(i)) next.delete(i);
                            else next.add(i);
                            return next;
                          })
                        }
                      />
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {p.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
                <Button
                  variant="gradient"
                  onClick={importLinkedIn}
                  disabled={importingLinkedIn}
                >
                  {importingLinkedIn ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Linkedin className="h-4 w-4" />
                  )}
                  Import selected
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="custom">
        <Card>
          <CardHeader>
            <CardTitle>Custom project or add-on</CardTitle>
            <CardDescription>
              Robotics, research, internships, hackathons — anything not on
              GitHub or LinkedIn. Same AI outputs: resume bullets, STAR
              responses, portfolio pages, and more.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={addCustomProject} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="custom-name">Project name</Label>
                <Input
                  id="custom-name"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="FRC Robot 2025"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-desc">Short description</Label>
                <Input
                  id="custom-desc"
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  placeholder="Autonomous scoring robot for regional competition"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-notes">Details / notes (optional)</Label>
                <Textarea
                  id="custom-notes"
                  rows={4}
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="Your role, technologies, outcomes..."
                />
              </div>
              <Button type="submit" variant="gradient" disabled={addingCustom}>
                {addingCustom ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Add project
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
