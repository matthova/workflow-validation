import { AppContext } from "@/lib/types";
import { ChatUIMessage } from "./chat.schemas";
import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  UIMessage,
} from "ai";
import { v7 } from "uuid";
import { bufferStream, getStream } from "./chat.store";

/** Create a new chat: start streaming in the background and return the id. */
export async function createChat(
  _ctx: AppContext,
  { messages }: { messages: ChatUIMessage[] }
): Promise<{ id: string }> {
  const id = v7();

  const result = streamText({
    model: openai("gpt-5.4-nano"),
    messages: await convertToModelMessages(messages as unknown as UIMessage[]),
  });

  const response = createUIMessageStreamResponse({
    stream: result.toUIMessageStream(),
  });

  bufferStream(id, response.body!);

  return { id };
}

/** Send follow-up messages — starts a new stream under a new id. */
export async function sendChatMessages(
  _ctx: AppContext,
  { messages }: { messages: ChatUIMessage[] }
): Promise<{ id: string; response: Response }> {
  const id = v7();

  const result = streamText({
    model: openai("gpt-4o"),
    messages: await convertToModelMessages(messages as unknown as UIMessage[]),
  });

  const response = createUIMessageStreamResponse({
    stream: result.toUIMessageStream(),
    headers: { "x-chat-id": id },
  });

  // Tee: one branch goes to the buffer, the other to the client.
  const [forBuffer, forClient] = response.body!.tee();
  bufferStream(id, forBuffer);

  return {
    id,
    response: new Response(forClient, {
      status: response.status,
      headers: response.headers,
    }),
  };
}

/** Reconnect to an in-progress (or completed) stream. */
export async function resumeChatStream(
  _ctx: AppContext,
  id: string,
  startIndex = 0
): Promise<Response> {
  const stream = getStream(id, startIndex);
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
