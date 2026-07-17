import Link from "next/link";
import { addDays, format } from "date-fns";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, ListPlus } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AvailabilityRules } from "@/features/calendar/availability-rules";
import { CreateEventDialog } from "@/features/calendar/create-event-dialog";
import { PlannerPanel } from "@/features/planner/planner-panel";
import { CreateTaskDialog } from "@/features/tasks/create-task-dialog";
import { TaskItem } from "@/features/tasks/task-item";
import { requireSessionUser } from "@/lib/auth/session";
import { formatDate, formatTime, getWeekBounds } from "@/lib/dates";
import { examsRepository, studySessionsRepository, tasksRepository } from "@/server/repositories/academic-repository";
import { availabilityRepository, eventsRepository } from "@/server/repositories/calendar-repository";
import { detectAllConflicts } from "@/server/services/conflict-detection";
import { deriveEffectiveTaskStatus } from "@/server/services/task-status";
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

const WEEKDAYS_ES = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];

interface DayItem {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  category: EventCategory;
  kind: "event" | "exam";
}

interface AgendaPageProps {
  searchParams: Promise<{ week?: string }>;
}

export default async function AgendaPage({ searchParams }: AgendaPageProps) {
  const user = await requireSessionUser();
  const { week } = await searchParams;

  const now = new Date();
  const isValidWeekParam = !!week && /^\d{4}-\d{2}-\d{2}$/.test(week);
  const referenceDate = isValidWeekParam ? new Date(`${week}T12:00:00`) : now;
  const { start: weekStart } = getWeekBounds(referenceDate);
  const weekStartStr = format(weekStart, "yyyy-MM-dd");
  const weekEndStr = format(addDays(weekStart, 6), "yyyy-MM-dd");
  const prevWeekStr = format(addDays(weekStart, -7), "yyyy-MM-dd");
  const nextWeekStr = format(addDays(weekStart, 7), "yyyy-MM-dd");

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

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const dateStr = format(date, "yyyy-MM-dd");
    const items: DayItem[] = [
      ...weekEvents
        .filter((e) => e.startsAt.slice(0, 10) === dateStr)
        .map((e) => ({
          id: e.id,
          title: e.title,
          startsAt: e.startsAt,
          endsAt: e.endsAt,
          category: e.category,
          kind: "event" as const,
        })),
      ...weekExams
        .filter((e) => e.scheduledAt.slice(0, 10) === dateStr)
        .map((e) => ({
          id: e.id,
          title: `Examen: ${e.title}`,
          startsAt: e.scheduledAt,
          endsAt: e.scheduledAt,
          category: "examen" as const,
          kind: "exam" as const,
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

      <div className="mb-6 flex items-center justify-between gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/agenda?week=${prevWeekStr}`}>
            <ChevronLeft className="size-4" aria-hidden="true" /> Semana anterior
          </Link>
        </Button>
        <p className="text-sm font-medium">
          {formatDate(startIso)} — {formatDate(`${weekEndStr}T00:00:00-03:00`)}
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href={`/agenda?week=${nextWeekStr}`}>
            Semana siguiente <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <PlannerPanel weekStart={weekStartStr} />
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {days.map((day) => (
          <Card key={day.dateStr}>
            <CardHeader className="p-3">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
                {day.label}
                <span className="mt-0.5 block text-sm font-normal normal-case text-foreground">
                  {formatDate(`${day.dateStr}T00:00:00-03:00`)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-3 pt-0">
              {day.items.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sin eventos.</p>
              ) : (
                day.items.map((item) => (
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
        ))}
      </div>

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
