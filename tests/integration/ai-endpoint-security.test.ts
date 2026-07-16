import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Security requirements: AI-backed endpoints must require authentication
 * and must respect the configured daily usage limit (PROMPT MAESTRO
 * section 26/20). `next/headers`'s `cookies()` only works inside a real
 * Next.js request, so it's mocked here to drive both the "no session" and
 * "valid demo session" cases against the real server action logic.
 */

let cookieStore: Map<string, string>;

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (cookieStore.has(name) ? { name, value: cookieStore.get(name) } : undefined),
  }),
}));

beforeEach(() => {
  cookieStore = new Map();
  vi.resetModules();
});

describe("AI endpoint authentication", () => {
  it("rejects generateQuestionsAction when there is no active session", async () => {
    const { generateQuestionsAction } = await import("@/server/actions/practice-actions");
    const { AppError } = await import("@/lib/errors/app-error");

    await expect(
      generateQuestionsAction({
        subjectId: null,
        topicId: null,
        fileIds: [],
        difficulty: "media",
        count: 3,
        kind: "mixto",
      }),
    ).rejects.toThrow(AppError);
  });

  it("allows generateQuestionsAction once a demo session cookie is present", async () => {
    cookieStore.set("nexo_demo_session", "active");
    const { generateQuestionsAction } = await import("@/server/actions/practice-actions");
    const { AppError } = await import("@/lib/errors/app-error");

    // With no file content behind it, it should fail with VALIDATION (a
    // real, typed error) rather than AUTHENTICATION — proving auth passed.
    try {
      await generateQuestionsAction({
        subjectId: null,
        topicId: null,
        fileIds: [],
        difficulty: "media",
        count: 3,
        kind: "mixto",
      });
      throw new Error("expected generateQuestionsAction to throw for an empty file selection");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as InstanceType<typeof AppError>).code).not.toBe("AUTHENTICATION");
    }
  });
});

describe("AI daily usage limit", () => {
  it("returns a typed LIMIT_EXCEEDED error once the daily limit is reached", async () => {
    cookieStore.set("nexo_demo_session", "active");
    const { DEMO_USER_ID } = await import("@/lib/database/demo/ids");
    const { aiUsageRepository } = await import("@/server/repositories/misc-repository");
    const { env } = await import("@/config/env");
    const { generateQuestionsAction } = await import("@/server/actions/practice-actions");
    const { AppError } = await import("@/lib/errors/app-error");

    for (let i = 0; i < env.AI_DAILY_REQUEST_LIMIT; i++) {
      aiUsageRepository.record(DEMO_USER_ID, {
        feature: "questions",
        provider: "heuristico",
        inputTokens: 0,
        outputTokens: 0,
      });
    }

    try {
      await generateQuestionsAction({
        subjectId: null,
        topicId: null,
        fileIds: [],
        difficulty: "media",
        count: 3,
        kind: "mixto",
      });
      throw new Error("expected generateQuestionsAction to throw once the daily limit is reached");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as InstanceType<typeof AppError>).code).toBe("LIMIT_EXCEEDED");
    }
  });
});
