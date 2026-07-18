import { Repeat } from "lucide-react";

import { requireSessionUser } from "@/lib/auth/session";
import { habitLogsRepository, habitsRepository } from "@/server/repositories/habits-repository";
import { computeHabitStreak, computeHabitWeek } from "@/server/services/habit-tracking";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { CreateHabitDialog } from "@/features/habits/create-habit-dialog";
import { HabitRow } from "@/features/habits/habit-row";

export default async function HabitosPage() {
  const user = await requireSessionUser();
  const now = new Date();
  const [habits, logs] = await Promise.all([
    habitsRepository.list(user.userId),
    habitLogsRepository.listForUser(user.userId),
  ]);

  return (
    <div>
      <PageHeader
        title="Habitos"
        description="Marca cada dia que cumplis un habito y segui tu racha."
        actions={<CreateHabitDialog />}
      />

      {habits.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="Todavia no tenes habitos cargados"
          description='Usa el boton "Nuevo habito" para empezar a hacer seguimiento diario.'
        />
      ) : (
        <Card>
          <CardContent className="p-4">
            <ul className="divide-y divide-border">
              {habits.map((habit) => {
                const week = computeHabitWeek(logs, habit.id, now);
                return (
                  <HabitRow
                    key={habit.id}
                    habit={habit}
                    week={week}
                    streak={computeHabitStreak(logs, habit.id, now)}
                    weekCount={week.filter((d) => d.completed).length}
                  />
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
