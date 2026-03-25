"use client";

import { WorkflowChatTransport } from "@workflow/ai";

import { UIMessage, useChat } from "@ai-sdk/react";
import { useEffect, useMemo, useRef, useState } from "react";

export function Chat({ runId: initialRunId }: { runId: string }) {
  const [runId, setRunId] = useState(initialRunId);

  const transport = useMemo(
    () =>
      new WorkflowChatTransport<UIMessage>({
        api: "/api/chat",
        prepareSendMessagesRequest({ messages }) {
          return {
            api: `/api/chat/${runId}/message`,
            body: { messages },
          };
        },
        onChatSendMessage(response) {
          const newRunId = response.headers.get("x-workflow-run-id");
          if (newRunId) {
            setRunId(newRunId);
            window.history.replaceState(null, "", `/chat/${newRunId}`);
          }
        },
        prepareReconnectToStreamRequest() {
          return { api: `/api/chat/${runId}/stream` };
        },
      }),
    [runId]
  );

  const [input, setInput] = useState("");

  // Do not pass workflow `runId` as `useChat` id: each assistant turn returns a new
  // `x-workflow-run-id`, and @ai-sdk/react recreates Chat state when `id` changes,
  // which clears message history. `runId` state is still used for API paths below.
  const { messages, sendMessage, resumeStream } = useChat({
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
  }, [initialRunId, resumeStream]);

  return (
    <div>
      <div>
        {messages.map((message, index) => (
          <div key={`${message.id}-${index}`}>
            <strong>{message.role}:</strong>{" "}
            {message.parts.map((part, i) =>
              part.type === "text" ? (
                <span key={i}>{part.text}</span>
              ) : (
                <span key={i}>[{part.type}]</span>
              )
            )}
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!input.trim()) return;
          sendMessage({
            parts: [{ type: "text", text: input }],
          });
          setInput("");
        }}
      >
        <input
          autoFocus
          type="text"
          name="message"
          placeholder="Message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
