import { AnimatePresence, motion } from "framer-motion";
import { Bell, Eye, EyeOff, Heart, Inbox, MessageCircle, Play, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { NOTIFICATIONS } from "@/data/notifications";
import { PALETTES } from "@/data/users";
import { bubbleMix, diversityIndex } from "@/lib/algorithm";
import { cn } from "@/lib/format";
import { SceneArt } from "@/components/art/SceneArt";

/* ------------------------- Notificaciones ------------------------- */

export function NotificationsDemo() {
  const [running, setRunning] = useState(false);
  const [shown, setShown] = useState(0);
  const total = NOTIFICATIONS.length;
  const done = shown >= total;

  useEffect(() => {
    if (!running || done) return;
    const t = window.setTimeout(() => setShown((s) => s + 1), 380);
    return () => window.clearTimeout(t);
  }, [running, shown, done]);

  const hour = 16 + Math.floor((shown / total) * 4);
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-ink-2">
          Simulá una tarde de estudio, de 16 a 20 h. <span className="text-ink-3">({String(hour).padStart(2, "0")}:00)</span>
        </p>
        <button
          type="button"
          className="btn-primary !py-2 !text-[13px]"
          onClick={() => {
            setShown(0);
            setRunning(true);
          }}
        >
          {done ? <RotateCcw className="size-4" /> : <Play className="size-4" />} {done ? "Repetir" : "Simular la tarde"}
        </button>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-surface-2 p-3">
          <div className="mb-2 flex items-center justify-between text-[12px] font-semibold">
            <span>Actual</span>
            <span className="rounded-full bg-heart px-2 py-0.5 text-white">{shown} interrupciones</span>
          </div>
          <div className="relative h-64 overflow-hidden">
            <AnimatePresence initial={false}>
              {NOTIFICATIONS.slice(0, shown)
                .slice(-5)
                .reverse()
                .map((n) => (
                  <motion.div key={n.id} layout initial={{ opacity: 0, y: -16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} className="mb-2 flex gap-2 rounded-xl bg-surface p-2.5 text-[11.5px] leading-snug shadow-soft">
                    <Bell className="mt-0.5 size-3.5 shrink-0 text-heart" />
                    {n.legacyText}
                  </motion.div>
                ))}
            </AnimatePresence>
            {shown === 0 && <p className="pt-20 text-center text-[12px] text-ink-3">Tocá "Simular la tarde"</p>}
          </div>
        </div>
        <div className="rounded-2xl bg-calm-soft p-3">
          <div className="mb-2 flex items-center justify-between text-[12px] font-semibold">
            <span>Ético</span>
            <span className="rounded-full bg-calm px-2 py-0.5 text-white dark:text-black">{(shown > 0 ? 1 : 0) + (shown > 7 ? 1 : 0) + (done ? 1 : 0)} interrupciones</span>
          </div>
          <div className="h-64 space-y-2">
            {shown > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 rounded-xl bg-surface p-2.5 text-[11.5px] shadow-soft">
                <MessageCircle className="mt-0.5 size-3.5 shrink-0 text-calm" /> Lucía te escribió: "¿Mañana hay que llevar el TP impreso?"
              </motion.div>
            )}
            {shown > 7 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 rounded-xl bg-surface p-2.5 text-[11.5px] shadow-soft">
                <MessageCircle className="mt-0.5 size-3.5 shrink-0 text-calm" /> Camila te mencionó en un comentario.
              </motion.div>
            )}
            {done ? (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-surface p-3 text-[11.5px] shadow-soft">
                <p className="flex items-center gap-1.5 font-semibold">
                  <Inbox className="size-3.5 text-calm" /> Resumen de las 20:00
                </p>
                <p className="mt-1 text-ink-2">78 me gusta y vistas · 7 seguidores nuevos · 4 sugerencias silenciadas</p>
              </motion.div>
            ) : (
              shown > 0 && <p className="px-1 pt-2 text-[11.5px] text-ink-3">El resto espera al resumen de las 20 h…</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- Algoritmo --------------------------- */

const DEMO_TOPICS = [
  { id: "deportes", label: "Fitness", color: "#E8613C" },
  { id: "humor", label: "Memes", color: "#D94F8C" },
  { id: "musica", label: "Música", color: "#8B5CF6" },
  { id: "ciencia", label: "Ciencia", color: "#3B82F6" },
  { id: "viajes", label: "Viajes", color: "#14B8A6" },
  { id: "arte", label: "Arte", color: "#EAB308" },
] as const;
type DemoTopic = (typeof DEMO_TOPICS)[number]["id"];
const START: Record<DemoTopic, number> = { deportes: 1, humor: 1, musica: 1, ciencia: 1, viajes: 1, arte: 1 };

export function AlgorithmDemo() {
  const [w, setW] = useState(START);
  const legacy = useMemo(() => bubbleMix(w, "actual"), [w]);
  const ethical = useMemo(() => bubbleMix(w, "etico"), [w]);
  const watched = Object.values(w).reduce((a, b) => a + b, 0) - 6;

  return (
    <div>
      <p className="text-[13px] text-ink-2">Tocá un tema para "mirar un video" de ese tema. Fijate cómo cambia lo que te recomienda cada versión.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {DEMO_TOPICS.map((t) => (
          <button key={t.id} type="button" onClick={() => setW((x) => ({ ...x, [t.id]: x[t.id] + 1 }))} className="chip hover:bg-surface-2">
            <span className="size-2 rounded-full" style={{ background: t.color }} /> Mirar {t.label}
          </button>
        ))}
        <button type="button" onClick={() => setW(START)} className="chip text-ink-3">
          <RotateCcw className="size-3" /> Reiniciar
        </button>
      </div>
      <p className="mt-2 text-[11.5px] text-ink-3">Videos mirados: {watched}</p>
      <div className="mt-4 space-y-4">
        {(
          [
            ["Actual · amplifica lo que más miraste", legacy],
            ["Ético · ningún tema pasa del 30%", ethical],
          ] as const
        ).map(([label, mix]) => {
          const d = diversityIndex(Object.values(mix));
          return (
            <div key={label}>
              <div className="mb-1.5 flex justify-between text-[12px]">
                <span className="font-medium">{label}</span>
                <span className="text-ink-3">Diversidad: {Math.round(d * 100)}%</span>
              </div>
              <div className="flex h-9 overflow-hidden rounded-xl">
                {DEMO_TOPICS.map((t) => (
                  <motion.div
                    key={t.id}
                    layout
                    className="grid place-items-center overflow-hidden text-[10.5px] font-semibold text-white"
                    style={{ background: t.color }}
                    animate={{ width: `${mix[t.id] * 100}%` }}
                    transition={{ type: "spring", stiffness: 200, damping: 30 }}
                  >
                    {mix[t.id] > 0.09 && `${Math.round(mix[t.id] * 100)}%`}
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------- Interfaz ---------------------------- */

export function ScrollDemo() {
  const [legacy, setLegacy] = useState(0);
  const [ethical, setEthical] = useState(0);
  const [asked, setAsked] = useState(false);
  const block = 5;
  const atCheckpoint = ethical > 0 && ethical % block === 0 && !asked;

  return (
    <div>
      <p className="text-[13px] text-ink-2">Tocá "Bajar" muchas veces en cada lado. ¿En cuál aparece un momento para decidir?</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-surface-2 p-4">
          <p className="text-[12px] font-semibold">Actual</p>
          <MiniFeed count={legacy} />
          <button type="button" onClick={() => setLegacy((n) => n + 1)} className="btn-ghost mt-3 w-full !bg-surface !py-2 !text-[13px]">
            Bajar ↓
          </button>
          <p className="mt-2 text-center text-[11.5px] text-ink-3">{legacy} publicaciones · siempre hay más</p>
        </div>
        <div className="rounded-2xl bg-calm-soft p-4">
          <p className="text-[12px] font-semibold">Ético</p>
          <div className="relative">
            <MiniFeed count={ethical} />
            <AnimatePresence>
              {atCheckpoint && (
                <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 grid place-items-center rounded-xl bg-surface/95 p-3 text-center">
                  <div>
                    <p className="text-[12.5px] font-semibold">Ya viste las novedades más importantes.</p>
                    <p className="text-[11.5px] text-ink-2">¿Querés seguir o hacer una pausa?</p>
                    <div className="mt-2 flex justify-center gap-1.5">
                      <button type="button" className="chip bg-surface" onClick={() => { setEthical(0); setAsked(false); }}>
                        Pausa
                      </button>
                      <button type="button" className="chip border-calm bg-calm text-white dark:text-black" onClick={() => setAsked(true)}>
                        Seguir
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            type="button"
            disabled={atCheckpoint}
            onClick={() => {
              setEthical((n) => n + 1);
              setAsked(false);
            }}
            className="btn-ghost mt-3 w-full !bg-surface !py-2 !text-[13px]"
          >
            Bajar ↓
          </button>
          <p className="mt-2 text-center text-[11.5px] text-ink-3">{ethical} publicaciones · pausa cada {block}</p>
        </div>
      </div>
    </div>
  );
}

function MiniFeed({ count }: { count: number }) {
  const scenes = ["mountains", "city", "ocean", "stage", "forest", "orbit"] as const;
  const pals = [PALETTES.alpine, PALETTES.dusk, PALETTES.lagoon, PALETTES.neon, PALETTES.moss, PALETTES.bloom];
  return (
    <div className="mt-2 h-40 overflow-hidden rounded-xl bg-surface">
      <motion.div animate={{ y: -Math.max(0, count - 1) * 52 }} transition={{ type: "spring", stiffness: 160, damping: 24 }} className="space-y-1.5 p-1.5">
        {Array.from({ length: count + 3 }, (_, i) => (
          <div key={i} className="flex h-[46px] items-center gap-2 rounded-lg bg-surface-2 p-1.5">
            <span className="h-full w-10 overflow-hidden rounded-md">
              <SceneArt scene={scenes[i % 6]!} palette={pals[i % 6]!} seed={`mf${i}`} className="h-full w-full" />
            </span>
            <span className="h-2 flex-1 rounded-full bg-line/10" />
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/* ---------------------------- Métricas ---------------------------- */

export function MetricsDemo() {
  const [pick, setPick] = useState<"a" | "b" | null>(null);
  const [hidden, setHidden] = useState(false);
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] text-ink-2">¿Cuál de estas dos fotos te parece mejor?</p>
        <button type="button" onClick={() => setHidden((h) => !h)} className="chip">
          {hidden ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />} {hidden ? "Mostrar likes" : "Ocultar likes"}
        </button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {(
          [
            ["a", 12],
            ["b", 1204],
          ] as const
        ).map(([id, likes]) => (
          <button key={id} type="button" onClick={() => setPick(id)} className={cn("overflow-hidden rounded-2xl border-2 bg-surface text-left transition-colors", pick === id ? "border-ink" : "border-transparent")}>
            <div className="aspect-[4/5]">
              <SceneArt scene="ocean" palette={PALETTES.lagoon} seed="same-photo" className="h-full w-full" />
            </div>
            <p className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-semibold">
              <Heart className="size-4" /> {hidden ? "Le gusta a otras personas" : `${likes.toLocaleString("es-AR")} me gusta`}
            </p>
          </button>
        ))}
      </div>
      <AnimatePresence>
        {pick && (
          <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 rounded-2xl bg-calm-soft p-3 text-[13px]">
            <b>Son exactamente la misma foto.</b> {hidden ? "Sin números, no hay diferencia." : "Si sentiste que una era mejor, es por el número: se llama prueba social. Con los likes ocultos, mirás la foto y no la popularidad."}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
