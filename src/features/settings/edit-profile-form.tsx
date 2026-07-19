"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { updateProfileAction } from "@/server/actions/misc-actions";
import type { Profile } from "@/types/domain";

const ROLE_LABELS: Record<Profile["role"], string> = {
  estudiante_secundario: "Estudiante secundario",
  estudiante_universitario: "Estudiante universitario",
  profesional: "Profesional",
  otro: "Otro",
};

export function EditProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const [displayName, setDisplayName] = React.useState(profile.displayName);
  const [role, setRole] = React.useState<Profile["role"]>(profile.role);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (displayName.trim().length === 0) return;
    startTransition(async () => {
      try {
        await updateProfileAction({ displayName: displayName.trim(), role });
        toast({ title: "Perfil actualizado correctamente." });
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "No se pudo actualizar el perfil",
          description: error instanceof Error ? error.message : undefined,
        });
      }
    });
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
      <div className="space-y-1.5">
        <Label htmlFor="profile-name">Nombre</Label>
        <Input
          id="profile-name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={60}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="profile-role">Rol</Label>
        <Select value={role} onValueChange={(value) => setRole(value as Profile["role"])}>
          <SelectTrigger id="profile-role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(ROLE_LABELS) as Profile["role"][]).map((r) => (
              <SelectItem key={r} value={r}>
                {ROLE_LABELS[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Button type="submit" size="sm" disabled={isPending || displayName.trim().length === 0}>
          {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
          Guardar cambios
        </Button>
      </div>
    </form>
  );
}
