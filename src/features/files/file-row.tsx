"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { deleteFileAction, reprocessFileAction } from "@/server/actions/files-actions";
import { formatDateTime } from "@/lib/dates";
import type { FileAsset, FileProcessingStatus } from "@/types/domain";

const STATUS_LABEL: Record<FileProcessingStatus, string> = {
  subiendo: "Subiendo",
  procesando: "Procesando",
  listo: "Listo",
  fallo: "Fallo",
  eliminado: "Eliminado",
};

const STATUS_VARIANT: Record<FileProcessingStatus, "default" | "secondary" | "destructive" | "outline"> = {
  subiendo: "secondary",
  procesando: "secondary",
  listo: "default",
  fallo: "destructive",
  eliminado: "outline",
};

export function FileRow({ file, subjectName }: { file: FileAsset; subjectName: string | null }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteFileAction(file.id);
        toast({ title: `${file.originalName} eliminado.` });
        router.refresh();
      } catch (error) {
        toast({ variant: "destructive", title: "No se pudo eliminar", description: error instanceof Error ? error.message : undefined });
      }
    });
  }

  function handleReprocess() {
    startTransition(async () => {
      try {
        await reprocessFileAction(file.id);
        toast({ title: `${file.originalName} reprocesado.` });
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "No se pudo reprocesar",
          description: error instanceof Error ? error.message : undefined,
        });
      }
    });
  }

  return (
    <li className="flex flex-col gap-2 border-b border-border py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate font-medium">{file.originalName}</p>
        <p className="text-xs text-muted-foreground">
          {subjectName ? `${subjectName} · ` : ""}
          {(file.sizeBytes / 1024).toFixed(0)} KB · {formatDateTime(file.createdAt)}
        </p>
        {file.status === "fallo" && file.processingError && (
          <p className="mt-1 text-xs text-destructive">{file.processingError}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Badge variant={STATUS_VARIANT[file.status]}>{STATUS_LABEL[file.status]}</Badge>
        {file.status === "fallo" && (
          <Button type="button" variant="outline" size="icon" onClick={handleReprocess} disabled={isPending} aria-label="Reprocesar">
            {isPending ? <Loader2 className="animate-spin" /> : <RefreshCw />}
          </Button>
        )}
        <Button type="button" variant="ghost" size="icon" onClick={handleDelete} disabled={isPending} aria-label="Eliminar">
          <Trash2 />
        </Button>
      </div>
    </li>
  );
}
