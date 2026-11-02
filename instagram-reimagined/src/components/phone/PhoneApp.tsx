import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { Clapperboard, Clock, Heart, House, Leaf, Lock, Menu, Search, Send } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { LIVE_PINGS } from "@/data/notifications";
import { ME } from "@/data/users";
import { useApp, useUsage } from "@/state/app-state";
import { cn, formatDuration, formatShort } from "@/lib/format";
import type { Version } from "@/types";
import { Avatar } from "@/components/art/Avatar";
import { StatusBar } from "./PhoneFrame";
import { PhoneCtx, usePhone as usePhoneSafe, type PhoneApi, type Tab } from "./phone-context";
import { LegacyFeed } from "./feed/LegacyFeed";
import { EthicalFeed } from "./feed/EthicalFeed";
import { CommentsSheet } from "./feed/CommentsSheet";
import { WhySheet } from "./feed/WhySheet";
import { InterestsSheet } from "./feed/InterestsSheet";
import { StoryViewer } from "./feed/StoryViewer";
import { ReelsView } from "./reels/ReelsView";
import { ActivityView } from "./activity/ActivityView";
import { ExploreView } from "./explore/ExploreView";
import { MetricsSheet, ProfileView } from "./profile/ProfileView";
import { WellbeingSheet } from "./WellbeingSheet";

interface Props {
  /** Si no se pasa, usa la versión elegida en el interruptor global. */
  version?: Version;
  initialTab?: Tab;
  /** Desactiva banners en vivo (útil en vistas previas estáticas). */
  quiet?: boolean;
  onTabChange?: (t: Tab) => void;
}

type SheetName = "wellbeing" | "interests" | "metrics" | null;

export function PhoneApp({ version: forced, initialTab = "inicio", quiet, onTabChange }: Props) {
  const app = useApp();
  const version = forced ?? app.version;
  const ethical = version === "etico";
  const calm = ethical && app.settings.wellbeingMode;

  const [tab, setTab] = useState<Tab>(initialTab);
  const [comments, setComments] = useState<string | null>(null);
  const [why, setWhy] = useState<string | null>(null);
  const [story, setStory] = useState<number | null>(null);
  const [sheet, setSheet] = useState<SheetName>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<number>(undefined);

  useEffect(() => setTab(initialTab), [initialTab]);
  useEffect(() => onTabChange?.(tab), [tab, onTabChange]);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 2600);
  }, []);

  const api = useMemo<PhoneApi>(
    () => ({
      version,
      calm,
      tab,
      setTab,
      openComments: setComments,
      openWhy: setWhy,
      openStory: setStory,
      openWellbeing: () => setSheet("wellbeing"),
      openInterests: () => setSheet("interests"),
      openMetrics: () => setSheet("metrics"),
      toast,
    }),
    [version, calm, tab, toast],
  );

  const dark = tab === "reels";

  return (
    <PhoneCtx.Provider value={api}>
      <MotionConfig reducedMotion={calm ? "always" : "user"}>
        <div className={cn("relative flex h-full flex-col overflow-hidden text-ink", dark ? "bg-black" : "bg-surface", calm && "calm-ui")}>
          <StatusBar dark={dark} />
          {tab !== "reels" && <Header />}
          <main className="relative min-h-0 flex-1">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${version}-${tab}`}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {tab === "inicio" && (ethical ? <EthicalFeed /> : <LegacyFeed />)}
                {tab === "explorar" && <ExploreView />}
                {tab === "reels" && <ReelsView />}
                {tab === "actividad" && <ActivityView />}
                {tab === "perfil" && <ProfileView />}
              </motion.div>
            </AnimatePresence>
            {ethical && <BreakReminder />}
          </main>
          <BottomNav dark={dark} />

          <CommentsSheet postId={comments} onClose={() => setComments(null)} />
          <WhySheet postId={why} onClose={() => setWhy(null)} />
          <InterestsSheet open={sheet === "interests"} onClose={() => setSheet(null)} />
          <WellbeingSheet open={sheet === "wellbeing"} onClose={() => setSheet(null)} />
          <MetricsSheet open={sheet === "metrics"} onClose={() => setSheet(null)} />
          <AnimatePresence>{story !== null && <StoryViewer start={story} onClose={() => setStory(null)} />}</AnimatePresence>
          {!ethical && !quiet && <LiveBanner onOpen={() => setTab("actividad")} />}

          <AnimatePresence>
            {toastMsg && (
              <motion.div
                role="status"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                className="pointer-events-none absolute inset-x-4 bottom-20 z-[60] rounded-2xl bg-ink/90 px-4 py-2.5 text-center text-[12.5px] leading-snug text-bg shadow-lift backdrop-blur"
              >
                {toastMsg}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </MotionConfig>
    </PhoneCtx.Provider>
  );
}

/* ------------------------------------------------------------------ */

function Wordmark() {
  return <span className="font-display text-[27px] italic leading-none tracking-tight">Instagram</span>;
}

function Header() {
  const { tab, version, setTab, openWellbeing, toast } = usePhoneSafe();
  const { seconds } = useUsage();
  const ethical = version === "etico";
  const titles: Record<Tab, string> = { inicio: "", explorar: "Explorar", reels: "", actividad: "Notificaciones", perfil: "" };

  return (
    <header className="flex h-11 shrink-0 items-center gap-1 px-3.5">
      {tab === "inicio" ? (
        <Wordmark />
      ) : tab === "perfil" ? (
        <span className="flex items-center gap-1 text-[18px] font-bold tracking-tight">
          {ethical && <Lock className="size-3.5" />} {ME.handle}
        </span>
      ) : (
        <span className="text-[19px] font-bold tracking-tight">{titles[tab]}</span>
      )}
      <div className="ml-auto flex items-center gap-1">
        {ethical ? (
          <>
            {tab === "inicio" && (
              <button type="button" onClick={openWellbeing} className="flex items-center gap-1 whitespace-nowrap rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-medium tabular-nums text-ink-2" aria-label="Tiempo de uso hoy">
                <Clock className="size-3" /> {formatShort(seconds)}
              </button>
            )}
            <IconBtn label="Bienestar" onClick={openWellbeing}>
              <Leaf className="size-[22px] text-calm" strokeWidth={1.8} />
            </IconBtn>
          </>
        ) : (
          tab === "inicio" && (
            <IconBtn label="Notificaciones" onClick={() => setTab("actividad")}>
              <Heart className="size-[24px]" strokeWidth={1.8} />
              <span className="absolute right-1.5 top-1.5 size-2.5 rounded-full border-2 border-surface bg-heart" />
            </IconBtn>
          )
        )}
        {tab === "inicio" && (
          <IconBtn label="Mensajes" onClick={() => toast("Mensajes directos: no incluidos en la simulación")}>
            <Send className="size-[22px]" strokeWidth={1.8} />
            {!ethical && <span className="absolute -right-0.5 top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full border-2 border-surface bg-heart px-1 text-[10px] font-bold text-white">9</span>}
          </IconBtn>
        )}
        {tab === "perfil" && (
          <IconBtn label="Menú" onClick={ethical ? openWellbeing : () => toast("Configuración: simulada")}>
            <Menu className="size-[22px]" strokeWidth={1.8} />
          </IconBtn>
        )}
      </div>
    </header>
  );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="relative grid size-10 place-items-center rounded-full hover:bg-surface-2">
      {children}
    </button>
  );
}

function BottomNav({ dark }: { dark: boolean }) {
  const { tab, setTab, version } = usePhoneSafe();
  const ethical = version === "etico";
  const items: { id: Tab; label: string; icon: ReactNode }[] = [
    { id: "inicio", label: "Inicio", icon: <House className={cn("size-[25px]", tab === "inicio" && "fill-current")} strokeWidth={tab === "inicio" ? 2.2 : 1.8} /> },
    { id: "explorar", label: "Explorar", icon: <Search className="size-[25px]" strokeWidth={tab === "explorar" ? 2.6 : 1.8} /> },
    { id: "reels", label: "Reels", icon: <Clapperboard className="size-[25px]" strokeWidth={tab === "reels" ? 2.4 : 1.8} /> },
    {
      id: "actividad",
      label: "Notificaciones",
      icon: (
        <span className="relative">
          <Heart className={cn("size-[25px]", tab === "actividad" && "fill-current")} strokeWidth={1.8} />
          {!ethical && tab !== "actividad" && <span className="absolute -right-1.5 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-heart px-1 text-[9px] font-bold text-white">23</span>}
        </span>
      ),
    },
    { id: "perfil", label: "Perfil", icon: <span className={cn("rounded-full", tab === "perfil" && "ring-2 ring-current ring-offset-1 ring-offset-transparent")}><Avatar user={ME} size={24} /></span> },
  ];
  return (
    <nav className={cn("flex h-[62px] shrink-0 items-start justify-around border-t pt-2", dark ? "border-white/10 bg-black text-white" : "border-line/[0.07] bg-surface")}>
      {items.map((i) => (
        <button key={i.id} type="button" aria-label={i.label} aria-current={tab === i.id ? "page" : undefined} onClick={() => setTab(i.id)} className="grid size-11 place-items-center">
          {i.icon}
        </button>
      ))}
    </nav>
  );
}

/** Banner que "interrumpe" cada cierto tiempo en la versión actual. */
function LiveBanner({ onOpen }: { onOpen: () => void }) {
  const [i, setI] = useState<number | null>(null);
  const count = useRef(0);
  useEffect(() => {
    let hide: number | undefined;
    const show = () => {
      setI(count.current++ % LIVE_PINGS.length);
      hide = window.setTimeout(() => setI(null), 4200);
    };
    const first = window.setTimeout(show, 6000);
    const every = window.setInterval(show, 22000);
    return () => {
      window.clearTimeout(first);
      window.clearTimeout(hide);
      window.clearInterval(every);
    };
  }, []);
  return (
    <AnimatePresence>
      {i !== null && (
        <motion.button
          type="button"
          onClick={() => {
            setI(null);
            onOpen();
          }}
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: "spring", damping: 22, stiffness: 300 }}
          className="absolute inset-x-2.5 top-11 z-[55] flex items-center gap-3 rounded-[20px] bg-surface/95 p-3 text-left shadow-lift ring-1 ring-black/5 backdrop-blur-xl"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-ig-gradient text-white">
            <Heart className="size-4 fill-white" />
          </span>
          <span className="min-w-0 text-[12.5px] leading-snug">
            <span className="block font-semibold">Instagram · ahora</span>
            <span className="line-clamp-2 text-ink-2">{LIVE_PINGS[i]}</span>
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

/** Recordatorio de descanso amable (versión ética). No bloquea ni culpa. */
function BreakReminder() {
  const { settings } = useApp();
  const { seconds } = useUsage();
  const [ack, setAck] = useState(() => (settings.breakReminder ? Math.floor(seconds / (settings.breakReminder * 60)) : 0));
  const [resting, setResting] = useState(false);
  const period = settings.breakReminder * 60;
  const reached = period ? Math.floor(seconds / period) : 0;
  const show = period > 0 && reached > ack && !resting;

  useEffect(() => {
    // Si cambia la configuración, empezamos a contar desde ahora.
    setAck(period ? Math.floor(seconds / period) : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  return (
    <>
      <AnimatePresence>
        {show && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute inset-x-3 bottom-3 z-30 rounded-3xl border border-calm/20 bg-surface p-4 shadow-lift"
          >
            <p className="flex items-center gap-2 text-[13px] font-semibold">
              <Leaf className="size-4 text-calm" /> Llevás {formatDuration(seconds)} hoy
            </p>
            <p className="mt-1 text-[12px] leading-snug text-ink-2">Si te sirve, es un buen momento para estirarte o tomar agua. Si no, seguí tranqui.</p>
            <div className="mt-3 flex gap-2">
              <button type="button" className="btn-ghost flex-1 !py-2 !text-[12.5px]" onClick={() => setAck(reached)}>
                Seguir
              </button>
              <button
                type="button"
                className="btn-calm flex-1 !py-2 !text-[12.5px]"
                onClick={() => {
                  setAck(reached);
                  setResting(true);
                }}
              >
                Tomar un descanso
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {resting && (
          <motion.div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-surface px-8 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.span
              className="size-32 rounded-full bg-calm/20"
              animate={{ scale: [0.7, 1, 0.7] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <p className="display mt-6 text-[28px]">Descanso</p>
            <p className="mt-2 text-[12.5px] text-ink-2">Mirá algo lejano unos segundos, relajá los hombros. La app no se va a ningún lado.</p>
            <button type="button" className="btn-ghost mt-6 !text-[13px]" onClick={() => setResting(false)}>
              Volver
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

