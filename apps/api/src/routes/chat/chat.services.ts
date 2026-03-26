import { AppContext } from "@/lib/types";
import { ChatUIMessage } from "./chat.schemas";
import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  UIMessage,
} from "ai";

/** Stream a chat response for the given messages. */
export async function sendChatMessages(
  _ctx: AppContext,
  { messages }: { messages: ChatUIMessage[] }
): Promise<Response> {
  const result = streamText({
    model: openai("gpt-4o"),
    messages: await convertToModelMessages(
      messages as unknown as UIMessage[]
    ),
  });

  return createUIMessageStreamResponse({
    stream: result.toUIMessageStream(),
  });
}
