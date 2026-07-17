import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, BookOpen, CalendarClock, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { requireSessionUser } from "@/lib/auth/session";
import { profileRepository } from "@/server/repositories/profile-repository";
import {
  examsRepository,
  studySessionsRepository,
  subjectsRepository,
  tasksRepository,
  topicsRepository,
} from "@/server/repositories/academic-repository";
import { availabilityRepository, eventsRepository } from "@/server/repositories/calendar-repository";
import { activityLogRepository } from "@/server/repositories/misc-repository";
import { detectAllConflicts } from "@/server/services/conflict-detection";
import { computeExamReadiness } from "@/server/services/exam-readiness";
import { deriveEffectiveTaskStatus } from "@/server/services/task-status";
import { formatDate, formatDateTime, formatRelativeDay, formatTime, todayISODate } from "@/lib/dates";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";

export default async function HoyPage() {
  const user = await requireSessionUser();
  const profile = await profileRepository.get(user.userId);
  if (!profile?.onboardingCompletedAt) redirect("/onboarding");

  const now = new Date();
  const today = todayISODate(now);

  const subjects = await subjectsRepository.list(user.userId);
  const tasks = await tasksRepository.list(user.userId);
  const exams = await examsRepository.list(user.userId);
  const events = await eventsRepository.list(user.userId);
  const availabilityRules = await availabilityRepository.list(user.userId);
  const studySessions = await studySessionsRepository.list(user.userId);
  const recentActivity = await activityLogRepository.listRecent(user.userId, 5);

  const pendingTasks = tasks
    .filter((t) => deriveEffectiveTaskStatus(t, now) !== "completada")
    .sort((a, b) => (a.dueAt ?? "9999").localeCompare(b.dueAt ?? "9999"));

  const upcomingExams = exams
    .filter((e) => e.status === "programado")
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
    .slice(0, 3);

  const upcomingEvents = events
    .filter((e) => e.startsAt >= now.toISOString())
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  type Commitment = { title: string; at: string };
  const commitments: Commitment[] = [
    ...upcomingExams.map((e) => ({ title: `Examen: ${e.title}`, at: e.scheduledAt })),
    ...upcomingEvents.map((e) => ({ title: e.title, at: e.startsAt })),
  ].sort((a, b) => a.at.localeCompare(b.at));
  const nextCommitment = commitments[0] ?? null;

  const conflicts = detectAllConflicts({ events, availabilityRules, tasks, exams, studySessions });

  const todayAvailability = availabilityRules.filter((r) => r.weekday === now.getDay() && r.kind === "disponible");
  const recommendedMinutes =
    todayAvailability.length > 0
      ? todayAvailability.reduce((sum, r) => {
          const [sh, sm] = r.startTime.split(":").map(Number);
          const [eh, em] = r.endTime.split(":").map(Number);
          return sum + (eh! * 60 + em! - (sh! * 60 + sm!));
        }, 0)
      : 120;

  const completedToday = tasks.filter((t) => t.completedAt?.startsWith(today)).length;
  const dueToday = tasks.filter((t) => t.dueAt?.startsWith(today)).length;
  const dailyProgress = dueToday > 0 ? Math.round((completedToday / dueToday) * 100) : 100;

  const hasAnyData = subjects.length > 0 || tasks.length > 0 || exams.length > 0;

  const upcomingExamsWithReadiness = [];
  for (const exam of upcomingExams) {
    const topics = await topicsRepository.listByIds(user.userId, exam.topicIds);
    const readiness = computeExamReadiness({
      exam,
      topics,
      attempts: [],
      relatedTasks: tasks.filter((t) => t.subjectId === exam.subjectId),
      now,
    });
    upcomingExamsWithReadiness.push({ exam, readiness });
  }

  return (
    <div>
      <PageHeader
        title={`Hola, ${profile.displayName.split(" ")[0]}`}
        description={`Hoy es ${formatDate(now.toISOString())}`}
      />

      {!hasAnyData ? (
        <EmptyState
          icon={Sparkles}
          title="Todavia no tenes nada cargado"
          description='Usa "Captura rapida" arriba para empezar a agregar materias, tareas o examenes.'
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarClock className="size-4 text-primary" aria-hidden="true" />
                Proximo compromiso
              </CardTitle>
            </CardHeader>
            <CardContent>
              {nextCommitment ? (
                <div>
                  <p className="font-medium">{nextCommitment.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatRelativeDay(nextCommitment.at, now)} a las {formatTime(nextCommitment.at)}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No tenes compromisos proximos agendados.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="size-4 text-primary" aria-hidden="true" />
                Tiempo de estudio recomendado hoy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{recommendedMinutes} min</p>
              <p className="text-sm text-muted-foreground">Segun tu disponibilidad configurada para hoy.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tareas importantes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tenes tareas pendientes. ¡Bien ahi!</p>
              ) : (
                pendingTasks.slice(0, 5).map((task) => {
                  const status = deriveEffectiveTaskStatus(task, now);
                  return (
                    <div key={task.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate">{task.title}</span>
                      {status === "vencida" ? (
                        <Badge variant="destructive">Vencida</Badge>
                      ) : task.dueAt ? (
                        <Badge variant="outline">{formatRelativeDay(task.dueAt, now)}</Badge>
                      ) : (
                        <Badge variant="secondary">Sin fecha</Badge>
                      )}
                    </div>
                  );
                })
              )}
              <Button asChild variant="link" size="sm" className="h-auto p-0">
                <Link href="/agenda">Ver toda la agenda</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Examenes cercanos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingExams.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tenes examenes programados.</p>
              ) : (
                upcomingExamsWithReadiness.map(({ exam, readiness }) => {
                  return (
                    <div key={exam.id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{exam.title}</span>
                        <Badge variant="outline">{formatRelativeDay(exam.scheduledAt, now)}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={readiness.score} className="h-2" />
                        <span className="w-10 text-right text-xs text-muted-foreground">{readiness.score}%</span>
                      </div>
                    </div>
                  );
                })
              )}
              <Button asChild variant="link" size="sm" className="h-auto p-0">
                <Link href="/estudios">Ver materias</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Progreso de hoy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Progress value={dailyProgress} className="h-2" />
                <span className="w-10 text-right text-xs text-muted-foreground">{dailyProgress}%</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {completedToday} de {dueToday} tareas de hoy completadas.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="size-4 text-amber-500" aria-hidden="true" />
                Conflictos detectados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {conflicts.length === 0 ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="size-4 text-emerald-500" aria-hidden="true" /> No detectamos conflictos.
                </p>
              ) : (
                conflicts.slice(0, 4).map((c, i) => (
                  <p key={i} className="text-sm">
                    {c.message}
                  </p>
                ))
              )}
              <Button asChild variant="link" size="sm" className="h-auto p-0">
                <Link href="/agenda">Revisar en la agenda</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="size-4 text-primary" aria-hidden="true" />
                Actividad reciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">Todavia no hay actividad registrada.</p>
              ) : (
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {recentActivity.map((entry) => (
                    <li key={entry.id}>
                      {entry.action} {entry.entityType} — {formatDateTime(entry.createdAt)}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
