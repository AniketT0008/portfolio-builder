"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Github, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { getSiteUrl } from "@/lib/supabase/config";

export function IntegrationsForm({
  userId,
  initialGithubUsername,
  initialLinkedinUrl,
}: {
  userId: string;
  initialGithubUsername?: string | null;
  initialLinkedinUrl?: string | null;
}) {
  const router = useRouter();
  const supabase = React.useMemo(() => createClient(), []);
  const [githubUsername, setGithubUsername] = React.useState(
    initialGithubUsername ?? "",
  );
  const [linkedinUrl, setLinkedinUrl] = React.useState(
    initialLinkedinUrl ?? "",
  );
  const [saving, setSaving] = React.useState(false);
  const [connecting, setConnecting] = React.useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        github_username: githubUsername.trim() || null,
        linkedin_url: linkedinUrl.trim() || null,
      })
      .eq("id", userId);
    setSaving(false);
    if (error) {
      toast.error("Could not save integrations.");
      return;
    }
    toast.success("Integrations saved");
    router.refresh();
  }

  async function connectGitHub() {
    setConnecting(true);
    const siteUrl =
      getSiteUrl() ||
      (typeof window !== "undefined" ? window.location.origin : "");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent("/settings")}`,
          scopes: "read:user repo",
        },
      });
      if (error) throw error;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "GitHub connect failed.",
      );
      setConnecting(false);
    }
  }

  return (
    <Card>
      <form onSubmit={save}>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>
            Link GitHub and LinkedIn for auto-import and Code Studio publish.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="githubUsername">GitHub username</Label>
            <Input
              id="githubUsername"
              placeholder="octocat"
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Used to load your public repos in Import Hub.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={connectGitHub}
            disabled={connecting}
          >
            {connecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Github className="h-4 w-4" />
            )}
            Connect GitHub (private repos + push)
          </Button>

          <div className="space-y-2">
            <Label htmlFor="linkedinUrl">LinkedIn profile URL</Label>
            <Input
              id="linkedinUrl"
              placeholder="https://linkedin.com/in/your-name"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Saved for LinkedIn import. Paste profile text in Import Hub — we
              cannot scrape LinkedIn directly.
            </p>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" variant="gradient" disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save integrations
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
