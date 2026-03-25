import type { NextRequest } from "next/server";

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) => {
  const { runId } = await params;

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/chat/${runId}/stream`
  );

  return response;
};
