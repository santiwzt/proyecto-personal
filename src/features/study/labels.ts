import type { ExamImportance, ExamStatus, TopicStatus } from "@/types/domain";

export const TOPIC_STATUS_LABELS: Record<TopicStatus, string> = {
  no_iniciado: "No iniciado",
  aprendiendo: "Aprendiendo",
  practicando: "Practicando",
  dominado: "Dominado",
};

export const EXAM_IMPORTANCE_LABELS: Record<ExamImportance, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
};

export const EXAM_STATUS_LABELS: Record<ExamStatus, string> = {
  programado: "Programado",
  preparando: "Preparando",
  rendido: "Rendido",
  cancelado: "Cancelado",
};
