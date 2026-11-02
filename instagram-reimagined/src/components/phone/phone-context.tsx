import { createContext, useContext } from "react";
import type { Version } from "@/types";

export type Tab = "inicio" | "explorar" | "reels" | "actividad" | "perfil";

export interface PhoneApi {
  version: Version;
  /** Modo bienestar efectivo (solo en la versión ética). */
  calm: boolean;
  tab: Tab;
  setTab: (t: Tab) => void;
  openComments: (postId: string) => void;
  openWhy: (postId: string) => void;
  openStory: (index: number) => void;
  openWellbeing: () => void;
  openInterests: () => void;
  openMetrics: () => void;
  toast: (msg: string) => void;
}

export const PhoneCtx = createContext<PhoneApi | null>(null);

export function usePhone(): PhoneApi {
  const ctx = useContext(PhoneCtx);
  if (!ctx) throw new Error("usePhone fuera de PhoneApp");
  return ctx;
}
