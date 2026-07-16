import { getDemoStore } from "@/lib/database/demo/store";
import { generateId } from "@/lib/database/demo/ids";
import type { ActivityLogEntry, AiUsageRecord, Expense, Habit } from "@/types/domain";

type NewExpense = Omit<Expense, "id" | "userId" | "createdAt">;

export const expensesRepository = {
  list(userId: string): Expense[] {
    return getDemoStore()
      .expenses.list(userId)
      .sort((a, b) => b.spentAt.localeCompare(a.spentAt));
  },
  create(userId: string, input: NewExpense): Expense {
    return getDemoStore().expenses.insert({
      ...input,
      id: generateId("expense"),
      userId,
      createdAt: new Date().toISOString(),
    });
  },
};

export const habitsRepository = {
  list(userId: string): Habit[] {
    return getDemoStore()
      .habits.list(userId)
      .filter((h) => !h.archivedAt);
  },
};

export const activityLogRepository = {
  listRecent(userId: string, limit = 10): ActivityLogEntry[] {
    return getDemoStore()
      .activityLog.list(userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  },
  record(userId: string, action: string, entityType: string, entityId: string): ActivityLogEntry {
    return getDemoStore().activityLog.insert({
      id: generateId("activity"),
      userId,
      action,
      entityType,
      entityId,
      createdAt: new Date().toISOString(),
    });
  },
};

export const aiUsageRepository = {
  countToday(userId: string): number {
    const today = new Date().toISOString().slice(0, 10);
    return getDemoStore()
      .aiUsage.list(userId)
      .filter((u) => u.createdAt.startsWith(today)).length;
  },
  record(userId: string, input: Omit<AiUsageRecord, "id" | "userId" | "createdAt">): AiUsageRecord {
    return getDemoStore().aiUsage.insert({
      ...input,
      id: generateId("aiusage"),
      userId,
      createdAt: new Date().toISOString(),
    });
  },
};
