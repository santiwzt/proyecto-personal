"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import { mobilePrimaryNavItems, navItems } from "@/components/layout/nav-items";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function MobileNav() {
  const pathname = usePathname();
  const primaryHrefs = new Set(mobilePrimaryNavItems.map((item) => item.href));
  const restItems = navItems.filter((item) => !primaryHrefs.has(item.href));
  const isRestActive = restItems.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  return (
    <nav
      aria-label="Navegacion principal"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-background md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {mobilePrimaryNavItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
              isActive ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}

      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
            isRestActive ? "text-primary" : "text-muted-foreground",
          )}
        >
          <MoreHorizontal className="size-5" aria-hidden="true" />
          Mas
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="mb-2 w-48">
          {restItems.map((item) => {
            const Icon = item.icon;
            return (
              <DropdownMenuItem key={item.href} asChild>
                <Link href={item.href} className="flex items-center gap-2">
                  <Icon className="size-4" aria-hidden="true" />
                  {item.label}
                </Link>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
