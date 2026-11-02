import type { FeedMode, Interest, Post } from "@/types";

export const INTEREST_LABELS: Record<Interest, string> = {
  amigos: "Amigos",
  deportes: "Deportes",
  musica: "Música",
  arte: "Arte",
  ciencia: "Ciencia",
  humor: "Humor",
  moda: "Moda",
  comida: "Comida",
  viajes: "Viajes",
  gaming: "Gaming",
  naturaleza: "Naturaleza",
  estudio: "Estudio",
};

export const ALL_INTERESTS = Object.keys(INTEREST_LABELS) as Interest[];

export interface Reason {
  /** Ícono sugerido para la UI (nombre lógico, no componente). */
  icon: "friend" | "follow" | "interest" | "popular" | "ad" | "recent" | "diversity";
  text: string;
}

/** ¿El usuario eligió ver esta cuenta? */
export const isChosen = (p: Post) => p.source === "amigo" || p.source === "seguido";

/**
 * Explica, en lenguaje simple, por qué una publicación aparece.
 * Es la base de la sección "¿Por qué estoy viendo esto?".
 */
export function explainPost(post: Post, ctx: { mode: FeedMode; interests: Interest[] }): Reason[] {
  const reasons: Reason[] = [];
  if (post.source === "amigo") reasons.push({ icon: "friend", text: "Es de alguien que seguís y con quien interactuás seguido." });
  if (post.source === "seguido") reasons.push({ icon: "follow", text: "Seguís a esta cuenta." });
  if (post.source === "publicidad") reasons.push({ icon: "ad", text: "Es una publicidad. Una marca pagó para mostrarla a personas de tu edad y zona." });
  if (post.source === "sugerido") reasons.push({ icon: "popular", text: "No seguís esta cuenta: se sugiere porque tiene mucha interacción entre personas parecidas a vos." });
  if (ctx.mode === "cronologico") {
    reasons.push({ icon: "recent", text: "Estás en modo cronológico: se ordena solo por fecha, de lo más nuevo a lo más viejo." });
  } else if (ctx.interests.includes(post.topic)) {
    reasons.push({ icon: "interest", text: `Marcaste "${INTEREST_LABELS[post.topic]}" como interés.` });
  }
  return reasons;
}

export interface RankContext {
  mode: FeedMode;
  interests: Interest[];
  lessOf: Interest[];
  /** Máximo de publicaciones seguidas del mismo tema. */
  maxSameTopicInRow?: number;
}

/** Puntaje para el feed personalizado ético: prioriza vínculos reales, luego intereses elegidos. */
export function scorePost(p: Post, ctx: RankContext): number {
  let s = 0;
  if (p.source === "amigo") s += 60;
  if (p.source === "seguido") s += 30;
  if (ctx.interests.includes(p.topic)) s += 25;
  if (ctx.lessOf.includes(p.topic)) s -= 60;
  // Lo reciente pesa, pero no lo es todo.
  s += Math.max(0, 20 - p.minutesAgo / 60);
  return s;
}

/**
 * Reordena para evitar repetir el mismo tema demasiadas veces seguidas
 * (evita la "burbuja" de contenido similar).
 */
export function diversify<T extends { topic: Interest }>(items: T[], maxInRow = 2): T[] {
  const pool = [...items];
  const out: T[] = [];
  while (pool.length) {
    const last = out.slice(-maxInRow);
    const blocked = last.length === maxInRow && last.every((x) => x.topic === last[0]?.topic) ? last[0]?.topic : undefined;
    const idx = blocked ? pool.findIndex((x) => x.topic !== blocked) : 0;
    const [next] = pool.splice(idx === -1 ? 0 : idx, 1);
    if (next) out.push(next);
  }
  return out;
}

/**
 * Feed ético: solo cuentas elegidas por el usuario (sin sugeridos ni publicidad
 * mezclados). Cronológico u ordenado por vínculos + intereses, con diversidad.
 */
export function rankEthicalFeed(posts: Post[], ctx: RankContext): Post[] {
  const chosen = posts.filter(isChosen);
  if (ctx.mode === "cronologico") return [...chosen].sort((a, b) => a.minutesAgo - b.minutesAgo);
  const ranked = [...chosen].sort((a, b) => scorePost(b, ctx) - scorePost(a, ctx));
  return diversify(ranked, ctx.maxSameTopicInRow ?? 2);
}

/** Sugerencias opcionales (fuera del feed principal), filtradas por intereses. */
export function ethicalSuggestions(posts: Post[], ctx: RankContext): Post[] {
  const others = posts.filter((p) => p.source === "sugerido" && !ctx.lessOf.includes(p.topic));
  const preferred = others.filter((p) => ctx.interests.includes(p.topic));
  const rest = others.filter((p) => !ctx.interests.includes(p.topic));
  return diversify([...preferred, ...rest], 1);
}

/**
 * Feed "actual": mezcla amigos con sugeridos y publicidad, y prioriza lo que
 * más engagement genera. Se repite infinitamente (scroll infinito simulado).
 */
export function legacyFeedPage(posts: Post[], page: number, pageSize = 6): Post[] {
  const byEngagement = [...posts].sort((a, b) => b.likes + b.comments.length * 50 - (a.likes + a.comments.length * 50));
  const friends = posts.filter((p) => p.source === "amigo");
  const out: Post[] = [];
  for (let i = 0; i < pageSize; i++) {
    const n = page * pageSize + i;
    // Patrón: amigo, viral, viral, amigo, viral, publicidad...
    const slot = n % 6;
    const src =
      slot === 0 || slot === 3
        ? friends[(n / 3) % friends.length | 0]
        : byEngagement[n % byEngagement.length];
    if (src) out.push({ ...src, id: `${src.id}~${n}` });
  }
  return out;
}

/** Id base de una publicación (quita el sufijo de repetición del scroll infinito). */
export const baseId = (id: string) => id.split("~")[0] ?? id;

/** Proporción de temas en una lista (para mostrar la "burbuja"). */
export function topicShare(items: { topic: Interest }[]): { topic: Interest; share: number }[] {
  const counts = new Map<Interest, number>();
  items.forEach((i) => counts.set(i.topic, (counts.get(i.topic) ?? 0) + 1));
  return [...counts.entries()]
    .map(([topic, c]) => ({ topic, share: c / Math.max(1, items.length) }))
    .sort((a, b) => b.share - a.share);
}

/**
 * Simulación de "burbuja de filtro" para el análisis.
 * - actual: amplifica lo que más miraste (peso al cuadrado).
 * - etico: ningún tema supera `cap` del feed; el excedente se reparte.
 */
export function bubbleMix<T extends string>(weights: Record<T, number>, mode: "actual" | "etico", cap = 0.3): Record<T, number> {
  const keys = Object.keys(weights) as T[];
  const pow = mode === "actual" ? 2 : 1;
  const raw = keys.map((k) => Math.pow(Math.max(0, weights[k]), pow));
  const sum = raw.reduce((a, b) => a + b, 0) || 1;
  const shares = raw.map((v) => v / sum);
  if (mode === "etico" && cap * keys.length >= 1) {
    for (let iter = 0; iter < 10; iter++) {
      let excess = 0;
      shares.forEach((s, i) => {
        if (s > cap) {
          excess += s - cap;
          shares[i] = cap;
        }
      });
      if (excess < 1e-9) break;
      const open = shares.map((s, i) => (s < cap ? i : -1)).filter((i) => i >= 0);
      open.forEach((i) => (shares[i] = (shares[i] ?? 0) + excess / open.length));
    }
  }
  return Object.fromEntries(keys.map((k, i) => [k, shares[i] ?? 0])) as Record<T, number>;
}

/** Índice de diversidad 0-1 (entropía normalizada). */
export function diversityIndex(shares: number[]): number {
  const n = shares.length;
  if (n <= 1) return 0;
  const h = -shares.filter((s) => s > 0).reduce((a, s) => a + s * Math.log(s), 0);
  return h / Math.log(n);
}
