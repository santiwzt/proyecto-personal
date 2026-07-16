import { getDemoStore } from "@/lib/database/demo/store";
import { generateId } from "@/lib/database/demo/ids";
import { AppError } from "@/lib/errors/app-error";
import type { Idea, Project, ProjectTask } from "@/types/domain";

type NewProject = Omit<Project, "id" | "userId" | "createdAt">;
type NewProjectTask = Omit<ProjectTask, "id" | "userId" | "createdAt" | "status">;
type NewIdea = Omit<Idea, "id" | "userId" | "createdAt" | "convertedToProjectId" | "convertedToTaskId">;

export const projectsRepository = {
  list(userId: string): Project[] {
    return getDemoStore().projects.list(userId);
  },
  get(userId: string, id: string): Project {
    const project = getDemoStore().projects.get(userId, id);
    if (!project) throw new AppError("NOT_FOUND", "No encontramos el proyecto.");
    return project;
  },
  create(userId: string, input: NewProject): Project {
    return getDemoStore().projects.insert({
      ...input,
      id: generateId("project"),
      userId,
      createdAt: new Date().toISOString(),
    });
  },
  update(userId: string, id: string, patch: Partial<NewProject>): Project {
    return getDemoStore().projects.update(userId, id, patch);
  },
  remove(userId: string, id: string): void {
    getDemoStore().projects.remove(userId, id);
  },
};

export const projectTasksRepository = {
  listByProject(userId: string, projectId: string): ProjectTask[] {
    return getDemoStore().projectTasks.list(userId).filter((t) => t.projectId === projectId);
  },
  create(userId: string, input: NewProjectTask): ProjectTask {
    return getDemoStore().projectTasks.insert({
      ...input,
      id: generateId("ptask"),
      userId,
      status: "pendiente",
      createdAt: new Date().toISOString(),
    });
  },
  update(userId: string, id: string, patch: Partial<Omit<ProjectTask, "id" | "userId">>): ProjectTask {
    return getDemoStore().projectTasks.update(userId, id, patch);
  },
  remove(userId: string, id: string): void {
    getDemoStore().projectTasks.remove(userId, id);
  },
};

export const ideasRepository = {
  list(userId: string): Idea[] {
    return getDemoStore().ideas.list(userId);
  },
  create(userId: string, input: NewIdea): Idea {
    return getDemoStore().ideas.insert({
      ...input,
      id: generateId("idea"),
      userId,
      convertedToProjectId: null,
      convertedToTaskId: null,
      createdAt: new Date().toISOString(),
    });
  },
  markConvertedToProject(userId: string, id: string, projectId: string): Idea {
    return getDemoStore().ideas.update(userId, id, { convertedToProjectId: projectId });
  },
  markConvertedToTask(userId: string, id: string, taskId: string): Idea {
    return getDemoStore().ideas.update(userId, id, { convertedToTaskId: taskId });
  },
};
