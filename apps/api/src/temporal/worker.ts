import { Worker, NativeConnection } from "@temporalio/worker";
import * as activities from "./activities";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const TASK_QUEUE = "chat";

export async function startWorker(): Promise<Worker> {
  const address = process.env.TEMPORAL_ADDRESS ?? "localhost:7233";
  const namespace = process.env.TEMPORAL_NAMESPACE ?? "default";
  const apiKey = process.env.TEMPORAL_API_KEY;

  const connection = await NativeConnection.connect({
    address,
    ...(apiKey ? { tls: {}, apiKey } : {}),
  });

  const worker = await Worker.create({
    connection,
    namespace,
    taskQueue: TASK_QUEUE,
    workflowsPath: path.resolve(__dirname, "./workflows.ts"),
    activities,
  });

  // Run in the background — resolves when the worker shuts down.
  worker.run().catch((err) => {
    console.error("Temporal worker failed", err);
    process.exit(1);
  });

  console.log(`Temporal worker started on queue "${TASK_QUEUE}"`);
  return worker;
}
