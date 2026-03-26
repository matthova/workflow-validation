import { serve } from "@hono/node-server";
import app from "./app";
import { startWorker } from "./temporal/worker";

const port = Number(process.env.PORT ?? 3001);

// Start the Temporal worker in-process so activities can share the in-memory
// stream buffer with the Hono server.
startWorker().catch((err) => {
  console.error("Failed to start Temporal worker", err);
  process.exit(1);
});

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Server running on http://localhost:${info.port}`);
});
