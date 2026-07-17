import { generateQuestionsHeuristic } from "@/server/services/question-generation";
import {
  buildExcerpt,
  retrieveRelevantChunks,
  significantTerms,
  splitIntoSentences,
} from "@/server/services/retrieval";
import type { FileChunk, MessageSource } from "@/types/domain";

export type ChatMode =
  | "explicame"
  | "resumime"
  | "preguntame"
  | "corregime"
  | "repaso_rapido"
  | "preparame";

const MODE_INSTRUCTIONS: Record<ChatMode, string> = {
  explicame: "Explica el concepto de forma clara y sencilla, como a un estudiante secundario.",
  resumime: "Da un resumen breve y organizado de los puntos mas importantes.",
  preguntame: "Hace una pregunta de repaso al estudiante sobre el material, en vez de solo explicar.",
  corregime: "El estudiante va a compartir un intento de respuesta o ejercicio: señala el primer error importante y da una pista antes de la solucion completa.",
  repaso_rapido: "Da un repaso muy breve, en formato de puntos clave, para revisar justo antes de estudiar o rendir.",
  preparame: "Ayuda a armar un plan de repaso enfocado en los puntos mas debiles para el examen.",
};

export function buildChatSystemPrompt(mode: ChatMode): string {
  return (
    "Sos el asistente de estudio de Nexo, para un estudiante secundario argentino. " +
    "Respondes en español rioplatense, de forma clara y cercana, sin sonar excesivamente formal. " +
    "SOLO podes usar la informacion de los fragmentos de material provistos como contexto: nunca inventes " +
    "datos, citas o paginas que no esten en ese material. Si el material no alcanza para responder, decilo " +
    "explicitamente en vez de adivinar. Cuando cites algo, mencion el nombre del archivo de origen. " +
    `Modo actual: ${MODE_INSTRUCTIONS[mode]}`
  );
}

export function buildChatUserPrompt(
  chunks: { chunk: FileChunk; fileName: string }[],
  message: string,
): string {
  const context = chunks
    .map((c, i) => `[Fuente ${i + 1}: ${c.fileName}]\n${c.chunk.content}`)
    .join("\n\n---\n\n");
  return (
    (context.length > 0 ? `Material disponible:\n\n${context}\n\n---\n\n` : "No hay material disponible.\n\n") +
    `Pregunta del estudiante: ${message}`
  );
}

export interface RetrievedContext {
  chunk: FileChunk;
  fileName: string;
  score: number;
}

export function retrieveChatContext(
  chunks: FileChunk[],
  fileNameById: Map<string, string>,
  query: string,
  topK = 4,
): RetrievedContext[] {
  return retrieveRelevantChunks(chunks, query, topK).map((r) => ({
    chunk: r.chunk,
    fileName: fileNameById.get(r.chunk.fileId) ?? "Archivo",
    score: r.score,
  }));
}

export function toMessageSources(context: RetrievedContext[], query: string): MessageSource[] {
  return context.map((c) => ({
    fileId: c.chunk.fileId,
    fileName: c.fileName,
    chunkId: c.chunk.id,
    excerpt: buildExcerpt(c.chunk.content, query),
    page: c.chunk.page,
  }));
}

function trimForBullet(sentence: string, maxLength = 160): string {
  if (sentence.length <= maxLength) return sentence;
  return `${sentence.slice(0, maxLength).replace(/\s+\S*$/, "").trim()}…`;
}

/**
 * Picks the `maxPoints` sentences of `content` most related to `query`
 * (falling back to the first sentences, which are usually the most general
 * ones, when nothing overlaps), preserving their original reading order so
 * the result still flows like a normal excerpt rather than a jumble.
 */
function extractKeyPoints(content: string, query: string, maxPoints: number): string[] {
  const sentences = splitIntoSentences(content).filter((s) => s.length >= 15);
  if (sentences.length === 0) return [];

  const queryTerms = significantTerms(query);
  const scored = sentences.map((sentence, index) => {
    if (queryTerms.length === 0) return { sentence, index, score: 0 };
    const sentenceTerms = new Set(significantTerms(sentence));
    let score = 0;
    for (const term of queryTerms) if (sentenceTerms.has(term)) score += 1;
    return { sentence, index, score };
  });

  const hasSignal = scored.some((s) => s.score > 0);
  const ranked = hasSignal ? [...scored].sort((a, b) => b.score - a.score || a.index - b.index) : scored;

  return ranked
    .slice(0, maxPoints)
    .sort((a, b) => a.index - b.index)
    .map((p) => trimForBullet(p.sentence));
}

function buildExplicameBody(context: RetrievedContext[], query: string): string {
  const top = context[0]!;
  const topPoints = extractKeyPoints(top.chunk.content, query, 2);
  const topQuote = topPoints.length > 0 ? topPoints.join(" ") : buildExcerpt(top.chunk.content, query, 380);
  const lines = [`Segun "${top.fileName}": ${topQuote}`];

  if (context.length > 1) {
    const second = context[1]!;
    const secondPoints = extractKeyPoints(second.chunk.content, query, 1);
    const secondQuote = secondPoints.length > 0 ? secondPoints.join(" ") : buildExcerpt(second.chunk.content, query, 220);
    lines.push(`Tambien encontre esto en "${second.fileName}": ${secondQuote}`);
  }

  return `Segun tu material, encontre esto:\n\n${lines.join("\n\n")}`;
}

function buildResumimeBody(context: RetrievedContext[], query: string): string {
  const sections = context.slice(0, 3).map((c) => {
    const points = extractKeyPoints(c.chunk.content, query, 2);
    const bulletLines = points.length > 0 ? points : [buildExcerpt(c.chunk.content, query, 200)];
    return `**${c.fileName}**\n${bulletLines.map((p) => `- ${p}`).join("\n")}`;
  });
  return `Esto es lo mas relevante que encontre en tu material:\n\n${sections.join("\n\n")}`;
}

function buildRepasoRapidoBody(context: RetrievedContext[], query: string): string {
  const bullets: string[] = [];
  for (const c of context.slice(0, 3)) {
    if (bullets.length >= 5) break;
    const points = extractKeyPoints(c.chunk.content, query, 2);
    for (const point of points) {
      if (bullets.length >= 5) break;
      bullets.push(`- ${trimForBullet(point, 140)} (${c.fileName})`);
    }
  }
  if (bullets.length === 0) {
    bullets.push(`- ${buildExcerpt(context[0]!.chunk.content, query, 140)} (${context[0]!.fileName})`);
  }
  return `Repaso rapido segun tu material:\n\n${bullets.join("\n")}`;
}

function buildPreparameBody(context: RetrievedContext[], query: string): string {
  const seenFiles = new Set<string>();
  const steps: string[] = [];
  for (const c of context) {
    if (seenFiles.has(c.fileName) || steps.length >= 4) continue;
    seenFiles.add(c.fileName);
    const focusPoints = extractKeyPoints(c.chunk.content, query, 1);
    const focus = focusPoints[0] ?? buildExcerpt(c.chunk.content, query, 200);
    steps.push(`${steps.length + 1}. Repasa "${c.fileName}" — prestale atencion a: "${focus}"`);
  }
  return (
    `Plan de repaso sugerido, ordenado segun que tan relacionado esta cada fuente con tu consulta:\n\n${steps.join("\n")}\n\n` +
    "Anota lo que no te quede claro en cada punto para volver a preguntarlo despues."
  );
}

function buildPreguntameBody(context: RetrievedContext[]): string {
  const [generated] = generateQuestionsHeuristic({
    chunks: context.map((c) => c.chunk),
    topicName: null,
    difficulty: "media",
    count: 1,
    kind: "mixto",
  });

  if (!generated) {
    const top = context[0]!;
    return (
      `No pude armar una pregunta concreta a partir del material, pero pensa esto mientras releés "${top.fileName}": ` +
      "¿Como explicarias con tus propias palabras lo que dice ese material sobre tu consulta?"
    );
  }

  const sourceFileName = context.find((c) => c.chunk.fileId === generated.sourceFileId)?.fileName ?? context[0]!.fileName;
  return (
    `Te tiro una pregunta para que repases activamente (basada en "${sourceFileName}"):\n\n${generated.prompt}\n\n` +
    "Cuando tengas tu respuesta, escribila aca y la revisamos juntos."
  );
}

/**
 * Analyzes the student's message (their attempted answer/exercise) against
 * the best-matching material by term overlap — never generates or implies a
 * "correct answer" the material doesn't literally contain, it only points
 * out which real sentence from the source seems uncovered.
 */
function buildCorregimeBody(context: RetrievedContext[], studentText: string): string {
  const top = context[0]!;
  const sentences = splitIntoSentences(top.chunk.content).filter((s) => s.length >= 15);
  if (sentences.length === 0) {
    return `Compare tu mensaje con "${top.fileName}" pero no encontre oraciones claras para contrastar ahi. Pega tu intento completo y probamos de nuevo.`;
  }

  const studentTerms = new Set(significantTerms(studentText));
  let coveredTotal = 0;
  let termTotal = 0;
  let weakest: { sentence: string; missingRatio: number } | null = null;

  for (const sentence of sentences) {
    const terms = significantTerms(sentence);
    if (terms.length === 0) continue;
    const covered = terms.filter((t) => studentTerms.has(t)).length;
    coveredTotal += covered;
    termTotal += terms.length;
    const missingRatio = (terms.length - covered) / terms.length;
    if (!weakest || missingRatio > weakest.missingRatio) {
      weakest = { sentence, missingRatio };
    }
  }

  const coverage = termTotal > 0 ? coveredTotal / termTotal : 0;

  if (coverage >= 0.55) {
    return (
      `Tu respuesta menciona la mayoria de los puntos clave que aparecen en "${top.fileName}". ` +
      "Repasa igual que el razonamiento (no solo el resultado final) sea consistente con ese material."
    );
  }

  const hint = weakest?.sentence ?? sentences[0]!;
  return (
    `Comparando tu respuesta con "${top.fileName}", no encuentro que menciones algo relacionado con: "${hint}". ` +
    "Repasa ese punto puntual y volve a intentarlo. " +
    "(Esto es una comparacion heuristica por palabras clave, no una correccion paso a paso completa.)"
  );
}

/**
 * No-AI-key fallback. Every mode still only uses text copied or directly
 * derived from the user's own material — nothing is invented — but each
 * mode now shapes that material differently instead of all six modes
 * dumping the same two raw excerpts.
 */
export function buildHeuristicChatAnswer(
  context: RetrievedContext[],
  query: string,
  mode: ChatMode,
): { content: string; sources: MessageSource[] } {
  if (context.length === 0) {
    return {
      content:
        "No encontre informacion suficiente en el material seleccionado para responder eso. " +
        "Proba subir un archivo sobre el tema o elegir otro material en el selector.",
      sources: [],
    };
  }

  let body: string;
  switch (mode) {
    case "resumime":
      body = buildResumimeBody(context, query);
      break;
    case "repaso_rapido":
      body = buildRepasoRapidoBody(context, query);
      break;
    case "preguntame":
      body = buildPreguntameBody(context);
      break;
    case "corregime":
      body = buildCorregimeBody(context, query);
      break;
    case "preparame":
      body = buildPreparameBody(context, query);
      break;
    case "explicame":
    default:
      body = buildExplicameBody(context, query);
      break;
  }

  const disclaimer =
    "\n\n(Este modo no tiene un proveedor de IA configurado: esta respuesta se genero con reglas " +
    "deterministicas sobre tu material, sin inventar nada que no este en el.)";

  return {
    content: `${body}${disclaimer}`,
    sources: toMessageSources(context, query),
  };
}
