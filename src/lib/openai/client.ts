import OpenAI from "openai";

let _client: OpenAI | null = null;

/** Lazily instantiate the OpenAI client so the app builds without a key set. */
export function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is not configured. Add it to your environment to enable AI features.",
    );
  }
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

export const MODELS = {
  /** Fast + cheap. Used for most generations. */
  default: process.env.OPENAI_MODEL || "gpt-4o-mini",
  /** Higher quality. Used for analysis + long-form outputs. */
  heavy: process.env.OPENAI_MODEL_HEAVY || "gpt-4o",
} as const;

export function isOpenAIConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}
