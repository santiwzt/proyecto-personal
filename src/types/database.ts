/**
 * Hand-written substitute for `supabase gen types typescript`.
 *
 * There is no live Supabase project in this sandboxed environment to run
 * `db:generate` against, so this file mirrors supabase/migrations/*.sql by
 * hand, in the exact shape the real Supabase CLI would produce:
 *   Database.public.Tables.<table>.{Row, Insert, Update}
 *
 * Keep this file in sync with the SQL migrations AND src/types/domain.ts:
 * column names here are the snake_case mirror of the camelCase fields on
 * the matching domain.ts interface. When a real Supabase project becomes
 * available, running `pnpm db:generate` should produce something very
 * close to this file -- if it diverges, prefer the generated output and
 * update domain.ts mappers accordingly.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// ---------------------------------------------------------------------------
// Enum types (mirrors supabase/migrations/0002_enums.sql)
// ---------------------------------------------------------------------------
export type ProfileRole = "estudiante_secundario" | "estudiante_universitario" | "profesional" | "otro";
export type ThemeMode = "light" | "dark" | "system";
export type SubjectColorEnum = "blue" | "green" | "amber" | "rose" | "violet" | "cyan" | "orange" | "slate";
export type TopicStatusEnum = "no_iniciado" | "aprendiendo" | "practicando" | "dominado";
export type ExamImportanceEnum = "baja" | "media" | "alta";
export type ExamStatusEnum = "programado" | "preparando" | "rendido" | "cancelado";
export type TaskPriorityEnum = "baja" | "media" | "alta";
export type TaskStatusEnum = "pendiente" | "en_progreso" | "completada" | "vencida";
export type EventCategoryEnum =
  | "clase"
  | "examen"
  | "entrenamiento"
  | "partido"
  | "estudio"
  | "proyecto"
  | "personal"
  | "otro";
export type AvailabilityKindEnum = "disponible" | "no_disponible";
export type ProjectStatusEnum = "idea" | "planificado" | "en_progreso" | "pausado" | "completado" | "archivado";
export type FileProcessingStatusEnum = "subiendo" | "procesando" | "listo" | "fallo" | "eliminado";
export type ConversationScopeTypeEnum = "subject" | "files" | "general";
export type MessageRoleEnum = "user" | "assistant";
export type QuestionKindEnum =
  | "opcion_multiple"
  | "verdadero_falso"
  | "respuesta_breve"
  | "desarrollo"
  | "ejercicio_paso_a_paso";
export type QuestionDifficultyEnum = "facil" | "media" | "dificil";
export type PracticeGeneratedByEnum = "ia" | "heuristico";
export type TimeBlockActivityKindEnum = "estudio" | "tarea" | "descanso" | "proyecto";
export type TimeBlockSourceRefTypeEnum = "task" | "exam" | "topic" | "project";
export type PlannerRunStatusEnum = "propuesto" | "aprobado_total" | "aprobado_parcial" | "rechazado";
export type AiUsageFeatureEnum = "chat" | "planner" | "questions" | "grading" | "quick_capture";
export type AiUsageProviderEnum = "anthropic" | "heuristico";

/** Shape of `projects.links` (jsonb array). */
export interface ProjectLink {
  label: string;
  url: string;
}

/** Shape of one entry in `messages.sources` (jsonb array). Mirrors MessageSource in domain.ts. */
export interface MessageSourceJson {
  fileId: string;
  fileName: string;
  chunkId: string;
  excerpt: string;
  page: number | null;
}

/** Shape of `planner_runs.plan` (jsonb). Mirrors GeneratedPlan in domain.ts. */
export interface GeneratedPlanJson {
  summary: string;
  conflicts: {
    kind:
      | "solapamiento"
      | "fuera_de_disponibilidad"
      | "tarea_sin_tiempo_suficiente"
      | "fecha_vencida"
      | "sin_descanso"
      | "examen_sin_sesiones"
      | "sobrecarga_diaria";
    severity: "info" | "advertencia" | "critico";
    message: string;
    relatedIds: string[];
    date: string | null;
  }[];
  recommendations: { message: string; relatedIds: string[] }[];
  blocks: {
    id: string;
    activityTitle: string;
    activityKind: TimeBlockActivityKindEnum;
    date: string;
    startTime: string;
    endTime: string;
    reason: string;
    priority: TaskPriorityEnum;
    movable: boolean;
    sourceRefId: string | null;
    sourceRefType: TimeBlockSourceRefTypeEnum | null;
  }[];
  unscheduledItems: {
    refId: string;
    refType: "task" | "exam" | "project";
    title: string;
    reason: string;
  }[];
  assumptions: string[];
}

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export interface ProfilesTable {
  Row: {
    id: string;
    display_name: string;
    role: ProfileRole;
    time_zone: string;
    onboarding_completed_at: string | null;
    created_at: string;
  };
  Insert: {
    id: string;
    display_name: string;
    role?: ProfileRole;
    time_zone?: string;
    onboarding_completed_at?: string | null;
    created_at?: string;
  };
  Update: Partial<ProfilesTable["Insert"]>;
}

export interface UserPreferencesTable {
  Row: {
    user_id: string;
    locale: string;
    date_format: string;
    week_starts_on: 0 | 1;
    theme: ThemeMode;
    daily_study_limit_minutes: number;
    ai_consent_given: boolean;
    created_at: string;
  };
  Insert: {
    user_id: string;
    locale?: string;
    date_format?: string;
    week_starts_on?: 0 | 1;
    theme?: ThemeMode;
    daily_study_limit_minutes?: number;
    ai_consent_given?: boolean;
    created_at?: string;
  };
  Update: Partial<UserPreferencesTable["Insert"]>;
}

export interface SubjectsTable {
  Row: {
    id: string;
    user_id: string;
    name: string;
    color: SubjectColorEnum;
    teacher: string | null;
    course: string | null;
    description: string | null;
    created_at: string;
    updated_at: string;
    archived_at: string | null;
  };
  Insert: {
    id?: string;
    user_id: string;
    name: string;
    color?: SubjectColorEnum;
    teacher?: string | null;
    course?: string | null;
    description?: string | null;
    created_at?: string;
    updated_at?: string;
    archived_at?: string | null;
  };
  Update: Partial<SubjectsTable["Insert"]>;
}

export interface StudyTopicsTable {
  Row: {
    id: string;
    user_id: string;
    subject_id: string;
    name: string;
    status: TopicStatusEnum;
    self_confidence: number;
    estimated_confidence: number;
    common_mistakes: string[];
    notes: string | null;
    last_practiced_at: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    subject_id: string;
    name: string;
    status?: TopicStatusEnum;
    self_confidence?: number;
    estimated_confidence?: number;
    common_mistakes?: string[];
    notes?: string | null;
    last_practiced_at?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: Partial<StudyTopicsTable["Insert"]>;
}

export interface ExamsTable {
  Row: {
    id: string;
    user_id: string;
    subject_id: string;
    title: string;
    scheduled_at: string;
    duration_minutes: number;
    topic_ids: string[];
    importance: ExamImportanceEnum;
    status: ExamStatusEnum;
    file_ids: string[];
    result_score: number | null;
    result_notes: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    subject_id: string;
    title: string;
    scheduled_at: string;
    duration_minutes: number;
    topic_ids?: string[];
    importance?: ExamImportanceEnum;
    status?: ExamStatusEnum;
    file_ids?: string[];
    result_score?: number | null;
    result_notes?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: Partial<ExamsTable["Insert"]>;
}

export interface TasksTable {
  Row: {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    due_at: string | null;
    estimated_minutes: number | null;
    priority: TaskPriorityEnum;
    status: TaskStatusEnum;
    subject_id: string | null;
    project_id: string | null;
    is_fixed: boolean;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    title: string;
    description?: string | null;
    due_at?: string | null;
    estimated_minutes?: number | null;
    priority?: TaskPriorityEnum;
    status?: TaskStatusEnum;
    subject_id?: string | null;
    project_id?: string | null;
    is_fixed?: boolean;
    completed_at?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: Partial<TasksTable["Insert"]>;
}

export interface EventsTable {
  Row: {
    id: string;
    user_id: string;
    title: string;
    category: EventCategoryEnum;
    starts_at: string;
    ends_at: string;
    location: string | null;
    is_fixed: boolean;
    related_exam_id: string | null;
    related_task_id: string | null;
    related_project_id: string | null;
    notes: string | null;
    created_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    title: string;
    category?: EventCategoryEnum;
    starts_at: string;
    ends_at: string;
    location?: string | null;
    is_fixed?: boolean;
    related_exam_id?: string | null;
    related_task_id?: string | null;
    related_project_id?: string | null;
    notes?: string | null;
    created_at?: string;
  };
  Update: Partial<EventsTable["Insert"]>;
}

export interface AvailabilityRulesTable {
  Row: {
    id: string;
    user_id: string;
    weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    start_time: string;
    end_time: string;
    kind: AvailabilityKindEnum;
    label: string | null;
    created_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    start_time: string;
    end_time: string;
    kind?: AvailabilityKindEnum;
    label?: string | null;
    created_at?: string;
  };
  Update: Partial<AvailabilityRulesTable["Insert"]>;
}

export interface ProjectsTable {
  Row: {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    status: ProjectStatusEnum;
    priority: TaskPriorityEnum;
    target_date: string | null;
    technologies: string[];
    links: ProjectLink[];
    next_step: string | null;
    progress: number;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    name: string;
    description?: string | null;
    status?: ProjectStatusEnum;
    priority?: TaskPriorityEnum;
    target_date?: string | null;
    technologies?: string[];
    links?: ProjectLink[];
    next_step?: string | null;
    progress?: number;
    created_at?: string;
    updated_at?: string;
  };
  Update: Partial<ProjectsTable["Insert"]>;
}

export interface ProjectTasksTable {
  Row: {
    id: string;
    user_id: string;
    project_id: string;
    title: string;
    status: TaskStatusEnum;
    created_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    project_id: string;
    title: string;
    status?: TaskStatusEnum;
    created_at?: string;
  };
  Update: Partial<ProjectTasksTable["Insert"]>;
}

export interface GoalsTable {
  Row: {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    target_date: string | null;
    progress: number;
    created_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    title: string;
    description?: string | null;
    target_date?: string | null;
    progress?: number;
    created_at?: string;
  };
  Update: Partial<GoalsTable["Insert"]>;
}

export interface HabitsTable {
  Row: {
    id: string;
    user_id: string;
    name: string;
    target_per_week: number;
    created_at: string;
    archived_at: string | null;
  };
  Insert: {
    id?: string;
    user_id: string;
    name: string;
    target_per_week?: number;
    created_at?: string;
    archived_at?: string | null;
  };
  Update: Partial<HabitsTable["Insert"]>;
}

export interface HabitLogsTable {
  Row: {
    id: string;
    user_id: string;
    habit_id: string;
    date: string;
    completed: boolean;
  };
  Insert: {
    id?: string;
    user_id: string;
    habit_id: string;
    date: string;
    completed?: boolean;
  };
  Update: Partial<HabitLogsTable["Insert"]>;
}

export interface TrainingSessionsTable {
  Row: {
    id: string;
    user_id: string;
    activity: string;
    starts_at: string;
    ends_at: string;
    notes: string | null;
  };
  Insert: {
    id?: string;
    user_id: string;
    activity: string;
    starts_at: string;
    ends_at: string;
    notes?: string | null;
  };
  Update: Partial<TrainingSessionsTable["Insert"]>;
}

export interface ExpensesTable {
  Row: {
    id: string;
    user_id: string;
    amount: number;
    currency: string;
    category: string;
    description: string | null;
    spent_at: string;
    created_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    amount: number;
    currency?: string;
    category: string;
    description?: string | null;
    spent_at: string;
    created_at?: string;
  };
  Update: Partial<ExpensesTable["Insert"]>;
}

export interface IdeasTable {
  Row: {
    id: string;
    user_id: string;
    content: string;
    tags: string[];
    converted_to_project_id: string | null;
    converted_to_task_id: string | null;
    created_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    content: string;
    tags?: string[];
    converted_to_project_id?: string | null;
    converted_to_task_id?: string | null;
    created_at?: string;
  };
  Update: Partial<IdeasTable["Insert"]>;
}

export interface FilesTable {
  Row: {
    id: string;
    user_id: string;
    original_name: string;
    safe_name: string;
    mime_type: string;
    size_bytes: number;
    storage_path: string;
    status: FileProcessingStatusEnum;
    subject_id: string | null;
    project_id: string | null;
    extracted_text: string | null;
    processing_error: string | null;
    content_hash: string;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    original_name: string;
    safe_name: string;
    mime_type: string;
    size_bytes: number;
    storage_path: string;
    status?: FileProcessingStatusEnum;
    subject_id?: string | null;
    project_id?: string | null;
    extracted_text?: string | null;
    processing_error?: string | null;
    content_hash: string;
    created_at?: string;
    updated_at?: string;
  };
  Update: Partial<FilesTable["Insert"]>;
}

export interface FileChunksTable {
  Row: {
    id: string;
    user_id: string;
    file_id: string;
    chunk_index: number;
    content: string;
    char_count: number;
    page: number | null;
    embedding: number[] | null;
    /** Generated column (tsvector); read-only, never set on Insert/Update. */
    content_tsvector: unknown;
  };
  Insert: {
    id?: string;
    user_id: string;
    file_id: string;
    chunk_index: number;
    content: string;
    char_count: number;
    page?: number | null;
    embedding?: number[] | null;
  };
  Update: Partial<FileChunksTable["Insert"]>;
}

export interface ConversationsTable {
  Row: {
    id: string;
    user_id: string;
    title: string;
    scope_type: ConversationScopeTypeEnum;
    scope_subject_id: string | null;
    scope_file_ids: string[] | null;
    created_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    title: string;
    scope_type?: ConversationScopeTypeEnum;
    scope_subject_id?: string | null;
    scope_file_ids?: string[] | null;
    created_at?: string;
  };
  Update: Partial<ConversationsTable["Insert"]>;
}

export interface MessagesTable {
  Row: {
    id: string;
    conversation_id: string;
    user_id: string;
    role: MessageRoleEnum;
    content: string;
    sources: MessageSourceJson[];
    created_at: string;
  };
  Insert: {
    id?: string;
    conversation_id: string;
    user_id: string;
    role: MessageRoleEnum;
    content: string;
    sources?: MessageSourceJson[];
    created_at?: string;
  };
  Update: Partial<MessagesTable["Insert"]>;
}

export interface PracticeSetsTable {
  Row: {
    id: string;
    user_id: string;
    subject_id: string | null;
    topic_id: string | null;
    title: string;
    generated_by: PracticeGeneratedByEnum;
    created_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    subject_id?: string | null;
    topic_id?: string | null;
    title: string;
    generated_by?: PracticeGeneratedByEnum;
    created_at?: string;
  };
  Update: Partial<PracticeSetsTable["Insert"]>;
}

export interface PracticeQuestionsTable {
  Row: {
    id: string;
    set_id: string;
    kind: QuestionKindEnum;
    difficulty: QuestionDifficultyEnum;
    prompt: string;
    options: string[] | null;
    expected_answer: string;
    grading_criteria: string[];
    explanation: string;
    common_mistakes: string[];
    source_file_id: string | null;
    source_excerpt: string | null;
    created_at: string;
  };
  Insert: {
    id?: string;
    set_id: string;
    kind: QuestionKindEnum;
    difficulty?: QuestionDifficultyEnum;
    prompt: string;
    options?: string[] | null;
    expected_answer: string;
    grading_criteria?: string[];
    explanation?: string;
    common_mistakes?: string[];
    source_file_id?: string | null;
    source_excerpt?: string | null;
    created_at?: string;
  };
  Update: Partial<PracticeQuestionsTable["Insert"]>;
}

export interface PracticeAttemptsTable {
  Row: {
    id: string;
    user_id: string;
    question_id: string;
    answer_text: string;
    is_correct: boolean;
    feedback: string;
    first_error_hint: string | null;
    attempt_number: number;
    created_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    question_id: string;
    answer_text: string;
    is_correct?: boolean;
    feedback?: string;
    first_error_hint?: string | null;
    attempt_number?: number;
    created_at?: string;
  };
  Update: Partial<PracticeAttemptsTable["Insert"]>;
}

export interface StudySessionsTable {
  Row: {
    id: string;
    user_id: string;
    subject_id: string | null;
    topic_id: string | null;
    exam_id: string | null;
    starts_at: string;
    ends_at: string;
    completed: boolean;
  };
  Insert: {
    id?: string;
    user_id: string;
    subject_id?: string | null;
    topic_id?: string | null;
    exam_id?: string | null;
    starts_at: string;
    ends_at: string;
    completed?: boolean;
  };
  Update: Partial<StudySessionsTable["Insert"]>;
}

export interface PlannerRunsTable {
  Row: {
    id: string;
    user_id: string;
    week_start: string;
    plan: GeneratedPlanJson;
    status: PlannerRunStatusEnum;
    approved_block_ids: string[];
    created_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    week_start: string;
    plan: GeneratedPlanJson;
    status?: PlannerRunStatusEnum;
    approved_block_ids?: string[];
    created_at?: string;
  };
  Update: Partial<PlannerRunsTable["Insert"]>;
}

export interface ProposedTimeBlocksTable {
  Row: {
    id: string;
    planner_run_id: string;
    activity_title: string;
    activity_kind: TimeBlockActivityKindEnum;
    date: string;
    start_time: string;
    end_time: string;
    reason: string;
    priority: TaskPriorityEnum;
    movable: boolean;
    source_ref_id: string | null;
    source_ref_type: TimeBlockSourceRefTypeEnum | null;
  };
  Insert: {
    id?: string;
    planner_run_id: string;
    activity_title: string;
    activity_kind: TimeBlockActivityKindEnum;
    date: string;
    start_time: string;
    end_time: string;
    reason?: string;
    priority?: TaskPriorityEnum;
    movable?: boolean;
    source_ref_id?: string | null;
    source_ref_type?: TimeBlockSourceRefTypeEnum | null;
  };
  Update: Partial<ProposedTimeBlocksTable["Insert"]>;
}

export interface ActivityLogTable {
  Row: {
    id: string;
    user_id: string;
    action: string;
    entity_type: string;
    entity_id: string;
    created_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    action: string;
    entity_type: string;
    entity_id: string;
    created_at?: string;
  };
  Update: Partial<ActivityLogTable["Insert"]>;
}

export interface AiUsageTable {
  Row: {
    id: string;
    user_id: string;
    feature: AiUsageFeatureEnum;
    provider: AiUsageProviderEnum;
    input_tokens: number;
    output_tokens: number;
    created_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    feature: AiUsageFeatureEnum;
    provider: AiUsageProviderEnum;
    input_tokens?: number;
    output_tokens?: number;
    created_at?: string;
  };
  Update: Partial<AiUsageTable["Insert"]>;
}

// ---------------------------------------------------------------------------
// Database root type, in the shape `@supabase/supabase-js` /
// `@supabase/ssr`'s generic clients expect.
// ---------------------------------------------------------------------------
export interface Database {
  public: {
    Tables: {
      profiles: ProfilesTable;
      user_preferences: UserPreferencesTable;
      subjects: SubjectsTable;
      study_topics: StudyTopicsTable;
      exams: ExamsTable;
      tasks: TasksTable;
      events: EventsTable;
      availability_rules: AvailabilityRulesTable;
      projects: ProjectsTable;
      project_tasks: ProjectTasksTable;
      goals: GoalsTable;
      habits: HabitsTable;
      habit_logs: HabitLogsTable;
      training_sessions: TrainingSessionsTable;
      expenses: ExpensesTable;
      ideas: IdeasTable;
      files: FilesTable;
      file_chunks: FileChunksTable;
      conversations: ConversationsTable;
      messages: MessagesTable;
      practice_sets: PracticeSetsTable;
      practice_questions: PracticeQuestionsTable;
      practice_attempts: PracticeAttemptsTable;
      study_sessions: StudySessionsTable;
      planner_runs: PlannerRunsTable;
      proposed_time_blocks: ProposedTimeBlocksTable;
      activity_log: ActivityLogTable;
      ai_usage: AiUsageTable;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      profile_role: ProfileRole;
      theme_mode: ThemeMode;
      subject_color: SubjectColorEnum;
      topic_status: TopicStatusEnum;
      exam_importance: ExamImportanceEnum;
      exam_status: ExamStatusEnum;
      task_priority: TaskPriorityEnum;
      task_status: TaskStatusEnum;
      event_category: EventCategoryEnum;
      availability_kind: AvailabilityKindEnum;
      project_status: ProjectStatusEnum;
      file_processing_status: FileProcessingStatusEnum;
      conversation_scope_type: ConversationScopeTypeEnum;
      message_role: MessageRoleEnum;
      question_kind: QuestionKindEnum;
      question_difficulty: QuestionDifficultyEnum;
      practice_generated_by: PracticeGeneratedByEnum;
      time_block_activity_kind: TimeBlockActivityKindEnum;
      time_block_source_ref_type: TimeBlockSourceRefTypeEnum;
      planner_run_status: PlannerRunStatusEnum;
      ai_usage_feature: AiUsageFeatureEnum;
      ai_usage_provider: AiUsageProviderEnum;
    };
  };
}
