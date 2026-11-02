import type { Tab } from "@/components/phone/phone-context";
import type { Version } from "@/types";

export interface Mechanism {
  title: string;
  text: string;
}

export const TAB_LABELS: Record<Tab, string> = {
  inicio: "Feed",
  explorar: "Explorar",
  reels: "Reels",
  actividad: "Notificaciones",
  perfil: "Perfil y métricas",
};

/** Qué mecanismo está activo en cada pantalla, según la versión. */
export const MECHANISMS: Record<Tab, Record<Version, Mechanism[]>> = {
  inicio: {
    actual: [
      { title: "Scroll infinito", text: "Cuando llegás al final se cargan más publicaciones solas. No hay un punto natural para parar." },
      { title: "Contenido que no elegiste", text: "Entre tus amigos aparecen sugeridos y publicidad, ordenados por lo que más reacciones genera." },
      { title: "Likes a la vista", text: "\"Le gusta a X y 248.301 personas más\": la popularidad se vuelve lo primero que mirás." },
      { title: "Interrupciones", text: "Cada ~20 segundos baja un banner y hay puntos rojos en el corazón y los mensajes." },
      { title: "Invitación a refrescar", text: "El botón \"Publicaciones nuevas\" aparece para que vuelvas arriba y sigas." },
    ],
    etico: [
      { title: "Bloques con pausa", text: "Cada 5 publicaciones: \"Ya viste las novedades más importantes. ¿Querés seguir o hacer una pausa?\"" },
      { title: "Tiene final", text: "Cuando viste todo lo de tus cuentas aparece \"Estás al día\". Las sugerencias son opcionales." },
      { title: "¿Por qué lo veo?", text: "Cada publicación explica por qué está ahí, con botones para ver menos de un tema." },
      { title: "Vos elegís el orden", text: "Para vos (amigos + intereses, sin repetir temas) o cronológico puro." },
      { title: "Tiempo visible", text: "Un indicador discreto arriba muestra cuánto llevás hoy, sin juzgar." },
    ],
  },
  explorar: {
    actual: [
      { title: "Grilla sin fondo", text: "Al bajar se cargan más miniaturas, para siempre." },
      { title: "Burbuja", text: "El contenido más viral (acá, fitness) se repite una y otra vez." },
    ],
    etico: [
      { title: "Temas elegidos", text: "Filtrás por tema y podés agregarlo o quitarlo de tus intereses ahí mismo." },
      { title: "Algo distinto", text: "Una sección con temas fuera de tu burbuja, para ampliar." },
      { title: "Final del día", text: "\"Eso es todo por hoy en Explorar.\"" },
    ],
  },
  reels: {
    actual: [
      { title: "Bucle automático", text: "Los videos se repiten solos y el siguiente está a un deslizamiento." },
      { title: "Sin contador", text: "No sabés cuántos viste ni cuánto tiempo pasó." },
      { title: "Lista infinita", text: "Siempre hay otro reel. Nunca llegás al final." },
    ],
    etico: [
      { title: "Contador discreto", text: "Arriba a la derecha: cuántos reels viste hoy y tu límite." },
      { title: "Pausas opcionales", text: "Cada 5 reels (configurable) aparece una tarjeta para decidir si seguís." },
      { title: "Límite diario", text: "Al llegar a tu límite podés terminar la sesión o ver 5 más: vos decidís." },
      { title: "Cierre sin pérdida", text: "\"Terminar sesión\" muestra un resumen y tus guardados quedan en el perfil." },
    ],
  },
  actividad: {
    actual: [
      { title: "Urgencia artificial", text: "\"¡No te lo pierdas!\", \"¡Está explotando! 🔥\", \"¡Se termina HOY!\"." },
      { title: "Contador rojo", text: "\"Tenés 23 notificaciones nuevas\": un número para que entres a mirar." },
      { title: "Todo mezclado", text: "Un mensaje de tu amiga vale lo mismo que una publicidad o un vivo random." },
      { title: "Comparación", text: "\"Tu publicación tiene menos likes que la anterior\"." },
    ],
    etico: [
      { title: "Lo importante primero", text: "Personas que te escribieron arriba; likes y seguidores, resumidos abajo." },
      { title: "Vos elegís cuándo", text: "Al instante solo lo importante, dos resúmenes al día o uno solo." },
      { title: "Lenguaje neutro", text: "Misma información, sin presión: \"A 47 personas les gustó tu publicación\"." },
      { title: "Categorías", text: "Podés apagar sugerencias, vivos y publicidad por completo." },
    ],
  },
  perfil: {
    actual: [
      { title: "Números protagonistas", text: "Seguidores y seguidos en grande, arriba de todo." },
      { title: "Comparación", text: "\"32% menos me gusta que la anterior\" y un \"ranking\" entre amigos." },
      { title: "Presión por publicar", text: "Consejos para publicar más seguido y a cierta hora." },
    ],
    etico: [
      { title: "Seguidores en segundo plano", text: "Los números están, pero chiquitos y sin destacar." },
      { title: "Métricas privadas", text: "\"Mis métricas\" solo las ves vos, y no te comparan con nadie." },
      { title: "Interacciones significativas", text: "Se mide charlas con amigos, guardados y compartidos, no solo likes." },
      { title: "Guardados a mano", text: "Lo que guardaste en el feed o en reels aparece en la pestaña Guardados." },
    ],
  },
};

/** Tabla resumen antes/después. */
export const COMPARISON: { area: string; actual: string; etico: string }[] = [
  { area: "Feed", actual: "Scroll infinito, sin final", etico: "Bloques de 5 con pausa y \"Estás al día\"" },
  { area: "Orden", actual: "Algoritmo opaco que prioriza engagement", etico: "Cronológico o personalizado, con explicación" },
  { area: "Notificaciones", actual: "Una por evento, con urgencia", etico: "Agrupadas, en el horario que elijas" },
  { area: "Likes", actual: "Públicos y protagonistas", etico: "Ocultos por defecto, métricas privadas" },
  { area: "Reels", actual: "Bucle infinito sin contador", etico: "Contador, pausas y límite diario" },
  { area: "Historias", actual: "Se encadenan con cuentas que no seguís", etico: "Solo amigos, con final claro" },
  { area: "Tiempo de uso", actual: "Escondido en configuración", etico: "Visible y con descansos opcionales" },
];
