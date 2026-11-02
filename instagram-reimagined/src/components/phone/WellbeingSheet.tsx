import { Clock, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import { useApp, useUsage } from "@/state/app-state";
import { formatDuration } from "@/lib/format";
import { Sheet } from "@/components/ui/Sheet";
import { Segmented } from "@/components/ui/Segmented";
import { Toggle } from "@/components/ui/Toggle";

const WEEK = [
  { d: "L", m: 34 },
  { d: "M", m: 52 },
  { d: "M", m: 41 },
  { d: "J", m: 28 },
  { d: "V", m: 63 },
  { d: "S", m: 47 },
];

export function WellbeingSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings, update, reelsWatched, reset } = useApp();
  const { seconds, speed, setSpeed, addMinutes, resetUsage } = useUsage();
  const today = Math.round(seconds / 60);
  const days = [...WEEK, { d: "Hoy", m: today }];
  const max = Math.max(60, ...days.map((x) => x.m));

  return (
    <Sheet open={open} onClose={onClose} title="Bienestar digital" tall>
      <div className="rounded-2xl bg-calm-soft p-4">
        <p className="text-[11.5px] text-ink-2">Tiempo en la app hoy</p>
        <p className="mt-0.5 text-[30px] font-semibold leading-tight tabular-nums tracking-tight">{formatDuration(seconds)}</p>
        <p className="mt-1 text-[11.5px] text-ink-2">{reelsWatched} reels vistos hoy</p>
        <div className="mt-4 flex h-20 items-end gap-2">
          {days.map((x, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex w-full flex-1 items-end">
                <div className={`w-full rounded-md ${x.d === "Hoy" ? "bg-calm" : "bg-calm/30"}`} style={{ height: `${Math.max(4, (x.m / max) * 100)}%` }} />
              </div>
              <span className="text-[10px] text-ink-3">{x.d}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-ink-3">Es información para vos, no una nota. No hay "metas" ni rachas.</p>
      </div>

      <section className="mt-4">
        <p className="eyebrow mb-1">Interfaz</p>
        <div className="divide-y divide-line/[0.06]">
          <Toggle
            label="Modo bienestar"
            description="Colores más suaves, sin anillos llamativos ni animaciones intensas."
            checked={settings.wellbeingMode}
            onChange={(wellbeingMode) => update({ wellbeingMode })}
          />
          <Toggle
            label="Ocultar cantidad de me gusta"
            description="En publicaciones ajenas y en las tuyas. Vos podés ver tus números en privado."
            checked={settings.hideLikes}
            onChange={(hideLikes) => update({ hideLikes })}
          />
        </div>
      </section>

      <section className="mt-4 space-y-3">
        <p className="eyebrow">Descansos y límites</p>
        <Row label="Recordatorio de descanso">
          <Segmented<number>
            size="sm"
            ariaLabel="Recordatorio de descanso"
            value={settings.breakReminder}
            onChange={(breakReminder) => update({ breakReminder })}
            options={[
              { value: 0, label: "No" },
              { value: 10, label: "10 min" },
              { value: 20, label: "20 min" },
              { value: 30, label: "30 min" },
            ]}
          />
        </Row>
        <Row label="Límite diario de reels">
          <Segmented<number>
            size="sm"
            ariaLabel="Límite diario de reels"
            value={settings.reelsLimit}
            onChange={(reelsLimit) => update({ reelsLimit })}
            options={[
              { value: 0, label: "No" },
              { value: 10, label: "10" },
              { value: 20, label: "20" },
              { value: 40, label: "40" },
            ]}
          />
        </Row>
        <Row label="Pausa entre reels cada">
          <Segmented<number>
            size="sm"
            ariaLabel="Pausa entre reels"
            value={settings.reelsPauseEvery}
            onChange={(reelsPauseEvery) => update({ reelsPauseEvery })}
            options={[
              { value: 5, label: "5" },
              { value: 10, label: "10" },
              { value: 15, label: "15" },
            ]}
          />
        </Row>
      </section>

      <section className="mt-5 rounded-2xl border border-dashed border-line/15 p-3.5">
        <p className="flex items-center gap-1.5 text-[12px] font-semibold">
          <Clock className="size-3.5" /> Controles de la demostración
        </p>
        <p className="mt-0.5 text-[11px] text-ink-3">Para mostrar en clase cómo reacciona la app con el paso del tiempo.</p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          <button type="button" className="chip" onClick={() => addMinutes(10)}>
            +10 min de uso
          </button>
          <button type="button" className="chip" aria-pressed={speed === 60} onClick={() => setSpeed(speed === 60 ? 1 : 60)}>
            {speed === 60 ? "Tiempo acelerado: activado" : "Acelerar tiempo (1 s = 1 min)"}
          </button>
          <button
            type="button"
            className="chip"
            onClick={() => {
              resetUsage();
              reset();
            }}
          >
            <RotateCcw className="size-3" /> Reiniciar demo
          </button>
        </div>
      </section>
    </Sheet>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium">{label}</span>
      {children}
    </div>
  );
}
