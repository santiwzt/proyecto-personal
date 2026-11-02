/** Divide una lista en bloques (scroll consciente). */
export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * Cuántos bloques mostrar: el primero siempre; el resto solo si el usuario
 * eligió seguir. Devuelve también si hay más contenido disponible.
 */
export function visibleBlocks<T>(items: T[], size: number, unlocked: number) {
  const blocks = chunk(items, size);
  const shown = blocks.slice(0, Math.max(1, unlocked));
  return { shown, hasMore: blocks.length > shown.length, total: blocks.length };
}
