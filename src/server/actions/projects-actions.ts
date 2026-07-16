"use server";

import { revalidatePath } from "next/cache";
import { requireSessionUser } from "@/lib/auth/session";
import {
  ideasRepository,
  projectTasksRepository,
  projectsRepository,
} from "@/server/repositories/projects-repository";
import { activityLogRepository } from "@/server/repositories/misc-repository";
import {
  createIdeaSchema,
  createProjectSchema,
  createProjectTaskSchema,
  type CreateIdeaInput,
  type CreateProjectInput,
  type CreateProjectTaskInput,
} from "@/lib/validation/schemas";
import type { Idea, Project, ProjectTask, TaskStatus } from "@/types/domain";

export async function createProjectAction(input: CreateProjectInput): Promise<Project> {
  const user = await requireSessionUser();
  const parsed = createProjectSchema.parse(input);
  const project = projectsRepository.create(user.userId, parsed);
  activityLogRepository.record(user.userId, "creo", "project", project.id);
  revalidatePath("/proyectos");
  return project;
}

export async function updateProjectAction(id: string, input: Partial<CreateProjectInput>): Promise<Project> {
  const user = await requireSessionUser();
  const parsed = createProjectSchema.partial().parse(input);
  const project = projectsRepository.update(user.userId, id, parsed);
  revalidatePath("/proyectos");
  revalidatePath(`/proyectos/${id}`);
  return project;
}

export async function deleteProjectAction(id: string): Promise<void> {
  const user = await requireSessionUser();
  projectsRepository.remove(user.userId, id);
  revalidatePath("/proyectos");
}

export async function createProjectTaskAction(input: CreateProjectTaskInput): Promise<ProjectTask> {
  const user = await requireSessionUser();
  const parsed = createProjectTaskSchema.parse(input);
  const task = projectTasksRepository.create(user.userId, parsed);
  revalidatePath(`/proyectos/${parsed.projectId}`);
  return task;
}

export async function updateProjectTaskStatusAction(id: string, status: TaskStatus, projectId: string): Promise<void> {
  const user = await requireSessionUser();
  projectTasksRepository.update(user.userId, id, { status });
  revalidatePath(`/proyectos/${projectId}`);
}

export async function createIdeaAction(input: CreateIdeaInput): Promise<Idea> {
  const user = await requireSessionUser();
  const parsed = createIdeaSchema.parse(input);
  const idea = ideasRepository.create(user.userId, parsed);
  revalidatePath("/proyectos");
  revalidatePath("/hoy");
  return idea;
}
