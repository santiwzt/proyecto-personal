"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { createTaskAction } from "@/server/actions/academic-actions";
import type { TaskPriority } from "@/types/domain";

const PRIORITY_LABELS: Record<TaskPriority, string> = { baja: "Baja", media: "Media", alta: "Alta" };

/** "2026-07-20T18:00" (datetime-local) -> "2026-07-20T18:00:00-03:00" (ISO with offset). */
function toIsoWithOffset(datetimeLocal: string): string {
  return `${datetimeLocal}:00-03:00`;
}

export function CreateTaskDialog() {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [dueAt, setDueAt] = React.useState("");
  const [estimatedMinutes, setEstimatedMinutes] = React.useState("");
  const [priority, setPriority] = React.useState<TaskPriority>("media");

  function reset() {
    setTitle("");
    setDescription("");
    setDueAt("");
    setEstimatedMinutes("");
    setPriority("media");
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (title.trim().length === 0) return;
    startTransition(async () => {
      try {
        await createTaskAction({
          title: title.trim(),
          description: description.trim().length > 0 ? description.trim() : null,
          dueAt: dueAt ? toIsoWithOffset(dueAt) : null,
          estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : null,
          priority,
          subjectId: null,
          projectId: null,
          isFixed: false,
        });
        toast({ title: "Tarea creada correctamente." });
        reset();
        setOpen(false);
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
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" size="sm">
          <Plus className="size-4" aria-hidden="true" /> Nueva tarea
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva tarea</DialogTitle>
          <DialogDescription>Agrega una tarea pendiente a tu agenda.</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="task-title">Titulo</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="task-description">Descripcion (opcional)</Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="task-due">Vence (opcional)</Label>
              <Input
                id="task-due"
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-minutes">Minutos estimados (opcional)</Label>
              <Input
                id="task-minutes"
                type="number"
                min={1}
                max={600}
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="task-priority">Prioridad</Label>
            <Select value={priority} onValueChange={(value) => setPriority(value as TaskPriority)}>
              <SelectTrigger id="task-priority">
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
          <DialogFooter>
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
