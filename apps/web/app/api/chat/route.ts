import type { NextRequest } from "next/server";

export const POST = async (request: NextRequest) => {
  const body = await request.json();

  return await fetch("http://localhost:9999/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
};
