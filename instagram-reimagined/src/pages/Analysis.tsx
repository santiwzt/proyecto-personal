import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BadgeCheck, Bell, BrainCircuit, CircleHelp, Heart, Infinity as InfinityIcon, Lightbulb, ShieldAlert, Smile } from "lucide-react";
import { useState, type ComponentType } from "react";
import { CATEGORIES, type CategoryId } from "@/data/analysis";
import { cn } from "@/lib/format";
import { AlgorithmDemo, MetricsDemo, NotificationsDemo, ScrollDemo } from "@/components/analysis/Demos";

export const CATEGORY_ICONS: Record<CategoryId, ComponentType<{ className?: string; strokeWidth?: number }>> = {
  notificaciones: Bell,
  algoritmo: BrainCircuit,
  interfaz: InfinityIcon,
  metricas: Heart,
};

const DEMOS: Record<CategoryId, ComponentType> = {
  notificaciones: NotificationsDemo,
  algoritmo: AlgorithmDemo,
  interfaz: ScrollDemo,
  metricas: MetricsDemo,
};

export function AnalysisPage() {
  const [active, setActive] = useState<CategoryId>("notificaciones");
  const cat = CATEGORIES.find((c) => c.id === active) ?? CATEGORIES[0]!;
  const Demo = DEMOS[cat.id];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-6 sm:px-6 lg:pt-10">
      <div className="max-w-2xl">
        <p className="eyebrow">Análisis ético</p>
        <h1 className="display mt-1 text-[40px] leading-[1.05] sm:text-[56px]">Cuatro mecanismos, explicados</h1>
        <p className="mt-3 text-[15px] text-ink-2 text-pretty">
          Para cada uno: cómo funciona, qué nos hace sentir y qué riesgos éticos tiene. Separamos lo que está comprobado sobre Instagram de los efectos que{" "}
          <i>pueden</i> darse, que dependen de cada persona.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2 text-[12px]">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 font-medium">
          <BadgeCheck className="size-3.5 text-calm" /> Dato comprobado: cómo funciona la app, documentado públicamente
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 font-medium">
          <CircleHelp className="size-3.5 text-amber-500" /> Posible efecto: puede pasar, no le pasa a todo el mundo
        </span>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4" role="tablist" aria-label="Categorías">
        {CATEGORIES.map((c) => {
          const Icon = CATEGORY_ICONS[c.id];
          const on = c.id === active;
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setActive(c.id)}
              className={cn("relative flex flex-col items-start gap-3 rounded-3xl border p-4 text-left transition-colors", on ? "border-transparent text-bg" : "border-line/[0.08] bg-surface hover:bg-surface-2")}
            >
              {on && <motion.span layoutId="cat-bg" className="absolute inset-0 -z-0 rounded-3xl bg-ink" transition={{ type: "spring", stiffness: 380, damping: 34 }} />}
              <Icon className="relative size-5" strokeWidth={1.8} />
              <span className="relative">
                <span className="block text-[15px] font-semibold">{c.title}</span>
                <span className={cn("block text-[12px] leading-snug", on ? "text-bg/70" : "text-ink-3")}>{c.tagline}</span>
              </span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={cat.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }} className="mt-6 grid gap-4 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-3">
            <section className="card p-6">
              <p className="eyebrow">Cómo funciona</p>
              <p className="mt-2 text-[15.5px] leading-relaxed text-pretty">{cat.how}</p>
            </section>

            <section className="card p-6">
              <p className="eyebrow flex items-center gap-1.5">
                <Smile className="size-3.5" /> Qué emociones genera
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {cat.emotions.map((e, i) => (
                  <motion.span key={e} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 * i }} className="rounded-full bg-surface-2 px-3 py-1.5 text-[13px] font-medium">
                    {e}
                  </motion.span>
                ))}
              </div>
            </section>

            <section className="card p-6">
              <p className="eyebrow flex items-center gap-1.5">
                <ShieldAlert className="size-3.5" /> Riesgos éticos
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {cat.risks.map((r) => (
                  <div key={r.title} className="rounded-2xl bg-surface-2 p-4">
                    <p className="text-[14px] font-semibold">{r.title}</p>
                    <p className="mt-1 text-[12.5px] leading-snug text-ink-2">{r.text}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="card p-6">
              <p className="eyebrow">Probalo</p>
              <div className="mt-3">
                <Demo />
              </div>
            </section>
          </div>

          <div className="space-y-4 lg:col-span-2">
            <section className="card p-6">
              <p className="flex items-center gap-1.5 text-[13px] font-semibold">
                <BadgeCheck className="size-4 text-calm" /> Lo comprobado
              </p>
              <ul className="mt-3 space-y-3">
                {cat.facts.map((f) => (
                  <li key={f} className="border-l-2 border-calm/50 pl-3 text-[13px] leading-snug">
                    {f}
                  </li>
                ))}
              </ul>
            </section>
            <section className="card p-6">
              <p className="flex items-center gap-1.5 text-[13px] font-semibold">
                <CircleHelp className="size-4 text-amber-500" /> Posibles efectos
              </p>
              <ul className="mt-3 space-y-3">
                {cat.effects.map((f) => (
                  <li key={f} className="border-l-2 border-amber-500/50 pl-3 text-[13px] leading-snug text-ink-2">
                    {f}
                  </li>
                ))}
              </ul>
            </section>
            <section className="rounded-3xl bg-[#1F4D42] p-6 text-white">
              <p className="flex items-center gap-1.5 text-[13px] font-semibold">
                <Lightbulb className="size-4" /> Nuestra propuesta
              </p>
              <ul className="mt-3 space-y-2">
                {cat.proposal.map((p) => (
                  <li key={p} className="flex gap-2 text-[13.5px]">
                    <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-[#9fe0cb]" /> {p}
                  </li>
                ))}
              </ul>
              <a href="#/comparar" className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#9fe0cb] hover:underline">
                Verlo funcionando <ArrowRight className="size-3.5" />
              </a>
            </section>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
