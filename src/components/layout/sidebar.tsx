"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { appConfig } from "@/config/app";
import { cn } from "@/lib/utils";
import { navItems } from "@/components/layout/nav-items";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { subjectColorClasses } from "@/features/subjects/subject-color";
import type { Project, Subject } from "@/types/domain";

export interface SidebarProps {
  subjects: Subject[];
  projects: Project[];
}

/** Nested link one level under a nav item, mirroring how Asana lists your actual projects under "Projects" instead of a single generic link. */
function SubNavLink({ href, isActive, dotClassName, label }: { href: string; isActive: boolean; dotClassName?: string; label: string }) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-md py-1.5 pl-9 pr-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isActive
          ? "bg-secondary text-secondary-foreground font-medium"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      {dotClassName ? <span className={cn("size-1.5 shrink-0 rounded-full", dotClassName)} aria-hidden="true" /> : null}
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function Sidebar({ subjects, projects }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-border bg-background md:flex">
      <div className="flex h-16 items-center px-6">
        <span className="font-display text-xl font-semibold tracking-tight">{appConfig.shortName}</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2" aria-label="Navegacion principal">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <div key={item.href}>
              <Link
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

              {item.href === "/estudios" && subjects.length > 0 ? (
                <div className="mt-1 space-y-0.5">
                  {subjects.map((subject) => (
                    <SubNavLink
                      key={subject.id}
                      href={`/estudios/${subject.id}`}
                      isActive={pathname === `/estudios/${subject.id}`}
                      dotClassName={subjectColorClasses[subject.color].dot}
                      label={subject.name}
                    />
                  ))}
                </div>
              ) : null}

              {item.href === "/proyectos" && projects.length > 0 ? (
                <div className="mt-1 space-y-0.5">
                  {projects.map((project) => (
                    <SubNavLink
                      key={project.id}
                      href={`/proyectos/${project.id}`}
                      isActive={pathname === `/proyectos/${project.id}`}
                      label={project.name}
                    />
                  ))}
                </div>
              ) : null}
            </div>
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
