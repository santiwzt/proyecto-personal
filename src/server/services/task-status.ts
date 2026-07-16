import { parseISO } from "date-fns";
import type { Task, TaskStatus } from "@/types/domain";

/**
 * "vencida" is never written to storage — it's derived at read time from
 * (status, dueAt, now) so it always reflects the current moment, even if
 * nobody opened the app in between.
 */
export function deriveEffectiveTaskStatus(task: Pick<Task, "status" | "dueAt">, now = new Date()): TaskStatus {
  if (task.status === "completada") return "completada";
  if (task.dueAt && parseISO(task.dueAt) < now) return "vencida";
  return task.status;
}
