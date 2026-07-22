import { beforeEach, describe, expect, it } from "vitest";

import { getDemoStore } from "@/lib/database/demo/store";
import { DEMO_USER_ID } from "@/lib/database/demo/ids";
import {
  examsRepository,
  studySessionsRepository,
  subjectsRepository,
  tasksRepository,
  topicsRepository,
} from "@/server/repositories/academic-repository";
import { filesRepository } from "@/server/repositories/files-repository";
import { practiceRepository, conversationsRepository } from "@/server/repositories/assistant-repository";

/**
 * subjectsRepository.remove() must mirror the DB's foreign-key behavior:
 * topics and exams belong to exactly one subject and are deleted with it,
 * while tasks/files/practice sets/study sessions/conversations only lose
 * the reference so unrelated data (and its own history) survives.
 */
describe("subjectsRepository.remove cascade", () => {
  let subjectId: string;
  let topicId: string;
  let examId: string;

  beforeEach(async () => {
    const subject = await subjectsRepository.create(DEMO_USER_ID, {
      name: "Materia a borrar",
      color: "blue",
      teacher: null,
      course: null,
      description: null,
    });
    subjectId = subject.id;

    const topic = await topicsRepository.create(DEMO_USER_ID, {
      subjectId,
      name: "Tema a borrar",
      status: "no_iniciado",
      selfConfidence: 0,
      commonMistakes: [],
      notes: null,
    });
    topicId = topic.id;

    const exam = await examsRepository.create(DEMO_USER_ID, {
      subjectId,
      title: "Examen a borrar",
      scheduledAt: "2026-08-01T09:00:00-03:00",
      durationMinutes: 60,
      topicIds: [topicId],
      importance: "media",
      fileIds: [],
    });
    examId = exam.id;

    await tasksRepository.create(DEMO_USER_ID, {
      title: "Tarea vinculada",
      description: null,
      dueAt: "2026-08-01T00:00:00-03:00",
      estimatedMinutes: 30,
      priority: "media",
      subjectId,
      projectId: null,
      isFixed: false,
    });

    await filesRepository.create(DEMO_USER_ID, {
      originalName: "apunte.pdf",
      safeName: "apunte.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1024,
      storagePath: "demo/apunte.pdf",
      subjectId,
      projectId: null,
      contentHash: "hash-1",
    });

    await practiceRepository.createSet(DEMO_USER_ID, {
      subjectId,
      topicId,
      title: "Set de practica",
      generatedBy: "heuristico",
    });

    await studySessionsRepository.create(DEMO_USER_ID, {
      subjectId,
      topicId,
      examId,
      startsAt: "2026-07-25T18:00:00-03:00",
      endsAt: "2026-07-25T19:00:00-03:00",
      completed: false,
    });

    await conversationsRepository.create(DEMO_USER_ID, "Chat de la materia", { type: "subject", subjectId });
  });

  it("deletes the subject's own topics and exams", async () => {
    await subjectsRepository.remove(DEMO_USER_ID, subjectId);

    expect(getDemoStore().studyTopics.findOwned(DEMO_USER_ID, topicId)).toBeNull();
    expect(getDemoStore().exams.findOwned(DEMO_USER_ID, examId)).toBeNull();
    await expect(subjectsRepository.get(DEMO_USER_ID, subjectId)).rejects.toThrow();
  });

  it("keeps tasks, files, practice sets and study sessions but unlinks them", async () => {
    await subjectsRepository.remove(DEMO_USER_ID, subjectId);

    const store = getDemoStore();
    const task = store.tasks.list(DEMO_USER_ID).find((t) => t.title === "Tarea vinculada");
    expect(task).toBeDefined();
    expect(task!.subjectId).toBeNull();

    const file = store.files.list(DEMO_USER_ID).find((f) => f.originalName === "apunte.pdf");
    expect(file).toBeDefined();
    expect(file!.subjectId).toBeNull();

    const practiceSet = store.practiceSets.list(DEMO_USER_ID).find((s) => s.title === "Set de practica");
    expect(practiceSet).toBeDefined();
    expect(practiceSet!.subjectId).toBeNull();
    expect(practiceSet!.topicId).toBeNull();

    const session = store.studySessions
      .list(DEMO_USER_ID)
      .find((s) => s.startsAt === "2026-07-25T18:00:00-03:00");
    expect(session).toBeDefined();
    expect(session!.subjectId).toBeNull();
    expect(session!.topicId).toBeNull();
    expect(session!.examId).toBeNull();
  });

  it("falls the conversation back to general scope instead of leaving a dangling subject reference", async () => {
    await subjectsRepository.remove(DEMO_USER_ID, subjectId);

    const conversation = getDemoStore()
      .conversations.list(DEMO_USER_ID)
      .find((c) => c.title === "Chat de la materia");
    expect(conversation).toBeDefined();
    expect(conversation!.scope).toEqual({ type: "general" });
  });
});
