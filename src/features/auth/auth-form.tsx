"use client";

import * as React from "react";
import { unstable_rethrow } from "next/navigation";
import { KeyRound, Loader2, LogIn, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { requestPasswordResetAction, signInAction, signUpAction } from "@/server/actions/auth-actions";

export function AuthForm() {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const [confirmationEmail, setConfirmationEmail] = React.useState<string | null>(null);
  const [forgotPassword, setForgotPassword] = React.useState(false);
  const [resetSentTo, setResetSentTo] = React.useState<string | null>(null);

  function handleForgotPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    startTransition(async () => {
      try {
        const result = await requestPasswordResetAction({ email });
        if (!result.ok) {
          toast({ variant: "destructive", title: "No pudimos enviar el mail", description: result.message });
          return;
        }
        setResetSentTo(email);
      } catch (error) {
        unstable_rethrow(error);
        toast({ variant: "destructive", title: "No pudimos enviar el mail" });
      }
    });
  }

  function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    startTransition(async () => {
      try {
        const result = await signInAction({ email, password });
        if (!result.ok) {
          toast({ variant: "destructive", title: "No pudimos iniciar sesion", description: result.message });
        }
      } catch (error) {
        unstable_rethrow(error);
        toast({ variant: "destructive", title: "No pudimos iniciar sesion" });
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
        if (!result.ok) {
          toast({ variant: "destructive", title: "No pudimos crear la cuenta", description: result.message });
          return;
        }
        if (result.requiresEmailConfirmation) {
          setConfirmationEmail(email);
        }
      } catch (error) {
        unstable_rethrow(error);
        toast({ variant: "destructive", title: "No pudimos crear la cuenta" });
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

  if (resetSentTo) {
    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-sm text-foreground">
          Si <strong>{resetSentTo}</strong> tiene una cuenta, te enviamos un mail para restablecer la contraseña.
        </p>
        <p className="text-sm text-muted-foreground">
          Abrilo y toca el enlace para elegir una nueva contraseña.
        </p>
        <Button type="button" variant="link" size="sm" onClick={() => setResetSentTo(null)}>
          Volver
        </Button>
      </div>
    );
  }

  if (forgotPassword) {
    return (
      <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="forgot-email">Email</Label>
          <Input
            id="forgot-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="vos@email.com"
            autoFocus
          />
        </div>
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <KeyRound aria-hidden="true" />}
          Enviar link para restablecer
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setForgotPassword(false)}>
          Volver a iniciar sesion
        </Button>
      </form>
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
          <Button type="button" variant="link" size="sm" onClick={() => setForgotPassword(true)}>
            ¿Olvidaste tu contraseña?
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
