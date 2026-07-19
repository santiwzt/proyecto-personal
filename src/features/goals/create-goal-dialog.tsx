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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { createGoalAction } from "@/server/actions/goals-actions";

export function CreateGoalDialog() {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [targetDate, setTargetDate] = React.useState("");

  function reset() {
    setTitle("");
    setDescription("");
    setTargetDate("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length === 0) return;
    startTransition(async () => {
      try {
        await createGoalAction({
          title: title.trim(),
          description: description.trim().length > 0 ? description.trim() : null,
          targetDate: targetDate || null,
        });
        toast({ title: "Objetivo creado." });
        reset();
        setOpen(false);
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "No se pudo crear el objetivo",
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
          <Plus aria-hidden="true" />
          Nuevo objetivo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo objetivo</DialogTitle>
          <DialogDescription>Vas a poder marcar el progreso a medida que avances.</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="goal-title">Titulo</Label>
            <Input
              id="goal-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={150}
              placeholder="Terminar el secundario con buen promedio"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="goal-description">Descripcion (opcional)</Label>
            <Textarea
              id="goal-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="goal-target-date">Fecha meta (opcional)</Label>
            <Input
              id="goal-target-date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending || title.trim().length === 0}>
              {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
              Crear objetivo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
