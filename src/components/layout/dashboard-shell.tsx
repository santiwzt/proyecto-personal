"use client";

import * as React from "react";
import type { SessionUser } from "@/lib/auth/session";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { QuickCaptureDialog } from "@/components/shared/quick-capture-dialog";
import { HelpDialog } from "@/components/shared/help-dialog";
import { endSession } from "@/server/actions/auth-actions";

export interface DashboardShellProps {
  user: SessionUser;
  children: React.ReactNode;
}

/** Responsive app shell: sidebar + topbar on desktop, topbar + bottom nav on mobile. */
export function DashboardShell({ user, children }: DashboardShellProps) {
  const [captureOpen, setCaptureOpen] = React.useState(false);
  const [helpOpen, setHelpOpen] = React.useState(false);

  return (
    <div className="min-h-dvh md:pl-60">
      <Sidebar />
      <Topbar
        user={user}
        onQuickCapture={() => setCaptureOpen(true)}
        onOpenHelp={() => setHelpOpen(true)}
        onSignOut={() => endSession()}
      />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-6 md:px-6 md:pb-10">{children}</main>
      <MobileNav />
      <QuickCaptureDialog open={captureOpen} onOpenChange={setCaptureOpen} />
      <HelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  );
}
