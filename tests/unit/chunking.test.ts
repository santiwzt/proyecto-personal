import { describe, expect, it } from "vitest";
import { chunkText } from "@/server/services/chunking";

describe("chunkText", () => {
  it("returns no chunks for empty input", () => {
    expect(chunkText("")).toEqual([]);
    expect(chunkText("   ")).toEqual([]);
  });

  it("keeps short text as a single chunk", () => {
    const chunks = chunkText("Hola, este es un texto corto.", 1000);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.content).toContain("texto corto");
  });

  it("splits long text into multiple chunks without exceeding the size by much", () => {
    const paragraph = "Palabra ".repeat(50).trim() + ".";
    const longText = Array.from({ length: 10 }, () => paragraph).join("\n\n");
    const chunks = chunkText(longText, 200, 20);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.charCount).toBeLessThanOrEqual(260);
    }
  });

  it("assigns sequential indexes", () => {
    const paragraph = "Palabra ".repeat(50).trim() + ".";
    const longText = Array.from({ length: 6 }, () => paragraph).join("\n\n");
    const chunks = chunkText(longText, 150, 10);
    chunks.forEach((chunk, i) => expect(chunk.index).toBe(i));
  });
});
