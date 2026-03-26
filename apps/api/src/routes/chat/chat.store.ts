/**
 * In-memory buffer for active chat streams.
 * Stores encoded SSE chunks so late-joining clients can replay from any index.
 */

interface BufferedStream {
  chunks: Uint8Array[];
  done: boolean;
  /** Resolvers waiting for the next chunk at a given index. */
  waiters: Map<number, () => void>;
}

const streams = new Map<string, BufferedStream>();

/** Start buffering a ReadableStream<Uint8Array> under the given id. */
export function bufferStream(id: string, source: ReadableStream<Uint8Array>) {
  const entry: BufferedStream = { chunks: [], done: false, waiters: new Map() };
  streams.set(id, entry);

  const reader = source.getReader();
  (async () => {
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const idx = entry.chunks.length;
        entry.chunks.push(value);
        entry.waiters.get(idx)?.();
        entry.waiters.delete(idx);
      }
    } finally {
      entry.done = true;
      // Wake all remaining waiters so they see `done`.
      for (const wake of entry.waiters.values()) wake();
      entry.waiters.clear();
    }
  })();
}

/** Create a ReadableStream that replays from `startIndex` and follows live. */
export function getStream(
  id: string,
  startIndex = 0
): ReadableStream<Uint8Array> {
  const entry = streams.get(id);
  if (!entry) {
    throw new Error(`No stream found for id: ${id}`);
  }

  let idx = startIndex;

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      while (true) {
        if (idx < entry.chunks.length) {
          controller.enqueue(entry.chunks[idx]!);
          idx++;
          return;
        }
        if (entry.done) {
          controller.close();
          return;
        }
        // Wait for the next chunk.
        await new Promise<void>((resolve) => {
          entry.waiters.set(idx, resolve);
        });
      }
    },
  });
}

export function hasStream(id: string): boolean {
  return streams.has(id);
}
