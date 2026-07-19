"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { updateSchoolCalendarUrlAction } from "@/server/actions/misc-actions";

export function SchoolCalendarForm({ schoolCalendarIcsUrl }: { schoolCalendarIcsUrl: string | null }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const [value, setValue] = React.useState(schoolCalendarIcsUrl ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const icsUrl = value.trim().length > 0 ? value.trim() : null;
    startTransition(async () => {
      try {
        const result = await updateSchoolCalendarUrlAction({ icsUrl });
        if (!result.ok) {
          toast({ variant: "destructive", title: "No se pudo guardar el calendario", description: result.message });
          return;
        }
        toast({ title: icsUrl ? "Calendario del colegio conectado." : "Calendario del colegio desconectado." });
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "No se pudo guardar el calendario",
          description: error instanceof Error ? error.message : undefined,
        });
      }
    });
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
      <div className="space-y-1.5">
        <Label htmlFor="school-calendar-url">URL del calendario del colegio (iCal / .ics)</Label>
        <Input
          id="school-calendar-url"
          type="url"
          placeholder="https://campus.tuescuela.edu.ar/.../calendario/.../ical/"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Muchos campus virtuales tienen un link para &ldquo;exportar&rdquo; o &ldquo;suscribirse&rdquo; al calendario
          que termina en{" "}
          <span className="font-mono">ical</span> o <span className="font-mono">.ics</span>. Los eventos aparecen en
          tu Agenda de solo lectura, con un color distinto al resto.
        </p>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
          Guardar
        </Button>
        {schoolCalendarIcsUrl ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => {
              setValue("");
              startTransition(async () => {
                try {
                  await updateSchoolCalendarUrlAction({ icsUrl: null });
                  toast({ title: "Calendario del colegio desconectado." });
                  router.refresh();
                } catch (error) {
                  toast({
                    variant: "destructive",
                    title: "No se pudo desconectar el calendario",
                    description: error instanceof Error ? error.message : undefined,
                  });
                }
              });
            }}
          >
            Quitar
          </Button>
        ) : null}
      </div>
    </form>
  );
}
