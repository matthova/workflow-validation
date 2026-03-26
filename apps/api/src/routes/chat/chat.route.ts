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
  handleCreateChat,
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
    [HttpStatusCodes.OK]: jsonContent(ChatSessionSchema, "New chat session"),
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

const resumeChatStreamRoute = createRoute({
  tags: ["Chat"],
  method: "get",
  path: "/chat/{id}/stream",
  request: {
    params: ChatParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: {
      description:
        "SSE stream for the active chat session (replays from the beginning)",
    },
    [HttpStatusCodes.FORBIDDEN]: jsonContent(ErrorSchema, "Not Allowed"),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      ErrorSchema,
      "Internal server error"
    ),
  },
});
export type ResumeChatStreamRoute = typeof resumeChatStreamRoute;

const sendMessageRoute = createRoute({
  tags: ["Chat"],
  method: "post",
  path: "/chat/{id}/message",
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
        "SSE stream for the assistant response with x-chat-id header",
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
  .openapi(createChatRoute, handleCreateChat)
  .openapi(resumeChatStreamRoute, handleResumeChatStream)
  .openapi(sendMessageRoute, handleSendMessage);

export default router;
