import { motion } from "framer-motion";
import { Leaf, Smartphone } from "lucide-react";
import { useId } from "react";
import { useApp } from "@/state/app-state";
import { cn } from "@/lib/format";
import type { Version } from "@/types";

const OPTIONS: { value: Version; label: string; short: string; Icon: typeof Leaf }[] = [
  { value: "actual", label: "Instagram actual", short: "Actual", Icon: Smartphone },
  { value: "etico", label: "Instagram ético", short: "Ético", Icon: Leaf },
];

/** Interruptor global antes/después. Cambia funcionalidades reales en toda la app. */
export function VersionSwitch({ compact }: { compact?: boolean }) {
  const { version, setVersion } = useApp();
  const id = useId();
  return (
    <div role="radiogroup" aria-label="Versión de Instagram" className="relative inline-flex rounded-full border border-line/10 bg-surface p-1 shadow-soft">
      {OPTIONS.map(({ value, label, short, Icon }) => {
        const active = version === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setVersion(value)}
            className={cn(
              "relative z-10 flex items-center gap-1.5 rounded-full font-medium transition-colors duration-300",
              compact ? "px-3 py-1.5 text-[12.5px]" : "px-4 py-2 text-[13px]",
              active ? "text-white dark:text-white" : "text-ink-2 hover:text-ink",
            )}
          >
            {active && (
              <motion.span
                layoutId={`version-pill-${id}`}
                className={cn("absolute inset-0 -z-10 rounded-full", value === "actual" ? "bg-ig-gradient" : "bg-[#2F6E5E]")}
                transition={{ type: "spring", stiffness: 420, damping: 36 }}
              />
            )}
            <Icon className="size-3.5" />
            <span className="sm:hidden">{short}</span>
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
