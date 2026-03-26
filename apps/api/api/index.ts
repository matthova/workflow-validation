import { handle } from "@hono/node-server/vercel";
import app from "../dist/src/app.js";
import "../dist/src/env.js";

export default handle(app);
