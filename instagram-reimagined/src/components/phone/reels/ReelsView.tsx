import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, Hourglass, Heart, MessageCircle, Music, Pause, Play, Send, Settings2, Volume2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { REELS } from "@/data/posts";
import { userById } from "@/data/users";
import { useApp } from "@/state/app-state";
import { estimateReelMinutes, reelCheckpoint } from "@/lib/reels";
import { cn, compactNumber } from "@/lib/format";
import type { Reel } from "@/types";
import { Avatar } from "@/components/art/Avatar";
import { SceneArt } from "@/components/art/SceneArt";
import { usePhone } from "../phone-context";

type Entry =
  | { kind: "reel"; key: string; reel: Reel; daily: number }
  | { kind: "pause"; key: string; daily: number }
  | { kind: "limit"; key: string; daily: number };

const REEL_MS = 9000;

/**
 * Reels.
 * - Actual: lista infinita, sin contador ni cierre.
 * - Ético: contador discreto, pausas opcionales cada N reels, límite diario
 *   elegido por el usuario y opción de terminar la sesión sin perder guardados.
 */
export function ReelsView() {
  const { version, setTab, openWellbeing } = usePhone();
  const { settings, reelsWatched, markReelWatched, saved } = useApp();
  const ethical = version === "etico";
  const [startCount] = useState(reelsWatched);
  const [loaded, setLoaded] = useState(8);
  const [extra, setExtra] = useState(0);
  const [active, setActive] = useState(0);
  const [ended, setEnded] = useState(false);
  const seen = useRef(new Set<string>());
  const scroller = useRef<HTMLDivElement>(null);

  const limit = settings.reelsLimit > 0 ? settings.reelsLimit + extra : 0;

  const entries = useMemo<Entry[]>(() => {
    const out: Entry[] = [];
    if (ethical && limit > 0 && startCount >= limit) {
      out.push({ kind: "limit", key: "limit-start", daily: startCount });
      return out;
    }
    for (let i = 0; i < loaded; i++) {
      const reel = REELS[i % REELS.length];
      if (!reel) continue;
      const daily = startCount + i + 1;
      out.push({ kind: "reel", key: `${reel.id}-${i}`, reel, daily });
      if (!ethical) continue;
      const cp = reelCheckpoint(daily, settings.reelsPauseEvery, limit);
      if (limit > 0 && daily >= limit) {
        out.push({ kind: "limit", key: `limit-${daily}`, daily });
        break;
      }
      if (cp === "pause") out.push({ kind: "pause", key: `pause-${daily}`, daily });
    }
    return out;
  }, [ethical, loaded, startCount, settings.reelsPauseEvery, limit]);

  // Detecta qué tarjeta está en pantalla.
  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (es) => {
        es.forEach((e) => {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
        });
      },
      { root, threshold: 0.6 },
    );
    root.querySelectorAll("[data-index]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [entries]);

  useEffect(() => {
    const e = entries[active];
    if (e?.kind === "reel" && !seen.current.has(e.key)) {
      seen.current.add(e.key);
      markReelWatched();
    }
    // Cargar más al acercarse al final.
    if (active >= entries.length - 3 && entries[entries.length - 1]?.kind !== "limit") setLoaded((l) => l + 6);
  }, [active, entries, markReelWatched]);

  const scrollToNext = () => {
    const root = scroller.current;
    if (root) root.scrollTo({ top: (active + 1) * root.clientHeight, behavior: "smooth" });
  };

  const sessionCount = seen.current.size;
  const savedReels = REELS.filter((r) => saved[r.id]).length;

  return (
    <div className="relative h-full bg-black text-white">
      <div ref={scroller} className="no-scrollbar h-full snap-y snap-mandatory overflow-y-scroll">
        {entries.map((e, i) => (
          <section key={e.key} data-index={i} className="relative h-full w-full snap-start snap-always overflow-hidden">
            {e.kind === "reel" && <ReelCard reel={e.reel} active={i === active} ethical={ethical} />}
            {e.kind === "pause" && (
              <CheckCard
                icon={<Hourglass className="size-7" strokeWidth={1.5} />}
                title={`Llevás ${e.daily} reels hoy`}
                text={`Son unos ${estimateReelMinutes(e.daily)} minutos. ¿Seguimos o cortamos acá?`}
                primary={{ label: "Seguir mirando", onClick: scrollToNext }}
                secondary={{ label: "Terminar sesión", onClick: () => setEnded(true) }}
                note="También podés deslizar para seguir: es una sugerencia, no un bloqueo."
              />
            )}
            {e.kind === "limit" && (
              <CheckCard
                icon={<Hourglass className="size-7" strokeWidth={1.5} />}
                title="Llegaste a tu límite de hoy"
                text={`Elegiste ver hasta ${limit} reels por día. Tus guardados no se pierden.`}
                primary={{ label: "Terminar sesión", onClick: () => setEnded(true) }}
                secondary={{
                  label: "Ver 5 más",
                  onClick: () => {
                    setExtra((x) => x + 5);
                    setLoaded((l) => l + 5);
                  },
                }}
                tertiary={{ label: "Cambiar mi límite", onClick: openWellbeing }}
              />
            )}
          </section>
        ))}
      </div>

      {/* Encabezado */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/40 to-transparent px-4 pb-6 pt-2">
        <span className="text-[20px] font-semibold tracking-tight">Reels</span>
        {ethical ? (
          <span className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-medium backdrop-blur">
            {startCount + sessionCount}
            {limit > 0 && <span className="text-white/60">/ {limit}</span>} hoy
            <button type="button" aria-label="Ajustes de reels" onClick={openWellbeing} className="ml-0.5">
              <Settings2 className="size-3.5" />
            </button>
          </span>
        ) : (
          <Volume2 className="size-5" />
        )}
      </div>

      <AnimatePresence>
        {ended && (
          <motion.div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-surface px-8 text-center text-ink" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="eyebrow">Sesión terminada</p>
            <p className="display mt-2 text-[30px] leading-tight">Listo por hoy</p>
            <div className="mt-6 grid w-full grid-cols-3 gap-2">
              {[
                [String(sessionCount), "reels en esta sesión"],
                [`~${estimateReelMinutes(sessionCount)}`, "minutos"],
                [String(savedReels), "guardados"],
              ].map(([n, l]) => (
                <div key={l} className="rounded-2xl bg-surface-2 px-2 py-3">
                  <p className="text-xl font-semibold">{n}</p>
                  <p className="text-[10.5px] leading-tight text-ink-2">{l}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[12.5px] text-ink-2">Lo que guardaste queda en tu perfil, en "Guardados", para cuando quieras volver.</p>
            <button type="button" onClick={() => setTab("inicio")} className="btn-primary mt-6 !text-[13px]">
              Volver al inicio
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ReelCard({ reel, active, ethical }: { reel: Reel; active: boolean; ethical: boolean }) {
  const { liked, saved, toggleLike, toggleSave, settings } = useApp();
  const { toast } = usePhone();
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const author = userById(reel.authorId);
  const isLiked = !!liked[reel.id];
  const isSaved = !!saved[reel.id];
  const playing = active && !paused;

  useEffect(() => {
    if (!playing) return;
    const t = window.setInterval(() => setElapsed((e) => (e + 100) % REEL_MS), 100);
    return () => window.clearInterval(t);
  }, [playing]);

  useEffect(() => {
    if (!active) setElapsed(0);
  }, [active]);

  return (
    <div className="absolute inset-0">
      <motion.div
        className="absolute inset-0"
        animate={playing ? { scale: [1, 1.14, 1], x: [0, -14, 0] } : {}}
        transition={{ duration: REEL_MS / 1000, repeat: Infinity, ease: "easeInOut" }}
      >
        <SceneArt scene={reel.scene} palette={reel.palette} seed={reel.id} className="media h-full w-full" />
      </motion.div>
      <button type="button" aria-label={paused ? "Reproducir" : "Pausar"} className="absolute inset-0" onClick={() => setPaused((p) => !p)} />
      <AnimatePresence>
        {paused && (
          <motion.div className="pointer-events-none absolute inset-0 grid place-items-center" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <span className="grid size-16 place-items-center rounded-full bg-black/40 backdrop-blur">
              <Play className="ml-1 size-7 fill-white" />
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />

      <div className="absolute bottom-24 right-2 flex flex-col items-center gap-4 text-[11.5px] font-medium">
        <button type="button" className="flex flex-col items-center gap-1" aria-pressed={isLiked} aria-label="Me gusta" onClick={() => toggleLike(reel.id)}>
          <Heart className={cn("size-7", isLiked && (ethical ? "fill-calm text-calm" : "fill-heart text-heart"))} strokeWidth={1.7} />
          {(!ethical || !settings.hideLikes) && compactNumber(reel.likes + (isLiked ? 1 : 0))}
        </button>
        <button type="button" className="flex flex-col items-center gap-1" aria-label="Comentarios" onClick={() => toast("Comentarios de reels: simulados")}>
          <MessageCircle className="size-7 -scale-x-100" strokeWidth={1.7} />
          {compactNumber(reel.comments)}
        </button>
        <button type="button" aria-label="Compartir" onClick={() => toast("Enviado a un amigo")}>
          <Send className="size-6" strokeWidth={1.7} />
        </button>
        <button
          type="button"
          aria-pressed={isSaved}
          aria-label="Guardar"
          onClick={() => {
            toggleSave(reel.id);
            if (!isSaved) toast("Guardado en tu perfil");
          }}
        >
          <Bookmark className={cn("size-6", isSaved && "fill-white")} strokeWidth={1.7} />
        </button>
        {ethical && (
          <button type="button" aria-label="Por qué veo este reel" className="rounded-full bg-white/15 px-2 py-1 text-[10px]" onClick={() => toast(`Reel de ${author.handle} · Tema: ${reel.topic}. Lo ves porque coincide con lo que miraste, no por tiempo de visualización.`)}>
            ¿Por qué?
          </button>
        )}
        {!ethical && (
          <motion.span animate={playing ? { rotate: 360 } : {}} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="grid size-8 place-items-center rounded-lg border-2 border-white bg-black/50">
            <Music className="size-3.5" />
          </motion.span>
        )}
      </div>

      <div className="absolute bottom-6 left-3 right-16 text-[13px]">
        <div className="flex items-center gap-2">
          <Avatar user={author} size={30} />
          <span className="font-semibold">{author.handle}</span>
          {!author.friend && <span className="rounded-lg border border-white/60 px-2 py-0.5 text-[11.5px] font-semibold">Seguir</span>}
        </div>
        <p className="mt-2 line-clamp-2">{reel.caption}</p>
        <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-white/85">
          <Music className="size-3" /> {reel.audio}
        </p>
      </div>

      {ethical && active && (
        <button type="button" onClick={() => setPaused((p) => !p)} className="absolute left-3 top-12 flex items-center gap-1 rounded-full bg-black/35 px-2.5 py-1 text-[11px] backdrop-blur">
          {paused ? <Play className="size-3" /> : <Pause className="size-3" />} {paused ? "Reanudar" : "Pausar"}
        </button>
      )}

      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-white/20">
        <div className="h-full bg-white/90" style={{ width: `${(elapsed / REEL_MS) * 100}%` }} />
      </div>
    </div>
  );
}

interface Btn {
  label: string;
  onClick: () => void;
}

interface CheckProps {
  icon: ReactNode;
  title: string;
  text: string;
  primary: Btn;
  secondary: Btn;
  tertiary?: Btn;
  note?: string;
}

function CheckCard({ icon, title, text, primary, secondary, tertiary, note }: CheckProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-gradient-to-b from-[#123a32] to-[#0b1513] px-8 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-white/10 text-[#9fe0cb]">{icon}</span>
      <p className="display mt-5 text-[30px] leading-tight text-balance">{title}</p>
      <p className="mt-2 text-[13.5px] text-white/75">{text}</p>
      <div className="mt-7 flex w-full flex-col gap-2">
        <button type="button" onClick={primary.onClick} className="btn bg-white text-black hover:bg-white/90">
          {primary.label}
        </button>
        <button type="button" onClick={secondary.onClick} className="btn border border-white/25 text-white hover:bg-white/10">
          {secondary.label}
        </button>
        {tertiary && (
          <button type="button" onClick={tertiary.onClick} className="mt-1 text-[12.5px] text-white/70 underline-offset-2 hover:underline">
            {tertiary.label}
          </button>
        )}
      </div>
      {note && <p className="mt-6 text-[11px] text-white/45">{note}</p>}
    </div>
  );
}
