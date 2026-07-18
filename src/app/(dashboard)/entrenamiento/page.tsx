import { Dumbbell } from "lucide-react";

import { requireSessionUser } from "@/lib/auth/session";
import { trainingSessionsRepository } from "@/server/repositories/training-repository";
import { formatDateTime, minutesBetween, todayISODate } from "@/lib/dates";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { CreateTrainingDialog } from "@/features/training/create-training-dialog";
import { DeleteTrainingButton } from "@/features/training/delete-training-button";

export default async function EntrenamientoPage() {
  const user = await requireSessionUser();
  const sessions = await trainingSessionsRepository.list(user.userId);

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
  const weekAgoIso = todayISODate(weekAgo);
  const weekMinutes = sessions
    .filter((s) => s.startsAt.slice(0, 10) >= weekAgoIso)
    .reduce((sum, s) => sum + minutesBetween(s.startsAt, s.endsAt), 0);

  return (
    <div>
      <PageHeader
        title="Entrenamiento"
        description="Registro de rutinas y actividad fisica."
        actions={<CreateTrainingDialog />}
      />

      {sessions.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="Todavia no registraste ninguna sesion"
          description='Usa el boton "Nueva sesion" para anotar tus entrenamientos.'
        />
      ) : (
        <div className="space-y-4">
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <span className="text-sm text-muted-foreground">Entrenado en los ultimos 7 dias</span>
              <span className="text-lg font-semibold">
                {Math.floor(weekMinutes / 60)}h {weekMinutes % 60}min
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <ul className="divide-y divide-border">
                {sessions.map((session) => (
                  <li key={session.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{session.activity}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(session.startsAt)} · {minutesBetween(session.startsAt, session.endsAt)} min
                      </p>
                      {session.notes ? (
                        <p className="mt-1 text-sm text-muted-foreground">{session.notes}</p>
                      ) : null}
                    </div>
                    <DeleteTrainingButton id={session.id} activity={session.activity} />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
