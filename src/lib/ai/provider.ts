import { env, isAiConfigured } from "@/config/env";

/**
 * Thin provider abstraction so the rest of the app never imports the
 * Anthropic SDK directly. Swapping models/providers means editing this file
 * (and anthropic-provider.ts) only. Every caller must handle
 * `configured: false` gracefully — it is not an error state, it's "demo/
 * heuristic mode", which must remain a fully usable product experience.
 */

export interface AiTextRequest {
  system: string;
  prompt: string;
  maxTokens?: number;
}

export interface AiTextResponse {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

export interface AiStructuredRequest<T> extends AiTextRequest {
  /** Validates and parses the model's JSON output; throw to trigger a retry-less failure. */
  parse: (raw: string) => T;
}

export interface AiProvider {
  readonly name: "anthropic" | "heuristico";
  generateText(request: AiTextRequest): Promise<AiTextResponse>;
  generateStructured<T>(request: AiStructuredRequest<T>): Promise<{ data: T; inputTokens: number; outputTokens: number }>;
  streamText(request: AiTextRequest): AsyncGenerator<string, void, unknown>;
}

let cachedProvider: AiProvider | null = null;

export async function getAiProvider(): Promise<AiProvider> {
  if (cachedProvider) return cachedProvider;
  if (isAiConfigured && env.ANTHROPIC_API_KEY) {
    const { createAnthropicProvider } = await import("./anthropic-provider");
    cachedProvider = createAnthropicProvider(env.ANTHROPIC_API_KEY, env.AI_MODEL);
  } else {
    const { createHeuristicProvider } = await import("./heuristic-provider");
    cachedProvider = createHeuristicProvider();
  }
  return cachedProvider;
}
