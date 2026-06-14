import { z } from "zod";

import { getAIClient, MODELS } from "@/lib/ai/client";

export type CodeFile = {
  path: string;
  content: string;
};

const refactorResultSchema = z.object({
  projectName: z.string(),
  summary: z.string(),
  structureNotes: z.array(z.string()).default([]),
  files: z.array(
    z.object({
      path: z.string(),
      content: z.string(),
    }),
  ),
  readme: z.string(),
  linkedinPost: z.string(),
});

export type RefactorResult = z.infer<typeof refactorResultSchema>;

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

function buildFileContext(files: CodeFile[]): string {
  return files
    .map(
      (f) =>
        `--- FILE: ${f.path} ---\n${f.content.slice(0, 8000)}${
          f.content.length > 8000 ? "\n...[truncated]" : ""
        }`,
    )
    .join("\n\n");
}

/** AI reorganizes uploaded code, generates README + LinkedIn post. */
export async function refactorCodeProject(
  files: CodeFile[],
  projectName?: string,
): Promise<RefactorResult> {
  const client = getAIClient();
  const context = buildFileContext(files.slice(0, 30));

  const completion = await client.chat.completions.create({
    model: MODELS.heavy,
    temperature: 0.35,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a senior software engineer and technical writer. You receive messy or unstructured source code and reorganize it into a clean, professional project layout suitable for GitHub and a résumé portfolio.

Rules:
- Preserve the project's intent and working logic — refactor structure, naming, and organization, not the core behavior.
- Use conventional folder layout (src/, lib/, tests/ when appropriate).
- Include a polished README.md with: title, description, features, tech stack, setup/install, usage, project structure.
- Write an engaging LinkedIn announcement post (2-4 short paragraphs, no hashtags spam).
- Return ONLY valid JSON with keys: projectName, summary, structureNotes (array of strings), files (array of {path, content}), readme, linkedinPost.
- Every file path must use forward slashes. Include README.md in files AND as readme field.`,
      },
      {
        role: "user",
        content: `Project name hint: ${projectName ?? "Untitled"}
Number of uploaded files: ${files.length}

SOURCE FILES:
"""
${context}
"""

Return reorganized files with improved structure, a complete README, and a LinkedIn post.`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = safeParseJson(raw);
  const result = refactorResultSchema.safeParse(parsed);

  if (result.success) {
    const readmePath = result.data.files.find(
      (f) => f.path.toLowerCase() === "readme.md",
    );
    return {
      ...result.data,
      readme: readmePath?.content ?? result.data.readme,
    };
  }

  throw new Error("AI could not structure the project. Try uploading fewer or smaller files.");
}

/** Parse pasted LinkedIn profile/projects text into importable project entries. */
export async function parseLinkedInProjects(
  profileUrl: string,
  pastedText: string,
): Promise<
  Array<{ name: string; description: string; highlights: string[] }>
> {
  const client = getAIClient();

  const completion = await client.chat.completions.create({
    model: MODELS.default,
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `Extract portfolio/resume projects from LinkedIn-style profile text. Return JSON: { "projects": [ { "name", "description", "highlights": [] } ] }. Only include real projects/experiences — do not invent. If text is sparse, return fewer projects.`,
      },
      {
        role: "user",
        content: `LinkedIn profile URL: ${profileUrl}

PASTED PROFILE / PROJECTS TEXT:
"""
${pastedText.slice(0, 12000)}
"""`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = safeParseJson(raw) as {
    projects?: Array<{
      name?: string;
      description?: string;
      highlights?: string[];
    }>;
  };

  return (parsed.projects ?? [])
    .filter((p) => p.name?.trim())
    .map((p) => ({
      name: p.name!.trim(),
      description: (p.description ?? "").trim(),
      highlights: (p.highlights ?? []).filter(Boolean),
    }));
}
