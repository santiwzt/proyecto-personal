"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

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
import { useToast } from "@/components/ui/use-toast";
import { deleteSubjectAction } from "@/server/actions/academic-actions";

export function DeleteSubjectDialog({ subjectId, subjectName }: { subjectId: string; subjectName: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [confirmText, setConfirmText] = React.useState("");
  const [isPending, startTransition] = React.useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteSubjectAction(subjectId);
      if (!result.ok) {
        toast({ variant: "destructive", title: "No se pudo eliminar la materia", description: result.message });
        return;
      }
      toast({ title: `"${subjectName}" eliminada permanentemente.` });
      setOpen(false);
      router.push("/estudios");
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setConfirmText("");
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="destructive" size="sm">
          <Trash2 className="size-4" aria-hidden="true" /> Eliminar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar &quot;{subjectName}&quot; permanentemente</DialogTitle>
          <DialogDescription>
            Esto borra la materia y sus temas y examenes para siempre -- no se puede deshacer. Las tareas, archivos y
            sesiones de estudio relacionadas no se eliminan, pero dejan de estar vinculados a esta materia.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="delete-subject-confirm">
            Escribi <span className="font-semibold">{subjectName}</span> para confirmar
          </Label>
          <Input
            id="delete-subject-confirm"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            autoComplete="off"
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending || confirmText !== subjectName}
            onClick={handleDelete}
          >
            {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
            Eliminar permanentemente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
