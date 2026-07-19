import { Download, LogOut } from "lucide-react";

import { requireSessionUser } from "@/lib/auth/session";
import { profileRepository, preferencesRepository } from "@/server/repositories/profile-repository";
import { appConfig } from "@/config/app";
import { env, isAiConfigured, isDemoMode } from "@/config/env";
import { endSession } from "@/server/actions/auth-actions";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DeleteAccountButton } from "@/features/settings/delete-account-button";
import { EditProfileForm } from "@/features/settings/edit-profile-form";
import { PreferencesForm } from "@/features/settings/preferences-form";
import { PushNotificationsToggle } from "@/features/settings/push-notifications-toggle";

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
          <CardContent className="space-y-4 text-sm">
            {profile ? (
              <EditProfileForm profile={profile} />
            ) : (
              <p className="text-muted-foreground">No pudimos cargar tu perfil.</p>
            )}
            <div className="flex items-center justify-between border-t border-border pt-3">
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
              El tema claro/oscuro se controla desde el icono de sol/luna en la barra de arriba.
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Notificaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <PushNotificationsToggle vapidPublicKey={env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null} />
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

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Tus datos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Descarga una copia de todo lo que cargaste en la app (materias, tareas, examenes, eventos, archivos,
              proyectos, gastos y mas) en un archivo JSON.
            </p>
            <Button asChild variant="outline" size="sm">
              <a href="/api/export" download>
                <Download className="size-4" aria-hidden="true" /> Exportar mis datos
              </a>
            </Button>

            <div className="space-y-1.5 border-t border-border pt-3">
              <p className="text-sm text-muted-foreground">
                Eliminar tu cuenta borra todos tus datos para siempre. No se puede deshacer.
              </p>
              <DeleteAccountButton />
            </div>
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
