import { beforeEach, describe, expect, it } from "vitest";
import { AppError } from "@/lib/errors/app-error";
import { getDemoStore } from "@/lib/database/demo/store";
import { DEMO_USER_ID, SECONDARY_DEMO_USER_ID } from "@/lib/database/demo/ids";
import { subjectsRepository, tasksRepository } from "@/server/repositories/academic-repository";

/**
 * Security requirement (PROMPT MAESTRO section 26 / 20): user A must never
 * be able to read or modify user B's resources. The demo store enforces
 * this the same way Postgres RLS would (see docs/decisions/0001), so this
 * test exercises the real isolation logic, not a mock.
 */
describe("cross-user data isolation", () => {
  let userASubjectId: string;

  beforeEach(async () => {
    const subject = await subjectsRepository.create(DEMO_USER_ID, {
      name: "Materia privada de A",
      color: "blue",
      teacher: null,
      course: null,
      description: null,
    });
    userASubjectId = subject.id;
  });

  it("user B cannot read user A's subject", async () => {
    await expect(subjectsRepository.get(SECONDARY_DEMO_USER_ID, userASubjectId)).rejects.toThrow(AppError);
    try {
      await subjectsRepository.get(SECONDARY_DEMO_USER_ID, userASubjectId);
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("AUTHORIZATION");
    }
  });

  it("user B's subject list never includes user A's subjects", async () => {
    await subjectsRepository.create(SECONDARY_DEMO_USER_ID, {
      name: "Materia de B",
      color: "green",
      teacher: null,
      course: null,
      description: null,
    });
    const bSubjects = await subjectsRepository.list(SECONDARY_DEMO_USER_ID);
    expect(bSubjects.every((s) => s.id !== userASubjectId)).toBe(true);
    expect(bSubjects.some((s) => s.name === "Materia de B")).toBe(true);
  });

  it("user B cannot update user A's subject", async () => {
    await expect(
      subjectsRepository.update(SECONDARY_DEMO_USER_ID, userASubjectId, { name: "Hackeada" }),
    ).rejects.toThrow(AppError);
  });

  it("user B cannot archive user A's subject", async () => {
    await expect(subjectsRepository.archive(SECONDARY_DEMO_USER_ID, userASubjectId)).rejects.toThrow(AppError);
  });

  it("user B cannot permanently delete user A's subject", async () => {
    await expect(subjectsRepository.remove(SECONDARY_DEMO_USER_ID, userASubjectId)).rejects.toThrow(AppError);
    // still there afterwards, proving the delete never went through
    await expect(subjectsRepository.get(DEMO_USER_ID, userASubjectId)).resolves.toBeDefined();
  });

  it("user B cannot complete user A's task", async () => {
    const task = await tasksRepository.create(DEMO_USER_ID, {
      title: "Tarea privada de A",
      description: null,
      dueAt: null,
      estimatedMinutes: null,
      priority: "media",
      subjectId: null,
      projectId: null,
      isFixed: false,
    });
    await expect(tasksRepository.complete(SECONDARY_DEMO_USER_ID, task.id)).rejects.toThrow(AppError);
  });

  it("the underlying collection itself throws on cross-user get, independent of the repository layer", () => {
    const store = getDemoStore();
    expect(() => store.subjects.get(SECONDARY_DEMO_USER_ID, userASubjectId)).toThrow(AppError);
  });
});
