"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { formatRelativeDay } from "@/lib/dates";
import { completeTaskAction, deleteTaskAction } from "@/server/actions/academic-actions";
import type { Task } from "@/types/domain";

const PRIORITY_LABELS: Record<Task["priority"], string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
};

export function TaskItem({ task, isOverdue }: { task: Task; isOverdue: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  function handleToggle(checked: boolean | "indeterminate") {
    if (checked !== true) return;
    startTransition(async () => {
      try {
        await completeTaskAction(task.id);
        toast({ title: `"${task.title}" marcada como completada.` });
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "No se pudo completar la tarea",
          description: error instanceof Error ? error.message : undefined,
        });
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteTaskAction(task.id);
        toast({ title: `"${task.title}" eliminada.` });
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "No se pudo eliminar la tarea",
          description: error instanceof Error ? error.message : undefined,
        });
      }
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
      <div className="flex items-center gap-3">
        <Checkbox
          checked={false}
          onCheckedChange={handleToggle}
          disabled={isPending}
          aria-label={`Marcar "${task.title}" como completada`}
        />
        <div>
          <p className="text-sm font-medium">{task.title}</p>
          {task.dueAt ? (
            <p className="text-xs text-muted-foreground">Vence {formatRelativeDay(task.dueAt)}</p>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isOverdue ? (
          <Badge variant="destructive">Vencida</Badge>
        ) : (
          <Badge variant="outline">{PRIORITY_LABELS[task.priority]}</Badge>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          disabled={isPending}
          aria-label={`Eliminar "${task.title}"`}
        >
          {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Trash2 className="size-4" />}
        </Button>
      </div>
    </div>
  );
}
