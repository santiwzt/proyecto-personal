"use client";

import * as React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DayQuickAddDialog } from "@/features/calendar/day-quick-add-dialog";
import { formatDate, formatTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { EventCategory } from "@/types/domain";

const CATEGORY_LABELS: Record<EventCategory, string> = {
  clase: "Clase",
  examen: "Examen",
  entrenamiento: "Entrenamiento",
  partido: "Partido",
  estudio: "Estudio",
  proyecto: "Proyecto",
  personal: "Personal",
  otro: "Otro",
};

export interface WeekDayCardItem {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  category: EventCategory;
  kind: "event" | "exam";
}

interface WeekDayCardProps {
  dateStr: string;
  label: string;
  items: WeekDayCardItem[];
  isToday: boolean;
}

/** Builds a label like "lunes 20 de julio" from a "yyyy-MM-dd" string using local date parts, avoiding UTC-parsing day shifts. */
function dayLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return format(new Date(year!, month! - 1, day!), "EEEE d 'de' MMMM", { locale: es });
}

export function WeekDayCard({ dateStr, label, items, isToday }: WeekDayCardProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Card
        role="button"
        tabIndex={0}
        aria-label={`Agregar algo el ${dayLabel(dateStr)}`}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={cn(
          "cursor-pointer transition-colors hover:border-primary/50",
          isToday && "border-primary bg-primary/5 ring-1 ring-inset ring-primary/40",
        )}
      >
        <CardHeader className="p-3">
          <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
            {label}
            <span
              className={cn(
                "mt-0.5 block text-sm font-normal normal-case text-foreground",
                isToday && "font-semibold text-primary",
              )}
            >
              {formatDate(`${dateStr}T00:00:00-03:00`)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 p-3 pt-0">
          {items.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin eventos.</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="rounded-md border border-border p-2 text-xs">
                <p className="font-medium">{item.title}</p>
                <p className="text-muted-foreground">
                  {item.kind === "exam"
                    ? formatTime(item.startsAt)
                    : `${formatTime(item.startsAt)}–${formatTime(item.endsAt)}`}
                </p>
                <Badge variant="outline" className="mt-1">
                  {CATEGORY_LABELS[item.category]}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <DayQuickAddDialog
        target={open ? { dateStr, dateLabel: dayLabel(dateStr) } : null}
        onOpenChange={setOpen}
      />
    </>
  );
}
