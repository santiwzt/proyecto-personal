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
  examen: "bg-destructive/15 text-destructive",
  entrenamiento: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  partido: "bg-green-500/15 text-green-700 dark:text-green-300",
  estudio: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
  proyecto: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  personal: "bg-pink-500/15 text-pink-700 dark:text-pink-300",
  otro: "bg-secondary text-secondary-foreground",
};

/** Tareas have no EventCategory of their own -- one flat color for all of them. */
export const TASK_BADGE_CLASSES = "bg-muted text-muted-foreground";

/** Events synced read-only from an external (school) calendar -- distinct from anything the user created themselves. */
export const COLEGIO_BADGE_CLASSES =
  "border border-violet-500/30 bg-violet-500/15 text-violet-700 dark:text-violet-300";

/** Recesos/feriados dentro del calendario del colegio -- ni dan trabajo ni son evaluables, se distinguen del resto. */
export const SCHOOL_BREAK_BADGE_CLASSES = "bg-slate-500/15 text-slate-700 dark:text-slate-300";

const SCHOOL_EXAM_TITLE_PATTERN = /examen|recuperatori|evaluaci|parcial|\btest\b|multiple choice/i;
const SCHOOL_BREAK_TITLE_PATTERN = /receso|feriado|d[ií]a de la|vacacion/i;

export interface SchoolEventVisual {
  classes: string;
  label: string;
}

/**
 * Los eventos del colegio vienen de un ICS externo sin categoria propia -- se infiere un
 * subtipo a partir de palabras clave en el titulo para no pintar todo el calendario de un
 * solo color cuando en realidad mezcla examenes, recesos y avisos comunes.
 */
export function inferSchoolEventVisual(title: string): SchoolEventVisual {
  if (SCHOOL_EXAM_TITLE_PATTERN.test(title)) {
    return { classes: CATEGORY_BADGE_CLASSES.examen, label: "Examen (colegio)" };
  }
  if (SCHOOL_BREAK_TITLE_PATTERN.test(title)) {
    return { classes: SCHOOL_BREAK_BADGE_CLASSES, label: "Receso / feriado" };
  }
  return { classes: COLEGIO_BADGE_CLASSES, label: "Colegio" };
}
