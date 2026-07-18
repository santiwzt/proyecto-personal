"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, Loader2 } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { createTrainingSessionAction } from "@/server/actions/training-actions";

/** "2026-07-20T18:00" (datetime-local) -> "2026-07-20T18:00:00-03:00" (ISO with offset). */
function toIsoWithOffset(datetimeLocal: string): string {
  return `${datetimeLocal}:00-03:00`;
}

export function CreateTrainingDialog() {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const [activity, setActivity] = React.useState("");
  const [startsAt, setStartsAt] = React.useState("");
  const [endsAt, setEndsAt] = React.useState("");
  const [notes, setNotes] = React.useState("");

  function reset() {
    setActivity("");
    setStartsAt("");
    setEndsAt("");
    setNotes("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (activity.trim().length === 0 || !startsAt || !endsAt) return;
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
        await createTrainingSessionAction({
          activity: activity.trim(),
          startsAt: toIsoWithOffset(startsAt),
          endsAt: toIsoWithOffset(endsAt),
          notes: notes.trim().length > 0 ? notes.trim() : null,
        });
        toast({ title: "Sesion de entrenamiento guardada." });
        reset();
        setOpen(false);
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "No se pudo guardar la sesion",
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
        <Button type="button">
          <Dumbbell aria-hidden="true" />
          Nueva sesion
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva sesion de entrenamiento</DialogTitle>
          <DialogDescription>Registra que hiciste y cuanto duro.</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="training-activity">Actividad</Label>
            <Input
              id="training-activity"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              required
              maxLength={120}
              placeholder="Futbol, gimnasio, natacion..."
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="training-start">Inicio</Label>
              <Input
                id="training-start"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="training-end">Fin</Label>
              <Input
                id="training-end"
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="training-notes">Notas (opcional)</Label>
            <Textarea id="training-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending || activity.trim().length === 0 || !startsAt || !endsAt}>
              {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
