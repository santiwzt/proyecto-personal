import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { POSTS } from "@/data/posts";
import { legacyFeedPage } from "@/lib/algorithm";
import type { Post } from "@/types";
import { PostCard } from "./PostCard";
import { StoriesBar } from "./StoriesBar";

/**
 * Feed "actual": scroll infinito. Cada vez que te acercás al final, se cargan
 * más publicaciones (mezcla de amigos, virales y publicidad). Nunca termina.
 */
export function LegacyFeed() {
  const scroller = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<Post[]>(() => legacyFeedPage(POSTS, 0));
  const [page, setPage] = useState(1);
  const pageRef = useRef(1);
  const [fresh, setFresh] = useState(false);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          const p = pageRef.current++;
          setItems((list) => [...list, ...legacyFeedPage(POSTS, p)]);
          setPage(p + 1);
        }
      },
      { root: scroller.current, rootMargin: "600px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // "Publicaciones nuevas": una invitación a seguir refrescando.
  useEffect(() => {
    const t = window.setTimeout(() => setFresh(true), 9000);
    return () => window.clearTimeout(t);
  }, [page]);

  return (
    <div className="relative h-full">
    <div ref={scroller} className="no-scrollbar h-full overflow-y-auto">
      <StoriesBar />
      <div className="border-t border-line/[0.06]">
        {items.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>
      <div ref={sentinel} className="flex justify-center py-6">
        <span className="size-6 animate-spin rounded-full border-2 border-line/15 border-t-ink-2" aria-label="Cargando más" />
      </div>
      <p className="sr-only">{page} páginas cargadas</p>
    </div>
      <AnimatePresence>
        {fresh && (
          <motion.button
            type="button"
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            onClick={() => {
              scroller.current?.scrollTo({ top: 0, behavior: "smooth" });
              setFresh(false);
            }}
            className="absolute left-1/2 top-2 z-20 ml-[-74px] flex items-center gap-1.5 rounded-full bg-[#0095F6] px-4 py-2 text-[12.5px] font-semibold text-white shadow-lift"
          >
            <ArrowUp className="size-3.5" /> Publicaciones nuevas
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
