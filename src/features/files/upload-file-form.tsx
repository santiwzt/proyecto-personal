"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { uploadFileAction } from "@/server/actions/files-actions";

export interface UploadFileFormProps {
  subjects: { id: string; name: string }[];
  maxSizeMb: number;
}

export function UploadFileForm({ subjects, maxSizeMb }: UploadFileFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [subjectId, setSubjectId] = React.useState<string>("none");
  const [isPending, startTransition] = React.useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = formRef.current;
    if (!form) return;
    const formData = new FormData(form);
    if (subjectId !== "none") formData.set("subjectId", subjectId);

    startTransition(async () => {
      try {
        const file = await uploadFileAction(formData);
        toast({
          title: "Archivo subido",
          description:
            file.status === "listo"
              ? `${file.originalName} se proceso correctamente.`
              : file.status === "fallo"
                ? `${file.originalName} no pudo procesarse: ${file.processingError ?? ""}`
                : `${file.originalName} se esta procesando.`,
        });
        form.reset();
        setSubjectId("none");
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "No se pudo subir el archivo",
          description: error instanceof Error ? error.message : undefined,
        });
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex flex-1 flex-col gap-2">
        <Label htmlFor="file">Archivo (PDF, DOCX, TXT, Markdown o imagen — max {maxSizeMb} MB)</Label>
        <Input
          id="file"
          name="file"
          type="file"
          required
          accept=".pdf,.docx,.txt,.md,image/png,image/jpeg,image/webp"
        />
      </div>

      {subjects.length > 0 && (
        <div className="flex flex-col gap-2 sm:w-48">
          <Label htmlFor="subjectId">Materia (opcional)</Label>
          <Select value={subjectId} onValueChange={setSubjectId}>
            <SelectTrigger id="subjectId">
              <SelectValue placeholder="Sin materia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin materia</SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <UploadCloud aria-hidden="true" />}
        Subir
      </Button>
    </form>
  );
}
