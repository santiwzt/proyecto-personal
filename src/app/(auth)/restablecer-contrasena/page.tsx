import { KeyRound } from "lucide-react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { appConfig } from "@/config/app";
import { UpdatePasswordForm } from "@/features/auth/update-password-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ResetPasswordPage() {
  // Only reachable with a real session, which the recovery link itself
  // establishes (via /auth/confirm) before redirecting here.
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <KeyRound aria-hidden="true" className="size-6" />
          </div>
          <CardTitle className="font-display text-xl">{appConfig.shortName}</CardTitle>
          <CardDescription>Elegi una nueva contraseña para tu cuenta.</CardDescription>
        </CardHeader>
        <CardContent>
          <UpdatePasswordForm />
        </CardContent>
      </Card>
    </main>
  );
}
