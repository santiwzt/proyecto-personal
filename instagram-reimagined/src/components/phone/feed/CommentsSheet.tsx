import { Heart } from "lucide-react";
import { useState } from "react";
import { postById } from "@/data/posts";
import { ME, userById } from "@/data/users";
import { useApp } from "@/state/app-state";
import { compactNumber, timeAgo } from "@/lib/format";
import { Avatar } from "@/components/art/Avatar";
import { Sheet } from "@/components/ui/Sheet";
import { usePhone } from "../phone-context";

export function CommentsSheet({ postId, onClose }: { postId: string | null; onClose: () => void }) {
  const { version } = usePhone();
  const { comments: extra, addComment } = useApp();
  const [text, setText] = useState("");
  const post = postId ? postById(postId) : undefined;
  const ethical = version === "etico";

  const all = post ? [...post.comments, ...(extra[post.id] ?? [])] : [];
  // Ético: primero personas que conocés; actual: primero lo más popular.
  const sorted = [...all].sort((a, b) =>
    ethical
      ? Number(!!userById(b.authorId).friend) - Number(!!userById(a.authorId).friend) || a.minutesAgo - b.minutesAgo
      : (b.likes ?? 0) - (a.likes ?? 0),
  );

  return (
    <Sheet open={!!post} onClose={onClose} title="Comentarios" tall>
      {ethical && <p className="mb-3 rounded-xl bg-calm-soft px-3 py-2 text-[11.5px] text-ink-2">Primero ves comentarios de personas que conocés, no los más populares.</p>}
      {sorted.length === 0 && <p className="py-6 text-center text-sm text-ink-2">Todavía no hay comentarios.</p>}
      <ul className="space-y-4">
        {sorted.map((c) => {
          const u = userById(c.authorId);
          return (
            <li key={c.id} className="flex gap-2.5">
              <Avatar user={u} size={30} />
              <div className="min-w-0 flex-1 text-[13px] leading-snug">
                <p>
                  <span className="mr-1.5 font-semibold">{u.handle}</span>
                  <span className="text-[11px] text-ink-3">{timeAgo(c.minutesAgo)}</span>
                  {ethical && u.friend && u.id !== "me" && <span className="ml-1.5 rounded bg-calm-soft px-1 text-[10px] font-medium text-calm">Amistad</span>}
                </p>
                <p className="mt-0.5 text-pretty">{c.text}</p>
              </div>
              {!ethical && (
                <span className="flex flex-col items-center text-[10px] text-ink-3">
                  <Heart className="size-3.5" />
                  {c.likes ? compactNumber(c.likes) : ""}
                </span>
              )}
            </li>
          );
        })}
      </ul>
      {post && (
        <form
          className="sticky bottom-0 mt-4 flex items-center gap-2 border-t border-line/[0.07] bg-surface pt-3"
          onSubmit={(e) => {
            e.preventDefault();
            const t = text.trim();
            if (!t) return;
            addComment(post.id, t.slice(0, 220));
            setText("");
          }}
        >
          <Avatar user={ME} size={28} />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={220}
            aria-label="Escribí un comentario"
            placeholder={`Comentá como ${ME.handle}…`}
            className="min-w-0 flex-1 rounded-full bg-surface-2 px-3.5 py-2 text-[13px] outline-none placeholder:text-ink-3"
          />
          <button type="submit" disabled={!text.trim()} className="text-[13px] font-semibold text-[#0095F6] disabled:opacity-40">
            Publicar
          </button>
        </form>
      )}
    </Sheet>
  );
}
