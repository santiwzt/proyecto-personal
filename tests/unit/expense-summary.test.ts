import { describe, expect, it } from "vitest";
import { summarizeExpensesByCategory } from "@/server/services/expense-summary";
import type { Expense } from "@/types/domain";

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: "expense-1",
    userId: "user-1",
    amount: 100,
    currency: "ARS",
    category: "Comida",
    description: null,
    spentAt: "2026-07-10",
    createdAt: "2026-07-10T12:00:00-03:00",
    ...overrides,
  };
}

describe("summarizeExpensesByCategory", () => {
  it("sums amounts per category, sorted by total descending", () => {
    const expenses = [
      makeExpense({ id: "1", category: "Comida", amount: 100 }),
      makeExpense({ id: "2", category: "Transporte", amount: 300 }),
      makeExpense({ id: "3", category: "Comida", amount: 50 }),
    ];
    const result = summarizeExpensesByCategory(expenses, "2026-07");
    expect(result).toEqual([
      { category: "Transporte", total: 300, percentage: 300 / 450 * 100 },
      { category: "Comida", total: 150, percentage: 150 / 450 * 100 },
    ]);
  });

  it("ignores expenses outside the requested month", () => {
    const expenses = [
      makeExpense({ id: "1", spentAt: "2026-07-10", amount: 100 }),
      makeExpense({ id: "2", spentAt: "2026-06-30", amount: 500 }),
    ];
    const result = summarizeExpensesByCategory(expenses, "2026-07");
    expect(result).toEqual([{ category: "Comida", total: 100, percentage: 100 }]);
  });

  it("ignores expenses in a different currency than requested", () => {
    const expenses = [
      makeExpense({ id: "1", currency: "ARS", amount: 100 }),
      makeExpense({ id: "2", currency: "USD", amount: 50 }),
    ];
    const result = summarizeExpensesByCategory(expenses, "2026-07", "ARS");
    expect(result).toEqual([{ category: "Comida", total: 100, percentage: 100 }]);
  });

  it("returns an empty array when there is nothing to summarize", () => {
    expect(summarizeExpensesByCategory([], "2026-07")).toEqual([]);
  });
});
