import { motion } from "framer-motion";
import { cn } from "@/lib/format";

interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  className?: string;
}

export function Toggle({ checked, onChange, label, description, className }: Props) {
  return (
    <label className={cn("flex cursor-pointer items-start justify-between gap-4 py-2.5", className)}>
      <span className="min-w-0">
        <span className="block text-[13px] font-medium leading-snug">{label}</span>
        {description && <span className="mt-0.5 block text-[11.5px] leading-snug text-ink-2">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn("relative mt-0.5 h-[22px] w-[38px] shrink-0 rounded-full transition-colors", checked ? "bg-calm" : "bg-line/15")}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 600, damping: 34 }}
          className={cn("absolute top-[2px] size-[18px] rounded-full bg-white shadow", checked ? "right-[2px]" : "left-[2px]")}
        />
      </button>
    </label>
  );
}
