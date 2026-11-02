import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import type { Comment, Settings, Version } from "@/types";

/* ------------------------------------------------------------------ */
/* Persistencia (solo comodidad local: si falla, la app sigue igual). */
/* ------------------------------------------------------------------ */

const KEY = "igr:state:v1";

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...(JSON.parse(raw) as T) } : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* almacenamiento no disponible: ignoramos */
  }
}

/* ------------------------------------------------------------------ */

export const DEFAULT_SETTINGS: Settings = {
  feedMode: "personalizado",
  interests: ["amigos", "ciencia", "musica", "viajes", "estudio"],
  lessOf: [],
  notifSchedule: "importantes",
  notifCategories: { mensajes: true, comentarios: true, likes: true, seguidores: true, sugerencias: false },
  hideLikes: true,
  wellbeingMode: false,
  breakReminder: 20,
  reelsLimit: 20,
  reelsPauseEvery: 5,
};

interface State {
  version: Version;
  settings: Settings;
  liked: Record<string, boolean>;
  saved: Record<string, boolean>;
  comments: Record<string, Comment[]>;
  reelsWatched: number;
}

const INITIAL: State = {
  version: "actual",
  settings: DEFAULT_SETTINGS,
  liked: {},
  saved: {},
  comments: {},
  reelsWatched: 0,
};

type Action =
  | { type: "version"; version: Version }
  | { type: "settings"; patch: Partial<Settings> }
  | { type: "like"; id: string; value?: boolean }
  | { type: "save"; id: string }
  | { type: "comment"; postId: string; comment: Comment }
  | { type: "reelWatched" }
  | { type: "reset" };

function reducer(state: State, a: Action): State {
  switch (a.type) {
    case "version":
      return { ...state, version: a.version };
    case "settings":
      return { ...state, settings: { ...state.settings, ...a.patch } };
    case "like":
      return { ...state, liked: { ...state.liked, [a.id]: a.value ?? !state.liked[a.id] } };
    case "save":
      return { ...state, saved: { ...state.saved, [a.id]: !state.saved[a.id] } };
    case "comment":
      return { ...state, comments: { ...state.comments, [a.postId]: [...(state.comments[a.postId] ?? []), a.comment] } };
    case "reelWatched":
      return { ...state, reelsWatched: state.reelsWatched + 1 };
    case "reset":
      return { ...INITIAL, version: state.version };
  }
}

interface AppApi extends State {
  setVersion: (v: Version) => void;
  update: (patch: Partial<Settings>) => void;
  toggleLike: (id: string, value?: boolean) => void;
  toggleSave: (id: string) => void;
  addComment: (postId: string, text: string) => void;
  markReelWatched: () => void;
  reset: () => void;
}

const AppCtx = createContext<AppApi | null>(null);

/* ------------------------------------------------------------------ */
/* Tiempo de uso simulado: contexto aparte para no re-renderizar todo. */
/* ------------------------------------------------------------------ */

interface UsageApi {
  seconds: number;
  /** 1 = tiempo real, 60 = cada segundo cuenta como un minuto (para presentar). */
  speed: number;
  setSpeed: (s: number) => void;
  addMinutes: (m: number) => void;
  resetUsage: () => void;
  /** Registra una pantalla activa de la simulación; devuelve la función para quitarla. */
  register: () => () => void;
}

const UsageCtx = createContext<UsageApi | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL, () => {
    const s = load<State>(KEY, INITIAL);
    return { ...s, settings: { ...DEFAULT_SETTINGS, ...s.settings } };
  });

  useEffect(() => save(KEY, state), [state]);

  const setVersion = useCallback((version: Version) => dispatch({ type: "version", version }), []);
  const update = useCallback((patch: Partial<Settings>) => dispatch({ type: "settings", patch }), []);
  const toggleLike = useCallback((id: string, value?: boolean) => dispatch({ type: "like", id, value }), []);
  const toggleSave = useCallback((id: string) => dispatch({ type: "save", id }), []);
  const addComment = useCallback(
    (postId: string, text: string) =>
      dispatch({ type: "comment", postId, comment: { id: `u${Date.now()}`, authorId: "me", text, minutesAgo: 0 } }),
    [],
  );
  const markReelWatched = useCallback(() => dispatch({ type: "reelWatched" }), []);
  const reset = useCallback(() => dispatch({ type: "reset" }), []);

  const api = useMemo<AppApi>(
    () => ({ ...state, setVersion, update, toggleLike, toggleSave, addComment, markReelWatched, reset }),
    [state, setVersion, update, toggleLike, toggleSave, addComment, markReelWatched, reset],
  );

  // --- uso simulado ---
  const [usage, setUsage] = useState(() => load("igr:usage", { seconds: 0, speed: 1 }));
  const activeCount = useRef(0);
  const [active, setActive] = useState(0);

  useEffect(() => save("igr:usage", usage), [usage]);

  useEffect(() => {
    if (!active) return;
    const t = window.setInterval(() => {
      if (document.visibilityState === "visible") setUsage((u) => ({ ...u, seconds: u.seconds + u.speed }));
    }, 1000);
    return () => window.clearInterval(t);
  }, [active]);

  const register = useCallback(() => {
    activeCount.current++;
    setActive(activeCount.current);
    return () => {
      activeCount.current--;
      setActive(activeCount.current);
    };
  }, []);

  const usageApi = useMemo<UsageApi>(
    () => ({
      seconds: usage.seconds,
      speed: usage.speed,
      setSpeed: (speed) => setUsage((u) => ({ ...u, speed })),
      addMinutes: (m) => setUsage((u) => ({ ...u, seconds: u.seconds + m * 60 })),
      resetUsage: () => setUsage((u) => ({ ...u, seconds: 0 })),
      register,
    }),
    [usage, register],
  );

  return (
    <AppCtx.Provider value={api}>
      <UsageCtx.Provider value={usageApi}>{children}</UsageCtx.Provider>
    </AppCtx.Provider>
  );
}

export function useApp(): AppApi {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp fuera de AppStateProvider");
  return ctx;
}

export function useUsage(): UsageApi {
  const ctx = useContext(UsageCtx);
  if (!ctx) throw new Error("useUsage fuera de AppStateProvider");
  return ctx;
}

/** Mientras el componente esté montado, el reloj de uso simulado corre. */
export function useUsageClock() {
  const { register } = useUsage();
  useEffect(() => register(), [register]);
}
