import { getDemoStore } from "@/lib/database/demo/store";
import { generateId } from "@/lib/database/demo/ids";
import { AppError } from "@/lib/errors/app-error";
import { isDemoMode } from "@/config/env";
import { createSupabaseServerClient } from "@/lib/database/supabase/server";
import type { Idea, Project, ProjectTask } from "@/types/domain";
import type { IdeasTable, ProjectTasksTable, ProjectsTable } from "@/types/database";

type NewProject = Omit<Project, "id" | "userId" | "createdAt">;
type NewProjectTask = Omit<ProjectTask, "id" | "userId" | "createdAt" | "status">;
type NewIdea = Omit<Idea, "id" | "userId" | "createdAt" | "convertedToProjectId" | "convertedToTaskId">;

function dbError(action: string, error: { message: string }): never {
  console.error(`Supabase error (${action}):`, error.message);
  throw new AppError("INTERNAL", "Ocurrio un error al acceder a la base de datos.");
}

function mapProject(row: ProjectsTable["Row"]): Project {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    status: row.status,
    priority: row.priority,
    targetDate: row.target_date,
    technologies: row.technologies,
    links: row.links,
    nextStep: row.next_step,
    progress: row.progress,
    createdAt: row.created_at,
  };
}

export const projectsRepository = {
  async list(userId: string): Promise<Project[]> {
    if (isDemoMode) return getDemoStore().projects.list(userId);
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) dbError("projects.list", error);
    return data.map(mapProject);
  },

  async get(userId: string, id: string): Promise<Project> {
    if (isDemoMode) {
      const project = getDemoStore().projects.get(userId, id);
      if (!project) throw new AppError("NOT_FOUND", "No encontramos el proyecto.");
      return project;
    }
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("projects").select("*").eq("user_id", userId).eq("id", id).single();
    if (error) throw new AppError("NOT_FOUND", "No encontramos el proyecto.");
    return mapProject(data);
  },

  async create(userId: string, input: NewProject): Promise<Project> {
    if (isDemoMode) {
      return getDemoStore().projects.insert({ ...input, id: generateId("project"), userId, createdAt: new Date().toISOString() });
    }
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("projects")
      .insert({
        user_id: userId,
        name: input.name,
        description: input.description,
        status: input.status,
        priority: input.priority,
        target_date: input.targetDate,
        technologies: input.technologies,
        links: input.links,
        next_step: input.nextStep,
        progress: input.progress,
      })
      .select("*")
      .single();
    if (error) dbError("projects.create", error);
    return mapProject(data);
  },

  async update(userId: string, id: string, patch: Partial<NewProject>): Promise<Project> {
    if (isDemoMode) return getDemoStore().projects.update(userId, id, patch);
    const supabase = await createSupabaseServerClient();
    const dbPatch: Partial<ProjectsTable["Update"]> = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.description !== undefined) dbPatch.description = patch.description;
    if (patch.status !== undefined) dbPatch.status = patch.status;
    if (patch.priority !== undefined) dbPatch.priority = patch.priority;
    if (patch.targetDate !== undefined) dbPatch.target_date = patch.targetDate;
    if (patch.technologies !== undefined) dbPatch.technologies = patch.technologies;
    if (patch.links !== undefined) dbPatch.links = patch.links;
    if (patch.nextStep !== undefined) dbPatch.next_step = patch.nextStep;
    if (patch.progress !== undefined) dbPatch.progress = patch.progress;
    const { data, error } = await supabase
      .from("projects")
      .update(dbPatch)
      .eq("user_id", userId)
      .eq("id", id)
      .select("*")
      .single();
    if (error) dbError("projects.update", error);
    return mapProject(data);
  },

  async remove(userId: string, id: string): Promise<void> {
    if (isDemoMode) {
      getDemoStore().projects.remove(userId, id);
      return;
    }
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("projects").delete().eq("user_id", userId).eq("id", id);
    if (error) dbError("projects.remove", error);
  },
};

function mapProjectTask(row: ProjectTasksTable["Row"]): ProjectTask {
  return {
    id: row.id,
    userId: row.user_id,
    projectId: row.project_id,
    title: row.title,
    status: row.status,
    createdAt: row.created_at,
  };
}

export const projectTasksRepository = {
  async listByProject(userId: string, projectId: string): Promise<ProjectTask[]> {
    if (isDemoMode) return getDemoStore().projectTasks.list(userId).filter((t) => t.projectId === projectId);
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("project_tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("project_id", projectId)
      .order("created_at");
    if (error) dbError("projectTasks.listByProject", error);
    return data.map(mapProjectTask);
  },

  async create(userId: string, input: NewProjectTask): Promise<ProjectTask> {
    if (isDemoMode) {
      return getDemoStore().projectTasks.insert({
        ...input,
        id: generateId("ptask"),
        userId,
        status: "pendiente",
        createdAt: new Date().toISOString(),
      });
    }
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("project_tasks")
      .insert({ user_id: userId, project_id: input.projectId, title: input.title })
      .select("*")
      .single();
    if (error) dbError("projectTasks.create", error);
    return mapProjectTask(data);
  },

  async update(userId: string, id: string, patch: Partial<Omit<ProjectTask, "id" | "userId">>): Promise<ProjectTask> {
    if (isDemoMode) return getDemoStore().projectTasks.update(userId, id, patch);
    const supabase = await createSupabaseServerClient();
    const dbPatch: Partial<ProjectTasksTable["Update"]> = {};
    if (patch.title !== undefined) dbPatch.title = patch.title;
    if (patch.status !== undefined) dbPatch.status = patch.status;
    const { data, error } = await supabase
      .from("project_tasks")
      .update(dbPatch)
      .eq("user_id", userId)
      .eq("id", id)
      .select("*")
      .single();
    if (error) dbError("projectTasks.update", error);
    return mapProjectTask(data);
  },

  async remove(userId: string, id: string): Promise<void> {
    if (isDemoMode) {
      getDemoStore().projectTasks.remove(userId, id);
      return;
    }
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("project_tasks").delete().eq("user_id", userId).eq("id", id);
    if (error) dbError("projectTasks.remove", error);
  },
};

function mapIdea(row: IdeasTable["Row"]): Idea {
  return {
    id: row.id,
    userId: row.user_id,
    content: row.content,
    tags: row.tags,
    convertedToProjectId: row.converted_to_project_id,
    convertedToTaskId: row.converted_to_task_id,
    createdAt: row.created_at,
  };
}

export const ideasRepository = {
  async list(userId: string): Promise<Idea[]> {
    if (isDemoMode) return getDemoStore().ideas.list(userId);
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("ideas")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) dbError("ideas.list", error);
    return data.map(mapIdea);
  },

  async create(userId: string, input: NewIdea): Promise<Idea> {
    if (isDemoMode) {
      return getDemoStore().ideas.insert({
        ...input,
        id: generateId("idea"),
        userId,
        convertedToProjectId: null,
        convertedToTaskId: null,
        createdAt: new Date().toISOString(),
      });
    }
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("ideas")
      .insert({ user_id: userId, content: input.content, tags: input.tags })
      .select("*")
      .single();
    if (error) dbError("ideas.create", error);
    return mapIdea(data);
  },

  async markConvertedToProject(userId: string, id: string, projectId: string): Promise<Idea> {
    if (isDemoMode) return getDemoStore().ideas.update(userId, id, { convertedToProjectId: projectId });
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("ideas")
      .update({ converted_to_project_id: projectId })
      .eq("user_id", userId)
      .eq("id", id)
      .select("*")
      .single();
    if (error) dbError("ideas.markConvertedToProject", error);
    return mapIdea(data);
  },

  async markConvertedToTask(userId: string, id: string, taskId: string): Promise<Idea> {
    if (isDemoMode) return getDemoStore().ideas.update(userId, id, { convertedToTaskId: taskId });
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("ideas")
      .update({ converted_to_task_id: taskId })
      .eq("user_id", userId)
      .eq("id", id)
      .select("*")
      .single();
    if (error) dbError("ideas.markConvertedToTask", error);
    return mapIdea(data);
  },
};
