import { AppError } from "@/lib/errors/app-error";
import type { AiProvider } from "./provider";

/**
 * Used when no ANTHROPIC_API_KEY is configured. It deliberately does NOT
 * fabricate model-like text — every AI-backed feature (chat, question
 * generation, grading) has its own real, deterministic heuristic
 * implementation and checks `isAiConfigured` / catches
 * AI_PROVIDER_UNAVAILABLE to switch to it. This provider exists so the
 * provider interface has a total implementation, not to be called directly.
 */
export function createHeuristicProvider(): AiProvider {
  const unavailable = (): never => {
    throw new AppError(
      "AI_PROVIDER_UNAVAILABLE",
      "No hay un proveedor de IA configurado. Esta funcion esta usando su modo heuristico (sin IA).",
    );
  };

  return {
    name: "heuristico",
    async generateText() {
      return unavailable();
    },
    async generateStructured() {
      return unavailable();
    },
    async *streamText() {
      return unavailable();
    },
  };
}
