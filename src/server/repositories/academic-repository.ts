import { getDemoStore } from "@/lib/database/demo/store";
import { generateId } from "@/lib/database/demo/ids";
import { AppError } from "@/lib/errors/app-error";
import type { Exam, StudySession, StudyTopic, Subject, Task } from "@/types/domain";

type NewSubject = Omit<Subject, "id" | "userId" | "createdAt" | "archivedAt">;
type NewTopic = Omit<StudyTopic, "id" | "userId" | "createdAt" | "estimatedConfidence" | "lastPracticedAt">;
type NewExam = Omit<Exam, "id" | "userId" | "createdAt" | "status" | "resultScore" | "resultNotes" | "fileIds">;
type NewTask = Omit<Task, "id" | "userId" | "createdAt" | "status" | "completedAt">;
type NewStudySession = Omit<StudySession, "id" | "userId">;

export const subjectsRepository = {
  list(userId: string): Subject[] {
    return getDemoStore().subjects.list(userId).filter((s) => !s.archivedAt);
  },
  get(userId: string, id: string): Subject {
    const subject = getDemoStore().subjects.get(userId, id);
    if (!subject) throw new AppError("NOT_FOUND", "No encontramos la materia.");
    return subject;
  },
  create(userId: string, input: NewSubject): Subject {
    return getDemoStore().subjects.insert({
      ...input,
      id: generateId("subject"),
      userId,
      createdAt: new Date().toISOString(),
      archivedAt: null,
    });
  },
  update(userId: string, id: string, patch: Partial<NewSubject>): Subject {
    return getDemoStore().subjects.update(userId, id, patch);
  },
  archive(userId: string, id: string): Subject {
    return getDemoStore().subjects.update(userId, id, { archivedAt: new Date().toISOString() });
  },
};

export const topicsRepository = {
  listBySubject(userId: string, subjectId: string): StudyTopic[] {
    return getDemoStore().studyTopics.list(userId).filter((t) => t.subjectId === subjectId);
  },
  listByIds(userId: string, ids: string[]): StudyTopic[] {
    return getDemoStore().studyTopics.list(userId).filter((t) => ids.includes(t.id));
  },
  get(userId: string, id: string): StudyTopic {
    const topic = getDemoStore().studyTopics.get(userId, id);
    if (!topic) throw new AppError("NOT_FOUND", "No encontramos el tema.");
    return topic;
  },
  create(userId: string, input: NewTopic): StudyTopic {
    return getDemoStore().studyTopics.insert({
      ...input,
      id: generateId("topic"),
      userId,
      estimatedConfidence: 0,
      lastPracticedAt: null,
      createdAt: new Date().toISOString(),
    });
  },
  update(userId: string, id: string, patch: Partial<Omit<StudyTopic, "id" | "userId">>): StudyTopic {
    return getDemoStore().studyTopics.update(userId, id, patch);
  },
  markPracticed(userId: string, id: string, estimatedConfidence: number): StudyTopic {
    return getDemoStore().studyTopics.update(userId, id, {
      lastPracticedAt: new Date().toISOString(),
      estimatedConfidence,
    });
  },
};

export const examsRepository = {
  list(userId: string): Exam[] {
    return getDemoStore().exams.list(userId);
  },
  listBySubject(userId: string, subjectId: string): Exam[] {
    return getDemoStore().exams.list(userId).filter((e) => e.subjectId === subjectId);
  },
  get(userId: string, id: string): Exam {
    const exam = getDemoStore().exams.get(userId, id);
    if (!exam) throw new AppError("NOT_FOUND", "No encontramos el examen.");
    return exam;
  },
  create(userId: string, input: NewExam): Exam {
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
  },
  update(userId: string, id: string, patch: Partial<Omit<Exam, "id" | "userId">>): Exam {
    return getDemoStore().exams.update(userId, id, patch);
  },
  remove(userId: string, id: string): void {
    getDemoStore().exams.remove(userId, id);
  },
};

export const tasksRepository = {
  list(userId: string): Task[] {
    return getDemoStore().tasks.list(userId);
  },
  get(userId: string, id: string): Task {
    const task = getDemoStore().tasks.get(userId, id);
    if (!task) throw new AppError("NOT_FOUND", "No encontramos la tarea.");
    return task;
  },
  create(userId: string, input: NewTask): Task {
    return getDemoStore().tasks.insert({
      ...input,
      id: generateId("task"),
      userId,
      status: "pendiente",
      completedAt: null,
      createdAt: new Date().toISOString(),
    });
  },
  update(userId: string, id: string, patch: Partial<Omit<Task, "id" | "userId">>): Task {
    return getDemoStore().tasks.update(userId, id, patch);
  },
  complete(userId: string, id: string): Task {
    return getDemoStore().tasks.update(userId, id, {
      status: "completada",
      completedAt: new Date().toISOString(),
    });
  },
  remove(userId: string, id: string): void {
    getDemoStore().tasks.remove(userId, id);
  },
};

export const studySessionsRepository = {
  list(userId: string): StudySession[] {
    return getDemoStore().studySessions.list(userId);
  },
  listByExam(userId: string, examId: string): StudySession[] {
    return getDemoStore().studySessions.list(userId).filter((s) => s.examId === examId);
  },
  create(userId: string, input: NewStudySession): StudySession {
    return getDemoStore().studySessions.insert({ ...input, id: generateId("session"), userId });
  },
  markCompleted(userId: string, id: string): StudySession {
    return getDemoStore().studySessions.update(userId, id, { completed: true });
  },
};
