"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { createExamAction } from "@/server/actions/academic-actions";
import type { ExamImportance } from "@/types/domain";

export function CreateExamDialog({
  subjectId,
  topics,
}: {
  subjectId: string;
  topics: { id: string; name: string }[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const [title, setTitle] = React.useState("");
  const [scheduledAt, setScheduledAt] = React.useState("");
  const [durationMinutes, setDurationMinutes] = React.useState(80);
  const [importance, setImportance] = React.useState<ExamImportance>("media");
  const [topicIds, setTopicIds] = React.useState<string[]>([]);

  function reset() {
    setTitle("");
    setScheduledAt("");
    setDurationMinutes(80);
    setImportance("media");
    setTopicIds([]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !scheduledAt) return;
    startTransition(async () => {
      try {
        await createExamAction({
          subjectId,
          title: title.trim(),
          scheduledAt: `${scheduledAt}:00-03:00`,
          durationMinutes,
          importance,
          topicIds,
        });
        toast({ title: "Examen creado." });
        reset();
        setOpen(false);
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "No se pudo crear el examen",
          description: error instanceof Error ? error.message : undefined,
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) reset(); setOpen(next); }}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline">
          <Plus aria-hidden="true" /> Nuevo examen
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo examen</DialogTitle>
          <DialogDescription>Registra la fecha y los temas evaluados.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="exam-title">Titulo</Label>
            <Input
              id="exam-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={150}
              autoFocus
              placeholder="Examen de cinematica"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="exam-date">Fecha y hora</Label>
              <Input
                id="exam-date"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exam-duration">Duracion (min)</Label>
              <Input
                id="exam-duration"
                type="number"
                min={10}
                max={600}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="exam-importance">Importancia</Label>
            <Select value={importance} onValueChange={(v) => setImportance(v as ExamImportance)}>
              <SelectTrigger id="exam-importance">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="baja">Baja</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {topics.length > 0 && (
            <div className="space-y-2">
              <Label>Temas evaluados</Label>
              <div className="flex flex-col gap-2 rounded-md border border-border p-3">
                {topics.map((topic) => (
                  <label key={topic.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={topicIds.includes(topic.id)}
                      onCheckedChange={(checked) =>
                        setTopicIds((prev) => (checked ? [...prev, topic.id] : prev.filter((id) => id !== topic.id)))
                      }
                    />
                    {topic.name}
                  </label>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isPending || !title.trim() || !scheduledAt}>
              {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
              Crear examen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
