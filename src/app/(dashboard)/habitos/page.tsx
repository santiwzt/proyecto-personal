import { Repeat } from "lucide-react";

import { requireSessionUser } from "@/lib/auth/session";
import { habitsRepository } from "@/server/repositories/misc-repository";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function HabitosPage() {
  const user = await requireSessionUser();
  const habits = habitsRepository.list(user.userId);

  return (
    <div>
      <PageHeader title="Habitos" description="Seguimiento diario de tus habitos y rachas." />

      {habits.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="Todavia no tenes habitos cargados"
          description="El seguimiento diario de habitos llega en una proxima version."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tus habitos</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {habits.map((habit) => (
                <li key={habit.id} className="flex items-center justify-between py-3">
                  <span className="font-medium">{habit.name}</span>
                  <Badge variant="outline">{habit.targetPerWeek}x por semana</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <p className="mt-6 text-sm text-muted-foreground">
        El seguimiento diario de habitos (registro de cumplimiento y rachas) llega en una proxima version. Por
        ahora esta seccion solo muestra los habitos definidos.
      </p>
    </div>
  );
}
