"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DayQuickAddDialog, type DayQuickAddExistingItem } from "@/features/calendar/day-quick-add-dialog";
import { cn } from "@/lib/utils";
import type { EventCategory } from "@/types/domain";

/** Builds a label like "lunes 20 de julio" from a "yyyy-MM-dd" string using local date parts, avoiding UTC-parsing day shifts. */
function dayLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return format(new Date(year!, month! - 1, day!), "EEEE d 'de' MMMM", { locale: es });
}

const WEEKDAY_HEADERS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

export interface MonthDayCellItem {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  kind: "event" | "exam" | "task" | "colegio";
  category?: EventCategory | null;
  isFullDay?: boolean;
}

export interface MonthDayCell {
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  items: MonthDayCellItem[];
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
          const examCount = day.items.filter((i) => i.kind === "exam").length;
          const eventCount = day.items.filter((i) => i.kind === "event").length;
          const taskCount = day.items.filter((i) => i.kind === "task").length;
          const schoolCount = day.items.filter((i) => i.kind === "colegio").length;
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
              {day.items.length > 0 ? (
                <div className="flex flex-col gap-0.5 overflow-hidden">
                  {day.items.slice(0, 3).map((item) => (
                    <span
                      key={item.id}
                      className={cn(
                        "truncate rounded-sm px-1 text-[10px] font-medium",
                        item.kind === "exam" && "bg-destructive/15 text-destructive",
                        item.kind === "event" && "bg-secondary text-secondary-foreground",
                        item.kind === "task" && "bg-muted text-muted-foreground",
                        item.kind === "colegio" &&
                          "border border-violet-500/30 bg-violet-500/15 text-violet-700 dark:text-violet-300",
                      )}
                      title={item.title}
                    >
                      {item.title}
                    </span>
                  ))}
                  {day.items.length > 3 ? (
                    <span className="px-1 text-[10px] text-muted-foreground">+{day.items.length - 3} mas</span>
                  ) : null}
                </div>
              ) : null}
              <span className="sr-only">
                {examCount > 0 ? `${examCount} examenes. ` : ""}
                {eventCount > 0 ? `${eventCount} eventos. ` : ""}
                {taskCount > 0 ? `${taskCount} tareas. ` : ""}
                {schoolCount > 0 ? `${schoolCount} eventos del colegio.` : ""}
              </span>
            </button>
          );
        })}
      </div>

      <DayQuickAddDialog
        target={
          selected
            ? {
                dateStr: selected.dateStr,
                dateLabel: dayLabel(selected.dateStr),
                weekHref: selected.weekHref,
                items: selected.items.map(
                  (item): DayQuickAddExistingItem => ({
                    id: item.id,
                    title: item.title,
                    startsAt: item.startsAt,
                    endsAt: item.endsAt,
                    kind: item.kind,
                    category: item.category,
                    isFullDay: item.isFullDay,
                  }),
                ),
              }
            : null
        }
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </div>
  );
}
