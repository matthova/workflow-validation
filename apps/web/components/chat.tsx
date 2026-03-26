"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";

export function Chat() {
  const [input, setInput] = useState("");

  const { messages, sendMessage } = useChat({
    api: "/api/chat",
  });

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
