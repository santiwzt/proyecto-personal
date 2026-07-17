"use server";

import { revalidatePath } from "next/cache";
import { requireSessionUser } from "@/lib/auth/session";
import { availabilityRepository, eventsRepository } from "@/server/repositories/calendar-repository";
import {
  createAvailabilityRuleSchema,
  createEventSchema,
  type CreateAvailabilityRuleInput,
  type CreateEventInput,
} from "@/lib/validation/schemas";
import type { AvailabilityRule, CalendarEvent } from "@/types/domain";

export async function createEventAction(input: CreateEventInput): Promise<CalendarEvent> {
  const user = await requireSessionUser();
  const parsed = createEventSchema.parse(input);
  const event = await eventsRepository.create(user.userId, parsed);
  revalidatePath("/agenda");
  revalidatePath("/hoy");
  return event;
}

export async function updateEventAction(id: string, input: Partial<CreateEventInput>): Promise<CalendarEvent> {
  const user = await requireSessionUser();
  const parsed = createEventSchema.partial().parse(input);
  const event = await eventsRepository.update(user.userId, id, parsed);
  revalidatePath("/agenda");
  return event;
}

export async function deleteEventAction(id: string): Promise<void> {
  const user = await requireSessionUser();
  await eventsRepository.remove(user.userId, id);
  revalidatePath("/agenda");
  revalidatePath("/hoy");
}

export async function createAvailabilityRuleAction(input: CreateAvailabilityRuleInput): Promise<AvailabilityRule> {
  const user = await requireSessionUser();
  const parsed = createAvailabilityRuleSchema.parse(input);
  const rule = await availabilityRepository.create(user.userId, parsed);
  revalidatePath("/configuracion");
  revalidatePath("/agenda");
  return rule;
}

export async function deleteAvailabilityRuleAction(id: string): Promise<void> {
  const user = await requireSessionUser();
  await availabilityRepository.remove(user.userId, id);
  revalidatePath("/configuracion");
  revalidatePath("/agenda");
}
