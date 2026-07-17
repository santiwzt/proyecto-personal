import Link from "next/link";
import { ArrowRight, BookOpen, Calendar, FileText, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

interface ChecklistStep {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  cta: string;
}

const STEPS: ChecklistStep[] = [
  {
    icon: BookOpen,
    title: "Cargá tu primera materia",
    description: "El punto de partida: sin materias, Nexo todavia no tiene nada para organizar.",
    href: "/estudios",
    cta: "Ir a Estudios",
  },
  {
    icon: Sparkles,
    title: "Anotá una tarea o examen",
    description: 'Usá "Captura rapida" (arriba a la derecha) para cargar algo en segundos, sin formularios largos.',
    href: "/agenda",
    cta: "Ir a Agenda",
  },
  {
    icon: Calendar,
    title: "Generá tu plan semanal",
    description: "Con tus materias, tareas y horarios cargados, Nexo arma una propuesta de estudio para la semana.",
    href: "/agenda",
    cta: "Ir a Agenda",
  },
  {
    icon: FileText,
    title: "Subí un apunte",
    description: "Subí un PDF o Word de alguna materia y probá preguntarle al asistente sobre ese material.",
    href: "/archivos",
    cta: "Ir a Archivos",
  },
];

/** Shown on "Hoy" the first time a real account has no data yet -- a concrete first-run path instead of a bare empty state. */
export function GettingStartedChecklist() {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">Recien empezás — estos son los primeros pasos</p>
        <p className="text-sm text-muted-foreground">No hace falta seguir un orden estricto, pero por algo hay que arrancar.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {STEPS.map((step) => (
          <Card key={step.title}>
            <CardContent className="flex flex-col gap-2 p-4">
              <step.icon className="size-5 text-primary" aria-hidden="true" />
              <p className="text-sm font-medium text-foreground">{step.title}</p>
              <p className="flex-1 text-sm text-muted-foreground">{step.description}</p>
              <Link
                href={step.href}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                {step.cta}
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
