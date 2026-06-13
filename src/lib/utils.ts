import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number | null | undefined, decimals = 1) {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${parseFloat(value.toFixed(decimals))} ${sizes[i] ?? "B"}`;
}

export function truncate(str: string, length: number) {
  if (str.length <= length) return str;
  return `${str.slice(0, length).trimEnd()}…`;
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function initials(name: string | null | undefined) {
  if (!name) return "PF";
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Parse `owner/repo` out of a variety of GitHub URL formats. */
export function parseGitHubUrl(
  url: string,
): { owner: string; repo: string } | null {
  try {
    const cleaned = url.trim().replace(/\.git$/, "");
    const match = cleaned.match(
      /(?:github\.com[/:])([^/\s]+)\/([^/\s?#]+)/i,
    );
    if (match && match[1] && match[2]) {
      return { owner: match[1], repo: match[2] };
    }
    // Bare "owner/repo"
    const bare = cleaned.match(/^([\w.-]+)\/([\w.-]+)$/);
    if (bare && bare[1] && bare[2]) {
      return { owner: bare[1], repo: bare[2] };
    }
    return null;
  } catch {
    return null;
  }
}
