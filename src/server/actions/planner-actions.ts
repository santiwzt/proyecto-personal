"use server";

import { revalidatePath } from "next/cache";
import { requireSessionUser } from "@/lib/auth/session";
import { AppError } from "@/lib/errors/app-error";
import { approvePlanSchema, generatePlanSchema, type ApprovePlanInput, type GeneratePlanInput } from "@/lib/validation/schemas";
import {
  examsRepository,
  studySessionsRepository,
  subjectsRepository,
  tasksRepository,
  topicsRepository,
} from "@/server/repositories/academic-repository";
import { availabilityRepository, eventsRepository } from "@/server/repositories/calendar-repository";
import { projectsRepository } from "@/server/repositories/projects-repository";
import { plannerRepository } from "@/server/repositories/planner-repository";
import { generatePlan } from "@/server/services/planner-engine";
import type { PlannerRun } from "@/types/domain";

export async function generatePlanAction(input: GeneratePlanInput): Promise<PlannerRun> {
  const user = await requireSessionUser();
  const parsed = generatePlanSchema.parse(input);

  const subjects = await subjectsRepository.list(user.userId);
  const subjectNameById = new Map(subjects.map((s) => [s.id, s.name]));
  const topicsBySubject = await Promise.all(
    subjects.map((s) => topicsRepository.listBySubject(user.userId, s.id)),
  );
  const topics = topicsBySubject.flat();

  const [exams, tasks, events, availabilityRules, studySessions, projects] = await Promise.all([
    examsRepository.list(user.userId),
    tasksRepository.list(user.userId),
    eventsRepository.list(user.userId),
    availabilityRepository.list(user.userId),
    studySessionsRepository.list(user.userId),
    projectsRepository.list(user.userId),
  ]);

  const plan = generatePlan({
    weekStart: parsed.weekStart,
    exams,
    topics,
    tasks,
    events,
    availabilityRules,
    studySessions,
    projects,
    subjectNameById,
  });

  const run = await plannerRepository.create(user.userId, parsed.weekStart, plan);
  revalidatePath("/agenda");
  return run;
}

export async function approvePlanAction(input: ApprovePlanInput): Promise<PlannerRun> {
  const user = await requireSessionUser();
  const parsed = approvePlanSchema.parse(input);
  const run = await plannerRepository.get(user.userId, parsed.plannerRunId);

  if (parsed.mode === "rechazar") {
    const rejected = await plannerRepository.updateStatus(user.userId, run.id, "rechazado", []);
    revalidatePath("/agenda");
    return rejected;
  }

  const blocksToApprove =
    parsed.mode === "todo" ? run.plan.blocks : run.plan.blocks.filter((b) => parsed.blockIds.includes(b.id));

  if (blocksToApprove.length === 0) {
    throw new AppError("VALIDATION", "No hay bloques seleccionados para aprobar.");
  }

  for (const block of blocksToApprove) {
    await eventsRepository.create(user.userId, {
      title: block.activityTitle,
      category: block.activityKind === "proyecto" ? "proyecto" : "estudio",
      startsAt: `${block.date}T${block.startTime}:00-03:00`,
      endsAt: `${block.date}T${block.endTime}:00-03:00`,
      location: null,
      isFixed: false,
      relatedExamId: block.sourceRefType === "exam" ? block.sourceRefId : null,
      relatedTaskId: block.sourceRefType === "task" ? block.sourceRefId : null,
      relatedProjectId: block.sourceRefType === "project" ? block.sourceRefId : null,
      notes: block.reason,
    });

    if (block.sourceRefType === "exam" && block.sourceRefId) {
      await studySessionsRepository.create(user.userId, {
        subjectId: null,
        topicId: null,
        examId: block.sourceRefId,
        startsAt: `${block.date}T${block.startTime}:00-03:00`,
        endsAt: `${block.date}T${block.endTime}:00-03:00`,
        completed: false,
      });
    }
  }

  const status = parsed.mode === "todo" ? "aprobado_total" : "aprobado_parcial";
  const updated = await plannerRepository.updateStatus(
    user.userId,
    run.id,
    status,
    blocksToApprove.map((b) => b.id),
  );
  revalidatePath("/agenda");
  revalidatePath("/hoy");
  return updated;
}
