import type { NextRequest } from "next/server";

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) => {
  const { runId } = await params;

  const url = new URL(request.url);
  const startIndex = url.searchParams.get("startIndex") ?? "0";

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/chat/${runId}/stream?startIndex=${startIndex}`
  );

  const headers = new Headers(response.headers);
  headers.delete("content-encoding");
  headers.delete("content-length");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};
