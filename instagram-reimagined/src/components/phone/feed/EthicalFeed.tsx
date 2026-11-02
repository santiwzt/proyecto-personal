import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Coffee, SlidersHorizontal } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import { POSTS } from "@/data/posts";
import { ethicalSuggestions, rankEthicalFeed } from "@/lib/algorithm";
import { visibleBlocks } from "@/lib/feed";
import { useApp, useUsage } from "@/state/app-state";
import { formatDuration } from "@/lib/format";
import type { FeedMode } from "@/types";
import { Segmented } from "@/components/ui/Segmented";
import { usePhone } from "../phone-context";
import { PostCard } from "./PostCard";
import { StoriesBar } from "./StoriesBar";

export const BLOCK_SIZE = 5;

/**
 * Feed ético: bloques de publicaciones con puntos de parada naturales.
 * Solo cuentas elegidas; las sugerencias son opcionales y tienen final.
 */
export function EthicalFeed() {
  const { settings, update } = useApp();
  const { openInterests } = usePhone();
  const [unlocked, setUnlocked] = useState(1);
  const [paused, setPaused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const ctx = { mode: settings.feedMode, interests: settings.interests, lessOf: settings.lessOf };
  const ranked = useMemo(() => rankEthicalFeed(POSTS, ctx), [settings.feedMode, settings.interests, settings.lessOf]); // eslint-disable-line react-hooks/exhaustive-deps
  const suggestions = useMemo(() => ethicalSuggestions(POSTS, ctx).slice(0, 4), [settings.interests, settings.lessOf]); // eslint-disable-line react-hooks/exhaustive-deps
  const { shown, hasMore } = visibleBlocks(ranked, BLOCK_SIZE, unlocked);

  return (
    <div className="no-scrollbar relative h-full overflow-y-auto">
      <StoriesBar />
      <div className="flex items-center gap-2 border-y border-line/[0.06] px-3 py-2">
        <Segmented<FeedMode>
          size="sm"
          ariaLabel="Orden del feed"
          value={settings.feedMode}
          onChange={(feedMode) => {
            update({ feedMode });
            setUnlocked(1);
          }}
          options={[
            { value: "personalizado", label: "Para vos" },
            { value: "cronologico", label: "Cronológico" },
          ]}
        />
        <button type="button" onClick={openInterests} className="chip ml-auto text-ink-2 hover:text-ink">
          <SlidersHorizontal className="size-3" /> Intereses
        </button>
      </div>

      {shown.map((block, i) => (
        <Fragment key={`${settings.feedMode}-${i}`}>
          <motion.div initial={i > 0 ? { opacity: 0, y: 12 } : false} animate={{ opacity: 1, y: 0 }}>
            {block.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </motion.div>
          {i === shown.length - 1 && hasMore && (
            <Checkpoint
              first={i === 0}
              onContinue={() => setUnlocked((u) => u + 1)}
              onPause={() => setPaused(true)}
            />
          )}
        </Fragment>
      ))}

      {!hasMore && (
        <div className="px-5 pb-8 pt-8 text-center">
          <CheckCircle2 className="mx-auto size-9 text-calm" strokeWidth={1.5} />
          <p className="display mt-3 text-[26px] leading-tight">Estás al día</p>
          <p className="mx-auto mt-1.5 max-w-[250px] text-[12.5px] text-ink-2">Viste todo lo que publicaron las cuentas que seguís en los últimos días.</p>
          {!showSuggestions ? (
            <button type="button" onClick={() => setShowSuggestions(true)} className="btn-ghost mt-4 !text-[12.5px]">
              Ver algunas sugerencias (opcional)
            </button>
          ) : (
            <div className="-mx-5 mt-6 text-left">
              <p className="eyebrow px-4 pb-2">Sugerencias según tus intereses</p>
              {suggestions.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
              <p className="px-4 pt-5 text-center text-[12px] text-ink-3">Fin de las sugerencias de hoy.</p>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>{paused && <PauseScreen onBack={() => setPaused(false)} />}</AnimatePresence>
    </div>
  );
}

function Checkpoint({ first, onContinue, onPause }: { first: boolean; onContinue: () => void; onPause: () => void }) {
  const { seconds } = useUsage();
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-3 my-5 rounded-3xl border border-calm/20 bg-calm-soft p-5 text-center">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-calm">{first ? "Lo más importante" : "Otro bloque visto"}</p>
      <p className="display mt-2 text-[22px] leading-tight text-balance">Ya viste las novedades más importantes.</p>
      <p className="mt-1 text-[13px] text-ink-2">¿Querés seguir o hacer una pausa?</p>
      <p className="mt-2 text-[11px] text-ink-3">Hoy: {formatDuration(seconds)} en la app</p>
      <div className="mt-4 flex justify-center gap-2">
        <button type="button" onClick={onPause} className="btn-ghost !bg-surface !px-4 !text-[13px]">
          Hacer una pausa
        </button>
        <button type="button" onClick={onContinue} className="btn-calm !px-4 !text-[13px]">
          Seguir viendo
        </button>
      </div>
    </motion.div>
  );
}

function PauseScreen({ onBack }: { onBack: () => void }) {
  return (
    <motion.div
      className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-surface px-8 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="relative grid size-40 place-items-center">
        <motion.span
          className="absolute inset-0 rounded-full bg-calm/15"
          animate={{ scale: [0.75, 1, 0.75] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.span
          className="absolute inset-6 rounded-full bg-calm/20"
          animate={{ scale: [0.8, 1, 0.8] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <Coffee className="relative size-8 text-calm" strokeWidth={1.5} />
      </div>
      <p className="display mt-6 text-[28px] leading-tight">Buen momento para cortar</p>
      <p className="mt-2 max-w-[260px] text-[13px] text-ink-2">Respirá con el círculo: inhalá cuando crece, exhalá cuando se achica. Tus guardados te esperan cuando vuelvas.</p>
      <button type="button" onClick={onBack} className="btn-ghost mt-6 !text-[13px]">
        Volver al feed
      </button>
    </motion.div>
  );
}
