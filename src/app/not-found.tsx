import Link from "next/link";

import { appConfig } from "@/config/app";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">No encontramos esta pagina</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        La pagina que buscas no existe o fue movida en {appConfig.name}.
      </p>
      <Button asChild>
        <Link href="/">Volver al inicio</Link>
      </Button>
    </div>
  );
}
