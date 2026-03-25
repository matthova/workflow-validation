"use client";

import { WorkflowChatTransport } from "@workflow/ai";

import { UIMessage, useChat } from "@ai-sdk/react";
import { useEffect, useMemo, useRef } from "react";

export function Chat({ runId }: { runId: string }) {
  const transport = useMemo(
    () =>
      new WorkflowChatTransport<UIMessage>({
        api: `/chat/${runId}`,
        prepareReconnectToStreamRequest() {
          // If resuming an active stream on mount, mark the session as streaming so the sidebar shows the spinner
          return { api: `/api/${runId}/resume-chat` };
        },
      }),
    [runId]
  );

  const { messages, sendMessage, resumeStream } = useChat({
    id: runId,
    transport,
    // `resume: true` runs in useEffect without deduping; React Strict Mode invokes that
    // effect twice, which starts two concurrent resume streams on one Chat. They share
    // `activeResponse`, so the first request's `finally` clears it while the second is
    // still running → TypeError reading `activeResponse.state` in the AI SDK.
    resume: false,
  });

  const resumeQueue = useRef(Promise.resolve());
  useEffect(() => {
    let cancelled = false;
    resumeQueue.current = resumeQueue.current
      .then(async () => {
        if (cancelled) return;
        await resumeStream();
      })
      .catch(() => {
        // Keep the chain usable if a resume attempt rejects unexpectedly
      });
    return () => {
      cancelled = true;
    };
  }, [runId, resumeStream]);

  return (
    <div>
      <form
        onSubmit={() =>
          sendMessage({ parts: [{ type: "text", text: "Hello, world!" }] })
        }
      >
        <input autoFocus type="text" name="message" placeholder="Message" />
        <button type="submit">Send</button>
      </form>
      <div>
        {messages.map((message, index) => (
          <div key={`${message.id}-${index}`}>
            {message.parts.map((part) =>
              part.type === "text" ? part.text : part.type
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
