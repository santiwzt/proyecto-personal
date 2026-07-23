import webPush from "web-push";
import { env, isPushConfigured } from "@/config/env";
import { createSupabaseAdminClient } from "@/lib/database/supabase/admin";
import { todayISODate } from "@/lib/dates";
import { pushSubscriptionsRepository } from "@/server/repositories/push-repository";
import { buildDailyReminder } from "@/server/services/reminders";
import type { ExamStatus, TaskStatus } from "@/types/domain";

export const runtime = "nodejs";

/**
 * Runs once a day (see vercel.json crons). For every user with at least one
 * push subscription, checks their real tasks/exams for "due today or
 * tomorrow" and sends a single summarizing notification if there's
 * something to say (see src/server/services/reminders.ts for the
 * deterministic decision logic — no AI involved).
 *
 * Only meaningful in Supabase mode: the demo store isn't durable enough for
 * "check tomorrow" to mean anything, and there is no real device to push to
 * across separate demo sessions.
 */
async function sendDailyReminders(): Promise<{ sent: number; users: number }> {
  webPush.setVapidDetails(env.VAPID_SUBJECT, env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!, env.VAPID_PRIVATE_KEY!);

  const subscriptions = await pushSubscriptionsRepository.listAll();
  const userIds = [...new Set(subscriptions.map((s) => s.userId))];
  if (userIds.length === 0) return { sent: 0, users: 0 };

  const supabase = createSupabaseAdminClient();
  const now = new Date();
  let sent = 0;

  const todayStr = todayISODate(now);

  for (const userId of userIds) {
    const [{ data: taskRows }, { data: examRows }, { data: habitRows }, { data: habitLogRows }] = await Promise.all([
      supabase.from("tasks").select("due_at, status").eq("user_id", userId).not("due_at", "is", null),
      supabase.from("exams").select("title, scheduled_at, status").eq("user_id", userId).eq("status", "programado"),
      supabase.from("habits").select("id, name, archived_at").eq("user_id", userId),
      supabase.from("habit_logs").select("habit_id, date, completed").eq("user_id", userId).eq("date", todayStr),
    ]);

    const tasks = (taskRows ?? []).map((r) => ({ dueAt: r.due_at, status: r.status as TaskStatus }));
    const exams = (examRows ?? []).map((r) => ({
      title: r.title,
      scheduledAt: r.scheduled_at,
      status: r.status as ExamStatus,
    }));
    const habits = (habitRows ?? []).map((r) => ({ id: r.id, name: r.name, archivedAt: r.archived_at }));
    const habitLogs = (habitLogRows ?? []).map((r) => ({ habitId: r.habit_id, date: r.date, completed: r.completed }));

    const reminder = buildDailyReminder({ tasks, exams, habits, habitLogs, now });
    if (!reminder) continue;

    const userSubscriptions = subscriptions.filter((s) => s.userId === userId);
    for (const sub of userSubscriptions) {
      try {
        await webPush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title: reminder.title, body: reminder.body, url: "/hoy" }),
        );
        sent += 1;
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          // The push service confirms this device unsubscribed/expired — clean it up.
          await pushSubscriptionsRepository.removeByEndpoint(sub.endpoint);
        } else {
          console.error(`Push send failed for user ${userId}:`, error);
        }
      }
    }
  }

  return { sent, users: userIds.length };
}

async function handleCronRequest(request: Request): Promise<Response> {
  if (env.CRON_SECRET) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${env.CRON_SECRET}`) {
      return Response.json({ code: "AUTHENTICATION", message: "No autorizado." }, { status: 401 });
    }
  }

  if (!isPushConfigured) {
    return Response.json({ ok: true, skipped: "push not configured" });
  }

  try {
    const result = await sendDailyReminders();
    return Response.json({ ok: true, ...result });
  } catch (error) {
    console.error("Daily reminders cron failed:", error);
    return Response.json({ code: "INTERNAL", message: "Fallo el envio de recordatorios." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return handleCronRequest(request);
}

export async function POST(request: Request) {
  return handleCronRequest(request);
}
