import { Target } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { CreateGoalDialog } from "@/features/goals/create-goal-dialog";
import { GoalRow } from "@/features/goals/goal-row";
import { requireSessionUser } from "@/lib/auth/session";
import { goalsRepository } from "@/server/repositories/goals-repository";

export default async function ObjetivosPage() {
  const user = await requireSessionUser();
  const goals = await goalsRepository.list(user.userId);

  return (
    <div>
      <PageHeader
        title="Objetivos"
        description="Metas de mediano y largo plazo, con seguimiento de progreso."
        actions={<CreateGoalDialog />}
      />

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Todavia no tenes objetivos cargados"
          description='Usa el boton "Nuevo objetivo" para definir una meta y su fecha limite.'
        />
      ) : (
        <Card>
          <CardContent className="p-4">
            <ul className="divide-y divide-border">
              {goals.map((goal) => (
                <GoalRow key={goal.id} goal={goal} />
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
