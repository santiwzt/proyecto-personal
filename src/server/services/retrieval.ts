import type { FileChunk } from "@/types/domain";

/**
 * Full-text retrieval fallback used whenever no embedding provider is
 * configured (`EMBEDDING_PROVIDER` empty — see `.env.example`). When an
 * embedding provider IS configured, a cosine-similarity ranking over
 * `FileChunk.embedding` (backed by the `pgvector` column already in
 * `supabase/migrations`) should be used instead; this module only needs to
 * be swapped behind the same `retrieveRelevantChunks` signature.
 *
 * Deliberately simple (term-overlap scoring, no external index) — good
 * enough for a handful of study documents, transparent, and requires zero
 * infrastructure.
 */

const SPANISH_STOPWORDS = new Set([
  "el", "la", "los", "las", "un", "una", "unos", "unas", "de", "del", "en", "y", "o",
  "que", "es", "son", "para", "por", "con", "sin", "se", "su", "sus", "al", "lo",
  "como", "mas", "pero", "si", "no", "esta", "este", "esa", "ese", "eso", "muy",
  "que", "cual", "cuales", "porque", "cuando", "donde",
]);

function stripAccents(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function significantTerms(text: string): string[] {
  return stripAccents(text.toLowerCase())
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((term) => term.length >= 3 && !SPANISH_STOPWORDS.has(term));
}

export interface RetrievedChunk {
  chunk: FileChunk;
  score: number;
}

export function retrieveRelevantChunks(chunks: FileChunk[], query: string, topK = 4): RetrievedChunk[] {
  const queryTerms = significantTerms(query);
  if (queryTerms.length === 0 || chunks.length === 0) return [];

  const scored = chunks.map((chunk) => {
    const chunkTerms = significantTerms(chunk.content);
    if (chunkTerms.length === 0) return { chunk, score: 0 };
    const termFrequency = new Map<string, number>();
    for (const term of chunkTerms) termFrequency.set(term, (termFrequency.get(term) ?? 0) + 1);

    let rawScore = 0;
    for (const term of queryTerms) rawScore += termFrequency.get(term) ?? 0;
    // Normalize so long chunks don't win purely by containing more words.
    const score = rawScore / Math.sqrt(chunkTerms.length);
    return { chunk, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/** Short, honest excerpt around the first matching term — used for citations. */
export function buildExcerpt(content: string, query: string, maxLength = 220): string {
  const terms = significantTerms(query);
  const normalizedContent = stripAccents(content.toLowerCase());
  let index = -1;
  for (const term of terms) {
    const found = normalizedContent.indexOf(term);
    if (found !== -1 && (index === -1 || found < index)) index = found;
  }
  if (index === -1) return content.slice(0, maxLength).trim() + (content.length > maxLength ? "…" : "");
  const start = Math.max(0, index - 60);
  const end = Math.min(content.length, index + maxLength - 60);
  return (start > 0 ? "…" : "") + content.slice(start, end).trim() + (end < content.length ? "…" : "");
}
