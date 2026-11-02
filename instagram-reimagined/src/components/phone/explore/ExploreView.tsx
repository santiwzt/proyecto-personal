import { Search, Shuffle, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { POSTS } from "@/data/posts";
import { useApp } from "@/state/app-state";
import { ALL_INTERESTS, diversify, INTEREST_LABELS } from "@/lib/algorithm";
import { cn } from "@/lib/format";
import type { Interest, Post } from "@/types";
import { SceneArt } from "@/components/art/SceneArt";
import { usePhone } from "../phone-context";

export function ExploreView() {
  const { version } = usePhone();
  return version === "etico" ? <EthicalExplore /> : <LegacyExplore />;
}

function Tile({ p, tall, onClick, badge }: { p: Post; tall?: boolean; onClick?: () => void; badge?: string }) {
  return (
    <button type="button" onClick={onClick} className={cn("relative overflow-hidden bg-surface-2", tall ? "row-span-2" : "aspect-square")}>
      <SceneArt scene={p.scene} palette={p.palette} seed={p.id + (tall ? "t" : "")} className="media h-full w-full" />
      {badge && <span className="absolute left-1.5 top-1.5 rounded-full bg-black/45 px-2 py-0.5 text-[9.5px] font-medium text-white backdrop-blur">{badge}</span>}
    </button>
  );
}

/** Explorar actual: grilla infinita dominada por lo más viral y por el último tema que miraste. */
function LegacyExplore() {
  const { openComments } = usePhone();
  const [pages, setPages] = useState(2);
  // Simula la "burbuja": el tema más viral (deportes/fitness) se repite.
  const viral = useMemo(() => [...POSTS].sort((a, b) => b.likes - a.likes), []);
  const items = Array.from({ length: pages * 9 }, (_, i) => {
    const p = i % 3 === 0 ? POSTS.find((x) => x.authorId === "fit")! : viral[i % viral.length]!;
    return { ...p, id: `${p.id}~x${i}` };
  });
  return (
    <div
      className="no-scrollbar h-full overflow-y-auto"
      onScroll={(e) => {
        const el = e.currentTarget;
        if (el.scrollTop + el.clientHeight > el.scrollHeight - 300) setPages((n) => n + 1);
      }}
    >
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2 text-[13px] text-ink-3">
          <Search className="size-4" /> Buscar
        </div>
      </div>
      <div className="grid grid-cols-3 gap-0.5">
        {items.map((p, i) => (
          <Tile key={p.id} p={p} tall={i % 10 === 2} onClick={() => openComments(p.id.split("~")[0] ?? p.id)} badge={i % 3 === 0 ? "Tendencia" : undefined} />
        ))}
      </div>
      <div className="flex justify-center py-6">
        <span className="size-6 animate-spin rounded-full border-2 border-line/15 border-t-ink-2" aria-label="Cargando más" />
      </div>
    </div>
  );
}

/** Explorar ético: el usuario elige temas, hay diversidad garantizada y un final. */
function EthicalExplore() {
  const { settings, update } = useApp();
  const { openWhy } = usePhone();
  const [topic, setTopic] = useState<Interest | "todo">("todo");
  const pool = POSTS.filter((p) => !settings.lessOf.includes(p.topic));
  const byInterest = (p: Post) => Number(settings.interests.includes(p.topic));
  const filtered =
    topic === "todo"
      ? diversify(pool.filter((p) => p.source !== "publicidad").sort((a, b) => byInterest(b) - byInterest(a)), 1)
      : pool.filter((p) => p.topic === topic);
  const different = pool.filter((p) => !settings.interests.includes(p.topic) && p.source !== "publicidad").slice(0, 3);

  return (
    <div className="no-scrollbar h-full overflow-y-auto pb-6">
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2 text-[13px] text-ink-3">
          <Search className="size-4" /> Buscar personas, temas o lugares
        </div>
      </div>
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-3 pb-3">
        {(["todo", ...ALL_INTERESTS.filter((t) => t !== "amigos")] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTopic(t)} className={cn("chip shrink-0", topic === t ? "border-ink bg-ink text-bg" : "text-ink-2")}>
            {t === "todo" ? "Para vos" : INTEREST_LABELS[t]}
          </button>
        ))}
      </div>
      {topic !== "todo" && (
        <div className="mx-3 mb-3 flex items-center justify-between rounded-2xl bg-surface-2 px-3 py-2 text-[12px]">
          <span className="text-ink-2">{settings.interests.includes(topic) ? "Es uno de tus intereses" : "No está en tus intereses"}</span>
          <button
            type="button"
            className="font-semibold text-calm"
            onClick={() => update({ interests: settings.interests.includes(topic) ? settings.interests.filter((x) => x !== topic) : [...settings.interests, topic] })}
          >
            {settings.interests.includes(topic) ? "Quitar" : "Agregar"}
          </button>
        </div>
      )}
      <div className="grid grid-cols-3 gap-0.5">
        {filtered.map((p) => (
          <Tile key={p.id} p={p} onClick={() => openWhy(p.id)} />
        ))}
      </div>
      {filtered.length === 0 && <p className="px-4 py-6 text-center text-[12.5px] text-ink-2">No hay publicaciones de este tema hoy.</p>}

      {topic === "todo" && different.length > 0 && (
        <section className="mt-5 px-3">
          <h3 className="flex items-center gap-1.5 text-[13px] font-semibold">
            <Shuffle className="size-4 text-calm" /> Algo distinto
          </h3>
          <p className="text-[11.5px] text-ink-3">Temas fuera de tus intereses, para no quedarte siempre con lo mismo.</p>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {different.map((p) => (
              <div key={p.id} className="overflow-hidden rounded-xl">
                <Tile p={p} onClick={() => openWhy(p.id)} badge={INTEREST_LABELS[p.topic]} />
              </div>
            ))}
          </div>
        </section>
      )}
      <p className="flex items-center justify-center gap-1.5 px-4 pt-6 text-center text-[12px] text-ink-3">
        <Sparkles className="size-3.5" /> Eso es todo por hoy en Explorar.
      </p>
    </div>
  );
}
