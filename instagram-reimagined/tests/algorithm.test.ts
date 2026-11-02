import { describe, expect, it } from "vitest";
import { POSTS } from "@/data/posts";
import { baseId, bubbleMix, diversify, diversityIndex, ethicalSuggestions, explainPost, legacyFeedPage, rankEthicalFeed } from "@/lib/algorithm";

const ctx = { mode: "personalizado" as const, interests: ["amigos" as const, "ciencia" as const], lessOf: [] };

describe("feed ético", () => {
  it("solo incluye cuentas elegidas (sin sugeridos ni publicidad)", () => {
    const feed = rankEthicalFeed(POSTS, ctx);
    expect(feed.length).toBeGreaterThan(0);
    expect(feed.every((p) => p.source === "amigo" || p.source === "seguido")).toBe(true);
  });

  it("en modo cronológico ordena de lo más nuevo a lo más viejo", () => {
    const feed = rankEthicalFeed(POSTS, { ...ctx, mode: "cronologico" });
    for (let i = 1; i < feed.length; i++) expect(feed[i]!.minutesAgo).toBeGreaterThanOrEqual(feed[i - 1]!.minutesAgo);
  });

  it("nunca repite el mismo tema más de 2 veces seguidas si hay alternativa", () => {
    const feed = rankEthicalFeed(POSTS, ctx);
    for (let i = 2; i < feed.length; i++) {
      const same = feed[i]!.topic === feed[i - 1]!.topic && feed[i - 1]!.topic === feed[i - 2]!.topic;
      const rest = feed.slice(i);
      if (same) expect(rest.every((p) => p.topic === feed[i]!.topic)).toBe(true);
    }
  });

  it("'ver menos de' baja el puesto de ese tema", () => {
    const normal = rankEthicalFeed(POSTS, ctx).findIndex((p) => p.topic === "viajes");
    const less = rankEthicalFeed(POSTS, { ...ctx, lessOf: ["viajes"] }).findIndex((p) => p.topic === "viajes");
    expect(less).toBeGreaterThan(normal);
  });

  it("las sugerencias excluyen temas silenciados", () => {
    const s = ethicalSuggestions(POSTS, { ...ctx, lessOf: ["deportes"] });
    expect(s.some((p) => p.topic === "deportes")).toBe(false);
  });
});

describe("feed actual (scroll infinito)", () => {
  it("siempre genera otra página con ids únicos", () => {
    const pages = Array.from({ length: 20 }, (_, i) => legacyFeedPage(POSTS, i)).flat();
    expect(pages).toHaveLength(120);
    expect(new Set(pages.map((p) => p.id)).size).toBe(120);
    expect(baseId(pages[7]!.id)).not.toContain("~");
  });

  it("mezcla contenido que el usuario no eligió", () => {
    const page = legacyFeedPage(POSTS, 0);
    expect(page.some((p) => p.source === "sugerido" || p.source === "publicidad")).toBe(true);
  });
});

describe("explicaciones", () => {
  it("explica publicidad y sugeridos con claridad", () => {
    const ad = POSTS.find((p) => p.source === "publicidad")!;
    expect(explainPost(ad, ctx).some((r) => r.icon === "ad")).toBe(true);
    const sug = POSTS.find((p) => p.source === "sugerido")!;
    expect(explainPost(sug, ctx).some((r) => r.icon === "popular")).toBe(true);
  });

  it("en cronológico lo dice explícitamente", () => {
    const r = explainPost(POSTS[0]!, { mode: "cronologico", interests: [] });
    expect(r.some((x) => x.icon === "recent")).toBe(true);
  });
});

describe("burbuja de filtro", () => {
  const w = { a: 10, b: 1, c: 1, d: 1, e: 1, f: 1 };
  it("la versión actual amplifica el tema más mirado", () => {
    expect(bubbleMix(w, "actual").a).toBeGreaterThan(0.8);
  });
  it("la versión ética limita cada tema al 30% y suma 1", () => {
    const m = bubbleMix(w, "etico");
    expect(m.a).toBeCloseTo(0.3, 5);
    expect(Object.values(m).reduce((x, y) => x + y, 0)).toBeCloseTo(1, 5);
  });
  it("la diversidad ética es mayor", () => {
    expect(diversityIndex(Object.values(bubbleMix(w, "etico")))).toBeGreaterThan(diversityIndex(Object.values(bubbleMix(w, "actual"))));
  });
  it("diversify evita rachas", () => {
    const items = [{ topic: "humor" as const }, { topic: "humor" as const }, { topic: "humor" as const }, { topic: "arte" as const }];
    expect(diversify(items, 2).map((x) => x.topic)).toEqual(["humor", "humor", "arte", "humor"]);
  });
});
