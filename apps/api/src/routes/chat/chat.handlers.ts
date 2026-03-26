import { AppRouteHandler } from "@/lib/types";
import {
  CreateChatRoute,
  ResumeChatStreamRoute,
  SendMessageRoute,
} from "./chat.route";
import { handleError } from "@/lib/handle-error";
import { CreateChatErrorStatusCodes } from "./chat.schemas";
import { OK } from "stoker/http-status-codes";
import {
  createChat,
  resumeChatStream,
  sendChatMessages,
} from "./chat.services";

export const handleCreateChat: AppRouteHandler<CreateChatRoute> = async (
  ctx
) => {
  try {
    const { messages } = ctx.req.valid("json");
    const { id } = await createChat(ctx, { messages });
    return ctx.json({ id }, OK);
  } catch (error) {
    return handleError<CreateChatErrorStatusCodes>(ctx, error);
  }
};

export const handleSendMessage: AppRouteHandler<SendMessageRoute> = async (
  ctx
) => {
  try {
    const { messages } = ctx.req.valid("json");
    const { response } = await sendChatMessages(ctx, { messages });
    return response;
  } catch (error) {
    return handleError<CreateChatErrorStatusCodes>(ctx, error);
  }
};

export const handleResumeChatStream: AppRouteHandler<
  ResumeChatStreamRoute
> = async (ctx) => {
  try {
    const { id } = ctx.req.valid("param");
    return resumeChatStream(ctx, id);
  } catch (error) {
    return handleError(ctx, error);
  }
};
