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

export const integrationsSchema = z.object({
  github_username: z
    .string()
    .max(39)
    .regex(/^[a-zA-Z0-9-]*$/, "Invalid GitHub username")
    .optional()
    .or(z.literal("")),
  linkedin_url: z
    .string()
    .url("Enter a valid LinkedIn URL")
    .optional()
    .or(z.literal("")),
});

export const githubImportSchema = z.object({
  repos: z
    .array(
      z.object({
        full_name: z.string(),
        html_url: z.string().url(),
        name: z.string(),
        description: z.string().nullable().optional(),
      }),
    )
    .min(1, "Select at least one repository"),
  autoAnalyze: z.boolean().optional().default(false),
});

export const linkedinImportSchema = z.object({
  linkedin_url: z.string().url(),
  pasted_text: z.string().min(20, "Paste your LinkedIn experience or projects"),
  selected: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        highlights: z.array(z.string()).optional(),
      }),
    )
    .optional(),
});

export const customProjectImportSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  notes: z.string().max(5000).optional(),
});

export const codeStudioUploadSchema = z.object({
  name: z.string().min(1).max(120),
  files: z
    .array(
      z.object({
        path: z.string().min(1),
        content: z.string(),
      }),
    )
    .min(1, "Upload at least one file"),
});

export const codeStudioPublishSchema = z.object({
  repo_name: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z0-9._-]+$/, "Invalid repository name"),
  private: z.boolean().optional().default(false),
  create_project: z.boolean().optional().default(true),
});
