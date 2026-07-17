import Link from "next/link";
import { MessageSquarePlus } from "lucide-react";
import { requireSessionUser } from "@/lib/auth/session";
import { isAiConfigured } from "@/config/env";
import { subjectsRepository } from "@/server/repositories/academic-repository";
import { filesRepository } from "@/server/repositories/files-repository";
import { conversationsRepository, messagesRepository } from "@/server/repositories/assistant-repository";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChatPanel } from "@/features/ai-assistant/chat-panel";
import type { ConversationScope } from "@/types/domain";

export default async function AsistentePage({
  searchParams,
}: {
  searchParams: Promise<{ conversationId?: string }>;
}) {
  const user = await requireSessionUser();
  const { conversationId } = await searchParams;

  const subjects = (await subjectsRepository.list(user.userId)).map((s) => ({ id: s.id, name: s.name }));
  const files = (await filesRepository.list(user.userId))
    .filter((f) => f.status === "listo")
    .map((f) => ({ id: f.id, name: f.originalName }));
  const conversations = await conversationsRepository.list(user.userId);

  let activeConversationId: string | null = null;
  let initialScope: ConversationScope = { type: "general" };
  let initialMessages = [] as Awaited<ReturnType<typeof messagesRepository.listByConversation>>;

  if (conversationId) {
    try {
      const conversation = await conversationsRepository.get(user.userId, conversationId);
      activeConversationId = conversation.id;
      initialScope = conversation.scope;
      initialMessages = await messagesRepository.listByConversation(user.userId, conversation.id);
    } catch {
      activeConversationId = null;
    }
  }

  return (
    <div>
      <PageHeader
        title="Asistente"
        description="Conversa con el asistente sobre tu material. Solo responde con lo que autorizaste."
        actions={
          !isAiConfigured ? (
            <Badge variant="secondary">Modo heuristico (sin IA configurada)</Badge>
          ) : undefined
        }
      />

      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        <aside className="hidden md:block">
          <Link
            href="/asistente"
            className="mb-2 flex items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
          >
            <MessageSquarePlus className="size-4" aria-hidden="true" />
            Nueva conversacion
          </Link>
          <ul className="space-y-1">
            {conversations.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/asistente?conversationId=${c.id}`}
                  className={cn(
                    "block truncate rounded-md px-3 py-2 text-sm hover:bg-accent",
                    c.id === activeConversationId && "bg-accent font-medium",
                  )}
                >
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        <ChatPanel
          subjects={subjects}
          files={files}
          initialConversationId={activeConversationId}
          initialScope={initialScope}
          initialMessages={initialMessages}
        />
      </div>
    </div>
  );
}
