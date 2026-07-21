import { getDemoStore } from "@/lib/database/demo/store";
import { generateId } from "@/lib/database/demo/ids";
import { AppError } from "@/lib/errors/app-error";
import { isDemoMode } from "@/config/env";
import { createSupabaseServerClient } from "@/lib/database/supabase/server";
import type { Exam, StudySession, StudyTopic, Subject, Task } from "@/types/domain";
import type {
  ExamsTable,
  StudySessionsTable,
  StudyTopicsTable,
  SubjectsTable,
  TasksTable,
} from "@/types/database";

type NewSubject = Omit<Subject, "id" | "userId" | "createdAt" | "archivedAt">;
type NewTopic = Omit<StudyTopic, "id" | "userId" | "createdAt" | "estimatedConfidence" | "lastPracticedAt">;
type NewExam = Omit<Exam, "id" | "userId" | "createdAt" | "status" | "resultScore" | "resultNotes">;
type NewTask = Omit<Task, "id" | "userId" | "createdAt" | "status" | "completedAt">;
type NewStudySession = Omit<StudySession, "id" | "userId">;

function mustSupabase() {
  return createSupabaseServerClient();
}

function dbError(action: string, error: { message: string }): never {
  console.error(`Supabase error (${action}):`, error.message);
  throw new AppError("INTERNAL", "Ocurrio un error al acceder a la base de datos.");
}

// ---------------------------------------------------------------------------
// subjects
// ---------------------------------------------------------------------------
function mapSubject(row: SubjectsTable["Row"]): Subject {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    color: row.color,
    teacher: row.teacher,
    course: row.course,
    description: row.description,
    createdAt: row.created_at,
    archivedAt: row.archived_at,
  };
}

export const subjectsRepository = {
  async list(userId: string): Promise<Subject[]> {
    if (isDemoMode) return getDemoStore().subjects.list(userId).filter((s) => !s.archivedAt);
    const supabase = await mustSupabase();
    const { data, error } = await supabase
      .from("subjects")
      .select("*")
      .eq("user_id", userId)
      .is("archived_at", null)
      .order("created_at", { ascending: true });
    if (error) dbError("subjects.list", error);
    return data.map(mapSubject);
  },

  async get(userId: string, id: string): Promise<Subject> {
    if (isDemoMode) {
      const subject = getDemoStore().subjects.get(userId, id);
      if (!subject) throw new AppError("NOT_FOUND", "No encontramos la materia.");
      return subject;
    }
    const supabase = await mustSupabase();
    const { data, error } = await supabase.from("subjects").select("*").eq("user_id", userId).eq("id", id).single();
    if (error) throw new AppError("NOT_FOUND", "No encontramos la materia.");
    return mapSubject(data);
  },

  async create(userId: string, input: NewSubject): Promise<Subject> {
    if (isDemoMode) {
      return getDemoStore().subjects.insert({
        ...input,
        id: generateId("subject"),
        userId,
        createdAt: new Date().toISOString(),
        archivedAt: null,
      });
    }
    const supabase = await mustSupabase();
    const { data, error } = await supabase
      .from("subjects")
      .insert({
        user_id: userId,
        name: input.name,
        color: input.color,
        teacher: input.teacher,
        course: input.course,
        description: input.description,
      })
      .select("*")
      .single();
    if (error) dbError("subjects.create", error);
    return mapSubject(data);
  },

  async update(userId: string, id: string, patch: Partial<NewSubject>): Promise<Subject> {
    if (isDemoMode) return getDemoStore().subjects.update(userId, id, patch);
    const supabase = await mustSupabase();
    const { data, error } = await supabase
      .from("subjects")
      .update(patch)
      .eq("user_id", userId)
      .eq("id", id)
      .select("*")
      .single();
    if (error) dbError("subjects.update", error);
    return mapSubject(data);
  },

  async archive(userId: string, id: string): Promise<Subject> {
    if (isDemoMode) {
      return getDemoStore().subjects.update(userId, id, { archivedAt: new Date().toISOString() });
    }
    const supabase = await mustSupabase();
    const { data, error } = await supabase
      .from("subjects")
      .update({ archived_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("id", id)
      .select("*")
      .single();
    if (error) dbError("subjects.archive", error);
    return mapSubject(data);
  },
};

// ---------------------------------------------------------------------------
// study topics
// ---------------------------------------------------------------------------
function mapTopic(row: StudyTopicsTable["Row"]): StudyTopic {
  return {
    id: row.id,
    userId: row.user_id,
    subjectId: row.subject_id,
    name: row.name,
    status: row.status,
    selfConfidence: row.self_confidence,
    estimatedConfidence: row.estimated_confidence,
    commonMistakes: row.common_mistakes,
    notes: row.notes,
    lastPracticedAt: row.last_practiced_at,
    createdAt: row.created_at,
  };
}

export const topicsRepository = {
  async listBySubject(userId: string, subjectId: string): Promise<StudyTopic[]> {
    if (isDemoMode) return getDemoStore().studyTopics.list(userId).filter((t) => t.subjectId === subjectId);
    const supabase = await mustSupabase();
    const { data, error } = await supabase
      .from("study_topics")
      .select("*")
      .eq("user_id", userId)
      .eq("subject_id", subjectId)
      .order("created_at", { ascending: true });
    if (error) dbError("topics.listBySubject", error);
    return data.map(mapTopic);
  },

  async listByIds(userId: string, ids: string[]): Promise<StudyTopic[]> {
    if (ids.length === 0) return [];
    if (isDemoMode) return getDemoStore().studyTopics.list(userId).filter((t) => ids.includes(t.id));
    const supabase = await mustSupabase();
    const { data, error } = await supabase.from("study_topics").select("*").eq("user_id", userId).in("id", ids);
    if (error) dbError("topics.listByIds", error);
    return data.map(mapTopic);
  },

  async get(userId: string, id: string): Promise<StudyTopic> {
    if (isDemoMode) {
      const topic = getDemoStore().studyTopics.get(userId, id);
      if (!topic) throw new AppError("NOT_FOUND", "No encontramos el tema.");
      return topic;
    }
    const supabase = await mustSupabase();
    const { data, error } = await supabase
      .from("study_topics")
      .select("*")
      .eq("user_id", userId)
      .eq("id", id)
      .single();
    if (error) throw new AppError("NOT_FOUND", "No encontramos el tema.");
    return mapTopic(data);
  },

  async create(userId: string, input: NewTopic): Promise<StudyTopic> {
    if (isDemoMode) {
      return getDemoStore().studyTopics.insert({
        ...input,
        id: generateId("topic"),
        userId,
        estimatedConfidence: 0,
        lastPracticedAt: null,
        createdAt: new Date().toISOString(),
      });
    }
    const supabase = await mustSupabase();
    const { data, error } = await supabase
      .from("study_topics")
      .insert({
        user_id: userId,
        subject_id: input.subjectId,
        name: input.name,
        status: input.status,
        self_confidence: input.selfConfidence,
        common_mistakes: input.commonMistakes,
        notes: input.notes,
      })
      .select("*")
      .single();
    if (error) dbError("topics.create", error);
    return mapTopic(data);
  },

  async update(userId: string, id: string, patch: Partial<Omit<StudyTopic, "id" | "userId">>): Promise<StudyTopic> {
    if (isDemoMode) return getDemoStore().studyTopics.update(userId, id, patch);
    const supabase = await mustSupabase();
    const dbPatch: Partial<StudyTopicsTable["Update"]> = {};
    if (patch.status !== undefined) dbPatch.status = patch.status;
    if (patch.selfConfidence !== undefined) dbPatch.self_confidence = patch.selfConfidence;
    if (patch.estimatedConfidence !== undefined) dbPatch.estimated_confidence = patch.estimatedConfidence;
    if (patch.notes !== undefined) dbPatch.notes = patch.notes;
    if (patch.commonMistakes !== undefined) dbPatch.common_mistakes = patch.commonMistakes;
    if (patch.lastPracticedAt !== undefined) dbPatch.last_practiced_at = patch.lastPracticedAt;
    const { data, error } = await supabase
      .from("study_topics")
      .update(dbPatch)
      .eq("user_id", userId)
      .eq("id", id)
      .select("*")
      .single();
    if (error) dbError("topics.update", error);
    return mapTopic(data);
  },

  async markPracticed(userId: string, id: string, estimatedConfidence: number): Promise<StudyTopic> {
    return this.update(userId, id, { lastPracticedAt: new Date().toISOString(), estimatedConfidence });
  },
};

// ---------------------------------------------------------------------------
// exams
// ---------------------------------------------------------------------------
function mapExam(row: ExamsTable["Row"]): Exam {
  return {
    id: row.id,
    userId: row.user_id,
    subjectId: row.subject_id,
    title: row.title,
    scheduledAt: row.scheduled_at,
    durationMinutes: row.duration_minutes,
    topicIds: row.topic_ids,
    importance: row.importance,
    status: row.status,
    fileIds: row.file_ids,
    resultScore: row.result_score,
    resultNotes: row.result_notes,
    createdAt: row.created_at,
  };
}

export const examsRepository = {
  async list(userId: string): Promise<Exam[]> {
    if (isDemoMode) return getDemoStore().exams.list(userId);
    const supabase = await mustSupabase();
    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .eq("user_id", userId)
      .order("scheduled_at", { ascending: true });
    if (error) dbError("exams.list", error);
    return data.map(mapExam);
  },

  async listBySubject(userId: string, subjectId: string): Promise<Exam[]> {
    if (isDemoMode) return getDemoStore().exams.list(userId).filter((e) => e.subjectId === subjectId);
    const supabase = await mustSupabase();
    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .eq("user_id", userId)
      .eq("subject_id", subjectId)
      .order("scheduled_at", { ascending: true });
    if (error) dbError("exams.listBySubject", error);
    return data.map(mapExam);
  },

  async get(userId: string, id: string): Promise<Exam> {
    if (isDemoMode) {
      const exam = getDemoStore().exams.get(userId, id);
      if (!exam) throw new AppError("NOT_FOUND", "No encontramos el examen.");
      return exam;
    }
    const supabase = await mustSupabase();
    const { data, error } = await supabase.from("exams").select("*").eq("user_id", userId).eq("id", id).single();
    if (error) throw new AppError("NOT_FOUND", "No encontramos el examen.");
    return mapExam(data);
  },

  async create(userId: string, input: NewExam): Promise<Exam> {
    if (isDemoMode) {
      return getDemoStore().exams.insert({
        ...input,
        id: generateId("exam"),
        userId,
        status: "programado",
        fileIds: [],
        resultScore: null,
        resultNotes: null,
        createdAt: new Date().toISOString(),
      });
    }
    const supabase = await mustSupabase();
    const { data, error } = await supabase
      .from("exams")
      .insert({
        user_id: userId,
        subject_id: input.subjectId,
        title: input.title,
        scheduled_at: input.scheduledAt,
        duration_minutes: input.durationMinutes,
        topic_ids: input.topicIds,
        importance: input.importance,
      })
      .select("*")
      .single();
    if (error) dbError("exams.create", error);
    return mapExam(data);
  },

  async update(userId: string, id: string, patch: Partial<Omit<Exam, "id" | "userId">>): Promise<Exam> {
    if (isDemoMode) return getDemoStore().exams.update(userId, id, patch);
    const supabase = await mustSupabase();
    const dbPatch: Partial<ExamsTable["Update"]> = {};
    if (patch.title !== undefined) dbPatch.title = patch.title;
    if (patch.scheduledAt !== undefined) dbPatch.scheduled_at = patch.scheduledAt;
    if (patch.durationMinutes !== undefined) dbPatch.duration_minutes = patch.durationMinutes;
    if (patch.topicIds !== undefined) dbPatch.topic_ids = patch.topicIds;
    if (patch.importance !== undefined) dbPatch.importance = patch.importance;
    if (patch.status !== undefined) dbPatch.status = patch.status;
    if (patch.fileIds !== undefined) dbPatch.file_ids = patch.fileIds;
    if (patch.resultScore !== undefined) dbPatch.result_score = patch.resultScore;
    if (patch.resultNotes !== undefined) dbPatch.result_notes = patch.resultNotes;
    const { data, error } = await supabase
      .from("exams")
      .update(dbPatch)
      .eq("user_id", userId)
      .eq("id", id)
      .select("*")
      .single();
    if (error) dbError("exams.update", error);
    return mapExam(data);
  },

  async remove(userId: string, id: string): Promise<void> {
    if (isDemoMode) {
      getDemoStore().exams.remove(userId, id);
      return;
    }
    const supabase = await mustSupabase();
    const { error } = await supabase.from("exams").delete().eq("user_id", userId).eq("id", id);
    if (error) dbError("exams.remove", error);
  },
};

// ---------------------------------------------------------------------------
// tasks
// ---------------------------------------------------------------------------
function mapTask(row: TasksTable["Row"]): Task {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    dueAt: row.due_at,
    estimatedMinutes: row.estimated_minutes,
    priority: row.priority,
    status: row.status,
    subjectId: row.subject_id,
    projectId: row.project_id,
    isFixed: row.is_fixed,
    completedAt: row.completed_at,
    createdAt: row.created_at,
  };
}

export const tasksRepository = {
  async list(userId: string): Promise<Task[]> {
    if (isDemoMode) return getDemoStore().tasks.list(userId);
    const supabase = await mustSupabase();
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) dbError("tasks.list", error);
    return data.map(mapTask);
  },

  async get(userId: string, id: string): Promise<Task> {
    if (isDemoMode) {
      const task = getDemoStore().tasks.get(userId, id);
      if (!task) throw new AppError("NOT_FOUND", "No encontramos la tarea.");
      return task;
    }
    const supabase = await mustSupabase();
    const { data, error } = await supabase.from("tasks").select("*").eq("user_id", userId).eq("id", id).single();
    if (error) throw new AppError("NOT_FOUND", "No encontramos la tarea.");
    return mapTask(data);
  },

  async create(userId: string, input: NewTask): Promise<Task> {
    if (isDemoMode) {
      return getDemoStore().tasks.insert({
        ...input,
        id: generateId("task"),
        userId,
        status: "pendiente",
        completedAt: null,
        createdAt: new Date().toISOString(),
      });
    }
    const supabase = await mustSupabase();
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        user_id: userId,
        title: input.title,
        description: input.description,
        due_at: input.dueAt,
        estimated_minutes: input.estimatedMinutes,
        priority: input.priority,
        subject_id: input.subjectId,
        project_id: input.projectId,
        is_fixed: input.isFixed,
      })
      .select("*")
      .single();
    if (error) dbError("tasks.create", error);
    return mapTask(data);
  },

  async update(userId: string, id: string, patch: Partial<Omit<Task, "id" | "userId">>): Promise<Task> {
    if (isDemoMode) return getDemoStore().tasks.update(userId, id, patch);
    const supabase = await mustSupabase();
    const dbPatch: Partial<TasksTable["Update"]> = {};
    if (patch.title !== undefined) dbPatch.title = patch.title;
    if (patch.description !== undefined) dbPatch.description = patch.description;
    if (patch.dueAt !== undefined) dbPatch.due_at = patch.dueAt;
    if (patch.estimatedMinutes !== undefined) dbPatch.estimated_minutes = patch.estimatedMinutes;
    if (patch.priority !== undefined) dbPatch.priority = patch.priority;
    if (patch.status !== undefined) dbPatch.status = patch.status;
    if (patch.subjectId !== undefined) dbPatch.subject_id = patch.subjectId;
    if (patch.projectId !== undefined) dbPatch.project_id = patch.projectId;
    if (patch.isFixed !== undefined) dbPatch.is_fixed = patch.isFixed;
    if (patch.completedAt !== undefined) dbPatch.completed_at = patch.completedAt;
    const { data, error } = await supabase
      .from("tasks")
      .update(dbPatch)
      .eq("user_id", userId)
      .eq("id", id)
      .select("*")
      .single();
    if (error) dbError("tasks.update", error);
    return mapTask(data);
  },

  async complete(userId: string, id: string): Promise<Task> {
    return this.update(userId, id, { status: "completada", completedAt: new Date().toISOString() });
  },

  async remove(userId: string, id: string): Promise<void> {
    if (isDemoMode) {
      getDemoStore().tasks.remove(userId, id);
      return;
    }
    const supabase = await mustSupabase();
    const { error } = await supabase.from("tasks").delete().eq("user_id", userId).eq("id", id);
    if (error) dbError("tasks.remove", error);
  },
};

// ---------------------------------------------------------------------------
// study sessions
// ---------------------------------------------------------------------------
function mapStudySession(row: StudySessionsTable["Row"]): StudySession {
  return {
    id: row.id,
    userId: row.user_id,
    subjectId: row.subject_id,
    topicId: row.topic_id,
    examId: row.exam_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    completed: row.completed,
  };
}

export const studySessionsRepository = {
  async list(userId: string): Promise<StudySession[]> {
    if (isDemoMode) return getDemoStore().studySessions.list(userId);
    const supabase = await mustSupabase();
    const { data, error } = await supabase.from("study_sessions").select("*").eq("user_id", userId);
    if (error) dbError("studySessions.list", error);
    return data.map(mapStudySession);
  },

  async listByExam(userId: string, examId: string): Promise<StudySession[]> {
    if (isDemoMode) return getDemoStore().studySessions.list(userId).filter((s) => s.examId === examId);
    const supabase = await mustSupabase();
    const { data, error } = await supabase
      .from("study_sessions")
      .select("*")
      .eq("user_id", userId)
      .eq("exam_id", examId);
    if (error) dbError("studySessions.listByExam", error);
    return data.map(mapStudySession);
  },

  async create(userId: string, input: NewStudySession): Promise<StudySession> {
    if (isDemoMode) return getDemoStore().studySessions.insert({ ...input, id: generateId("session"), userId });
    const supabase = await mustSupabase();
    const { data, error } = await supabase
      .from("study_sessions")
      .insert({
        user_id: userId,
        subject_id: input.subjectId,
        topic_id: input.topicId,
        exam_id: input.examId,
        starts_at: input.startsAt,
        ends_at: input.endsAt,
        completed: input.completed,
      })
      .select("*")
      .single();
    if (error) dbError("studySessions.create", error);
    return mapStudySession(data);
  },

  async markCompleted(userId: string, id: string): Promise<StudySession> {
    if (isDemoMode) return getDemoStore().studySessions.update(userId, id, { completed: true });
    const supabase = await mustSupabase();
    const { data, error } = await supabase
      .from("study_sessions")
      .update({ completed: true })
      .eq("user_id", userId)
      .eq("id", id)
      .select("*")
      .single();
    if (error) dbError("studySessions.markCompleted", error);
    return mapStudySession(data);
  },
};
