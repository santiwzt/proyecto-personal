import { LogOut } from "lucide-react";

import { requireSessionUser } from "@/lib/auth/session";
import { profileRepository, preferencesRepository } from "@/server/repositories/profile-repository";
import { appConfig } from "@/config/app";
import { isAiConfigured, isDemoMode } from "@/config/env";
import { endSession } from "@/server/actions/auth-actions";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PreferencesForm } from "@/features/settings/preferences-form";

const ROLE_LABELS: Record<string, string> = {
  estudiante_secundario: "Estudiante secundario",
  estudiante_universitario: "Estudiante universitario",
  profesional: "Profesional",
  otro: "Otro",
};

export default async function ConfiguracionPage() {
  const user = await requireSessionUser();
  const profile = await profileRepository.get(user.userId);
  const preferences = await preferencesRepository.get(user.userId);

  return (
    <div>
      <PageHeader title="Configuracion" description="Preferencias de la cuenta y de la aplicacion." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cuenta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Nombre</span>
              <span className="font-medium">{profile?.displayName ?? user.displayName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Rol</span>
              <span>{profile ? ROLE_LABELS[profile.role] ?? profile.role : "Sin definir"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Zona horaria</span>
              <span>{profile?.timeZone ?? appConfig.timeZone}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aplicacion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Zona horaria</span>
              <span>{appConfig.timeZone}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Formato de fecha</span>
              <span>{appConfig.dateFormat}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Modo de datos</span>
              <Badge variant={isDemoMode ? "secondary" : "outline"}>
                {isDemoMode ? "Demo (en memoria)" : "Supabase"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Asistente de IA</span>
              <Badge variant={isAiConfigured ? "default" : "outline"}>
                {isAiConfigured ? "Proveedor configurado" : "Modo heuristico (sin proveedor configurado)"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              El tema claro/oscuro se controla desde el selector en la barra lateral.
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Preferencias</CardTitle>
          </CardHeader>
          <CardContent>
            <PreferencesForm preferences={preferences} />
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />

      <form action={endSession}>
        <Button type="submit" variant="destructive" size="sm">
          <LogOut aria-hidden="true" />
          Cerrar sesion
        </Button>
      </form>
    </div>
  );
}
