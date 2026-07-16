"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ListChecks, Loader2, Sparkles, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/dates";
import { approvePlanAction, generatePlanAction } from "@/server/actions/planner-actions";
import type { PlannerRun, ProposedTimeBlock, TaskPriority } from "@/types/domain";

const PRIORITY_VARIANT: Record<TaskPriority, "outline" | "secondary" | "destructive"> = {
  baja: "secondary",
  media: "outline",
  alta: "destructive",
};

interface PlannerPanelProps {
  /** Monday ("yyyy-MM-dd") of the week currently being viewed on the agenda page. */
  weekStart: string;
}

export function PlannerPanel({ weekStart }: PlannerPanelProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [run, setRun] = React.useState<PlannerRun | null>(null);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [isGenerating, startGenerating] = React.useTransition();
  const [isApproving, startApproving] = React.useTransition();

  function handleGenerate() {
    startGenerating(async () => {
      try {
        const newRun = await generatePlanAction({ weekStart });
        setRun(newRun);
        setSelectedIds(new Set(newRun.plan.blocks.map((b) => b.id)));
      } catch (error) {
        toast({
          variant: "destructive",
          title: "No se pudo generar el plan",
          description: error instanceof Error ? error.message : undefined,
        });
      }
    });
  }

  function toggleBlock(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  function handleApprove(mode: "todo" | "parcial" | "rechazar") {
    if (!run) return;
    const blockIds = mode === "parcial" ? Array.from(selectedIds) : [];
    if (mode === "parcial" && blockIds.length === 0) {
      toast({ variant: "destructive", title: "Selecciona al menos un bloque para aprobar." });
      return;
    }
    startApproving(async () => {
      try {
        await approvePlanAction({ plannerRunId: run.id, blockIds, mode });
        const messages: Record<typeof mode, string> = {
          todo: "Se aprobaron todos los bloques: ya estan en tu agenda.",
          parcial: "Se aprobaron los bloques seleccionados: ya estan en tu agenda.",
          rechazar: "Se rechazo la propuesta de plan. Tu agenda no cambio.",
        };
        toast({ title: messages[mode] });
        // A resolved run (approved/rejected) stops being a pending proposal.
        setRun(null);
        setSelectedIds(new Set());
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "No se pudo procesar la aprobacion",
          description: error instanceof Error ? error.message : undefined,
        });
      }
    });
  }

  const blocksByDate = React.useMemo(() => {
    const map = new Map<string, ProposedTimeBlock[]>();
    if (!run) return map;
    for (const block of run.plan.blocks) {
      const list = map.get(block.date) ?? [];
      list.push(block);
      map.set(block.date, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return map;
  }, [run]);

  const sortedDates = React.useMemo(() => Array.from(blocksByDate.keys()).sort(), [blocksByDate]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4 text-primary" aria-hidden="true" />
            Planificador semanal
          </CardTitle>
          <CardDescription>
            Genera una propuesta de plan para la semana. Nada se agrega a tu agenda real hasta que la
            apruebes.
          </CardDescription>
        </div>
        <Button type="button" onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating && <Loader2 className="animate-spin" aria-hidden="true" />}
          Generar plan de la semana
        </Button>
      </CardHeader>

      {run ? (
        <CardContent className="space-y-5">
          <p className="text-sm">{run.plan.summary}</p>

          {run.plan.conflicts.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Problemas detectados</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {run.plan.conflicts.map((c, i) => (
                  <li key={i}>{c.message}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="space-y-3">
            <p className="text-sm font-medium">Bloques propuestos</p>
            {sortedDates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No se propusieron bloques para esta semana.</p>
            ) : (
              sortedDates.map((date) => (
                <div key={date} className="space-y-2">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    {formatDate(`${date}T00:00:00-03:00`)}
                  </p>
                  <div className="space-y-2">
                    {(blocksByDate.get(date) ?? []).map((block) => (
                      <label
                        key={block.id}
                        htmlFor={`block-${block.id}`}
                        className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3"
                      >
                        <Checkbox
                          id={`block-${block.id}`}
                          checked={selectedIds.has(block.id)}
                          onCheckedChange={(checked) => toggleBlock(block.id, checked === true)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-sm font-medium">
                              {block.startTime}–{block.endTime} · {block.activityTitle}
                            </span>
                            <Badge variant={PRIORITY_VARIANT[block.priority]}>{block.priority}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{block.reason}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {run.plan.unscheduledItems.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Sin lugar en el plan</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {run.plan.unscheduledItems.map((item) => (
                  <li key={item.refId}>
                    <span className="font-medium text-foreground">{item.title}</span>: {item.reason}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {run.plan.recommendations.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Recomendaciones</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {run.plan.recommendations.map((r, i) => (
                  <li key={i}>{r.message}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {run.plan.assumptions.length > 0 ? (
            <details className="text-sm text-muted-foreground">
              <summary className="cursor-pointer font-medium text-foreground">Que asumimos</summary>
              <ul className="mt-1.5 space-y-1 pl-4">
                {run.plan.assumptions.map((a, i) => (
                  <li key={i} className="list-disc">
                    {a}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}

          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <Button
              type="button"
              onClick={() => handleApprove("todo")}
              disabled={isApproving || sortedDates.length === 0}
            >
              {isApproving && <Loader2 className="animate-spin" aria-hidden="true" />}
              <CheckCircle2 className="size-4" aria-hidden="true" /> Aprobar todo
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleApprove("parcial")}
              disabled={isApproving || selectedIds.size === 0}
            >
              <ListChecks className="size-4" aria-hidden="true" /> Aprobar seleccionados
            </Button>
            <Button type="button" variant="outline" onClick={() => handleApprove("rechazar")} disabled={isApproving}>
              <XCircle className="size-4" aria-hidden="true" /> Rechazar
            </Button>
          </div>
        </CardContent>
      ) : (
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Todavia no generaste un plan para esta semana. Presiona &quot;Generar plan de la semana&quot; para
            recibir una propuesta explicada, que solo se aplica si vos la aprobas.
          </p>
        </CardContent>
      )}
    </Card>
  );
}
