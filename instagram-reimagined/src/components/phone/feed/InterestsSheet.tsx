import { Check } from "lucide-react";
import { useApp } from "@/state/app-state";
import { ALL_INTERESTS, INTEREST_LABELS } from "@/lib/algorithm";
import { cn } from "@/lib/format";
import { Sheet } from "@/components/ui/Sheet";
import { Segmented } from "@/components/ui/Segmented";
import type { FeedMode } from "@/types";

export function InterestsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings, update } = useApp();
  const toggle = (t: (typeof ALL_INTERESTS)[number]) =>
    update({ interests: settings.interests.includes(t) ? settings.interests.filter((x) => x !== t) : [...settings.interests, t] });

  return (
    <Sheet open={open} onClose={onClose} title="Tu algoritmo, tus reglas" tall>
      <p className="text-[12.5px] leading-snug text-ink-2">Elegí cómo se ordena tu feed y qué temas querés ver. Los cambios se aplican al instante.</p>
      <div className="mt-4">
        <p className="eyebrow mb-2">Orden del feed</p>
        <Segmented<FeedMode>
          ariaLabel="Orden del feed"
          className="w-full"
          value={settings.feedMode}
          onChange={(feedMode) => update({ feedMode })}
          options={[
            { value: "personalizado", label: "Personalizado" },
            { value: "cronologico", label: "Cronológico" },
          ]}
        />
        <p className="mt-2 text-[11.5px] text-ink-3">
          {settings.feedMode === "cronologico"
            ? "Solo cuentas que seguís, de lo más nuevo a lo más viejo."
            : "Cuentas que seguís, ordenadas por amistad e intereses, sin repetir el mismo tema más de 2 veces seguidas."}
        </p>
      </div>
      <div className="mt-5">
        <p className="eyebrow mb-2">Intereses</p>
        <div className="flex flex-wrap gap-2">
          {ALL_INTERESTS.map((t) => {
            const on = settings.interests.includes(t);
            return (
              <button
                key={t}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(t)}
                className={cn("chip", on ? "border-calm/40 bg-calm-soft text-calm" : "text-ink-2 hover:text-ink")}
              >
                {on && <Check className="size-3" strokeWidth={3} />}
                {INTEREST_LABELS[t]}
              </button>
            );
          })}
        </div>
      </div>
      {settings.lessOf.length > 0 && (
        <div className="mt-5">
          <p className="eyebrow mb-2">Pediste ver menos de</p>
          <div className="flex flex-wrap gap-2">
            {settings.lessOf.map((t) => (
              <button key={t} type="button" onClick={() => update({ lessOf: settings.lessOf.filter((x) => x !== t) })} className="chip text-ink-2 hover:text-ink">
                {INTEREST_LABELS[t]} ✕
              </button>
            ))}
          </div>
        </div>
      )}
    </Sheet>
  );
}
