import { describe, expect, it } from "vitest";
import { searchAll } from "@/server/services/search";
import type { Exam, FileAsset, Project, Subject, Task } from "@/types/domain";

const subject: Subject = {
  id: "sub-1",
  userId: "u1",
  name: "Fisica",
  color: "blue",
  teacher: "Prof. Gomez",
  course: null,
  description: null,
  createdAt: "",
  archivedAt: null,
};

const task: Task = {
  id: "t1",
  userId: "u1",
  title: "Entregar informe de laboratorio",
  description: null,
  dueAt: null,
  estimatedMinutes: null,
  priority: "media",
  status: "pendiente",
  subjectId: null,
  projectId: null,
  isFixed: false,
  completedAt: null,
  createdAt: "",
};

const exam: Exam = {
  id: "e1",
  userId: "u1",
  subjectId: "sub-1",
  title: "Examen de cinematica",
  scheduledAt: "",
  durationMinutes: 60,
  topicIds: [],
  importance: "media",
  status: "programado",
  fileIds: [],
  resultScore: null,
  resultNotes: null,
  createdAt: "",
};

const project: Project = {
  id: "p1",
  userId: "u1",
  name: "Juego de terror",
  description: null,
  status: "en_progreso",
  priority: "media",
  targetDate: null,
  technologies: [],
  links: [],
  nextStep: null,
  progress: 0,
  createdAt: "",
};

const file: FileAsset = {
  id: "f1",
  userId: "u1",
  originalName: "Resumen tiro vertical.txt",
  safeName: "resumen-tiro-vertical.txt",
  mimeType: "text/plain",
  sizeBytes: 100,
  storagePath: "",
  status: "listo",
  subjectId: null,
  projectId: null,
  extractedText: null,
  processingError: null,
  contentHash: "",
  createdAt: "",
};

const dataset = { subjects: [subject], tasks: [task], exams: [exam], projects: [project], files: [file] };

describe("searchAll", () => {
  it("returns nothing for a very short query", () => {
    expect(searchAll({ query: "f", ...dataset })).toEqual([]);
  });

  it("finds a subject by name, accent-insensitive", () => {
    const results = searchAll({ query: "fisica", ...dataset });
    expect(results.some((r) => r.type === "subject" && r.id === "sub-1")).toBe(true);
  });

  it("finds a subject by teacher name", () => {
    const results = searchAll({ query: "gomez", ...dataset });
    expect(results.some((r) => r.type === "subject")).toBe(true);
  });

  it("finds a task by title", () => {
    const results = searchAll({ query: "laboratorio", ...dataset });
    expect(results.some((r) => r.type === "task" && r.id === "t1")).toBe(true);
  });

  it("finds an exam by title", () => {
    const results = searchAll({ query: "cinematica", ...dataset });
    expect(results.some((r) => r.type === "exam")).toBe(true);
  });

  it("finds a project by name", () => {
    const results = searchAll({ query: "terror", ...dataset });
    expect(results.some((r) => r.type === "project")).toBe(true);
  });

  it("finds a file by name and excludes deleted files", () => {
    const results = searchAll({ query: "tiro vertical", ...dataset });
    expect(results.some((r) => r.type === "file")).toBe(true);

    const deletedResults = searchAll({
      query: "tiro vertical",
      ...dataset,
      files: [{ ...file, status: "eliminado" }],
    });
    expect(deletedResults.some((r) => r.type === "file")).toBe(false);
  });

  it("returns no results when nothing matches", () => {
    expect(searchAll({ query: "xyzxyz", ...dataset })).toEqual([]);
  });
});
