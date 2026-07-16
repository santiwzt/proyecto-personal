-- ============================================================================
-- 0002_enums.sql
-- Postgres enum types mirroring the TypeScript union types in
-- src/types/domain.ts. Kept as real enums (not check constraints) so that
-- invalid values are rejected at the type level and `db:generate` can infer
-- literal unions.
--
-- Wrapped in DO blocks with a guard so the migration is safe to re-run
-- (Postgres has no native `create type if not exists`).
-- ============================================================================

do $$ begin
  create type profile_role as enum (
    'estudiante_secundario',
    'estudiante_universitario',
    'profesional',
    'otro'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  -- UserPreferences.theme
  create type theme_mode as enum ('light', 'dark', 'system');
exception when duplicate_object then null; end $$;

do $$ begin
  -- Subject.color
  create type subject_color as enum (
    'blue', 'green', 'amber', 'rose', 'violet', 'cyan', 'orange', 'slate'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  -- StudyTopic.status
  create type topic_status as enum (
    'no_iniciado', 'aprendiendo', 'practicando', 'dominado'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  -- Exam.importance
  create type exam_importance as enum ('baja', 'media', 'alta');
exception when duplicate_object then null; end $$;

do $$ begin
  -- Exam.status
  create type exam_status as enum (
    'programado', 'preparando', 'rendido', 'cancelado'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  -- TaskPriority: shared by Task.priority, Project.priority, ProposedTimeBlock.priority.
  create type task_priority as enum ('baja', 'media', 'alta');
exception when duplicate_object then null; end $$;

do $$ begin
  -- TaskStatus: shared by Task.status and ProjectTask.status.
  create type task_status as enum (
    'pendiente', 'en_progreso', 'completada', 'vencida'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  -- CalendarEvent.category
  create type event_category as enum (
    'clase', 'examen', 'entrenamiento', 'partido', 'estudio', 'proyecto', 'personal', 'otro'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  -- AvailabilityRule.kind
  create type availability_kind as enum ('disponible', 'no_disponible');
exception when duplicate_object then null; end $$;

do $$ begin
  -- Project.status
  create type project_status as enum (
    'idea', 'planificado', 'en_progreso', 'pausado', 'completado', 'archivado'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  -- FileAsset.status (FileProcessingStatus)
  create type file_processing_status as enum (
    'subiendo', 'procesando', 'listo', 'fallo', 'eliminado'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  -- Conversation.scope.type (ConversationScope discriminated union, normalized
  -- into columns on `conversations` instead of a jsonb blob -- see 0005).
  create type conversation_scope_type as enum ('subject', 'files', 'general');
exception when duplicate_object then null; end $$;

do $$ begin
  -- Message.role
  create type message_role as enum ('user', 'assistant');
exception when duplicate_object then null; end $$;

do $$ begin
  -- PracticeQuestion.kind (QuestionKind)
  create type question_kind as enum (
    'opcion_multiple', 'verdadero_falso', 'respuesta_breve', 'desarrollo', 'ejercicio_paso_a_paso'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  -- PracticeQuestion.difficulty (QuestionDifficulty)
  create type question_difficulty as enum ('facil', 'media', 'dificil');
exception when duplicate_object then null; end $$;

do $$ begin
  -- PracticeSet.generatedBy
  create type practice_generated_by as enum ('ia', 'heuristico');
exception when duplicate_object then null; end $$;

do $$ begin
  -- ProposedTimeBlock.activityKind
  create type time_block_activity_kind as enum ('estudio', 'tarea', 'descanso', 'proyecto');
exception when duplicate_object then null; end $$;

do $$ begin
  -- ProposedTimeBlock.sourceRefType / UnscheduledItem.refType (superset)
  create type time_block_source_ref_type as enum ('task', 'exam', 'topic', 'project');
exception when duplicate_object then null; end $$;

do $$ begin
  -- PlannerRun.status (PlannerRunStatus)
  create type planner_run_status as enum (
    'propuesto', 'aprobado_total', 'aprobado_parcial', 'rechazado'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  -- AiUsageRecord.feature
  create type ai_usage_feature as enum ('chat', 'planner', 'questions', 'grading', 'quick_capture');
exception when duplicate_object then null; end $$;

do $$ begin
  -- AiUsageRecord.provider
  create type ai_usage_provider as enum ('anthropic', 'heuristico');
exception when duplicate_object then null; end $$;
