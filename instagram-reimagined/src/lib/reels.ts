export type ReelCheckpoint = "none" | "pause" | "limit";

/**
 * Decide si después de `watched` reels corresponde ofrecer una pausa o
 * avisar que se llegó al límite diario elegido por el usuario.
 * `limit` = 0 significa sin límite. Nunca bloquea: solo ofrece.
 */
export function reelCheckpoint(watched: number, pauseEvery: number, limit: number): ReelCheckpoint {
  if (watched <= 0) return "none";
  if (limit > 0 && watched >= limit && watched % limit === 0) return "limit";
  if (pauseEvery > 0 && watched % pauseEvery === 0) return "pause";
  return "none";
}

/** Estimación de minutos vistos (un reel promedio dura ~25 s). */
export const estimateReelMinutes = (watched: number) => Math.round((watched * 25) / 60);
