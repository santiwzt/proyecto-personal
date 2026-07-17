import { addDays, format } from "date-fns";
import type { QuickCaptureResult } from "@/types/domain";

/**
 * Deterministic, rule-based parser for the quick-capture bar. On purpose
 * this never calls an AI model: it must be fast, free, reproducible, and
 * the UI always requires explicit confirmation before saving anything it
 * returns — see docs/decisions/0003-quick-capture-parser.md.
 */

export interface QuickCaptureContext {
  now?: Date;
  subjects: { id: string; name: string }[];
  topics: { id: string; name: string; subjectId: string }[];
}

const WEEKDAYS: Record<string, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  miércoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
  sábado: 6,
};

function stripAccents(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function toIso(date: Date, hour: number, minute: number): string {
  const dateStr = format(date, "yyyy-MM-dd");
  return `${dateStr}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00-03:00`;
}

function findWeekdayMatch(text: string): { weekday: number; matched: string } | null {
  const normalized = stripAccents(text.toLowerCase());
  for (const [name, weekday] of Object.entries(WEEKDAYS)) {
    const normalizedName = stripAccents(name);
    if (normalized.includes(normalizedName)) {
      return { weekday, matched: name };
    }
  }
  return null;
}

function resolveDate(text: string, now: Date): Date | null {
  const normalized = stripAccents(text.toLowerCase());
  if (/\bpasado\s+manana\b/.test(normalized)) return addDays(now, 2);
  if (/\bmanana\b/.test(normalized) && !/\bpor la manana\b|\bde la manana\b/.test(normalized)) {
    return addDays(now, 1);
  }
  if (/\bhoy\b/.test(normalized)) return now;

  if (/\ben\s+una\s+semana\b|\bdentro\s+de\s+una\s+semana\b|\bla\s+semana\s+que\s+viene\b/.test(normalized)) {
    return addDays(now, 7);
  }

  const inDaysMatch = normalized.match(/\b(?:en|dentro\s+de)\s+(\d+|un|una|dos|tres|cuatro|cinco)\s+dias?\b/);
  if (inDaysMatch) {
    const raw = inDaysMatch[1]!;
    const quantity = Number.isNaN(Number(raw)) ? NUMBER_WORDS[raw] : Number(raw);
    if (quantity !== undefined && quantity > 0) return addDays(now, quantity);
  }

  const weekdayMatch = findWeekdayMatch(text);
  if (weekdayMatch) {
    const currentDow = now.getDay();
    let diff = weekdayMatch.weekday - currentDow;
    if (diff <= 0) diff += 7;
    return addDays(now, diff);
  }
  return null;
}

function parseTimeOfDay(text: string): { hour: number; minute: number } | null {
  const match = text.match(/a las\s+(\d{1,2})(?::(\d{2}))?\s*(hs?|horas?)?/i);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = match[2] ? Number(match[2]) : 0;
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
}

function parseTimeRange(
  text: string,
): { start: { hour: number; minute: number }; end: { hour: number; minute: number } } | null {
  const match = text.match(/de\s+(\d{1,2})(?::(\d{2}))?\s+a\s+(\d{1,2})(?::(\d{2}))?/i);
  if (!match) return null;
  const startHour = Number(match[1]);
  const startMinute = match[2] ? Number(match[2]) : 0;
  const endHour = Number(match[3]);
  const endMinute = match[4] ? Number(match[4]) : 0;
  if (startHour > 23 || endHour > 23) return null;
  return { start: { hour: startHour, minute: startMinute }, end: { hour: endHour, minute: endMinute } };
}

const NUMBER_WORDS: Record<string, number> = {
  un: 1,
  una: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
};

function parseDurationMinutes(text: string): number | null {
  const normalized = stripAccents(text.toLowerCase());
  if (/\bmedia hora\b/.test(normalized)) return 30;
  const match = normalized.match(/(\d+|un|una|dos|tres|cuatro|cinco)\s*(hora|horas|minuto|minutos|min)\b/);
  if (!match) return null;
  const rawNumber = match[1] ?? "";
  const quantity = Number.isNaN(Number(rawNumber)) ? NUMBER_WORDS[rawNumber] : Number(rawNumber);
  if (quantity === undefined) return null;
  const unit = match[2] ?? "";
  return unit.startsWith("hora") ? quantity * 60 : quantity;
}

/** Parses amounts using Argentine formatting: "." thousands, "," decimals. */
function parseAmount(text: string): number | null {
  const match = text.match(/\$?\s*(\d{1,3}(?:\.\d{3})*(?:,\d+)?|\d+(?:,\d+)?)\s*(pesos|ars|\$)?/i);
  if (!match) return null;
  const raw = match[1] ?? "";
  if (!/[\d]/.test(raw)) return null;
  const normalized = raw.replace(/\./g, "").replace(",", ".");
  const value = Number(normalized);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function findSubjectMention(
  text: string,
  subjects: { id: string; name: string }[],
): { id: string; name: string } | null {
  const normalized = stripAccents(text.toLowerCase());
  return subjects.find((s) => normalized.includes(stripAccents(s.name.toLowerCase()))) ?? null;
}

function findTopicMention(
  text: string,
  topics: { id: string; name: string; subjectId: string }[],
): { id: string; name: string; subjectId: string } | null {
  const normalized = stripAccents(text.toLowerCase());
  return topics.find((t) => normalized.includes(stripAccents(t.name.toLowerCase()))) ?? null;
}

function titleCaseFromRemainder(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export function parseQuickCapture(rawText: string, context: QuickCaptureContext): QuickCaptureResult {
  const text = rawText.trim();
  const now = context.now ?? new Date();
  const normalized = stripAccents(text.toLowerCase());

  if (text.length < 3) {
    return { type: "unknown", clarification: "Escribi un poco mas de detalle para poder interpretarlo." };
  }

  // 1. Ideas — explicit marker, highest priority.
  const ideaMatch = text.match(/^idea\s*:\s*(.+)$/i);
  if (ideaMatch) {
    return {
      type: "idea",
      data: { content: ideaMatch[1]!.trim(), tags: [] },
    };
  }

  // 2. Expenses.
  if (/\b(gaste|gasté|gastar|pague|pagué|compre|compré)\b/.test(normalized)) {
    const amount = parseAmount(text);
    if (amount !== null) {
      const categoryMatch = text.match(/\ben\s+(?:un[ao]?\s+)?([a-záéíóúñ\s]+?)(?:\.|$)/i);
      const category = categoryMatch ? titleCaseFromRemainder(categoryMatch[1]!) : "General";
      return {
        type: "expense",
        data: {
          amount,
          currency: "ARS",
          category,
          description: text,
          spentAt: format(now, "yyyy-MM-dd"),
        },
      };
    }
    return {
      type: "unknown",
      clarification: "Parece un gasto pero no pude identificar el monto. ¿Cuanto gastaste?",
    };
  }

  // 3. Exams.
  if (
    /\b(rindo|tengo\s+examen|examen\s+de|evaluacion\s+de|prueba\s+de|parcial\s+de|final\s+de|coloquio\s+de|recuperatorio\s+de)\b/.test(
      normalized,
    )
  ) {
    const subject = findSubjectMention(text, context.subjects);
    const date = resolveDate(text, now);
    const time = parseTimeOfDay(text) ?? { hour: 9, minute: 0 };
    if (!subject) {
      return {
        type: "unknown",
        clarification:
          "Parece un examen pero no reconozco la materia. Cread primero la materia o mencionala por su nombre exacto.",
      };
    }
    if (!date) {
      return {
        type: "unknown",
        clarification: `Detecte un examen de ${subject.name} pero no pude identificar la fecha. ¿Que dia es?`,
      };
    }
    return {
      type: "exam",
      data: {
        subjectId: subject.id,
        title: `Examen de ${subject.name}`,
        scheduledAt: toIso(date, time.hour, time.minute),
        durationMinutes: 80,
        topicIds: [],
        importance: "media",
      },
    };
  }

  // 4. Events (training, matches, generic scheduled activities).
  if (/\b(entrenamiento|partido|reunion|turno|clase|cumpleanos|cita)\b/.test(normalized)) {
    const date = resolveDate(text, now);
    const range = parseTimeRange(text);
    const single = parseTimeOfDay(text);
    if (!date) {
      return {
        type: "unknown",
        clarification: "Detecte un evento pero no pude identificar el dia. ¿Que dia es?",
      };
    }
    const category = normalized.includes("entrenamiento")
      ? "entrenamiento"
      : normalized.includes("partido")
        ? "partido"
        : normalized.includes("clase")
          ? "clase"
          : normalized.includes("cumpleanos") || normalized.includes("cita")
            ? "personal"
            : "otro";
    const start = range ? range.start : (single ?? { hour: 18, minute: 0 });
    const end = range ? range.end : { hour: start.hour + 1, minute: start.minute };
    return {
      type: "event",
      data: {
        title: titleCaseFromRemainder(text),
        category,
        startsAt: toIso(date, start.hour, start.minute),
        endsAt: toIso(date, end.hour, end.minute),
        location: null,
        isFixed: true,
        relatedExamId: null,
        relatedTaskId: null,
        relatedProjectId: null,
        notes: null,
      },
    };
  }

  // 5. Tasks — the fallback bucket for reminders and study goals.
  const topic = findTopicMention(text, context.topics);
  const subjectFromTopic = topic ? context.subjects.find((s) => s.id === topic.subjectId) : null;
  const subjectMention = findSubjectMention(text, context.subjects);
  const date = resolveDate(text, now);
  const duration = parseDurationMinutes(text);
  const explicitTime = parseTimeOfDay(text);

  const isTaskLike =
    /\b(recordame|tengo que|hacer|estudiar|llevar|entregar|terminar|preparar|repasar|leer|practicar|resolver|revisar|completar|corregir)\b/.test(
      normalized,
    ) || duration !== null;

  if (isTaskLike || context.subjects.length === 0) {
    const title = text
      .replace(/^recordame\s+/i, "")
      .trim();
    return {
      type: "task",
      data: {
        title: titleCaseFromRemainder(title),
        description: null,
        dueAt: date ? toIso(date, explicitTime?.hour ?? 9, explicitTime?.minute ?? 0) : null,
        estimatedMinutes: duration,
        priority: "media",
        subjectId: subjectFromTopic?.id ?? subjectMention?.id ?? null,
        projectId: null,
        isFixed: false,
      },
    };
  }

  return {
    type: "unknown",
    clarification:
      "No pude identificar si esto es una tarea, un examen, un evento o un gasto. ¿Podes darme mas contexto?",
  };
}
