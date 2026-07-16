import { Wallet } from "lucide-react";

import { requireSessionUser } from "@/lib/auth/session";
import { expensesRepository } from "@/server/repositories/misc-repository";
import { formatDate, todayISODate } from "@/lib/dates";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateExpenseDialog } from "@/features/expenses/create-expense-dialog";

function formatAmount(amount: number, currency: string): string {
  return `${amount.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency}`;
}

export default async function GastosPage() {
  const user = await requireSessionUser();
  const expenses = expensesRepository.list(user.userId);

  const currentMonth = todayISODate().slice(0, 7); // "yyyy-MM"
  const expensesThisMonth = expenses.filter((e) => e.spentAt.startsWith(currentMonth));

  const totalsByCurrency = new Map<string, number>();
  for (const expense of expensesThisMonth) {
    totalsByCurrency.set(expense.currency, (totalsByCurrency.get(expense.currency) ?? 0) + expense.amount);
  }

  return (
    <div>
      <PageHeader
        title="Gastos"
        description="Control de gastos personales."
        actions={<CreateExpenseDialog />}
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
      </div>

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
            <ul className="divide-y divide-border">
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
  );
}
