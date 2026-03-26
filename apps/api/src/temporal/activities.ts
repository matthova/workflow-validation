import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  type UIMessage,
} from "ai";
import { bufferStream } from "@/routes/chat/chat.store";

/** Serializable message type shared with workflows (import as `type` there). */
export interface ChatMessage {
  id: string;
  role: string;
  parts: Array<{ type: string; [key: string]: unknown }>;
  metadata?: Record<string, unknown>;
}

export interface GenerateResponseInput {
  streamId: string;
  messages: ChatMessage[];
  model?: string;
}

export interface GenerateResponseOutput {
  text: string;
}

/**
 * Activity: call the LLM, stream tokens to the in-memory buffer (side-channel
 * for SSE), and return the complete text (recorded in Temporal's event history
 * for durability).
 */
export async function generateResponse(
  input: GenerateResponseInput
): Promise<GenerateResponseOutput> {
  const { streamId, messages, model = "gpt-4o" } = input;

  const result = streamText({
    model: openai(model),
    messages: await convertToModelMessages(messages as unknown as UIMessage[]),
  });

  // Pipe the UI-protocol stream into the in-memory buffer so SSE clients can
  // read tokens in real-time while the activity is still running.
  const response = createUIMessageStreamResponse({
    stream: result.toUIMessageStream(),
  });
  bufferStream(streamId, response.body!);

  // Block until the full response is available — this is the value Temporal
  // persists in its event history. If the process crashes before this resolves,
  // Temporal will retry the entire activity on a new worker.
  const text = await result.text;

  return { text };
}
