import Link from "next/link";
import { addDays, addMonths, eachDayOfInterval, format, isSameMonth } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertTriangle,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ListPlus,
} from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AvailabilityRules } from "@/features/calendar/availability-rules";
import { CreateEventDialog } from "@/features/calendar/create-event-dialog";
import { MonthView, type MonthDayCell, type MonthDayCellItem } from "@/features/calendar/month-view";
import { WeekDayCard } from "@/features/calendar/week-day-card";
import { PlannerPanel } from "@/features/planner/planner-panel";
import { CreateTaskDialog } from "@/features/tasks/create-task-dialog";
import { TaskItem } from "@/features/tasks/task-item";
import { requireSessionUser } from "@/lib/auth/session";
import { formatDate, getMonthGridBounds, getWeekBounds, todayISODate } from "@/lib/dates";
import { fetchIcsText } from "@/lib/integrations/ics-fetch";
import { examsRepository, studySessionsRepository, tasksRepository } from "@/server/repositories/academic-repository";
import { availabilityRepository, eventsRepository } from "@/server/repositories/calendar-repository";
import { preferencesRepository } from "@/server/repositories/profile-repository";
import { detectAllConflicts } from "@/server/services/conflict-detection";
import { expandSchoolCalendarEvents, parseIcsCalendar } from "@/server/services/school-calendar";
import { deriveEffectiveTaskStatus } from "@/server/services/task-status";
import type { EventCategory } from "@/types/domain";

const WEEKDAYS_ES = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];

const EXAM_IMPORTANCE_LABELS: Record<string, string> = { baja: "Baja", media: "Media", alta: "Alta" };

interface DayItem {
  id: string;
  title: string;
  description?: string | null;
  startsAt: string;
  endsAt: string;
  category: EventCategory | null;
  kind: "event" | "exam" | "colegio";
  isFullDay?: boolean;
}

interface AgendaPageProps {
  searchParams: Promise<{ week?: string; month?: string; view?: string }>;
}

export default async function AgendaPage({ searchParams }: AgendaPageProps) {
  const user = await requireSessionUser();
  const { week, month, view: viewParam } = await searchParams;
  const view: "week" | "month" = viewParam === "month" ? "month" : "week";

  const now = new Date();
  const todayStr = todayISODate(now);
  const isValidWeekParam = !!week && /^\d{4}-\d{2}-\d{2}$/.test(week);
  const referenceDate = isValidWeekParam ? new Date(`${week}T12:00:00`) : now;
  const { start: weekStart } = getWeekBounds(referenceDate);
  const weekStartStr = format(weekStart, "yyyy-MM-dd");
  const weekEndStr = format(addDays(weekStart, 6), "yyyy-MM-dd");
  const prevWeekStr = format(addDays(weekStart, -7), "yyyy-MM-dd");
  const nextWeekStr = format(addDays(weekStart, 7), "yyyy-MM-dd");

  const isValidMonthParam = !!month && /^\d{4}-\d{2}$/.test(month);
  const monthDate = isValidMonthParam ? new Date(`${month}-01T12:00:00`) : now;
  const monthAnchor = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1, 12);
  const monthStr = format(monthAnchor, "yyyy-MM");
  const prevMonthStr = format(addMonths(monthAnchor, -1), "yyyy-MM");
  const nextMonthStr = format(addMonths(monthAnchor, 1), "yyyy-MM");
  const monthLabel = format(monthAnchor, "MMMM yyyy", { locale: es });

  const startIso = `${weekStartStr}T00:00:00-03:00`;
  const endIso = `${weekEndStr}T23:59:59-03:00`;

  const allEvents = await eventsRepository.list(user.userId);
  const weekEvents = await eventsRepository.listBetween(user.userId, startIso, endIso);
  const allExams = await examsRepository.list(user.userId);
  const weekExams = allExams.filter((e) => e.scheduledAt >= startIso && e.scheduledAt <= endIso);
  const allTasks = await tasksRepository.list(user.userId);
  const pendingTasks = allTasks
    .filter((t) => deriveEffectiveTaskStatus(t, now) !== "completada")
    .sort((a, b) => (a.dueAt ?? "9999").localeCompare(b.dueAt ?? "9999"));
  const availabilityRules = await availabilityRepository.list(user.userId);
  const studySessions = await studySessionsRepository.list(user.userId);

  const conflicts = detectAllConflicts({
    events: allEvents,
    availabilityRules,
    tasks: allTasks,
    exams: allExams,
    studySessions,
    now,
  });

  const { start: monthGridStart, end: monthGridEnd } = getMonthGridBounds(monthAnchor);

  const preferences = await preferencesRepository.get(user.userId);
  let schoolCalendarError: string | null = null;
  let schoolEvents: ReturnType<typeof expandSchoolCalendarEvents> = [];
  if (preferences.schoolCalendarIcsUrl) {
    try {
      const icsText = await fetchIcsText(preferences.schoolCalendarIcsUrl, { revalidateSeconds: 900 });
      const calendar = parseIcsCalendar(icsText);
      schoolEvents = expandSchoolCalendarEvents(calendar, monthGridStart, monthGridEnd);
    } catch (error) {
      schoolCalendarError =
        error instanceof Error ? error.message : "No pudimos leer el calendario del colegio.";
    }
  }
  const weekSchoolEvents = schoolEvents.filter((e) => e.startsAt >= startIso && e.startsAt <= endIso);

  const monthDayCells: MonthDayCell[] = eachDayOfInterval({ start: monthGridStart, end: monthGridEnd }).map(
    (date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      const { start: dayWeekStart } = getWeekBounds(date);
      const items: MonthDayCellItem[] = [
        ...allEvents
          .filter((e) => e.startsAt.slice(0, 10) === dateStr)
          .map((e) => ({
            id: e.id,
            title: e.title,
            description: e.notes,
            startsAt: e.startsAt,
            endsAt: e.endsAt,
            category: e.category as EventCategory | null,
            kind: "event" as const,
          })),
        ...allExams
          .filter((e) => e.scheduledAt.slice(0, 10) === dateStr)
          .map((e) => ({
            id: e.id,
            title: `Examen: ${e.title}`,
            description: `Duracion: ${e.durationMinutes} min · Importancia: ${EXAM_IMPORTANCE_LABELS[e.importance] ?? e.importance}`,
            startsAt: e.scheduledAt,
            endsAt: e.scheduledAt,
            category: "examen" as EventCategory | null,
            kind: "exam" as const,
          })),
        ...allTasks
          .filter((t) => t.dueAt?.slice(0, 10) === dateStr)
          .map((t) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            startsAt: t.dueAt!,
            endsAt: t.dueAt!,
            category: null,
            kind: "task" as const,
          })),
        ...schoolEvents
          .filter((e) => e.startsAt.slice(0, 10) === dateStr)
          .map((e) => ({
            id: e.uid,
            title: e.title,
            description: e.description,
            startsAt: e.startsAt,
            endsAt: e.endsAt,
            category: null,
            kind: "colegio" as const,
            isFullDay: e.isFullDay,
          })),
      ].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
      return {
        dateStr,
        dayNumber: date.getDate(),
        isCurrentMonth: isSameMonth(date, monthAnchor),
        isToday: dateStr === todayStr,
        items,
        weekHref: `/agenda?view=week&week=${format(dayWeekStart, "yyyy-MM-dd")}`,
      };
    },
  );

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const dateStr = format(date, "yyyy-MM-dd");
    const items: DayItem[] = [
      ...weekEvents
        .filter((e) => e.startsAt.slice(0, 10) === dateStr)
        .map((e) => ({
          id: e.id,
          title: e.title,
          description: e.notes,
          startsAt: e.startsAt,
          endsAt: e.endsAt,
          category: e.category as EventCategory | null,
          kind: "event" as const,
        })),
      ...weekExams
        .filter((e) => e.scheduledAt.slice(0, 10) === dateStr)
        .map((e) => ({
          id: e.id,
          title: `Examen: ${e.title}`,
          description: `Duracion: ${e.durationMinutes} min · Importancia: ${EXAM_IMPORTANCE_LABELS[e.importance] ?? e.importance}`,
          startsAt: e.scheduledAt,
          endsAt: e.scheduledAt,
          category: "examen" as EventCategory | null,
          kind: "exam" as const,
        })),
      ...weekSchoolEvents
        .filter((e) => e.startsAt.slice(0, 10) === dateStr)
        .map((e) => ({
          id: e.uid,
          title: e.title,
          description: e.description,
          startsAt: e.startsAt,
          endsAt: e.endsAt,
          category: null,
          kind: "colegio" as const,
          isFullDay: e.isFullDay,
        })),
    ].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    return { dateStr, label: WEEKDAYS_ES[i]!, items };
  });

  return (
    <div>
      <PageHeader
        title="Agenda"
        description="Calendario de examenes, entregas y eventos."
        actions={
          <>
            <CreateTaskDialog />
            <CreateEventDialog />
          </>
        }
      />

      {schoolCalendarError ? (
        <p className="mb-4 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
          No pudimos leer el calendario del colegio: {schoolCalendarError} Revisa la URL en Configuracion.
        </p>
      ) : null}

      <div className="mb-6 flex items-center gap-2">
        <Button asChild variant={view === "week" ? "default" : "outline"} size="sm">
          <Link href={`/agenda?view=week&week=${weekStartStr}`}>
            <CalendarRange className="size-4" aria-hidden="true" /> Semana
          </Link>
        </Button>
        <Button asChild variant={view === "month" ? "default" : "outline"} size="sm">
          <Link href={`/agenda?view=month&month=${monthStr}`}>
            <CalendarDays className="size-4" aria-hidden="true" /> Mes
          </Link>
        </Button>
      </div>

      {view === "month" ? (
        <div className="mb-6">
          <MonthView
            monthLabel={monthLabel}
            prevMonthHref={`/agenda?view=month&month=${prevMonthStr}`}
            nextMonthHref={`/agenda?view=month&month=${nextMonthStr}`}
            days={monthDayCells}
          />
        </div>
      ) : (
        <>
          <div className="mb-6 flex items-center justify-between gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/agenda?view=week&week=${prevWeekStr}`}>
                <ChevronLeft className="size-4" aria-hidden="true" /> Semana anterior
              </Link>
            </Button>
            <p className="text-sm font-medium">
              {formatDate(startIso)} — {formatDate(`${weekEndStr}T00:00:00-03:00`)}
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href={`/agenda?view=week&week=${nextWeekStr}`}>
                Semana siguiente <ChevronRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <div className="mb-6">
            <PlannerPanel weekStart={weekStartStr} />
          </div>

          <div className="mb-6 grid gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {days.map((day) => (
              <WeekDayCard
                key={day.dateStr}
                dateStr={day.dateStr}
                label={day.label}
                items={day.items}
                isToday={day.dateStr === todayStr}
              />
            ))}
          </div>
        </>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tareas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingTasks.length === 0 ? (
              <EmptyState
                icon={ListPlus}
                title="No tenes tareas pendientes"
                description='Usa "Nueva tarea" para agregar una.'
              />
            ) : (
              pendingTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  isOverdue={deriveEffectiveTaskStatus(task, now) === "vencida"}
                />
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-amber-500" aria-hidden="true" />
              Conflictos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {conflicts.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="size-4 text-emerald-500" aria-hidden="true" /> No detectamos conflictos.
              </p>
            ) : (
              conflicts.map((c, i) => (
                <div key={i} className="flex items-start justify-between gap-2 text-sm">
                  <span>{c.message}</span>
                  <Badge
                    variant={
                      c.severity === "critico" ? "destructive" : c.severity === "advertencia" ? "outline" : "secondary"
                    }
                  >
                    {c.severity}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <AvailabilityRules rules={availabilityRules} />
      </div>
    </div>
  );
}
