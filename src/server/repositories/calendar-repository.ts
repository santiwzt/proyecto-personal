import { getDemoStore } from "@/lib/database/demo/store";
import { generateId } from "@/lib/database/demo/ids";
import { AppError } from "@/lib/errors/app-error";
import { isDemoMode } from "@/config/env";
import { createSupabaseServerClient } from "@/lib/database/supabase/server";
import type { AvailabilityRule, CalendarEvent } from "@/types/domain";
import type { AvailabilityRulesTable, EventsTable } from "@/types/database";

type NewEvent = Omit<CalendarEvent, "id" | "userId" | "createdAt">;
type NewAvailabilityRule = Omit<AvailabilityRule, "id" | "userId">;

function dbError(action: string, error: { message: string }): never {
  console.error(`Supabase error (${action}):`, error.message);
  throw new AppError("INTERNAL", "Ocurrio un error al acceder a la base de datos.");
}

function mapEvent(row: EventsTable["Row"]): CalendarEvent {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    category: row.category,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    location: row.location,
    isFixed: row.is_fixed,
    relatedExamId: row.related_exam_id,
    relatedTaskId: row.related_task_id,
    relatedProjectId: row.related_project_id,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export const eventsRepository = {
  async list(userId: string): Promise<CalendarEvent[]> {
    if (isDemoMode) return getDemoStore().events.list(userId);
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("events").select("*").eq("user_id", userId).order("starts_at");
    if (error) dbError("events.list", error);
    return data.map(mapEvent);
  },

  async listBetween(userId: string, startIso: string, endIso: string): Promise<CalendarEvent[]> {
    if (isDemoMode) {
      return getDemoStore()
        .events.list(userId)
        .filter((e) => e.startsAt < endIso && e.endsAt > startIso);
    }
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("user_id", userId)
      .lt("starts_at", endIso)
      .gt("ends_at", startIso)
      .order("starts_at");
    if (error) dbError("events.listBetween", error);
    return data.map(mapEvent);
  },

  async get(userId: string, id: string): Promise<CalendarEvent> {
    if (isDemoMode) {
      const event = getDemoStore().events.get(userId, id);
      if (!event) throw new AppError("NOT_FOUND", "No encontramos el evento.");
      return event;
    }
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("events").select("*").eq("user_id", userId).eq("id", id).single();
    if (error) throw new AppError("NOT_FOUND", "No encontramos el evento.");
    return mapEvent(data);
  },

  async create(userId: string, input: NewEvent): Promise<CalendarEvent> {
    if (isDemoMode) {
      return getDemoStore().events.insert({ ...input, id: generateId("event"), userId, createdAt: new Date().toISOString() });
    }
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("events")
      .insert({
        user_id: userId,
        title: input.title,
        category: input.category,
        starts_at: input.startsAt,
        ends_at: input.endsAt,
        location: input.location,
        is_fixed: input.isFixed,
        related_exam_id: input.relatedExamId,
        related_task_id: input.relatedTaskId,
        related_project_id: input.relatedProjectId,
        notes: input.notes,
      })
      .select("*")
      .single();
    if (error) dbError("events.create", error);
    return mapEvent(data);
  },

  async update(userId: string, id: string, patch: Partial<NewEvent>): Promise<CalendarEvent> {
    if (isDemoMode) return getDemoStore().events.update(userId, id, patch);
    const supabase = await createSupabaseServerClient();
    const dbPatch: Partial<EventsTable["Update"]> = {};
    if (patch.title !== undefined) dbPatch.title = patch.title;
    if (patch.category !== undefined) dbPatch.category = patch.category;
    if (patch.startsAt !== undefined) dbPatch.starts_at = patch.startsAt;
    if (patch.endsAt !== undefined) dbPatch.ends_at = patch.endsAt;
    if (patch.location !== undefined) dbPatch.location = patch.location;
    if (patch.isFixed !== undefined) dbPatch.is_fixed = patch.isFixed;
    if (patch.relatedExamId !== undefined) dbPatch.related_exam_id = patch.relatedExamId;
    if (patch.relatedTaskId !== undefined) dbPatch.related_task_id = patch.relatedTaskId;
    if (patch.relatedProjectId !== undefined) dbPatch.related_project_id = patch.relatedProjectId;
    if (patch.notes !== undefined) dbPatch.notes = patch.notes;
    const { data, error } = await supabase
      .from("events")
      .update(dbPatch)
      .eq("user_id", userId)
      .eq("id", id)
      .select("*")
      .single();
    if (error) dbError("events.update", error);
    return mapEvent(data);
  },

  async remove(userId: string, id: string): Promise<void> {
    if (isDemoMode) {
      getDemoStore().events.remove(userId, id);
      return;
    }
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("events").delete().eq("user_id", userId).eq("id", id);
    if (error) dbError("events.remove", error);
  },
};

function mapAvailabilityRule(row: AvailabilityRulesTable["Row"]): AvailabilityRule {
  return {
    id: row.id,
    userId: row.user_id,
    weekday: row.weekday,
    startTime: row.start_time,
    endTime: row.end_time,
    kind: row.kind,
    label: row.label,
  };
}

export const availabilityRepository = {
  async list(userId: string): Promise<AvailabilityRule[]> {
    if (isDemoMode) return getDemoStore().availabilityRules.list(userId);
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("availability_rules")
      .select("*")
      .eq("user_id", userId)
      .order("weekday");
    if (error) dbError("availabilityRules.list", error);
    return data.map(mapAvailabilityRule);
  },

  async create(userId: string, input: NewAvailabilityRule): Promise<AvailabilityRule> {
    if (isDemoMode) return getDemoStore().availabilityRules.insert({ ...input, id: generateId("avail"), userId });
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("availability_rules")
      .insert({
        user_id: userId,
        weekday: input.weekday,
        start_time: input.startTime,
        end_time: input.endTime,
        kind: input.kind,
        label: input.label,
      })
      .select("*")
      .single();
    if (error) dbError("availabilityRules.create", error);
    return mapAvailabilityRule(data);
  },

  async update(userId: string, id: string, patch: Partial<NewAvailabilityRule>): Promise<AvailabilityRule> {
    if (isDemoMode) return getDemoStore().availabilityRules.update(userId, id, patch);
    const supabase = await createSupabaseServerClient();
    const dbPatch: Partial<AvailabilityRulesTable["Update"]> = {};
    if (patch.weekday !== undefined) dbPatch.weekday = patch.weekday;
    if (patch.startTime !== undefined) dbPatch.start_time = patch.startTime;
    if (patch.endTime !== undefined) dbPatch.end_time = patch.endTime;
    if (patch.kind !== undefined) dbPatch.kind = patch.kind;
    if (patch.label !== undefined) dbPatch.label = patch.label;
    const { data, error } = await supabase
      .from("availability_rules")
      .update(dbPatch)
      .eq("user_id", userId)
      .eq("id", id)
      .select("*")
      .single();
    if (error) dbError("availabilityRules.update", error);
    return mapAvailabilityRule(data);
  },

  async remove(userId: string, id: string): Promise<void> {
    if (isDemoMode) {
      getDemoStore().availabilityRules.remove(userId, id);
      return;
    }
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("availability_rules").delete().eq("user_id", userId).eq("id", id);
    if (error) dbError("availabilityRules.remove", error);
  },
};
