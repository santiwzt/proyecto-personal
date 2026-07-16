"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { formatDateTime } from "@/lib/dates";
import { updateTopicStatusAction } from "@/server/actions/academic-actions";
import type { StudyTopic, TopicStatus } from "@/types/domain";
import { TOPIC_STATUS_LABELS } from "@/features/study/labels";
import { PracticePanel } from "@/features/study/practice-panel";

export function TopicRow({ topic, files }: { topic: StudyTopic; files: { id: string; name: string }[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  function handleStatusChange(status: TopicStatus) {
    startTransition(async () => {
      try {
        await updateTopicStatusAction(topic.id, { status });
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "No se pudo actualizar el tema",
          description: error instanceof Error ? error.message : undefined,
        });
      }
    });
  }

  return (
    <div className="space-y-3 border-b border-border py-4 last:border-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium">{topic.name}</p>
          {topic.lastPracticedAt ? (
            <p className="text-xs text-muted-foreground">Ultima practica: {formatDateTime(topic.lastPracticedAt)}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Todavia sin practicar</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isPending && <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden="true" />}
          <Label htmlFor={`status-${topic.id}`} className="sr-only">
            Estado de {topic.name}
          </Label>
          <Select value={topic.status} onValueChange={(v) => handleStatusChange(v as TopicStatus)}>
            <SelectTrigger id={`status-${topic.id}`} className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(TOPIC_STATUS_LABELS) as TopicStatus[]).map((status) => (
                <SelectItem key={status} value={status}>
                  {TOPIC_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-xs text-muted-foreground">Confianza declarada: {topic.selfConfidence}/100</p>
          <Progress value={topic.selfConfidence} className="h-1.5" />
        </div>
        <div>
          <p className="mb-1 text-xs text-muted-foreground">Confianza estimada: {topic.estimatedConfidence}/100</p>
          <Progress value={topic.estimatedConfidence} className="h-1.5" />
        </div>
      </div>

      {topic.commonMistakes.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {topic.commonMistakes.map((mistake, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              {mistake}
            </Badge>
          ))}
        </div>
      )}

      <PracticePanel topicId={topic.id} topicName={topic.name} subjectFiles={files} />
    </div>
  );
}
