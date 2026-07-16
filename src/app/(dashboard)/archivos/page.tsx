import { FileText } from "lucide-react";
import { requireSessionUser } from "@/lib/auth/session";
import { env } from "@/config/env";
import { filesRepository } from "@/server/repositories/files-repository";
import { subjectsRepository } from "@/server/repositories/academic-repository";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadFileForm } from "@/features/files/upload-file-form";
import { FileRow } from "@/features/files/file-row";

export default async function ArchivosPage() {
  const user = await requireSessionUser();
  const files = filesRepository.list(user.userId);
  const subjects = subjectsRepository.list(user.userId);
  const subjectNameById = new Map(subjects.map((s) => [s.id, s.name]));

  return (
    <div>
      <PageHeader
        title="Archivos"
        description="Subi tu material de estudio para poder consultarlo con el asistente y generar preguntas de practica."
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Subir material</CardTitle>
        </CardHeader>
        <CardContent>
          <UploadFileForm subjects={subjects.map((s) => ({ id: s.id, name: s.name }))} maxSizeMb={env.MAX_UPLOAD_SIZE_MB} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tus archivos</CardTitle>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <EmptyState icon={FileText} title="Todavia no subiste archivos" description="Subi un PDF, DOCX, TXT o Markdown para empezar." />
          ) : (
            <ul>
              {files.map((file) => (
                <FileRow key={file.id} file={file} subjectName={file.subjectId ? (subjectNameById.get(file.subjectId) ?? null) : null} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
