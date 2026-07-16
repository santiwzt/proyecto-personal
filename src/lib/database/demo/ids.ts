let counter = 0;

/** Deterministic-enough id generator for the demo store (no external deps). */
export function generateId(prefix: string): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter.toString(36)}`;
}

export const DEMO_USER_ID = "demo-user-santiago";
/** Second seeded user, used only by security/isolation tests — never shown in the UI. */
export const SECONDARY_DEMO_USER_ID = "demo-user-otro";
