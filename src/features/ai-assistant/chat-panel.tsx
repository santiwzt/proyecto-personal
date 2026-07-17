"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import type { ChatMode } from "@/server/services/chat-assistant";
import type { ConversationScope, Message, MessageSource } from "@/types/domain";

const MODE_OPTIONS: { value: ChatMode; label: string }[] = [
  { value: "explicame", label: "Explicame" },
  { value: "resumime", label: "Resumime" },
  { value: "preguntame", label: "Preguntame" },
  { value: "corregime", label: "Corregime" },
  { value: "repaso_rapido", label: "Repaso rapido" },
  { value: "preparame", label: "Preparame para el examen" },
];

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources: MessageSource[];
}

export interface ChatPanelProps {
  subjects: { id: string; name: string }[];
  files: { id: string; name: string }[];
  initialConversationId: string | null;
  initialScope: ConversationScope;
  initialMessages: Message[];
}

function scopeKey(scope: ConversationScope): string {
  if (scope.type === "subject") return `subject:${scope.subjectId}`;
  if (scope.type === "files") return "files";
  return "general";
}

export function ChatPanel({ subjects, files, initialConversationId, initialScope, initialMessages }: ChatPanelProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [conversationId, setConversationId] = React.useState(initialConversationId);
  const [scopeSelection, setScopeSelection] = React.useState(scopeKey(initialScope));
  const [selectedFileIds, setSelectedFileIds] = React.useState<string[]>(
    initialScope.type === "files" ? initialScope.fileIds : [],
  );
  const [mode, setMode] = React.useState<ChatMode>("explicame");
  const [input, setInput] = React.useState("");
  const [messages, setMessages] = React.useState<ChatMessage[]>(
    initialMessages.map((m) => ({ role: m.role, content: m.content, sources: m.sources })),
  );
  const [isStreaming, setIsStreaming] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function currentScope(): ConversationScope {
    if (scopeSelection === "general") return { type: "general" };
    if (scopeSelection === "files") return { type: "files", fileIds: selectedFileIds };
    return { type: "subject", subjectId: scopeSelection.replace("subject:", "") };
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || isStreaming) return;
    const scope = currentScope();
    if (scope.type === "files" && scope.fileIds.length === 0) {
      toast({ variant: "destructive", title: "Elegi al menos un archivo para este modo de consulta." });
      return;
    }

    setMessages((prev) => [...prev, { role: "user", content: text, sources: [] }, { role: "assistant", content: "", sources: [] }]);
    setInput("");
    setIsStreaming(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, scope, message: text, mode }),
      });

      if (!response.ok || !response.body) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message ?? "No se pudo contactar al asistente.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as
            | { type: "token"; text: string }
            | { type: "done"; conversationId: string; sources: MessageSource[] }
            | { type: "error"; message: string };

          if (event.type === "token") {
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last?.role === "assistant") last.content += event.text;
              return next;
            });
          } else if (event.type === "done") {
            setConversationId(event.conversationId);
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last?.role === "assistant") last.sources = event.sources;
              return next;
            });
            router.refresh();
          } else if (event.type === "error") {
            toast({ variant: "destructive", title: "El asistente no pudo responder", description: event.message });
          }
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "No se pudo enviar el mensaje",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <div className="flex h-[calc(100dvh-10rem)] flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3 rounded-md border border-border p-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="scope-select">Contexto</Label>
          <Select value={scopeSelection} onValueChange={setScopeSelection}>
            <SelectTrigger id="scope-select" className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General (sin archivos)</SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={`subject:${s.id}`}>
                  Materia: {s.name}
                </SelectItem>
              ))}
              {files.length > 0 && <SelectItem value="files">Archivos especificos</SelectItem>}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="mode-select">Modo</Label>
          <Select value={mode} onValueChange={(v) => setMode(v as ChatMode)}>
            <SelectTrigger id="mode-select" className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {scopeSelection === "files" && (
        <div className="flex flex-wrap gap-3 rounded-md border border-dashed border-border p-3">
          {files.map((f) => (
            <label key={f.id} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={selectedFileIds.includes(f.id)}
                onCheckedChange={(checked) =>
                  setSelectedFileIds((prev) => (checked ? [...prev, f.id] : prev.filter((id) => id !== f.id)))
                }
              />
              {f.name}
            </label>
          ))}
        </div>
      )}

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto rounded-md border border-border p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Pregunta algo sobre tu material. El asistente solo usa el contexto que elegiste arriba.
          </p>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
              <div
                className={
                  m.role === "user"
                    ? "inline-block max-w-[85%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
                    : "inline-block max-w-[85%] rounded-lg bg-muted px-3 py-2 text-sm"
                }
              >
                {m.content || (isStreaming && i === messages.length - 1 ? "…" : "")}
              </div>
              {m.sources.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {m.sources.map((s, si) => (
                    <Badge key={si} variant="outline" className="gap-1 text-xs" title={s.excerpt}>
                      <BookOpen className="size-3" aria-hidden="true" />
                      {s.fileName}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="flex items-end gap-2">
        <Label htmlFor="chat-input" className="sr-only">
          Mensaje
        </Label>
        <Textarea
          id="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Escribi tu pregunta..."
          rows={2}
          className="flex-1"
        />
        <Button
          type="button"
          onClick={handleSend}
          disabled={isStreaming || !input.trim()}
          aria-label="Enviar mensaje"
        >
          {isStreaming ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
        </Button>
      </div>
    </div>
  );
}
