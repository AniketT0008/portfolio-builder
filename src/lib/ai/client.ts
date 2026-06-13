import OpenAI from "openai";

/**
 * Google Gemini exposes an OpenAI-compatible REST surface, so we keep using the
 * `openai` SDK and simply point it at Gemini's endpoint. This lets the rest of
 * the app (chat.completions + JSON response_format) stay unchanged.
 * Docs: https://ai.google.dev/gemini-api/docs/openai
 */
const GEMINI_BASE_URL =
  process.env.GEMINI_BASE_URL ||
  "https://generativelanguage.googleapis.com/v1beta/openai/";

let _client: OpenAI | null = null;

/** Lazily instantiate the AI client so the app builds without a key set. */
export function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Add it to your environment to enable AI features.",
    );
  }
  if (!_client) {
    _client = new OpenAI({ apiKey, baseURL: GEMINI_BASE_URL });
  }
  return _client;
}

export const MODELS = {
  /** Fast + free-tier friendly. Used for most generations. */
  default: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  /** Higher quality. Used for analysis + long-form outputs. */
  heavy: process.env.GEMINI_MODEL_HEAVY || "gemini-2.5-flash",
} as const;

export function isAIConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}
