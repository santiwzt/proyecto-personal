import { Skeleton } from "@/components/ui/skeleton";

export interface LoadingListProps {
  /** Number of skeleton rows to render. */
  rows?: number;
}

/** Skeleton placeholder for a list/feed while data is loading. */
export function LoadingList({ rows = 4 }: LoadingListProps) {
  return (
    <div className="space-y-3" role="status" aria-label="Cargando...">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 rounded-lg border border-border p-4">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
