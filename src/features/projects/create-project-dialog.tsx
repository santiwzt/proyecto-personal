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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { createProjectAction } from "@/server/actions/projects-actions";
import type { ProjectStatus, TaskPriority } from "@/types/domain";

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: "idea", label: "Idea" },
  { value: "planificado", label: "Planificado" },
  { value: "en_progreso", label: "En progreso" },
  { value: "pausado", label: "Pausado" },
  { value: "completado", label: "Completado" },
  { value: "archivado", label: "Archivado" },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "baja", label: "Baja" },
  { value: "media", label: "Media" },
  { value: "alta", label: "Alta" },
];

export function CreateProjectDialog() {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [status, setStatus] = React.useState<ProjectStatus>("idea");
  const [priority, setPriority] = React.useState<TaskPriority>("media");
  const [targetDate, setTargetDate] = React.useState("");
  const [technologies, setTechnologies] = React.useState("");
  const [nextStep, setNextStep] = React.useState("");

  function reset() {
    setName("");
    setDescription("");
    setStatus("idea");
    setPriority("media");
    setTargetDate("");
    setTechnologies("");
    setNextStep("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length === 0) return;
    startTransition(async () => {
      try {
        await createProjectAction({
          name: name.trim(),
          description: description.trim().length > 0 ? description.trim() : null,
          status,
          priority,
          targetDate: targetDate.length > 0 ? targetDate : null,
          technologies: technologies
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t.length > 0),
          links: [],
          nextStep: nextStep.trim().length > 0 ? nextStep.trim() : null,
          progress: 0,
        });
        toast({ title: "Proyecto creado correctamente." });
        reset();
        setOpen(false);
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "No se pudo crear el proyecto",
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
          Nuevo proyecto
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo proyecto</DialogTitle>
          <DialogDescription>
            Cargá los datos principales. Vas a poder editar todo despues, incluido el proximo paso.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="project-name">Nombre</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={150}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="project-description">Descripcion</Label>
            <Textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={1000}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="project-status">Estado</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
                <SelectTrigger id="project-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="project-priority">Prioridad</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger id="project-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="project-target-date">Fecha objetivo</Label>
              <Input
                id="project-target-date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="project-technologies">Tecnologias</Label>
              <Input
                id="project-technologies"
                value={technologies}
                onChange={(e) => setTechnologies(e.target.value)}
                placeholder="Unity, C#, Blender"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="project-next-step">Proximo paso</Label>
            <Textarea
              id="project-next-step"
              value={nextStep}
              onChange={(e) => setNextStep(e.target.value)}
              rows={2}
              maxLength={300}
              placeholder="¿Cual es la accion concreta que sigue?"
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending || name.trim().length === 0}>
              {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
              Crear proyecto
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
