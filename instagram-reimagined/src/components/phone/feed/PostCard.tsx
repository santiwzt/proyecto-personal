import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheck, Bookmark, Ellipsis, Heart, Info, MessageCircle, Send } from "lucide-react";
import { memo, useRef, useState } from "react";
import type { Post } from "@/types";
import { useApp } from "@/state/app-state";
import { userById } from "@/data/users";
import { baseId } from "@/lib/algorithm";
import { cn, compactNumber, hash, timeAgo } from "@/lib/format";
import { Avatar } from "@/components/art/Avatar";
import { SceneArt } from "@/components/art/SceneArt";
import { usePhone } from "../phone-context";

const FRIENDS = ["lu", "tomi", "martu", "fran", "cami", "nacho"];

function PostCardImpl({ post }: { post: Post }) {
  const { version, calm, openComments, openWhy, toast } = usePhone();
  const { liked, saved, toggleLike, toggleSave, settings, comments: extra } = useApp();
  const id = baseId(post.id);
  const author = userById(post.authorId);
  const isLiked = !!liked[id];
  const isSaved = !!saved[id];
  const ethical = version === "etico";
  const [burst, setBurst] = useState(0);
  const lastTap = useRef(0);

  const likeCount = post.likes + (isLiked ? 1 : 0);
  const totalComments = post.comments.length + (extra[id]?.length ?? 0);
  const friend = userById(FRIENDS[hash(id) % FRIENDS.length] ?? "lu");
  const showCount = !ethical || !settings.hideLikes;

  const onMediaTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      toggleLike(id, true);
      setBurst((b) => b + 1);
    }
    lastTap.current = now;
  };

  const label =
    post.source === "publicidad"
      ? "Publicidad"
      : post.source === "sugerido"
        ? ethical
          ? "Sugerencia · no la seguís"
          : "Sugerencias para vos"
        : post.location;

  return (
    <article className="border-b border-line/[0.06] pb-3">
      <header className="flex items-center gap-2.5 px-3 py-2.5">
        <Avatar user={author} size={32} ring={author.friend ? "story" : "none"} />
        <div className="min-w-0 flex-1 leading-tight">
          <div className="flex items-center gap-1 text-[13px] font-semibold">
            <span className="truncate">{author.handle}</span>
            {author.verified && <BadgeCheck className="size-3.5 shrink-0 fill-[#0095F6] text-white" />}
            {!ethical && post.source === "sugerido" && <span className="ml-1 text-[13px] font-semibold text-[#0095F6]">Seguir</span>}
          </div>
          {label && (
            <div className={cn("truncate text-[11.5px]", post.source === "publicidad" && ethical ? "font-medium text-ink" : "text-ink-2")}>{label}</div>
          )}
        </div>
        {ethical && (
          <button
            type="button"
            onClick={() => openWhy(id)}
            className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-surface-2 px-2 py-1 text-[11px] font-medium text-ink-2 hover:text-ink"
          >
            <Info className="size-3" /> ¿Por qué?
          </button>
        )}
        <button type="button" aria-label="Más opciones" onClick={() => openWhy(id)} className="grid size-8 place-items-center rounded-full hover:bg-surface-2">
          <Ellipsis className="size-5" />
        </button>
      </header>

      <div className="relative aspect-[4/5] w-full select-none overflow-hidden bg-surface-2" onClick={onMediaTap}>
        <SceneArt scene={post.scene} palette={post.palette} seed={id} className="media h-full w-full" />
        {post.source === "publicidad" && !ethical && (
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-[#0095F6] px-3 py-2.5 text-[13px] font-semibold text-white">
            Comprar ahora <span aria-hidden>›</span>
          </div>
        )}
        <AnimatePresence>
          {burst > 0 && (
            <motion.div
              key={burst}
              className="pointer-events-none absolute inset-0 grid place-items-center"
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: [0, 1, 1, 0], scale: ethical ? [0.6, 1, 1, 0.9] : [0.4, 1.25, 1, 1.1] }}
              transition={{ duration: ethical ? 0.7 : 0.9, times: [0, 0.2, 0.7, 1] }}
              onAnimationComplete={() => setBurst(0)}
            >
              <Heart className={cn("drop-shadow-xl", ethical ? "size-16 fill-white/90 text-white/90" : "size-24 fill-white text-white")} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-1 px-1.5 pt-1.5">
        <motion.button
          type="button"
          whileTap={{ scale: 0.85 }}
          aria-label={isLiked ? "Quitar me gusta" : "Me gusta"}
          aria-pressed={isLiked}
          onClick={() => toggleLike(id)}
          className="grid size-10 place-items-center"
        >
          <motion.span key={String(isLiked)} initial={{ scale: isLiked && !calm ? 0.6 : 1 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 15 }}>
            <Heart className={cn("size-[24px]", isLiked && (ethical ? "fill-calm text-calm" : "fill-heart text-heart"))} strokeWidth={1.8} />
          </motion.span>
        </motion.button>
        <button type="button" aria-label="Comentarios" onClick={() => openComments(id)} className="grid size-10 place-items-center">
          <MessageCircle className="size-[23px] -scale-x-100" strokeWidth={1.8} />
        </button>
        <button
          type="button"
          aria-label="Compartir"
          onClick={() => toast(ethical ? "Enviado a lu.rodriguez. Compartir con amigos cuenta como interacción significativa." : "Enviado ✓")}
          className="grid size-10 place-items-center"
        >
          <Send className="size-[22px]" strokeWidth={1.8} />
        </button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.85 }}
          aria-label={isSaved ? "Quitar de guardados" : "Guardar"}
          aria-pressed={isSaved}
          onClick={() => {
            toggleSave(id);
            if (!isSaved) toast(ethical ? "Guardado. Lo vas a encontrar en tu perfil, aunque cierres la sesión." : "Guardado en tu colección");
          }}
          className="ml-auto grid size-10 place-items-center"
        >
          <Bookmark className={cn("size-[23px]", isSaved && "fill-ink")} strokeWidth={1.8} />
        </motion.button>
      </div>

      <div className="space-y-1 px-3 text-[13px] leading-snug">
        {showCount ? (
          <p className={cn("font-semibold", ethical && "font-medium text-ink-2")}>
            {ethical ? `${compactNumber(likeCount)} me gusta` : (
              <>Le gusta a <span>{friend.handle}</span> y {compactNumber(likeCount - 1)} personas más</>
            )}
          </p>
        ) : (
          <p className="text-ink-2">
            {isLiked ? "Te gusta a vos" : `Le gusta a ${friend.handle}`} y a otras personas
          </p>
        )}
        <p className="text-pretty">
          <span className="mr-1 font-semibold">{author.handle}</span>
          {post.caption}
        </p>
        {totalComments > 0 && (
          <button type="button" onClick={() => openComments(id)} className="text-ink-3">
            {totalComments === 1 ? "Ver 1 comentario" : `Ver los ${totalComments} comentarios`}
          </button>
        )}
        <p className="text-[11px] text-ink-3">Hace {timeAgo(post.minutesAgo)}</p>
      </div>
    </article>
  );
}

export const PostCard = memo(PostCardImpl);
