import { z } from "zod";

/**
 * Server-side input validation, shared by server actions and API route
 * handlers. Client-side forms may use the same schemas via
 * @hookform/resolvers/zod, but the server MUST always re-validate — never
 * trust a payload just because the client already checked it.
 */

const isoDateTime = z.string().datetime({ offset: true });
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha invalida");
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Formato de hora invalido (HH:mm)");

export const subjectColorSchema = z.enum([
  "blue",
  "green",
  "amber",
  "rose",
  "violet",
  "cyan",
  "orange",
  "slate",
]);

export const createSubjectSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(80),
  color: subjectColorSchema,
  teacher: z.string().trim().max(120).nullable().default(null),
  course: z.string().trim().max(80).nullable().default(null),
  description: z.string().trim().max(500).nullable().default(null),
});
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;

export const topicStatusSchema = z.enum(["no_iniciado", "aprendiendo", "practicando", "dominado"]);

export const createTopicSchema = z.object({
  subjectId: z.string().min(1),
  name: z.string().trim().min(1).max(120),
  status: topicStatusSchema.default("no_iniciado"),
  selfConfidence: z.number().int().min(0).max(100).default(0),
  commonMistakes: z.array(z.string().trim().min(1)).default([]),
  notes: z.string().trim().max(1000).nullable().default(null),
});
export type CreateTopicInput = z.infer<typeof createTopicSchema>;

export const createExamSchema = z.object({
  subjectId: z.string().min(1),
  title: z.string().trim().min(1).max(150),
  scheduledAt: isoDateTime,
  durationMinutes: z.number().int().min(10).max(600),
  topicIds: z.array(z.string()).default([]),
  importance: z.enum(["baja", "media", "alta"]).default("media"),
});
export type CreateExamInput = z.infer<typeof createExamSchema>;

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "El titulo es obligatorio").max(150),
  description: z.string().trim().max(1000).nullable().default(null),
  dueAt: isoDateTime.nullable().default(null),
  estimatedMinutes: z.number().int().min(1).max(600).nullable().default(null),
  priority: z.enum(["baja", "media", "alta"]).default("media"),
  subjectId: z.string().nullable().default(null),
  projectId: z.string().nullable().default(null),
  isFixed: z.boolean().default(false),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const eventCategorySchema = z.enum([
  "clase",
  "examen",
  "entrenamiento",
  "partido",
  "estudio",
  "proyecto",
  "personal",
  "otro",
]);

export const createEventSchema = z
  .object({
    title: z.string().trim().min(1).max(150),
    category: eventCategorySchema,
    startsAt: isoDateTime,
    endsAt: isoDateTime,
    location: z.string().trim().max(150).nullable().default(null),
    isFixed: z.boolean().default(false),
    relatedExamId: z.string().nullable().default(null),
    relatedTaskId: z.string().nullable().default(null),
    relatedProjectId: z.string().nullable().default(null),
    notes: z.string().trim().max(1000).nullable().default(null),
  })
  .refine((data) => data.endsAt > data.startsAt, {
    message: "La hora de fin debe ser posterior a la hora de inicio",
    path: ["endsAt"],
  });
export type CreateEventInput = z.infer<typeof createEventSchema>;

const weekdaySchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
]);

export const createAvailabilityRuleSchema = z
  .object({
    weekday: weekdaySchema,
    startTime: hhmm,
    endTime: hhmm,
    kind: z.enum(["disponible", "no_disponible"]),
    label: z.string().trim().max(120).nullable().default(null),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "La hora de fin debe ser posterior a la hora de inicio",
    path: ["endTime"],
  });
export type CreateAvailabilityRuleInput = z.infer<typeof createAvailabilityRuleSchema>;

export const projectStatusSchema = z.enum([
  "idea",
  "planificado",
  "en_progreso",
  "pausado",
  "completado",
  "archivado",
]);

export const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(150),
  description: z.string().trim().max(1000).nullable().default(null),
  status: projectStatusSchema.default("idea"),
  priority: z.enum(["baja", "media", "alta"]).default("media"),
  targetDate: isoDate.nullable().default(null),
  technologies: z.array(z.string().trim().min(1)).default([]),
  links: z.array(z.object({ label: z.string().min(1), url: z.string().url() })).default([]),
  nextStep: z.string().trim().max(300).nullable().default(null),
  progress: z.number().int().min(0).max(100).default(0),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const createProjectTaskSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().trim().min(1).max(150),
});
export type CreateProjectTaskInput = z.infer<typeof createProjectTaskSchema>;

export const createIdeaSchema = z.object({
  content: z.string().trim().min(1).max(500),
  tags: z.array(z.string().trim().min(1)).default([]),
});
export type CreateIdeaInput = z.infer<typeof createIdeaSchema>;

export const createExpenseSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().trim().min(1).max(10).default("ARS"),
  category: z.string().trim().min(1).max(80),
  description: z.string().trim().max(300).nullable().default(null),
  spentAt: isoDate,
});
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export const quickCaptureInputSchema = z.object({
  text: z.string().trim().min(2, "Escribi al menos unas palabras").max(500),
});

export const quickCaptureConfirmSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("task"), data: createTaskSchema }),
  z.object({ type: z.literal("exam"), data: createExamSchema }),
  z.object({ type: z.literal("event"), data: createEventSchema }),
  z.object({ type: z.literal("idea"), data: createIdeaSchema }),
  z.object({ type: z.literal("expense"), data: createExpenseSchema }),
]);

export const generateQuestionsSchema = z.object({
  subjectId: z.string().min(1).nullable().default(null),
  topicId: z.string().min(1).nullable().default(null),
  fileIds: z.array(z.string()).default([]),
  difficulty: z.enum(["facil", "media", "dificil"]).default("media"),
  count: z.number().int().min(1).max(10).default(5),
  kind: z
    .enum([
      "opcion_multiple",
      "verdadero_falso",
      "respuesta_breve",
      "desarrollo",
      "ejercicio_paso_a_paso",
      "mixto",
    ])
    .default("mixto"),
});
export type GenerateQuestionsInput = z.infer<typeof generateQuestionsSchema>;

export const gradeAnswerSchema = z.object({
  questionId: z.string().min(1),
  answerText: z.string().trim().min(1).max(4000),
});
export type GradeAnswerInput = z.infer<typeof gradeAnswerSchema>;

export const sendChatMessageSchema = z.object({
  conversationId: z.string().min(1).nullable().default(null),
  scope: z.union([
    z.object({ type: z.literal("subject"), subjectId: z.string().min(1) }),
    z.object({ type: z.literal("files"), fileIds: z.array(z.string()).min(1) }),
    z.object({ type: z.literal("general") }),
  ]),
  message: z.string().trim().min(1).max(2000),
  mode: z
    .enum(["explicame", "resumime", "preguntame", "corregime", "repaso_rapido", "preparame"])
    .default("explicame"),
});
export type SendChatMessageInput = z.infer<typeof sendChatMessageSchema>;

export const generatePlanSchema = z.object({
  weekStart: isoDate,
});
export type GeneratePlanInput = z.infer<typeof generatePlanSchema>;

export const approvePlanSchema = z.object({
  plannerRunId: z.string().min(1),
  blockIds: z.array(z.string()).min(0),
  mode: z.enum(["todo", "parcial", "rechazar"]),
});
export type ApprovePlanInput = z.infer<typeof approvePlanSchema>;
