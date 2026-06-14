import { z } from "zod";

import { getAIClient, MODELS } from "@/lib/ai/client";
import type { ExtractedData } from "@/lib/ai/types";

const gapAnalysisSchema = z.object({
  matchScore: z.number(),
  atsScore: z.number(),
  missingSkills: z.array(z.string()),
  missingKeywords: z.array(z.string()),
  suggestedProjectDescriptions: z.array(z.string()),
  recommendedImprovements: z.array(z.string()),
  markdown: z.string(),
});

export type GapAnalysisResult = z.infer<typeof gapAnalysisSchema>;

const multiResumeSchema = z.object({
  experienceSection: z.array(z.string()),
  projectsSection: z.array(z.object({
    name: z.string(),
    bullets: z.array(z.string()),
  })),
  skillsSection: z.object({
    languages: z.array(z.string()),
    frameworks: z.array(z.string()),
    tools: z.array(z.string()),
    concepts: z.array(z.string()),
  }),
  selectedProjectIds: z.array(z.string()).optional(),
  markdown: z.string(),
});

export type MultiResumeResult = z.infer<typeof multiResumeSchema>;

function safeParseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    const cleaned = raw
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/i, "")
      .trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  }
}

/** Compare resume + job posting for gaps and ATS fit. */
export async function analyzeResumeGap(
  resumeText: string,
  jobPostingText: string,
): Promise<GapAnalysisResult> {
  const client = getAIClient();
  const completion = await client.chat.completions.create({
    model: MODELS.heavy,
    temperature: 0.35,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are an expert career coach and ATS specialist. Compare a resume against a job posting and produce actionable gap analysis. Be honest about scores (0-100). Do not invent experience the candidate lacks — suggest improvements and project descriptions they could build instead.`,
      },
      {
        role: "user",
        content: `Return JSON:
{
  "matchScore": number (0-100 overall fit),
  "atsScore": number (0-100 keyword/ATS optimization),
  "missingSkills": string[],
  "missingKeywords": string[],
  "suggestedProjectDescriptions": string[] (2-4 project ideas to fill gaps),
  "recommendedImprovements": string[],
  "markdown": string (full report in Markdown with headings)
}

RESUME:
"""
${resumeText.slice(0, 8000)}
"""

JOB POSTING:
"""
${jobPostingText.slice(0, 8000)}
"""`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = safeParseJson(raw);
  const result = gapAnalysisSchema.safeParse(parsed);
  if (result.success) return result.data;
  throw new Error("Could not analyze resume gap. Try again with clearer text.");
}

/** Build a combined resume from multiple analyzed projects. */
export async function buildMultiProjectResume(
  projects: Array<{
    id: string;
    name: string;
    extracted: ExtractedData;
  }>,
): Promise<MultiResumeResult> {
  const client = getAIClient();
  const digest = projects
    .map(
      (p) =>
        `PROJECT: ${p.name} (id: ${p.id})
Summary: ${p.extracted.summary}
Highlights: ${p.extracted.highlights.join("; ")}
Tech: ${p.extracted.techStack.join(", ")}
Metrics: ${p.extracted.metrics.join("; ") || "none"}`,
    )
    .join("\n\n");

  const completion = await client.chat.completions.create({
    model: MODELS.heavy,
    temperature: 0.5,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are an expert résumé writer. Select the strongest projects and build a cohesive resume sections package. Pick 3-5 best projects if many are provided. Use only facts from the project analyses — never invent metrics.`,
      },
      {
        role: "user",
        content: `Return JSON:
{
  "experienceSection": string[] (3-5 achievement bullets synthesizing top projects),
  "projectsSection": [{ "name": string, "bullets": string[] }] (2-4 projects, 2-3 bullets each),
  "skillsSection": { "languages": string[], "frameworks": string[], "tools": string[], "concepts": string[] },
  "selectedProjectIds": string[] (ids of projects you featured),
  "markdown": string (full formatted resume sections in Markdown)
}

PROJECTS:
"""
${digest}
"""`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = safeParseJson(raw);
  const result = multiResumeSchema.safeParse(parsed);
  if (result.success) return result.data;
  throw new Error("Could not build resume. Ensure projects are analyzed first.");
}
