"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { updateProjectAction } from "@/server/actions/projects-actions";
import type { Project, ProjectStatus } from "@/types/domain";
import { PROJECT_STATUS_LABELS } from "@/features/projects/labels";

const STATUS_OPTIONS = Object.entries(PROJECT_STATUS_LABELS) as [ProjectStatus, string][];

export function ProjectQuickEdit({ project }: { project: Project }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  const [status, setStatus] = React.useState<ProjectStatus>(project.status);
  const [progress, setProgress] = React.useState(project.progress);
  const [nextStep, setNextStep] = React.useState(project.nextStep ?? "");

  function handleStatusChange(value: ProjectStatus) {
    setStatus(value);
    startTransition(async () => {
      try {
        await updateProjectAction(project.id, { status: value });
        toast({ title: "Estado actualizado." });
        router.refresh();
      } catch (error) {
        setStatus(project.status);
        toast({
          variant: "destructive",
          title: "No se pudo actualizar el estado",
          description: error instanceof Error ? error.message : undefined,
        });
      }
    });
  }

  function handleProgressSave() {
    startTransition(async () => {
      try {
        await updateProjectAction(project.id, { progress });
        toast({ title: "Progreso actualizado." });
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "No se pudo actualizar el progreso",
          description: error instanceof Error ? error.message : undefined,
        });
      }
    });
  }

  function handleNextStepSave(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await updateProjectAction(project.id, {
          nextStep: nextStep.trim().length > 0 ? nextStep.trim() : null,
        });
        toast({ title: "Proximo paso actualizado." });
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "No se pudo actualizar el proximo paso",
          description: error instanceof Error ? error.message : undefined,
        });
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="project-status-select">Estado</Label>
        <Select value={status} onValueChange={(v) => handleStatusChange(v as ProjectStatus)} disabled={isPending}>
          <SelectTrigger id="project-status-select" className="max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="project-progress-range">Progreso ({progress}%)</Label>
        <div className="flex max-w-md items-center gap-3">
          <input
            id="project-progress-range"
            type="range"
            min={0}
            max={100}
            step={5}
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            className="h-2 w-full cursor-pointer accent-primary"
          />
          <Button type="button" size="sm" variant="outline" onClick={handleProgressSave} disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
            Guardar
          </Button>
        </div>
      </div>

      <form className="space-y-1.5" onSubmit={handleNextStepSave}>
        <Label htmlFor="project-next-step-edit">Proximo paso</Label>
        <Textarea
          id="project-next-step-edit"
          value={nextStep}
          onChange={(e) => setNextStep(e.target.value)}
          rows={2}
          maxLength={300}
          placeholder="¿Cual es la accion concreta que sigue?"
          className="max-w-xl"
        />
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
          Guardar proximo paso
        </Button>
      </form>
    </div>
  );
}
