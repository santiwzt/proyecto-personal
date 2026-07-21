"use server";

import { revalidatePath } from "next/cache";
import { requireSessionUser } from "@/lib/auth/session";
import {
  examsRepository,
  studySessionsRepository,
  subjectsRepository,
  tasksRepository,
  topicsRepository,
} from "@/server/repositories/academic-repository";
import { activityLogRepository } from "@/server/repositories/misc-repository";
import {
  createExamSchema,
  createSubjectSchema,
  createTaskSchema,
  createTopicSchema,
  type CreateExamInput,
  type CreateSubjectInput,
  type CreateTaskInput,
  type CreateTopicInput,
} from "@/lib/validation/schemas";
import type { Exam, StudyTopic, Subject, Task } from "@/types/domain";

export async function createSubjectAction(input: CreateSubjectInput): Promise<Subject> {
  const user = await requireSessionUser();
  const parsed = createSubjectSchema.parse(input);
  const subject = await subjectsRepository.create(user.userId, parsed);
  await activityLogRepository.record(user.userId, "creo", "subject", subject.id);
  revalidatePath("/estudios");
  return subject;
}

export async function updateSubjectAction(id: string, input: Partial<CreateSubjectInput>): Promise<Subject> {
  const user = await requireSessionUser();
  const parsed = createSubjectSchema.partial().parse(input);
  const subject = await subjectsRepository.update(user.userId, id, parsed);
  revalidatePath("/estudios");
  revalidatePath(`/estudios/${id}`);
  return subject;
}

export type ArchiveSubjectResult = { ok: true } | { ok: false; message: string };

export async function archiveSubjectAction(id: string): Promise<ArchiveSubjectResult> {
  const user = await requireSessionUser();
  try {
    await subjectsRepository.archive(user.userId, id);
  } catch (error) {
    console.error("archiveSubjectAction failed", error);
    return { ok: false, message: "No se pudo archivar la materia. Intenta nuevamente en unos minutos." };
  }
  revalidatePath("/estudios");
  return { ok: true };
}

export async function createTopicAction(input: CreateTopicInput): Promise<StudyTopic> {
  const user = await requireSessionUser();
  const parsed = createTopicSchema.parse(input);
  const topic = await topicsRepository.create(user.userId, parsed);
  revalidatePath(`/estudios/${parsed.subjectId}`);
  return topic;
}

export async function updateTopicStatusAction(
  id: string,
  patch: { status?: StudyTopic["status"]; selfConfidence?: number; notes?: string | null },
): Promise<StudyTopic> {
  const user = await requireSessionUser();
  const topic = await topicsRepository.update(user.userId, id, patch);
  revalidatePath(`/estudios/${topic.subjectId}`);
  return topic;
}

export async function createExamAction(input: CreateExamInput): Promise<Exam> {
  const user = await requireSessionUser();
  const parsed = createExamSchema.parse(input);
  const exam = await examsRepository.create(user.userId, { ...parsed, fileIds: [] });
  await activityLogRepository.record(user.userId, "creo", "exam", exam.id);
  revalidatePath("/agenda");
  revalidatePath("/hoy");
  revalidatePath(`/estudios/${parsed.subjectId}`);
  return exam;
}

export async function updateExamResultAction(id: string, resultScore: number, resultNotes: string | null): Promise<Exam> {
  const user = await requireSessionUser();
  const exam = await examsRepository.update(user.userId, id, { resultScore, resultNotes, status: "rendido" });
  revalidatePath("/agenda");
  return exam;
}

export async function createTaskAction(input: CreateTaskInput): Promise<Task> {
  const user = await requireSessionUser();
  const parsed = createTaskSchema.parse(input);
  const task = await tasksRepository.create(user.userId, parsed);
  await activityLogRepository.record(user.userId, "creo", "task", task.id);
  revalidatePath("/agenda");
  revalidatePath("/hoy");
  return task;
}

export async function completeTaskAction(id: string): Promise<Task> {
  const user = await requireSessionUser();
  const task = await tasksRepository.complete(user.userId, id);
  await activityLogRepository.record(user.userId, "completo", "task", id);
  revalidatePath("/agenda");
  revalidatePath("/hoy");
  return task;
}

export async function deleteTaskAction(id: string): Promise<void> {
  const user = await requireSessionUser();
  await tasksRepository.remove(user.userId, id);
  revalidatePath("/agenda");
  revalidatePath("/hoy");
}

export async function scheduleStudySessionAction(input: {
  subjectId: string | null;
  topicId: string | null;
  examId: string | null;
  startsAt: string;
  endsAt: string;
}): Promise<void> {
  const user = await requireSessionUser();
  await studySessionsRepository.create(user.userId, { ...input, completed: false });
  revalidatePath("/agenda");
}
