import { z } from "zod";

import {
  AUDIENCE_OPTIONS,
  LENGTH_OPTIONS,
  TONE_OPTIONS,
} from "@/lib/constants";
import type { GenerationType } from "@/lib/types/database";

const GENERATION_TYPES = [
  "resume_bullets",
  "star_response",
  "portfolio_page",
  "readme",
  "linkedin_post",
  "presentation",
  "tech_docs",
  "cover_letter",
  "scholarship_app",
  "architecture_overview",
] as const satisfies readonly GenerationType[];

export const generationSettingsSchema = z.object({
  tone: z.enum(
    TONE_OPTIONS.map((t) => t.value) as [string, ...string[]],
  ),
  length: z.enum(
    LENGTH_OPTIONS.map((l) => l.value) as [string, ...string[]],
  ),
  audience: z.enum(
    AUDIENCE_OPTIONS.map((a) => a.value) as [string, ...string[]],
  ),
  notes: z.string().max(500).optional(),
});

export const generationRequestSchema = z.object({
  type: z.enum(GENERATION_TYPES),
  settings: generationSettingsSchema,
});

export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  description: z.string().max(2000).optional(),
});

export const githubArtifactSchema = z.object({
  github_url: z.string().url("Enter a valid URL"),
});
