import { getDemoStore } from "@/lib/database/demo/store";
import { generateId } from "@/lib/database/demo/ids";
import { AppError } from "@/lib/errors/app-error";
import type { AvailabilityRule, CalendarEvent } from "@/types/domain";

type NewEvent = Omit<CalendarEvent, "id" | "userId" | "createdAt">;
type NewAvailabilityRule = Omit<AvailabilityRule, "id" | "userId">;

export const eventsRepository = {
  list(userId: string): CalendarEvent[] {
    return getDemoStore().events.list(userId);
  },
  listBetween(userId: string, startIso: string, endIso: string): CalendarEvent[] {
    return getDemoStore()
      .events.list(userId)
      .filter((e) => e.startsAt < endIso && e.endsAt > startIso);
  },
  get(userId: string, id: string): CalendarEvent {
    const event = getDemoStore().events.get(userId, id);
    if (!event) throw new AppError("NOT_FOUND", "No encontramos el evento.");
    return event;
  },
  create(userId: string, input: NewEvent): CalendarEvent {
    return getDemoStore().events.insert({
      ...input,
      id: generateId("event"),
      userId,
      createdAt: new Date().toISOString(),
    });
  },
  update(userId: string, id: string, patch: Partial<NewEvent>): CalendarEvent {
    return getDemoStore().events.update(userId, id, patch);
  },
  remove(userId: string, id: string): void {
    getDemoStore().events.remove(userId, id);
  },
};

export const availabilityRepository = {
  list(userId: string): AvailabilityRule[] {
    return getDemoStore().availabilityRules.list(userId);
  },
  create(userId: string, input: NewAvailabilityRule): AvailabilityRule {
    return getDemoStore().availabilityRules.insert({ ...input, id: generateId("avail"), userId });
  },
  update(userId: string, id: string, patch: Partial<NewAvailabilityRule>): AvailabilityRule {
    return getDemoStore().availabilityRules.update(userId, id, patch);
  },
  remove(userId: string, id: string): void {
    getDemoStore().availabilityRules.remove(userId, id);
  },
};
