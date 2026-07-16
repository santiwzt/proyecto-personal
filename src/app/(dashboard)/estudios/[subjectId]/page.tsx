import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, UploadCloud } from "lucide-react";

import { requireSessionUser } from "@/lib/auth/session";
import { isAppError } from "@/lib/errors/app-error";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/dates";
import { examsRepository, subjectsRepository, topicsRepository } from "@/server/repositories/academic-repository";
import { filesRepository } from "@/server/repositories/files-repository";
import { computeExamReadiness } from "@/server/services/exam-readiness";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileRow } from "@/features/files/file-row";
import { ArchiveSubjectDialog } from "@/features/subjects/archive-subject-dialog";
import { subjectColorClasses } from "@/features/subjects/subject-color";
import { CreateTopicDialog } from "@/features/study/create-topic-dialog";
import { TopicRow } from "@/features/study/topic-row";
import { CreateExamDialog } from "@/features/exams/create-exam-dialog";
import { EXAM_IMPORTANCE_LABELS, EXAM_STATUS_LABELS } from "@/features/study/labels";

export default async function SubjectDetailPage({ params }: { params: Promise<{ subjectId: string }> }) {
  const user = await requireSessionUser();
  const { subjectId } = await params;

  let subject;
  try {
    subject = subjectsRepository.get(user.userId, subjectId);
  } catch (error) {
    if (isAppError(error)) notFound();
    throw error;
  }

  const topics = topicsRepository.listBySubject(user.userId, subjectId);
  const exams = examsRepository.listBySubject(user.userId, subjectId);
  const files = filesRepository.listBySubject(user.userId, subjectId);
  const readyFiles = files.filter((f) => f.status === "listo").map((f) => ({ id: f.id, name: f.originalName }));

  return (
    <div>
      <PageHeader
        title={subject.name}
        description={[subject.teacher, subject.course].filter(Boolean).join(" · ") || subject.description || undefined}
        actions={<ArchiveSubjectDialog subjectId={subject.id} subjectName={subject.name} />}
      />

      <div className="mb-4 flex items-center gap-2">
        <span className={cn("size-2.5 rounded-full", subjectColorClasses[subject.color].dot)} aria-hidden="true" />
        <span className="text-sm text-muted-foreground">{subject.description}</span>
      </div>

      <Tabs defaultValue="temas">
        <TabsList>
          <TabsTrigger value="temas">Temas</TabsTrigger>
          <TabsTrigger value="examenes">Examenes</TabsTrigger>
          <TabsTrigger value="archivos">Archivos</TabsTrigger>
        </TabsList>

        <TabsContent value="temas">
          <div className="mb-3 flex justify-end">
            <CreateTopicDialog subjectId={subject.id} />
          </div>
          {topics.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Todavia no tenes temas"
              description='Agrega uno con el boton "Nuevo tema".'
            />
          ) : (
            <div>
              {topics.map((topic) => (
                <TopicRow key={topic.id} topic={topic} files={readyFiles} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="examenes">
          <div className="mb-3 flex justify-end">
            <CreateExamDialog subjectId={subject.id} topics={topics.map((t) => ({ id: t.id, name: t.name }))} />
          </div>
          {exams.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Todavia no tenes examenes"
              description='Agrega uno con el boton "Nuevo examen".'
            />
          ) : (
            <div className="space-y-4">
              {exams.map((exam) => {
                const examTopics = topicsRepository.listByIds(user.userId, exam.topicIds);
                const readiness = computeExamReadiness({ exam, topics: examTopics, attempts: [], relatedTasks: [] });
                return (
                  <div key={exam.id} className="rounded-md border border-border p-4">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">{exam.title}</p>
                        <p className="text-sm text-muted-foreground">{formatDateTime(exam.scheduledAt)}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">Importancia: {EXAM_IMPORTANCE_LABELS[exam.importance]}</Badge>
                        <Badge variant="secondary">{EXAM_STATUS_LABELS[exam.status]}</Badge>
                      </div>
                    </div>

                    <div className="mb-2 flex items-center gap-2">
                      <Progress value={readiness.score} className="h-2" />
                      <span className="w-12 text-right text-sm font-medium">{readiness.score}%</span>
                    </div>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      {readiness.factors.map((factor) => (
                        <li key={factor.key}>
                          <span className="font-medium text-foreground">{factor.label}:</span> {factor.explanation}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="archivos">
          <div className="mb-3 flex justify-end">
            <Button asChild size="sm" variant="outline">
              <Link href="/archivos">
                <UploadCloud aria-hidden="true" /> Subir archivos
              </Link>
            </Button>
          </div>
          {files.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Todavia no hay archivos para esta materia"
              description='Subilos desde la seccion "Archivos".'
            />
          ) : (
            <ul>
              {files.map((file) => (
                <FileRow key={file.id} file={file} subjectName={subject.name} />
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
