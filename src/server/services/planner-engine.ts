import { addDays, format, parseISO } from "date-fns";
import {
  detectAllConflicts,
  detectDailyOverload,
  detectMissingBreaks,
} from "@/server/services/conflict-detection";
import type {
  AvailabilityRule,
  CalendarEvent,
  Exam,
  GeneratedPlan,
  PlannerConflict,
  Project,
  ProposedTimeBlock,
  StudySession,
  StudyTopic,
  Task,
  TaskPriority,
  UnscheduledItem,
} from "@/types/domain";

/**
 * Rule-based weekly planner. Deterministic on purpose — see
 * docs/decisions/0004-planner-is-deterministic.md. An AI layer can rewrite
 * `summary`/explanations for tone, but it never decides *what* gets
 * scheduled: that stays auditable and reproducible from plain data.
 */

const BLOCK_MINUTES = 50;
const BREAK_MINUTES = 10;
const MIN_USABLE_SLOT_MINUTES = 20;
const DEFAULT_WINDOW = { start: 16 * 60, end: 22 * 60 }; // 16:00-22:00
const DEFAULT_MAX_DAILY_STUDY_MINUTES = 240;
const EXAM_HORIZON_DAYS = 14;
const PRIORITY_WEIGHT: Record<TaskPriority, number> = { alta: 3, media: 2, baja: 1 };

interface Interval {
  start: number; // minutes since 00:00
  end: number;
}

interface DaySlots {
  date: string; // yyyy-MM-dd
  windows: Interval[];
}

interface PlannerNeed {
  id: string;
  refId: string;
  refType: "task" | "exam" | "project";
  title: string;
  reason: string;
  minutesNeeded: number;
  priorityScore: number;
  priorityLabel: TaskPriority;
  notAfterDate: string | null; // yyyy-MM-dd, inclusive
  topicName?: string;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function minutesOfDay(iso: string): number {
  const d = parseISO(iso);
  return d.getHours() * 60 + d.getMinutes();
}

function dateKey(iso: string): string {
  return iso.slice(0, 10);
}

function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function subtractInterval(windows: Interval[], remove: Interval): Interval[] {
  const result: Interval[] = [];
  for (const w of windows) {
    if (remove.end <= w.start || remove.start >= w.end) {
      result.push(w);
      continue;
    }
    if (remove.start > w.start) result.push({ start: w.start, end: Math.min(remove.start, w.end) });
    if (remove.end < w.end) result.push({ start: Math.max(remove.end, w.start), end: w.end });
  }
  return result;
}

function buildFreeSlotsForWeek(
  weekStartDate: Date,
  availabilityRules: AvailabilityRule[],
  events: CalendarEvent[],
): DaySlots[] {
  const days: DaySlots[] = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(weekStartDate, i);
    const dateStr = format(date, "yyyy-MM-dd");
    const weekday = date.getDay();

    const disponibleRules = availabilityRules.filter((r) => r.weekday === weekday && r.kind === "disponible");
    const noDisponibleRules = availabilityRules.filter(
      (r) => r.weekday === weekday && r.kind === "no_disponible",
    );

    let windows: Interval[] =
      disponibleRules.length > 0
        ? disponibleRules.map((r) => ({ start: toMinutes(r.startTime), end: toMinutes(r.endTime) }))
        : [{ ...DEFAULT_WINDOW }];

    for (const rule of noDisponibleRules) {
      windows = subtractInterval(windows, { start: toMinutes(rule.startTime), end: toMinutes(rule.endTime) });
    }

    const fixedEventsToday = events.filter((e) => e.isFixed && dateKey(e.startsAt) === dateStr);
    for (const event of fixedEventsToday) {
      windows = subtractInterval(windows, {
        start: minutesOfDay(event.startsAt),
        end: minutesOfDay(event.endsAt),
      });
    }

    days.push({
      date: dateStr,
      windows: windows
        .filter((w) => w.end - w.start >= MIN_USABLE_SLOT_MINUTES)
        .sort((a, b) => a.start - b.start),
    });
  }
  return days;
}

function buildNeeds(input: {
  weekStart: Date;
  exams: Exam[];
  topics: StudyTopic[];
  tasks: Task[];
  projects: Project[];
  subjectNameById: Map<string, string>;
}): PlannerNeed[] {
  const { weekStart, exams, topics, tasks, projects, subjectNameById } = input;
  const weekEnd = addDays(weekStart, 6);
  const needs: PlannerNeed[] = [];

  const relevantExams = exams.filter((e) => {
    if (e.status !== "programado") return false;
    const examDate = parseISO(e.scheduledAt);
    const daysUntil = (examDate.getTime() - weekStart.getTime()) / 86_400_000;
    return daysUntil >= 0 && daysUntil <= EXAM_HORIZON_DAYS;
  });

  for (const exam of relevantExams) {
    const subjectName = subjectNameById.get(exam.subjectId) ?? "la materia";
    const examTopics = topics.filter((t) => exam.topicIds.includes(t.id) && t.status !== "dominado");
    const examDateKey = dateKey(exam.scheduledAt);
    const notAfterDate = examDateKey <= format(weekEnd, "yyyy-MM-dd") ? examDateKey : format(weekEnd, "yyyy-MM-dd");

    for (const topic of examTopics) {
      const urgencyBoost = topic.selfConfidence < 40 ? 2 : topic.selfConfidence < 70 ? 1 : 0;
      const priorityScore = PRIORITY_WEIGHT[exam.importance === "alta" ? "alta" : exam.importance] + urgencyBoost;
      const blocksNeeded = topic.selfConfidence < 40 ? 2 : 1;
      needs.push({
        id: `exam-${exam.id}-topic-${topic.id}`,
        refId: exam.id,
        refType: "exam",
        title: `Repasar "${topic.name}"`,
        reason: `Reforzar "${topic.name}" antes del examen de ${subjectName} (confianza declarada ${topic.selfConfidence}/100).`,
        minutesNeeded: blocksNeeded * BLOCK_MINUTES,
        priorityScore,
        priorityLabel: exam.importance,
        notAfterDate,
        topicName: topic.name,
      });
    }
  }

  const pendingTasks = tasks.filter(
    (t) => t.status !== "completada" && t.estimatedMinutes && t.estimatedMinutes > 0,
  );
  for (const task of pendingTasks) {
    const dueKey = task.dueAt ? dateKey(task.dueAt) : null;
    const withinWeek = dueKey ? dueKey <= format(weekEnd, "yyyy-MM-dd") : false;
    needs.push({
      id: `task-${task.id}`,
      refId: task.id,
      refType: "task",
      title: task.title,
      reason: task.dueAt
        ? `Avanzar con la tarea "${task.title}" antes de su fecha limite.`
        : `Avanzar con la tarea "${task.title}".`,
      minutesNeeded: Math.min(task.estimatedMinutes ?? BLOCK_MINUTES, BLOCK_MINUTES * 3),
      priorityScore: PRIORITY_WEIGHT[task.priority] + (withinWeek ? 1 : 0),
      priorityLabel: task.priority,
      notAfterDate: withinWeek ? dueKey : format(weekEnd, "yyyy-MM-dd"),
    });
  }

  const activeProjects = projects.filter((p) => p.status === "en_progreso" && p.nextStep).slice(0, 2);
  for (const project of activeProjects) {
    needs.push({
      id: `project-${project.id}`,
      refId: project.id,
      refType: "project",
      title: project.name,
      reason: `Dedicar tiempo al proyecto "${project.name}": ${project.nextStep}.`,
      minutesNeeded: 45,
      priorityScore: 0.5,
      priorityLabel: "baja",
      notAfterDate: format(weekEnd, "yyyy-MM-dd"),
    });
  }

  return needs.sort((a, b) => b.priorityScore - a.priorityScore);
}

export interface PlannerEngineInput {
  weekStart: string; // yyyy-MM-dd, must be a Monday
  exams: Exam[];
  topics: StudyTopic[];
  tasks: Task[];
  events: CalendarEvent[];
  availabilityRules: AvailabilityRule[];
  studySessions: StudySession[];
  projects: Project[];
  subjectNameById: Map<string, string>;
  maxDailyStudyMinutes?: number;
  now?: Date;
}

export function generatePlan(input: PlannerEngineInput): GeneratedPlan {
  const weekStartDate = parseISO(`${input.weekStart}T00:00:00-03:00`);
  const maxDaily = input.maxDailyStudyMinutes ?? DEFAULT_MAX_DAILY_STUDY_MINUTES;

  const daySlots = buildFreeSlotsForWeek(weekStartDate, input.availabilityRules, input.events);
  const dailyAllocated = new Map<string, number>(daySlots.map((d) => [d.date, 0]));
  const needs = buildNeeds({
    weekStart: weekStartDate,
    exams: input.exams,
    topics: input.topics,
    tasks: input.tasks,
    projects: input.projects,
    subjectNameById: input.subjectNameById,
  });

  const blocks: ProposedTimeBlock[] = [];
  const unscheduledItems: UnscheduledItem[] = [];
  let blockCounter = 0;

  for (const need of needs) {
    let remaining = need.minutesNeeded;
    while (remaining > 0) {
      const chunk = Math.min(BLOCK_MINUTES, remaining);
      let placed = false;

      for (const day of daySlots) {
        if (need.notAfterDate && day.date > need.notAfterDate) break;
        const allocatedSoFar = dailyAllocated.get(day.date) ?? 0;
        if (allocatedSoFar + chunk > maxDaily) continue;

        const windowIndex = day.windows.findIndex((w) => w.end - w.start >= chunk);
        if (windowIndex === -1) continue;

        const window = day.windows[windowIndex]!;
        const startMinutes = window.start;
        const endMinutes = startMinutes + chunk;

        blockCounter += 1;
        blocks.push({
          id: `block-${blockCounter}`,
          activityTitle: need.topicName ? `Estudiar: ${need.topicName}` : need.title,
          activityKind: need.refType === "project" ? "proyecto" : "estudio",
          date: day.date,
          startTime: minutesToTimeString(startMinutes),
          endTime: minutesToTimeString(endMinutes),
          reason: need.reason,
          priority: need.priorityLabel,
          movable: true,
          sourceRefId: need.refId,
          sourceRefType: need.refType,
        });

        const newStart = endMinutes + BREAK_MINUTES;
        day.windows[windowIndex] =
          newStart < window.end ? { start: newStart, end: window.end } : { start: window.end, end: window.end };
        day.windows = day.windows.filter((w) => w.end - w.start >= MIN_USABLE_SLOT_MINUTES);

        dailyAllocated.set(day.date, allocatedSoFar + chunk);
        remaining -= chunk;
        placed = true;
        break;
      }

      if (!placed) {
        unscheduledItems.push({
          refId: need.refId,
          refType: need.refType,
          title: need.title,
          reason: "No quedo tiempo disponible esta semana dentro de la disponibilidad configurada.",
        });
        break;
      }
    }
  }

  const timedBlocks = blocks.map((b) => ({
    id: b.id,
    startsAt: `${b.date}T${b.startTime}:00-03:00`,
    endsAt: `${b.date}T${b.endTime}:00-03:00`,
    title: b.activityTitle,
  }));

  const existingConflicts: PlannerConflict[] = detectAllConflicts({
    events: input.events,
    availabilityRules: input.availabilityRules,
    tasks: input.tasks,
    exams: input.exams,
    studySessions: input.studySessions,
    maxDailyStudyMinutes: maxDaily,
    now: input.now,
  });

  const proposalConflicts: PlannerConflict[] = [
    ...detectMissingBreaks(timedBlocks),
    ...detectDailyOverload(timedBlocks, maxDaily),
  ];

  const conflicts = [...existingConflicts, ...proposalConflicts];

  const examCount = input.exams.filter((e) => e.status === "programado").length;
  const totalPlannedMinutes = blocks.reduce((sum, b) => {
    const [sh, sm] = b.startTime.split(":").map(Number);
    const [eh, em] = b.endTime.split(":").map(Number);
    return sum + ((eh! * 60 + em!) - (sh! * 60 + sm!));
  }, 0);
  const totalPlannedHours = Math.round((totalPlannedMinutes / 60) * 10) / 10;

  const upcomingExam = [...input.exams]
    .filter((e) => e.status === "programado")
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))[0];

  const unscheduledPreview = unscheduledItems
    .slice(0, 3)
    .map((u) => `"${u.title}"`)
    .join(", ");

  const summary =
    blocks.length > 0
      ? `Propuse ${blocks.length} bloques de estudio (${totalPlannedHours} h en total) para esta semana, priorizando los temas con menor confianza declarada y las tareas con fecha mas cercana.` +
        (upcomingExam ? ` Tu proximo examen programado es "${upcomingExam.title}" el ${dateKey(upcomingExam.scheduledAt)}.` : "") +
        (unscheduledItems.length > 0
          ? ` No pude ubicar ${unscheduledItems.length} actividad(es) (${unscheduledPreview}${
              unscheduledItems.length > 3 ? ", entre otras" : ""
            }) por falta de tiempo disponible.`
          : "")
      : examCount > 0
        ? `No hay suficiente disponibilidad libre esta semana para proponer bloques de estudio, aunque tenes ${examCount} examen(es) programado(s). Revisa tu disponibilidad configurada o el maximo diario de estudio (actualmente ${maxDaily} min).`
        : "No encontre examenes ni tareas pendientes que necesiten bloques de estudio esta semana.";

  const assumptions = [
    "Los dias sin reglas de disponibilidad definidas usan una ventana de estudio por defecto de 16:00 a 22:00.",
    `Cada bloque de estudio dura ${BLOCK_MINUTES} minutos con un descanso minimo de ${BREAK_MINUTES} minutos entre bloques.`,
    `El maximo de estudio por dia esta configurado en ${maxDaily} minutos.`,
    "Los temas con confianza declarada menor a 40/100 reciben el doble de bloques de repaso.",
    `Solo se consideran examenes programados dentro de los proximos ${EXAM_HORIZON_DAYS} dias desde el inicio de la semana.`,
  ];

  const recommendations = needs
    .filter((n) => n.refType === "exam" && (n.priorityScore ?? 0) >= 4)
    .slice(0, 3)
    .map((n) => ({ message: n.reason, relatedIds: [n.refId] }));

  if (unscheduledItems.length > 0) {
    recommendations.push({
      message:
        `No quedo lugar esta semana para: ${unscheduledPreview}${
          unscheduledItems.length > 3 ? " y otras actividades" : ""
        }. Si liberas mas tiempo (subiendo el maximo diario de ${maxDaily} min o agregando disponibilidad), puedo volver a proponer el plan con eso incluido.`,
      relatedIds: unscheduledItems.map((u) => u.refId),
    });
  }

  const overloadedDays = proposalConflicts.filter((c) => c.kind === "sobrecarga_diaria");
  if (overloadedDays.length > 0) {
    const overloadedDates = overloadedDays.map((c) => c.date).filter((d): d is string => d !== null);
    recommendations.push({
      message: `Los dias ${overloadedDates.join(", ")} superan el maximo diario de estudio configurado (${maxDaily} min). Considera mover alguna sesion a un dia con menos carga o subir ese maximo si te queda comodo.`,
      relatedIds: overloadedDays.flatMap((c) => c.relatedIds),
    });
  }

  return { summary, conflicts, recommendations, blocks, unscheduledItems, assumptions };
}
