"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { todayISODate } from "@/lib/dates";
import { createExpenseAction } from "@/server/actions/misc-actions";

const DEFAULT_CATEGORIES = ["Comida", "Transporte", "Salidas", "Estudio", "Salud", "Ropa", "Otro"];

export function CreateExpenseDialog({ existingCategories = [] }: { existingCategories?: string[] }) {
  const categoryOptions = Array.from(new Set([...DEFAULT_CATEGORIES, ...existingCategories])).sort((a, b) =>
    a.localeCompare(b),
  );
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const [amount, setAmount] = React.useState("");
  const [currency, setCurrency] = React.useState("ARS");
  const [category, setCategory] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [spentAt, setSpentAt] = React.useState(todayISODate());

  function reset() {
    setAmount("");
    setCurrency("ARS");
    setCategory("");
    setDescription("");
    setSpentAt(todayISODate());
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || category.trim().length === 0) return;
    startTransition(async () => {
      try {
        await createExpenseAction({
          amount: parsedAmount,
          currency: currency.trim().length > 0 ? currency.trim() : "ARS",
          category: category.trim(),
          description: description.trim().length > 0 ? description.trim() : null,
          spentAt,
        });
        toast({ title: "Gasto registrado." });
        reset();
        setOpen(false);
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "No se pudo registrar el gasto",
          description: error instanceof Error ? error.message : undefined,
        });
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button type="button">
          <Plus aria-hidden="true" />
          Nuevo gasto
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo gasto</DialogTitle>
          <DialogDescription>Registra un gasto puntual para llevar un control simple.</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="expense-amount">Monto</Label>
              <Input
                id="expense-amount"
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expense-currency">Moneda</Label>
              <Input
                id="expense-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                maxLength={10}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="expense-category">Categoria</Label>
            <Input
              id="expense-category"
              list="expense-category-options"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Comida, transporte, salidas..."
              required
              maxLength={80}
            />
            <datalist id="expense-category-options">
              {categoryOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="expense-description">Descripcion (opcional)</Label>
            <Input
              id="expense-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={300}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="expense-date">Fecha</Label>
            <Input
              id="expense-date"
              type="date"
              value={spentAt}
              onChange={(e) => setSpentAt(e.target.value)}
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={isPending || amount.trim().length === 0 || category.trim().length === 0}
            >
              {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
              Registrar gasto
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
