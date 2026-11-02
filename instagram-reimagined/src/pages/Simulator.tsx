import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Clock, Leaf, MousePointerClick, ShieldCheck } from "lucide-react";
import { useState, type ReactNode } from "react";
import { MECHANISMS, TAB_LABELS } from "@/data/mechanisms";
import { useApp, useUsage, useUsageClock } from "@/state/app-state";
import { cn, formatDuration } from "@/lib/format";
import { SCHEDULE_LABELS } from "@/lib/notifications";
import type { NotifSchedule } from "@/types";
import { PhoneFrame } from "@/components/phone/PhoneFrame";
import { PhoneApp } from "@/components/phone/PhoneApp";
import type { Tab } from "@/components/phone/phone-context";
import { Toggle } from "@/components/ui/Toggle";
import { Segmented } from "@/components/ui/Segmented";

export function SimulatorPage() {
  useUsageClock();
  const { version } = useApp();
  const [tab, setTab] = useState<Tab>("inicio");
  const ethical = version === "etico";

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:pt-8">
      <div className="mb-6 lg:mb-8">
        <p className="eyebrow">Simulador interactivo</p>
        <h1 className="display mt-1 text-[38px] leading-[1.05] sm:text-[46px]">
          Usalo como si fuera <span className="italic">tu</span> Instagram
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] text-ink-2 text-pretty">
          Todo funciona: dale me gusta, comentá, guardá, mirá historias y reels. Cambiá de versión con el interruptor de arriba y fijate qué cambia.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_auto_1fr] lg:items-start">
        <MechanismPanel tab={tab} />
        <div className="order-first lg:order-none">
          <PhoneFrame>
            <PhoneApp onTabChange={setTab} />
          </PhoneFrame>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-[12px] text-ink-3">
            <MousePointerClick className="size-3.5" /> Doble toque en una foto para darle me gusta
          </p>
        </div>
        {ethical ? <ControlsPanel /> : <LegacyPanel />}
      </div>
    </div>
  );
}

function MechanismPanel({ tab }: { tab: Tab }) {
  const { version } = useApp();
  const ethical = version === "etico";
  const list = MECHANISMS[tab][version];
  return (
    <aside className="card p-5 lg:sticky lg:top-24">
      <div className="flex items-center gap-2">
        <span className={cn("grid size-8 place-items-center rounded-full", ethical ? "bg-calm-soft text-calm" : "bg-heart/10 text-heart")}>
          {ethical ? <ShieldCheck className="size-4" /> : <AlertTriangle className="size-4" />}
        </span>
        <div>
          <p className="eyebrow">{ethical ? "Cambios activos" : "Mecanismos de retención"}</p>
          <p className="text-[14px] font-semibold">En {TAB_LABELS[tab]}</p>
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.ol key={`${version}-${tab}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="mt-4 space-y-3">
          {list.map((m, i) => (
            <li key={m.title} className="flex gap-3">
              <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[10.5px] font-semibold", ethical ? "bg-calm text-white dark:text-black" : "bg-ink text-bg")}>{i + 1}</span>
              <div>
                <p className="text-[13.5px] font-semibold">{m.title}</p>
                <p className="text-[12.5px] leading-snug text-ink-2">{m.text}</p>
              </div>
            </li>
          ))}
        </motion.ol>
      </AnimatePresence>
      <p className="mt-5 border-t border-line/[0.06] pt-3 text-[11.5px] text-ink-3">Navegá por las pestañas del teléfono: este panel se actualiza solo.</p>
    </aside>
  );
}

function LegacyPanel() {
  const { seconds } = useUsage();
  const { setVersion } = useApp();
  return (
    <aside className="card p-5 lg:sticky lg:top-24">
      <p className="eyebrow">Lo que esta versión no te da</p>
      <ul className="mt-3 space-y-2.5 text-[13px]">
        {["Un final para el feed o los reels", "Saber por qué ves cada publicación", "Elegir cuándo llegan las notificaciones", "Ocultar likes sin buscarlo en menús", "Ver tu tiempo de uso a simple vista"].map((t) => (
          <li key={t} className="flex gap-2.5 text-ink-2">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-heart" /> {t}
          </li>
        ))}
      </ul>
      <div className="mt-5 rounded-2xl bg-surface-2 p-4">
        <p className="flex items-center gap-1.5 text-[11.5px] text-ink-2">
          <Clock className="size-3.5" /> Tiempo en la simulación
        </p>
        <p className="mt-1 text-[28px] font-semibold tabular-nums tracking-tight">{formatDuration(seconds)}</p>
        <p className="text-[11.5px] text-ink-3">La app actual no te lo muestra acá: está en Configuración → Tu actividad.</p>
      </div>
      <button type="button" className="btn-calm mt-4 w-full" onClick={() => setVersion("etico")}>
        <Leaf className="size-4" /> Ver la versión ética
      </button>
    </aside>
  );
}

function ControlsPanel() {
  const { settings, update } = useApp();
  const { seconds, speed, setSpeed, addMinutes } = useUsage();
  return (
    <aside className="card p-5 lg:sticky lg:top-24">
      <p className="eyebrow">Panel de control</p>
      <p className="text-[14px] font-semibold">Probá cambiar las reglas</p>
      <div className="mt-3 divide-y divide-line/[0.06]">
        <Toggle label="Modo bienestar" description="Interfaz más tranquila" checked={settings.wellbeingMode} onChange={(wellbeingMode) => update({ wellbeingMode })} />
        <Toggle label="Ocultar me gusta" checked={settings.hideLikes} onChange={(hideLikes) => update({ hideLikes })} />
      </div>
      <div className="mt-3 space-y-3">
        <Field label="Orden del feed">
          <Segmented
            ariaLabel="Orden del feed"
            size="sm"
            value={settings.feedMode}
            onChange={(feedMode) => update({ feedMode })}
            options={[
              { value: "personalizado", label: "Personalizado" },
              { value: "cronologico", label: "Cronológico" },
            ]}
          />
        </Field>
        <Field label="Notificaciones">
          <select
            value={settings.notifSchedule}
            onChange={(e) => update({ notifSchedule: e.target.value as NotifSchedule })}
            className="w-full rounded-xl border border-line/10 bg-surface px-3 py-2 text-[13px]"
            aria-label="Horario de notificaciones"
          >
            {(Object.keys(SCHEDULE_LABELS) as NotifSchedule[]).map((s) => (
              <option key={s} value={s}>
                {SCHEDULE_LABELS[s].title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Límite diario de reels">
          <Segmented<number>
            ariaLabel="Límite diario de reels"
            size="sm"
            value={settings.reelsLimit}
            onChange={(reelsLimit) => update({ reelsLimit })}
            options={[0, 10, 20, 40].map((v) => ({ value: v, label: v ? String(v) : "Sin límite" }))}
          />
        </Field>
        <Field label="Recordatorio de descanso">
          <Segmented<number>
            ariaLabel="Recordatorio de descanso"
            size="sm"
            value={settings.breakReminder}
            onChange={(breakReminder) => update({ breakReminder })}
            options={[0, 10, 20, 30].map((v) => ({ value: v, label: v ? `${v} min` : "No" }))}
          />
        </Field>
      </div>
      <div className="mt-5 rounded-2xl bg-calm-soft p-4">
        <p className="flex items-center gap-1.5 text-[11.5px] text-ink-2">
          <Clock className="size-3.5" /> Tiempo de uso simulado
        </p>
        <p className="mt-1 text-[28px] font-semibold tabular-nums tracking-tight">{formatDuration(seconds)}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" className="chip bg-surface" onClick={() => addMinutes(10)}>
            +10 min
          </button>
          <button type="button" className="chip bg-surface" aria-pressed={speed === 60} onClick={() => setSpeed(speed === 60 ? 1 : 60)}>
            {speed === 60 ? "Acelerado ×60" : "Acelerar ×60"}
          </button>
        </div>
        <p className="mt-2 text-[11px] text-ink-3">Tip para la exposición: sumá minutos para que aparezca el recordatorio de descanso.</p>
      </div>
    </aside>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[12.5px] font-medium">{label}</p>
      {children}
    </div>
  );
}
