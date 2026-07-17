"use server";

import { revalidatePath } from "next/cache";
import { requireSessionUser } from "@/lib/auth/session";
import { parseQuickCapture } from "@/server/services/quick-capture-parser";
import { subjectsRepository, tasksRepository, examsRepository, topicsRepository } from "@/server/repositories/academic-repository";
import { eventsRepository } from "@/server/repositories/calendar-repository";
import { ideasRepository } from "@/server/repositories/projects-repository";
import { expensesRepository } from "@/server/repositories/misc-repository";
import { quickCaptureConfirmSchema, quickCaptureInputSchema } from "@/lib/validation/schemas";
import type { QuickCaptureResult } from "@/types/domain";

export async function parseQuickCaptureAction(text: string): Promise<QuickCaptureResult> {
  const user = await requireSessionUser();
  const parsedInput = quickCaptureInputSchema.parse({ text });

  const subjectsRaw = await subjectsRepository.list(user.userId);
  const subjects = subjectsRaw.map((s) => ({ id: s.id, name: s.name }));
  const topicsBySubject = await Promise.all(
    subjects.map(async (s) => {
      const subjectTopics = await topicsRepository.listBySubject(user.userId, s.id);
      return subjectTopics.map((t) => ({ id: t.id, name: t.name, subjectId: s.id }));
    }),
  );
  const topics = topicsBySubject.flat();

  return parseQuickCapture(parsedInput.text, { subjects, topics });
}

export async function confirmQuickCaptureAction(
  result: QuickCaptureResult,
): Promise<{ type: string; id: string }> {
  const user = await requireSessionUser();
  if (result.type === "unknown") {
    throw new Error("No se puede guardar una interpretacion sin resolver.");
  }
  const parsed = quickCaptureConfirmSchema.parse(result);

  revalidatePath("/hoy");

  switch (parsed.type) {
    case "task": {
      const task = await tasksRepository.create(user.userId, parsed.data);
      revalidatePath("/agenda");
      return { type: "task", id: task.id };
    }
    case "exam": {
      const exam = await examsRepository.create(user.userId, { ...parsed.data, fileIds: [] });
      revalidatePath("/agenda");
      return { type: "exam", id: exam.id };
    }
    case "event": {
      const event = await eventsRepository.create(user.userId, parsed.data);
      revalidatePath("/agenda");
      return { type: "event", id: event.id };
    }
    case "idea": {
      const idea = await ideasRepository.create(user.userId, parsed.data);
      revalidatePath("/proyectos");
      return { type: "idea", id: idea.id };
    }
    case "expense": {
      const expense = await expensesRepository.create(user.userId, parsed.data);
      revalidatePath("/gastos");
      return { type: "expense", id: expense.id };
    }
  }
}
