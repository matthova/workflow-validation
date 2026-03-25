import { getRun, start } from "workflow/api";
import { AppContext } from "@/lib/types";
import { UserUIMessage } from "./chat.schemas";
import { ResultAsync } from "neverthrow";
import { v7 } from "uuid";
import { DurableAgent } from "@workflow/ai/agent";
import { openai } from "@workflow/ai/openai";
import { getWritable } from "workflow";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  UIMessage,
  UIMessageChunk,
} from "ai";
import { writeFinishAndClose } from "./chat.steps";

interface CreateChatResponse {
  runId: string;
}

/** Create a new chat session, persist the first user message, and start the agent workflow. */
export function createChat(
  ctx: AppContext,
  { messages }: { messages: UserUIMessage[] }
): ResultAsync<CreateChatResponse, Error> {
  return ResultAsync.fromPromise(
    (async () => {
      const result = await start(sessionWorkflow, [
        {
          messages,
        },
      ]);

      return { runId: result.runId };
    })(),
    (error) => (error instanceof Error ? error : new Error(String(error)))
  );
}

interface SessionWorkflowParams {
  messages: UserUIMessage[];
}

export async function sessionWorkflow(params: SessionWorkflowParams) {
  "use workflow";

  const agent = new DurableAgent({
    model: openai("gpt-5.4"),
    tools: {},
  });

  const result = await agent.stream({
    messages: await convertToModelMessages(params.messages),
    writable: getWritable<UIMessageChunk<UIMessage>>(),
    collectUIMessages: true,
    sendStart: false,
    sendFinish: false,
    preventClose: true,
  });

  // 3. Validate the agent produced exactly one assistant message.
  const uiMessages = (result.uiMessages ?? []) as UIMessage[];
  const newAssistantMessage = uiMessages.at(0);

  if (!newAssistantMessage || uiMessages.length !== 1) {
    throw new Error(
      `[sessionWorkflow] Expected 1 assistant message, got ${uiMessages.length}`
    );
  }
  if (newAssistantMessage.role !== "assistant") {
    throw new Error(
      `[sessionWorkflow] Expected assistant message, got ${newAssistantMessage.role}`
    );
  }

  await writeFinishAndClose();
}

/** Reconnect to an in-progress agent stream (e.g. after a page refresh).
 *  Returns a finished-stream response if no active run exists. */
export async function resumeChatStream(
  ctx: AppContext,
  runId: string
): Promise<Response> {
  const run = await getRun(runId);
  const stream = run.getReadable({ startIndex: 0 });

  return createUIMessageStreamResponse({ stream });
}
