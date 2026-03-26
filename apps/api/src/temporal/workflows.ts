import {
  condition,
  defineQuery,
  defineSignal,
  proxyActivities,
  setHandler,
} from "@temporalio/workflow";
import type {
  ChatMessage,
  GenerateResponseInput,
  GenerateResponseOutput,
} from "./activities";

// ---------------------------------------------------------------------------
// Signals & Queries
// ---------------------------------------------------------------------------

export interface AddMessagePayload {
  streamId: string;
  messages: ChatMessage[];
}

export const addMessageSignal =
  defineSignal<[AddMessagePayload]>("addMessage");

export const getStatusQuery = defineQuery<"active" | "completed">("getStatus");

// ---------------------------------------------------------------------------
// Activity proxies
// ---------------------------------------------------------------------------

const { generateResponse } = proxyActivities<{
  generateResponse: (
    input: GenerateResponseInput
  ) => Promise<GenerateResponseOutput>;
}>({
  startToCloseTimeout: "2 minutes",
  retry: {
    initialInterval: "1s",
    backoffCoefficient: 2,
    maximumAttempts: 3,
  },
});

// ---------------------------------------------------------------------------
// Workflow
// ---------------------------------------------------------------------------

/**
 * A durable chat conversation.
 *
 * 1. Generates an initial assistant response for the first user message(s).
 * 2. Waits for follow-up user messages delivered via `addMessageSignal`.
 * 3. For each new message, generates another assistant response.
 * 4. If no message arrives within 30 minutes, the workflow completes.
 *
 * All LLM calls are Activities — if the worker crashes mid-generation Temporal
 * replays up to the last completed activity and retries the failed one.
 */
export async function chatWorkflow(
  chatId: string,
  initialMessages: ChatMessage[],
  model?: string
): Promise<void> {
  let pending: AddMessagePayload | null = null;
  let status: "active" | "completed" = "active";

  // -- Signal: receive a new user message + stream ID ---
  setHandler(addMessageSignal, (payload) => {
    pending = payload;
  });

  // -- Query: expose current status ---
  setHandler(getStatusQuery, () => status);

  // -- Initial response ---
  await generateResponse({
    streamId: chatId,
    messages: initialMessages,
    model: model ?? "gpt-4o",
  });

  // -- Conversation loop ---
  while (true) {
    // Wait up to 30 min for the next message; timeout → end workflow.
    const gotMessage = await condition(() => pending !== null, "30m");
    if (!gotMessage) break;

    const { streamId, messages } = pending!;
    pending = null;

    await generateResponse({
      streamId,
      messages,
      model: model ?? "gpt-4o",
    });
  }

  status = "completed";
}
