import { getDemoStore } from "@/lib/database/demo/store";
import { generateId } from "@/lib/database/demo/ids";
import { AppError } from "@/lib/errors/app-error";
import { isDemoMode } from "@/config/env";
import { createSupabaseServerClient } from "@/lib/database/supabase/server";
import type { ActivityLogEntry, AiUsageRecord, Expense } from "@/types/domain";
import type { ActivityLogTable, AiUsageTable, ExpensesTable } from "@/types/database";

type NewExpense = Omit<Expense, "id" | "userId" | "createdAt">;

function dbError(action: string, error: { message: string }): never {
  console.error(`Supabase error (${action}):`, error.message);
  throw new AppError("INTERNAL", "Ocurrio un error al acceder a la base de datos.");
}

function mapExpense(row: ExpensesTable["Row"]): Expense {
  return {
    id: row.id,
    userId: row.user_id,
    amount: row.amount,
    currency: row.currency,
    category: row.category,
    description: row.description,
    spentAt: row.spent_at,
    createdAt: row.created_at,
  };
}

export const expensesRepository = {
  async list(userId: string): Promise<Expense[]> {
    if (isDemoMode) {
      return getDemoStore()
        .expenses.list(userId)
        .sort((a, b) => b.spentAt.localeCompare(a.spentAt));
    }
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", userId)
      .order("spent_at", { ascending: false });
    if (error) dbError("expenses.list", error);
    return data.map(mapExpense);
  },

  async create(userId: string, input: NewExpense): Promise<Expense> {
    if (isDemoMode) {
      return getDemoStore().expenses.insert({
        ...input,
        id: generateId("expense"),
        userId,
        createdAt: new Date().toISOString(),
      });
    }
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("expenses")
      .insert({
        user_id: userId,
        amount: input.amount,
        currency: input.currency,
        category: input.category,
        description: input.description,
        spent_at: input.spentAt,
      })
      .select("*")
      .single();
    if (error) dbError("expenses.create", error);
    return mapExpense(data);
  },
};

function mapActivityLogEntry(row: ActivityLogTable["Row"]): ActivityLogEntry {
  return {
    id: row.id,
    userId: row.user_id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    createdAt: row.created_at,
  };
}

export const activityLogRepository = {
  async listRecent(userId: string, limit = 10): Promise<ActivityLogEntry[]> {
    if (isDemoMode) {
      return getDemoStore()
        .activityLog.list(userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, limit);
    }
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("activity_log")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) dbError("activityLog.listRecent", error);
    return data.map(mapActivityLogEntry);
  },

  async record(userId: string, action: string, entityType: string, entityId: string): Promise<ActivityLogEntry> {
    if (isDemoMode) {
      return getDemoStore().activityLog.insert({
        id: generateId("activity"),
        userId,
        action,
        entityType,
        entityId,
        createdAt: new Date().toISOString(),
      });
    }
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("activity_log")
      .insert({ user_id: userId, action, entity_type: entityType, entity_id: entityId })
      .select("*")
      .single();
    if (error) dbError("activityLog.record", error);
    return mapActivityLogEntry(data);
  },
};

function mapAiUsageRecord(row: AiUsageTable["Row"]): AiUsageRecord {
  return {
    id: row.id,
    userId: row.user_id,
    feature: row.feature,
    provider: row.provider,
    inputTokens: row.input_tokens,
    outputTokens: row.output_tokens,
    createdAt: row.created_at,
  };
}

export const aiUsageRepository = {
  async countToday(userId: string): Promise<number> {
    const today = new Date().toISOString().slice(0, 10);
    if (isDemoMode) {
      return getDemoStore()
        .aiUsage.list(userId)
        .filter((u) => u.createdAt.startsWith(today)).length;
    }
    const supabase = await createSupabaseServerClient();
    const { count, error } = await supabase
      .from("ai_usage")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", `${today}T00:00:00.000Z`)
      .lt("created_at", `${today}T23:59:59.999Z`);
    if (error) dbError("aiUsage.countToday", error);
    return count ?? 0;
  },

  async record(userId: string, input: Omit<AiUsageRecord, "id" | "userId" | "createdAt">): Promise<AiUsageRecord> {
    if (isDemoMode) {
      return getDemoStore().aiUsage.insert({
        ...input,
        id: generateId("aiusage"),
        userId,
        createdAt: new Date().toISOString(),
      });
    }
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("ai_usage")
      .insert({
        user_id: userId,
        feature: input.feature,
        provider: input.provider,
        input_tokens: input.inputTokens,
        output_tokens: input.outputTokens,
      })
      .select("*")
      .single();
    if (error) dbError("aiUsage.record", error);
    return mapAiUsageRecord(data);
  },
};
