import { AnimatePresence, motion } from "framer-motion";
import { Heart, Pause, Play, Send, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { STORIES } from "@/data/posts";
import { userById } from "@/data/users";
import { Avatar } from "@/components/art/Avatar";
import { SceneArt } from "@/components/art/SceneArt";
import { usePhone } from "../phone-context";

const FRAME_MS = 4500;

/**
 * Visor de historias.
 * - Actual: al terminar una persona, salta sola a la siguiente, incluidas
 *   cuentas que no son amigas (encadenamiento sin fin).
 * - Ético: solo amigos, y al terminar se detiene con un cierre claro.
 */
export function StoryViewer({ start, onClose }: { start: number; onClose: () => void }) {
  const { version } = usePhone();
  const ethical = version === "etico";
  const list = useMemo(() => (ethical ? STORIES.filter((s) => userById(s.userId).friend) : STORIES), [ethical]);
  const [userIdx, setUserIdx] = useState(start);
  const [frame, setFrame] = useState(0);
  const [paused, setPaused] = useState(false);
  const [done, setDone] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const story = list[userIdx];

  const next = () => {
    if (!story) return;
    if (frame < story.frames.length - 1) setFrame(frame + 1);
    else if (userIdx < list.length - 1) {
      setUserIdx(userIdx + 1);
      setFrame(0);
    } else if (ethical) setDone(true);
    else {
      // La app actual vuelve a empezar: nunca hay un final.
      setUserIdx(0);
      setFrame(0);
    }
    setElapsed(0);
  };
  const prev = () => {
    if (frame > 0) setFrame(frame - 1);
    else if (userIdx > 0) {
      setUserIdx(userIdx - 1);
      setFrame(0);
    }
    setElapsed(0);
  };

  useEffect(() => {
    if (paused || done) return;
    const t = window.setInterval(() => setElapsed((e) => e + 50), 50);
    return () => window.clearInterval(t);
  }, [paused, done]);

  useEffect(() => {
    if (elapsed >= FRAME_MS) next();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed]);

  if (!story) return null;
  const u = userById(story.userId);
  const f = story.frames[frame] ?? story.frames[0];
  if (!f) return null;

  return (
    <motion.div
      className="absolute inset-0 z-50 bg-black text-white"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
    >
      <AnimatePresence mode="wait">
        <motion.div key={`${userIdx}-${frame}`} className="absolute inset-0" initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} exit={{ opacity: 0.4 }} transition={{ duration: 0.25 }}>
          <SceneArt scene={f.scene} palette={f.palette} seed={`${u.id}${frame}`} className="media h-full w-full" />
          {f.text && (
            <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 text-center">
              <span className="rounded-lg bg-black/45 px-3 py-1.5 text-xl font-semibold backdrop-blur-sm">{f.text}</span>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/50 to-transparent px-3 pb-8 pt-12">
        <div className="flex gap-1">
          {story.frames.map((_, i) => (
            <div key={i} className="h-[2.5px] flex-1 overflow-hidden rounded-full bg-white/35">
              {i < frame && <div className="h-full w-full bg-white" />}
              {i === frame && <div className="h-full bg-white" style={{ width: `${Math.min(100, (elapsed / FRAME_MS) * 100)}%` }} />}
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Avatar user={u} size={30} />
          <span className="text-[13px] font-semibold">{u.handle}</span>
          {!u.friend && <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-medium">No la seguís</span>}
          <span className="text-[12px] text-white/70">{3 + userIdx} h</span>
          <button type="button" className="ml-auto grid size-8 place-items-center" aria-label={paused ? "Reanudar" : "Pausar"} onClick={() => setPaused((p) => !p)}>
            {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
          </button>
          <button type="button" className="grid size-8 place-items-center" aria-label="Cerrar historias" onClick={onClose}>
            <X className="size-5" />
          </button>
        </div>
      </div>

      <button type="button" aria-label="Anterior" className="absolute bottom-20 left-0 top-28 w-1/3" onClick={prev} />
      <button type="button" aria-label="Siguiente" className="absolute bottom-20 right-0 top-28 w-2/3" onClick={next} />

      <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 px-3 pb-6 pt-3">
        <div className="flex-1 rounded-full border border-white/50 px-4 py-2.5 text-[13px] text-white/80">Enviar mensaje</div>
        <Heart className="size-6" />
        <Send className="size-6" />
      </div>

      <AnimatePresence>
        {done && (
          <motion.div className="absolute inset-0 z-10 grid place-items-center bg-black/70 px-8 text-center backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div>
              <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-calm/25 text-2xl">✓</div>
              <p className="display text-3xl">Viste todas las historias de tus amigos</p>
              <p className="mt-3 text-sm text-white/70">No se encadenan historias de cuentas que no seguís.</p>
              <button type="button" onClick={onClose} className="btn mt-6 bg-white text-black hover:bg-white/90">
                Volver al inicio
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
