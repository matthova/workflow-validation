import { createRoute } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import {
  ChatParamsSchema,
  ChatSessionSchema,
  CreateChatRequestBody,
  ErrorSchema,
} from "./chat.schemas";

import { createRouter } from "@/lib/create-app";
import { handleChat, handleResumeChatStream } from "./chat.handlers";

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

export const resumeChatStream = createRoute({
  tags: ["Chat"],
  method: "get",
  path: "/chat/{runId}/stream",
  request: {
    params: ChatParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: {
      description:
        "SSE stream for the active chat session (or a synthetic finish event if no active stream)",
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
export type ResumeChatStreamRoute = typeof resumeChatStream;

const router = createRouter()
  .openapi(createChatRoute, handleChat)
  .openapi(resumeChatStream, handleResumeChatStream);

export default router;
