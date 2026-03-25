import type { NextRequest } from "next/server";

export const POST = async (request: NextRequest) => {
  const body = await request.json();

  return await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
};
