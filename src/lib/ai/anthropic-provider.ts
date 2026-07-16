import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { AppError } from "@/lib/errors/app-error";
import type { AiProvider, AiStructuredRequest, AiTextRequest } from "./provider";

function extractText(content: Anthropic.Messages.ContentBlock[]): string {
  return content
    .filter((block): block is Anthropic.Messages.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
}

export function createAnthropicProvider(apiKey: string, model: string): AiProvider {
  const client = new Anthropic({ apiKey });

  return {
    name: "anthropic",

    async generateText({ system, prompt, maxTokens = 1024 }: AiTextRequest) {
      try {
        const response = await client.messages.create({
          model,
          max_tokens: maxTokens,
          system,
          messages: [{ role: "user", content: prompt }],
        });
        return {
          text: extractText(response.content),
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        };
      } catch (error) {
        console.error("Anthropic generateText failed:", error);
        throw new AppError("AI_PROVIDER_UNAVAILABLE");
      }
    },

    async generateStructured<T>(request: AiStructuredRequest<T>) {
      const response = await this.generateText(request);
      try {
        const data = request.parse(response.text);
        return { data, inputTokens: response.inputTokens, outputTokens: response.outputTokens };
      } catch (error) {
        console.error("Failed to parse structured AI response:", error);
        throw new AppError("AI_PROVIDER_UNAVAILABLE", "El asistente devolvio una respuesta invalida.");
      }
    },

    async *streamText({ system, prompt, maxTokens = 1024 }: AiTextRequest) {
      try {
        const stream = client.messages.stream({
          model,
          max_tokens: maxTokens,
          system,
          messages: [{ role: "user", content: prompt }],
        });
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            yield event.delta.text;
          }
        }
      } catch (error) {
        console.error("Anthropic streamText failed:", error);
        throw new AppError("AI_PROVIDER_UNAVAILABLE");
      }
    },
  };
}
