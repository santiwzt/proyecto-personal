"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { createAvailabilityRuleAction, deleteAvailabilityRuleAction } from "@/server/actions/calendar-actions";
import type { AvailabilityRule } from "@/types/domain";

// JS Date#getDay() convention: 0 = Sunday ... 6 = Saturday. Displayed Monday-first.
const WEEKDAY_ORDER: AvailabilityRule["weekday"][] = [1, 2, 3, 4, 5, 6, 0];
const WEEKDAY_LABELS: Record<number, string> = {
  0: "Domingo",
  1: "Lunes",
  2: "Martes",
  3: "Miercoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sabado",
};

export function AvailabilityRules({ rules }: { rules: AvailabilityRule[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  const [weekday, setWeekday] = React.useState("1");
  const [startTime, setStartTime] = React.useState("18:00");
  const [endTime, setEndTime] = React.useState("20:00");
  const [kind, setKind] = React.useState<AvailabilityRule["kind"]>("disponible");
  const [label, setLabel] = React.useState("");

  function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    if (endTime <= startTime) {
      toast({
        variant: "destructive",
        title: "Horario invalido",
        description: "La hora de fin debe ser posterior a la hora de inicio.",
      });
      return;
    }
    startTransition(async () => {
      try {
        await createAvailabilityRuleAction({
          weekday: Number(weekday) as AvailabilityRule["weekday"],
          startTime,
          endTime,
          kind,
          label: label.trim().length > 0 ? label.trim() : null,
        });
        toast({ title: "Regla de disponibilidad creada." });
        setLabel("");
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "No se pudo crear la regla",
          description: error instanceof Error ? error.message : undefined,
        });
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteAvailabilityRuleAction(id);
        toast({ title: "Regla eliminada." });
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "No se pudo eliminar la regla",
          description: error instanceof Error ? error.message : undefined,
        });
      }
    });
  }

  const groupedWeekdays = WEEKDAY_ORDER.filter((wd) => rules.some((r) => r.weekday === wd));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Mi disponibilidad</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {rules.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavia no configuraste tu disponibilidad semanal.</p>
        ) : (
          <div className="space-y-3">
            {groupedWeekdays.map((wd) => (
              <div key={wd}>
                <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                  {WEEKDAY_LABELS[wd]}
                </p>
                <div className="space-y-1">
                  {rules
                    .filter((r) => r.weekday === wd)
                    .map((rule) => (
                      <div
                        key={rule.id}
                        className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-1.5 text-sm"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span>
                            {rule.startTime}–{rule.endTime}
                          </span>
                          <Badge variant={rule.kind === "disponible" ? "secondary" : "outline"}>
                            {rule.kind === "disponible" ? "Disponible" : "No disponible"}
                          </Badge>
                          {rule.label ? <span className="text-muted-foreground">{rule.label}</span> : null}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(rule.id)}
                          disabled={isPending}
                          aria-label={`Eliminar regla de disponibilidad de ${WEEKDAY_LABELS[wd]}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <form
          className="grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-5"
          onSubmit={handleAdd}
        >
          <div className="space-y-1">
            <Label htmlFor="avail-weekday" className="text-xs">
              Dia
            </Label>
            <Select value={weekday} onValueChange={setWeekday}>
              <SelectTrigger id="avail-weekday">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WEEKDAY_ORDER.map((wd) => (
                  <SelectItem key={wd} value={String(wd)}>
                    {WEEKDAY_LABELS[wd]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="avail-start" className="text-xs">
              Desde
            </Label>
            <Input id="avail-start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="avail-end" className="text-xs">
              Hasta
            </Label>
            <Input id="avail-end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="avail-kind" className="text-xs">
              Tipo
            </Label>
            <Select value={kind} onValueChange={(value) => setKind(value as AvailabilityRule["kind"])}>
              <SelectTrigger id="avail-kind">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="disponible">Disponible</SelectItem>
                <SelectItem value="no_disponible">No disponible</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-1 sm:col-span-1">
            <Label htmlFor="avail-label" className="text-xs">
              Etiqueta (opcional)
            </Label>
            <Input
              id="avail-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ej: Entrenamiento"
            />
          </div>
          <div className="col-span-2 sm:col-span-5">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
              <Plus className="size-4" aria-hidden="true" /> Agregar regla
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
