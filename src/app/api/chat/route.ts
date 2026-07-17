import { requireSessionUser } from "@/lib/auth/session";
import { isAppError, toErrorResponse } from "@/lib/errors/app-error";
import { env, isAiConfigured } from "@/config/env";
import { sendChatMessageSchema } from "@/lib/validation/schemas";
import { conversationsRepository, messagesRepository } from "@/server/repositories/assistant-repository";
import { fileChunksRepository, filesRepository } from "@/server/repositories/files-repository";
import { subjectsRepository } from "@/server/repositories/academic-repository";
import { aiUsageRepository } from "@/server/repositories/misc-repository";
import { getAiProvider } from "@/lib/ai/provider";
import {
  buildChatSystemPrompt,
  buildChatUserPrompt,
  buildHeuristicChatAnswer,
  retrieveChatContext,
  toMessageSources,
} from "@/server/services/chat-assistant";
import type { MessageSource } from "@/types/domain";

export const runtime = "nodejs";

function ndjson(event: Record<string, unknown>): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(event)}\n`);
}

export async function POST(request: Request) {
  let userId: string;
  try {
    const user = await requireSessionUser();
    userId = user.userId;
  } catch (error) {
    const { code, message } = toErrorResponse(error);
    return Response.json({ code, message }, { status: isAppError(error) ? error.httpStatus : 500 });
  }

  const body = await request.json().catch(() => null);
  const parsed = sendChatMessageSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ code: "VALIDATION", message: parsed.error.issues[0]?.message ?? "Datos invalidos" }, { status: 400 });
  }
  const input = parsed.data;

  if ((await aiUsageRepository.countToday(userId)) >= env.AI_DAILY_REQUEST_LIMIT) {
    return Response.json(
      { code: "LIMIT_EXCEEDED", message: "Alcanzaste el limite diario de solicitudes de IA." },
      { status: 429 },
    );
  }

  // Resolve authorized file ids strictly from the user's own records — never
  // trust file ids from the client without re-checking ownership here.
  let fileIds: string[] = [];
  if (input.scope.type === "subject") {
    try {
      await subjectsRepository.get(userId, input.scope.subjectId);
    } catch (error) {
      const { code, message } = toErrorResponse(error);
      return Response.json({ code, message }, { status: isAppError(error) ? error.httpStatus : 500 });
    }
    const subjectFiles = await filesRepository.listBySubject(userId, input.scope.subjectId);
    fileIds = subjectFiles.filter((f) => f.status === "listo").map((f) => f.id);
  } else if (input.scope.type === "files") {
    const checks = await Promise.all(
      input.scope.fileIds.map(async (id) => {
        try {
          const file = await filesRepository.get(userId, id);
          return file.status === "listo" ? id : null;
        } catch {
          return null;
        }
      }),
    );
    fileIds = checks.filter((id): id is string => id !== null);
  }

  const fileNameEntries = await Promise.all(
    fileIds.map(async (id) => {
      const file = await filesRepository.get(userId, id);
      return [id, file.originalName] as const;
    }),
  );
  const fileNameById = new Map(fileNameEntries);
  const chunks = fileIds.length > 0 ? await fileChunksRepository.listByFiles(userId, fileIds) : [];
  const context = retrieveChatContext(chunks, fileNameById, input.message);

  const conversation = input.conversationId
    ? await conversationsRepository.get(userId, input.conversationId)
    : await conversationsRepository.create(userId, input.message.slice(0, 60), input.scope);

  await messagesRepository.create(userId, conversation.id, "user", input.message, []);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let fullText = "";
      let sources: MessageSource[] = [];
      try {
        if (isAiConfigured && (context.length > 0 || input.scope.type === "general")) {
          const provider = await getAiProvider();
          const system = buildChatSystemPrompt(input.mode);
          const prompt = buildChatUserPrompt(
            context.map((c) => ({ chunk: c.chunk, fileName: c.fileName })),
            input.message,
          );
          for await (const token of provider.streamText({ system, prompt, maxTokens: 1024 })) {
            fullText += token;
            controller.enqueue(ndjson({ type: "token", text: token }));
          }
          sources = toMessageSources(context, input.message);
          await aiUsageRepository.record(userId, {
            feature: "chat",
            provider: "anthropic",
            inputTokens: 0,
            outputTokens: 0,
          });
        } else {
          const heuristic = buildHeuristicChatAnswer(context, input.message, input.mode);
          fullText = heuristic.content;
          sources = heuristic.sources;
          controller.enqueue(ndjson({ type: "token", text: fullText }));
          await aiUsageRepository.record(userId, {
            feature: "chat",
            provider: "heuristico",
            inputTokens: 0,
            outputTokens: 0,
          });
        }

        await messagesRepository.create(userId, conversation.id, "assistant", fullText, sources);
        controller.enqueue(ndjson({ type: "done", conversationId: conversation.id, sources }));
      } catch (error) {
        const { message } = toErrorResponse(error);
        controller.enqueue(ndjson({ type: "error", message }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}
