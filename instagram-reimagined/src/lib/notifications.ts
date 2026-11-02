import type { AppNotification, NotificationCategory, NotificationType, NotifSchedule } from "@/types";

export const CATEGORY_OF: Record<NotificationType, NotificationCategory> = {
  mensaje: "mensajes",
  mencion: "comentarios",
  comentario: "comentarios",
  like: "likes",
  historia: "likes",
  seguidor: "seguidores",
  vivo: "sugerencias",
  sugerencia: "sugerencias",
};

export const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  mensajes: "Mensajes de personas que conocés",
  comentarios: "Comentarios y menciones",
  likes: "Me gusta y vistas",
  seguidores: "Nuevos seguidores",
  sugerencias: "Sugerencias, vivos y publicidad",
};

/** Una notificación es importante si viene de una persona y espera una respuesta tuya. */
export const isImportant = (n: AppNotification) => n.type === "mensaje" || n.type === "mencion" || n.type === "comentario";

export interface DigestGroup {
  category: NotificationCategory;
  items: AppNotification[];
  total: number;
  summary: string;
}

export interface Digest {
  important: AppNotification[];
  groups: DigestGroup[];
  /** Cuántas quedaron silenciadas por preferencia del usuario. */
  muted: number;
}

const SUMMARY: Record<NotificationCategory, (total: number) => string> = {
  mensajes: (t) => `${t} ${t === 1 ? "mensaje" : "mensajes"}`,
  comentarios: (t) => `${t} ${t === 1 ? "comentario" : "comentarios"}`,
  likes: (t) => `${t} me gusta y vistas en tus publicaciones`,
  seguidores: (t) => `${t} ${t === 1 ? "persona nueva te sigue" : "personas nuevas te siguen"}`,
  sugerencias: (t) => `${t} ${t === 1 ? "sugerencia" : "sugerencias"} de la plataforma`,
};

/**
 * Agrupa notificaciones: lo importante arriba, el resto resumido por categoría.
 * Las categorías apagadas por el usuario no se muestran (solo se cuentan).
 */
export function buildDigest(list: AppNotification[], enabled: Record<NotificationCategory, boolean>): Digest {
  const important: AppNotification[] = [];
  const buckets = new Map<NotificationCategory, AppNotification[]>();
  let muted = 0;
  for (const n of list) {
    const cat = CATEGORY_OF[n.type];
    if (!enabled[cat]) {
      muted++;
      continue;
    }
    if (isImportant(n)) important.push(n);
    else buckets.set(cat, [...(buckets.get(cat) ?? []), n]);
  }
  const order: NotificationCategory[] = ["likes", "seguidores", "sugerencias", "comentarios", "mensajes"];
  const groups = order
    .filter((c) => buckets.has(c))
    .map((category) => {
      const items = buckets.get(category) ?? [];
      const total = items.reduce((acc, n) => acc + n.count, 0);
      return { category, items, total, summary: SUMMARY[category](total) };
    });
  return { important, groups, muted };
}

export const SCHEDULE_LABELS: Record<NotifSchedule, { title: string; detail: string }> = {
  importantes: { title: "Solo lo importante al instante", detail: "Mensajes y menciones llegan enseguida. El resto, en un resumen a las 20 h." },
  resumen: { title: "Dos resúmenes por día", detail: "Todo junto a las 13 h y a las 20 h. Nada te interrumpe entre medio." },
  diario: { title: "Un resumen por día", detail: "Una sola vez, a las 19 h. Ideal para épocas de exámenes." },
};

const SLOTS: Record<NotifSchedule, number[]> = {
  importantes: [20],
  resumen: [13, 20],
  diario: [19],
};

/** Próximo horario de entrega del resumen, a partir de la hora actual (0-23.99). */
export function nextDigestHour(schedule: NotifSchedule, hourNow: number): number {
  const slots = SLOTS[schedule];
  return slots.find((h) => h > hourNow) ?? slots[0] ?? 20;
}

/** Cuántas veces interrumpe la app en un período, según el modelo. */
export function interruptionsPerDay(list: AppNotification[], schedule: NotifSchedule | "actual"): number {
  if (schedule === "actual") return list.length;
  const slots = SLOTS[schedule].length;
  return schedule === "importantes" ? list.filter(isImportant).length + slots : slots;
}
