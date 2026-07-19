import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/auth/session";
import { todayISODate } from "@/lib/dates";
import {
  examsRepository,
  studySessionsRepository,
  subjectsRepository,
  tasksRepository,
  topicsRepository,
} from "@/server/repositories/academic-repository";
import { conversationsRepository, messagesRepository } from "@/server/repositories/assistant-repository";
import { availabilityRepository, eventsRepository } from "@/server/repositories/calendar-repository";
import { filesRepository } from "@/server/repositories/files-repository";
import { habitLogsRepository, habitsRepository } from "@/server/repositories/habits-repository";
import { expensesRepository } from "@/server/repositories/misc-repository";
import { preferencesRepository, profileRepository } from "@/server/repositories/profile-repository";
import { ideasRepository, projectTasksRepository, projectsRepository } from "@/server/repositories/projects-repository";
import { trainingSessionsRepository } from "@/server/repositories/training-repository";

/**
 * Full JSON export of everything the user has created, for backup/portability.
 * File contents themselves live in storage (or the demo store) and aren't
 * re-embedded here -- only metadata plus any extracted text, which is
 * already small text derived from the user's own material.
 */
export async function GET() {
  const user = await requireSessionUser();
  const userId = user.userId;

  const [
    profile,
    preferences,
    subjects,
    exams,
    tasks,
    studySessions,
    events,
    availabilityRules,
    files,
    habits,
    habitLogs,
    trainingSessions,
    expenses,
    projects,
    ideas,
    conversations,
  ] = await Promise.all([
    profileRepository.get(userId),
    preferencesRepository.get(userId),
    subjectsRepository.list(userId),
    examsRepository.list(userId),
    tasksRepository.list(userId),
    studySessionsRepository.list(userId),
    eventsRepository.list(userId),
    availabilityRepository.list(userId),
    filesRepository.list(userId),
    habitsRepository.list(userId),
    habitLogsRepository.listForUser(userId),
    trainingSessionsRepository.list(userId),
    expensesRepository.list(userId),
    projectsRepository.list(userId),
    ideasRepository.list(userId),
    conversationsRepository.list(userId),
  ]);

  const topics = (
    await Promise.all(subjects.map((subject) => topicsRepository.listBySubject(userId, subject.id)))
  ).flat();
  const projectTasks = (
    await Promise.all(projects.map((project) => projectTasksRepository.listByProject(userId, project.id)))
  ).flat();
  const messages = (
    await Promise.all(
      conversations.map((conversation) => messagesRepository.listByConversation(userId, conversation.id)),
    )
  ).flat();

  const payload = {
    exportedAt: new Date().toISOString(),
    profile,
    preferences,
    subjects,
    topics,
    exams,
    tasks,
    studySessions,
    events,
    availabilityRules,
    files: files.map((file) => ({
      id: file.id,
      originalName: file.originalName,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      subjectId: file.subjectId,
      projectId: file.projectId,
      extractedText: file.extractedText,
      createdAt: file.createdAt,
    })),
    habits,
    habitLogs,
    trainingSessions,
    expenses,
    projects,
    projectTasks,
    ideas,
    conversations,
    messages,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="nexo-datos-${todayISODate()}.json"`,
    },
  });
}
