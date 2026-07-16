import type { ProjectStatus, TaskPriority, TaskStatus } from "@/types/domain";

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  idea: "Idea",
  planificado: "Planificado",
  en_progreso: "En progreso",
  pausado: "Pausado",
  completado: "Completado",
  archivado: "Archivado",
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
};

export const PROJECT_TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  completada: "Completada",
  vencida: "Vencida",
};
