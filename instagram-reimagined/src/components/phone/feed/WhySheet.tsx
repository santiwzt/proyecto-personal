import { BellOff, Clock, EyeOff, Megaphone, Shuffle, Sparkles, TrendingUp, UserRound, Users } from "lucide-react";
import type { ComponentType } from "react";
import { postById } from "@/data/posts";
import { userById } from "@/data/users";
import { useApp } from "@/state/app-state";
import { explainPost, INTEREST_LABELS, type Reason } from "@/lib/algorithm";
import { Sheet } from "@/components/ui/Sheet";
import { usePhone } from "../phone-context";

const ICONS: Record<Reason["icon"], ComponentType<{ className?: string }>> = {
  friend: Users,
  follow: UserRound,
  interest: Sparkles,
  popular: TrendingUp,
  ad: Megaphone,
  recent: Clock,
  diversity: Shuffle,
};

/**
 * Actual: menú largo con una explicación vaga al final.
 * Ético: "¿Por qué estoy viendo esto?" claro, con controles que cambian el feed.
 */
export function WhySheet({ postId, onClose }: { postId: string | null; onClose: () => void }) {
  const { version, toast, openInterests } = usePhone();
  const { settings, update } = useApp();
  const post = postId ? postById(postId) : undefined;

  if (version === "actual") {
    return (
      <Sheet open={!!post} onClose={onClose} title="Opciones">
        <ul className="divide-y divide-line/[0.07] text-[14px]">
          {["Agregar a favoritos", "Dejar de seguir", "Ocultar", "Copiar enlace", "Compartir en…", "Código QR", "Información de la cuenta", "Denunciar"].map((o) => (
            <li key={o}>
              <button type="button" className="w-full py-3 text-left" onClick={() => { toast(`${o}: acción simulada`); onClose(); }}>
                {o}
              </button>
            </li>
          ))}
          <li className="py-3">
            <p className="font-medium">Por qué ves esta publicación</p>
            <p className="mt-1 text-[12px] text-ink-2">Esta publicación se muestra según tu actividad en la app y otros factores.</p>
          </li>
        </ul>
      </Sheet>
    );
  }

  if (!post) return <Sheet open={false} onClose={onClose} title="">{null}</Sheet>;
  const reasons = explainPost(post, { mode: settings.feedMode, interests: settings.interests });
  const author = userById(post.authorId);
  const topic = INTEREST_LABELS[post.topic];
  const isLess = settings.lessOf.includes(post.topic);

  return (
    <Sheet open={!!post} onClose={onClose} title="¿Por qué estoy viendo esto?">
      <p className="text-[12.5px] text-ink-2">
        Publicación de <b className="text-ink">{author.handle}</b> · Tema: <b className="text-ink">{topic}</b>
      </p>
      <ul className="mt-3 space-y-2">
        {reasons.map((r) => {
          const Icon = ICONS[r.icon];
          return (
            <li key={r.text} className="flex gap-3 rounded-2xl bg-surface-2 p-3 text-[13px] leading-snug">
              <Icon className="mt-0.5 size-4 shrink-0 text-calm" />
              {r.text}
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-[11.5px] text-ink-3">
        Lo que <b>no</b> usamos para ordenar tu feed: cuánto tiempo te quedás mirando, a qué hora estás más vulnerable ni si algo te genera enojo.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          className="btn-ghost !px-3 !text-[12.5px]"
          onClick={() => {
            update({ lessOf: isLess ? settings.lessOf.filter((t) => t !== post.topic) : [...settings.lessOf, post.topic] });
            toast(isLess ? `Volvés a ver ${topic} con normalidad` : `Vas a ver menos de ${topic}`);
            onClose();
          }}
        >
          <EyeOff className="size-4" /> {isLess ? `Ver ${topic} otra vez` : `Ver menos de ${topic}`}
        </button>
        <button
          type="button"
          className="btn-ghost !px-3 !text-[12.5px]"
          onClick={() => {
            update({ feedMode: settings.feedMode === "cronologico" ? "personalizado" : "cronologico" });
            toast(settings.feedMode === "cronologico" ? "Feed personalizado activado" : "Feed cronológico activado");
            onClose();
          }}
        >
          <Clock className="size-4" /> {settings.feedMode === "cronologico" ? "Usar personalizado" : "Pasar a cronológico"}
        </button>
        <button type="button" className="btn-ghost col-span-2 !text-[12.5px]" onClick={() => { onClose(); openInterests(); }}>
          <BellOff className="size-4" /> Ajustar mis intereses
        </button>
      </div>
    </Sheet>
  );
}
