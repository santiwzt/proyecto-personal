"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, GraduationCap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DayQuickAddDialog, type DayQuickAddExistingItem } from "@/features/calendar/day-quick-add-dialog";
import {
  CATEGORY_BADGE_CLASSES,
  CATEGORY_LABELS,
  inferSchoolEventCategory,
  TASK_BADGE_CLASSES,
} from "@/features/calendar/event-visuals";
import { formatTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { EventCategory } from "@/types/domain";

function itemCategory(item: MonthDayCellItem): EventCategory {
  if (item.kind === "colegio") return inferSchoolEventCategory(item.title);
  return item.category ?? "otro";
}

function itemChipClasses(item: MonthDayCellItem): string {
  if (item.kind === "task") return TASK_BADGE_CLASSES;
  return CATEGORY_BADGE_CLASSES[itemCategory(item)];
}

function itemKindLabel(item: MonthDayCellItem): string {
  if (item.kind === "task") return "Tarea";
  return CATEGORY_LABELS[itemCategory(item)];
}

/** Builds a label like "lunes 20 de julio" from a "yyyy-MM-dd" string using local date parts, avoiding UTC-parsing day shifts. */
function dayLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return format(new Date(year!, month! - 1, day!), "EEEE d 'de' MMMM", { locale: es });
}

const WEEKDAY_HEADERS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

export interface MonthDayCellItem {
  id: string;
  title: string;
  description?: string | null;
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

function ItemChip({ item }: { item: MonthDayCellItem }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "flex items-center gap-0.5 truncate rounded-sm px-1 text-[10px] font-medium",
            itemChipClasses(item),
          )}
        >
          {item.kind === "colegio" ? (
            <GraduationCap className="size-2.5 shrink-0" aria-hidden="true" />
          ) : null}
          <span className="truncate">{item.title}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-64 text-left">
        <p className="font-medium">{item.title}</p>
        <p className="text-muted-foreground">
          {item.isFullDay ? "Todo el dia" : `${formatTime(item.startsAt)}–${formatTime(item.endsAt)}`} ·{" "}
          {itemKindLabel(item)}
          {item.kind === "colegio" ? " · Colegio" : ""}
        </p>
        {item.description ? <p className="mt-1 whitespace-pre-line text-muted-foreground">{item.description}</p> : null}
      </TooltipContent>
    </Tooltip>
  );
}

export function MonthView({ monthLabel, prevMonthHref, nextMonthHref, days }: MonthViewProps) {
  const [selected, setSelected] = React.useState<MonthDayCell | null>(null);

  return (
    <TooltipProvider delayDuration={250}>
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
                      <ItemChip key={item.id} item={item} />
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
    </TooltipProvider>
  );
}
