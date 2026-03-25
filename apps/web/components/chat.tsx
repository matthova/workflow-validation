"use client";

import { WorkflowChatTransport } from "@workflow/ai";

import { UIMessage, useChat } from "@ai-sdk/react";
import { useMemo } from "react";

export function Chat({ id }: { id: string }) {
  const transport = useMemo(
    () =>
      new WorkflowChatTransport<UIMessage>({
        api: `/foo/id`,
      }),
    []
  );

  const { messages, sendMessage } = useChat({
    transport,
    resume: false,
  });

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
        {messages.map((message) => (
          <div key={message.id}>
            {message.parts.map((part) =>
              part.type === "text" ? part.text : part.type
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
