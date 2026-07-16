"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Root error boundary. Never renders the raw error message/stack — that
 * could leak internal detail (see src/lib/errors/app-error.ts). Only logs
 * it (client-side console, not sent anywhere) and offers a safe retry.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Unhandled client error:", error);
  }, [error]);

  return (
    <html lang="es">
      <body>
        <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-6" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-semibold">Ocurrio un error inesperado</h1>
            <p className="text-sm text-muted-foreground">
              Intenta de nuevo. Si el problema persiste, volve a cargar la pagina.
            </p>
          </div>
          <Button type="button" onClick={reset}>
            Reintentar
          </Button>
        </main>
      </body>
    </html>
  );
}
