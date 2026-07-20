"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Loader2 } from "lucide-react";

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
import { CATEGORY_LABELS } from "@/features/calendar/event-visuals";
import { createEventAction } from "@/server/actions/calendar-actions";
import type { EventCategory } from "@/types/domain";

/** "2026-07-20T18:00" (datetime-local) -> "2026-07-20T18:00:00-03:00" (ISO with offset). */
function toIsoWithOffset(datetimeLocal: string): string {
  return `${datetimeLocal}:00-03:00`;
}

export function CreateEventDialog() {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState<EventCategory>("clase");
  const [startsAt, setStartsAt] = React.useState("");
  const [endsAt, setEndsAt] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [notes, setNotes] = React.useState("");

  function reset() {
    setTitle("");
    setCategory("clase");
    setStartsAt("");
    setEndsAt("");
    setLocation("");
    setNotes("");
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (title.trim().length === 0 || !startsAt || !endsAt) return;
    if (endsAt <= startsAt) {
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
          startsAt: toIsoWithOffset(startsAt),
          endsAt: toIsoWithOffset(endsAt),
          location: location.trim().length > 0 ? location.trim() : null,
          isFixed: false,
          relatedExamId: null,
          relatedTaskId: null,
          relatedProjectId: null,
          notes: notes.trim().length > 0 ? notes.trim() : null,
        });
        toast({ title: "Evento creado correctamente." });
        reset();
        setOpen(false);
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "No se pudo crear el evento",
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
        <Button type="button" size="sm" variant="secondary">
          <CalendarPlus className="size-4" aria-hidden="true" /> Nuevo evento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo evento</DialogTitle>
          <DialogDescription>Agrega un evento a tu calendario.</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="event-title">Titulo</Label>
            <Input
              id="event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="event-category">Categoria</Label>
            <Select value={category} onValueChange={(value) => setCategory(value as EventCategory)}>
              <SelectTrigger id="event-category">
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
              <Label htmlFor="event-start">Inicio</Label>
              <Input
                id="event-start"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="event-end">Fin</Label>
              <Input
                id="event-end"
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="event-location">Ubicacion (opcional)</Label>
            <Input id="event-location" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="event-notes">Notas (opcional)</Label>
            <Textarea id="event-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending || title.trim().length === 0 || !startsAt || !endsAt}>
              {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
