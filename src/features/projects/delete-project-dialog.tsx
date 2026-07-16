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
import { useToast } from "@/components/ui/use-toast";
import { deleteProjectAction } from "@/server/actions/projects-actions";

export function DeleteProjectDialog({ projectId, projectName }: { projectId: string; projectName: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteProjectAction(projectId);
        toast({ title: "Proyecto eliminado." });
        setOpen(false);
        router.push("/proyectos");
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "No se pudo eliminar el proyecto",
          description: error instanceof Error ? error.message : undefined,
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="destructive" size="sm">
          <Trash2 aria-hidden="true" />
          Eliminar proyecto
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Eliminar &quot;{projectName}&quot;?</DialogTitle>
          <DialogDescription>
            Esta accion no se puede deshacer. Se eliminara el proyecto (las tareas asociadas dejaran de estar
            visibles).
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
            Si, eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
