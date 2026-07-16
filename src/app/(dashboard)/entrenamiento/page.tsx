import { Dumbbell } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export default function EntrenamientoPage() {
  return (
    <div>
      <PageHeader title="Entrenamiento" description="Registro de rutinas y actividad fisica." />

      <EmptyState
        icon={Dumbbell}
        title="Este modulo esta preparado para una proxima version"
        description={
          'El modelo de datos ya contempla sesiones de entrenamiento, pero todavia no tiene una pantalla propia. ' +
          'Mientras tanto, usa la "Captura rapida" para registrar tus entrenamientos como eventos de la agenda, ' +
          'por ejemplo: "Tengo entrenamiento el miercoles de 18 a 20".'
        }
      />
    </div>
  );
}
