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
import { cn } from "@/lib/utils";
import { createSubjectAction } from "@/server/actions/academic-actions";
import type { SubjectColor } from "@/types/domain";
import { SUBJECT_COLORS, subjectColorClasses } from "./subject-color";

export interface CreateSubjectDialogProps {
  /** Controlled mode: pass both to drive the dialog from a parent (e.g. an empty state). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const DEFAULT_COLOR: SubjectColor = "blue";

/**
 * Dialog to create a new Subject. Works uncontrolled (renders its own
 * "Nueva materia" trigger button) or controlled (pass open/onOpenChange,
 * no trigger is rendered — useful when opened from an EmptyState action).
 */
export function CreateSubjectDialog({ open: openProp, onOpenChange: onOpenChangeProp }: CreateSubjectDialogProps) {
  const isControlled = openProp !== undefined;
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = isControlled ? openProp : internalOpen;
  const setOpen = isControlled ? onOpenChangeProp! : setInternalOpen;

  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  const [name, setName] = React.useState("");
  const [color, setColor] = React.useState<SubjectColor>(DEFAULT_COLOR);
  const [teacher, setTeacher] = React.useState("");
  const [course, setCourse] = React.useState("");
  const [description, setDescription] = React.useState("");

  function reset() {
    setName("");
    setColor(DEFAULT_COLOR);
    setTeacher("");
    setCourse("");
    setDescription("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length === 0) return;
    startTransition(async () => {
      try {
        await createSubjectAction({
          name: name.trim(),
          color,
          teacher: teacher.trim() || null,
          course: course.trim() || null,
          description: description.trim() || null,
        });
        toast({ title: "Materia creada correctamente." });
        reset();
        setOpen(false);
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "No se pudo crear la materia",
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
      {!isControlled && (
        <DialogTrigger asChild>
          <Button type="button">
            <Plus aria-hidden="true" /> Nueva materia
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva materia</DialogTitle>
          <DialogDescription>Crea una materia para organizar temas, examenes y archivos.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject-name">Nombre</Label>
            <Input
              id="subject-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={80}
              autoFocus
              placeholder="Fisica, Historia, Programacion..."
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Elegir color de la materia">
              {SUBJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`Color ${c}`}
                  aria-pressed={color === c}
                  className={cn(
                    "size-7 rounded-full transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    subjectColorClasses[c].dot,
                    color === c ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : "opacity-70 hover:opacity-100",
                  )}
                />
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="subject-teacher">Profesor/a</Label>
              <Input
                id="subject-teacher"
                value={teacher}
                onChange={(e) => setTeacher(e.target.value)}
                maxLength={120}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject-course">Curso</Label>
              <Input id="subject-course" value={course} onChange={(e) => setCourse(e.target.value)} maxLength={80} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject-description">Descripcion</Label>
            <Textarea
              id="subject-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending || name.trim().length === 0}>
              {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
              Crear materia
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
