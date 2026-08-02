import type { FileChunk } from "@/types/domain";

/**
 * Full-text retrieval fallback used whenever no embedding provider is
 * configured (`EMBEDDING_PROVIDER` empty — see `.env.example`). When an
 * embedding provider IS configured, a cosine-similarity ranking over
 * `FileChunk.embedding` (backed by the `pgvector` column already in
 * `supabase/migrations`) should be used instead; this module only needs to
 * be swapped behind the same `retrieveRelevantChunks` signature.
 *
 * Deliberately simple (term-overlap scoring with a small IDF weighting, no
 * external index) — good enough for a handful of study documents,
 * transparent, and requires zero infrastructure.
 */

// Comprehensive Spanish stopword list (function words with no topical
// content of their own), based on the standard Snowball/NLTK Spanish
// stopword set -- includes the full ser/estar/haber/tener paradigms so a
// query or source sentence using any tense of those verbs doesn't skew
// term-overlap scoring. Kept in one flat set (not deduped by hand) so it's
// easy to diff against the source list if it needs updating later.
const SPANISH_STOPWORDS = new Set([
  // Core function words: articles, prepositions, conjunctions.
  "el", "la", "los", "las", "un", "una", "unos", "unas", "de", "del", "en", "y", "o",
  "e", "u", "a", "al", "que", "para", "por", "con", "sin", "sobre", "entre", "hasta",
  "desde", "durante", "mediante", "contra", "ante", "cual", "cuales", "quien",
  "quienes", "cuando", "donde", "porque", "como", "mas", "pero", "sino", "aunque",
  "mientras", "ni",
  // Negation/adverb/quantifier words -- kept here since retrieval only needs
  // approximate topical overlap, not exact-meaning grading (see grading.ts,
  // which deliberately excludes negation words for the opposite reason).
  "si", "no", "nunca", "jamas", "tampoco", "muy", "tan", "tanto", "tanta",
  "tambien", "asi", "solo", "solamente", "aun", "todavia", "ya", "ademas",
  "incluso", "apenas", "casi", "quiza", "quizas", "bastante", "demasiado",
  "siempre", "aqui", "ahi", "alli", "aca", "alla", "ahora", "entonces", "luego",
  "despues", "antes", "nada", "mucho", "muchos", "poco", "cuanto", "cuanta",
  "cuantos", "cuantas",
  // Pronouns and possessives.
  "yo", "tu", "vos", "el", "ella", "nosotros", "nosotras", "vosotros", "vosotras",
  "ustedes", "ellos", "ellas", "me", "te", "le", "lo", "la", "nos", "os", "les",
  "se", "mi", "mis", "tus", "su", "sus", "mio", "mia", "mios", "mias", "tuyo",
  "tuya", "tuyos", "tuyas", "ti",
  // Demonstratives and indefinites.
  "este", "esta", "esa", "ese", "eso", "esto", "estos", "estas", "esos", "esas",
  "aquel", "aquella", "aquellos", "aquellas", "todo", "toda", "todos", "todas",
  "otro", "otra", "otros", "otras", "mismo", "misma", "mismos", "mismas", "algo",
  "algun", "alguna", "algunos", "algunas", "uno", "unos",
  // Full ser/estar/haber/tener paradigms -- present, preterite, imperfect,
  // future, conditional, subjunctive, gerund/participle.
  "ser", "soy", "eres", "es", "somos", "sois", "son", "sea", "seas", "seamos",
  "seais", "sean", "sere", "seras", "sera", "seremos", "sereis", "seran",
  "seria", "serias", "seriamos", "seriais", "serian", "era", "eras", "eramos",
  "erais", "eran", "fui", "fuiste", "fue", "fuimos", "fuisteis", "fueron",
  "fuera", "fueras", "fueramos", "fuerais", "fueran", "fuese", "fueses",
  "fuesemos", "fueseis", "fuesen", "siendo", "sido",
  "estar", "estoy", "estas", "esta", "estamos", "estais", "estan", "estes",
  "estemos", "esteis", "esten", "estare", "estaras", "estara", "estaremos",
  "estareis", "estaran", "estaria", "estarias", "estariamos", "estariais",
  "estarian", "estaba", "estabas", "estabamos", "estabais", "estaban",
  "estuve", "estuviste", "estuvo", "estuvimos", "estuvisteis", "estuvieron",
  "estuviera", "estuvieras", "estuvieramos", "estuvierais", "estuvieran",
  "estuviese", "estuvieses", "estuviesemos", "estuvieseis", "estuviesen",
  "estando",
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

function stripAccents(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Normalized, stopword-filtered terms — exported so other heuristic
 * services (chat answers, corrections) can reuse the same notion of "what
 * counts as a meaningful word" instead of re-deriving it. */
export function significantTerms(text: string): string[] {
  return stripAccents(text.toLowerCase())
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((term) => term.length >= 3 && !SPANISH_STOPWORDS.has(term));
}

/** Splits free text into sentences, trimmed and without empty entries.
 * Shared by excerpt-building and any heuristic feature that wants to reason
 * sentence-by-sentence instead of quoting arbitrary character windows. */
export function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export interface RetrievedChunk {
  chunk: FileChunk;
  score: number;
}

export function retrieveRelevantChunks(chunks: FileChunk[], query: string, topK = 4): RetrievedChunk[] {
  const queryTerms = significantTerms(query);
  if (queryTerms.length === 0 || chunks.length === 0) return [];

  const uniqueQueryTerms = Array.from(new Set(queryTerms));
  const chunkTermLists = chunks.map((chunk) => significantTerms(chunk.content));

  // Inverse-document-frequency: a query term that shows up in almost every
  // chunk (e.g. a subject name repeated on every page) is less useful for
  // ranking than one that only appears in a couple of chunks.
  const idf = new Map<string, number>();
  for (const term of uniqueQueryTerms) {
    const docFrequency = chunkTermLists.filter((terms) => terms.includes(term)).length;
    idf.set(term, Math.log((chunks.length + 1) / (docFrequency + 1)) + 1);
  }

  const normalizedQuery = stripAccents(query.toLowerCase()).trim();

  const scored = chunks.map((chunk, i) => {
    const chunkTerms = chunkTermLists[i]!;
    if (chunkTerms.length === 0) return { chunk, score: 0 };
    const termFrequency = new Map<string, number>();
    for (const term of chunkTerms) termFrequency.set(term, (termFrequency.get(term) ?? 0) + 1);

    let rawScore = 0;
    for (const term of queryTerms) rawScore += (termFrequency.get(term) ?? 0) * (idf.get(term) ?? 1);

    // Normalize so long chunks don't win purely by containing more words.
    let score = rawScore / Math.sqrt(chunkTerms.length);

    // Small bonus for containing the query as a literal phrase (e.g. "tiro
    // vertical" as two consecutive words), which is a stronger signal than
    // the same two words appearing far apart in the chunk.
    if (normalizedQuery.length >= 6 && stripAccents(chunk.content.toLowerCase()).includes(normalizedQuery)) {
      score += 2;
    }

    return { chunk, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/**
 * Short, honest excerpt around the best-matching sentence(s) — used for
 * citations. Snaps to sentence boundaries (never cuts a sentence in half)
 * and extends to neighboring sentences while it still fits `maxLength`, so
 * the quote reads naturally instead of trailing off mid-thought.
 */
export function buildExcerpt(content: string, query: string, maxLength = 220): string {
  const sentences = splitIntoSentences(content);
  if (sentences.length === 0) {
    return content.slice(0, maxLength).trim() + (content.length > maxLength ? "…" : "");
  }

  const terms = significantTerms(query);
  let bestIndex = 0;
  if (terms.length > 0) {
    let bestScore = -1;
    sentences.forEach((sentence, i) => {
      const normalized = stripAccents(sentence.toLowerCase());
      let score = 0;
      for (const term of terms) if (normalized.includes(term)) score += 1;
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    });
    // No sentence matched any term at all — fall back to the old
    // substring-around-first-match behavior so we don't silently jump to
    // an unrelated sentence 0.
    if (bestScore <= 0) {
      const normalizedContent = stripAccents(content.toLowerCase());
      let index = -1;
      for (const term of terms) {
        const found = normalizedContent.indexOf(term);
        if (found !== -1 && (index === -1 || found < index)) index = found;
      }
      if (index === -1) {
        return content.slice(0, maxLength).trim() + (content.length > maxLength ? "…" : "");
      }
      const start = Math.max(0, index - 60);
      const end = Math.min(content.length, index + maxLength - 60);
      return (start > 0 ? "…" : "") + content.slice(start, end).trim() + (end < content.length ? "…" : "");
    }
  }

  let result = sentences[bestIndex]!;
  let start = bestIndex;
  let end = bestIndex;
  // Extend outward (preferring forward) while it still fits, so the quote
  // carries a bit of surrounding context rather than a single bare clause.
  while (result.length < maxLength) {
    const canExtendForward = end + 1 < sentences.length;
    const nextForward = canExtendForward ? sentences[end + 1]! : null;
    if (nextForward && result.length + 1 + nextForward.length <= maxLength) {
      result = `${result} ${nextForward}`;
      end += 1;
      continue;
    }
    break;
  }

  if (result.length > maxLength) {
    result = result.slice(0, maxLength).replace(/\s+\S*$/, "").trim();
  }

  const prefix = start > 0 ? "…" : "";
  const suffix = end < sentences.length - 1 ? "…" : "";
  return `${prefix}${result}${suffix}`;
}
