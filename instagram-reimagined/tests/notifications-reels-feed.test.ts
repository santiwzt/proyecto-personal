import { describe, expect, it } from "vitest";
import { NOTIFICATIONS } from "@/data/notifications";
import { buildDigest, interruptionsPerDay, isImportant, nextDigestHour } from "@/lib/notifications";
import { estimateReelMinutes, reelCheckpoint } from "@/lib/reels";
import { chunk, visibleBlocks } from "@/lib/feed";
import { compactNumber, formatDuration, timeAgo } from "@/lib/format";

const ALL = { mensajes: true, comentarios: true, likes: true, seguidores: true, sugerencias: true };

describe("notificaciones", () => {
  it("separa lo importante del resumen", () => {
    const d = buildDigest(NOTIFICATIONS, ALL);
    expect(d.important.every(isImportant)).toBe(true);
    expect(d.groups.flatMap((g) => g.items).some(isImportant)).toBe(false);
    expect(d.important.length + d.groups.reduce((a, g) => a + g.items.length, 0)).toBe(NOTIFICATIONS.length);
  });

  it("agrupa y suma por categoría", () => {
    const likes = buildDigest(NOTIFICATIONS, ALL).groups.find((g) => g.category === "likes")!;
    expect(likes.total).toBe(likes.items.reduce((a, n) => a + n.count, 0));
  });

  it("respeta categorías apagadas y las cuenta como silenciadas", () => {
    const d = buildDigest(NOTIFICATIONS, { ...ALL, sugerencias: false });
    expect(d.groups.some((g) => g.category === "sugerencias")).toBe(false);
    expect(d.muted).toBeGreaterThan(0);
  });

  it("calcula el próximo resumen", () => {
    expect(nextDigestHour("resumen", 10)).toBe(13);
    expect(nextDigestHour("resumen", 15)).toBe(20);
    expect(nextDigestHour("resumen", 22)).toBe(13);
    expect(nextDigestHour("diario", 8)).toBe(19);
  });

  it("interrumpe mucho menos que la versión actual", () => {
    expect(interruptionsPerDay(NOTIFICATIONS, "resumen")).toBeLessThan(interruptionsPerDay(NOTIFICATIONS, "actual"));
  });

  it("los textos neutros no usan urgencia artificial", () => {
    for (const n of NOTIFICATIONS) expect(n.calmText).not.toMatch(/!|ahora|no te lo pierdas|hoy/i);
  });
});

describe("reels", () => {
  it("ofrece pausa cada N y aviso de límite", () => {
    expect(reelCheckpoint(0, 5, 20)).toBe("none");
    expect(reelCheckpoint(5, 5, 20)).toBe("pause");
    expect(reelCheckpoint(7, 5, 20)).toBe("none");
    expect(reelCheckpoint(20, 5, 20)).toBe("limit");
    expect(reelCheckpoint(20, 5, 0)).toBe("pause");
  });
  it("estima minutos", () => {
    expect(estimateReelMinutes(12)).toBe(5);
  });
});

describe("feed en bloques", () => {
  it("divide y desbloquea de a uno", () => {
    expect(chunk([1, 2, 3, 4, 5, 6, 7], 3)).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
    const v = visibleBlocks([1, 2, 3, 4, 5, 6, 7], 3, 1);
    expect(v.shown).toEqual([[1, 2, 3]]);
    expect(v.hasMore).toBe(true);
    expect(visibleBlocks([1, 2, 3], 3, 5).hasMore).toBe(false);
  });
});

describe("formato", () => {
  it("números al estilo argentino", () => {
    expect(compactNumber(1284)).toBe("1.284");
    expect(compactNumber(12_480)).toBe("12,5 mil");
    expect(compactNumber(248_301)).toBe("248 mil");
    expect(compactNumber(2_400_000)).toBe("2,4 M");
    expect(compactNumber(1_000_000)).toBe("1 M");
  });
  it("tiempos", () => {
    expect(timeAgo(5)).toBe("5 min");
    expect(timeAgo(180)).toBe("3 h");
    expect(formatDuration(30)).toBe("menos de 1 min");
    expect(formatDuration(3900)).toBe("1 h 5 min");
  });
});
