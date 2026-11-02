import { motion } from "framer-motion";
import { useId } from "react";
import { cn } from "@/lib/format";

interface Option<T extends string | number> {
  value: T;
  label: string;
}

interface Props<T extends string | number> {
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
  size?: "sm" | "md";
  className?: string;
  ariaLabel: string;
}

export function Segmented<T extends string | number>({ value, options, onChange, size = "md", className, ariaLabel }: Props<T>) {
  const id = useId();
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn("relative inline-flex rounded-full bg-surface-2 p-0.5", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative z-10 flex-1 whitespace-nowrap rounded-full font-medium transition-colors",
              size === "sm" ? "px-2.5 py-1 text-[11.5px]" : "px-3.5 py-1.5 text-[13px]",
              active ? "text-ink" : "text-ink-2 hover:text-ink",
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 -z-10 rounded-full bg-surface shadow-soft"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
