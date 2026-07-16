const DEFAULT_CHUNK_SIZE = 1000;
const DEFAULT_OVERLAP = 100;

export interface TextChunk {
  index: number;
  content: string;
  charCount: number;
}

/**
 * Splits extracted document text into overlapping chunks, preferring
 * paragraph boundaries so a chunk doesn't cut a sentence in half whenever
 * avoidable. Deterministic and dependency-free.
 */
export function chunkText(
  text: string,
  chunkSize = DEFAULT_CHUNK_SIZE,
  overlap = DEFAULT_OVERLAP,
): TextChunk[] {
  const cleaned = text.replace(/\r\n/g, "\n").trim();
  if (!cleaned) return [];

  const paragraphs = cleaned.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks: TextChunk[] = [];
  let current = "";

  const pushCurrent = () => {
    if (current.trim().length === 0) return;
    chunks.push({ index: chunks.length, content: current.trim(), charCount: current.trim().length });
  };

  for (const paragraph of paragraphs) {
    if (paragraph.length > chunkSize) {
      // Paragraph itself is too long: hard-split it, still trying to break on sentences.
      const sentences = paragraph.split(/(?<=[.!?])\s+/);
      for (const sentence of sentences) {
        if (sentence.length > chunkSize) {
          // A single sentence still exceeds the limit: fall back to a hard
          // character-window split so no chunk ever exceeds chunkSize.
          pushCurrent();
          current = "";
          for (let i = 0; i < sentence.length; i += chunkSize) {
            chunks.push({
              index: chunks.length,
              content: sentence.slice(i, i + chunkSize).trim(),
              charCount: sentence.slice(i, i + chunkSize).trim().length,
            });
          }
          continue;
        }
        if ((current + " " + sentence).trim().length > chunkSize) {
          pushCurrent();
          current = sentence;
        } else {
          current = (current + " " + sentence).trim();
        }
      }
      continue;
    }
    if ((current + "\n\n" + paragraph).trim().length > chunkSize) {
      pushCurrent();
      const overlapText = current.slice(Math.max(0, current.length - overlap));
      current = (overlapText + "\n\n" + paragraph).trim();
    } else {
      current = current ? `${current}\n\n${paragraph}` : paragraph;
    }
  }
  pushCurrent();

  return chunks;
}
