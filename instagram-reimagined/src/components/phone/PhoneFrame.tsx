import type { ReactNode } from "react";
import { cn } from "@/lib/format";

interface Props {
  children: ReactNode;
  className?: string;
  /** Etiqueta que se muestra arriba del teléfono (comparación). */
  label?: ReactNode;
  /** Ancho fijo (CSS). Por defecto se adapta a la ventana. */
  width?: string;
}

/** Marco de teléfono. El tamaño se adapta a la altura de la ventana. */
export function PhoneFrame({ children, className, label, width }: Props) {
  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      {label}
      <div
        className="relative rounded-[54px] bg-[#0d0d0f] p-[11px] shadow-phone ring-1 ring-black/10 dark:ring-white/10"
        style={{ width: width ?? "min(380px, 92vw, calc((100dvh - 110px) * 0.468))", aspectRatio: "9 / 19.2" }}
      >
        <div className="pointer-events-none absolute -left-[3px] top-[120px] h-8 w-[3px] rounded-l bg-[#1b1b1e]" />
        <div className="pointer-events-none absolute -left-[3px] top-[170px] h-14 w-[3px] rounded-l bg-[#1b1b1e]" />
        <div className="pointer-events-none absolute -right-[3px] top-[150px] h-20 w-[3px] rounded-r bg-[#1b1b1e]" />
        <div className="relative h-full w-full overflow-hidden rounded-[44px] bg-surface">
          <div className="pointer-events-none absolute left-1/2 top-[9px] z-50 h-[26px] w-[92px] -translate-x-1/2 rounded-full bg-black" />
          {children}
        </div>
      </div>
    </div>
  );
}

export function StatusBar({ dark }: { dark?: boolean }) {
  return (
    <div className={cn("flex h-11 shrink-0 items-end justify-between px-7 pb-1.5 text-[13px] font-semibold", dark ? "text-white" : "text-ink")}>
      <span>9:41</span>
      <span className="flex items-center gap-1.5">
        <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor" aria-hidden="true">
          <rect x="0" y="7" width="3" height="4" rx="1" />
          <rect x="4.5" y="5" width="3" height="6" rx="1" />
          <rect x="9" y="2.5" width="3" height="8.5" rx="1" />
          <rect x="13.5" y="0" width="3" height="11" rx="1" />
        </svg>
        <svg width="24" height="11" viewBox="0 0 24 11" fill="none" aria-hidden="true">
          <rect x="0.5" y="0.5" width="20" height="10" rx="3" stroke="currentColor" opacity="0.4" />
          <rect x="2" y="2" width="15" height="7" rx="1.8" fill="currentColor" />
          <rect x="21.5" y="3.5" width="1.6" height="4" rx="0.8" fill="currentColor" opacity="0.4" />
        </svg>
      </span>
    </div>
  );
}
