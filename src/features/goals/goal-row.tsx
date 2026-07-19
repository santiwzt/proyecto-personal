"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/dates";
import { deleteGoalAction, updateGoalProgressAction } from "@/server/actions/goals-actions";
import type { Goal } from "@/types/domain";

export function GoalRow({ goal }: { goal: Goal }) {
  const router = useRouter();
  const { toast } = useToast();
  const [progress, setProgress] = React.useState(goal.progress);
  const [isSavingProgress, startProgressTransition] = React.useTransition();
  const [isDeleting, startDeleteTransition] = React.useTransition();

  function commitProgress(value: number) {
    startProgressTransition(async () => {
      try {
        await updateGoalProgressAction(goal.id, { progress: value });
        router.refresh();
      } catch (error) {
        setProgress(goal.progress);
        toast({
          variant: "destructive",
          title: "No se pudo actualizar el progreso",
          description: error instanceof Error ? error.message : undefined,
        });
      }
    });
  }

  function handleDelete() {
    startDeleteTransition(async () => {
      try {
        await deleteGoalAction(goal.id);
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "No se pudo eliminar el objetivo",
          description: error instanceof Error ? error.message : undefined,
        });
      }
    });
  }

  return (
    <li className="flex flex-col gap-3 py-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium">{goal.title}</p>
          {goal.description ? <p className="text-sm text-muted-foreground">{goal.description}</p> : null}
          {goal.targetDate ? (
            <p className="text-xs text-muted-foreground">Meta: {formatDate(`${goal.targetDate}T00:00:00-03:00`)}</p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Eliminar objetivo ${goal.title}`}
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 className="size-4" aria-hidden="true" />
          )}
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <Progress value={progress} className="flex-1" />
        <span className="w-10 text-right text-sm tabular-nums text-muted-foreground">
          {isSavingProgress ? <Loader2 className="ml-auto size-3 animate-spin" aria-hidden="true" /> : `${progress}%`}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={progress}
        onChange={(e) => setProgress(Number(e.target.value))}
        onMouseUp={(e) => commitProgress(Number((e.target as HTMLInputElement).value))}
        onTouchEnd={(e) => commitProgress(Number((e.target as HTMLInputElement).value))}
        onKeyUp={(e) => commitProgress(Number((e.target as HTMLInputElement).value))}
        aria-label={`Progreso de ${goal.title}`}
        className="w-full accent-primary"
      />
    </li>
  );
}
