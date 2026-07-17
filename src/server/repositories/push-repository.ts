import { getDemoStore } from "@/lib/database/demo/store";
import { generateId } from "@/lib/database/demo/ids";
import { AppError } from "@/lib/errors/app-error";
import { isDemoMode } from "@/config/env";
import { createSupabaseServerClient } from "@/lib/database/supabase/server";
import { createSupabaseAdminClient } from "@/lib/database/supabase/admin";
import type { PushSubscriptionRecord } from "@/types/domain";
import type { PushSubscriptionsTable } from "@/types/database";

function dbError(action: string, error: { message: string }): never {
  console.error(`Supabase error (${action}):`, error.message);
  throw new AppError("INTERNAL", "Ocurrio un error al acceder a la base de datos.");
}

function mapSubscription(row: PushSubscriptionsTable["Row"]): PushSubscriptionRecord {
  return {
    id: row.id,
    userId: row.user_id,
    endpoint: row.endpoint,
    p256dh: row.p256dh,
    auth: row.auth,
    createdAt: row.created_at,
  };
}

export const pushSubscriptionsRepository = {
  async listForUser(userId: string): Promise<PushSubscriptionRecord[]> {
    if (isDemoMode) return getDemoStore().pushSubscriptions.list(userId);
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("push_subscriptions").select("*").eq("user_id", userId);
    if (error) dbError("pushSubscriptions.listForUser", error);
    return data.map(mapSubscription);
  },

  /**
   * Every subscribed device, across every user. Only meaningful in Supabase
   * mode (the demo store is not durable and reminders have nothing real to
   * check against); used exclusively by the reminders cron job, via the
   * admin client, since that job must read across all users and RLS scopes
   * everything to a single authenticated user.
   */
  async listAll(): Promise<PushSubscriptionRecord[]> {
    if (isDemoMode) return getDemoStore().pushSubscriptions.all();
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.from("push_subscriptions").select("*");
    if (error) dbError("pushSubscriptions.listAll", error);
    return data.map(mapSubscription);
  },

  async subscribe(
    userId: string,
    input: { endpoint: string; p256dh: string; auth: string },
  ): Promise<PushSubscriptionRecord> {
    if (isDemoMode) {
      const store = getDemoStore();
      const existing = store.pushSubscriptions.list(userId).find((s) => s.endpoint === input.endpoint);
      if (existing) return store.pushSubscriptions.update(userId, existing.id, input);
      return store.pushSubscriptions.insert({
        id: generateId("push"),
        userId,
        ...input,
        createdAt: new Date().toISOString(),
      });
    }
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("push_subscriptions")
      .upsert(
        { user_id: userId, endpoint: input.endpoint, p256dh: input.p256dh, auth: input.auth },
        { onConflict: "user_id,endpoint" },
      )
      .select("*")
      .single();
    if (error) dbError("pushSubscriptions.subscribe", error);
    return mapSubscription(data);
  },

  async unsubscribe(userId: string, endpoint: string): Promise<void> {
    if (isDemoMode) {
      const store = getDemoStore();
      const existing = store.pushSubscriptions.list(userId).find((s) => s.endpoint === endpoint);
      if (existing) store.pushSubscriptions.remove(userId, existing.id);
      return;
    }
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", userId)
      .eq("endpoint", endpoint);
    if (error) dbError("pushSubscriptions.unsubscribe", error);
  },

  /** Removes a subscription that the push service reported as gone (410/404), across whichever user owns it. Admin-only, used by the cron sender. */
  async removeByEndpoint(endpoint: string): Promise<void> {
    if (isDemoMode) return;
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
    if (error) dbError("pushSubscriptions.removeByEndpoint", error);
  },
};
