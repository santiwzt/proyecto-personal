/** Tipos compartidos por toda la simulación. */

export type Version = "actual" | "etico";

export type Interest =
  | "amigos"
  | "deportes"
  | "musica"
  | "arte"
  | "ciencia"
  | "humor"
  | "moda"
  | "comida"
  | "viajes"
  | "gaming"
  | "naturaleza"
  | "estudio";

export type SceneKind =
  | "mountains"
  | "ocean"
  | "city"
  | "dunes"
  | "forest"
  | "orbit"
  | "mate"
  | "books"
  | "stage"
  | "field"
  | "empanadas"
  | "night";

export interface Palette {
  /** Cielo / fondo superior */
  a: string;
  /** Cielo / fondo inferior */
  b: string;
  /** Plano medio */
  c: string;
  /** Primer plano */
  d: string;
  /** Acento (sol, luces, detalles) */
  e: string;
}

export interface User {
  id: string;
  handle: string;
  name: string;
  /** Tono base (0-360) del avatar generado. */
  hue: number;
  followers: number;
  following: number;
  verified?: boolean;
  /** Persona que el usuario conoce de verdad (amistad). */
  friend?: boolean;
  bio?: string;
}

export interface Comment {
  id: string;
  authorId: string;
  text: string;
  minutesAgo: number;
  likes?: number;
}

/** Por qué una publicación aparece en el feed. */
export type PostSource = "amigo" | "seguido" | "sugerido" | "publicidad";

export interface Post {
  id: string;
  authorId: string;
  scene: SceneKind;
  palette: Palette;
  caption: string;
  topic: Interest;
  likes: number;
  comments: Comment[];
  minutesAgo: number;
  source: PostSource;
  location?: string;
}

export interface StoryFrame {
  scene: SceneKind;
  palette: Palette;
  text?: string;
}

export interface Story {
  userId: string;
  frames: StoryFrame[];
}

export interface Reel {
  id: string;
  authorId: string;
  scene: SceneKind;
  palette: Palette;
  caption: string;
  audio: string;
  likes: number;
  comments: number;
  topic: Interest;
}

export type NotificationType =
  | "mensaje"
  | "mencion"
  | "comentario"
  | "like"
  | "seguidor"
  | "vivo"
  | "sugerencia"
  | "historia";

export type NotificationCategory = "mensajes" | "comentarios" | "likes" | "seguidores" | "sugerencias";

export interface AppNotification {
  id: string;
  type: NotificationType;
  actorIds: string[];
  /** Cantidad total de personas (puede ser mayor a actorIds). */
  count: number;
  minutesAgo: number;
  /** Texto "como lo escribe" una app optimizada para retención. */
  legacyText: string;
  /** Texto neutro, sin urgencia artificial. */
  calmText: string;
  postId?: string;
  preview?: string;
}

export type FeedMode = "personalizado" | "cronologico";
export type NotifSchedule = "importantes" | "resumen" | "diario";

export interface Settings {
  feedMode: FeedMode;
  /** Intereses activos para el feed personalizado. */
  interests: Interest[];
  /** Temas que el usuario pidió ver menos. */
  lessOf: Interest[];
  notifSchedule: NotifSchedule;
  notifCategories: Record<NotificationCategory, boolean>;
  hideLikes: boolean;
  wellbeingMode: boolean;
  /** Minutos para el recordatorio de descanso (0 = apagado). */
  breakReminder: number;
  /** Límite diario de reels (0 = sin límite). */
  reelsLimit: number;
  /** Cada cuántos reels se ofrece una pausa. */
  reelsPauseEvery: number;
}
