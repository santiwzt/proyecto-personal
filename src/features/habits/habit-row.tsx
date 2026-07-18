"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Check, Flame, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { archiveHabitAction, toggleHabitLogAction } from "@/server/actions/habits-actions";
import type { Habit } from "@/types/domain";
import type { HabitDay } from "@/server/services/habit-tracking";

export interface HabitRowProps {
  habit: Habit;
  week: HabitDay[];
  streak: number;
  weekCount: number;
}

export function HabitRow({ habit, week, streak, weekCount }: HabitRowProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const [pendingDate, setPendingDate] = React.useState<string | null>(null);

  function handleToggle(date: string) {
    setPendingDate(date);
    startTransition(async () => {
      try {
        await toggleHabitLogAction(habit.id, date);
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "No se pudo actualizar el habito",
          description: error instanceof Error ? error.message : undefined,
        });
      } finally {
        setPendingDate(null);
      }
    });
  }

  function handleArchive() {
    startTransition(async () => {
      try {
        await archiveHabitAction(habit.id);
        toast({ title: "Habito archivado." });
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "No se pudo archivar el habito",
          description: error instanceof Error ? error.message : undefined,
        });
      }
    });
  }

  return (
    <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">{habit.name}</span>
          {streak > 0 ? (
            <Badge variant="secondary" className="gap-1">
              <Flame className="size-3" aria-hidden="true" />
              {streak}
            </Badge>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">
          {weekCount} de {habit.targetPerWeek} dias esta semana
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {week.map((day) => {
            const date = parseISO(day.date);
            const isPendingDay = isPending && pendingDate === day.date;
            return (
              <button
                key={day.date}
                type="button"
                disabled={isPending}
                onClick={() => handleToggle(day.date)}
                aria-pressed={day.completed}
                aria-label={`${format(date, "EEEE d", { locale: es })}: ${day.completed ? "cumplido" : "no cumplido"}`}
                className={cn(
                  "flex size-8 flex-col items-center justify-center rounded-md border text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  day.completed
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:bg-accent",
                )}
              >
                {isPendingDay ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <>
                    <span className="leading-none">{format(date, "EEEEE", { locale: es })}</span>
                    {day.completed ? <Check className="size-3" aria-hidden="true" /> : null}
                  </>
                )}
              </button>
            );
          })}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Archivar habito ${habit.name}`}
          onClick={handleArchive}
          disabled={isPending}
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </li>
  );
}
