import { AnimatePresence, motion } from "framer-motion";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useState } from "react";
import { ROUTES, type Route } from "@/state/router";
import { useTheme } from "@/state/theme";
import { cn } from "@/lib/format";
import { VersionSwitch } from "./VersionSwitch";

export function Logo() {
  return (
    <a href="#/inicio" className="flex items-center gap-2.5" aria-label="Instagram Reimaginado, inicio">
      <span className="relative block size-7">
        <span className="absolute left-0 top-0 size-5 rounded-[7px] bg-ig-gradient" />
        <span className="absolute bottom-0 right-0 grid size-5 place-items-center rounded-[7px] bg-[#2F6E5E] ring-2 ring-bg">
          <span className="size-2 rounded-full border-[1.5px] border-white" />
        </span>
      </span>
      <span className="text-[15px] font-semibold tracking-tight">
        Instagram <span className="display text-[18px] italic text-ink-2">Reimaginado</span>
      </span>
    </a>
  );
}

export function TopBar({ route }: { route: Route }) {
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  // El interruptor solo aparece donde cambia algo (inicio y simulador).
  const hideSwitch = route !== "inicio" && route !== "simulador";

  return (
    <header className="sticky top-0 z-50 border-b border-line/[0.06] bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="ml-6 hidden items-center gap-1 lg:flex" aria-label="Secciones">
          {ROUTES.map((r) => (
            <a
              key={r.id}
              href={`#/${r.id}`}
              aria-current={route === r.id ? "page" : undefined}
              className={cn("relative rounded-full px-3 py-1.5 text-[13.5px] font-medium transition-colors", route === r.id ? "text-ink" : "text-ink-2 hover:text-ink")}
            >
              {route === r.id && <motion.span layoutId="nav-pill" className="absolute inset-0 -z-10 rounded-full bg-surface-2" transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
              {r.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {!hideSwitch && (
            <div className="hidden md:block">
              <VersionSwitch compact />
            </div>
          )}
          <button type="button" onClick={toggle} aria-label={theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"} className="grid size-9 place-items-center rounded-full border border-line/10 bg-surface hover:bg-surface-2">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={theme} initial={{ rotate: -60, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 60, opacity: 0 }} transition={{ duration: 0.18 }}>
                {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </motion.span>
            </AnimatePresence>
          </button>
          <button type="button" onClick={() => setOpen((o) => !o)} aria-label="Abrir menú" aria-expanded={open} className="grid size-9 place-items-center rounded-full border border-line/10 bg-surface lg:hidden">
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>
      {!hideSwitch && (
        <div className="flex justify-center pb-3 md:hidden">
          <VersionSwitch compact />
        </div>
      )}
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-line/[0.06] lg:hidden"
            aria-label="Secciones"
          >
            <div className="mx-auto grid max-w-7xl gap-1 px-4 py-3">
              {ROUTES.map((r) => (
                <a key={r.id} href={`#/${r.id}`} onClick={() => setOpen(false)} className={cn("rounded-xl px-3 py-2.5 text-[15px] font-medium", route === r.id ? "bg-surface-2" : "text-ink-2")}>
                  {r.label}
                </a>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
