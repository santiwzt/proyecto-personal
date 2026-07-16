import { getDemoStore } from "@/lib/database/demo/store";
import { generateId } from "@/lib/database/demo/ids";
import { AppError } from "@/lib/errors/app-error";
import type {
  Conversation,
  ConversationScope,
  Message,
  MessageSource,
  PracticeAttempt,
  PracticeQuestion,
  PracticeSet,
} from "@/types/domain";

export const conversationsRepository = {
  list(userId: string): Conversation[] {
    return getDemoStore().conversations.list(userId);
  },
  get(userId: string, id: string): Conversation {
    const conversation = getDemoStore().conversations.get(userId, id);
    if (!conversation) throw new AppError("NOT_FOUND", "No encontramos la conversacion.");
    return conversation;
  },
  create(userId: string, title: string, scope: ConversationScope): Conversation {
    return getDemoStore().conversations.insert({
      id: generateId("conv"),
      userId,
      title,
      scope,
      createdAt: new Date().toISOString(),
    });
  },
};

export const messagesRepository = {
  listByConversation(userId: string, conversationId: string): Message[] {
    return getDemoStore()
      .messages.list(userId)
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },
  create(
    userId: string,
    conversationId: string,
    role: "user" | "assistant",
    content: string,
    sources: MessageSource[] = [],
  ): Message {
    return getDemoStore().messages.insert({
      id: generateId("msg"),
      conversationId,
      userId,
      role,
      content,
      sources,
      createdAt: new Date().toISOString(),
    });
  },
};

export const practiceRepository = {
  listSetsBySubject(userId: string, subjectId: string): PracticeSet[] {
    return getDemoStore().practiceSets.list(userId).filter((s) => s.subjectId === subjectId);
  },
  getSet(userId: string, id: string): PracticeSet {
    const set = getDemoStore().practiceSets.get(userId, id);
    if (!set) throw new AppError("NOT_FOUND", "No encontramos el set de practica.");
    return set;
  },
  createSet(userId: string, input: Omit<PracticeSet, "id" | "userId" | "createdAt">): PracticeSet {
    return getDemoStore().practiceSets.insert({
      ...input,
      id: generateId("set"),
      userId,
      createdAt: new Date().toISOString(),
    });
  },
  listQuestions(setId: string): PracticeQuestion[] {
    return getDemoStore().listPracticeQuestions(setId);
  },
  getQuestion(id: string): PracticeQuestion {
    const question = getDemoStore().getPracticeQuestion(id);
    if (!question) throw new AppError("NOT_FOUND", "No encontramos la pregunta.");
    return question;
  },
  addQuestion(question: Omit<PracticeQuestion, "id">): PracticeQuestion {
    return getDemoStore().insertPracticeQuestion({ ...question, id: generateId("question") });
  },
  listAttemptsByQuestion(userId: string, questionId: string): PracticeAttempt[] {
    return getDemoStore()
      .practiceAttempts.list(userId)
      .filter((a) => a.questionId === questionId);
  },
  listAttemptsByQuestions(userId: string, questionIds: string[]): PracticeAttempt[] {
    return getDemoStore()
      .practiceAttempts.list(userId)
      .filter((a) => questionIds.includes(a.questionId));
  },
  addAttempt(userId: string, input: Omit<PracticeAttempt, "id" | "userId" | "createdAt">): PracticeAttempt {
    return getDemoStore().practiceAttempts.insert({
      ...input,
      id: generateId("attempt"),
      userId,
      createdAt: new Date().toISOString(),
    });
  },
};
