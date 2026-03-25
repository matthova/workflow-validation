import type { InferUIMessageChunk, UIMessage } from "ai";
import { getWritable } from "workflow";

type ArenaChunk = InferUIMessageChunk<UIMessage>;

/**
 * Write a data part telling the frontend the review was resolved.
 */
export async function writeFeedbackResolvedData(action: unknown) {
  "use step";
  const writable = getWritable<ArenaChunk>();
  const writer = writable.getWriter();
  await writer.write({
    type: "data-feedback-resolved",
    data: { action },
  });
  writer.releaseLock();
}

/**
 * Write the finish chunk and close the workflow's output stream.
 * Called after all persistence (DB + R2 + Redis cleanup) is complete so the
 * client only receives the finish signal once data is available to query.
 */
export async function writeFinishAndClose() {
  "use step";
  const writable = getWritable<ArenaChunk>();
  const writer = writable.getWriter();
  await writer.write({ type: "finish", finishReason: "stop" });
  await writer.close();
}

/**
 * Write the `start` chunk with our pre-generated UUIDv7 so the client and DB
 * share the same assistant message ID. This replaces DurableAgent's default
 * `start` (which uses a random ID) — the agent's own start is suppressed via
 * `sendStart: false`. Because this is a step, it's replayed on stream resume.
 */
export async function writeStart(messageId: string) {
  "use step";
  const writable = getWritable<ArenaChunk>();
  const writer = writable.getWriter();
  await writer.write({ type: "start", messageId });
}
