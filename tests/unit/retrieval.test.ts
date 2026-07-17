import { describe, expect, it } from "vitest";
import {
  buildExcerpt,
  retrieveRelevantChunks,
  significantTerms,
  splitIntoSentences,
} from "@/server/services/retrieval";
import type { FileChunk } from "@/types/domain";

function makeChunk(id: string, content: string): FileChunk {
  return {
    id,
    userId: "u1",
    fileId: `file-${id}`,
    chunkIndex: 0,
    content,
    charCount: content.length,
    page: null,
    embedding: null,
  };
}

describe("significantTerms", () => {
  it("strips accents, stopwords, and short tokens", () => {
    const terms = significantTerms("La aceleración es de 9.8 y el objeto sube");
    expect(terms).toContain("aceleracion");
    expect(terms).toContain("objeto");
    expect(terms).toContain("sube");
    expect(terms).not.toContain("la");
    expect(terms).not.toContain("es");
    expect(terms).not.toContain("de");
  });
});

describe("splitIntoSentences", () => {
  it("splits on sentence-ending punctuation and trims whitespace", () => {
    const sentences = splitIntoSentences("Primera oracion. Segunda oracion! ¿Tercera oracion?");
    expect(sentences).toEqual(["Primera oracion.", "Segunda oracion!", "¿Tercera oracion?"]);
  });

  it("returns an empty array for empty input", () => {
    expect(splitIntoSentences("")).toEqual([]);
  });
});

describe("retrieveRelevantChunks", () => {
  it("ranks a chunk containing a rare query term above one padded with common words", () => {
    const rareChunk = makeChunk("rare", "La fotosintesis convierte luz solar en energia quimica dentro del cloroplasto.");
    const paddedChunk = makeChunk(
      "padded",
      "Este texto habla de historia, geografia, economia, arte, musica y deportes en general.",
    );
    const results = retrieveRelevantChunks([paddedChunk, rareChunk], "fotosintesis cloroplasto", 4);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]!.chunk.id).toBe("rare");
  });

  it("gives an extra boost to a chunk containing the exact query phrase", () => {
    const exactPhraseChunk = makeChunk("exact", "El tiro vertical es un caso particular del movimiento rectilineo.");
    const scatteredChunk = makeChunk(
      "scattered",
      "El tiro parabolico y el movimiento vertical son temas distintos que se estudian por separado en la unidad.",
    );
    const results = retrieveRelevantChunks([scatteredChunk, exactPhraseChunk], "tiro vertical", 4);
    expect(results[0]!.chunk.id).toBe("exact");
  });

  it("returns an empty array when the query has no significant terms or there are no chunks", () => {
    expect(retrieveRelevantChunks([makeChunk("a", "algo de contenido")], "y de la", 4)).toEqual([]);
    expect(retrieveRelevantChunks([], "aceleracion", 4)).toEqual([]);
  });
});

describe("buildExcerpt", () => {
  it("never cuts a matching sentence in half", () => {
    const content =
      "Esta es una oracion introductoria sin relacion directa con la consulta. " +
      "La aceleracion de la gravedad vale 9.8 metros por segundo al cuadrado. " +
      "Esta es otra oracion final que tampoco tiene relacion.";
    const excerpt = buildExcerpt(content, "aceleracion gravedad", 90);
    expect(excerpt).toContain("La aceleracion de la gravedad vale 9.8 metros por segundo al cuadrado.");
  });

  it("falls back to a truncated window when no sentence matches any query term", () => {
    const content = "Contenido totalmente distinto que no menciona el tema buscado en ningun lado del texto.";
    const excerpt = buildExcerpt(content, "fotosintesis", 40);
    expect(excerpt.length).toBeGreaterThan(0);
  });

  it("returns the full short sentence without ellipsis when it fits entirely", () => {
    const content = "El tiro vertical tiene aceleracion constante.";
    const excerpt = buildExcerpt(content, "tiro vertical", 300);
    expect(excerpt).toBe("El tiro vertical tiene aceleracion constante.");
  });
});
