import Link from "next/link";
import { BookOpen } from "lucide-react";
import { requireSessionUser } from "@/lib/auth/session";
import { subjectsRepository, topicsRepository, examsRepository } from "@/server/repositories/academic-repository";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateSubjectDialog } from "@/features/subjects/create-subject-dialog";
import { subjectColorClasses } from "@/features/subjects/subject-color";
import { formatRelativeDay } from "@/lib/dates";
import { cn } from "@/lib/utils";

export default async function EstudiosPage() {
  const user = await requireSessionUser();
  const subjects = await subjectsRepository.list(user.userId);

  const cards = [];
  for (const subject of subjects) {
    const topics = await topicsRepository.listBySubject(user.userId, subject.id);
    const masteredCount = topics.filter((t) => t.status === "dominado" || t.status === "practicando").length;
    const masteryPct = topics.length > 0 ? Math.round((masteredCount / topics.length) * 100) : 0;
    const upcomingExam = (await examsRepository.listBySubject(user.userId, subject.id))
      .filter((e) => e.status === "programado")
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))[0];

    cards.push({ subject, topicsCount: topics.length, masteryPct, upcomingExam });
  }

  return (
    <div>
      <PageHeader
        title="Estudios"
        description="Materias, temas y preparacion para examenes."
        actions={<CreateSubjectDialog />}
      />

      {subjects.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Todavia no tenes materias"
          description='Crea tu primera materia con el boton "Nueva materia" de arriba.'
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(({ subject, topicsCount, masteryPct, upcomingExam }) => (
            <Link key={subject.id} href={`/estudios/${subject.id}`} className="block">
              <Card className={cn("h-full border-l-4 transition-shadow hover:shadow-md", subjectColorClasses[subject.color].border)}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span className={cn("size-2.5 rounded-full", subjectColorClasses[subject.color].dot)} aria-hidden="true" />
                    {subject.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  {subject.teacher && <p>{subject.teacher}</p>}
                  <p>
                    {topicsCount} tema{topicsCount === 1 ? "" : "s"} · {masteryPct}% en progreso o dominado
                  </p>
                  {upcomingExam ? (
                    <Badge variant="outline">
                      Examen {formatRelativeDay(upcomingExam.scheduledAt)}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Sin examen programado</Badge>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
