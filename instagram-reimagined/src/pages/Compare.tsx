import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { COMPARISON, MECHANISMS, TAB_LABELS } from "@/data/mechanisms";
import { useUsageClock } from "@/state/app-state";
import { cn } from "@/lib/format";
import type { Version } from "@/types";
import { PhoneFrame } from "@/components/phone/PhoneFrame";
import { PhoneApp } from "@/components/phone/PhoneApp";
import type { Tab } from "@/components/phone/phone-context";
import { Segmented } from "@/components/ui/Segmented";

const SCENARIOS: { tab: Tab; example: string }[] = [
  { tab: "inicio", example: "Bajá en los dos feeds: a la izquierda nunca termina; a la derecha, después de 5 publicaciones te pregunta si querés seguir." },
  { tab: "actividad", example: "Mismas 12 notificaciones. Una versión grita \"¡No te lo pierdas!\"; la otra te muestra primero a quien te escribió." },
  { tab: "reels", example: "Deslizá 5 reels en el teléfono ético: aparece una pausa opcional. En el actual, nada te avisa." },
  { tab: "perfil", example: "Mismo perfil: uno pone los seguidores y la comparación en primer plano, el otro guarda tus métricas en privado." },
  { tab: "explorar", example: "Uno repite lo más viral; el otro te deja elegir temas y te muestra \"Algo distinto\"." },
];

export function ComparePage() {
  useUsageClock();
  const [tab, setTab] = useState<Tab>("inicio");
  const [mobileSide, setMobileSide] = useState<Version>("actual");
  const scenario = SCENARIOS.find((s) => s.tab === tab) ?? SCENARIOS[0]!;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:pt-10">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">Comparación lado a lado</p>
        <h1 className="display mt-1 text-[40px] leading-[1.05] sm:text-[56px]">Misma app, otras reglas</h1>
        <p className="mt-3 text-[15px] text-ink-2 text-pretty">Los dos teléfonos son interactivos y usan el mismo contenido. Lo único que cambia es cómo está diseñada la experiencia.</p>
      </div>

      <div className="no-scrollbar mt-8 flex justify-start overflow-x-auto sm:justify-center">
        <Segmented<Tab> ariaLabel="Escenario" value={tab} onChange={setTab} options={SCENARIOS.map((s) => ({ value: s.tab, label: TAB_LABELS[s.tab] }))} />
      </div>
      <motion.p key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto mt-4 max-w-xl text-center text-[13.5px] text-ink-2 text-pretty">
        <b className="text-ink">Ejemplo concreto:</b> {scenario.example}
      </motion.p>

      <div className="mt-6 flex justify-center lg:hidden">
        <Segmented<Version>
          ariaLabel="Teléfono visible"
          size="sm"
          value={mobileSide}
          onChange={setMobileSide}
          options={[
            { value: "actual", label: "Instagram actual" },
            { value: "etico", label: "Instagram ético" },
          ]}
        />
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-6">
        {(["actual", "etico"] as Version[]).map((v) => (
          <div key={v} className={cn(mobileSide !== v && "hidden lg:block")}>
            <PhoneFrame
              label={
                <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold text-white", v === "actual" ? "bg-ig-gradient" : "bg-[#2F6E5E]")}>
                  {v === "actual" ? <AlertTriangle className="size-3.5" /> : <ShieldCheck className="size-3.5" />}
                  {v === "actual" ? "Instagram actual · antes" : "Instagram ético · después"}
                </span>
              }
            >
              <PhoneApp version={v} initialTab={tab} />
            </PhoneFrame>
            <ul className="mx-auto mt-6 max-w-[400px] space-y-2.5">
              {MECHANISMS[tab][v].map((m) => (
                <li key={m.title} className="flex gap-2.5 text-[13px]">
                  <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", v === "actual" ? "bg-heart" : "bg-calm")} />
                  <span>
                    <b>{m.title}.</b> <span className="text-ink-2">{m.text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <section className="mt-20">
        <h2 className="display text-center text-[34px] sm:text-[42px]">El resumen, en una tabla</h2>
        <div className="card mx-auto mt-8 max-w-4xl overflow-hidden p-0">
          <div className="grid grid-cols-[0.8fr_1fr_auto_1fr] items-center gap-3 border-b border-line/[0.07] bg-surface-2 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-3 sm:px-6">
            <span>Área</span>
            <span>Actual</span>
            <span />
            <span>Ético</span>
          </div>
          {COMPARISON.map((r, i) => (
            <motion.div
              key={r.area}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className="grid grid-cols-[0.8fr_1fr_auto_1fr] items-center gap-3 border-b border-line/[0.05] px-4 py-3.5 text-[13px] last:border-0 sm:px-6"
            >
              <span className="font-semibold">{r.area}</span>
              <span className="text-ink-2">{r.actual}</span>
              <ArrowRight className="size-3.5 text-ink-3" />
              <span>{r.etico}</span>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
