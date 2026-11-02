import { Plus } from "lucide-react";
import { STORIES } from "@/data/posts";
import { ME, userById } from "@/data/users";
import { Avatar } from "@/components/art/Avatar";
import { usePhone } from "../phone-context";

export function StoriesBar() {
  const { openStory, version } = usePhone();
  // La versión ética muestra solo historias de amigos en la barra.
  const list = version === "etico" ? STORIES.filter((s) => userById(s.userId).friend) : STORIES;
  return (
    <div className="no-scrollbar flex gap-3 overflow-x-auto px-3 pb-3 pt-1">
      <div className="flex w-[66px] shrink-0 flex-col items-center gap-1">
        <span className="relative">
          <Avatar user={ME} size={60} />
          <span className="absolute -bottom-0.5 -right-0.5 grid size-5 place-items-center rounded-full border-2 border-surface bg-ink text-bg">
            <Plus className="size-3" strokeWidth={3} />
          </span>
        </span>
        <span className="w-full truncate text-center text-[11px] text-ink-2">Tu historia</span>
      </div>
      {list.map((s, i) => {
        const u = userById(s.userId);
        return (
          <button key={s.userId} type="button" onClick={() => openStory(i)} className="flex w-[66px] shrink-0 flex-col items-center gap-1">
            <Avatar user={u} size={58} ring="story" />
            <span className="w-full truncate text-center text-[11px]">{u.handle}</span>
          </button>
        );
      })}
    </div>
  );
}
