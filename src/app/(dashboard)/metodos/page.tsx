import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import {
  METHOD_CATEGORY_LABELS,
  STUDY_METHODS,
  type MethodCategory,
} from "@/features/methods/methods-data";
import { cn } from "@/lib/utils";

const CATEGORY_ORDER: MethodCategory[] = ["enfoque", "memoria", "comprension", "organizacion"];

const CATEGORY_BADGE_CLASSES: Record<MethodCategory, string> = {
  enfoque: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  memoria: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
  comprension: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  organizacion: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
};

export default function MetodosPage() {
  return (
    <div>
      <PageHeader
        title="Metodos de estudio"
        description="Tecnicas concretas para enfocarte, recordar mejor y organizar tu forma de estudiar. No dependen de ninguna materia en particular."
      />

      <div className="space-y-8">
        {CATEGORY_ORDER.map((category) => (
          <section key={category}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {METHOD_CATEGORY_LABELS[category]}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {STUDY_METHODS.filter((method) => method.category === category).map((method) => (
                <Card key={method.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{method.name}</CardTitle>
                      <Badge variant="outline" className={cn("border-transparent", CATEGORY_BADGE_CLASSES[category])}>
                        {METHOD_CATEGORY_LABELS[category]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{method.summary}</p>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <div>
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Como hacerlo
                      </p>
                      <ol className="list-decimal space-y-1 pl-4 text-sm">
                        {method.howTo.map((step, index) => (
                          <li key={index}>{step}</li>
                        ))}
                      </ol>
                    </div>
                    <div className="rounded-md bg-muted/50 p-2.5 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Mejor para: </span>
                      {method.bestFor}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
