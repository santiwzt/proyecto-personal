import type { Exam, FileAsset, Project, Subject, Task } from "@/types/domain";

/**
 * Global search across the user's own records. Deterministic substring
 * matching, accent-insensitive — no external search index needed at this
 * scale. Every result type carries just enough to render a link + label.
 */

export type SearchResultType = "subject" | "task" | "exam" | "project" | "file";

export interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  subtitle: string | null;
  href: string;
}

function stripAccents(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function matches(query: string, ...fields: (string | null | undefined)[]): boolean {
  const normalizedQuery = stripAccents(query);
  return fields.some((field) => field && stripAccents(field).includes(normalizedQuery));
}

export interface SearchInput {
  query: string;
  subjects: Subject[];
  tasks: Task[];
  exams: Exam[];
  projects: Project[];
  files: FileAsset[];
}

export function searchAll({ query, subjects, tasks, exams, projects, files }: SearchInput): SearchResult[] {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const results: SearchResult[] = [];

  for (const s of subjects) {
    if (matches(trimmed, s.name, s.teacher, s.course)) {
      results.push({ type: "subject", id: s.id, title: s.name, subtitle: s.teacher, href: `/estudios/${s.id}` });
    }
  }
  for (const t of tasks) {
    if (matches(trimmed, t.title, t.description)) {
      results.push({ type: "task", id: t.id, title: t.title, subtitle: "Tarea", href: "/agenda" });
    }
  }
  for (const e of exams) {
    if (matches(trimmed, e.title)) {
      results.push({ type: "exam", id: e.id, title: e.title, subtitle: "Examen", href: `/estudios/${e.subjectId}` });
    }
  }
  for (const p of projects) {
    if (matches(trimmed, p.name, p.description)) {
      results.push({ type: "project", id: p.id, title: p.name, subtitle: "Proyecto", href: `/proyectos/${p.id}` });
    }
  }
  for (const f of files) {
    if (f.status !== "eliminado" && matches(trimmed, f.originalName)) {
      results.push({ type: "file", id: f.id, title: f.originalName, subtitle: "Archivo", href: "/archivos" });
    }
  }

  return results;
}
