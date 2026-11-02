import type { Post, Reel, Story } from "@/types";
import { PALETTES as P } from "./users";

/**
 * Publicaciones ficticias. `source` indica por qué llegan al feed:
 * - amigo / seguido: cuentas que el usuario eligió seguir.
 * - sugerido / publicidad: contenido que la plataforma decide agregar.
 */
export const POSTS: Post[] = [
  {
    id: "p1", authorId: "lu", scene: "mountains", palette: P.alpine, topic: "viajes", source: "amigo",
    caption: "Primer día en Bariloche con la promo 🏔️ el frío no nos para", likes: 184, minutesAgo: 22,
    location: "San Carlos de Bariloche",
    comments: [
      { id: "c1", authorId: "martu", text: "Qué envidiaaa, traeme chocolate", minutesAgo: 18, likes: 4 },
      { id: "c2", authorId: "tomi", text: "La foto está tremenda, ¿con qué la sacaste?", minutesAgo: 12, likes: 2 },
    ],
  },
  {
    id: "p2", authorId: "fit", scene: "field", palette: P.pitch, topic: "deportes", source: "sugerido",
    caption: "Si no entrenás hoy, mañana te vas a arrepentir. 30 días para el cuerpo perfecto 💪", likes: 248_301, minutesAgo: 60,
    comments: [{ id: "c3", authorId: "memes", text: "yo mirando esto desde la cama", minutesAgo: 40, likes: 3201 }],
  },
  {
    id: "p3", authorId: "tomi", scene: "stage", palette: P.neon, topic: "musica", source: "amigo",
    caption: "Ensayo con la banda para la feria del cole. Vengan el viernes 🎸", likes: 96, minutesAgo: 48,
    comments: [
      { id: "c4", authorId: "cami", text: "Vamos todo el curso!!", minutesAgo: 30, likes: 5 },
      { id: "c5", authorId: "nacho", text: "Llevo el parlante si hace falta", minutesAgo: 25, likes: 1 },
    ],
  },
  {
    id: "p4", authorId: "marca", scene: "city", palette: P.dusk, topic: "moda", source: "publicidad",
    caption: "ÚLTIMAS 3 HORAS ⏰ 40% OFF en toda la colección. Después no digas que no te avisamos.", likes: 12_480, minutesAgo: 90,
    comments: [],
  },
  {
    id: "p5", authorId: "ciencia", scene: "night", palette: P.ink, topic: "ciencia", source: "seguido",
    caption: "Esta noche se ve Saturno a simple vista hacia el noreste. Les dejamos una guía para encontrarlo 🔭", likes: 3_412, minutesAgo: 120,
    comments: [{ id: "c6", authorId: "fran", text: "Lo vi desde la terraza, una locura", minutesAgo: 80, likes: 12 }],
  },
  {
    id: "p6", authorId: "martu", scene: "mate", palette: P.terracota, topic: "amigos", source: "amigo",
    caption: "Ronda de mates antes de estudiar para Historia. Alguien entiende la Revolución de Mayo?", likes: 141, minutesAgo: 150,
    comments: [
      { id: "c7", authorId: "lu", text: "Te paso mi resumen, está en el drive del curso", minutesAgo: 140, likes: 6 },
    ],
  },
  {
    id: "p7", authorId: "memes", scene: "orbit", palette: P.bloom, topic: "humor", source: "sugerido",
    caption: "Cuando la profe dice \"esto no entra\" y después entra 💀", likes: 512_904, minutesAgo: 180,
    comments: [{ id: "c8", authorId: "nacho", text: "literal la semana pasada", minutesAgo: 160, likes: 8912 }],
  },
  {
    id: "p8", authorId: "viajes", scene: "ocean", palette: P.lagoon, topic: "viajes", source: "seguido",
    caption: "Puerto Madryn en temporada de ballenas. Mejor época: de junio a diciembre.", likes: 18_230, minutesAgo: 240,
    location: "Puerto Madryn, Chubut",
    comments: [],
  },
  {
    id: "p9", authorId: "cami", scene: "books", palette: P.sand, topic: "estudio", source: "amigo",
    caption: "Terminé el trabajo de Literatura 📚 recomiendo mucho \"Los ojos del perro siberiano\"", likes: 77, minutesAgo: 300,
    comments: [{ id: "c9", authorId: "martu", text: "Me lo prestás??", minutesAgo: 280, likes: 2 }],
  },
  {
    id: "p10", authorId: "cocina", scene: "empanadas", palette: P.ember, topic: "comida", source: "seguido",
    caption: "Empanadas salteñas, receta completa. El secreto está en el repulgue.", likes: 64_120, minutesAgo: 360,
    comments: [],
  },
  {
    id: "p11", authorId: "fran", scene: "field", palette: P.pitch, topic: "deportes", source: "amigo",
    caption: "Ganamos el intercolegial ⚽ 3 a 1 y gol mío de cabeza", likes: 203, minutesAgo: 420,
    comments: [
      { id: "c10", authorId: "tomi", text: "Crack!! Qué golazo", minutesAgo: 400, likes: 9 },
      { id: "c11", authorId: "lu", text: "Grande Fran 👏", minutesAgo: 390, likes: 3 },
    ],
  },
  {
    id: "p12", authorId: "arte", scene: "city", palette: P.bloom, topic: "arte", source: "sugerido",
    caption: "Nuevo mural en Barracas. 14 artistas, 3 semanas de trabajo.", likes: 9_830, minutesAgo: 480,
    location: "Barracas, CABA",
    comments: [],
  },
  {
    id: "p13", authorId: "nacho", scene: "dunes", palette: P.sand, topic: "viajes", source: "amigo",
    caption: "Vacaciones de invierno en Cafayate con la familia ☀️", likes: 118, minutesAgo: 600,
    location: "Cafayate, Salta",
    comments: [],
  },
  {
    id: "p14", authorId: "fit", scene: "field", palette: P.ember, topic: "deportes", source: "sugerido",
    caption: "Comparate con vos de hace un año. ¿Estás orgulloso? 🔥 #sinexcusas", likes: 301_220, minutesAgo: 640,
    comments: [],
  },
  {
    id: "p15", authorId: "astro", scene: "night", palette: P.dusk, topic: "ciencia", source: "seguido",
    caption: "La Vía Láctea desde la Puna. 25 segundos de exposición, sin edición.", likes: 7_201, minutesAgo: 720,
    comments: [],
  },
  {
    id: "p16", authorId: "gamer", scene: "orbit", palette: P.neon, topic: "gaming", source: "sugerido",
    caption: "Top 5 juegos indie que nadie te recomendó (y deberían)", likes: 41_002, minutesAgo: 800,
    comments: [],
  },
  {
    id: "p17", authorId: "lu", scene: "forest", palette: P.moss, topic: "naturaleza", source: "amigo",
    caption: "Caminata al Cerro Campanario. Valió cada escalón.", likes: 162, minutesAgo: 900,
    comments: [],
  },
  {
    id: "p18", authorId: "moda", scene: "orbit", palette: P.terracota, topic: "moda", source: "sugerido",
    caption: "Cómo armar 10 outfits con 5 prendas de segunda mano ♻️", likes: 22_340, minutesAgo: 1000,
    comments: [],
  },
  {
    id: "p19", authorId: "cami", scene: "mate", palette: P.mint, topic: "amigos", source: "amigo",
    caption: "Merienda post-examen. Sobrevivimos a Química 🧪", likes: 89, minutesAgo: 1300,
    comments: [],
  },
  {
    id: "p20", authorId: "fit", scene: "field", palette: P.dusk, topic: "deportes", source: "sugerido",
    caption: "El 90% de la gente abandona. ¿Vos sos del 10%? 💯", likes: 188_400, minutesAgo: 1400,
    comments: [],
  },
];

export const postById = (id: string): Post | undefined => POSTS.find((p) => p.id === id);

export const STORIES: Story[] = [
  { userId: "lu", frames: [
    { scene: "mountains", palette: P.alpine, text: "Llegamos!!" },
    { scene: "forest", palette: P.moss, text: "Día 2: trekking" },
  ] },
  { userId: "tomi", frames: [{ scene: "stage", palette: P.neon, text: "Viernes 18 h · Feria del cole" }] },
  { userId: "martu", frames: [
    { scene: "mate", palette: P.terracota, text: "Estudiando 🫠" },
    { scene: "books", palette: P.sand },
  ] },
  { userId: "fran", frames: [{ scene: "field", palette: P.pitch, text: "CAMPEONES" }] },
  { userId: "cami", frames: [{ scene: "books", palette: P.mint, text: "Recomendación del día" }] },
  { userId: "nacho", frames: [{ scene: "dunes", palette: P.sand }] },
  // A partir de acá: cuentas no amigas (la app actual las encadena automáticamente).
  { userId: "memes", frames: [{ scene: "orbit", palette: P.bloom, text: "Encuesta: ¿quién copió en la prueba?" }] },
  { userId: "fit", frames: [{ scene: "field", palette: P.ember, text: "¿Ya entrenaste hoy?" }] },
  { userId: "marca", frames: [{ scene: "city", palette: P.dusk, text: "SOLO HOY ⏰" }] },
];

export const REELS: Reel[] = [
  { id: "r1", authorId: "memes", scene: "orbit", palette: P.bloom, topic: "humor", caption: "POV: es lunes y hay prueba", audio: "Audio original · memes.del.aula", likes: 1_204_000, comments: 8_420 },
  { id: "r2", authorId: "viajes", scene: "ocean", palette: P.lagoon, topic: "viajes", caption: "Ballenas a 10 metros de la costa 🐋", audio: "Sonido del mar", likes: 89_000, comments: 1_210 },
  { id: "r3", authorId: "fit", scene: "field", palette: P.ember, topic: "deportes", caption: "Rutina de 7 minutos que cambió mi vida", audio: "Motivación · beats", likes: 2_300_000, comments: 12_800 },
  { id: "r4", authorId: "cocina", scene: "empanadas", palette: P.ember, topic: "comida", caption: "Repulgue perfecto en 15 segundos", audio: "Audio original · cocina.de.la.abuela", likes: 640_000, comments: 4_100 },
  { id: "r5", authorId: "tomi", scene: "stage", palette: P.neon, topic: "musica", caption: "Adelanto del tema para la feria 🎶", audio: "Audio original · tomi.bianchi", likes: 132, comments: 18 },
  { id: "r6", authorId: "astro", scene: "night", palette: P.ink, topic: "ciencia", caption: "Timelapse: 6 horas de cielo en 20 segundos", audio: "Ambient · Cielo Austral", likes: 54_000, comments: 610 },
  { id: "r7", authorId: "gamer", scene: "orbit", palette: P.neon, topic: "gaming", caption: "El bug más raro que vas a ver hoy", audio: "Audio original · pixel.cafe", likes: 410_000, comments: 3_900 },
  { id: "r8", authorId: "moda", scene: "city", palette: P.terracota, topic: "moda", caption: "Feria americana: outfit completo por $8.000", audio: "Tendencia · verano", likes: 77_000, comments: 990 },
  { id: "r9", authorId: "arte", scene: "city", palette: P.bloom, topic: "arte", caption: "Así se pinta un mural de 20 metros", audio: "Lo-fi para pintar", likes: 33_000, comments: 402 },
  { id: "r10", authorId: "fran", scene: "field", palette: P.pitch, topic: "deportes", caption: "El gol de la final 🔁", audio: "Audio original · fran_sosa", likes: 210, comments: 34 },
  { id: "r11", authorId: "ciencia", scene: "night", palette: P.dusk, topic: "ciencia", caption: "¿Por qué el cielo es azul? En 30 segundos", audio: "Audio original · club.ciencia.ar", likes: 28_000, comments: 350 },
  { id: "r12", authorId: "memes", scene: "orbit", palette: P.mint, topic: "humor", caption: "Grupo de WhatsApp del curso a las 3 a.m.", audio: "Audio original · memes.del.aula", likes: 980_000, comments: 7_700 },
];
