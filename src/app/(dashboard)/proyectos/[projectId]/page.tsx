import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { requireSessionUser } from "@/lib/auth/session";
import { projectTasksRepository, projectsRepository } from "@/server/repositories/projects-repository";
import { isAppError } from "@/lib/errors/app-error";
import { formatDate } from "@/lib/dates";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ProjectQuickEdit } from "@/features/projects/project-quick-edit";
import { ProjectTasksChecklist } from "@/features/projects/project-tasks-checklist";
import { DeleteProjectDialog } from "@/features/projects/delete-project-dialog";
import { PROJECT_STATUS_LABELS, TASK_PRIORITY_LABELS } from "@/features/projects/labels";
import type { Project } from "@/types/domain";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const user = await requireSessionUser();

  let project: Project;
  try {
    project = projectsRepository.get(user.userId, projectId);
  } catch (error) {
    if (isAppError(error) && error.code === "NOT_FOUND") notFound();
    throw error;
  }

  const tasks = projectTasksRepository.listByProject(user.userId, projectId);

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link href="/proyectos">
          <ArrowLeft aria-hidden="true" />
          Volver a proyectos
        </Link>
      </Button>

      <PageHeader
        title={project.name}
        description={project.description ?? "Sin descripcion."}
        actions={<DeleteProjectDialog projectId={project.id} projectName={project.name} />}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Detalles</CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectQuickEdit project={project} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informacion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Estado</span>
              <Badge variant="outline">{PROJECT_STATUS_LABELS[project.status]}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Prioridad</span>
              <Badge variant="secondary">{TASK_PRIORITY_LABELS[project.priority]}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Fecha objetivo</span>
              <span>{project.targetDate ? formatDate(`${project.targetDate}T00:00:00-03:00`) : "Sin definir"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Creado</span>
              <span>{formatDate(project.createdAt)}</span>
            </div>

            <Separator />

            <div className="space-y-1.5">
              <p className="text-muted-foreground">Tecnologias</p>
              {project.technologies.length === 0 ? (
                <p className="text-muted-foreground">Sin tecnologias registradas.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {project.technologies.map((tech) => (
                    <Badge key={tech} variant="outline">
                      {tech}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-1.5">
              <p className="text-muted-foreground">Enlaces</p>
              {project.links.length === 0 ? (
                <p className="text-muted-foreground">Sin enlaces registrados.</p>
              ) : (
                <ul className="space-y-1">
                  {project.links.map((link) => (
                    <li key={link.url}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        {link.label}
                        <ExternalLink className="size-3" aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Tareas del proyecto</CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectTasksChecklist projectId={project.id} initialTasks={tasks} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
