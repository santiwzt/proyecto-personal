import { getDemoStore } from "@/lib/database/demo/store";
import { generateId } from "@/lib/database/demo/ids";
import { AppError } from "@/lib/errors/app-error";
import { isDemoMode } from "@/config/env";
import { createSupabaseServerClient } from "@/lib/database/supabase/server";
import type {
  Conversation,
  ConversationScope,
  Message,
  MessageSource,
  PracticeAttempt,
  PracticeQuestion,
  PracticeSet,
} from "@/types/domain";
import type {
  ConversationsTable,
  MessagesTable,
  PracticeAttemptsTable,
  PracticeQuestionsTable,
  PracticeSetsTable,
} from "@/types/database";

function dbError(action: string, error: { message: string }): never {
  console.error(`Supabase error (${action}):`, error.message);
  throw new AppError("INTERNAL", "Ocurrio un error al acceder a la base de datos.");
}

function scopeToRow(scope: ConversationScope) {
  return {
    scope_type: scope.type,
    scope_subject_id: scope.type === "subject" ? scope.subjectId : null,
    scope_file_ids: scope.type === "files" ? scope.fileIds : null,
  };
}

function mapConversation(row: ConversationsTable["Row"]): Conversation {
  const scope: ConversationScope =
    row.scope_type === "subject" && row.scope_subject_id
      ? { type: "subject", subjectId: row.scope_subject_id }
      : row.scope_type === "files"
        ? { type: "files", fileIds: row.scope_file_ids ?? [] }
        : { type: "general" };
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    scope,
    createdAt: row.created_at,
  };
}

export const conversationsRepository = {
  async list(userId: string): Promise<Conversation[]> {
    if (isDemoMode) return getDemoStore().conversations.list(userId);
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) dbError("conversations.list", error);
    return data.map(mapConversation);
  },

  async get(userId: string, id: string): Promise<Conversation> {
    if (isDemoMode) {
      const conversation = getDemoStore().conversations.get(userId, id);
      if (!conversation) throw new AppError("NOT_FOUND", "No encontramos la conversacion.");
      return conversation;
    }
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", userId)
      .eq("id", id)
      .single();
    if (error) throw new AppError("NOT_FOUND", "No encontramos la conversacion.");
    return mapConversation(data);
  },

  async create(userId: string, title: string, scope: ConversationScope): Promise<Conversation> {
    if (isDemoMode) {
      return getDemoStore().conversations.insert({
        id: generateId("conv"),
        userId,
        title,
        scope,
        createdAt: new Date().toISOString(),
      });
    }
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: userId, title, ...scopeToRow(scope) })
      .select("*")
      .single();
    if (error) dbError("conversations.create", error);
    return mapConversation(data);
  },
};

function mapMessage(row: MessagesTable["Row"]): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    userId: row.user_id,
    role: row.role,
    content: row.content,
    sources: row.sources as MessageSource[],
    createdAt: row.created_at,
  };
}

export const messagesRepository = {
  async listByConversation(userId: string, conversationId: string): Promise<Message[]> {
    if (isDemoMode) {
      return getDemoStore()
        .messages.list(userId)
        .filter((m) => m.conversationId === conversationId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("user_id", userId)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (error) dbError("messages.listByConversation", error);
    return data.map(mapMessage);
  },

  async create(
    userId: string,
    conversationId: string,
    role: "user" | "assistant",
    content: string,
    sources: MessageSource[] = [],
  ): Promise<Message> {
    if (isDemoMode) {
      return getDemoStore().messages.insert({
        id: generateId("msg"),
        conversationId,
        userId,
        role,
        content,
        sources,
        createdAt: new Date().toISOString(),
      });
    }
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("messages")
      .insert({ user_id: userId, conversation_id: conversationId, role, content, sources })
      .select("*")
      .single();
    if (error) dbError("messages.create", error);
    return mapMessage(data);
  },
};

function mapPracticeSet(row: PracticeSetsTable["Row"]): PracticeSet {
  return {
    id: row.id,
    userId: row.user_id,
    subjectId: row.subject_id,
    topicId: row.topic_id,
    title: row.title,
    createdAt: row.created_at,
    generatedBy: row.generated_by,
  };
}

function mapPracticeQuestion(row: PracticeQuestionsTable["Row"]): PracticeQuestion {
  return {
    id: row.id,
    setId: row.set_id,
    kind: row.kind,
    difficulty: row.difficulty,
    prompt: row.prompt,
    options: row.options,
    expectedAnswer: row.expected_answer,
    gradingCriteria: row.grading_criteria,
    explanation: row.explanation,
    commonMistakes: row.common_mistakes,
    sourceFileId: row.source_file_id,
    sourceExcerpt: row.source_excerpt,
  };
}

function mapPracticeAttempt(row: PracticeAttemptsTable["Row"]): PracticeAttempt {
  return {
    id: row.id,
    userId: row.user_id,
    questionId: row.question_id,
    answerText: row.answer_text,
    isCorrect: row.is_correct,
    feedback: row.feedback,
    firstErrorHint: row.first_error_hint,
    attemptNumber: row.attempt_number,
    createdAt: row.created_at,
  };
}

export const practiceRepository = {
  async listSetsBySubject(userId: string, subjectId: string): Promise<PracticeSet[]> {
    if (isDemoMode) return getDemoStore().practiceSets.list(userId).filter((s) => s.subjectId === subjectId);
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("practice_sets")
      .select("*")
      .eq("user_id", userId)
      .eq("subject_id", subjectId)
      .order("created_at", { ascending: false });
    if (error) dbError("practice.listSetsBySubject", error);
    return data.map(mapPracticeSet);
  },

  async getSet(userId: string, id: string): Promise<PracticeSet> {
    if (isDemoMode) {
      const set = getDemoStore().practiceSets.get(userId, id);
      if (!set) throw new AppError("NOT_FOUND", "No encontramos el set de practica.");
      return set;
    }
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("practice_sets")
      .select("*")
      .eq("user_id", userId)
      .eq("id", id)
      .single();
    if (error) throw new AppError("NOT_FOUND", "No encontramos el set de practica.");
    return mapPracticeSet(data);
  },

  async createSet(userId: string, input: Omit<PracticeSet, "id" | "userId" | "createdAt">): Promise<PracticeSet> {
    if (isDemoMode) {
      return getDemoStore().practiceSets.insert({
        ...input,
        id: generateId("set"),
        userId,
        createdAt: new Date().toISOString(),
      });
    }
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("practice_sets")
      .insert({
        user_id: userId,
        subject_id: input.subjectId,
        topic_id: input.topicId,
        title: input.title,
        generated_by: input.generatedBy,
      })
      .select("*")
      .single();
    if (error) dbError("practice.createSet", error);
    return mapPracticeSet(data);
  },

  async listQuestions(setId: string): Promise<PracticeQuestion[]> {
    if (isDemoMode) return getDemoStore().listPracticeQuestions(setId);
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("practice_questions")
      .select("*")
      .eq("set_id", setId)
      .order("created_at");
    if (error) dbError("practice.listQuestions", error);
    return data.map(mapPracticeQuestion);
  },

  async getQuestion(id: string): Promise<PracticeQuestion> {
    if (isDemoMode) {
      const question = getDemoStore().getPracticeQuestion(id);
      if (!question) throw new AppError("NOT_FOUND", "No encontramos la pregunta.");
      return question;
    }
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("practice_questions").select("*").eq("id", id).single();
    if (error) throw new AppError("NOT_FOUND", "No encontramos la pregunta.");
    return mapPracticeQuestion(data);
  },

  async addQuestion(question: Omit<PracticeQuestion, "id">): Promise<PracticeQuestion> {
    if (isDemoMode) return getDemoStore().insertPracticeQuestion({ ...question, id: generateId("question") });
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("practice_questions")
      .insert({
        set_id: question.setId,
        kind: question.kind,
        difficulty: question.difficulty,
        prompt: question.prompt,
        options: question.options,
        expected_answer: question.expectedAnswer,
        grading_criteria: question.gradingCriteria,
        explanation: question.explanation,
        common_mistakes: question.commonMistakes,
        source_file_id: question.sourceFileId,
        source_excerpt: question.sourceExcerpt,
      })
      .select("*")
      .single();
    if (error) dbError("practice.addQuestion", error);
    return mapPracticeQuestion(data);
  },

  async listAttemptsByQuestion(userId: string, questionId: string): Promise<PracticeAttempt[]> {
    if (isDemoMode) return getDemoStore().practiceAttempts.list(userId).filter((a) => a.questionId === questionId);
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("practice_attempts")
      .select("*")
      .eq("user_id", userId)
      .eq("question_id", questionId);
    if (error) dbError("practice.listAttemptsByQuestion", error);
    return data.map(mapPracticeAttempt);
  },

  async listAttemptsByQuestions(userId: string, questionIds: string[]): Promise<PracticeAttempt[]> {
    if (questionIds.length === 0) return [];
    if (isDemoMode) return getDemoStore().practiceAttempts.list(userId).filter((a) => questionIds.includes(a.questionId));
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("practice_attempts")
      .select("*")
      .eq("user_id", userId)
      .in("question_id", questionIds);
    if (error) dbError("practice.listAttemptsByQuestions", error);
    return data.map(mapPracticeAttempt);
  },

  async addAttempt(
    userId: string,
    input: Omit<PracticeAttempt, "id" | "userId" | "createdAt">,
  ): Promise<PracticeAttempt> {
    if (isDemoMode) {
      return getDemoStore().practiceAttempts.insert({
        ...input,
        id: generateId("attempt"),
        userId,
        createdAt: new Date().toISOString(),
      });
    }
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("practice_attempts")
      .insert({
        user_id: userId,
        question_id: input.questionId,
        answer_text: input.answerText,
        is_correct: input.isCorrect,
        feedback: input.feedback,
        first_error_hint: input.firstErrorHint,
        attempt_number: input.attemptNumber,
      })
      .select("*")
      .single();
    if (error) dbError("practice.addAttempt", error);
    return mapPracticeAttempt(data);
  },
};
