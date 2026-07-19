import Link from "next/link";
import { Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { isDemoMode } from "@/config/env";
import { appConfig } from "@/config/app";
import { startDemoSession } from "@/server/actions/auth-actions";
import { AuthForm } from "@/features/auth/auth-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getSessionUser();
  if (user) redirect("/hoy");
  const { error } = await searchParams;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles aria-hidden="true" className="size-6" />
          </div>
          <CardTitle className="font-display text-xl">{appConfig.name}</CardTitle>
          <CardDescription>{appConfig.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error === "confirmacion_invalida" && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-center text-sm text-destructive">
              El link de confirmacion no es valido o ya vencio. Proba crear la cuenta de nuevo o pedir otro email.
            </p>
          )}
          {isDemoMode ? (
            <>
              <Badge variant="secondary" className="mx-auto">
                Modo demo
              </Badge>
              <p className="text-center text-sm text-muted-foreground">
                Esta version corre con datos de ejemplo en memoria, sin necesitar credenciales. Podes
                recorrer toda la aplicacion libremente.
              </p>
              <form action={startDemoSession}>
                <Button type="submit" className="w-full">
                  Continuar en modo demo
                </Button>
              </form>
            </>
          ) : (
            <AuthForm />
          )}
        </CardContent>
      </Card>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Al continuar aceptas los{" "}
        <Link href="/terminos" className="underline">
          terminos de uso
        </Link>{" "}
        y la{" "}
        <Link href="/privacidad" className="underline">
          politica de privacidad
        </Link>
        .
      </p>
    </main>
  );
}
