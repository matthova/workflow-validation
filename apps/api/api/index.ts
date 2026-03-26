import { handle } from "@hono/node-server/vercel";
import app from "./src/app";
import "./src/env";

export default handle(app);
