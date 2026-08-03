export type MethodCategory = "enfoque" | "memoria" | "comprension" | "organizacion";

export interface StudyMethod {
  id: string;
  name: string;
  category: MethodCategory;
  summary: string;
  howTo: string[];
  bestFor: string;
}

export const METHOD_CATEGORY_LABELS: Record<MethodCategory, string> = {
  enfoque: "Enfoque",
  memoria: "Memoria",
  comprension: "Comprension",
  organizacion: "Organizacion",
};

/**
 * Curated set of well-known, evidence-based study/focus techniques, written
 * out with enough depth to actually apply them (not just a one-line tip).
 * Static content -- no AI involved, safe to hardcode since it's pedagogical
 * advice, not a factual claim about specific course content.
 */
export const STUDY_METHODS: StudyMethod[] = [
  {
    id: "pomodoro",
    name: "Tecnica Pomodoro",
    category: "enfoque",
    summary: "Bloques cortos de estudio con descansos fijos, para sostener la concentracion sin agotarte.",
    howTo: [
      "Elegi una sola tarea (ej: \"practicar 10 ejercicios de MRUV\").",
      "Pone un timer de 25 minutos y trabaja solo en eso, sin distracciones.",
      "Cuando suene, parate y descansa 5 minutos de verdad (no celular con scroll).",
      "Cada 4 bloques de 25 minutos, tomate un descanso mas largo (15-20 minutos).",
    ],
    bestFor: "Cuando te cuesta arrancar o sostener la atencion en tareas largas.",
  },
  {
    id: "repeticion-espaciada",
    name: "Repeticion espaciada",
    category: "memoria",
    summary: "Repasar el mismo tema en intervalos cada vez mas separados, en vez de todo junto la noche anterior.",
    howTo: [
      "Despues de aprender algo nuevo, repasalo al dia siguiente.",
      "Volve a repasarlo a los 3 dias, despues a la semana, despues a las 2 semanas.",
      "Si te cuesta recordarlo en un repaso, acorta el intervalo siguiente; si te sale facil, alargalo.",
      "Anota la fecha del ultimo repaso de cada tema para no perder el hilo.",
    ],
    bestFor: "Contenido que necesitas recordar a largo plazo (vocabulario, formulas, fechas historicas).",
  },
  {
    id: "recuperacion-activa",
    name: "Recuperacion activa (Active Recall)",
    category: "memoria",
    summary: "Practicar recordar la informacion desde cero, en vez de releer el apunte una y otra vez.",
    howTo: [
      "Cerra el apunte y escribi (o decí en voz alta) todo lo que te acordas del tema.",
      "Recien despues, abri el apunte y compara que te faltó o que dijiste mal.",
      "Convertí los temas en preguntas y respondelas sin mirar (podes usar el modo Preguntame del asistente).",
      "Repetí el ejercicio en otro momento, no inmediatamente despues de haber leido.",
    ],
    bestFor: "Cualquier materia -- es la tecnica con mas evidencia de que funciona mejor que releer.",
  },
  {
    id: "feynman",
    name: "Tecnica Feynman",
    category: "comprension",
    summary: "Explicar un concepto con palabras simples, como si se lo enseñaras a alguien que no sabe nada del tema.",
    howTo: [
      "Elegi un concepto y escribi una explicacion como si se la contaras a un chico de 10 años.",
      "Cuando te trabes o uses una palabra tecnica sin poder explicarla simple, marcá ese punto -- ahi esta lo que no entendiste del todo.",
      "Volve al material solo para esa parte puntual, y volve a intentar explicarla.",
      "Repetí hasta que la explicacion completa te salga fluida y simple.",
    ],
    bestFor: "Conceptos abstractos donde sentis que \"mas o menos entendes\" pero no podrias explicarlo bien.",
  },
  {
    id: "cornell",
    name: "Metodo Cornell de apuntes",
    category: "organizacion",
    summary: "Dividir la hoja en tres zonas para tomar apuntes de forma que despues se repasan solos.",
    howTo: [
      "Dividi la hoja en dos columnas: una angosta a la izquierda, una ancha a la derecha, y dejá espacio abajo.",
      "Durante la clase, escribi los apuntes normales en la columna ancha.",
      "Despues de la clase (no durante), en la columna angosta escribi palabras clave o preguntas que resuman cada parte.",
      "Abajo de todo, escribi un resumen de 2-3 lineas de toda la pagina.",
      "Para repasar, tapá la columna ancha y tratá de responder solo mirando las palabras clave.",
    ],
    bestFor: "Clases con mucho contenido hablado que despues hay que repasar solo.",
  },
  {
    id: "practica-intercalada",
    name: "Practica intercalada (Interleaving)",
    category: "memoria",
    summary: "Mezclar distintos tipos de ejercicios o temas en una misma sesion, en vez de hacer 50 iguales seguidos.",
    howTo: [
      "En vez de resolver 20 ejercicios del mismo tipo seguidos, mezclá 3-4 tipos distintos en la misma sesion.",
      "Por ejemplo: alterná ejercicios de MRU, MRUV y tiro vertical en vez de agotar cada tema por separado.",
      "Al principio se siente mas dificil y mas lento -- es normal, es parte de por que funciona mejor a largo plazo.",
    ],
    bestFor: "Materias con varios tipos de ejercicios parecidos (matematica, fisica, quimica) donde cuesta distinguir cual metodo usar en un examen.",
  },
  {
    id: "elaboracion",
    name: "Elaboracion",
    category: "comprension",
    summary: "Conectar lo nuevo que estas aprendiendo con algo que ya sabes, en vez de guardarlo aislado.",
    howTo: [
      "Cuando aprendas algo nuevo, preguntate: \"¿a que se parece esto que ya conozco?\"",
      "Buscá un ejemplo de tu propia vida o de otra materia que se relacione con el concepto.",
      "Escribi esa conexion con tus propias palabras, no la dejes solo en tu cabeza.",
    ],
    bestFor: "Temas nuevos que se sienten desconectados de todo lo demas.",
  },
  {
    id: "mapas-mentales",
    name: "Mapas mentales",
    category: "comprension",
    summary: "Organizar visualmente un tema mostrando como se relacionan sus partes, en vez de una lista lineal.",
    howTo: [
      "Escribi el tema central en el medio de la hoja.",
      "Desde ahi, tirá ramas hacia los subtemas principales.",
      "De cada subtema, sacá ramas mas chicas con detalles, ejemplos o formulas.",
      "Usá colores o dibujos simples para las relaciones importantes -- ayuda a recordarlo despues.",
    ],
    bestFor: "Temas con muchas partes relacionadas entre si (procesos biologicos, causas de un hecho historico).",
  },
  {
    id: "bloqueo-tiempo",
    name: "Bloqueo de tiempo (Time blocking)",
    category: "organizacion",
    summary: "Asignar horarios especificos a cada tarea en tu agenda, en vez de una lista general de \"cosas para hoy\".",
    howTo: [
      "Al empezar la semana (o el dia), mirá que examenes y tareas tenes pendientes.",
      "Asignale a cada uno un bloque de horario concreto en tu Agenda, no solo una fecha limite.",
      "Se realista con la duracion -- mejor un bloque de 45 minutos que cumplis, que uno de 3 horas que no arrancas.",
      "Si algo no se completa en su bloque, movelo a otro bloque en vez de dejarlo flotando sin horario.",
    ],
    bestFor: "Semanas con muchas cosas pendientes a la vez, cuando una simple lista no alcanza para organizarte.",
  },
  {
    id: "regla-dos-minutos",
    name: "Regla de los 2 minutos",
    category: "organizacion",
    summary: "Si una tarea te lleva menos de 2 minutos, hacela ya en vez de anotarla para despues.",
    howTo: [
      "Cuando se te ocurra o te pidan algo chico (mandar un mail, anotar una fecha, guardar un archivo), preguntate si te lleva menos de 2 minutos.",
      "Si es asi, hacelo en el momento en vez de agregarlo a la lista de tareas.",
      "Si te va a llevar mas, ahi si anotala como tarea con su fecha y tiempo estimado.",
    ],
    bestFor: "Evitar que se te acumulen un monton de tareas chiquitas que juntas generan mucho estres.",
  },
];
