"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Route-segment error boundary — keeps the sidebar/topbar chrome visible. */
export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Unhandled dashboard error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-destructive/40 px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-6" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">No pudimos cargar esta seccion</p>
        <p className="text-sm text-muted-foreground">Intenta de nuevo en un momento.</p>
      </div>
      <Button type="button" size="sm" onClick={reset}>
        Reintentar
      </Button>
    </div>
  );
}
