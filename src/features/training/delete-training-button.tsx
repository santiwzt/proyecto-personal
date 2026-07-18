"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { deleteTrainingSessionAction } from "@/server/actions/training-actions";

export function DeleteTrainingButton({ id, activity }: { id: string; activity: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteTrainingSessionAction(id);
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "No se pudo eliminar la sesion",
          description: error instanceof Error ? error.message : undefined,
        });
      }
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={`Eliminar sesion de ${activity}`}
      onClick={handleDelete}
      disabled={isPending}
    >
      {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Trash2 className="size-4" aria-hidden="true" />}
    </Button>
  );
}
