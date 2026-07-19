"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DayQuickAddDialog, type DayQuickAddTarget } from "@/features/calendar/day-quick-add-dialog";
import { cn } from "@/lib/utils";

/** Builds a label like "lunes 20 de julio" from a "yyyy-MM-dd" string using local date parts, avoiding UTC-parsing day shifts. */
function dayLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return format(new Date(year!, month! - 1, day!), "EEEE d 'de' MMMM", { locale: es });
}

const WEEKDAY_HEADERS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

export interface MonthDayCell {
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  examCount: number;
  eventCount: number;
  taskCount: number;
  schoolCount: number;
  weekHref: string;
}

export interface MonthViewProps {
  monthLabel: string;
  prevMonthHref: string;
  nextMonthHref: string;
  days: MonthDayCell[];
}

export function MonthView({ monthLabel, prevMonthHref, nextMonthHref, days }: MonthViewProps) {
  const [selected, setSelected] = React.useState<MonthDayCell | null>(null);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={prevMonthHref}>
            <ChevronLeft className="size-4" aria-hidden="true" /> Mes anterior
          </Link>
        </Button>
        <p className="text-sm font-medium capitalize">{monthLabel}</p>
        <Button asChild variant="outline" size="sm">
          <Link href={nextMonthHref}>
            Mes siguiente <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-md border border-border bg-border text-center text-xs font-medium uppercase text-muted-foreground">
        {WEEKDAY_HEADERS.map((label) => (
          <div key={label} className="bg-background py-2">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-md border border-t-0 border-border bg-border">
        {days.map((day) => {
          const total = day.examCount + day.eventCount + day.taskCount + day.schoolCount;
          return (
            <button
              key={day.dateStr}
              type="button"
              onClick={() => setSelected(day)}
              aria-label={`Agregar algo el ${dayLabel(day.dateStr)}`}
              className={cn(
                "flex min-h-20 flex-col gap-1 bg-background p-1.5 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:min-h-24 sm:p-2",
                !day.isCurrentMonth && "bg-muted/40 text-muted-foreground",
                day.isToday && "bg-primary/10 ring-1 ring-inset ring-primary/50",
              )}
            >
              <span
                className={cn(
                  "inline-flex size-5 items-center justify-center rounded-full text-xs",
                  day.isToday && "bg-primary font-semibold text-primary-foreground",
                )}
              >
                {day.dayNumber}
              </span>
              {total > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {day.examCount > 0 ? (
                    <span className="rounded-sm bg-destructive/15 px-1 text-[10px] font-medium text-destructive">
                      {day.examCount} examen{day.examCount > 1 ? "es" : ""}
                    </span>
                  ) : null}
                  {day.eventCount > 0 ? (
                    <span className="rounded-sm bg-secondary px-1 text-[10px] font-medium text-secondary-foreground">
                      {day.eventCount} evento{day.eventCount > 1 ? "s" : ""}
                    </span>
                  ) : null}
                  {day.taskCount > 0 ? (
                    <span className="rounded-sm bg-muted px-1 text-[10px] font-medium text-muted-foreground">
                      {day.taskCount} tarea{day.taskCount > 1 ? "s" : ""}
                    </span>
                  ) : null}
                  {day.schoolCount > 0 ? (
                    <span className="rounded-sm border border-violet-500/30 bg-violet-500/15 px-1 text-[10px] font-medium text-violet-700 dark:text-violet-300">
                      {day.schoolCount} colegio
                    </span>
                  ) : null}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>

      <DayQuickAddDialog
        target={
          selected
            ? ({ dateStr: selected.dateStr, dateLabel: dayLabel(selected.dateStr), weekHref: selected.weekHref } satisfies DayQuickAddTarget)
            : null
        }
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </div>
  );
}
