import { STORAGE_BUCKET } from "@/lib/constants";
import type { Artifact, Project } from "@/lib/types/database";
import type { TypedSupabaseClient } from "@/lib/supabase/types";
import { parseGitHubUrl } from "@/lib/utils";

const MAX_FILE_CHARS = 12_000;
const MAX_TOTAL_CHARS = 60_000;
const TEXT_EXTENSIONS = [
  "txt", "md", "markdown", "json", "csv", "yml", "yaml", "toml", "ini",
  "js", "jsx", "ts", "tsx", "py", "java", "c", "cpp", "h", "hpp", "cs",
  "go", "rs", "rb", "php", "swift", "kt", "scala", "sh", "bash", "sql",
  "html", "css", "scss", "vue", "svelte", "xml", "ino", "m", "r",
];

function isTextual(name: string, mime?: string | null) {
  if (mime?.startsWith("text/")) return true;
  const ext = name.toLowerCase().split(".").pop() ?? "";
  return TEXT_EXTENSIONS.includes(ext);
}

function clamp(text: string, max = MAX_FILE_CHARS) {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n…[truncated ${text.length - max} chars]`;
}

// ── GitHub ingestion ────────────────────────────────────────────────────────
async function gh(path: string, raw = false): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: raw ? "application/vnd.github.raw" : "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "ProjectForge-AI",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return fetch(`https://api.github.com${path}`, {
    headers,
    cache: "no-store",
  });
}

export async function fetchGitHubContext(url: string): Promise<string> {
  const parsed = parseGitHubUrl(url);
  if (!parsed) return `GitHub URL (unparseable): ${url}`;
  const { owner, repo } = parsed;
  const lines: string[] = [`GitHub repository: ${owner}/${repo}`];
  let defaultBranch = "main";

  try {
    const repoRes = await gh(`/repos/${owner}/${repo}`);
    if (repoRes.ok) {
      const r = (await repoRes.json()) as Record<string, any>;
      if (typeof r.default_branch === "string") defaultBranch = r.default_branch;
      lines.push(
        `Description: ${r.description ?? "(none)"}`,
        `Primary language: ${r.language ?? "(unknown)"}`,
        `Stars: ${r.stargazers_count ?? 0}, Forks: ${r.forks_count ?? 0}`,
        `Topics: ${(r.topics ?? []).join(", ") || "(none)"}`,
        `Homepage: ${r.homepage || "(none)"}`,
        `Default branch: ${defaultBranch}`,
        `Created: ${r.created_at}, Last push: ${r.pushed_at}`,
      );
    } else if (repoRes.status === 404) {
      lines.push("(Repository not found or private.)");
    } else {
      lines.push(`(GitHub API returned ${repoRes.status}.)`);
    }

    const langRes = await gh(`/repos/${owner}/${repo}/languages`);
    if (langRes.ok) {
      const langs = (await langRes.json()) as Record<string, number>;
      const names = Object.keys(langs);
      if (names.length) lines.push(`Languages: ${names.join(", ")}`);
    }

    const readmeRes = await gh(`/repos/${owner}/${repo}/readme`, true);
    if (readmeRes.ok) {
      const readme = await readmeRes.text();
      lines.push("\n--- README ---\n" + clamp(readme));
    }

    // Shallow file tree for structural signal (uses the repo's default branch).
    const treeRes = await gh(
      `/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
    );
    if (treeRes.ok) {
      const tree = (await treeRes.json()) as {
        tree?: { path: string; type: string }[];
        truncated?: boolean;
      };
      const paths = (tree.tree ?? [])
        .filter((t) => t.type === "blob")
        .map((t) => t.path)
        .slice(0, 200);
      if (paths.length) {
        lines.push("\n--- File structure (partial) ---\n" + paths.join("\n"));
      }
    }
  } catch (err) {
    lines.push(
      `(Failed to fully fetch repo: ${
        err instanceof Error ? err.message : "unknown error"
      })`,
    );
  }

  return lines.join("\n");
}

// ── ZIP ingestion ───────────────────────────────────────────────────────────
async function extractZipContext(buffer: ArrayBuffer): Promise<string> {
  try {
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(buffer);
    const names = Object.keys(zip.files).filter((n) => !zip.files[n]!.dir);
    const lines: string[] = [
      `Archive contains ${names.length} files.`,
      "--- File listing ---",
      ...names.slice(0, 200),
    ];

    // Pull a few key text files for content (README, package manifests, etc).
    const priority = names
      .filter((n) => isTextual(n))
      .sort((a, b) => {
        const score = (s: string) =>
          /readme/i.test(s) ? 0 : /package\.json|requirements|cargo|pom|go\.mod/i.test(s) ? 1 : 2;
        return score(a) - score(b);
      })
      .slice(0, 6);

    for (const name of priority) {
      const file = zip.files[name];
      if (!file) continue;
      const content = await file.async("string");
      lines.push(`\n--- ${name} ---\n${clamp(content, 4000)}`);
    }
    return lines.join("\n");
  } catch (err) {
    return `(Failed to read ZIP archive: ${
      err instanceof Error ? err.message : "unknown error"
    })`;
  }
}

// ── Per-artifact context ────────────────────────────────────────────────────
async function describeArtifact(
  artifact: Artifact,
  supabase: TypedSupabaseClient,
): Promise<string> {
  const meta = artifact.metadata as Record<string, unknown> | null;
  const note = meta?.note ? `\nUser note: ${meta.note}` : "";
  const pasted =
    typeof meta?.pasted === "string"
      ? meta.pasted
      : typeof meta?.notes === "string"
        ? meta.notes
        : null;
  const header = `### Artifact: ${artifact.original_filename ?? artifact.type} (${artifact.type})${note}`;

  if (artifact.type === "github_repo" && artifact.github_url) {
    return `${header}\n${await fetchGitHubContext(artifact.github_url)}`;
  }

  if (!artifact.file_path) {
    if (pasted) {
      return `${header}\n--- Imported notes ---\n${clamp(pasted)}`;
    }
    return header;
  }

  // Download from Storage (RLS-scoped to the calling user).
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .download(artifact.file_path);

  if (error || !data) {
    return `${header}\n(Could not download file for analysis.)`;
  }

  const buffer = await data.arrayBuffer();

  if (artifact.type === "zip") {
    return `${header}\n${await extractZipContext(buffer)}`;
  }

  if (
    isTextual(
      artifact.original_filename ?? "",
      artifact.mime_type,
    )
  ) {
    const text = new TextDecoder().decode(buffer);
    return `${header}\n--- File contents ---\n${clamp(text)}`;
  }

  // Binary (image, video, pdf, cad): describe via metadata only.
  return `${header}\n(Binary ${artifact.type} file — analyzed by metadata. Size: ${
    artifact.file_size_bytes ?? "unknown"
  } bytes. MIME: ${artifact.mime_type ?? "unknown"}.)`;
}

export async function buildProjectContext(
  project: Pick<Project, "name" | "description">,
  artifacts: Artifact[],
  supabase: TypedSupabaseClient,
): Promise<string> {
  const parts: string[] = [
    `PROJECT NAME: ${project.name}`,
    `USER DESCRIPTION: ${project.description?.trim() || "(none provided)"}`,
    `ARTIFACT COUNT: ${artifacts.length}`,
    "",
  ];

  for (const artifact of artifacts) {
    parts.push(await describeArtifact(artifact, supabase));
    parts.push("");
    if (parts.join("\n").length > MAX_TOTAL_CHARS) {
      parts.push("…[remaining artifacts omitted to fit context window]");
      break;
    }
  }

  return clamp(parts.join("\n"), MAX_TOTAL_CHARS);
}
