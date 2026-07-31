"use client";

import * as React from "react";
import {
  Gauge,
  Loader2,
  Sparkles,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { CopyButton } from "@/components/copy-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { ProjectWithCounts } from "@/lib/data";
import { StatusBadge } from "@/components/projects/status-badge";

type GapResult = {
  matchScore: number;
  atsScore: number;
  missingSkills: string[];
  missingKeywords: string[];
  suggestedProjectDescriptions: string[];
  recommendedImprovements: string[];
  markdown: string;
};

type ResumeResult = {
  experienceSection: string[];
  projectsSection: Array<{ name: string; bullets: string[] }>;
  skillsSection: {
    languages: string[];
    frameworks: string[];
    tools: string[];
    concepts: string[];
  };
  markdown: string;
};

function ScoreRing({ score, label }: { score: number; label: string }) {
  const color =
    score >= 75
      ? "text-emerald-500"
      : score >= 50
        ? "text-amber-500"
        : "text-red-500";
  return (
    <div className="flex flex-col items-center rounded-xl border bg-muted/30 p-4">
      <span className={`text-3xl font-bold ${color}`}>{Math.round(score)}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export function ResumeBuilder({
  projects,
}: {
  projects: ProjectWithCounts[];
}) {
  const readyProjects = projects.filter((p) => p.status === "ready");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [building, setBuilding] = React.useState(false);
  const [resumeResult, setResumeResult] = React.useState<ResumeResult | null>(
    null,
  );

  const [resumeText, setResumeText] = React.useState("");
  const [jobText, setJobText] = React.useState("");
  const [analyzing, setAnalyzing] = React.useState(false);
  const [gapResult, setGapResult] = React.useState<GapResult | null>(null);

  function toggleProject(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function buildResume() {
    if (selected.size === 0) {
      toast.error("Select at least one analyzed project.");
      return;
    }
    setBuilding(true);
    try {
      const res = await fetch("/api/resume/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_ids: Array.from(selected) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Build failed");
      setResumeResult(data);
      toast.success("Resume sections generated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Build failed");
    } finally {
      setBuilding(false);
    }
  }

  async function runGapAnalysis() {
    if (resumeText.length < 50 || jobText.length < 50) {
      toast.error("Paste both your resume and the job posting.");
      return;
    }
    setAnalyzing(true);
    try {
      const res = await fetch("/api/career/gap-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_text: resumeText,
          job_posting_text: jobText,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      setGapResult(data);
      toast.success("Gap analysis complete");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <Tabs defaultValue="builder" className="space-y-6">
      <TabsList>
        <TabsTrigger value="builder">Multi-Project Resume</TabsTrigger>
        <TabsTrigger value="gap">Gap Analyzer</TabsTrigger>
      </TabsList>

      <TabsContent value="builder" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Build from your best projects</CardTitle>
            <CardDescription>
              AI picks your strongest projects and builds Experience, Projects,
              and Skills sections. Projects must be analyzed first.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {readyProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No analyzed projects yet. Import or create projects, add
                artifacts, then run Analyze on each one.
              </p>
            ) : (
              <div className="space-y-2">
                {readyProjects.map((p) => (
                  <label
                    key={p.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-accent/30"
                  >
                    <Checkbox
                      checked={selected.has(p.id)}
                      onCheckedChange={() => toggleProject(p.id)}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{p.name}</p>
                      {p.description && (
                        <p className="truncate text-sm text-muted-foreground">
                          {p.description}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={p.status} />
                  </label>
                ))}
              </div>
            )}
            <Button
              variant="gradient"
              onClick={buildResume}
              disabled={building || selected.size === 0}
            >
              {building ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Build resume sections
            </Button>
          </CardContent>
        </Card>

        {resumeResult && (
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Generated sections</CardTitle>
              <CopyButton label="Copy all" value={resumeResult.markdown} />
            </CardHeader>
            <CardContent className="space-y-6">
              {resumeResult.experienceSection.length > 0 && (
                <div>
                  <h3 className="mb-2 font-semibold">Experience highlights</h3>
                  <ul className="space-y-2">
                    {resumeResult.experienceSection.map((b, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 rounded-lg border bg-muted/20 p-3 text-sm"
                      >
                        <span className="flex-1">{b}</span>
                        <CopyButton value={b} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {resumeResult.projectsSection.map((proj, i) => (
                <div key={i}>
                  <h3 className="mb-2 font-semibold">{proj.name}</h3>
                  <ul className="ml-4 list-disc space-y-1 text-sm">
                    {proj.bullets.map((b, j) => (
                      <li key={j}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
              <div>
                <h3 className="mb-2 font-semibold">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    ...resumeResult.skillsSection.languages,
                    ...resumeResult.skillsSection.frameworks,
                    ...resumeResult.skillsSection.tools,
                    ...resumeResult.skillsSection.concepts,
                  ].map((s, i) => (
                    <Badge key={i} variant="secondary">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none border-t pt-4">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {resumeResult.markdown}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="gap" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Resume Gap Analyzer
            </CardTitle>
            <CardDescription>
              Upload your resume text and a job posting — get missing skills,
              ATS score, and improvement suggestions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="resume">Your resume</Label>
                <Textarea
                  id="resume"
                  rows={12}
                  placeholder="Paste resume text..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="job">Job posting</Label>
                <Textarea
                  id="job"
                  rows={12}
                  placeholder="Paste job description..."
                  value={jobText}
                  onChange={(e) => setJobText(e.target.value)}
                />
              </div>
            </div>
            <Button
              variant="gradient"
              onClick={runGapAnalysis}
              disabled={analyzing}
            >
              {analyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Gauge className="h-4 w-4" />
              )}
              Analyze gaps
            </Button>
          </CardContent>
        </Card>

        {gapResult && (
          <Card>
            <CardHeader>
              <CardTitle>Analysis results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:max-w-sm">
                <ScoreRing score={gapResult.matchScore} label="Match score" />
                <ScoreRing score={gapResult.atsScore} label="ATS score" />
              </div>

              {gapResult.missingSkills.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold">Missing skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {gapResult.missingSkills.map((s, i) => (
                      <Badge key={i} variant="outline">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {gapResult.missingKeywords.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold">
                    Missing keywords
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {gapResult.missingKeywords.map((k, i) => (
                      <Badge key={i} variant="secondary">
                        {k}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {gapResult.recommendedImprovements.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold">
                    Recommended improvements
                  </h3>
                  <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                    {gapResult.recommendedImprovements.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="prose prose-sm dark:prose-invert max-w-none border-t pt-4">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {gapResult.markdown}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}
