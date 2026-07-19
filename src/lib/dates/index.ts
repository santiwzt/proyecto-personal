import {
  addDays,
  differenceInCalendarDays,
  differenceInMinutes,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { es } from "date-fns/locale";
import { appConfig } from "@/config/app";

export const APP_TIME_ZONE = appConfig.timeZone;

/** Formats an ISO datetime as DD/MM/YYYY in the app's time zone. */
export function formatDate(iso: string): string {
  return formatInTimeZone(parseISO(iso), APP_TIME_ZONE, "dd/MM/yyyy");
}

/** Formats an ISO datetime as DD/MM/YYYY HH:mm in the app's time zone. */
export function formatDateTime(iso: string): string {
  return formatInTimeZone(parseISO(iso), APP_TIME_ZONE, "dd/MM/yyyy HH:mm");
}

export function formatTime(iso: string): string {
  return formatInTimeZone(parseISO(iso), APP_TIME_ZONE, "HH:mm");
}

/** Human-friendly relative label in Spanish, e.g. "hoy", "mañana", "en 3 dias". */
export function formatRelativeDay(iso: string, now = new Date()): string {
  const target = toZonedTime(parseISO(iso), APP_TIME_ZONE);
  const today = toZonedTime(now, APP_TIME_ZONE);
  const diff = differenceInCalendarDays(
    new Date(target.getFullYear(), target.getMonth(), target.getDate()),
    new Date(today.getFullYear(), today.getMonth(), today.getDate()),
  );
  if (diff === 0) return "hoy";
  if (diff === 1) return "mañana";
  if (diff === -1) return "ayer";
  if (diff > 1 && diff <= 6) return `en ${diff} dias`;
  if (diff < -1 && diff >= -6) return `hace ${Math.abs(diff)} dias`;
  return formatDate(iso);
}

export function weekdayLabel(weekday: number): string {
  const labels = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
  return labels[weekday] ?? "";
}

/** Monday-start week bounds (inclusive) for the week containing `date`. */
export function getWeekBounds(date: Date): { start: Date; end: Date } {
  const start = startOfWeek(date, { weekStartsOn: appConfig.weekStartsOn });
  const end = addDays(start, 6);
  return { start, end };
}

/**
 * Bounds of the calendar grid for the month containing `date`: the Monday
 * on/before the 1st through the Sunday on/after the last day, so a month
 * view always shows complete weeks.
 */
export function getMonthGridBounds(date: Date): { start: Date; end: Date } {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  return {
    start: startOfWeek(monthStart, { weekStartsOn: appConfig.weekStartsOn }),
    end: endOfWeek(monthEnd, { weekStartsOn: appConfig.weekStartsOn }),
  };
}

export function isPast(iso: string, now = new Date()): boolean {
  return isBefore(parseISO(iso), now);
}

export function minutesBetween(startIso: string, endIso: string): number {
  return differenceInMinutes(parseISO(endIso), parseISO(startIso));
}

/** Formats a Date as a plain `HH:mm` string, independent of locale. */
export function toHHmm(date: Date): string {
  return format(date, "HH:mm");
}

export function formatSpanishWeekday(iso: string): string {
  return formatInTimeZone(parseISO(iso), APP_TIME_ZONE, "EEEE", { locale: es });
}

export function todayISODate(now = new Date()): string {
  return formatInTimeZone(now, APP_TIME_ZONE, "yyyy-MM-dd");
}
