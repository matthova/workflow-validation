"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";

export function Chat({ id }: { id: string }) {
  const [input, setInput] = useState("");

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `/api/chat/${id}/stream`,
        prepareReconnectToStreamRequest() {
          return { api: `/api/chat/${id}/stream` };
        },
      }),
    [id]
  );

  const { messages, sendMessage, resumeStream } = useChat({
    transport,
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
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [id, resumeStream]);

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
