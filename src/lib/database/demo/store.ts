import { InMemoryCollection } from "./collection";
import { buildSeedData } from "./seed-data";
import { DEMO_USER_ID } from "./ids";
import { appConfig } from "@/config/app";
import type {
  ActivityLogEntry,
  AiUsageRecord,
  AvailabilityRule,
  CalendarEvent,
  Conversation,
  Exam,
  Expense,
  FileAsset,
  FileChunk,
  Goal,
  Habit,
  HabitLog,
  Idea,
  Message,
  PlannerRun,
  PracticeAttempt,
  PracticeQuestion,
  PracticeSet,
  Profile,
  Project,
  ProjectTask,
  PushSubscriptionRecord,
  StudySession,
  StudyTopic,
  Subject,
  Task,
  TrainingSession,
  UserPreferences,
} from "@/types/domain";

/**
 * The whole "database" for demo mode: one process-lifetime, in-memory
 * store. It is intentionally NOT durable across server restarts — that is
 * the point (see docs/decisions and README "Modo demo"): it must never be
 * mistaken for real persistence.
 */
export class DemoStore {
  readonly subjects: InMemoryCollection<Subject>;
  readonly studyTopics: InMemoryCollection<StudyTopic>;
  readonly exams: InMemoryCollection<Exam>;
  readonly tasks: InMemoryCollection<Task>;
  readonly events: InMemoryCollection<CalendarEvent>;
  readonly availabilityRules: InMemoryCollection<AvailabilityRule>;
  readonly projects: InMemoryCollection<Project>;
  readonly projectTasks: InMemoryCollection<ProjectTask>;
  readonly goals: InMemoryCollection<Goal>;
  readonly habits: InMemoryCollection<Habit>;
  readonly habitLogs: InMemoryCollection<HabitLog>;
  readonly trainingSessions: InMemoryCollection<TrainingSession>;
  readonly expenses: InMemoryCollection<Expense>;
  readonly ideas: InMemoryCollection<Idea>;
  readonly files: InMemoryCollection<FileAsset>;
  readonly fileChunks: InMemoryCollection<FileChunk>;
  readonly conversations: InMemoryCollection<Conversation>;
  readonly messages: InMemoryCollection<Message>;
  readonly practiceSets: InMemoryCollection<PracticeSet>;
  readonly practiceAttempts: InMemoryCollection<PracticeAttempt>;
  readonly studySessions: InMemoryCollection<StudySession>;
  readonly plannerRuns: InMemoryCollection<PlannerRun>;
  readonly activityLog: InMemoryCollection<ActivityLogEntry>;
  readonly aiUsage: InMemoryCollection<AiUsageRecord>;
  readonly pushSubscriptions: InMemoryCollection<PushSubscriptionRecord>;

  /** practice_questions has no userId of its own — ownership flows through practiceSets. */
  private practiceQuestionsRaw: PracticeQuestion[];
  private profiles: Map<string, Profile>;
  private preferences: Map<string, UserPreferences>;

  constructor() {
    const seed = buildSeedData(new Date());
    this.subjects = new InMemoryCollection(seed.subjects);
    this.studyTopics = new InMemoryCollection(seed.studyTopics);
    this.exams = new InMemoryCollection(seed.exams);
    this.tasks = new InMemoryCollection(seed.tasks);
    this.events = new InMemoryCollection(seed.events);
    this.availabilityRules = new InMemoryCollection(seed.availabilityRules);
    this.projects = new InMemoryCollection(seed.projects);
    this.projectTasks = new InMemoryCollection(seed.projectTasks);
    this.goals = new InMemoryCollection<Goal>([]);
    this.habits = new InMemoryCollection(seed.habits);
    this.habitLogs = new InMemoryCollection<HabitLog>([]);
    this.trainingSessions = new InMemoryCollection<TrainingSession>([]);
    this.expenses = new InMemoryCollection(seed.expenses);
    this.ideas = new InMemoryCollection(seed.ideas);
    this.files = new InMemoryCollection(seed.files);
    this.fileChunks = new InMemoryCollection(seed.fileChunks);
    this.conversations = new InMemoryCollection(seed.conversations);
    this.messages = new InMemoryCollection(seed.messages);
    this.practiceSets = new InMemoryCollection(seed.practiceSets);
    this.practiceAttempts = new InMemoryCollection(seed.practiceAttempts);
    this.studySessions = new InMemoryCollection(seed.studySessions);
    this.plannerRuns = new InMemoryCollection<PlannerRun>([]);
    this.activityLog = new InMemoryCollection(seed.activityLog);
    this.aiUsage = new InMemoryCollection<AiUsageRecord>([]);
    this.pushSubscriptions = new InMemoryCollection<PushSubscriptionRecord>([]);
    this.practiceQuestionsRaw = [...seed.practiceQuestions];

    this.profiles = new Map();
    this.profiles.set(DEMO_USER_ID, {
      id: DEMO_USER_ID,
      displayName: "Santiago",
      role: "estudiante_secundario",
      timeZone: appConfig.timeZone,
      onboardingCompletedAt: null,
      createdAt: seed.subjects[0]?.createdAt ?? new Date().toISOString(),
    });

    this.preferences = new Map();
    this.preferences.set(DEMO_USER_ID, {
      userId: DEMO_USER_ID,
      locale: appConfig.locale,
      dateFormat: appConfig.dateFormat,
      weekStartsOn: appConfig.weekStartsOn,
      theme: "system",
      dailyStudyLimitMinutes: 240,
      preferredStudyWindows: [],
      aiConsentGiven: false,
    });
  }

  getProfile(userId: string): Profile | null {
    return this.profiles.get(userId) ?? null;
  }

  upsertProfile(userId: string, patch: Partial<Omit<Profile, "id">>): Profile {
    const existing = this.profiles.get(userId);
    const updated: Profile = existing
      ? { ...existing, ...patch }
      : {
          id: userId,
          displayName: "Estudiante",
          role: "estudiante_secundario",
          timeZone: appConfig.timeZone,
          onboardingCompletedAt: null,
          createdAt: new Date().toISOString(),
          ...patch,
        };
    this.profiles.set(userId, updated);
    return updated;
  }

  getPreferences(userId: string): UserPreferences | null {
    return this.preferences.get(userId) ?? null;
  }

  upsertPreferences(userId: string, patch: Partial<Omit<UserPreferences, "userId">>): UserPreferences {
    const existing = this.preferences.get(userId);
    const updated: UserPreferences = existing
      ? { ...existing, ...patch }
      : {
          userId,
          locale: appConfig.locale,
          dateFormat: appConfig.dateFormat,
          weekStartsOn: appConfig.weekStartsOn,
          theme: "system",
          dailyStudyLimitMinutes: 240,
          preferredStudyWindows: [],
          aiConsentGiven: false,
          ...patch,
        };
    this.preferences.set(userId, updated);
    return updated;
  }

  listPracticeQuestions(setId: string): PracticeQuestion[] {
    return this.practiceQuestionsRaw.filter((q) => q.setId === setId);
  }

  getPracticeQuestion(id: string): PracticeQuestion | null {
    return this.practiceQuestionsRaw.find((q) => q.id === id) ?? null;
  }

  insertPracticeQuestion(question: PracticeQuestion): PracticeQuestion {
    this.practiceQuestionsRaw.push(question);
    return question;
  }
}

declare global {
  var __nexoDemoStore: DemoStore | undefined;
}

/** Survives Next.js dev hot-reload by hanging off globalThis, like the usual Prisma-client pattern. */
export function getDemoStore(): DemoStore {
  if (!globalThis.__nexoDemoStore) {
    globalThis.__nexoDemoStore = new DemoStore();
  }
  return globalThis.__nexoDemoStore;
}
