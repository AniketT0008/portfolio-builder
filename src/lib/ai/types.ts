import { z } from "zod";

/**
 * Normalized analysis of a project, stored in `projects.extracted_data`.
 * Every field is optional-friendly so partial model output never crashes UI.
 */
export const extractedDataSchema = z.object({
  summary: z.string().default(""),
  problem: z.string().default(""),
  solution: z.string().default(""),
  domain: z.string().default(""),
  role: z.string().default(""),
  collaboration: z.string().default(""),
  timeline: z.string().default(""),
  techStack: z.array(z.string()).default([]),
  features: z.array(z.string()).default([]),
  challenges: z.array(z.string()).default([]),
  outcomes: z.array(z.string()).default([]),
  metrics: z.array(z.string()).default([]),
  highlights: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  targetRoles: z.array(z.string()).default([]),
});

export type ExtractedData = z.infer<typeof extractedDataSchema>;

export const EMPTY_EXTRACTED: ExtractedData = extractedDataSchema.parse({});

// ── Per-generation content schemas ──────────────────────────────────────────
// Every generation always carries a `markdown` field the viewer can render,
// plus optional structured fields for richer rendering.

export const starStorySchema = z.object({
  question: z.string(),
  situation: z.string(),
  task: z.string(),
  action: z.string(),
  result: z.string(),
});

export const slideSchema = z.object({
  title: z.string(),
  bullets: z.array(z.string()).default([]),
  notes: z.string().default(""),
});

export const deckSchema = z.object({
  length: z.string(), // "5-minute" | "10-minute"
  title: z.string().default(""),
  slides: z.array(slideSchema).default([]),
});

export const linkedinVariantSchema = z.object({
  style: z.string(),
  text: z.string(),
  hashtags: z.array(z.string()).default([]),
});

export const sectionSchema = z.object({
  heading: z.string(),
  body: z.string(),
});

export const qaSchema = z.object({
  prompt: z.string(),
  answer: z.string(),
});

/** Loose, superset content schema. Generators fill in what's relevant. */
export const generationContentSchema = z.object({
  markdown: z.string().default(""),
  title: z.string().optional(),
  bullets: z.array(z.string()).optional(),
  stories: z.array(starStorySchema).optional(),
  sections: z.array(sectionSchema).optional(),
  features: z.array(z.string()).optional(),
  lessons: z.array(z.string()).optional(),
  variants: z.array(linkedinVariantSchema).optional(),
  decks: z.array(deckSchema).optional(),
  paragraphs: z.array(z.string()).optional(),
  responses: z.array(qaSchema).optional(),
  mermaid: z.string().optional(),
});

export type GenerationContent = z.infer<typeof generationContentSchema>;
