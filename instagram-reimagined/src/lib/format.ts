/** Formatea números al estilo de Instagram en español: 1.284 / 12,4 mil / 2,3 M */
export function compactNumber(n: number): string {
  if (n < 10_000) return n.toLocaleString("es-AR");
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 100_000 ? 1 : 0).replace(".", ",").replace(",0", "")} mil`;
  return `${(n / 1_000_000).toFixed(1).replace(".", ",").replace(",0", "")} M`;
}

export function timeAgo(minutes: number): string {
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.round(minutes / 60);
  if (h < 24) return `${h} h`;
  const d = Math.round(h / 24);
  return `${d} d`;
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  if (m < 1) return "menos de 1 min";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h} h ${rest} min` : `${h} h`;
}

/** Versión corta para indicadores chicos: "<1 min", "12 min", "1 h 5 min". */
export const formatShort = (seconds: number) => (seconds < 60 ? "<1 min" : formatDuration(seconds));

export const cn = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

/** Hash simple y determinístico para generar ilustraciones estables. */
export function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function seeded(seed: number) {
  let s = seed || 1;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}
