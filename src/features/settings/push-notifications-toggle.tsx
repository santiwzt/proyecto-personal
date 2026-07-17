"use client";

import * as React from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

type Status = "checking" | "unsupported" | "off" | "on" | "denied";

export function PushNotificationsToggle({ vapidPublicKey }: { vapidPublicKey: string | null }) {
  const { toast } = useToast();
  const [status, setStatus] = React.useState<Status>("checking");
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    async function detectStatus(): Promise<Status> {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !vapidPublicKey) {
        return "unsupported";
      }
      if (Notification.permission === "denied") {
        return "denied";
      }
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        return subscription ? "on" : "off";
      } catch {
        return "off";
      }
    }
    detectStatus().then(setStatus);
  }, [vapidPublicKey]);

  function handleEnable() {
    startTransition(async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setStatus(permission === "denied" ? "denied" : "off");
          return;
        }
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey!) as BufferSource,
        });
        const json = subscription.toJSON();
        const res = await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
        });
        if (!res.ok) throw new Error("No se pudo guardar la suscripcion.");
        setStatus("on");
        toast({ title: "Recordatorios activados" });
      } catch {
        toast({ variant: "destructive", title: "No pudimos activar las notificaciones" });
      }
    });
  }

  function handleDisable() {
    startTransition(async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await fetch("/api/push/subscribe", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: subscription.endpoint }),
          });
          await subscription.unsubscribe();
        }
        setStatus("off");
        toast({ title: "Recordatorios desactivados" });
      } catch {
        toast({ variant: "destructive", title: "No pudimos desactivar las notificaciones" });
      }
    });
  }

  if (status === "checking") return null;

  if (status === "unsupported") {
    return (
      <p className="text-sm text-muted-foreground">
        Las notificaciones no estan disponibles en este navegador o el servidor todavia no las tiene configuradas.
      </p>
    );
  }

  if (status === "denied") {
    return (
      <p className="text-sm text-muted-foreground">
        Bloqueaste las notificaciones para este sitio. Para activarlas, habilitalas desde la configuracion del
        navegador y volve a entrar.
      </p>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Avisos de examenes y tareas por vencer</span>
        <Badge variant={status === "on" ? "default" : "outline"}>{status === "on" ? "Activadas" : "Desactivadas"}</Badge>
      </div>
      {status === "on" ? (
        <Button type="button" variant="outline" size="sm" onClick={handleDisable} disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <BellOff aria-hidden="true" />}
          Desactivar
        </Button>
      ) : (
        <Button type="button" size="sm" onClick={handleEnable} disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Bell aria-hidden="true" />}
          Activar
        </Button>
      )}
    </div>
  );
}
