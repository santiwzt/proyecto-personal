/**
 * A small, hand-written library of generic study-strategy advice, used ONLY
 * as a fallback when the heuristic chat assistant has no matching material
 * to ground an answer in (no files uploaded, or nothing relevant found).
 *
 * This is deliberately different from "making things up": every tip here is
 * generic pedagogical advice about HOW to study a kind of subject (make a
 * timeline, practice balancing equations, explain it out loud, ...) -- never
 * a factual claim about specific course content. It's safe to hardcode
 * because it isn't a fact that can be wrong, just a study strategy.
 */

export type SubjectCategory =
  | "matematica"
  | "fisica"
  | "quimica"
  | "biologia"
  | "historia"
  | "geografia"
  | "lengua"
  | "idiomas"
  | "economia"
  | "arte"
  | "educacion_fisica"
  | "programacion"
  | "filosofia"
  | "general";

const CATEGORY_KEYWORDS: Record<Exclude<SubjectCategory, "general">, string[]> = {
  matematica: [
    "matematic", "algebra", "geometri", "calculo", "trigonometri",
    "analisis matematico", "aritmetica", "estadistica", "probabilidad",
  ],
  fisica: [
    "fisica", "mecanica", "electromagnetismo", "termodinamica", "optica",
    "cinematica", "dinamica", "electricidad", "biofisica", "astronomia",
    "electrotecnia",
  ],
  quimica: [
    "quimic", "bioquimica", "laboratorio quimico",
  ],
  biologia: [
    "biologi", "anatomia", "botanica", "fisiologia", "genetica", "ecologia",
    "zoologia", "microbiologia", "evolucion", "ciencias naturales",
  ],
  historia: [
    "historia", "historiografia", "ciencias sociales",
  ],
  geografia: [
    "geografia", "geopolitica", "cartografia", "ciencias de la tierra",
  ],
  lengua: [
    "lengua", "literatura", "practicas del lenguaje", "gramatica",
    "ortografia", "redaccion", "taller de lectura y escritura",
  ],
  idiomas: [
    "ingles", "frances", "portugues", "italiano", "aleman", "idioma",
    "lenguas extranjeras", "english",
  ],
  economia: [
    "economia", "contabilidad", "administracion", "gestion organizacional",
    "marketing", "finanzas", "organizacion empresarial", "comercializacion",
    "sistemas de informacion contable", "costos",
  ],
  arte: [
    "arte", "musica", "plastica", "dibujo", "artes visuales",
    "educacion artistica", "teatro", "danza", "ceramica", "coro",
    "escenografia",
  ],
  educacion_fisica: [
    "educacion fisica", "gimnasia", "deporte", "atletismo", "natacion",
    "vida en la naturaleza", "recreacion",
  ],
  programacion: [
    "programacion", "informatica", "computacion", "sistemas", "robotica",
    "desarrollo de software", "base de datos", "algoritmos",
    "ciencia de datos",
  ],
  filosofia: [
    "filosofia", "psicologia", "sociologia", "formacion etica y ciudadana",
    "etica", "construccion de ciudadania", "antropologia", "logica",
    "gnoseologia", "teoria del conocimiento", "derechos humanos",
    "epistemologia",
  ],
};

const TIPS: Record<SubjectCategory, string[]> = {
  matematica: [
    'Resolve varios ejercicios de cada tipo antes de memorizar formulas: la mecanica ayuda a fijar el concepto mejor que solo leerlo.',
    "Cuando te trabes en un ejercicio, escribi paso a paso que datos tenes y que te piden -- la mitad del error suele estar ahi.",
    "Rehace los ejercicios que ya corregiste sin mirar la solucion, unos dias despues, para ver si de verdad quedaron aprendidos.",
  ],
  fisica: [
    "Identifica que tipo de problema es (cinematica, dinamica, energia, etc.) antes de elegir que formula usar.",
    "Dibuja siempre un esquema o diagrama antes de plantear las ecuaciones -- ayuda a no perder datos.",
    "Prestale atencion a las unidades: un resultado con las unidades mal suele indicar un error en el planteo, no solo en la cuenta.",
  ],
  quimica: [
    "Practica balancear ecuaciones quimicas hasta que te salga casi automatico, es la base de casi todo lo demas.",
    "Arma una tabla propia con las propiedades que mas se repiten (electronegatividad, valencias, etc.) para consultar rapido.",
    "Relaciona cada reaccion o proceso con un ejemplo de la vida real, ayuda mucho a recordarlo.",
  ],
  biologia: [
    "Arma esquemas o diagramas propios de los procesos (fotosintesis, mitosis, etc.) en vez de solo releerlos.",
    'Relaciona cada estructura con su funcion: se recuerda mejor el "para que sirve" que una lista suelta de nombres.',
    "Explica el proceso en voz alta como si se lo contaras a alguien que no sabe nada del tema.",
  ],
  historia: [
    "Arma una linea de tiempo propia con las fechas y eventos clave: ayuda a ver la relacion causa-efecto, no solo memorizar fechas sueltas.",
    "Para cada evento importante, pregunta: que lo causo, y que consecuencias tuvo despues.",
    "Relaciona los hechos historicos con mapas -- buena parte de la historia se entiende mejor viendo el lugar.",
  ],
  geografia: [
    "Usa mapas mudos para ubicar lo que estas estudiando, ayuda muchisimo a fijar la ubicacion real.",
    "Relaciona el clima, el relieve y la economia de una region entre si -- casi siempre estan conectados.",
    "Compara regiones entre si en vez de estudiarlas aisladas: las diferencias ayudan a recordar mejor cada una.",
  ],
  lengua: [
    "Para un texto literario, identifica primero: quien narra, cuando pasa la historia, y cual es el conflicto central.",
    "Arma una ficha corta por obra o autor con lo esencial, para repasar rapido antes del examen.",
    "Practica resumir cada capitulo o parte en 2-3 lineas propias, escritas por vos, no copiadas del libro.",
  ],
  idiomas: [
    "Practica el vocabulario nuevo usandolo en oraciones propias, no solo memorizando la traduccion.",
    "Escucha o lee algo corto en el idioma todos los dias, aunque no entiendas absolutamente todo.",
    "Anota las estructuras gramaticales que mas se te complican en una lista aparte, para repasarlas seguido.",
  ],
  economia: [
    "Relaciona cada concepto con un ejemplo numerico concreto -- no te quedes solo con la definicion de memoria.",
    "Practica los ejercicios de calculo varias veces cambiando los numeros, para automatizar el procedimiento.",
    "Armate un glosario propio de terminos clave, escrito con tus palabras.",
  ],
  arte: [
    "Relaciona cada obra o tecnica con su contexto historico -- ayuda a recordar por que es importante.",
    "Practica identificar ejemplos (obras, estilos) en vez de solo memorizar teoria suelta.",
    "Compara dos estilos o autores entre si para notar mejor las diferencias clave.",
  ],
  educacion_fisica: [
    "Anota tu progreso (tiempos, repeticiones) para ver la evolucion real, no solo la sensacion del dia.",
    "Repasa la teoria (reglas, tecnica) tanto como practicas la parte fisica.",
    "Descansa lo suficiente entre sesiones -- el cuerpo tambien aprende mientras se recupera.",
  ],
  programacion: [
    "Escribi y corre el codigo vos mismo en vez de solo leerlo -- el error real enseña mas que la teoria.",
    "Cuando algo no funciona, lee el mensaje de error completo antes de asumir que fue lo que paso.",
    "Explica tu codigo linea por linea en voz alta: si no podes explicarlo, probablemente no lo entendiste del todo.",
  ],
  filosofia: [
    "Para cada autor o corriente, resumi en una frase propia cual es la idea central que defiende.",
    "Compara dos posturas distintas sobre el mismo tema -- ayuda a entender por que existe el debate.",
    "Relaciona los conceptos abstractos con ejemplos de tu propia vida o de la actualidad.",
  ],
  general: [
    "Explica el tema en voz alta con tus propias palabras, sin mirar el apunte -- si te trabas, ahi esta lo que te falta repasar.",
    "Estudia en bloques cortos (25-30 minutos) con descansos, en vez de una sesion larga sin cortes.",
    "Practica activamente (ejercicios, preguntas, resumenes propios) en vez de solo releer el material una y otra vez.",
  ],
};

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function inferSubjectCategory(subjectName: string | null): SubjectCategory {
  if (!subjectName) return "general";
  const normalized = normalize(subjectName);
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [
    Exclude<SubjectCategory, "general">,
    string[],
  ][]) {
    if (keywords.some((keyword) => normalized.includes(keyword))) return category;
  }
  return "general";
}

/**
 * Builds a short block of generic study advice for when there's no material
 * to ground a real answer in. Always explicitly labeled as general advice,
 * never presented as if it came from the user's own course content.
 */
export function buildGeneralAdvice(subjectName: string | null): string {
  const category = inferSubjectCategory(subjectName);
  const tips = TIPS[category];
  const intro = subjectName
    ? `No tengo material tuyo de "${subjectName}" para basarme, pero te dejo algunos consejos generales para estudiar este tipo de materia:`
    : "No tengo material tuyo para basarme, pero te dejo algunos consejos generales de estudio:";
  return `${intro}\n\n${tips.map((tip) => `- ${tip}`).join("\n")}`;
}
