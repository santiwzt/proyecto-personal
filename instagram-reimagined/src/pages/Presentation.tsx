import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Hourglass,
  Infinity as InfinityIcon,
  Leaf,
  Lock,
  Maximize,
  Minimize,
  Heart,
  Scale,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { NOTIFICATIONS } from "@/data/notifications";
import { PALETTES } from "@/data/users";
import { cn } from "@/lib/format";
import { SceneArt } from "@/components/art/SceneArt";

const W = 1280;
const H = 720;

const SLIDES: { title: string; render: () => ReactNode }[] = [
  { title: "Introducción", render: () => <SlideIntro /> },
  { title: "Notificaciones y algoritmo", render: () => <SlideNotifAlgo /> },
  { title: "Interfaz y métricas", render: () => <SlideUiMetrics /> },
  { title: "Nuestra propuesta", render: () => <SlideProposal /> },
  { title: "Conclusión", render: () => <SlideConclusion /> },
];

export function PresentationPage() {
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const [full, setFull] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const go = useCallback((n: number) => {
    setI((cur) => {
      const next = Math.max(0, Math.min(SLIDES.length - 1, n));
      setDir(next >= cur ? 1 : -1);
      return next;
    });
  }, []);

  const toggleFull = useCallback(() => {
    if (!document.fullscreenElement) stage.current?.requestFullscreen?.().catch(() => undefined);
    else document.exitFullscreen?.().catch(() => undefined);
  }, []);

  useEffect(() => {
    const on = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (["ArrowRight", "PageDown", " "].includes(e.key)) {
        e.preventDefault();
        setI((cur) => {
          setDir(1);
          return Math.min(SLIDES.length - 1, cur + 1);
        });
      } else if (["ArrowLeft", "PageUp"].includes(e.key)) {
        e.preventDefault();
        setI((cur) => {
          setDir(-1);
          return Math.max(0, cur - 1);
        });
      } else if (e.key === "Home") go(0);
      else if (e.key === "End") go(SLIDES.length - 1);
      else if (e.key.toLowerCase() === "f") toggleFull();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, toggleFull]);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setScale(Math.min(r.width / W, r.height / H));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [full]);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:pt-8">
      {!full && (
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Presentación del proyecto</p>
            <h1 className="display mt-1 text-[36px] leading-tight sm:text-[44px]">Para defender el trabajo frente al curso</h1>
          </div>
          <p className="text-[12.5px] text-ink-3">Flechas ← → para avanzar · F para pantalla completa</p>
        </div>
      )}

      <div ref={stage} className={cn("relative flex flex-col bg-bg", full ? "h-screen w-screen" : "")}>
        <div ref={box} className={cn("relative w-full overflow-hidden", full ? "flex-1" : "aspect-video rounded-[28px] border border-line/[0.08] shadow-lift")}>
          <div
            className="absolute left-1/2 top-1/2 overflow-hidden bg-surface"
            style={{ width: W, height: H, transform: `translate(-50%, -50%) scale(${scale})`, borderRadius: full ? 0 : 28 / Math.max(scale, 0.01) }}
          >
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={i}
                custom={dir}
                initial={{ opacity: 0, x: 40 * dir }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 * dir }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                {SLIDES[i]?.render()}
              </motion.div>
            </AnimatePresence>
            <div className="absolute bottom-7 left-12 text-[15px] font-medium text-ink-3">
              Instagram <span className="display italic">Reimaginado</span>
            </div>
            <div className="absolute bottom-7 right-12 text-[15px] tabular-nums text-ink-3">
              {i + 1} / {SLIDES.length}
            </div>
          </div>
        </div>

        <div className={cn("flex items-center justify-center gap-3", full ? "absolute inset-x-0 bottom-4 opacity-0 transition-opacity hover:opacity-100" : "mt-5")}>
          <button type="button" onClick={() => go(i - 1)} disabled={i === 0} aria-label="Diapositiva anterior" className="grid size-11 place-items-center rounded-full border border-line/10 bg-surface shadow-soft disabled:opacity-30">
            <ChevronLeft className="size-5" />
          </button>
          <div className="flex items-center gap-1.5 rounded-full border border-line/10 bg-surface px-3 py-2 shadow-soft">
            {SLIDES.map((s, n) => (
              <button key={s.title} type="button" onClick={() => go(n)} aria-label={`Ir a ${s.title}`} aria-current={n === i} className={cn("h-2 rounded-full transition-all", n === i ? "w-7 bg-ink" : "w-2 bg-line/20 hover:bg-line/40")} />
            ))}
          </div>
          <button type="button" onClick={() => go(i + 1)} disabled={i === SLIDES.length - 1} aria-label="Diapositiva siguiente" className="grid size-11 place-items-center rounded-full border border-line/10 bg-surface shadow-soft disabled:opacity-30">
            <ChevronRight className="size-5" />
          </button>
          <button type="button" onClick={toggleFull} aria-label={full ? "Salir de pantalla completa" : "Pantalla completa"} className="ml-2 grid size-11 place-items-center rounded-full border border-line/10 bg-surface shadow-soft">
            {full ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
          </button>
        </div>
      </div>

      {!full && (
        <ol className="mt-8 grid gap-2 sm:grid-cols-5">
          {SLIDES.map((s, n) => (
            <li key={s.title}>
              <button type="button" onClick={() => go(n)} className={cn("w-full rounded-2xl border p-3 text-left text-[13px] transition-colors", n === i ? "border-ink bg-surface" : "border-line/[0.08] text-ink-2 hover:bg-surface")}>
                <span className="block text-[11px] text-ink-3">{n + 1}</span>
                {s.title}
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Diapositivas (diseñadas a 1280 × 720 y escaladas)                    */
/* ------------------------------------------------------------------ */

function Kicker({ n, children }: { n: number; children: ReactNode }) {
  return (
    <p className="text-[15px] font-semibold uppercase tracking-[0.18em] text-ink-3">
      {String(n).padStart(2, "0")} · {children}
    </p>
  );
}

const rise = (d = 0) => ({ initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.15 + d, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } });

function SlideIntro() {
  const chips = [
    { t: "Curiosidad", x: 760, y: 150 },
    { t: "Alegría", x: 1040, y: 210 },
    { t: "FOMO", x: 700, y: 330 },
    { t: "Validación", x: 1010, y: 400 },
    { t: "Comparación", x: 770, y: 520 },
    { t: "Ansiedad", x: 1060, y: 560 },
  ];
  return (
    <div className="relative h-full p-16">
      <div className="absolute right-[-120px] top-[-120px] size-[620px] rounded-full bg-ig-gradient opacity-[0.13] blur-3xl" />
      <Kicker n={1}>Introducción</Kicker>
      <motion.h2 {...rise()} className="display mt-8 max-w-[640px] text-[92px] leading-[0.98]">
        Instagram y lo que nos hace <span className="italic ig-text">sentir</span>
      </motion.h2>
      <motion.p {...rise(0.1)} className="mt-8 max-w-[560px] text-[26px] leading-snug text-ink-2">
        ¿Cómo sería si estuviera diseñada para nuestro bienestar y no para que pasemos más tiempo conectados?
      </motion.p>
      <motion.p {...rise(0.2)} className="mt-10 text-[18px] text-ink-3">
        Más de 2.000 millones de personas la usan cada mes.
      </motion.p>
      {chips.map((c, n) => (
        <motion.span
          key={c.t}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
          transition={{ opacity: { delay: 0.3 + n * 0.08 }, scale: { delay: 0.3 + n * 0.08 }, y: { duration: 6 + n, repeat: Infinity, ease: "easeInOut" } }}
          className="absolute rounded-full border border-line/10 bg-surface px-6 py-3 text-[24px] font-medium shadow-soft"
          style={{ left: c.x, top: c.y }}
        >
          {c.t}
        </motion.span>
      ))}
    </div>
  );
}

function SlideNotifAlgo() {
  const loop = ["Mirás algo", "El sistema aprende", "Te muestra más de lo mismo"];
  return (
    <div className="h-full p-16">
      <Kicker n={2}>Notificaciones y algoritmo</Kicker>
      <h2 className="display mt-5 text-[64px] leading-none">Estrategias, efectos y riesgos</h2>
      <div className="mt-10 grid grid-cols-2 gap-10">
        <div>
          <p className="flex items-center gap-2 text-[22px] font-semibold">
            <Bell className="size-6 text-heart" /> Notificaciones
          </p>
          <div className="mt-5 space-y-3">
            {NOTIFICATIONS.filter((n) => ["n3", "n2", "n10"].includes(n.id)).map((n, k) => (
              <motion.div key={n.id} {...rise(0.1 * k)} className="rounded-2xl bg-surface-2 px-5 py-4 text-[18px] leading-snug">
                {n.legacyText}
              </motion.div>
            ))}
          </div>
          <p className="mt-5 text-[20px] text-ink-2">
            <b className="text-ink">Urgencia falsa</b> → interrupción → menos control sobre nuestro tiempo.
          </p>
        </div>
        <div>
          <p className="flex items-center gap-2 text-[22px] font-semibold">
            <BrainCircuit className="size-6 text-ig-purple" /> Algoritmo
          </p>
          <div className="relative mx-auto mt-10 size-[300px]">
            <motion.div className="absolute inset-6 rounded-full border-[3px] border-dashed border-line/20" animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} />
            {loop.map((t, k) => {
              const a = (k / 3) * Math.PI * 2 - Math.PI / 2;
              return (
                <div key={t} className="absolute grid h-[72px] w-[160px] place-items-center" style={{ left: 150 + Math.cos(a) * 130 - 80, top: 150 + Math.sin(a) * 130 - 36 }}>
                  <motion.span {...rise(0.15 * k)} className="rounded-2xl bg-ink px-3 py-3 text-center text-[17px] font-medium leading-tight text-bg">
                    {t}
                  </motion.span>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-[20px] text-ink-2">
            <b className="text-ink">Burbuja</b> → consumo repetitivo → menos diversidad y autonomía.
          </p>
        </div>
      </div>
    </div>
  );
}

function SlideUiMetrics() {
  const scenes = ["mountains", "city", "ocean", "stage", "forest", "orbit", "night", "dunes"] as const;
  const pals = [PALETTES.alpine, PALETTES.dusk, PALETTES.lagoon, PALETTES.neon, PALETTES.moss, PALETTES.bloom, PALETTES.ink, PALETTES.sand];
  return (
    <div className="h-full p-16">
      <Kicker n={3}>Interfaz y métricas</Kicker>
      <h2 className="display mt-5 text-[64px] leading-none">Los problemas actuales</h2>
      <div className="mt-10 grid grid-cols-2 gap-12">
        <div className="flex gap-8">
          <div className="relative h-[400px] w-[200px] shrink-0 overflow-hidden rounded-[32px] border-[6px] border-[#111] bg-surface-2">
            <motion.div animate={{ y: [0, -900] }} transition={{ duration: 14, repeat: Infinity, ease: "linear" }} className="space-y-2 p-2">
              {Array.from({ length: 16 }, (_, k) => (
                <div key={k} className="h-[110px] overflow-hidden rounded-xl">
                  <SceneArt scene={scenes[k % 8]!} palette={pals[k % 8]!} seed={`s3${k}`} className="h-full w-full" />
                </div>
              ))}
            </motion.div>
          </div>
          <div>
            <p className="flex items-center gap-2 text-[22px] font-semibold">
              <InfinityIcon className="size-6" /> Interfaz
            </p>
            <ul className="mt-4 space-y-4 text-[20px] leading-snug text-ink-2">
              <li><b className="text-ink">Scroll infinito:</b> nunca llegás al final.</li>
              <li><b className="text-ink">Autoplay:</b> el siguiente video ya está pasando.</li>
              <li><b className="text-ink">Sin pausas:</b> cortar depende solo de la fuerza de voluntad.</li>
            </ul>
          </div>
        </div>
        <div>
          <p className="flex items-center gap-2 text-[22px] font-semibold">
            <Heart className="size-6 text-heart" /> Métricas
          </p>
          <motion.div {...rise(0.1)} className="mt-5 rounded-3xl bg-surface-2 p-7">
            <p className="text-[56px] font-bold leading-none tracking-tight">248.301</p>
            <p className="mt-1 text-[20px] text-ink-2">me gusta</p>
            <div className="mt-6 flex gap-6">
              <div>
                <p className="text-[34px] font-bold leading-none">1,2 M</p>
                <p className="text-[17px] text-ink-2">seguidores</p>
              </div>
              <div>
                <p className="text-[34px] font-bold leading-none text-heart">−32%</p>
                <p className="text-[17px] text-ink-2">"que tu última foto"</p>
              </div>
            </div>
          </motion.div>
          <p className="mt-5 text-[20px] text-ink-2">
            <b className="text-ink">Comparación social</b> y búsqueda de aprobación: el número aparece antes que la persona.
          </p>
        </div>
      </div>
    </div>
  );
}

function SlideProposal() {
  const items = [
    { Icon: Hourglass, t: "Scroll consciente", b: "Infinito", a: "Bloques + pausa" },
    { Icon: Bell, t: "Notificaciones", b: "Urgentes, una por una", a: "Agrupadas, cuando elijas" },
    { Icon: Eye, t: "Algoritmo", b: "Opaco", a: "\"¿Por qué veo esto?\"" },
    { Icon: Lock, t: "Métricas", b: "Likes públicos", a: "Privadas por defecto" },
    { Icon: Leaf, t: "Modo bienestar", b: "Herramientas escondidas", a: "Panel visible" },
    { Icon: Clock, t: "Reels", b: "Bucle sin fin", a: "Contador y límite" },
  ];
  return (
    <div className="h-full p-16">
      <Kicker n={4}>Nuestra propuesta</Kicker>
      <h2 className="display mt-5 text-[64px] leading-none">
        Instagram, <span className="italic text-ink-3">antes</span> y <span className="italic text-calm">después</span>
      </h2>
      <div className="mt-10 grid grid-cols-3 gap-5">
        {items.map(({ Icon, t, b, a }, k) => (
          <motion.div key={t} {...rise(0.06 * k)} className="rounded-3xl border border-line/[0.08] bg-surface p-6 shadow-soft">
            <Icon className="size-7 text-calm" strokeWidth={1.7} />
            <p className="mt-4 text-[24px] font-semibold">{t}</p>
            <p className="mt-2 flex items-center gap-2 text-[18px]">
              <span className="text-ink-3 line-through decoration-heart/60">{b}</span>
              <ArrowRight className="size-4 shrink-0 text-ink-3" />
              <span className="font-medium">{a}</span>
            </p>
          </motion.div>
        ))}
      </div>
      <p className="mt-8 text-[19px] text-ink-2">Demostración en vivo: sección <b className="text-ink">Comparar</b> y <b className="text-ink">Simulador</b>.</p>
    </div>
  );
}

function SlideConclusion() {
  return (
    <div className="relative h-full p-16">
      <div className="absolute bottom-[-200px] left-[-100px] size-[600px] rounded-full bg-calm opacity-[0.12] blur-3xl" />
      <Kicker n={5}>Conclusión</Kicker>
      <h2 className="display mt-5 text-[64px] leading-none">Bienestar frente a retención</h2>
      <div className="mt-12 grid grid-cols-[1fr_auto_1fr] items-center gap-10">
        <motion.div {...rise()} className="rounded-3xl bg-surface-2 p-8">
          <p className="text-[15px] font-semibold uppercase tracking-[0.16em] text-ink-3">Diseño para retener</p>
          <ul className="mt-4 space-y-2 text-[22px]">
            <li>Más minutos en pantalla</li>
            <li>Más likes y seguidores</li>
            <li>Más notificaciones</li>
          </ul>
        </motion.div>
        <Scale className="size-14 text-ink-3" strokeWidth={1.4} />
        <motion.div {...rise(0.1)} className="rounded-3xl bg-[#1F4D42] p-8 text-white">
          <p className="text-[15px] font-semibold uppercase tracking-[0.16em] text-white/60">Diseño para el bienestar</p>
          <ul className="mt-4 space-y-2 text-[22px]">
            <li className="flex items-center gap-2"><Users className="size-5" /> Vínculos reales</li>
            <li className="flex items-center gap-2"><Eye className="size-5" /> Decisiones conscientes</li>
            <li className="flex items-center gap-2"><Leaf className="size-5" /> Descanso y autonomía</li>
          </ul>
        </motion.div>
      </div>
      <motion.p {...rise(0.25)} className="display mx-auto mt-12 max-w-[900px] text-center text-[38px] leading-tight">
        "Una buena app no es la que más tiempo te retiene, sino la que te deja <span className="italic text-calm">mejor</span> de lo que te encontró."
      </motion.p>
    </div>
  );
}
