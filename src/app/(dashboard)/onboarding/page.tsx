import { redirect } from "next/navigation";
import { requireSessionUser } from "@/lib/auth/session";
import { appConfig } from "@/config/app";
import { profileRepository } from "@/server/repositories/profile-repository";
import { completeOnboarding } from "@/server/actions/onboarding-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function OnboardingPage() {
  const user = await requireSessionUser();
  const profile = profileRepository.get(user.userId);
  if (profile?.onboardingCompletedAt) redirect("/hoy");

  return (
    <div className="mx-auto max-w-lg py-8">
      <Card>
        <CardHeader>
          <CardTitle>Antes de empezar</CardTitle>
          <CardDescription>
            Contanos un poco sobre vos para adaptar {appConfig.shortName} a tu situacion.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={completeOnboarding} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="displayName">¿Como te llamas?</Label>
              <Input
                id="displayName"
                name="displayName"
                required
                maxLength={60}
                defaultValue={user.displayName}
                placeholder="Tu nombre"
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="role">¿Cual es tu situacion?</Label>
              <select
                id="role"
                name="role"
                defaultValue="estudiante_secundario"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="estudiante_secundario">Estudiante secundario</option>
                <option value="estudiante_universitario">Estudiante universitario</option>
                <option value="profesional">Profesional</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <dl className="grid grid-cols-2 gap-3 rounded-md bg-muted/50 p-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Zona horaria</dt>
                <dd className="font-medium">{appConfig.timeZone}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Formato de fecha</dt>
                <dd className="font-medium">DD/MM/AAAA</dd>
              </div>
            </dl>

            <Button type="submit" className="w-full">
              Comenzar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
