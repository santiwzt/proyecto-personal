"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSessionUser } from "@/lib/auth/session";
import { AppError } from "@/lib/errors/app-error";
import { profileRepository } from "@/server/repositories/profile-repository";

const onboardingSchema = z.object({
  displayName: z.string().trim().min(1, "Ingresa tu nombre").max(60),
  role: z.enum(["estudiante_secundario", "estudiante_universitario", "profesional", "otro"]),
});

export async function completeOnboarding(formData: FormData): Promise<void> {
  const user = await requireSessionUser();
  const parsed = onboardingSchema.safeParse({
    displayName: formData.get("displayName"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    throw new AppError("VALIDATION", parsed.error.issues[0]?.message ?? "Datos invalidos");
  }
  await profileRepository.completeOnboarding(user.userId, parsed.data.displayName, parsed.data.role);
  redirect("/hoy");
}
