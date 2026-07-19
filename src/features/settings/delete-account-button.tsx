"use client";

import * as React from "react";
import { unstable_rethrow } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { deleteAccountAction } from "@/server/actions/auth-actions";

const CONFIRM_WORD = "ELIMINAR";

export function DeleteAccountButton() {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [confirmText, setConfirmText] = React.useState("");
  const [isPending, startTransition] = React.useTransition();

  function handleDelete() {
    startTransition(async () => {
      try {
        const result = await deleteAccountAction();
        if (!result.ok) {
          toast({ variant: "destructive", title: "No se pudo eliminar la cuenta", description: result.message });
        }
      } catch (error) {
        unstable_rethrow(error);
        toast({ variant: "destructive", title: "No se pudo eliminar la cuenta" });
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setConfirmText("");
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="destructive" size="sm">
          <Trash2 className="size-4" aria-hidden="true" /> Eliminar cuenta
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar tu cuenta</DialogTitle>
          <DialogDescription>
            Esto borra para siempre todas tus materias, tareas, examenes, eventos, archivos, proyectos, habitos,
            gastos y todo lo demas que cargaste. No se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="delete-account-confirm">
            Escribi <span className="font-semibold">{CONFIRM_WORD}</span> para confirmar
          </Label>
          <Input
            id="delete-account-confirm"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            autoComplete="off"
          />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending || confirmText !== CONFIRM_WORD}
            onClick={handleDelete}
          >
            {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
            Eliminar todo permanentemente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
