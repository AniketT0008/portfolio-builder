import { CopyButton } from "@/components/copy-button";
import { Markdown } from "@/components/markdown";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  generationContentSchema,
  type GenerationContent,
} from "@/lib/ai/types";
import type { GenerationType, Json } from "@/lib/types/database";

function parseContent(content: Json): GenerationContent {
  const result = generationContentSchema.safeParse(content);
  if (result.success) return result.data;
  // Last-resort: render whatever string we can find.
  if (typeof content === "string") {
    return generationContentSchema.parse({ markdown: content });
  }
  return generationContentSchema.parse({
    markdown: "```json\n" + JSON.stringify(content, null, 2) + "\n```",
  });
}

export function GenerationViewer({
  type,
  content,
}: {
  type: GenerationType;
  content: Json;
}) {
  const data = parseContent(content);

  // ── Resume bullets ────────────────────────────────────────────────
  if (type === "resume_bullets" && data.bullets?.length) {
    return (
      <div className="space-y-3">
        <ul className="space-y-2">
          {data.bullets.map((b, i) => (
            <li
              key={i}
              className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3 text-sm"
            >
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span className="flex-1">{b}</span>
              <CopyButton value={b} />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // ── STAR responses ────────────────────────────────────────────────
  if (type === "star_response" && data.stories?.length) {
    return (
      <div className="space-y-4">
        {data.stories.map((s, i) => (
          <Card key={i}>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold">{s.question}</p>
                <CopyButton
                  value={`Q: ${s.question}\n\nSituation: ${s.situation}\nTask: ${s.task}\nAction: ${s.action}\nResult: ${s.result}`}
                />
              </div>
              {(
                [
                  ["Situation", s.situation],
                  ["Task", s.task],
                  ["Action", s.action],
                  ["Result", s.result],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="text-sm">
                  <Badge variant="secondary" className="mb-1">
                    {label}
                  </Badge>
                  <p className="text-muted-foreground">{value}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // ── LinkedIn variants ─────────────────────────────────────────────
  if (type === "linkedin_post" && data.variants?.length) {
    return (
      <div className="space-y-4">
        {data.variants.map((v, i) => (
          <Card key={i}>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <Badge>{v.style}</Badge>
                <CopyButton
                  label="Copy"
                  value={`${v.text}\n\n${v.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}`}
                />
              </div>
              <p className="whitespace-pre-wrap text-sm">{v.text}</p>
              {v.hashtags.length > 0 && (
                <p className="text-sm font-medium text-primary">
                  {v.hashtags
                    .map((h) => (h.startsWith("#") ? h : `#${h}`))
                    .join(" ")}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // ── Presentation decks ────────────────────────────────────────────
  if (type === "presentation" && data.decks?.length) {
    return (
      <div className="space-y-6">
        {data.decks.map((deck, di) => (
          <div key={di} className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="info">{deck.length}</Badge>
              {deck.title && (
                <span className="text-sm font-medium">{deck.title}</span>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {deck.slides.map((slide, si) => (
                <Card key={si} className="overflow-hidden">
                  <CardContent className="space-y-2 p-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono">Slide {si + 1}</span>
                    </div>
                    <p className="font-semibold leading-tight">
                      {slide.title}
                    </p>
                    <ul className="ml-4 list-disc space-y-1 text-sm">
                      {slide.bullets.map((b, bi) => (
                        <li key={bi}>{b}</li>
                      ))}
                    </ul>
                    {slide.notes && (
                      <>
                        <Separator className="my-2" />
                        <p className="text-xs italic text-muted-foreground">
                          <span className="font-semibold not-italic">
                            Speaker notes:{" "}
                          </span>
                          {slide.notes}
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Skills extraction ───────────────────────────────────────────
  if (type === "skills_extraction" && data.skills) {
    const buckets = [
      ["Languages", data.skills.languages],
      ["Frameworks", data.skills.frameworks],
      ["Cloud / Tools", data.skills.cloud],
      ["Concepts", data.skills.concepts],
    ] as const;
    return (
      <div className="space-y-4">
        {buckets.map(
          ([label, items]) =>
            items.length > 0 && (
              <div key={label}>
                <p className="mb-2 text-sm font-semibold">{label}</p>
                <div className="flex flex-wrap gap-2">
                  {items.map((s, i) => (
                    <Badge key={i} variant="secondary">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            ),
        )}
        {data.bullets?.length ? (
          <ul className="space-y-2 border-t pt-4">
            {data.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="flex-1">{b}</span>
                <CopyButton value={b} />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }

  // ── Impact score ──────────────────────────────────────────────────
  if (type === "impact_score" && data.scores) {
    const s = data.scores;
    const dims = [
      ["Complexity", s.complexity],
      ["Technical depth", s.technicalDepth],
      ["Leadership", s.leadership],
      ["Innovation", s.innovation],
      ["Impact", s.impact],
    ] as const;
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 rounded-xl border bg-primary/5 p-4">
          <span className="text-4xl font-bold text-primary">{s.overall}</span>
          <div>
            <p className="font-semibold">Overall score</p>
            <p className="text-sm text-muted-foreground">{s.verdict}</p>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {dims.map(([label, score]) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-lg border p-3 text-sm"
            >
              <span>{label}</span>
              <Badge variant="secondary">{score}/100</Badge>
            </div>
          ))}
        </div>
        {data.markdown && <Markdown content={data.markdown} />}
      </div>
    );
  }

  // ── Interview questions ───────────────────────────────────────────
  if (type === "interview_questions" && data.questions?.length) {
    return (
      <div className="space-y-3">
        {data.questions.map((q, i) => (
          <Card key={i}>
            <CardContent className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <Badge variant="outline">{q.category}</Badge>
                <CopyButton
                  value={`Q: ${q.question}\n\nA: ${q.suggestedAnswer ?? ""}`}
                />
              </div>
              <p className="font-medium">{q.question}</p>
              {q.suggestedAnswer && (
                <p className="text-sm text-muted-foreground">
                  {q.suggestedAnswer}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // ── Recruiter review ──────────────────────────────────────────────
  if (type === "recruiter_review" && data.review) {
    const r = data.review;
    const blocks = [
      ["Strengths", r.strengths, "default"],
      ["Weaknesses", r.weaknesses, "destructive"],
      ["Missing metrics", r.missingMetrics, "secondary"],
      ["Suggestions", r.suggestions, "default"],
    ] as const;
    return (
      <div className="space-y-4">
        {blocks.map(
          ([title, items]) =>
            items.length > 0 && (
              <div key={title}>
                <p className="mb-2 text-sm font-semibold">{title}</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ),
        )}
      </div>
    );
  }

  // ── Achievement quantifier ────────────────────────────────────────
  if (type === "achievement_quantifier" && data.beforeAfter?.length) {
    return (
      <div className="space-y-4">
        {data.beforeAfter.map((pair, i) => (
          <div key={i} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Before
              </p>
              <p className="text-sm line-through opacity-60">{pair.before}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-emerald-600">After</p>
              <p className="text-sm">{pair.after}</p>
              <CopyButton value={pair.after} className="mt-2" />
            </div>
          </div>
        ))}
        {data.suggestedMetrics?.length ? (
          <div className="border-t pt-4">
            <p className="mb-2 text-sm font-semibold">Confirm these metrics</p>
            <ul className="space-y-1 text-sm">
              {data.suggestedMetrics.map((m, i) => (
                <li key={i} className="text-muted-foreground">
                  {m.metric}{" "}
                  <Badge variant="outline" className="ml-1 text-xs">
                    {m.confidence}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    );
  }

  // ── Project timeline ──────────────────────────────────────────────
  if (type === "project_timeline" && data.timeline?.length) {
    return (
      <div className="relative space-y-0 border-l-2 border-primary/30 pl-6">
        {data.timeline.map((phase, i) => (
          <div key={i} className="relative pb-6 last:pb-0">
            <span className="absolute -left-[1.55rem] top-1 h-3 w-3 rounded-full border-2 border-primary bg-background" />
            <p className="font-semibold">{phase.phase}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {phase.description}
            </p>
          </div>
        ))}
      </div>
    );
  }

  // ── Default: rendered Markdown ────────────────────────────────────
  return <Markdown content={data.markdown} />;
}

/** Plain-text representation used for the "copy all" button. */
export function generationToText(type: GenerationType, content: Json): string {
  const data = parseContent(content);
  return data.markdown || JSON.stringify(content, null, 2);
}
