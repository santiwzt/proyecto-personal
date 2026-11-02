import { motion } from "framer-motion";
import { ArrowRight, Bell, Check, Columns2, Eye, Hourglass, Leaf, Lock, Presentation, Scale, Smartphone, Timer } from "lucide-react";
import type { ComponentType } from "react";
import { PhoneFrame } from "@/components/phone/PhoneFrame";
import { PhoneApp } from "@/components/phone/PhoneApp";
import { useApp } from "@/state/app-state";

const fade = (d = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: d, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
});

const inView = (d = 0) => ({
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { delay: d, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
});

const CHANGES: { letter: string; Icon: ComponentType<{ className?: string; strokeWidth?: number }>; title: string; text: string }[] = [
  { letter: "A", Icon: Hourglass, title: "Scroll consciente", text: "El feed llega en bloques y te pregunta si querés seguir o hacer una pausa." },
  { letter: "B", Icon: Bell, title: "Notificaciones inteligentes", text: "Lo importante primero; el resto agrupado, en el horario que elijas." },
  { letter: "C", Icon: Eye, title: "Algoritmo transparente", text: "\"¿Por qué estoy viendo esto?\", feed cronológico y control de intereses." },
  { letter: "D", Icon: Lock, title: "Métricas saludables", text: "Likes ocultos por defecto y métricas privadas para quien publica." },
  { letter: "E", Icon: Leaf, title: "Modo bienestar", text: "Interfaz tranquila, descansos personalizables y tiempo de uso visible." },
  { letter: "F", Icon: Timer, title: "Reels conscientes", text: "Contador, pausas opcionales, límite diario y cierre sin perder guardados." },
];

const PATHS = [
  { href: "#/simulador", Icon: Smartphone, title: "Simulador", text: "Usá las dos versiones como si fueran reales." },
  { href: "#/comparar", Icon: Columns2, title: "Comparar", text: "Dos teléfonos lado a lado, con ejemplos concretos." },
  { href: "#/analisis", Icon: Scale, title: "Análisis ético", text: "Notificaciones, algoritmo, interfaz y métricas." },
  { href: "#/presentacion", Icon: Presentation, title: "Presentación", text: "Cinco diapositivas para exponer en clase." },
];

export function HomePage() {
  const { version } = useApp();
  const front = (v: "actual" | "etico") => (version === v ? { zIndex: 20, opacity: 1, scale: 1 } : { zIndex: 10, opacity: 0.55, scale: 0.94 });
  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-40 top-10 size-[520px] rounded-full bg-ig-gradient opacity-[0.10] blur-3xl" />
          <div className="absolute -right-40 top-40 size-[520px] rounded-full bg-calm opacity-[0.12] blur-3xl" />
        </div>
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-12 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
          <div>
            <motion.p {...fade()} className="inline-flex items-center gap-2 rounded-full border border-line/10 bg-surface px-3 py-1 text-[12px] font-medium text-ink-2 shadow-soft">
              <span className="size-1.5 rounded-full bg-calm" /> Trabajo práctico · Rediseñar una app desde la ética
            </motion.p>
            <motion.h1 {...fade(0.08)} className="display mt-6 text-[50px] leading-[0.98] tracking-tight sm:text-[68px] xl:text-[74px]">
              ¿Y si Instagram estuviera diseñada para que <span className="italic text-calm">estés bien</span>?
            </motion.h1>
            <motion.p {...fade(0.16)} className="mt-6 max-w-xl text-[17px] leading-relaxed text-ink-2 text-pretty">
              Una simulación interactiva que compara el Instagram de hoy con una versión pensada para priorizar tu bienestar en lugar de maximizar el tiempo que pasás conectado.
            </motion.p>
            <motion.div {...fade(0.24)} className="mt-8 flex flex-wrap gap-3">
              <a href="#/simulador" className="btn-primary !px-6 !py-3">
                Probar la simulación <ArrowRight className="size-4" />
              </a>
              <a href="#/comparar" className="btn-ghost !px-6 !py-3">
                Ver antes y después
              </a>
            </motion.div>
            <motion.dl {...fade(0.32)} className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-line/[0.08] pt-6">
              {[
                ["2", "versiones funcionales"],
                ["6", "cambios de diseño"],
                ["4", "mecanismos analizados"],
              ].map(([n, l]) => (
                <div key={l}>
                  <dt className="display text-[40px] leading-none">{n}</dt>
                  <dd className="mt-1 text-[12.5px] leading-snug text-ink-3">{l}</dd>
                </div>
              ))}
            </motion.dl>
          </div>

          <div className="relative mx-auto h-[600px] w-full max-w-[540px]">
            <motion.div
              initial={{ opacity: 0, x: 40, rotate: 0 }}
              animate={{ x: 0, rotate: -6, ...front("actual") }}
              transition={{ delay: 0.2, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className={`absolute top-10 ${version === "actual" ? "left-0 right-0 mx-auto w-fit" : "hidden"} sm:right-auto sm:left-0 sm:mx-0 sm:block`}
              aria-hidden="true"
              inert
            >
              <PhoneFrame
                width="250px"
                label={<span className="rounded-full bg-ig-gradient px-3 py-1 text-[12px] font-semibold text-white">Actual</span>}
              >
                <PhoneApp version="actual" quiet />
              </PhoneFrame>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -40, rotate: 0 }}
              animate={{ x: 0, rotate: 4, ...front("etico") }}
              transition={{ delay: 0.3, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className={`absolute top-0 ${version === "etico" ? "left-0 right-0 mx-auto w-fit" : "hidden"} sm:left-auto sm:right-0 sm:mx-0 sm:block`}
              aria-hidden="true"
              inert
            >
              <PhoneFrame width="262px" label={<span className="rounded-full bg-[#2F6E5E] px-3 py-1 text-[12px] font-semibold text-white">Ético</span>}>
                <PhoneApp version="etico" quiet />
              </PhoneFrame>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pregunta */}
      <section className="border-y border-line/[0.06] bg-surface">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
          <motion.p {...inView()} className="eyebrow">
            La pregunta del trabajo
          </motion.p>
          <motion.p {...inView(0.05)} className="display mt-4 text-[36px] leading-[1.1] sm:text-[52px] text-balance">
            Las apps no son neutras: cada botón, número y aviso fue diseñado para que hagamos algo.
          </motion.p>
          <motion.p {...inView(0.1)} className="mx-auto mt-5 max-w-2xl text-[16px] text-ink-2 text-pretty">
            Instagram ya tiene algunas herramientas de bienestar, como el límite de tiempo, "Tomate un descanso" u ocultar likes. Pero están escondidas en la configuración.
            Nuestra propuesta es darles <b className="text-ink">protagonismo</b>: que lo saludable sea lo que viene por defecto.
          </motion.p>
        </div>
      </section>

      {/* Seis cambios */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Instagram ético</p>
            <h2 className="display mt-1 text-[40px] leading-tight sm:text-[52px]">Seis cambios concretos</h2>
          </div>
          <a href="#/simulador" className="btn-ghost">
            Probarlos en el simulador <ArrowRight className="size-4" />
          </a>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CHANGES.map(({ letter, Icon, title, text }, i) => (
            <motion.div key={letter} {...inView(i * 0.05)} className="card group p-6 transition-shadow hover:shadow-lift">
              <div className="flex items-center justify-between">
                <span className="grid size-11 place-items-center rounded-2xl bg-calm-soft text-calm">
                  <Icon className="size-5" strokeWidth={1.8} />
                </span>
                <span className="display text-[34px] leading-none text-ink-3/60">{letter}</span>
              </div>
              <h3 className="mt-6 text-[18px] font-semibold tracking-tight">{title}</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink-2">{text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recorrido */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <p className="eyebrow">Cómo recorrer el proyecto</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PATHS.map(({ href, Icon, title, text }, i) => (
            <motion.a key={href} href={href} {...inView(i * 0.05)} className="group flex flex-col rounded-3xl border border-line/[0.08] p-6 transition-colors hover:bg-surface">
              <span className="text-[12px] tabular-nums text-ink-3">0{i + 1}</span>
              <Icon className="mt-6 size-6" strokeWidth={1.6} />
              <span className="mt-4 flex items-center gap-1.5 text-[17px] font-semibold">
                {title} <ArrowRight className="size-4 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
              </span>
              <span className="mt-1 text-[13.5px] text-ink-2">{text}</span>
            </motion.a>
          ))}
        </div>
      </section>

      {/* Coherencia */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <div className="relative overflow-hidden rounded-[36px] bg-[#16302A] px-6 py-14 text-white sm:px-14">
          <div className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-[#7CC4AE] opacity-20 blur-3xl" />
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-white/60">Coherencia</p>
          <h2 className="display mt-2 max-w-2xl text-[36px] leading-tight sm:text-[48px]">Este sitio sigue las mismas reglas que proponemos</h2>
          <div className="mt-8 grid gap-x-10 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {["Sin popups que te frenen", "Sin contadores de urgencia", "Sin rachas ni recompensas", "Sin notificaciones engañosas", "Sin videos con sonido automático", "Respeta \"reducir movimiento\" del sistema"].map((t) => (
              <p key={t} className="flex items-center gap-2.5 text-[15px] text-white/90">
                <span className="grid size-5 place-items-center rounded-full bg-[#7CC4AE] text-[#16302A]">
                  <Check className="size-3" strokeWidth={3} />
                </span>
                {t}
              </p>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
