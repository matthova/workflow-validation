import { AppContext } from "@/lib/types";
import { ChatUIMessage } from "./chat.schemas";
import { getStream, waitForStream } from "./chat.store";
import { getTemporalClient } from "@/temporal/client";
import { TASK_QUEUE } from "@/temporal/worker";
import {
  addMessageSignal,
  chatWorkflow,
} from "@/temporal/workflows";
import { v7 } from "uuid";

/** Create a new chat: start a Temporal workflow and return the id. */
export async function createChat(
  _ctx: AppContext,
  { messages }: { messages: ChatUIMessage[] }
): Promise<{ id: string }> {
  const id = v7();

  const client = await getTemporalClient();
  await client.workflow.start(chatWorkflow, {
    workflowId: `chat-${id}`,
    taskQueue: TASK_QUEUE,
    args: [id, messages],
  });

  return { id };
}

/** Send follow-up messages — signals the workflow to generate a new response. */
export async function sendChatMessages(
  _ctx: AppContext,
  { chatId, messages }: { chatId: string; messages: ChatUIMessage[] }
): Promise<{ id: string; response: Response }> {
  const streamId = v7();

  const client = await getTemporalClient();
  const handle = client.workflow.getHandle(`chat-${chatId}`);
  await handle.signal(addMessageSignal, { streamId, messages });

  // The activity will create the buffer asynchronously — wait for it.
  await waitForStream(streamId);

  const stream = getStream(streamId);
  return {
    id: streamId,
    response: new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "x-chat-id": streamId,
      },
    }),
  };
}

/** Reconnect to an in-progress (or completed) stream. */
export async function resumeChatStream(
  _ctx: AppContext,
  id: string,
  startIndex = 0
): Promise<Response> {
  // The workflow activity may not have created the buffer yet (e.g. the client
  // navigated to /chat/:id faster than the worker picked up the task).
  await waitForStream(id);

  const stream = getStream(id, startIndex);
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
