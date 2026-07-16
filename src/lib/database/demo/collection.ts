import { AppError } from "@/lib/errors/app-error";

interface Owned {
  id: string;
  userId: string;
}

/**
 * Minimal in-memory table used by the demo data store. Enforces the same
 * "never read another user's row" rule a real RLS policy would enforce, so
 * the security tests exercise real logic instead of a mock.
 */
export class InMemoryCollection<T extends Owned> {
  private items: T[];

  constructor(seed: T[] = []) {
    this.items = [...seed];
  }

  list(userId: string): T[] {
    return this.items.filter((item) => item.userId === userId);
  }

  get(userId: string, id: string): T | null {
    const item = this.items.find((i) => i.id === id);
    if (!item) return null;
    if (item.userId !== userId) {
      throw new AppError("AUTHORIZATION", "No tenes acceso a este recurso.");
    }
    return item;
  }

  /** Like get(), but returns null instead of throwing on cross-user access. */
  findOwned(userId: string, id: string): T | null {
    const item = this.items.find((i) => i.id === id && i.userId === userId);
    return item ?? null;
  }

  insert(item: T): T {
    this.items.push(item);
    return item;
  }

  update(userId: string, id: string, patch: Partial<Omit<T, "id" | "userId">>): T {
    const existing = this.get(userId, id);
    if (!existing) {
      throw new AppError("NOT_FOUND", "No encontramos el recurso solicitado.");
    }
    const updated = { ...existing, ...patch } as T;
    this.items = this.items.map((i) => (i.id === id ? updated : i));
    return updated;
  }

  remove(userId: string, id: string): void {
    const existing = this.get(userId, id);
    if (!existing) {
      throw new AppError("NOT_FOUND", "No encontramos el recurso solicitado.");
    }
    this.items = this.items.filter((i) => i.id !== id);
  }

  all(): T[] {
    return this.items;
  }
}
