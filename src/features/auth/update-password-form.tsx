"use client";

import * as React from "react";
import { unstable_rethrow } from "next/navigation";
import { KeyRound, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { updatePasswordAction } from "@/server/actions/auth-actions";

export function UpdatePasswordForm() {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: "Las contraseñas no coinciden" });
      return;
    }

    startTransition(async () => {
      try {
        const result = await updatePasswordAction({ password });
        if (!result.ok) {
          toast({ variant: "destructive", title: "No pudimos actualizar tu contraseña", description: result.message });
        }
      } catch (error) {
        unstable_rethrow(error);
        toast({ variant: "destructive", title: "No pudimos actualizar tu contraseña" });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="new-password">Nueva contraseña</Label>
        <Input
          id="new-password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Al menos 8 caracteres"
          autoFocus
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm-password">Repeti la contraseña</Label>
        <Input
          id="confirm-password"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <KeyRound aria-hidden="true" />}
        Guardar nueva contraseña
      </Button>
    </form>
  );
}
