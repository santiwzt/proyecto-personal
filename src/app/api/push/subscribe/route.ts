import { requireSessionUser } from "@/lib/auth/session";
import { isAppError, toErrorResponse } from "@/lib/errors/app-error";
import { pushSubscribeSchema, pushUnsubscribeSchema } from "@/lib/validation/schemas";
import { pushSubscriptionsRepository } from "@/server/repositories/push-repository";

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = await request.json().catch(() => null);
    const parsed = pushSubscribeSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { code: "VALIDATION", message: parsed.error.issues[0]?.message ?? "Datos invalidos" },
        { status: 400 },
      );
    }
    await pushSubscriptionsRepository.subscribe(user.userId, {
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
    });
    return Response.json({ ok: true });
  } catch (error) {
    const { code, message } = toErrorResponse(error);
    return Response.json({ code, message }, { status: isAppError(error) ? error.httpStatus : 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = await request.json().catch(() => null);
    const parsed = pushUnsubscribeSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { code: "VALIDATION", message: parsed.error.issues[0]?.message ?? "Datos invalidos" },
        { status: 400 },
      );
    }
    await pushSubscriptionsRepository.unsubscribe(user.userId, parsed.data.endpoint);
    return Response.json({ ok: true });
  } catch (error) {
    const { code, message } = toErrorResponse(error);
    return Response.json({ code, message }, { status: isAppError(error) ? error.httpStatus : 500 });
  }
}
