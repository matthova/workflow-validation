import type { NextRequest } from "next/server";

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) => {
  const { runId } = await params;

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/chat/${runId}/stream`
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
