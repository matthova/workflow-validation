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

/** Resolvers waiting for a stream to be created (used when Temporal activities
 *  create the buffer asynchronously after a signal). */
const creationWaiters = new Map<string, Array<() => void>>();

/** Start buffering a ReadableStream<Uint8Array> under the given id. */
export function bufferStream(id: string, source: ReadableStream<Uint8Array>) {
  const entry: BufferedStream = { chunks: [], done: false, waiters: new Map() };
  streams.set(id, entry);

  // Notify anyone waiting for this stream to be created.
  const waiters = creationWaiters.get(id);
  if (waiters) {
    for (const wake of waiters) wake();
    creationWaiters.delete(id);
  }

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

/**
 * Wait until a buffer with the given id is created.
 * Resolves immediately if it already exists.
 */
export function waitForStream(id: string, timeoutMs = 10_000): Promise<void> {
  if (streams.has(id)) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      // Clean up our waiter on timeout.
      const arr = creationWaiters.get(id);
      if (arr) {
        const idx = arr.indexOf(done);
        if (idx >= 0) arr.splice(idx, 1);
        if (arr.length === 0) creationWaiters.delete(id);
      }
      reject(new Error(`Timeout waiting for stream ${id}`));
    }, timeoutMs);

    function done() {
      clearTimeout(timer);
      resolve();
    }

    if (!creationWaiters.has(id)) creationWaiters.set(id, []);
    creationWaiters.get(id)!.push(done);
  });
}
