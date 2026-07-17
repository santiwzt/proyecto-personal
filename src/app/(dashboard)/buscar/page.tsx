import Link from "next/link";
import { BookOpen, CalendarClock, FileText, FolderKanban, ListTodo, SearchX } from "lucide-react";
import { requireSessionUser } from "@/lib/auth/session";
import { subjectsRepository, examsRepository, tasksRepository } from "@/server/repositories/academic-repository";
import { projectsRepository } from "@/server/repositories/projects-repository";
import { filesRepository } from "@/server/repositories/files-repository";
import { searchAll, type SearchResultType } from "@/server/services/search";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";

const ICONS: Record<SearchResultType, typeof BookOpen> = {
  subject: BookOpen,
  task: ListTodo,
  exam: CalendarClock,
  project: FolderKanban,
  file: FileText,
};

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireSessionUser();
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const results = query
    ? searchAll({
        query,
        subjects: await subjectsRepository.list(user.userId),
        tasks: await tasksRepository.list(user.userId),
        exams: await examsRepository.list(user.userId),
        projects: await projectsRepository.list(user.userId),
        files: await filesRepository.list(user.userId),
      })
    : [];

  return (
    <div>
      <PageHeader
        title="Buscar"
        description={query ? `Resultados para "${query}"` : "Escribi algo en la barra de arriba para buscar."}
      />

      {query && results.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Sin resultados"
          description={`No encontramos nada que coincida con "${query}".`}
        />
      ) : (
        <div className="space-y-2">
          {results.map((result) => {
            const Icon = ICONS[result.type];
            return (
              <Link key={`${result.type}-${result.id}`} href={result.href} className="block">
                <Card className="transition-colors hover:border-primary">
                  <CardContent className="flex items-center gap-3 p-4">
                    <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{result.title}</p>
                      {result.subtitle && <p className="text-sm text-muted-foreground">{result.subtitle}</p>}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
