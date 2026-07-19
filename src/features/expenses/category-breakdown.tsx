import type { CategoryTotal } from "@/server/services/expense-summary";

function formatAmount(amount: number): string {
  return amount.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function CategoryBreakdown({ totals, currency = "ARS" }: { totals: CategoryTotal[]; currency?: string }) {
  if (totals.length === 0) {
    return <p className="text-sm text-muted-foreground">Todavia no registraste gastos en {currency} este mes.</p>;
  }

  const max = totals[0]!.total;

  return (
    <ul className="space-y-3">
      {totals.map((entry) => (
        <li key={entry.category}>
          <div className="mb-1 flex items-center justify-between gap-2 text-sm">
            <span className="font-medium">{entry.category}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {formatAmount(entry.total)} {currency} · {entry.percentage.toFixed(0)}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${max > 0 ? (entry.total / max) * 100 : 0}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
