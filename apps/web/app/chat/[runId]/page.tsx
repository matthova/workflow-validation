import { Chat } from "../../../components/chat";

export default async function Page({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;

  return <Chat runId={runId} />;
}
