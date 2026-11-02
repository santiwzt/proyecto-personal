import type { Palette, User } from "@/types";

/** Usuario que "usa" la simulación. Datos 100% ficticios. */
export const ME: User = {
  id: "me",
  handle: "valen.ruiz",
  name: "Valen Ruiz",
  hue: 162,
  followers: 412,
  following: 389,
  friend: true,
  bio: "5to año · Fotos con el celu · Club de ciencia los jueves",
};

export const USERS: User[] = [
  ME,
  { id: "lu", handle: "lu.rodriguez", name: "Lucía Rodríguez", hue: 340, followers: 836, following: 640, friend: true },
  { id: "tomi", handle: "tomi.bianchi", name: "Tomás Bianchi", hue: 210, followers: 512, following: 498, friend: true },
  { id: "martu", handle: "martu.gomez", name: "Martina Gómez", hue: 28, followers: 1290, following: 702, friend: true },
  { id: "fran", handle: "fran_sosa", name: "Francisco Sosa", hue: 120, followers: 377, following: 420, friend: true },
  { id: "cami", handle: "cami.ferreyra", name: "Camila Ferreyra", hue: 280, followers: 958, following: 811, friend: true },
  { id: "nacho", handle: "nacho.paz", name: "Ignacio Paz", hue: 48, followers: 604, following: 580, friend: true },
  { id: "viajes", handle: "patagonia.lenta", name: "Patagonia Lenta", hue: 190, followers: 284000, following: 210, verified: true, bio: "Viajar sin apuro por el sur." },
  { id: "cocina", handle: "cocina.de.la.abuela", name: "Cocina de la Abuela", hue: 18, followers: 1_200_000, following: 90, verified: true },
  { id: "ciencia", handle: "club.ciencia.ar", name: "Club de Ciencia AR", hue: 230, followers: 96000, following: 320 },
  { id: "futbol", handle: "futbol.de.barrio", name: "Fútbol de Barrio", hue: 140, followers: 2_400_000, following: 40, verified: true },
  { id: "memes", handle: "memes.del.aula", name: "Memes del Aula", hue: 300, followers: 3_100_000, following: 12 },
  { id: "moda", handle: "moda.circular", name: "Moda Circular", hue: 350, followers: 412000, following: 150 },
  { id: "arte", handle: "arte.urbano.ba", name: "Arte Urbano BA", hue: 12, followers: 158000, following: 260 },
  { id: "gamer", handle: "pixel.cafe", name: "Pixel Café", hue: 260, followers: 870000, following: 80 },
  { id: "astro", handle: "cielo.austral", name: "Cielo Austral", hue: 222, followers: 64000, following: 140 },
  { id: "fit", handle: "cuerpo.10", name: "Cuerpo 10", hue: 8, followers: 5_600_000, following: 3, verified: true },
  { id: "marca", handle: "zapas.ya", name: "Zapas YA", hue: 30, followers: 920000, following: 1, verified: true },
];

export const userById = (id: string): User => USERS.find((u) => u.id === id) ?? ME;

/** Paletas de las ilustraciones (reemplazan fotos reales). */
export const PALETTES = {
  dusk: { a: "#2B2E4A", b: "#E84545", c: "#903749", d: "#53354A", e: "#FFD369" },
  alpine: { a: "#B8D8E8", b: "#F4E9D8", c: "#6B8FA3", d: "#2F4858", e: "#FFF4D6" },
  lagoon: { a: "#9AD0EC", b: "#EFDAD7", c: "#1597BB", d: "#0F3D56", e: "#FFE9A0" },
  ember: { a: "#FF9A62", b: "#FFD3A5", c: "#C8553D", d: "#4A2A2A", e: "#FFF1D0" },
  moss: { a: "#DCE8D2", b: "#F6F3E8", c: "#6E8B5E", d: "#2E4A33", e: "#F2C14E" },
  ink: { a: "#0E1428", b: "#2A3F6B", c: "#3E5C8A", d: "#0A0F1E", e: "#F7E7A6" },
  sand: { a: "#F6D7B0", b: "#FBEFDF", c: "#E1A95F", d: "#9C5B2E", e: "#FFFFFF" },
  bloom: { a: "#FFD6E0", b: "#FFEFCF", c: "#F88DAD", d: "#6D3B6E", e: "#FFFFFF" },
  neon: { a: "#1A1033", b: "#3C1A5B", c: "#FF3CAC", d: "#2B86C5", e: "#FFE66D" },
  pitch: { a: "#3E8E41", b: "#4CAF50", c: "#2E7D32", d: "#1B5E20", e: "#FFFFFF" },
  terracota: { a: "#F3E3D3", b: "#EBC9A9", c: "#C66B3D", d: "#7A3E2A", e: "#F9D976" },
  mint: { a: "#D4F1E4", b: "#F7FBF8", c: "#7FC8A9", d: "#33605A", e: "#FFB385" },
} satisfies Record<string, Palette>;
