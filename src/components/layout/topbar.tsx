"use client";

import * as React from "react";
import { LogOut, Search, Sparkles } from "lucide-react";

import type { SessionUser } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface TopbarProps {
  user: SessionUser;
  /** Opens the quick-capture flow. No-op until that feature is wired up. */
  onQuickCapture?: () => void;
  /** Signs the user out. No-op until the sign-out server action is wired up. */
  onSignOut?: () => void;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "?";
}

export function Topbar({ user, onQuickCapture, onSignOut }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background px-4 md:px-6">
      <form action="/buscar" className="flex flex-1 items-center gap-2">
        <Label htmlFor="topbar-search" className="sr-only">
          Buscar
        </Label>
        <div className="relative w-full max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input id="topbar-search" name="q" type="search" placeholder="Buscar..." className="pl-9" />
        </div>
      </form>

      <Button type="button" size="sm" onClick={() => onQuickCapture?.()}>
        <Sparkles aria-hidden="true" />
        Captura rapida
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label={`Menu de usuario: ${user.displayName}`}
          >
            <Avatar>
              <AvatarFallback>{initials(user.displayName)}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{user.displayName}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => onSignOut?.()}>
            <LogOut aria-hidden="true" />
            Cerrar sesion
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
