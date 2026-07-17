"use client";

import * as React from "react";

/** Registers the PWA service worker (installability + push notifications). Renders nothing. */
export function ServiceWorkerRegistration() {
  React.useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Service worker registration failed:", error);
      });
    }
  }, []);

  return null;
}
