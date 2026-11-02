import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Altura máxima relativa al teléfono. */
  tall?: boolean;
}

/** Hoja inferior que vive DENTRO del teléfono simulado (posición absoluta). */
export function Sheet({ open, onClose, title, children, tall }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label={title}>
          <motion.button
            type="button"
            aria-label="Cerrar"
            className="absolute inset-0 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={`relative flex flex-col rounded-t-[22px] bg-surface shadow-lift ${tall ? "max-h-[88%]" : "max-h-[72%]"}`}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 340 }}
          >
            <div className="mx-auto mt-2 h-1 w-9 rounded-full bg-line/20" />
            <div className="flex items-center justify-between px-4 pb-2 pt-2">
              <h3 className="text-[15px] font-semibold">{title}</h3>
              <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-full hover:bg-surface-2" aria-label="Cerrar">
                <X className="size-4" />
              </button>
            </div>
            <div className="no-scrollbar overflow-y-auto px-4 pb-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
