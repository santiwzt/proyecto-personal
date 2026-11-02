import type { AppNotification } from "@/types";

/**
 * Notificaciones ficticias. Cada una tiene dos redacciones:
 * - legacyText: el estilo que busca urgencia y volver a abrir la app.
 * - calmText: la misma información, dicha de forma neutra.
 */
export const NOTIFICATIONS: AppNotification[] = [
  {
    id: "n1", type: "mensaje", actorIds: ["lu"], count: 1, minutesAgo: 3,
    legacyText: "lu.rodriguez te mandó un mensaje 👀 ¡Respondé antes de que se desconecte!",
    calmText: "Lucía te escribió: \"¿Mañana hay que llevar el TP impreso?\"",
    preview: "¿Mañana hay que llevar el TP impreso?",
  },
  {
    id: "n2", type: "like", actorIds: ["martu", "cami", "nacho"], count: 47, minutesAgo: 5, postId: "p6",
    legacyText: "martu.gomez, cami.ferreyra y 45 personas más les gustó tu publicación. ¡Está explotando! 🔥",
    calmText: "A 47 personas les gustó tu publicación.",
  },
  {
    id: "n3", type: "vivo", actorIds: ["memes"], count: 1, minutesAgo: 6,
    legacyText: "🔴 memes.del.aula está EN VIVO ahora. 12 mil personas mirando. ¡No te lo pierdas!",
    calmText: "memes.del.aula hizo un vivo.",
  },
  {
    id: "n4", type: "comentario", actorIds: ["tomi"], count: 1, minutesAgo: 9, postId: "p6",
    legacyText: "tomi.bianchi comentó tu publicación. Mirá lo que dijo 👇",
    calmText: "Tomás comentó: \"Yo me sumo a estudiar, llevo facturas\"",
    preview: "Yo me sumo a estudiar, llevo facturas",
  },
  {
    id: "n5", type: "historia", actorIds: ["fran"], count: 23, minutesAgo: 12,
    legacyText: "23 personas vieron tu historia. ¿Querés saber quiénes? 👁️",
    calmText: "Tu historia tuvo 23 vistas.",
  },
  {
    id: "n6", type: "sugerencia", actorIds: ["fit"], count: 1, minutesAgo: 15,
    legacyText: "cuerpo.10 publicó algo que no te podés perder. Tus amigos ya lo vieron.",
    calmText: "Sugerencia: cuerpo.10 publicó contenido nuevo.",
  },
  {
    id: "n7", type: "seguidor", actorIds: ["nacho", "fran"], count: 6, minutesAgo: 20,
    legacyText: "¡6 personas nuevas te siguen! Seguí creciendo: publicá algo hoy ✨",
    calmText: "6 personas empezaron a seguirte.",
  },
  {
    id: "n8", type: "mencion", actorIds: ["cami"], count: 1, minutesAgo: 26,
    legacyText: "cami.ferreyra te mencionó en un comentario 💬",
    calmText: "Camila te mencionó: \"@valen.ruiz vos tenés las fotocopias?\"",
    preview: "@valen.ruiz vos tenés las fotocopias?",
  },
  {
    id: "n9", type: "like", actorIds: ["lu", "tomi"], count: 19, minutesAgo: 34, postId: "p6",
    legacyText: "lu.rodriguez y 18 personas más reaccionaron a tu historia ❤️",
    calmText: "19 personas reaccionaron a tu historia.",
  },
  {
    id: "n10", type: "sugerencia", actorIds: ["marca"], count: 1, minutesAgo: 40,
    legacyText: "⏰ ¡Se termina HOY! Las zapas que viste están por agotarse.",
    calmText: "Publicidad: zapas.ya tiene descuentos.",
  },
  {
    id: "n11", type: "seguidor", actorIds: ["moda"], count: 1, minutesAgo: 52,
    legacyText: "Quizás conozcas a moda.circular. ¡Seguila para no perderte nada!",
    calmText: "Sugerencia de cuenta: moda.circular.",
  },
  {
    id: "n12", type: "like", actorIds: ["cami"], count: 12, minutesAgo: 70, postId: "p9",
    legacyText: "Tu publicación tiene menos likes que la anterior. Probá publicar a las 20 h 📈",
    calmText: "A 12 personas les gustó tu foto del libro.",
  },
];

/** Notificaciones que "llegan" mientras se usa la versión actual (banner). */
export const LIVE_PINGS: string[] = [
  "martu.gomez y 12 personas más le dieron me gusta a tu foto ❤️",
  "🔴 Alguien que seguís está en vivo AHORA",
  "Tenés 3 mensajes sin leer 💬",
  "¡Tu historia está teniendo muchas vistas! 👀",
  "tomi.bianchi publicó por primera vez en un tiempo",
  "⏰ Última oportunidad: ofertas que viste ayer",
];
