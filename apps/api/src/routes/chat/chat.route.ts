import { createRoute } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import {
  ChatParamsSchema,
  ChatSessionSchema,
  CreateChatRequestBody,
  ErrorSchema,
  SendMessageRequestBody,
} from "./chat.schemas";

import { createRouter } from "@/lib/create-app";
import {
  handleChat,
  handleResumeChatStream,
  handleSendMessage,
} from "./chat.handlers";

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

const sendMessageRoute = createRoute({
  tags: ["Chat"],
  method: "post",
  path: "/chat/{runId}/message",
  request: {
    params: ChatParamsSchema,
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
      description:
        "SSE stream for the assistant response with x-workflow-run-id header",
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

const router = createRouter()
  .openapi(createChatRoute, handleChat)
  .openapi(resumeChatStream, handleResumeChatStream)
  .openapi(sendMessageRoute, handleSendMessage);

export default router;
