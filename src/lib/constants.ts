import type { ArtifactType, GenerationType } from "@/lib/types/database";

export const APP_NAME = "ProjectForge AI";
export const APP_TAGLINE =
  "Turn raw project artifacts into polished, professional outputs.";

// ── Generation catalog ──────────────────────────────────────────────────────
export type GenerationCategory =
  | "career"
  | "writeups"
  | "engineering"
  | "applications";

export interface GenerationMeta {
  type: GenerationType;
  label: string;
  short: string;
  description: string;
  icon: string; // lucide-react icon name
  category: GenerationCategory;
  /** Rough output format the renderer should expect. */
  format: "bullets" | "markdown" | "sections" | "slides" | "star";
  accent: string; // tailwind gradient classes
}

export const GENERATION_CATALOG: GenerationMeta[] = [
  {
    type: "resume_bullets",
    label: "Resume Bullet Points",
    short: "Resume Bullets",
    description:
      "Achievement-focused, quantified bullets ready to paste into your résumé.",
    icon: "ListChecks",
    category: "career",
    format: "bullets",
    accent: "from-blue-500 to-indigo-500",
  },
  {
    type: "star_response",
    label: "STAR Interview Responses",
    short: "STAR Responses",
    description:
      "Situation → Task → Action → Result stories for behavioral interviews.",
    icon: "MessagesSquare",
    category: "career",
    format: "star",
    accent: "from-emerald-500 to-teal-500",
  },
  {
    type: "cover_letter",
    label: "Cover Letter Paragraphs",
    short: "Cover Letter",
    description:
      "Tailored paragraphs connecting this project to a role you want.",
    icon: "Mail",
    category: "career",
    format: "markdown",
    accent: "from-rose-500 to-pink-500",
  },
  {
    type: "portfolio_page",
    label: "Portfolio Project Page",
    short: "Portfolio Page",
    description:
      "Summary, deep-dive, features, and lessons learned for your site.",
    icon: "LayoutTemplate",
    category: "writeups",
    format: "sections",
    accent: "from-violet-500 to-purple-500",
  },
  {
    type: "linkedin_post",
    label: "LinkedIn Post",
    short: "LinkedIn Post",
    description:
      "Announcement, achievement, or technical-breakdown posts that get engagement.",
    icon: "Linkedin",
    category: "writeups",
    format: "markdown",
    accent: "from-sky-500 to-blue-600",
  },
  {
    type: "presentation",
    label: "Presentation Slide Deck",
    short: "Slide Deck",
    description:
      "5-minute and 10-minute decks with per-slide speaker notes.",
    icon: "Presentation",
    category: "writeups",
    format: "slides",
    accent: "from-amber-500 to-orange-500",
  },
  {
    type: "readme",
    label: "GitHub README",
    short: "README",
    description:
      "Install, usage, architecture, and tech-stack sections in Markdown.",
    icon: "FileCode2",
    category: "engineering",
    format: "markdown",
    accent: "from-slate-500 to-gray-700",
  },
  {
    type: "tech_docs",
    label: "Technical Documentation",
    short: "Tech Docs",
    description:
      "Architecture overview, components, and build instructions.",
    icon: "BookText",
    category: "engineering",
    format: "sections",
    accent: "from-cyan-500 to-sky-500",
  },
  {
    type: "architecture_overview",
    label: "Architecture Overview",
    short: "Architecture",
    description:
      "High-level system design with a Mermaid component diagram.",
    icon: "Network",
    category: "engineering",
    format: "markdown",
    accent: "from-fuchsia-500 to-pink-500",
  },
  {
    type: "scholarship_app",
    label: "Scholarship / Competition Response",
    short: "Scholarship",
    description:
      "Application answers that frame impact for non-technical reviewers.",
    icon: "GraduationCap",
    category: "applications",
    format: "markdown",
    accent: "from-green-500 to-emerald-600",
  },
];

export const GENERATION_MAP: Record<GenerationType, GenerationMeta> =
  GENERATION_CATALOG.reduce(
    (acc, item) => {
      acc[item.type] = item;
      return acc;
    },
    {} as Record<GenerationType, GenerationMeta>,
  );

export const CATEGORY_LABELS: Record<GenerationCategory, string> = {
  career: "Career",
  writeups: "Write-ups",
  engineering: "Engineering",
  applications: "Applications",
};

// ── Generation settings options ─────────────────────────────────────────────
export const TONE_OPTIONS = [
  { value: "professional", label: "Professional" },
  { value: "confident", label: "Confident" },
  { value: "enthusiastic", label: "Enthusiastic" },
  { value: "concise", label: "Concise & punchy" },
  { value: "academic", label: "Academic" },
  { value: "casual", label: "Casual" },
] as const;

export const LENGTH_OPTIONS = [
  { value: "short", label: "Short" },
  { value: "medium", label: "Medium" },
  { value: "long", label: "Long / detailed" },
] as const;

export const AUDIENCE_OPTIONS = [
  { value: "recruiter", label: "Recruiter / hiring manager" },
  { value: "technical", label: "Technical / engineering" },
  { value: "non_technical", label: "Non-technical reviewer" },
  { value: "admissions", label: "College admissions" },
  { value: "general", label: "General audience" },
] as const;

export type GenerationSettings = {
  tone: (typeof TONE_OPTIONS)[number]["value"];
  length: (typeof LENGTH_OPTIONS)[number]["value"];
  audience: (typeof AUDIENCE_OPTIONS)[number]["value"];
  notes?: string;
};

export const DEFAULT_SETTINGS: GenerationSettings = {
  tone: "professional",
  length: "medium",
  audience: "recruiter",
};

// ── Artifact catalog ────────────────────────────────────────────────────────
export interface ArtifactMeta {
  type: ArtifactType;
  label: string;
  icon: string;
  accept?: string;
}

export const ARTIFACT_META: Record<ArtifactType, ArtifactMeta> = {
  github_repo: { type: "github_repo", label: "GitHub Repo", icon: "Github" },
  zip: { type: "zip", label: "ZIP Archive", icon: "FileArchive", accept: ".zip" },
  image: {
    type: "image",
    label: "Image",
    icon: "Image",
    accept: "image/*",
  },
  video: {
    type: "video",
    label: "Video",
    icon: "Video",
    accept: "video/*",
  },
  pdf: { type: "pdf", label: "PDF", icon: "FileText", accept: ".pdf" },
  document: {
    type: "document",
    label: "Document",
    icon: "FileText",
    accept: ".txt,.md,.doc,.docx,.rtf,.csv,.json",
  },
  cad: {
    type: "cad",
    label: "CAD File",
    icon: "Box",
    accept: ".stl,.step,.stp,.iges,.igs,.f3d,.sldprt,.dwg,.dxf",
  },
  other: { type: "other", label: "Other File", icon: "File" },
};

export const STORAGE_BUCKET = "artifacts";
export const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB

/** Best-effort mapping from a MIME type / filename to an ArtifactType. */
export function inferArtifactType(
  filename: string,
  mime?: string | null,
): ArtifactType {
  const lower = filename.toLowerCase();
  const ext = lower.includes(".") ? lower.split(".").pop()! : "";
  if (mime?.startsWith("image/")) return "image";
  if (mime?.startsWith("video/")) return "video";
  if (ext === "zip" || mime === "application/zip") return "zip";
  if (ext === "pdf" || mime === "application/pdf") return "pdf";
  if (["stl", "step", "stp", "iges", "igs", "f3d", "sldprt", "dwg", "dxf"].includes(ext))
    return "cad";
  if (["txt", "md", "doc", "docx", "rtf", "csv", "json"].includes(ext))
    return "document";
  return "other";
}
