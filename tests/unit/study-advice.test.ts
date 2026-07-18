import { describe, expect, it } from "vitest";
import { buildGeneralAdvice, inferSubjectCategory } from "@/server/services/study-advice";

describe("inferSubjectCategory", () => {
  it("returns general when there is no subject name", () => {
    expect(inferSubjectCategory(null)).toBe("general");
  });

  it("matches a subject by keyword, case and accent insensitive", () => {
    expect(inferSubjectCategory("Física")).toBe("fisica");
    expect(inferSubjectCategory("FISICA")).toBe("fisica");
    expect(inferSubjectCategory("Matemática II")).toBe("matematica");
    expect(inferSubjectCategory("Historia Argentina")).toBe("historia");
    expect(inferSubjectCategory("Programación I")).toBe("programacion");
  });

  it("falls back to general for a subject with no matching keyword", () => {
    expect(inferSubjectCategory("Taller de Robotica Avanzada 3000")).toBe("general");
  });
});

describe("buildGeneralAdvice", () => {
  it("names the subject and gives category-specific tips when a subject is known", () => {
    const advice = buildGeneralAdvice("Física");
    expect(advice).toContain("Física");
    expect(advice).toContain("diagrama");
  });

  it("gives generic tips without naming a subject when none is provided", () => {
    const advice = buildGeneralAdvice(null);
    expect(advice).not.toContain("tuyo de");
    expect(advice.length).toBeGreaterThan(20);
  });

  it("never claims the advice comes from the user's own material", () => {
    const advice = buildGeneralAdvice("Historia");
    expect(advice.toLowerCase()).toContain("no tengo material");
  });
});
