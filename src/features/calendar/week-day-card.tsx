"use client";

import * as React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { GraduationCap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DayQuickAddDialog, type DayQuickAddExistingItem } from "@/features/calendar/day-quick-add-dialog";
import { CATEGORY_BADGE_CLASSES, CATEGORY_LABELS, inferSchoolEventCategory } from "@/features/calendar/event-visuals";
import { formatDate, formatTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { EventCategory } from "@/types/domain";

export interface WeekDayCardItem {
  id: string;
  title: string;
  description?: string | null;
  startsAt: string;
  endsAt: string;
  category: EventCategory | null;
  kind: "event" | "exam" | "colegio";
  isFullDay?: boolean;
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
            <TooltipProvider delayDuration={250}>
              {items.map((item) => {
                const category = item.kind === "colegio" ? inferSchoolEventCategory(item.title) : (item.category ?? "otro");
                const body = (
                  <div className="rounded-md border border-border p-2 text-xs">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-muted-foreground">
                      {item.isFullDay
                        ? "Todo el dia"
                        : item.kind === "exam"
                          ? formatTime(item.startsAt)
                          : `${formatTime(item.startsAt)}–${formatTime(item.endsAt)}`}
                    </p>
                    <Badge
                      variant="outline"
                      className={cn("mt-1 gap-0.5 border-transparent", CATEGORY_BADGE_CLASSES[category])}
                    >
                      {item.kind === "colegio" ? <GraduationCap className="size-3" aria-hidden="true" /> : null}
                      {CATEGORY_LABELS[category]}
                    </Badge>
                  </div>
                );
                if (!item.description) return <React.Fragment key={item.id}>{body}</React.Fragment>;
                return (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>{body}</TooltipTrigger>
                    <TooltipContent className="max-w-64 text-left">
                      <p className="whitespace-pre-line text-muted-foreground">{item.description}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </TooltipProvider>
          )}
        </CardContent>
      </Card>

      <DayQuickAddDialog
        target={
          open
            ? {
                dateStr,
                dateLabel: dayLabel(dateStr),
                items: items.map(
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
        onOpenChange={setOpen}
      />
    </>
  );
}
