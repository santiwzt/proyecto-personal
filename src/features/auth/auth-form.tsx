"use client";

import * as React from "react";
import { unstable_rethrow } from "next/navigation";
import { Loader2, LogIn, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { signInAction, signUpAction } from "@/server/actions/auth-actions";

export function AuthForm() {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const [confirmationEmail, setConfirmationEmail] = React.useState<string | null>(null);

  function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    startTransition(async () => {
      try {
        await signInAction({ email, password });
      } catch (error) {
        unstable_rethrow(error);
        toast({
          variant: "destructive",
          title: "No pudimos iniciar sesion",
          description: error instanceof Error ? error.message : undefined,
        });
      }
    });
  }

  function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const displayName = String(form.get("displayName") ?? "");
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    startTransition(async () => {
      try {
        const result = await signUpAction({ displayName, email, password });
        if (result.requiresEmailConfirmation) {
          setConfirmationEmail(email);
        }
      } catch (error) {
        unstable_rethrow(error);
        toast({
          variant: "destructive",
          title: "No pudimos crear la cuenta",
          description: error instanceof Error ? error.message : undefined,
        });
      }
    });
  }

  if (confirmationEmail) {
    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-sm text-foreground">
          Te enviamos un email de confirmacion a <strong>{confirmationEmail}</strong>.
        </p>
        <p className="text-sm text-muted-foreground">
          Abrilo y toca el enlace para activar tu cuenta, despues volve aca e inicia sesion.
        </p>
      </div>
    );
  }

  return (
    <Tabs defaultValue="signin" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="signin">Iniciar sesion</TabsTrigger>
        <TabsTrigger value="signup">Crear cuenta</TabsTrigger>
      </TabsList>

      <TabsContent value="signin">
        <form onSubmit={handleSignIn} className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="signin-email">Email</Label>
            <Input id="signin-email" name="email" type="email" required autoComplete="email" placeholder="vos@email.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="signin-password">Contraseña</Label>
            <Input
              id="signin-password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <LogIn aria-hidden="true" />}
            Iniciar sesion
          </Button>
        </form>
      </TabsContent>

      <TabsContent value="signup">
        <form onSubmit={handleSignUp} className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="signup-name">Nombre</Label>
            <Input id="signup-name" name="displayName" required maxLength={60} placeholder="Tu nombre" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="signup-email">Email</Label>
            <Input id="signup-email" name="email" type="email" required autoComplete="email" placeholder="vos@email.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="signup-password">Contraseña</Label>
            <Input
              id="signup-password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Al menos 8 caracteres"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <UserPlus aria-hidden="true" />}
            Crear cuenta
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  );
}
