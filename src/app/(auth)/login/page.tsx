import { Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { isDemoMode } from "@/config/env";
import { appConfig } from "@/config/app";
import { startDemoSession } from "@/server/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/hoy");

  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles aria-hidden="true" className="size-6" />
          </div>
          <CardTitle className="text-xl">{appConfig.name}</CardTitle>
          <CardDescription>{appConfig.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
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
            <p className="text-center text-sm text-muted-foreground">
              Configura las variables de Supabase en <code>.env.local</code> para habilitar el inicio de
              sesion real. Consulta el README para las instrucciones completas.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
