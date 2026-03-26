import env from "@/env";
import { Client, Connection } from "@temporalio/client";

let _client: Client | null = null;

/** Lazy singleton — creates the connection on first call. */
export async function getTemporalClient(): Promise<Client> {
  if (_client) return _client;

  const address = env.TEMPORAL_ADDRESS ?? "localhost:7233";
  const namespace = env.TEMPORAL_NAMESPACE ?? "default";
  const apiKey = env.TEMPORAL_API_KEY;

  const connection = await Connection.connect({
    address,
    ...(apiKey ? { tls: {}, apiKey } : {}),
  });

  _client = new Client({ connection, namespace });
  return _client;
}
