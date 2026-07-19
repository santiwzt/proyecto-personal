"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { updatePreferencesAction } from "@/server/actions/misc-actions";

export function BudgetForm({ monthlyBudgetArs }: { monthlyBudgetArs: number | null }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const [value, setValue] = React.useState(monthlyBudgetArs?.toString() ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = value.trim().length > 0 ? Number(value) : null;
    if (parsed !== null && (!Number.isFinite(parsed) || parsed < 0)) return;
    startTransition(async () => {
      try {
        await updatePreferencesAction({ monthlyBudgetArs: parsed });
        toast({ title: "Presupuesto actualizado." });
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "No se pudo actualizar el presupuesto",
          description: error instanceof Error ? error.message : undefined,
        });
      }
    });
  }

  return (
    <form className="flex items-end gap-3" onSubmit={handleSubmit}>
      <div className="space-y-1.5">
        <Label htmlFor="monthly-budget">Presupuesto mensual (ARS)</Label>
        <Input
          id="monthly-budget"
          type="number"
          min={0}
          step="0.01"
          placeholder="Sin definir"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-40"
        />
      </div>
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
        Guardar
      </Button>
    </form>
  );
}
