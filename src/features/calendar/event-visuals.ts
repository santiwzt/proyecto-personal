import type { EventCategory } from "@/types/domain";

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  clase: "Clase",
  examen: "Examen",
  entrenamiento: "Entrenamiento",
  partido: "Partido",
  estudio: "Estudio",
  proyecto: "Proyecto",
  personal: "Personal",
  otro: "Otro",
};

/** Background+text classes for a category chip/badge, legible in both themes. */
export const CATEGORY_BADGE_CLASSES: Record<EventCategory, string> = {
  clase: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  examen: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  entrenamiento: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  partido: "bg-green-500/15 text-green-700 dark:text-green-300",
  estudio: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
  proyecto: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  personal: "bg-pink-500/15 text-pink-700 dark:text-pink-300",
  otro: "bg-secondary text-secondary-foreground",
};

/** Tareas have no EventCategory of their own -- one flat color for all of them. */
export const TASK_BADGE_CLASSES = "bg-muted text-muted-foreground";

const SCHOOL_CATEGORY_TITLE_PATTERNS: Array<[EventCategory, RegExp]> = [
  ["examen", /examen|recuperatori|evaluaci|parcial|\btest\b|multiple choice/i],
  ["entrenamiento", /entrenamiento|practica deportiva|educaci[oó]n f[ií]sica/i],
  ["partido", /partido|competencia|torneo/i],
  ["proyecto", /proyecto|trabajo practico|\btp\b/i],
  ["otro", /receso|feriado|d[ií]a de la|vacacion/i],
];

/**
 * Los eventos del colegio vienen de un ICS externo sin categoria propia -- se infiere la
 * EventCategory que corresponde a partir de palabras clave en el titulo, para que se pinten
 * con la misma paleta que un evento cargado a mano en vez de un color unico para todo el colegio.
 * Por defecto (sin match) se asume "clase", ya que la mayoria de los items sin palabras clave
 * son avisos o actividades regulares de cursada.
 */
export function inferSchoolEventCategory(title: string): EventCategory {
  for (const [category, pattern] of SCHOOL_CATEGORY_TITLE_PATTERNS) {
    if (pattern.test(title)) return category;
  }
  return "clase";
}
