import { ContentfulStatusCode } from "hono/utils/http-status";
import { AppContext } from "./types";
import { ZodError } from "zod";
import { INTERNAL_SERVER_ERROR } from "stoker/http-status-codes";

export function handleError<ErrorStatusCode extends ContentfulStatusCode>(
  ctx: AppContext,
  error: unknown
) {
  const logger = ctx.get("logger");

  logger.error({ err: error });
  return ctx.json({ error: "Internal server error" }, INTERNAL_SERVER_ERROR);
}
