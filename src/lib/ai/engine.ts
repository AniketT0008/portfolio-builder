import type { GenerationSettings } from "@/lib/constants";
import type { GenerationType } from "@/lib/types/database";
import { getAIClient, MODELS } from "@/lib/ai/client";
import {
  ANALYSIS_SYSTEM,
  buildAnalysisUserPrompt,
  buildGenerationMessages,
} from "@/lib/ai/prompts";
import {
  EMPTY_EXTRACTED,
  extractedDataSchema,
  generationContentSchema,
  type ExtractedData,
  type GenerationContent,
} from "@/lib/ai/types";

function safeParseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    // Strip accidental ```json fences, then retry.
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

/** Run the analysis pass over a project's gathered context. */
export async function analyzeProjectContext(
  context: string,
): Promise<ExtractedData> {
  const client = getAIClient();
  const completion = await client.chat.completions.create({
    model: MODELS.heavy,
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: ANALYSIS_SYSTEM },
      { role: "user", content: buildAnalysisUserPrompt(context) },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = safeParseJson(raw);
  const result = extractedDataSchema.safeParse(parsed);
  if (result.success) return result.data;

  // Defensive fallback: keep whatever summary-ish text we can.
  return {
    ...EMPTY_EXTRACTED,
    summary:
      typeof parsed === "object" && parsed && "summary" in parsed
        ? String((parsed as Record<string, unknown>).summary)
        : "Analysis completed, but the response could not be fully structured.",
  };
}

/** Run a single generation. */
export async function runGeneration(
  type: GenerationType,
  data: ExtractedData,
  settings: GenerationSettings,
): Promise<GenerationContent> {
  const client = getAIClient();
  const { system, user } = buildGenerationMessages(type, data, settings);

  // Long-form types benefit from the stronger model.
  const heavyTypes: GenerationType[] = [
    "presentation",
    "tech_docs",
    "portfolio_page",
    "architecture_overview",
    "impact_score",
    "interview_questions",
    "hackathon_submission",
    "college_activity",
    "achievement_quantifier",
  ];
  const model = heavyTypes.includes(type) ? MODELS.heavy : MODELS.default;

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = safeParseJson(raw);
  const result = generationContentSchema.safeParse(parsed);
  if (result.success && result.data.markdown.trim()) {
    return result.data;
  }

  // Fallback: wrap raw text so the user still gets output.
  const fallbackMarkdown =
    result.success && !result.data.markdown
      ? "```json\n" + JSON.stringify(parsed, null, 2) + "\n```"
      : raw;
  return generationContentSchema.parse({ markdown: fallbackMarkdown });
}
