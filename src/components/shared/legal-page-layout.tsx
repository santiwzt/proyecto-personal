import Link from "next/link";
import type { ReactNode } from "react";
import { appConfig } from "@/config/app";

export function LegalPageLayout({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto min-h-dvh max-w-2xl px-4 py-12">
      <Link href="/" className="text-sm text-muted-foreground hover:underline">
        ← Volver a {appConfig.shortName}
      </Link>
      <h1 className="mt-4 font-display text-3xl font-semibold text-foreground">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Ultima actualizacion: {lastUpdated}</p>
      <div className="mt-8 space-y-6 pb-16">{children}</div>
    </main>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}
