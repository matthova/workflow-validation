import { createRoute } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import { ErrorSchema, SendMessageRequestBody } from "./chat.schemas";

import { createRouter } from "@/lib/create-app";
import { handleSendMessage } from "./chat.handlers";

const sendMessageRoute = createRoute({
  tags: ["Chat"],
  method: "post",
  path: "/chat",
  request: {
    body: {
      content: {
        "application/json": {
          schema: SendMessageRequestBody,
        },
      },
      required: true,
    },
  },
  responses: {
    [HttpStatusCodes.OK]: {
      description: "SSE stream for the assistant response",
    },
    [HttpStatusCodes.FORBIDDEN]: jsonContent(ErrorSchema, "Not Allowed"),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: jsonContent(
      ErrorSchema,
      "Rate limited"
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      ErrorSchema,
      "Internal server error"
    ),
  },
});
export type SendMessageRoute = typeof sendMessageRoute;

const router = createRouter().openapi(sendMessageRoute, handleSendMessage);

export default router;
