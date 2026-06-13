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

  // ── Default: rendered Markdown ────────────────────────────────────
  return <Markdown content={data.markdown} />;
}

/** Plain-text representation used for the "copy all" button. */
export function generationToText(type: GenerationType, content: Json): string {
  const data = parseContent(content);
  return data.markdown || JSON.stringify(content, null, 2);
}
