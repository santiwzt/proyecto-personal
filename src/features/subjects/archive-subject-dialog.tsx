"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Archive, Loader2 } from "lucide-react";

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
import { archiveSubjectAction } from "@/server/actions/academic-actions";

export function ArchiveSubjectDialog({ subjectId, subjectName }: { subjectId: string; subjectName: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  function handleArchive() {
    startTransition(async () => {
      try {
        await archiveSubjectAction(subjectId);
        toast({ title: `"${subjectName}" archivada.` });
        setOpen(false);
        router.push("/estudios");
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "No se pudo archivar la materia",
          description: error instanceof Error ? error.message : undefined,
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Archive aria-hidden="true" /> Archivar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Archivar &quot;{subjectName}&quot;</DialogTitle>
          <DialogDescription>
            La materia dejara de aparecer en tu lista de Estudios. Sus temas, examenes y archivos no se eliminan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="button" variant="destructive" onClick={handleArchive} disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
            Archivar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
