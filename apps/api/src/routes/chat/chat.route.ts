import { createRoute } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import {
  ChatSessionSchema,
  CreateChatRequestBody,
  ErrorSchema,
} from "./chat.schemas";

import { createRouter } from "@/lib/create-app";

const createChatRoute = createRoute({
  tags: ["Chat"],
  method: "post",
  path: "/chat",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateChatRequestBody,
        },
      },
      required: true,
    },
  },
  responses: {
    [HttpStatusCodes.OK]: {
      description: "New chat session (ChatSessionSchema)",
      content: {
        "application/json": {
          schema: ChatSessionSchema,
        },
      },
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
export type CreateChatRoute = typeof createChatRoute;

const router = createRouter().openapi(createChatRoute, (c) => {
  return c.json({ id: crypto.randomUUID() }, HttpStatusCodes.OK);
});

export default router;
