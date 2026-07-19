import { Wallet } from "lucide-react";

import { requireSessionUser } from "@/lib/auth/session";
import { expensesRepository } from "@/server/repositories/misc-repository";
import { preferencesRepository } from "@/server/repositories/profile-repository";
import { summarizeExpensesByCategory } from "@/server/services/expense-summary";
import { formatDate, todayISODate } from "@/lib/dates";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BudgetForm } from "@/features/expenses/budget-form";
import { CategoryBreakdown } from "@/features/expenses/category-breakdown";
import { CreateExpenseDialog } from "@/features/expenses/create-expense-dialog";

function formatAmount(amount: number, currency: string): string {
  return `${amount.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency}`;
}

export default async function GastosPage() {
  const user = await requireSessionUser();
  const [expenses, preferences] = await Promise.all([
    expensesRepository.list(user.userId),
    preferencesRepository.get(user.userId),
  ]);

  const currentMonth = todayISODate().slice(0, 7); // "yyyy-MM"
  const expensesThisMonth = expenses.filter((e) => e.spentAt.startsWith(currentMonth));
  const existingCategories = Array.from(new Set(expenses.map((e) => e.category)));

  const totalsByCurrency = new Map<string, number>();
  for (const expense of expensesThisMonth) {
    totalsByCurrency.set(expense.currency, (totalsByCurrency.get(expense.currency) ?? 0) + expense.amount);
  }

  const arsTotal = totalsByCurrency.get("ARS") ?? 0;
  const budget = preferences.monthlyBudgetArs;
  const budgetPercentage = budget && budget > 0 ? Math.min(100, (arsTotal / budget) * 100) : 0;
  const overBudget = budget !== null && arsTotal > budget;

  const categoryTotals = summarizeExpensesByCategory(expensesThisMonth, currentMonth, "ARS");

  return (
    <div>
      <PageHeader
        title="Gastos"
        description="Control de gastos personales."
        actions={<CreateExpenseDialog existingCategories={existingCategories} />}
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {totalsByCurrency.size === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Total del mes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Todavia no registraste gastos este mes.</p>
            </CardContent>
          </Card>
        ) : (
          Array.from(totalsByCurrency.entries()).map(([currency, total]) => (
            <Card key={currency}>
              <CardHeader>
                <CardTitle className="text-base">Total del mes ({currency})</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{formatAmount(total, currency)}</p>
                <p className="text-sm text-muted-foreground">
                  {expensesThisMonth.filter((e) => e.currency === currency).length} gastos registrados este mes.
                </p>
              </CardContent>
            </Card>
          ))
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Presupuesto mensual (ARS)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {budget !== null ? (
              <div className="space-y-1.5">
                <Progress value={budgetPercentage} className={overBudget ? "bg-destructive/20" : undefined} />
                <p className={`text-sm ${overBudget ? "font-medium text-destructive" : "text-muted-foreground"}`}>
                  {formatAmount(arsTotal, "ARS")} de {formatAmount(budget, "ARS")}
                  {overBudget ? " · te pasaste del presupuesto" : ""}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Todavia no definiste un presupuesto mensual.</p>
            )}
            <BudgetForm monthlyBudgetArs={budget} />
          </CardContent>
        </Card>
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gasto por categoria (ARS, este mes)</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryBreakdown totals={categoryTotals} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historial</CardTitle>
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <EmptyState
                icon={Wallet}
                title="Todavia no registraste gastos"
                description='Usa el boton "Nuevo gasto" para empezar.'
              />
            ) : (
              <ul className="max-h-[28rem] divide-y divide-border overflow-y-auto">
                {expenses.map((expense) => (
                  <li key={expense.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{expense.category}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(`${expense.spentAt}T00:00:00-03:00`)}
                        </span>
                      </div>
                      {expense.description ? (
                        <p className="mt-1 truncate text-sm text-muted-foreground">{expense.description}</p>
                      ) : null}
                    </div>
                    <span className="shrink-0 font-medium">{formatAmount(expense.amount, expense.currency)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
