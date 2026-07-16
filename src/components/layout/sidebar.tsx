"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { appConfig } from "@/config/app";
import { cn } from "@/lib/utils";
import { navItems } from "@/components/layout/nav-items";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-border bg-background md:flex">
      <div className="flex h-16 items-center px-6">
        <span className="text-lg font-semibold tracking-tight">{appConfig.shortName}</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2" aria-label="Navegacion principal">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isActive
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center justify-between border-t border-border px-3 py-3">
        <span className="px-1 text-xs text-muted-foreground">Tema</span>
        <ThemeToggle />
      </div>
    </aside>
  );
}
