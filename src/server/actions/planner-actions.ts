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

  const subjects = subjectsRepository.list(user.userId);
  const subjectNameById = new Map(subjects.map((s) => [s.id, s.name]));
  const topics = subjects.flatMap((s) => topicsRepository.listBySubject(user.userId, s.id));

  const plan = generatePlan({
    weekStart: parsed.weekStart,
    exams: examsRepository.list(user.userId),
    topics,
    tasks: tasksRepository.list(user.userId),
    events: eventsRepository.list(user.userId),
    availabilityRules: availabilityRepository.list(user.userId),
    studySessions: studySessionsRepository.list(user.userId),
    projects: projectsRepository.list(user.userId),
    subjectNameById,
  });

  const run = plannerRepository.create(user.userId, parsed.weekStart, plan);
  revalidatePath("/agenda");
  return run;
}

export async function approvePlanAction(input: ApprovePlanInput): Promise<PlannerRun> {
  const user = await requireSessionUser();
  const parsed = approvePlanSchema.parse(input);
  const run = plannerRepository.get(user.userId, parsed.plannerRunId);

  if (parsed.mode === "rechazar") {
    const rejected = plannerRepository.updateStatus(user.userId, run.id, "rechazado", []);
    revalidatePath("/agenda");
    return rejected;
  }

  const blocksToApprove =
    parsed.mode === "todo" ? run.plan.blocks : run.plan.blocks.filter((b) => parsed.blockIds.includes(b.id));

  if (blocksToApprove.length === 0) {
    throw new AppError("VALIDATION", "No hay bloques seleccionados para aprobar.");
  }

  for (const block of blocksToApprove) {
    eventsRepository.create(user.userId, {
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
      studySessionsRepository.create(user.userId, {
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
  const updated = plannerRepository.updateStatus(
    user.userId,
    run.id,
    status,
    blocksToApprove.map((b) => b.id),
  );
  revalidatePath("/agenda");
  revalidatePath("/hoy");
  return updated;
}
