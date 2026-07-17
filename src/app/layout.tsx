import type { Metadata, Viewport } from "next";

import { appConfig } from "@/config/app";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { ServiceWorkerRegistration } from "@/components/shared/service-worker-registration";

import "./globals.css";

export const metadata: Metadata = {
  title: appConfig.name,
  description: appConfig.description,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: appConfig.shortName,
  },
};

export const viewport: Viewport = {
  themeColor: "#2a2554",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster />
          <ServiceWorkerRegistration />
        </ThemeProvider>
      </body>
    </html>
  );
}
