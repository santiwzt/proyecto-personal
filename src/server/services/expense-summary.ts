import type { Expense } from "@/types/domain";

export interface CategoryTotal {
  category: string;
  total: number;
  percentage: number;
}

type ExpenseForSummary = Pick<Expense, "category" | "amount" | "currency" | "spentAt">;

/**
 * Sums expenses by category for a single currency within a "yyyy-MM" month,
 * sorted by total descending. Mixing currencies in one ranked list would be
 * comparing different units, so callers pick one currency (ARS by default,
 * the app's primary currency) and this ignores everything else.
 */
export function summarizeExpensesByCategory(
  expenses: ExpenseForSummary[],
  month: string,
  currency = "ARS",
): CategoryTotal[] {
  const totals = new Map<string, number>();
  for (const expense of expenses) {
    if (!expense.spentAt.startsWith(month) || expense.currency !== currency) continue;
    totals.set(expense.category, (totals.get(expense.category) ?? 0) + expense.amount);
  }

  const grandTotal = Array.from(totals.values()).reduce((sum, value) => sum + value, 0);

  return Array.from(totals.entries())
    .map(([category, total]) => ({
      category,
      total,
      percentage: grandTotal > 0 ? (total / grandTotal) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}
