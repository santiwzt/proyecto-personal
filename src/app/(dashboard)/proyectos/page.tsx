import Link from "next/link";
import { FolderKanban, Lightbulb } from "lucide-react";

import { requireSessionUser } from "@/lib/auth/session";
import { ideasRepository, projectsRepository } from "@/server/repositories/projects-repository";
import { formatDate, formatDateTime } from "@/lib/dates";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CreateProjectDialog } from "@/features/projects/create-project-dialog";
import { IdeaCaptureForm } from "@/features/projects/idea-capture-form";
import { PROJECT_STATUS_LABELS, TASK_PRIORITY_LABELS } from "@/features/projects/labels";

export default async function ProyectosPage() {
  const user = await requireSessionUser();
  const projects = await projectsRepository.list(user.userId);
  const ideas = await ideasRepository.list(user.userId);

  const sortedProjects = [...projects].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const sortedIdeas = [...ideas].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div>
      <PageHeader
        title="Proyectos"
        description="Trabajos y proyectos en curso, organizados por etapas."
        actions={<CreateProjectDialog />}
      />

      {sortedProjects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="Todavia no tenes proyectos"
          description='Crea tu primer proyecto con el boton "Nuevo proyecto" de arriba.'
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedProjects.map((project) => (
            <Link key={project.id} href={`/proyectos/${project.id}`} className="block">
              <Card className="h-full transition-colors hover:border-primary">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{project.name}</CardTitle>
                    <Badge variant="outline">{PROJECT_STATUS_LABELS[project.status]}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="secondary">{TASK_PRIORITY_LABELS[project.priority]}</Badge>
                    {project.targetDate ? <span>Objetivo: {formatDate(`${project.targetDate}T00:00:00-03:00`)}</span> : null}
                  </div>

                  <div className="flex items-center gap-2">
                    <Progress value={project.progress} className="h-2" />
                    <span className="w-10 text-right text-xs text-muted-foreground">{project.progress}%</span>
                  </div>

                  <div className="rounded-md border border-dashed border-border p-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Proximo paso
                    </p>
                    <p className="text-sm">
                      {project.nextStep ?? "Todavia no definiste el proximo paso."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-10">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Lightbulb className="size-5 text-primary" aria-hidden="true" />
          Ideas
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Capturar idea</CardTitle>
            </CardHeader>
            <CardContent>
              <IdeaCaptureForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ideas guardadas</CardTitle>
            </CardHeader>
            <CardContent>
              {sortedIdeas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Todavia no guardaste ninguna idea.</p>
              ) : (
                <ul className="space-y-3">
                  {sortedIdeas.map((idea) => (
                    <li key={idea.id} className="space-y-1 border-b border-border pb-3 last:border-0 last:pb-0">
                      <p className="text-sm">{idea.content}</p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {idea.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px]">
                            {tag}
                          </Badge>
                        ))}
                        <span className="text-xs text-muted-foreground">{formatDateTime(idea.createdAt)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
