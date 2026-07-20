"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarPlus, ListPlus, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { CATEGORY_BADGE_CLASSES, CATEGORY_LABELS, COLEGIO_BADGE_CLASSES, TASK_BADGE_CLASSES } from "@/features/calendar/event-visuals";
import { formatTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { createTaskAction } from "@/server/actions/academic-actions";
import { createEventAction } from "@/server/actions/calendar-actions";
import type { EventCategory, TaskPriority } from "@/types/domain";

const PRIORITY_LABELS: Record<TaskPriority, string> = { baja: "Baja", media: "Media", alta: "Alta" };

export interface DayQuickAddExistingItem {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  kind: "event" | "exam" | "task" | "colegio";
  category?: EventCategory | null;
  isFullDay?: boolean;
}

export interface DayQuickAddTarget {
  dateStr: string;
  dateLabel: string;
  weekHref?: string;
  items?: DayQuickAddExistingItem[];
}

interface DayQuickAddDialogProps {
  target: DayQuickAddTarget | null;
  onOpenChange: (open: boolean) => void;
}

export function DayQuickAddDialog({ target, onOpenChange }: DayQuickAddDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const [kind, setKind] = React.useState<"evento" | "tarea">("evento");

  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState<EventCategory>("clase");
  const [startTime, setStartTime] = React.useState("09:00");
  const [endTime, setEndTime] = React.useState("10:00");
  const [dueTime, setDueTime] = React.useState("");
  const [priority, setPriority] = React.useState<TaskPriority>("media");

  function reset() {
    setKind("evento");
    setTitle("");
    setCategory("clase");
    setStartTime("09:00");
    setEndTime("10:00");
    setDueTime("");
    setPriority("media");
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!target || title.trim().length === 0) return;

    if (kind === "evento") {
      if (endTime <= startTime) {
        toast({
          variant: "destructive",
          title: "Horario invalido",
          description: "La hora de fin debe ser posterior a la hora de inicio.",
        });
        return;
      }
      startTransition(async () => {
        try {
          await createEventAction({
            title: title.trim(),
            category,
            startsAt: `${target.dateStr}T${startTime}:00-03:00`,
            endsAt: `${target.dateStr}T${endTime}:00-03:00`,
            location: null,
            isFixed: false,
            relatedExamId: null,
            relatedTaskId: null,
            relatedProjectId: null,
            notes: null,
          });
          toast({ title: "Evento creado correctamente." });
          reset();
          onOpenChange(false);
          router.refresh();
        } catch (error) {
          toast({
            variant: "destructive",
            title: "No se pudo crear el evento",
            description: error instanceof Error ? error.message : undefined,
          });
        }
      });
      return;
    }

    startTransition(async () => {
      try {
        await createTaskAction({
          title: title.trim(),
          description: null,
          dueAt: dueTime ? `${target.dateStr}T${dueTime}:00-03:00` : `${target.dateStr}T23:59:00-03:00`,
          estimatedMinutes: null,
          priority,
          subjectId: null,
          projectId: null,
          isFixed: false,
        });
        toast({ title: "Tarea creada correctamente." });
        reset();
        onOpenChange(false);
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "No se pudo crear la tarea",
          description: error instanceof Error ? error.message : undefined,
        });
      }
    });
  }

  return (
    <Dialog
      open={!!target}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="capitalize">{target?.dateLabel}</DialogTitle>
          <DialogDescription>Elegi que agregar y a que hora.</DialogDescription>
        </DialogHeader>

        {target?.items && target.items.length > 0 ? (
          <div className="space-y-1.5 rounded-md border border-border p-2">
            <p className="text-xs font-medium text-muted-foreground">Ya tenes esto ese dia</p>
            <ul className="space-y-1.5">
              {target.items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate">{item.title}</span>
                  <span className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
                    <span>{item.isFullDay ? "Todo el dia" : formatTime(item.startsAt)}</span>
                    {item.kind === "colegio" ? (
                      <span className={cn("rounded-sm px-1 text-[10px] font-medium", COLEGIO_BADGE_CLASSES)}>
                        Colegio
                      </span>
                    ) : item.kind === "task" ? (
                      <span className={cn("rounded-sm px-1 text-[10px] font-medium", TASK_BADGE_CLASSES)}>Tarea</span>
                    ) : (
                      <span
                        className={cn(
                          "rounded-sm px-1 text-[10px] font-medium",
                          CATEGORY_BADGE_CLASSES[item.category ?? "otro"],
                        )}
                      >
                        {item.category ? CATEGORY_LABELS[item.category] : "Evento"}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={kind === "evento" ? "default" : "outline"}
            onClick={() => setKind("evento")}
          >
            <CalendarPlus className="size-4" aria-hidden="true" /> Evento
          </Button>
          <Button
            type="button"
            size="sm"
            variant={kind === "tarea" ? "default" : "outline"}
            onClick={() => setKind("tarea")}
          >
            <ListPlus className="size-4" aria-hidden="true" /> Tarea
          </Button>
        </div>

        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="quick-add-title">Titulo</Label>
            <Input id="quick-add-title" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
          </div>

          {kind === "evento" ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="quick-add-category">Categoria</Label>
                <Select value={category} onValueChange={(value) => setCategory(value as EventCategory)}>
                  <SelectTrigger id="quick-add-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CATEGORY_LABELS) as EventCategory[]).map((c) => (
                      <SelectItem key={c} value={c}>
                        {CATEGORY_LABELS[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="quick-add-start">Desde</Label>
                  <Input
                    id="quick-add-start"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="quick-add-end">Hasta</Label>
                  <Input
                    id="quick-add-end"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="quick-add-due">Hora de vencimiento (opcional)</Label>
                <Input id="quick-add-due" type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="quick-add-priority">Prioridad</Label>
                <Select value={priority} onValueChange={(value) => setPriority(value as TaskPriority)}>
                  <SelectTrigger id="quick-add-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PRIORITY_LABELS) as TaskPriority[]).map((p) => (
                      <SelectItem key={p} value={p}>
                        {PRIORITY_LABELS[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <DialogFooter className="sm:justify-between">
            {target?.weekHref ? (
              <Button asChild variant="ghost" size="sm" type="button">
                <Link href={target.weekHref}>Ver semana completa</Link>
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" disabled={isPending || title.trim().length === 0}>
              {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
