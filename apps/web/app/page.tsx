"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const message = formData.get("message") as string;
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          {
            id: crypto.randomUUID(),
            role: "user",
            parts: [{ type: "text", text: message }],
          },
        ],
      }),
    });
    const data = await response.json();
    router.push(`/chat/${data.id}`);
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input autoFocus type="text" name="message" placeholder="Message" />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
