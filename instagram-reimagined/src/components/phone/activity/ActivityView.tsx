import { AnimatePresence, motion } from "framer-motion";
import { BellRing, CalendarClock, ChevronDown, Inbox, MessageCircle, Settings2 } from "lucide-react";
import { useState } from "react";
import { NOTIFICATIONS } from "@/data/notifications";
import { userById } from "@/data/users";
import { useApp } from "@/state/app-state";
import { buildDigest, CATEGORY_LABELS, nextDigestHour, SCHEDULE_LABELS } from "@/lib/notifications";
import { cn, timeAgo } from "@/lib/format";
import type { AppNotification, NotificationCategory, NotifSchedule } from "@/types";
import { Avatar } from "@/components/art/Avatar";
import { SceneArt } from "@/components/art/SceneArt";
import { Toggle } from "@/components/ui/Toggle";
import { Sheet } from "@/components/ui/Sheet";
import { postById } from "@/data/posts";
import { usePhone } from "../phone-context";

export function ActivityView() {
  const { version } = usePhone();
  return version === "etico" ? <EthicalActivity /> : <LegacyActivity />;
}

/* ---------------------------- Actual ---------------------------- */

function LegacyActivity() {
  const groups: [string, AppNotification[]][] = [
    ["Nuevo", NOTIFICATIONS.slice(0, 5)],
    ["Hoy", NOTIFICATIONS.slice(5, 9)],
    ["Esta semana", NOTIFICATIONS.slice(9)],
  ];
  return (
    <div className="no-scrollbar h-full overflow-y-auto pb-6">
      <div className="mx-3 mb-2 flex items-center gap-3 rounded-2xl bg-heart/10 px-3 py-2.5">
        <span className="grid size-9 place-items-center rounded-full bg-heart text-[13px] font-bold text-white">23</span>
        <div className="text-[12.5px] leading-tight">
          <p className="font-semibold">Tenés 23 notificaciones nuevas</p>
          <p className="text-ink-2">¡Mirá lo que te perdiste mientras no estabas!</p>
        </div>
      </div>
      {groups.map(([title, list]) => (
        <section key={title}>
          <h3 className="px-4 pb-1 pt-3 text-[15px] font-bold">{title}</h3>
          {list.map((n) => (
            <Row key={n.id} n={n} text={n.legacyText} unread={title === "Nuevo"} />
          ))}
        </section>
      ))}
    </div>
  );
}

function Row({ n, text, unread, calm }: { n: AppNotification; text: string; unread?: boolean; calm?: boolean }) {
  const actor = userById(n.actorIds[0] ?? "lu");
  const post = n.postId ? postById(n.postId) : undefined;
  return (
    <div className={cn("flex items-center gap-3 px-4 py-2.5", unread && "bg-[#0095F6]/[0.06]")}>
      <span className="relative">
        <Avatar user={actor} size={40} />
        {n.actorIds[1] && (
          <span className="absolute -bottom-1 -right-1 rounded-full border-2 border-surface">
            <Avatar user={userById(n.actorIds[1])} size={20} />
          </span>
        )}
      </span>
      <p className="min-w-0 flex-1 text-[13px] leading-snug">
        {text} <span className="text-ink-3">{timeAgo(n.minutesAgo)}</span>
      </p>
      {post ? (
        <span className="size-10 shrink-0 overflow-hidden rounded-md">
          <SceneArt scene={post.scene} palette={post.palette} seed={post.id} className="media h-full w-full" />
        </span>
      ) : n.type === "seguidor" || n.type === "sugerencia" ? (
        !calm && <span className="rounded-lg bg-[#0095F6] px-3 py-1.5 text-[12px] font-semibold text-white">Seguir</span>
      ) : null}
    </div>
  );
}

/* ---------------------------- Ético ---------------------------- */

function EthicalActivity() {
  const { settings, update } = useApp();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [expanded, setExpanded] = useState<NotificationCategory | null>(null);
  const digest = buildDigest(NOTIFICATIONS, settings.notifCategories);
  const hour = new Date().getHours() + new Date().getMinutes() / 60;
  const next = nextDigestHour(settings.notifSchedule, hour);

  return (
    <div className="no-scrollbar relative h-full overflow-y-auto pb-6">
      <div className="mx-3 flex items-center gap-3 rounded-2xl bg-calm-soft px-3.5 py-3">
        <CalendarClock className="size-5 shrink-0 text-calm" />
        <div className="min-w-0 flex-1 text-[12.5px] leading-tight">
          <p className="font-semibold">{SCHEDULE_LABELS[settings.notifSchedule].title}</p>
          <p className="mt-0.5 text-ink-2">Próximo resumen a las {String(next).padStart(2, "0")}:00</p>
        </div>
        <button type="button" onClick={() => setSettingsOpen(true)} className="grid size-8 place-items-center rounded-full bg-surface" aria-label="Configurar notificaciones">
          <Settings2 className="size-4" />
        </button>
      </div>

      <section className="mt-4">
        <h3 className="flex items-center gap-2 px-4 pb-1 text-[13px] font-semibold">
          <MessageCircle className="size-4 text-calm" /> Importante: personas que te escribieron
        </h3>
        <p className="px-4 pb-1 text-[11.5px] text-ink-3">Mensajes, menciones y comentarios de gente que conocés.</p>
        {digest.important.length ? digest.important.map((n) => <Row key={n.id} n={n} text={n.calmText} calm />) : <p className="px-4 py-3 text-[12.5px] text-ink-2">Nada pendiente.</p>}
      </section>

      <section className="mt-4">
        <h3 className="flex items-center gap-2 px-4 pb-2 text-[13px] font-semibold">
          <Inbox className="size-4 text-calm" /> Resumen
        </h3>
        <div className="mx-3 overflow-hidden rounded-2xl border border-line/[0.07]">
          {digest.groups.map((g) => (
            <div key={g.category} className="border-b border-line/[0.06] last:border-0">
              <button type="button" onClick={() => setExpanded(expanded === g.category ? null : g.category)} className="flex w-full items-center gap-3 px-3.5 py-3 text-left">
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium">{g.summary}</span>
                  <span className="block text-[11px] text-ink-3">{CATEGORY_LABELS[g.category]}</span>
                </span>
                <ChevronDown className={cn("size-4 text-ink-3 transition-transform", expanded === g.category && "rotate-180")} />
              </button>
              <AnimatePresence initial={false}>
                {expanded === g.category && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                    {g.items.map((n) => (
                      <Row key={n.id} n={n} text={n.calmText} calm />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
          {digest.groups.length === 0 && <p className="px-4 py-3 text-[12.5px] text-ink-2">No hay nada en el resumen.</p>}
        </div>
        {digest.muted > 0 && (
          <p className="px-4 pt-2 text-[11.5px] text-ink-3">
            {digest.muted} {digest.muted === 1 ? "aviso silenciado" : "avisos silenciados"} por tus preferencias (no se pierden: podés activarlos cuando quieras).
          </p>
        )}
      </section>

      <NotifSettings open={settingsOpen} onClose={() => setSettingsOpen(false)} schedule={settings.notifSchedule} categories={settings.notifCategories} onSchedule={(notifSchedule) => update({ notifSchedule })} onCategory={(c, v) => update({ notifCategories: { ...settings.notifCategories, [c]: v } })} />
    </div>
  );
}

interface NotifSettingsProps {
  open: boolean;
  onClose: () => void;
  schedule: NotifSchedule;
  categories: Record<NotificationCategory, boolean>;
  onSchedule: (s: NotifSchedule) => void;
  onCategory: (c: NotificationCategory, v: boolean) => void;
}

export function NotifSettings({ open, onClose, schedule, categories, onSchedule, onCategory }: NotifSettingsProps) {
  return (
    <Sheet open={open} onClose={onClose} title="Cuándo y qué recibir" tall>
      <p className="eyebrow mb-2">Cuándo</p>
      <div className="space-y-2">
        {(Object.keys(SCHEDULE_LABELS) as NotifSchedule[]).map((s) => (
          <button key={s} type="button" onClick={() => onSchedule(s)} className={cn("flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-colors", schedule === s ? "border-calm/50 bg-calm-soft" : "border-line/[0.08]")}>
            <BellRing className={cn("mt-0.5 size-4 shrink-0", schedule === s ? "text-calm" : "text-ink-3")} />
            <span>
              <span className="block text-[13px] font-medium">{SCHEDULE_LABELS[s].title}</span>
              <span className="block text-[11.5px] leading-snug text-ink-2">{SCHEDULE_LABELS[s].detail}</span>
            </span>
          </button>
        ))}
      </div>
      <p className="eyebrow mb-1 mt-5">Qué</p>
      <div className="divide-y divide-line/[0.06]">
        {(Object.keys(CATEGORY_LABELS) as NotificationCategory[]).map((c) => (
          <Toggle key={c} label={CATEGORY_LABELS[c]} checked={categories[c]} onChange={(v) => onCategory(c, v)} />
        ))}
      </div>
      <p className="mt-3 text-[11.5px] text-ink-3">Nunca usamos frases como "¡No te lo pierdas!" ni contadores rojos para que vuelvas a abrir la app.</p>
    </Sheet>
  );
}
