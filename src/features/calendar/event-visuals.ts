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
