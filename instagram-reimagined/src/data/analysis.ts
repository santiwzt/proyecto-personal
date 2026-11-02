/**
 * Contenido del análisis ético. Se separa lo COMPROBADO (cómo funciona
 * Instagram, documentado públicamente) de los POSIBLES EFECTOS (riesgos que
 * dependen de cada persona y del uso; no le pasan a todo el mundo).
 */
export type CategoryId = "notificaciones" | "algoritmo" | "interfaz" | "metricas";

export interface Category {
  id: CategoryId;
  title: string;
  tagline: string;
  how: string;
  emotions: string[];
  risks: { title: string; text: string }[];
  facts: string[];
  effects: string[];
  proposal: string[];
}

export const CATEGORIES: Category[] = [
  {
    id: "notificaciones",
    title: "Notificaciones",
    tagline: "El celu vibra y ya lo estás agarrando.",
    how: "Cada vez que alguien te da me gusta, te comenta, te sigue o hace un vivo, la app te puede mandar un aviso. Además pone globitos rojos con números en los íconos. Muchas veces el texto está escrito para que entres ya: \"¡No te lo pierdas!\", \"mirá quién vio tu historia\".",
    emotions: ["Curiosidad", "Urgencia", "Miedo a perderse algo (FOMO)", "Alegría rápida", "Ansiedad"],
    risks: [
      { title: "Interrupción", text: "Cortan lo que estás haciendo (estudiar, dormir, charlar) aunque el aviso no sea importante." },
      { title: "Urgencia falsa", text: "Un like no necesita respuesta inmediata, pero se presenta como si sí." },
      { title: "Todo vale lo mismo", text: "El mensaje de una amiga y una publicidad llegan con el mismo sonido." },
    ],
    facts: [
      "Instagram manda notificaciones por likes, comentarios, nuevos seguidores, vivos y sugerencias de cuentas.",
      "Muestra contadores rojos en los íconos de actividad y mensajes.",
      "Tiene opciones para pausar notificaciones y un \"Modo silencio\" (lanzado en 2023), pero hay que ir a buscarlas a Configuración.",
    ],
    effects: [
      "Más dificultad para concentrarse en tareas largas, como estudiar.",
      "Revisar el celular de forma automática, sin haberlo decidido.",
      "Sensación de que si no respondés rápido te perdés algo.",
    ],
    proposal: ["Lo importante (mensajes y menciones) primero", "Resúmenes en horarios que elegís vos", "Lenguaje neutro, sin urgencia", "Apagar sugerencias y vivos con un toque"],
  },
  {
    id: "algoritmo",
    title: "Algoritmo",
    tagline: "Te conoce mejor de lo que pensás.",
    how: "El feed, Explorar y Reels no te muestran todo en orden: un sistema de recomendación elige qué ver primero según con quién interactuás, qué mirás y cuánto tiempo te quedás en cada cosa. Si mirás un tipo de video, es probable que te muestre más parecidos.",
    emotions: ["Entretenimiento", "\"Uno más y corto\"", "Sorpresa", "Aburrimiento después", "Enojo o comparación"],
    risks: [
      { title: "Burbuja", text: "Ves cada vez más de lo mismo y menos cosas distintas." },
      { title: "Menos autonomía", text: "No sabés por qué ves lo que ves ni podés cambiarlo fácil." },
      { title: "Consumo repetitivo", text: "El sistema aprende qué te mantiene mirando, no necesariamente qué te hace bien." },
    ],
    facts: [
      "Instagram explicó públicamente que ordena el contenido con señales como tu actividad, tu relación con quien publica y la popularidad de la publicación.",
      "Desde 2022 existen los feeds \"Siguiendo\" y \"Favoritos\" en orden cronológico, pero el principal sigue siendo el recomendado.",
      "Existe la opción \"¿Por qué ves esta publicación?\", pero está dentro del menú de cada publicación.",
    ],
    effects: [
      "Quedarse en un tema (por ejemplo, cuerpos \"perfectos\" o fitness) y verlo una y otra vez.",
      "Recibir menos diversidad de ideas, gustos y opiniones.",
      "Pasar más tiempo del que uno quería.",
    ],
    proposal: ["\"¿Por qué estoy viendo esto?\" visible en cada publicación", "Elegir entre cronológico y personalizado", "Controles de intereses y \"ver menos de esto\"", "Nunca más de 2 publicaciones seguidas del mismo tema"],
  },
  {
    id: "interfaz",
    title: "Interfaz",
    tagline: "No tiene final, entonces no hay cuándo parar.",
    how: "El scroll infinito carga más contenido cada vez que llegás abajo. Los Reels arrancan solos y se repiten en bucle. Las historias pasan solas de una persona a otra. No hay un \"final de la página\" que te dé una señal natural para cortar.",
    emotions: ["Relajación al principio", "Pérdida de la noción del tiempo", "Culpa al darte cuenta", "Cansancio"],
    risks: [
      { title: "Sin puntos de parada", text: "Si nunca se termina, la decisión de cortar depende 100% de tu fuerza de voluntad." },
      { title: "Reproducción automática", text: "No elegís ver el siguiente video: ya está pasando." },
      { title: "Herramientas escondidas", text: "Los controles de tiempo existen, pero no están a la vista." },
    ],
    facts: [
      "El feed, Explorar y Reels usan scroll infinito.",
      "Los Reels se reproducen automáticamente y en bucle.",
      "Instagram tiene \"Tomate un descanso\" (2021) y un límite de tiempo diario, pero para adultos vienen apagados por defecto.",
      "En las Cuentas para adolescentes (2024) algunas protecciones vienen activadas, como el modo de descanso nocturno.",
    ],
    effects: [
      "Usar la app mucho más tiempo del que se planeaba.",
      "Menos horas de sueño si se usa de noche.",
      "Dificultad para retomar otras actividades.",
    ],
    proposal: ["Feed en bloques con \"¿Querés seguir o hacer una pausa?\"", "\"Estás al día\" cuando viste todo", "Reels con contador, pausas y límite diario", "Tiempo de uso siempre visible"],
  },
  {
    id: "metricas",
    title: "Métricas",
    tagline: "Un número que parece decir cuánto valés.",
    how: "Cada publicación muestra cuántos me gusta tiene y cada perfil muestra seguidores y seguidos en grande. Esos números se ven antes que la foto o lo que la persona quiso contar, y es fácil compararse con los demás.",
    emotions: ["Validación", "Orgullo", "Envidia", "Inseguridad", "Presión por publicar"],
    risks: [
      { title: "Comparación social", text: "Medirse con los números de otras personas, que muchas veces muestran solo lo mejor." },
      { title: "Búsqueda de aprobación", text: "Publicar pensando en cuántos likes va a tener y no en lo que querés compartir." },
      { title: "Popularidad = calidad", text: "Un número alto hace que algo parezca mejor, aunque no lo sea." },
    ],
    facts: [
      "Los me gusta son públicos por defecto. Desde 2021 se pueden ocultar, en el feed y en tus propias publicaciones.",
      "En 2019 Instagram probó ocultar los likes en países como Canadá, Australia y Brasil.",
      "En 2021, documentos internos de Meta publicados por The Wall Street Journal mostraron que la empresa había estudiado efectos negativos de Instagram en la imagen corporal de algunas adolescentes.",
    ],
    effects: [
      "Autoestima atada a la cantidad de likes o seguidores.",
      "Borrar publicaciones que \"no rindieron\".",
      "Ansiedad por compararse con influencers o compañeros.",
    ],
    proposal: ["Likes ocultos por defecto", "Seguidores en segundo plano", "Métricas privadas para quien publica", "Medir interacciones significativas, no solo popularidad"],
  },
];
