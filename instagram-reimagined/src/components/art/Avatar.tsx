import type { User } from "@/types";
import { cn } from "@/lib/format";

interface Props {
  user: User;
  size?: number;
  ring?: "story" | "seen" | "none";
  className?: string;
}

/** Avatar generado (iniciales sobre degradado). Sin fotos de personas reales. */
export function Avatar({ user, size = 32, ring = "none", className }: Props) {
  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  const inner = (
    <span
      className="media grid place-items-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        fontSize: Math.max(9, size * 0.36),
        background: `linear-gradient(135deg, hsl(${user.hue} 70% 62%), hsl(${(user.hue + 40) % 360} 65% 42%))`,
      }}
    >
      {initials}
    </span>
  );
  if (ring === "none") return <span className={cn("inline-block shrink-0", className)}>{inner}</span>;
  return (
    <span
      className={cn("inline-grid shrink-0 place-items-center rounded-full p-[2.5px]", ring === "story" ? "ring-story" : "bg-line/15", className)}
    >
      <span className="rounded-full bg-surface p-[2px]">{inner}</span>
    </span>
  );
}
