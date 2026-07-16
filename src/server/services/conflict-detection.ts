import { parseISO } from "date-fns";
import type {
  AvailabilityRule,
  CalendarEvent,
  Exam,
  PlannerConflict,
  StudySession,
  Task,
} from "@/types/domain";

/**
 * Deterministic conflict detection. No AI involved on purpose: the planner
 * can *explain* these conflicts in natural language, but detecting them must
 * be reproducible, testable, and never hallucinate a conflict that isn't real.
 */

const DEFAULT_MAX_DAILY_STUDY_MINUTES = 240;
const DEFAULT_MIN_BREAK_MINUTES = 10;
const DEFAULT_MAX_BLOCK_MINUTES = 90;

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function dateKey(iso: string): string {
  return iso.slice(0, 10);
}

export function detectEventOverlaps(events: CalendarEvent[]): PlannerConflict[] {
  const conflicts: PlannerConflict[] = [];
  const sorted = [...events].sort(
    (a, b) => parseISO(a.startsAt).getTime() - parseISO(b.startsAt).getTime(),
  );
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const a = sorted[i]!;
      const b = sorted[j]!;
      const aStart = parseISO(a.startsAt);
      const aEnd = parseISO(a.endsAt);
      const bStart = parseISO(b.startsAt);
      const bEnd = parseISO(b.endsAt);
      if (bStart >= aEnd) break; // sorted by start: no later item can overlap `a`
      if (overlaps(aStart, aEnd, bStart, bEnd)) {
        conflicts.push({
          kind: "solapamiento",
          severity: "critico",
          message: `"${a.title}" se superpone con "${b.title}" el ${dateKey(a.startsAt)}.`,
          relatedIds: [a.id, b.id],
          date: dateKey(a.startsAt),
        });
      }
    }
  }
  return conflicts;
}

function weekdayOf(iso: string): number {
  return parseISO(iso).getDay();
}

function toMinutesOfDay(iso: string): number {
  const d = parseISO(iso);
  return d.getHours() * 60 + d.getMinutes();
}

function timeStringToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Flags events that fall inside an explicit "no_disponible" window. */
export function detectOutsideAvailability(
  events: CalendarEvent[],
  rules: AvailabilityRule[],
): PlannerConflict[] {
  const conflicts: PlannerConflict[] = [];
  const blockingRules = rules.filter((r) => r.kind === "no_disponible");
  for (const event of events) {
    const weekday = weekdayOf(event.startsAt);
    const startMin = toMinutesOfDay(event.startsAt);
    const endMin = startMin + (parseISO(event.endsAt).getTime() - parseISO(event.startsAt).getTime()) / 60000;
    for (const rule of blockingRules) {
      if (rule.weekday !== weekday) continue;
      const ruleStart = timeStringToMinutes(rule.startTime);
      const ruleEnd = timeStringToMinutes(rule.endTime);
      if (startMin < ruleEnd && ruleStart < endMin) {
        conflicts.push({
          kind: "fuera_de_disponibilidad",
          severity: "advertencia",
          message: `"${event.title}" cae dentro de un horario marcado como no disponible${
            rule.label ? ` (${rule.label})` : ""
          }.`,
          relatedIds: [event.id, rule.id],
          date: dateKey(event.startsAt),
        });
      }
    }
  }
  return conflicts;
}

export function detectOverdueTasks(tasks: Task[], now = new Date()): PlannerConflict[] {
  return tasks
    .filter((t) => t.status !== "completada" && t.dueAt && parseISO(t.dueAt) < now)
    .map((t) => ({
      kind: "fecha_vencida" as const,
      severity: "critico" as const,
      message: `La tarea "${t.title}" vencio el ${dateKey(t.dueAt!)} y sigue sin completarse.`,
      relatedIds: [t.id],
      date: dateKey(t.dueAt!),
    }));
}

export function detectOverdueExams(exams: Exam[], now = new Date()): PlannerConflict[] {
  return exams
    .filter((e) => e.status === "programado" && parseISO(e.scheduledAt) < now)
    .map((e) => ({
      kind: "fecha_vencida" as const,
      severity: "advertencia" as const,
      message: `El examen "${e.title}" ya paso su fecha y sigue marcado como programado.`,
      relatedIds: [e.id],
      date: dateKey(e.scheduledAt),
    }));
}

/**
 * A task "doesn't have enough time" when the remaining free minutes between
 * now and its due date (computed from availability rules minus committed
 * events) is less than its estimate.
 */
export function detectTasksWithoutEnoughTime(
  tasks: Task[],
  availableMinutesUntilDue: (task: Task) => number,
): PlannerConflict[] {
  const conflicts: PlannerConflict[] = [];
  for (const task of tasks) {
    if (task.status === "completada" || !task.dueAt || !task.estimatedMinutes) continue;
    const free = availableMinutesUntilDue(task);
    if (free < task.estimatedMinutes) {
      conflicts.push({
        kind: "tarea_sin_tiempo_suficiente",
        severity: "advertencia",
        message: `"${task.title}" necesita ${task.estimatedMinutes} min pero solo quedan ${Math.max(
          free,
          0,
        )} min disponibles antes de la fecha limite.`,
        relatedIds: [task.id],
        date: dateKey(task.dueAt),
      });
    }
  }
  return conflicts;
}

export function detectExamsWithoutSessions(
  exams: Exam[],
  sessions: StudySession[],
  now = new Date(),
): PlannerConflict[] {
  return exams
    .filter((e) => e.status !== "rendido" && e.status !== "cancelado" && parseISO(e.scheduledAt) > now)
    .filter((e) => !sessions.some((s) => s.examId === e.id))
    .map((e) => ({
      kind: "examen_sin_sesiones" as const,
      severity: "advertencia" as const,
      message: `El examen "${e.title}" todavia no tiene ninguna sesion de estudio planificada.`,
      relatedIds: [e.id],
      date: dateKey(e.scheduledAt),
    }));
}

interface TimedBlock {
  id: string;
  startsAt: string;
  endsAt: string;
  title: string;
}

export function detectMissingBreaks(
  blocks: TimedBlock[],
  minBreakMinutes = DEFAULT_MIN_BREAK_MINUTES,
): PlannerConflict[] {
  const conflicts: PlannerConflict[] = [];
  const sorted = [...blocks].sort(
    (a, b) => parseISO(a.startsAt).getTime() - parseISO(b.startsAt).getTime(),
  );
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i]!;
    const next = sorted[i + 1]!;
    const gapMinutes = (parseISO(next.startsAt).getTime() - parseISO(current.endsAt).getTime()) / 60000;
    if (gapMinutes >= 0 && gapMinutes < minBreakMinutes) {
      conflicts.push({
        kind: "sin_descanso",
        severity: "info",
        message: `Entre "${current.title}" y "${next.title}" hay menos de ${minBreakMinutes} min de descanso.`,
        relatedIds: [current.id, next.id],
        date: dateKey(current.startsAt),
      });
    }
  }
  return conflicts;
}

export function detectLongBlocks(
  blocks: TimedBlock[],
  maxBlockMinutes = DEFAULT_MAX_BLOCK_MINUTES,
): PlannerConflict[] {
  return blocks
    .filter((b) => (parseISO(b.endsAt).getTime() - parseISO(b.startsAt).getTime()) / 60000 > maxBlockMinutes)
    .map((b) => ({
      kind: "sin_descanso" as const,
      severity: "info" as const,
      message: `"${b.title}" dura mas de ${maxBlockMinutes} minutos seguidos. Conviene dividirlo.`,
      relatedIds: [b.id],
      date: dateKey(b.startsAt),
    }));
}

export function detectDailyOverload(
  blocks: TimedBlock[],
  maxDailyMinutes = DEFAULT_MAX_DAILY_STUDY_MINUTES,
): PlannerConflict[] {
  const minutesByDay = new Map<string, number>();
  const idsByDay = new Map<string, string[]>();
  for (const block of blocks) {
    const key = dateKey(block.startsAt);
    const minutes = (parseISO(block.endsAt).getTime() - parseISO(block.startsAt).getTime()) / 60000;
    minutesByDay.set(key, (minutesByDay.get(key) ?? 0) + minutes);
    idsByDay.set(key, [...(idsByDay.get(key) ?? []), block.id]);
  }
  const conflicts: PlannerConflict[] = [];
  for (const [day, minutes] of minutesByDay.entries()) {
    if (minutes > maxDailyMinutes) {
      conflicts.push({
        kind: "sobrecarga_diaria",
        severity: "advertencia",
        message: `El ${day} acumula ${Math.round(minutes)} min de estudio, por encima del maximo de ${maxDailyMinutes} min configurado.`,
        relatedIds: idsByDay.get(day) ?? [],
        date: day,
      });
    }
  }
  return conflicts;
}

export interface FullConflictInput {
  events: CalendarEvent[];
  availabilityRules: AvailabilityRule[];
  tasks: Task[];
  exams: Exam[];
  studySessions: StudySession[];
  now?: Date;
  maxDailyStudyMinutes?: number;
}

export function detectAllConflicts(input: FullConflictInput): PlannerConflict[] {
  const now = input.now ?? new Date();
  const studyBlocks: TimedBlock[] = input.studySessions.map((s) => ({
    id: s.id,
    startsAt: s.startsAt,
    endsAt: s.endsAt,
    title: "Sesion de estudio",
  }));

  return [
    ...detectEventOverlaps(input.events),
    ...detectOutsideAvailability(input.events, input.availabilityRules),
    ...detectOverdueTasks(input.tasks, now),
    ...detectOverdueExams(input.exams, now),
    ...detectExamsWithoutSessions(input.exams, input.studySessions, now),
    ...detectMissingBreaks(studyBlocks),
    ...detectLongBlocks(studyBlocks),
    ...detectDailyOverload(studyBlocks, input.maxDailyStudyMinutes),
  ];
}
