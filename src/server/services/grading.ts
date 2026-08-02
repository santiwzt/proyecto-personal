import { z } from "zod";
import { isAiConfigured } from "@/config/env";
import { getAiProvider } from "@/lib/ai/provider";
import type { PracticeQuestion } from "@/types/domain";

export interface GradingResult {
  isCorrect: boolean;
  feedback: string;
  firstErrorHint: string | null;
  gradedBy: "ia" | "heuristico";
}

const SPANISH_STOPWORDS = new Set([
  "el", "la", "los", "las", "un", "una", "unos", "unas", "de", "del", "en", "y",
  "o", "e", "u", "a", "al", "que", "es", "son", "para", "por", "con", "sin", "se",
  "su", "sus", "lo", "como", "mas", "cual", "cuales", "quien", "quienes", "cuando",
  "donde", "porque", "pero", "sino", "aunque", "mientras", "ni", "sobre", "entre",
  "hasta", "desde", "durante", "mediante", "contra", "ante",
  // Instructional filler words that show up in gradingCriteria phrasing
  // ("Debe mencionar...", "No debe decir...") but aren't part of the concept
  // being tested — excluding them keeps the overlap score about content.
  "debe", "deben", "mencionar", "decir", "debes", "indicar",
  // Extra function words -- same rationale as retrieval.ts's stopword list:
  // they show up in almost every answer regardless of content, so counting
  // them as "overlap" would inflate the score without the student actually
  // having covered the concept. Deliberately does NOT include negation
  // particles ("no", "si", "nunca", "jamas", "tampoco") -- those flip the
  // meaning of a sentence, so stripping them would let an answer that says
  // the opposite of what's expected still score as if it matched. "sin"
  // stays a stopword: it's a plain preposition ("without"), not a
  // clause-level negator like "no"/"nunca".
  "esta", "este", "esa", "ese", "eso", "esto", "estos", "estas", "esos", "esas",
  "aquel", "aquella", "aquellos", "aquellas", "muy", "tan", "tanto", "tanta",
  "tambien", "asi", "solo", "solamente", "aun", "todavia", "ya", "ademas",
  "incluso", "apenas", "casi", "bastante", "demasiado", "aqui", "ahi", "alli",
  "aca", "alla", "ahora", "entonces", "luego", "despues", "antes", "nada",
  "mucho", "muchos", "poco", "cuanto", "cuanta", "cuantos", "cuantas",
  "yo", "tu", "vos", "el", "ella", "nosotros", "nosotras", "vosotros",
  "vosotras", "ustedes", "ellos", "ellas", "me", "te", "le", "nos", "os",
  "les", "mi", "mis", "tus", "mio", "mia", "mios", "mias", "tuyo", "tuya",
  "tuyos", "tuyas", "ti", "todo", "toda", "todos", "todas", "otro", "otra",
  "otros", "otras", "mismo", "misma", "mismos", "mismas", "algo", "algun",
  "alguna", "algunos", "algunas", "uno", "unos",
  "ser", "soy", "eres", "somos", "sois", "sea", "seas", "seamos", "seais",
  "sean", "sere", "seras", "sera", "seremos", "sereis", "seran", "seria",
  "serias", "seriamos", "seriais", "serian", "era", "eras", "eramos", "erais",
  "eran", "fui", "fuiste", "fue", "fuimos", "fuisteis", "fueron", "fuera",
  "fueras", "fueramos", "fuerais", "fueran", "fuese", "fueses", "fuesemos",
  "fueseis", "fuesen", "siendo", "sido",
  "estar", "estoy", "estas", "estamos", "estais", "estan", "estes", "estemos",
  "esteis", "esten", "estare", "estaras", "estara", "estaremos", "estareis",
  "estaran", "estaria", "estarias", "estariamos", "estariais", "estarian",
  "estaba", "estabas", "estabamos", "estabais", "estaban", "estuve",
  "estuviste", "estuvo", "estuvimos", "estuvisteis", "estuvieron", "estuviera",
  "estuvieras", "estuvieramos", "estuvierais", "estuvieran", "estuviese",
  "estuvieses", "estuviesemos", "estuvieseis", "estuviesen", "estando",
  // NOT "estado"/"estados": besides being estar's participle, they're
  // common content nouns in this app's subjects ("estado solido", "el
  // Estado" in civics/history) -- stripping them would hurt precision more
  // than the participle sense would help.
  "haber", "he", "has", "ha", "hemos", "han", "haya", "hayas", "hayamos",
  "hayais", "hayan", "habre", "habras", "habra", "habremos", "habreis",
  "habran", "habria", "habrias", "habriamos", "habriais", "habrian", "habia",
  "habias", "habiamos", "habiais", "habian", "hube", "hubiste", "hubo",
  "hubimos", "hubisteis", "hubieron", "hubiera", "hubieras", "hubieramos",
  "hubierais", "hubieran", "hubiese", "hubieses", "hubiesemos", "hubieseis",
  "hubiesen", "habiendo", "habido", "habida", "habidos", "habidas", "hay",
  "tener", "tengo", "tienes", "tiene", "tenemos", "teneis", "tienen", "tenga",
  "tengas", "tengamos", "tengais", "tengan", "tendre", "tendras", "tendra",
  "tendremos", "tendreis", "tendran", "tendria", "tendrias", "tendriamos",
  "tendriais", "tendrian", "tenia", "tenias", "teniamos", "teniais", "tenian",
  "tuve", "tuviste", "tuvo", "tuvimos", "tuvisteis", "tuvieron", "tuviera",
  "tuvieras", "tuvieramos", "tuvierais", "tuvieran", "tuviese", "tuvieses",
  "tuviesemos", "tuvieseis", "tuviesen", "teniendo", "tenido", "tenida",
  "tenidos", "tenidas",
]);

/**
 * A small, deliberately conservative synonym table for common Spanish
 * academic phrasing. This does NOT try to be a general thesaurus — it only
 * collapses a handful of everyday synonym pairs to their canonical form
 * ("incrementa"/"sube"/"aumenta" all become "aumenta") so the concept-overlap
 * check keeps scoring concepts, not exact word choice, per
 * docs/decisions/0005-heuristic-grading-limitations.md.
 */
const SYNONYM_CANONICAL: Record<string, string> = {
  // aumentar
  incrementa: "aumenta",
  incrementan: "aumenta",
  incrementar: "aumenta",
  incremento: "aumenta",
  aumentan: "aumenta",
  aumentar: "aumenta",
  aumento: "aumenta",
  sube: "aumenta",
  suben: "aumenta",
  subir: "aumenta",
  subida: "aumenta",
  crece: "aumenta",
  crecen: "aumenta",
  crecer: "aumenta",
  crecimiento: "aumenta",
  eleva: "aumenta",
  elevan: "aumenta",
  elevar: "aumenta",
  elevacion: "aumenta",
  asciende: "aumenta",
  ascienden: "aumenta",
  ascender: "aumenta",
  multiplica: "aumenta",
  multiplican: "aumenta",
  multiplicar: "aumenta",
  intensifica: "aumenta",
  intensifican: "aumenta",
  intensificar: "aumenta",
  amplia: "aumenta",
  amplian: "aumenta",
  ampliar: "aumenta",
  ampliacion: "aumenta",
  // disminuir
  decrece: "disminuye",
  decrecen: "disminuye",
  decrecer: "disminuye",
  disminuyen: "disminuye",
  disminuir: "disminuye",
  disminucion: "disminuye",
  reduce: "disminuye",
  reducen: "disminuye",
  reducir: "disminuye",
  reduccion: "disminuye",
  baja: "disminuye",
  bajan: "disminuye",
  bajar: "disminuye",
  bajada: "disminuye",
  cae: "disminuye",
  caen: "disminuye",
  caer: "disminuye",
  caida: "disminuye",
  mengua: "disminuye",
  menguan: "disminuye",
  menguar: "disminuye",
  aminora: "disminuye",
  aminoran: "disminuye",
  aminorar: "disminuye",
  atenua: "disminuye",
  atenuan: "disminuye",
  atenuar: "disminuye",
  contrae: "disminuye",
  contraen: "disminuye",
  contraer: "disminuye",
  contraccion: "disminuye",
  merma: "disminuye",
  merman: "disminuye",
  mermar: "disminuye",
  // describir/explicar
  explica: "describe",
  explican: "describe",
  explicar: "describe",
  explicacion: "describe",
  describen: "describe",
  describir: "describe",
  descripcion: "describe",
  detalla: "describe",
  detallan: "describe",
  detallar: "describe",
  expone: "describe",
  exponen: "describe",
  exponer: "describe",
  narra: "describe",
  narran: "describe",
  narrar: "describe",
  relata: "describe",
  relatan: "describe",
  relatar: "describe",
  plantea: "describe",
  plantean: "describe",
  plantear: "describe",
  ilustra: "describe",
  ilustran: "describe",
  presenta: "describe",
  presentan: "describe",
  presentar: "describe",
  aclara: "describe",
  aclaran: "describe",
  aclarar: "describe",
  // causar
  origina: "causa",
  originan: "causa",
  originar: "causa",
  causan: "causa",
  causante: "causa",
  provoca: "causa",
  provocan: "causa",
  provocar: "causa",
  genera: "causa",
  generan: "causa",
  generar: "causa",
  generacion: "causa",
  produce: "causa",
  producen: "causa",
  producir: "causa",
  produccion: "causa",
  ocasiona: "causa",
  ocasionan: "causa",
  ocasionar: "causa",
  motiva: "causa",
  motivan: "causa",
  motivar: "causa",
  desencadena: "causa",
  desencadenan: "causa",
  desencadenar: "causa",
  propicia: "causa",
  propician: "causa",
  propiciar: "causa",
  // iniciar
  comienza: "inicia",
  comienzan: "inicia",
  empieza: "inicia",
  empiezan: "inicia",
  empezar: "inicia",
  comenzar: "inicia",
  arranca: "inicia",
  arrancan: "inicia",
  arrancar: "inicia",
  inician: "inicia",
  iniciar: "inicia",
  surge: "inicia",
  surgen: "inicia",
  surgir: "inicia",
  nace: "inicia",
  nacen: "inicia",
  nacer: "inicia",
  emprende: "inicia",
  emprenden: "inicia",
  emprender: "inicia",
  // terminar
  finaliza: "termina",
  finalizan: "termina",
  finalizar: "termina",
  finalizacion: "termina",
  concluye: "termina",
  concluyen: "termina",
  concluir: "termina",
  conclusion: "termina",
  acaba: "termina",
  acaban: "termina",
  acabar: "termina",
  culmina: "termina",
  culminan: "termina",
  culminar: "termina",
  cierra: "termina",
  cierran: "termina",
  cerrar: "termina",
  cesa: "termina",
  cesan: "termina",
  cesar: "termina",
  terminan: "termina",
  terminar: "termina",
  // importante
  relevante: "importante",
  fundamental: "importante",
  esencial: "importante",
  clave: "importante",
  crucial: "importante",
  significativo: "importante",
  significativa: "importante",
  primordial: "importante",
  indispensable: "importante",
  imprescindible: "importante",
  vital: "importante",
  trascendente: "importante",
  decisivo: "importante",
  decisiva: "importante",
  destacado: "importante",
  destacada: "importante",
  principal: "importante",
  // permitir/posibilitar
  permite: "posibilita",
  permiten: "posibilita",
  permitir: "posibilita",
  posibilitan: "posibilita",
  posibilitar: "posibilita",
  habilita: "posibilita",
  habilitan: "posibilita",
  habilitar: "posibilita",
  facilita: "posibilita",
  facilitan: "posibilita",
  facilitar: "posibilita",
  autoriza: "posibilita",
  autorizan: "posibilita",
  autorizar: "posibilita",
  // impedir/evitar
  evita: "impide",
  evitan: "impide",
  evitar: "impide",
  impedimento: "impide",
  impiden: "impide",
  impedir: "impide",
  obstaculiza: "impide",
  obstaculizan: "impide",
  obstaculizar: "impide",
  dificulta: "impide",
  dificultan: "impide",
  dificultar: "impide",
  bloquea: "impide",
  bloquean: "impide",
  bloquear: "impide",
  frena: "impide",
  frenan: "impide",
  frenar: "impide",
  previene: "impide",
  previenen: "impide",
  prevenir: "impide",
  prevencion: "impide",
  imposibilita: "impide",
  imposibilitan: "impide",
  imposibilitar: "impide",
  // relacionar/vincular
  vincula: "relaciona",
  vinculan: "relaciona",
  vincular: "relaciona",
  vinculo: "relaciona",
  relacionan: "relaciona",
  relacionar: "relaciona",
  relacion: "relaciona",
  conecta: "relaciona",
  conectan: "relaciona",
  conectar: "relaciona",
  conexion: "relaciona",
  asocia: "relaciona",
  asocian: "relaciona",
  asociar: "relaciona",
  asociacion: "relaciona",
  liga: "relaciona",
  ligan: "relaciona",
  ligar: "relaciona",
  enlaza: "relaciona",
  enlazan: "relaciona",
  enlazar: "relaciona",
  // diferenciar/distinguir
  distingue: "diferencia",
  distinguen: "diferencia",
  distinguir: "diferencia",
  distincion: "diferencia",
  distinto: "diferencia",
  distinta: "diferencia",
  diferencian: "diferencia",
  diferenciar: "diferencia",
  separa: "diferencia",
  separan: "diferencia",
  separar: "diferencia",
  separacion: "diferencia",
  // mejorar / empeorar
  mejora: "mejora",
  mejoran: "mejora",
  mejorar: "mejora",
  mejoria: "mejora",
  mejoramiento: "mejora",
  perfecciona: "mejora",
  perfeccionan: "mejora",
  perfeccionar: "mejora",
  optimiza: "mejora",
  optimizan: "mejora",
  optimizar: "mejora",
  optimizacion: "mejora",
  progresa: "mejora",
  progresan: "mejora",
  progresar: "mejora",
  progreso: "mejora",
  avanza: "mejora",
  avanzan: "mejora",
  avanzar: "mejora",
  avance: "mejora",
  empeoran: "empeora",
  empeorar: "empeora",
  empeoramiento: "empeora",
  deteriora: "empeora",
  deterioran: "empeora",
  deteriorar: "empeora",
  deterioro: "empeora",
  agrava: "empeora",
  agravan: "empeora",
  agravar: "empeora",
  agravamiento: "empeora",
  retrocede: "empeora",
  retroceden: "empeora",
  retroceder: "empeora",
  retroceso: "empeora",
  // comparar
  compara: "compara",
  comparan: "compara",
  comparar: "compara",
  comparacion: "compara",
  contrasta: "compara",
  contrastan: "compara",
  contrastar: "compara",
  contraste: "compara",
  equipara: "compara",
  equiparan: "compara",
  equiparar: "compara",
  coteja: "compara",
  cotejan: "compara",
  cotejar: "compara",
  // demostrar/probar
  demuestra: "demuestra",
  demuestran: "demuestra",
  demostrar: "demuestra",
  demostracion: "demuestra",
  prueba: "demuestra",
  prueban: "demuestra",
  probar: "demuestra",
  comprueba: "demuestra",
  comprueban: "demuestra",
  comprobar: "demuestra",
  comprobacion: "demuestra",
  evidencia: "demuestra",
  evidencian: "demuestra",
  evidenciar: "demuestra",
  verifica: "demuestra",
  verifican: "demuestra",
  verificar: "demuestra",
  verificacion: "demuestra",
  confirma: "demuestra",
  confirman: "demuestra",
  confirmar: "demuestra",
  confirmacion: "demuestra",
  corrobora: "demuestra",
  corroboran: "demuestra",
  corroborar: "demuestra",
  // incluir/contener
  incluye: "incluye",
  incluyen: "incluye",
  incluir: "incluye",
  inclusion: "incluye",
  contiene: "incluye",
  contienen: "incluye",
  contener: "incluye",
  contenido: "incluye",
  abarca: "incluye",
  abarcan: "incluye",
  abarcar: "incluye",
  comprende: "incluye",
  comprenden: "incluye",
  engloba: "incluye",
  engloban: "incluye",
  englobar: "incluye",
  integra: "incluye",
  integran: "incluye",
  integrar: "incluye",
  // requerir/necesitar
  requiere: "requiere",
  requieren: "requiere",
  requerir: "requiere",
  requerimiento: "requiere",
  necesita: "requiere",
  necesitan: "requiere",
  necesitar: "requiere",
  necesidad: "requiere",
  precisa: "requiere",
  precisan: "requiere",
  precisar: "requiere",
  exige: "requiere",
  exigen: "requiere",
  exigir: "requiere",
  exigencia: "requiere",
  demanda: "requiere",
  demandan: "requiere",
  demandar: "requiere",
  // mantener/conservar
  mantiene: "mantiene",
  mantienen: "mantiene",
  mantener: "mantiene",
  mantenimiento: "mantiene",
  conserva: "mantiene",
  conservan: "mantiene",
  conservar: "mantiene",
  conservacion: "mantiene",
  preserva: "mantiene",
  preservan: "mantiene",
  preservar: "mantiene",
  preservacion: "mantiene",
  sostiene: "mantiene",
  sostienen: "mantiene",
  sostener: "mantiene",
  perdura: "mantiene",
  perduran: "mantiene",
  perdurar: "mantiene",
  permanece: "mantiene",
  permanecen: "mantiene",
  permanecer: "mantiene",
  // transformar/convertir
  transforma: "transforma",
  transforman: "transforma",
  transformar: "transforma",
  transformacion: "transforma",
  convierte: "transforma",
  convierten: "transforma",
  convertir: "transforma",
  conversion: "transforma",
  cambia: "transforma",
  cambian: "transforma",
  cambiar: "transforma",
  cambio: "transforma",
  modifica: "transforma",
  modifican: "transforma",
  modificar: "transforma",
  modificacion: "transforma",
  muta: "transforma",
  mutan: "transforma",
  mutar: "transforma",
  // eliminar/quitar
  elimina: "elimina",
  eliminan: "elimina",
  eliminar: "elimina",
  eliminacion: "elimina",
  quita: "elimina",
  quitan: "elimina",
  quitar: "elimina",
  suprime: "elimina",
  suprimen: "elimina",
  suprimir: "elimina",
  supresion: "elimina",
  remueve: "elimina",
  remueven: "elimina",
  remover: "elimina",
  descarta: "elimina",
  descartan: "elimina",
  descartar: "elimina",
  excluye: "elimina",
  excluyen: "elimina",
  excluir: "elimina",
  exclusion: "elimina",
  erradica: "elimina",
  erradican: "elimina",
  erradicar: "elimina",
  // agregar/sumar
  agrega: "agrega",
  agregan: "agrega",
  agregar: "agrega",
  agregado: "agrega",
  suma: "agrega",
  suman: "agrega",
  sumar: "agrega",
  anade: "agrega",
  anaden: "agrega",
  anadir: "agrega",
  incorpora: "agrega",
  incorporan: "agrega",
  incorporar: "agrega",
  incorporacion: "agrega",
  adiciona: "agrega",
  adicionan: "agrega",
  adicionar: "agrega",
  adicion: "agrega",
  // resultado/consecuencia
  resultado: "resultado",
  resultados: "resultado",
  consecuencia: "resultado",
  consecuencias: "resultado",
  efecto: "resultado",
  efectos: "resultado",
  fruto: "resultado",
  saldo: "resultado",
  desenlace: "resultado",
  secuela: "resultado",
  secuelas: "resultado",
  derivacion: "resultado",
  // ejemplo/caso
  ejemplo: "ejemplo",
  ejemplos: "ejemplo",
  caso: "ejemplo",
  casos: "ejemplo",
  muestra: "ejemplo",
  ilustracion: "ejemplo",
  modelo: "ejemplo",
  instancia: "ejemplo",
  // ventaja/beneficio
  ventaja: "ventaja",
  ventajas: "ventaja",
  beneficio: "ventaja",
  beneficios: "ventaja",
  provecho: "ventaja",
  utilidad: "ventaja",
  utilidades: "ventaja",
  bondad: "ventaja",
  bondades: "ventaja",
  fortaleza: "ventaja",
  fortalezas: "ventaja",
  // desventaja/problema
  desventaja: "desventaja",
  desventajas: "desventaja",
  problema: "desventaja",
  problemas: "desventaja",
  inconveniente: "desventaja",
  inconvenientes: "desventaja",
  dificultad: "desventaja",
  dificultades: "desventaja",
  obstaculo: "desventaja",
  obstaculos: "desventaja",
  limitacion: "desventaja",
  limitaciones: "desventaja",
  debilidad: "desventaja",
  debilidades: "desventaja",
  defecto: "desventaja",
  defectos: "desventaja",
};

function canonicalTerm(term: string): string {
  return SYNONYM_CANONICAL[term] ?? term;
}

function significantTerms(text: string): Set<string> {
  return new Set(
    text
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length >= 3 && !SPANISH_STOPWORDS.has(t))
      .map(canonicalTerm),
  );
}

function overlapRatio(answer: Set<string>, expected: Set<string>): number {
  if (expected.size === 0) return 0;
  let matches = 0;
  for (const term of expected) if (answer.has(term)) matches += 1;
  return matches / expected.size;
}

/** Picks the gradingCriteria entry the answer covers worst, rather than the
 * first one under a fixed threshold — a more precise "here's the gap"
 * signal when several criteria are only partially covered. */
function weakestCriterion(answerTerms: Set<string>, criteria: string[]): { criterion: string; ratio: number } | null {
  if (criteria.length === 0) return null;
  let weakest: { criterion: string; ratio: number } | null = null;
  for (const criterion of criteria) {
    const ratio = overlapRatio(answerTerms, significantTerms(criterion));
    if (!weakest || ratio < weakest.ratio) weakest = { criterion, ratio };
  }
  return weakest;
}

/**
 * Deterministic grading: keyword/criteria overlap against the question's
 * declared gradingCriteria. Simpler than true procedural evaluation (see
 * docs/decisions/0005-heuristic-grading-limitations.md) but never punishes
 * pure wording differences by design — it looks at concepts, not phrasing.
 */
export function gradeAnswerHeuristic(question: PracticeQuestion, answerText: string): GradingResult {
  if (question.kind === "verdadero_falso") {
    const normalized = answerText.trim().toLowerCase();
    const saidTrue = /^(verdadero|si|sí|true|v)$/i.test(normalized);
    const saidFalse = /^(falso|no|false|f)$/i.test(normalized);
    const expectedTrue = question.expectedAnswer.toLowerCase() === "verdadero";
    if (!saidTrue && !saidFalse) {
      return {
        isCorrect: false,
        feedback: 'Respondé "Verdadero" o "Falso".',
        firstErrorHint: null,
        gradedBy: "heuristico",
      };
    }
    const isCorrect = saidTrue === expectedTrue;
    return {
      isCorrect,
      feedback: isCorrect
        ? "¡Correcto!"
        : `No es correcto. ${question.explanation}`,
      firstErrorHint: isCorrect ? null : question.gradingCriteria[0] ?? null,
      gradedBy: "heuristico",
    };
  }

  const trimmedAnswer = answerText.trim();
  if (trimmedAnswer.length === 0) {
    return {
      isCorrect: false,
      feedback: "No escribiste una respuesta todavia.",
      firstErrorHint: question.gradingCriteria[0] ?? null,
      gradedBy: "heuristico",
    };
  }

  const answerTerms = significantTerms(answerText);
  const criteriaTerms = significantTerms(
    [question.expectedAnswer, ...question.gradingCriteria].join(" "),
  );
  const ratio = overlapRatio(answerTerms, criteriaTerms);
  const isCorrect = ratio >= 0.4;
  const gap = weakestCriterion(answerTerms, question.gradingCriteria);
  const missingCriterion = gap?.criterion ?? question.gradingCriteria[0] ?? null;

  let feedback: string;
  if (isCorrect && ratio >= 0.8) {
    feedback = "Tu respuesta cubre los puntos clave esperados.";
  } else if (isCorrect) {
    // Passed the threshold but there's still a partially-covered criterion
    // worth calling out — partial credit in tone, not just pass/fail.
    feedback =
      gap && gap.ratio < 0.6
        ? `Tu respuesta esta encaminada y cubre lo principal, pero podrias profundizar: ${gap.criterion}.`
        : "Tu respuesta cubre los puntos clave esperados.";
  } else if (ratio > 0) {
    feedback = `Vas por buen camino, pero te falta cubrir: ${missingCriterion ?? "un aspecto importante"}.`;
  } else {
    feedback = `No encuentro relacion con los puntos clave esperados. Repasa: ${missingCriterion ?? "el material de la pregunta"}.`;
  }

  return {
    isCorrect,
    feedback,
    firstErrorHint: isCorrect ? null : missingCriterion,
    gradedBy: "heuristico",
  };
}

const aiGradingSchema = z.object({
  isCorrect: z.boolean(),
  feedback: z.string().min(1),
  firstErrorHint: z.string().nullable(),
});

export async function gradeAnswer(question: PracticeQuestion, answerText: string): Promise<GradingResult> {
  if (!isAiConfigured) {
    return gradeAnswerHeuristic(question, answerText);
  }

  try {
    const provider = await getAiProvider();
    const { data } = await provider.generateStructured({
      system:
        "Sos un corrector pedagogico para un estudiante secundario argentino. Evaluas la respuesta contra " +
        "criterios explicitos, marcas el primer error importante, das una pista (no la solucion completa) y " +
        "nunca penalizas diferencias de redaccion cuando el concepto es correcto. Para fisica/matematica, " +
        "evaluas el procedimiento, no solo el resultado final: un resultado correcto por casualidad con un " +
        "procedimiento inconsistente NO es correcto. Respondes solo con JSON valido.",
      prompt:
        `Pregunta: ${question.prompt}\n` +
        `Respuesta esperada: ${question.expectedAnswer}\n` +
        `Criterios de correccion: ${question.gradingCriteria.join(" | ")}\n` +
        `Errores habituales: ${question.commonMistakes.join(" | ")}\n` +
        `Respuesta del estudiante: ${answerText}\n\n` +
        `Responde con JSON: { "isCorrect": boolean, "feedback": string, "firstErrorHint": string|null }.`,
      maxTokens: 512,
      parse: (raw) => aiGradingSchema.parse(JSON.parse(raw)),
    });
    return { ...data, gradedBy: "ia" };
  } catch (error) {
    console.error("AI grading failed, falling back to heuristic:", error);
    return gradeAnswerHeuristic(question, answerText);
  }
}
