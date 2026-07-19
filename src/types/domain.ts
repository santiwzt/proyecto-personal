/**
 * Core domain types shared across features, server actions, repositories
 * and the demo data store. Keep this file framework-agnostic (no Next.js,
 * no Supabase, no React imports) so it can be used everywhere.
 */

export type ISODateString = string; // e.g. "2026-07-20"
export type ISODateTimeString = string; // e.g. "2026-07-20T09:00:00-03:00"

export interface Profile {
  id: string;
  displayName: string;
  role: "estudiante_secundario" | "estudiante_universitario" | "profesional" | "otro";
  timeZone: string;
  onboardingCompletedAt: ISODateTimeString | null;
  createdAt: ISODateTimeString;
}

export interface UserPreferences {
  userId: string;
  locale: string;
  dateFormat: string;
  weekStartsOn: 0 | 1;
  theme: "light" | "dark" | "system";
  dailyStudyLimitMinutes: number;
  preferredStudyWindows: AvailabilityRule[];
  aiConsentGiven: boolean;
  /** Monthly spending budget in ARS, the app's default currency. Null means no budget set. */
  monthlyBudgetArs: number | null;
}

export type SubjectColor =
  | "blue"
  | "green"
  | "amber"
  | "rose"
  | "violet"
  | "cyan"
  | "orange"
  | "slate";

export interface Subject {
  id: string;
  userId: string;
  name: string;
  color: SubjectColor;
  teacher: string | null;
  course: string | null;
  description: string | null;
  createdAt: ISODateTimeString;
  archivedAt: ISODateTimeString | null;
}

export type TopicStatus = "no_iniciado" | "aprendiendo" | "practicando" | "dominado";

export interface StudyTopic {
  id: string;
  userId: string;
  subjectId: string;
  name: string;
  status: TopicStatus;
  selfConfidence: number; // 0-100, declared by the user
  estimatedConfidence: number; // 0-100, derived from practice signals
  commonMistakes: string[];
  notes: string | null;
  lastPracticedAt: ISODateTimeString | null;
  createdAt: ISODateTimeString;
}

export type ExamImportance = "baja" | "media" | "alta";
export type ExamStatus = "programado" | "preparando" | "rendido" | "cancelado";

export interface Exam {
  id: string;
  userId: string;
  subjectId: string;
  title: string;
  scheduledAt: ISODateTimeString;
  durationMinutes: number;
  topicIds: string[];
  importance: ExamImportance;
  status: ExamStatus;
  fileIds: string[];
  resultScore: number | null;
  resultNotes: string | null;
  createdAt: ISODateTimeString;
}

/** Transparent, explainable readiness estimate for an exam. */
export interface ExamReadiness {
  examId: string;
  score: number; // 0-100
  factors: ReadinessFactor[];
  computedAt: ISODateTimeString;
}

export interface ReadinessFactor {
  key:
    | "temas_practicados"
    | "resultados_preguntas"
    | "confianza_declarada"
    | "dias_desde_ultima_practica"
    | "tareas_completadas";
  label: string;
  weight: number; // 0-1, contribution to the final score
  contribution: number; // points contributed to the 0-100 score
  explanation: string;
}

export type TaskPriority = "baja" | "media" | "alta";
export type TaskStatus = "pendiente" | "en_progreso" | "completada" | "vencida";

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  dueAt: ISODateTimeString | null;
  estimatedMinutes: number | null;
  priority: TaskPriority;
  status: TaskStatus;
  subjectId: string | null;
  projectId: string | null;
  isFixed: boolean;
  completedAt: ISODateTimeString | null;
  createdAt: ISODateTimeString;
}

export type EventCategory =
  | "clase"
  | "examen"
  | "entrenamiento"
  | "partido"
  | "estudio"
  | "proyecto"
  | "personal"
  | "otro";

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  category: EventCategory;
  startsAt: ISODateTimeString;
  endsAt: ISODateTimeString;
  location: string | null;
  isFixed: boolean;
  relatedExamId: string | null;
  relatedTaskId: string | null;
  relatedProjectId: string | null;
  notes: string | null;
  createdAt: ISODateTimeString;
}

/** Recurring windows describing when the user is generally free/unavailable. */
export interface AvailabilityRule {
  id: string;
  userId: string;
  weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday ... matches JS Date#getDay
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  kind: "disponible" | "no_disponible";
  label: string | null;
}

export type ProjectStatus =
  | "idea"
  | "planificado"
  | "en_progreso"
  | "pausado"
  | "completado"
  | "archivado";

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  priority: TaskPriority;
  targetDate: ISODateString | null;
  technologies: string[];
  links: { label: string; url: string }[];
  nextStep: string | null;
  progress: number; // 0-100
  createdAt: ISODateTimeString;
}

export interface ProjectTask {
  id: string;
  userId: string;
  projectId: string;
  title: string;
  status: TaskStatus;
  createdAt: ISODateTimeString;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  targetDate: ISODateString | null;
  progress: number;
  createdAt: ISODateTimeString;
}

export interface Habit {
  id: string;
  userId: string;
  name: string;
  targetPerWeek: number;
  createdAt: ISODateTimeString;
  archivedAt: ISODateTimeString | null;
}

export interface HabitLog {
  id: string;
  userId: string;
  habitId: string;
  date: ISODateString;
  completed: boolean;
}

export interface TrainingSession {
  id: string;
  userId: string;
  activity: string;
  startsAt: ISODateTimeString;
  endsAt: ISODateTimeString;
  notes: string | null;
}

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  category: string;
  description: string | null;
  spentAt: ISODateString;
  createdAt: ISODateTimeString;
}

export interface Idea {
  id: string;
  userId: string;
  content: string;
  tags: string[];
  convertedToProjectId: string | null;
  convertedToTaskId: string | null;
  createdAt: ISODateTimeString;
}

export type FileProcessingStatus = "subiendo" | "procesando" | "listo" | "fallo" | "eliminado";

export interface FileAsset {
  id: string;
  userId: string;
  originalName: string;
  safeName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  status: FileProcessingStatus;
  subjectId: string | null;
  projectId: string | null;
  extractedText: string | null;
  processingError: string | null;
  contentHash: string;
  createdAt: ISODateTimeString;
}

export interface FileChunk {
  id: string;
  userId: string;
  fileId: string;
  chunkIndex: number;
  content: string;
  charCount: number;
  page: number | null;
  embedding: number[] | null;
}

export type ConversationScope =
  | { type: "subject"; subjectId: string }
  | { type: "files"; fileIds: string[] }
  | { type: "general" };

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  scope: ConversationScope;
  createdAt: ISODateTimeString;
}

export interface MessageSource {
  fileId: string;
  fileName: string;
  chunkId: string;
  excerpt: string;
  page: number | null;
}

export interface Message {
  id: string;
  conversationId: string;
  userId: string;
  role: "user" | "assistant";
  content: string;
  sources: MessageSource[];
  createdAt: ISODateTimeString;
}

export type QuestionKind =
  | "opcion_multiple"
  | "verdadero_falso"
  | "respuesta_breve"
  | "desarrollo"
  | "ejercicio_paso_a_paso";

export type QuestionDifficulty = "facil" | "media" | "dificil";

export interface PracticeSet {
  id: string;
  userId: string;
  subjectId: string | null;
  topicId: string | null;
  title: string;
  createdAt: ISODateTimeString;
  generatedBy: "ia" | "heuristico";
}

export interface PracticeQuestion {
  id: string;
  setId: string;
  kind: QuestionKind;
  difficulty: QuestionDifficulty;
  prompt: string;
  options: string[] | null;
  expectedAnswer: string;
  gradingCriteria: string[];
  explanation: string;
  commonMistakes: string[];
  sourceFileId: string | null;
  sourceExcerpt: string | null;
}

export interface PracticeAttempt {
  id: string;
  userId: string;
  questionId: string;
  answerText: string;
  isCorrect: boolean;
  feedback: string;
  firstErrorHint: string | null;
  attemptNumber: number;
  createdAt: ISODateTimeString;
}

export interface StudySession {
  id: string;
  userId: string;
  subjectId: string | null;
  topicId: string | null;
  examId: string | null;
  startsAt: ISODateTimeString;
  endsAt: ISODateTimeString;
  completed: boolean;
}

export type PlannerConflictKind =
  | "solapamiento"
  | "fuera_de_disponibilidad"
  | "tarea_sin_tiempo_suficiente"
  | "fecha_vencida"
  | "sin_descanso"
  | "examen_sin_sesiones"
  | "sobrecarga_diaria";

export interface PlannerConflict {
  kind: PlannerConflictKind;
  severity: "info" | "advertencia" | "critico";
  message: string;
  relatedIds: string[];
  date: ISODateString | null;
}

export interface PlannerRecommendation {
  message: string;
  relatedIds: string[];
}

export interface ProposedTimeBlock {
  id: string;
  activityTitle: string;
  activityKind: "estudio" | "tarea" | "descanso" | "proyecto";
  date: ISODateString;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  reason: string;
  priority: TaskPriority;
  movable: boolean;
  sourceRefId: string | null; // task/exam/topic id this block was generated from
  sourceRefType: "task" | "exam" | "topic" | "project" | null;
}

export interface UnscheduledItem {
  refId: string;
  refType: "task" | "exam" | "project";
  title: string;
  reason: string;
}

export interface GeneratedPlan {
  summary: string;
  conflicts: PlannerConflict[];
  recommendations: PlannerRecommendation[];
  blocks: ProposedTimeBlock[];
  unscheduledItems: UnscheduledItem[];
  assumptions: string[];
}

export type PlannerRunStatus = "propuesto" | "aprobado_total" | "aprobado_parcial" | "rechazado";

export interface PlannerRun {
  id: string;
  userId: string;
  weekStart: ISODateString;
  plan: GeneratedPlan;
  status: PlannerRunStatus;
  approvedBlockIds: string[];
  createdAt: ISODateTimeString;
}

export interface ActivityLogEntry {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: ISODateTimeString;
}

export interface AiUsageRecord {
  id: string;
  userId: string;
  feature: "chat" | "planner" | "questions" | "grading" | "quick_capture";
  provider: "anthropic" | "heuristico";
  inputTokens: number;
  outputTokens: number;
  createdAt: ISODateTimeString;
}

/** A browser/device registered for Web Push notifications (see docs/decisions for the reminders design). */
export interface PushSubscriptionRecord {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: ISODateTimeString;
}

export type QuickCaptureResult =
  | { type: "task"; data: Omit<Task, "id" | "userId" | "status" | "completedAt" | "createdAt"> }
  | { type: "exam"; data: Omit<Exam, "id" | "userId" | "status" | "fileIds" | "resultScore" | "resultNotes" | "createdAt"> }
  | { type: "event"; data: Omit<CalendarEvent, "id" | "userId" | "createdAt"> }
  | { type: "idea"; data: Omit<Idea, "id" | "userId" | "convertedToProjectId" | "convertedToTaskId" | "createdAt"> }
  | { type: "expense"; data: Omit<Expense, "id" | "userId" | "createdAt"> }
  | { type: "unknown"; clarification: string };
