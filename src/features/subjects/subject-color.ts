import type { SubjectColor } from "@/types/domain";

/**
 * Static Tailwind class map for each subject color. Keep these as full,
 * literal class names (never string-concatenated) so Tailwind's scanner
 * picks them up at build time.
 */
export const SUBJECT_COLORS: SubjectColor[] = [
  "blue",
  "green",
  "amber",
  "rose",
  "violet",
  "cyan",
  "orange",
  "slate",
];

export const subjectColorClasses: Record<SubjectColor, { dot: string; border: string }> = {
  blue: { dot: "bg-blue-500", border: "border-l-blue-500" },
  green: { dot: "bg-green-500", border: "border-l-green-500" },
  amber: { dot: "bg-amber-500", border: "border-l-amber-500" },
  rose: { dot: "bg-rose-500", border: "border-l-rose-500" },
  violet: { dot: "bg-violet-500", border: "border-l-violet-500" },
  cyan: { dot: "bg-cyan-500", border: "border-l-cyan-500" },
  orange: { dot: "bg-orange-500", border: "border-l-orange-500" },
  slate: { dot: "bg-slate-500", border: "border-l-slate-500" },
};
