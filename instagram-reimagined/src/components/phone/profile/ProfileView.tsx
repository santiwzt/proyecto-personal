import { ArrowDownRight, BarChart3, Bookmark, Grid3x3, Leaf, Lock, TrendingUp } from "lucide-react";
import { useState } from "react";
import { POSTS, REELS } from "@/data/posts";
import { ME, PALETTES } from "@/data/users";
import { useApp } from "@/state/app-state";
import { cn, compactNumber } from "@/lib/format";
import type { Palette, SceneKind } from "@/types";
import { Avatar } from "@/components/art/Avatar";
import { SceneArt } from "@/components/art/SceneArt";
import { Sheet } from "@/components/ui/Sheet";
import { usePhone } from "../phone-context";

export interface MyPost {
  id: string;
  scene: SceneKind;
  palette: Palette;
  likes: number;
  friendComments: number;
  saves: number;
  shares: number;
  title: string;
}

export const MY_POSTS: MyPost[] = [
  { id: "m1", scene: "books", palette: PALETTES.sand, likes: 12, friendComments: 5, saves: 3, shares: 2, title: "Libro de Literatura" },
  { id: "m2", scene: "mate", palette: PALETTES.terracota, likes: 47, friendComments: 9, saves: 1, shares: 4, title: "Mates antes de Historia" },
  { id: "m3", scene: "night", palette: PALETTES.ink, likes: 71, friendComments: 3, saves: 8, shares: 6, title: "Saturno desde la terraza" },
  { id: "m4", scene: "forest", palette: PALETTES.moss, likes: 38, friendComments: 4, saves: 2, shares: 1, title: "Excursión del curso" },
  { id: "m5", scene: "stage", palette: PALETTES.neon, likes: 55, friendComments: 7, saves: 0, shares: 3, title: "Banda de Tomi" },
  { id: "m6", scene: "ocean", palette: PALETTES.lagoon, likes: 64, friendComments: 2, saves: 4, shares: 2, title: "Verano en la costa" },
];

export function ProfileView() {
  const { version, openMetrics, openWellbeing } = usePhone();
  const { saved } = useApp();
  const ethical = version === "etico";
  const [tab, setTab] = useState<"posts" | "saved">("posts");

  const savedItems = [
    ...POSTS.filter((p) => saved[p.id]).map((p) => ({ id: p.id, scene: p.scene, palette: p.palette })),
    ...REELS.filter((r) => saved[r.id]).map((r) => ({ id: r.id, scene: r.scene, palette: r.palette })),
  ];

  return (
    <div className="no-scrollbar h-full overflow-y-auto pb-6">
      <div className="flex items-center gap-5 px-4 pt-1">
        <Avatar user={ME} size={ethical ? 72 : 82} ring={ethical ? "none" : "story"} />
        {ethical ? (
          <div className="min-w-0">
            <p className="text-[15px] font-semibold">{ME.name}</p>
            <p className="mt-0.5 text-[11.5px] text-ink-3">
              {MY_POSTS.length} publicaciones · {ME.followers} seguidores · {ME.following} seguidos
            </p>
          </div>
        ) : (
          <div className="grid flex-1 grid-cols-3 text-center">
            {[
              [MY_POSTS.length, "publicaciones"],
              [ME.followers, "seguidores"],
              [ME.following, "seguidos"],
            ].map(([n, l]) => (
              <div key={l}>
                <p className="text-[19px] font-bold leading-tight">{compactNumber(Number(n))}</p>
                <p className="text-[12px]">{l}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="px-4 pt-3 text-[13px] leading-snug">
        {!ethical && <p className="font-semibold">{ME.name}</p>}
        <p className="text-ink-2">{ME.bio}</p>
      </div>

      {ethical ? (
        <div className="grid grid-cols-2 gap-2 px-4 pt-3">
          <button type="button" onClick={openMetrics} className="btn-ghost !px-2 !py-2 !text-[12.5px]">
            <Lock className="size-3.5" /> Mis métricas
          </button>
          <button type="button" onClick={openWellbeing} className="btn-ghost !px-2 !py-2 !text-[12.5px]">
            <Leaf className="size-3.5" /> Bienestar
          </button>
        </div>
      ) : (
        <>
          <div className="mx-4 mt-3 flex items-center gap-2.5 rounded-xl bg-surface-2 px-3 py-2.5 text-[12px]">
            <ArrowDownRight className="size-4 shrink-0 text-heart" />
            <span>
              Tu última publicación tuvo <b>32% menos me gusta</b> que la anterior. ¡Publicá a las 20 h para llegar a más gente!
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 px-4 pt-2.5">
            <button type="button" className="rounded-lg bg-surface-2 py-1.5 text-[12.5px] font-semibold" onClick={openMetrics}>
              Panel profesional
            </button>
            <button type="button" className="flex items-center justify-center gap-1 rounded-lg bg-surface-2 py-1.5 text-[12.5px] font-semibold" onClick={openMetrics}>
              <TrendingUp className="size-3.5" /> +12 seguidores
            </button>
          </div>
        </>
      )}

      <div className="mt-4 flex border-b border-line/[0.07]">
        {(
          [
            ["posts", Grid3x3, "Publicaciones"],
            ["saved", Bookmark, "Guardados"],
          ] as const
        ).map(([id, Icon, label]) => (
          <button key={id} type="button" aria-label={label} onClick={() => setTab(id)} className={cn("flex flex-1 justify-center border-b-2 py-2.5", tab === id ? "border-ink" : "border-transparent text-ink-3")}>
            <Icon className="size-5" strokeWidth={1.8} />
          </button>
        ))}
      </div>

      {tab === "posts" ? (
        <div className="grid grid-cols-3 gap-0.5">
          {MY_POSTS.map((p) => (
            <div key={p.id} className="relative aspect-square overflow-hidden">
              <SceneArt scene={p.scene} palette={p.palette} seed={p.id} className="media h-full w-full" />
              {!ethical && <span className="absolute bottom-1 left-1.5 text-[11px] font-semibold text-white drop-shadow">♥ {p.likes}</span>}
            </div>
          ))}
        </div>
      ) : savedItems.length ? (
        <div className="grid grid-cols-3 gap-0.5">
          {savedItems.map((p) => (
            <div key={p.id} className="aspect-square overflow-hidden">
              <SceneArt scene={p.scene} palette={p.palette} seed={p.id} className="media h-full w-full" />
            </div>
          ))}
        </div>
      ) : (
        <p className="px-6 py-10 text-center text-[12.5px] text-ink-2">Todavía no guardaste nada. Tocá el marcador de una publicación o reel.</p>
      )}
    </div>
  );
}

export function MetricsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { version } = usePhone();
  const ethical = version === "etico";
  const max = Math.max(...MY_POSTS.map((p) => p.friendComments + p.saves + p.shares));
  const meaningful = MY_POSTS.reduce((a, p) => a + p.friendComments + p.saves + p.shares, 0);

  if (!ethical) {
    return (
      <Sheet open={open} onClose={onClose} title="Panel profesional">
        <div className="grid grid-cols-2 gap-2">
          {[
            ["Cuentas alcanzadas", "1.204", "+38%"],
            ["Seguidores", "412", "+12"],
            ["Me gusta", "287", "-32%"],
            ["Ranking entre amigos", "#4", "↓ 2"],
          ].map(([l, n, d]) => (
            <div key={l} className="rounded-2xl bg-surface-2 p-3">
              <p className="text-[11px] text-ink-2">{l}</p>
              <p className="text-xl font-bold">{n}</p>
              <p className={cn("text-[11px] font-semibold", d?.startsWith("-") || d?.startsWith("↓") ? "text-heart" : "text-emerald-500")}>{d}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[12px] text-ink-2">💡 Consejo: publicá más seguido para no perder alcance. Las cuentas que publican todos los días crecen más rápido.</p>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onClose={onClose} title="Tus métricas privadas" tall>
      <p className="flex items-center gap-1.5 rounded-xl bg-calm-soft px-3 py-2 text-[11.5px] text-ink-2">
        <Lock className="size-3.5 text-calm" /> Solo vos podés ver esto. No se muestran en tu perfil.
      </p>
      <div className="mt-3 rounded-2xl border border-line/[0.07] p-3.5">
        <p className="text-[11px] text-ink-2">Interacciones significativas esta semana</p>
        <p className="display text-[34px] leading-none">{meaningful}</p>
        <p className="mt-1 text-[11.5px] text-ink-3">Comentarios de amigos, guardados y veces que alguien compartió tu publicación con otra persona.</p>
      </div>
      <p className="eyebrow mb-2 mt-4 flex items-center gap-1.5">
        <BarChart3 className="size-3.5" /> Por publicación
      </p>
      <ul className="space-y-2.5">
        {MY_POSTS.map((p) => {
          const m = p.friendComments + p.saves + p.shares;
          return (
            <li key={p.id} className="flex items-center gap-3">
              <span className="size-10 shrink-0 overflow-hidden rounded-lg">
                <SceneArt scene={p.scene} palette={p.palette} seed={p.id} className="h-full w-full" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between text-[12px]">
                  <span className="truncate font-medium">{p.title}</span>
                  <span className="text-ink-3">{p.likes} me gusta</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full rounded-full bg-calm" style={{ width: `${(m / max) * 100}%` }} />
                </div>
                <p className="mt-0.5 text-[10.5px] text-ink-3">
                  {p.friendComments} charlas · {p.saves} guardados · {p.shares} compartidos
                </p>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-[11.5px] text-ink-3">No comparamos tus números con los de otras personas ni te decimos a qué hora "conviene" publicar.</p>
    </Sheet>
  );
}
