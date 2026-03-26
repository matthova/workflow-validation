import { z } from "@hono/zod-openapi";
import {
  FORBIDDEN,
  INTERNAL_SERVER_ERROR,
  TOO_MANY_REQUESTS,
} from "stoker/http-status-codes";

export const metadataSchema = z.object({}).passthrough();
export const messageBase = {
  id: z.string(),
  metadata: metadataSchema.optional(),
};
export const textUIPartSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
});
export const fileUIPartSchema = z.object({
  type: z.literal("file"),
  mediaType: z.string(),
  url: z.string(),
  filename: z.string().optional(),
});
export const userPartSchema = z.discriminatedUnion("type", [
  textUIPartSchema,
  fileUIPartSchema,
]);
export const userUIMessageSchema = z.object({
  ...messageBase,
  role: z.literal("user"),
  parts: z.array(userPartSchema),
});
export type UserUIMessage = z.infer<typeof userUIMessageSchema>;

export const assistantPartSchema = z.object({ type: z.string() }).passthrough();

export const assistantUIMessageSchema = z.object({
  ...messageBase,
  role: z.literal("assistant"),
  parts: z.array(assistantPartSchema),
});

export const chatUIMessageSchema = z.union([
  userUIMessageSchema,
  assistantUIMessageSchema,
]);
export type ChatUIMessage = z.infer<typeof chatUIMessageSchema>;

export const SendMessageRequestBody = z
  .object({
    messages: z.array(chatUIMessageSchema),
  })
  .openapi("SendMessageRequestBody");

export const ErrorSchema = z.object({
  error: z.string(),
});

export const SuccessSchema = z.object({ success: z.boolean() });

// Error status codes returned by chat route handlers (for handleError generic)
export type CreateChatErrorStatusCodes =
  | typeof FORBIDDEN
  | typeof TOO_MANY_REQUESTS
  | typeof INTERNAL_SERVER_ERROR;
