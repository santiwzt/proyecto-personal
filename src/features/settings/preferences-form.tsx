"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { updatePreferencesAction } from "@/server/actions/misc-actions";
import type { UserPreferences } from "@/types/domain";

export function PreferencesForm({ preferences }: { preferences: UserPreferences }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  const [dailyStudyLimitMinutes, setDailyStudyLimitMinutes] = React.useState(
    preferences.dailyStudyLimitMinutes,
  );
  const [aiConsentGiven, setAiConsentGiven] = React.useState(preferences.aiConsentGiven);

  function handleSaveLimit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await updatePreferencesAction({ dailyStudyLimitMinutes });
        toast({ title: "Limite diario de estudio actualizado." });
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "No se pudo actualizar el limite",
          description: error instanceof Error ? error.message : undefined,
        });
      }
    });
  }

  function handleToggleConsent(checked: boolean) {
    setAiConsentGiven(checked);
    startTransition(async () => {
      try {
        await updatePreferencesAction({ aiConsentGiven: checked });
        toast({
          title: checked
            ? "Diste tu consentimiento para enviar material a la IA."
            : "Retiraste el consentimiento para enviar material a la IA.",
        });
        router.refresh();
      } catch (error) {
        setAiConsentGiven(!checked);
        toast({
          variant: "destructive",
          title: "No se pudo actualizar el consentimiento",
          description: error instanceof Error ? error.message : undefined,
        });
      }
    });
  }

  return (
    <div className="space-y-6">
      <form className="flex items-end gap-3" onSubmit={handleSaveLimit}>
        <div className="space-y-1.5">
          <Label htmlFor="daily-study-limit">Limite diario de estudio (minutos)</Label>
          <Input
            id="daily-study-limit"
            type="number"
            min={0}
            max={1440}
            value={dailyStudyLimitMinutes}
            onChange={(e) => setDailyStudyLimitMinutes(Number(e.target.value))}
            className="w-32"
          />
        </div>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
          Guardar
        </Button>
      </form>

      <div className="flex items-start justify-between gap-4 rounded-md border border-border p-4">
        <div className="space-y-1">
          <Label htmlFor="ai-consent-switch">Consentimiento para enviar material a la IA</Label>
          <p className="text-sm text-muted-foreground">
            Si activas esta opcion, aceptas que el contenido de tus materias, archivos y consultas se envie al
            proveedor de IA configurado (Anthropic) para generar respuestas, preguntas de practica y
            correcciones. Podes retirar el consentimiento en cualquier momento.
          </p>
        </div>
        <Switch
          id="ai-consent-switch"
          checked={aiConsentGiven}
          onCheckedChange={handleToggleConsent}
          disabled={isPending}
        />
      </div>
    </div>
  );
}
