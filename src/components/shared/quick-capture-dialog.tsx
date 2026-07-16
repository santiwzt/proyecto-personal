"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Sparkles } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { formatDateTime } from "@/lib/dates";
import { parseQuickCaptureAction, confirmQuickCaptureAction } from "@/server/actions/quick-capture-actions";
import type { QuickCaptureResult } from "@/types/domain";

const TYPE_LABELS: Record<QuickCaptureResult["type"], string> = {
  task: "Tarea",
  exam: "Examen",
  event: "Evento",
  idea: "Idea",
  expense: "Gasto",
  unknown: "Sin identificar",
};

const EXAMPLES = [
  "Rindo Fisica el lunes a las 9",
  "Recordame llevar la carpeta mañana",
  "Tengo entrenamiento el miercoles de 18 a 20",
  "Idea: crear un juego de terror en Unity",
  "Gaste 8.500 pesos en una salida",
];

function ResultPreview({ result }: { result: QuickCaptureResult }) {
  if (result.type === "unknown") {
    return (
      <div className="flex items-start gap-2 rounded-md border border-dashed border-border p-3 text-sm">
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <p>{result.clarification}</p>
      </div>
    );
  }

  const rows: [string, string][] = [];
  switch (result.type) {
    case "task":
      rows.push(["Titulo", result.data.title]);
      if (result.data.dueAt) rows.push(["Vence", formatDateTime(result.data.dueAt)]);
      if (result.data.estimatedMinutes) rows.push(["Duracion estimada", `${result.data.estimatedMinutes} min`]);
      rows.push(["Prioridad", result.data.priority]);
      break;
    case "exam":
      rows.push(["Titulo", result.data.title]);
      rows.push(["Fecha", formatDateTime(result.data.scheduledAt)]);
      rows.push(["Duracion", `${result.data.durationMinutes} min`]);
      break;
    case "event":
      rows.push(["Titulo", result.data.title]);
      rows.push(["Categoria", result.data.category]);
      rows.push(["Inicio", formatDateTime(result.data.startsAt)]);
      rows.push(["Fin", formatDateTime(result.data.endsAt)]);
      break;
    case "idea":
      rows.push(["Contenido", result.data.content]);
      break;
    case "expense":
      rows.push(["Monto", `${result.data.amount} ${result.data.currency}`]);
      rows.push(["Categoria", result.data.category]);
      break;
  }

  return (
    <div className="rounded-md border border-border p-3">
      <Badge className="mb-2">{TYPE_LABELS[result.type]}</Badge>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        {rows.map(([label, value]) => (
          <React.Fragment key={label}>
            <dt className="text-muted-foreground">{label}</dt>
            <dd>{value}</dd>
          </React.Fragment>
        ))}
      </dl>
    </div>
  );
}

export function QuickCaptureDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const { toast } = useToast();
  const [placeholder] = React.useState(() => EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)]);
  const [text, setText] = React.useState("");
  const [result, setResult] = React.useState<QuickCaptureResult | null>(null);
  const [isPending, startTransition] = React.useTransition();

  function reset() {
    setText("");
    setResult(null);
  }

  function handleInterpret() {
    if (text.trim().length < 3) return;
    startTransition(async () => {
      try {
        const parsed = await parseQuickCaptureAction(text);
        setResult(parsed);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "No se pudo interpretar el texto",
          description: error instanceof Error ? error.message : undefined,
        });
      }
    });
  }

  function handleConfirm() {
    if (!result || result.type === "unknown") return;
    startTransition(async () => {
      try {
        await confirmQuickCaptureAction(result);
        toast({ title: `${TYPE_LABELS[result.type]} guardado correctamente.` });
        reset();
        onOpenChange(false);
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "No se pudo guardar",
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
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" aria-hidden="true" />
            Captura rapida
          </DialogTitle>
          <DialogDescription>
            Escribi en lenguaje natural: una tarea, un examen, un evento, una idea o un gasto. Vas a poder
            revisar la interpretacion antes de guardar nada.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <Label htmlFor="quick-capture-text" className="sr-only">
            Texto a interpretar
          </Label>
          <Textarea
            id="quick-capture-text"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setResult(null);
            }}
            placeholder={placeholder}
            rows={3}
            autoFocus
          />

          {result && <ResultPreview result={result} />}
        </div>

        <DialogFooter>
          {!result ? (
            <Button type="button" onClick={handleInterpret} disabled={isPending || text.trim().length < 3}>
              {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
              Interpretar
            </Button>
          ) : result.type === "unknown" ? (
            <Button type="button" variant="outline" onClick={reset}>
              Intentar de nuevo
            </Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={reset} disabled={isPending}>
                Editar
              </Button>
              <Button type="button" onClick={handleConfirm} disabled={isPending}>
                {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
                Confirmar y guardar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
