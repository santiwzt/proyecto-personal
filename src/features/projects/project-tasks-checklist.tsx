"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { createProjectTaskAction, updateProjectTaskStatusAction } from "@/server/actions/projects-actions";
import type { ProjectTask } from "@/types/domain";
import { PROJECT_TASK_STATUS_LABELS } from "@/features/projects/labels";

export function ProjectTasksChecklist({
  projectId,
  initialTasks,
}: {
  projectId: string;
  initialTasks: ProjectTask[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [tasks, setTasks] = React.useState(initialTasks);
  const [title, setTitle] = React.useState("");
  const [isAdding, startAddTransition] = React.useTransition();
  const [pendingTaskId, setPendingTaskId] = React.useState<string | null>(null);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length === 0) return;
    startAddTransition(async () => {
      try {
        const task = await createProjectTaskAction({ projectId, title: title.trim() });
        setTasks((prev) => [...prev, task]);
        setTitle("");
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "No se pudo agregar la tarea",
          description: error instanceof Error ? error.message : undefined,
        });
      }
    });
  }

  function handleToggle(task: ProjectTask) {
    const nextStatus = task.status === "completada" ? "pendiente" : "completada";
    setPendingTaskId(task.id);
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)));
    startAddTransition(async () => {
      try {
        await updateProjectTaskStatusAction(task.id, nextStatus, projectId);
        router.refresh();
      } catch (error) {
        setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)));
        toast({
          variant: "destructive",
          title: "No se pudo actualizar la tarea",
          description: error instanceof Error ? error.message : undefined,
        });
      } finally {
        setPendingTaskId(null);
      }
    });
  }

  return (
    <div className="space-y-4">
      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavia no hay tareas para este proyecto.</p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li key={task.id} className="flex items-center gap-3 rounded-md border border-border p-2">
              <Checkbox
                checked={task.status === "completada"}
                onCheckedChange={() => handleToggle(task)}
                disabled={pendingTaskId === task.id}
                id={`task-${task.id}`}
              />
              <Label
                htmlFor={`task-${task.id}`}
                className={`flex-1 cursor-pointer font-normal ${
                  task.status === "completada" ? "text-muted-foreground line-through" : ""
                }`}
              >
                {task.title}
              </Label>
              <Badge variant={task.status === "completada" ? "secondary" : "outline"}>
                {PROJECT_TASK_STATUS_LABELS[task.status]}
              </Badge>
            </li>
          ))}
        </ul>
      )}

      <form className="flex items-end gap-2" onSubmit={handleAdd}>
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="new-task-title">Nueva tarea</Label>
          <Input
            id="new-task-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Escribir el guion del primer nivel"
            maxLength={150}
          />
        </div>
        <Button type="submit" size="sm" disabled={isAdding || title.trim().length === 0}>
          {isAdding ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Plus aria-hidden="true" />}
          Agregar
        </Button>
      </form>
    </div>
  );
}
