import { AppRouteHandler } from "@/lib/types";
import { CreateChatRoute } from "./chat.route";
import { handleError } from "@/lib/handle-error";
import { CreateChatErrorStatusCodes } from "./chat.schemas";
import { OK } from "stoker/http-status-codes";
import { createChat } from "./chat.services";

export const handleChat: AppRouteHandler<CreateChatRoute> = async (ctx) => {
  try {
    const { message } = ctx.req.valid("json");

    const chatResponse = await createChat(ctx, {
      message,
    });
    if (chatResponse.isErr()) {
      return handleError<CreateChatErrorStatusCodes>(ctx, chatResponse.error);
    }
    return ctx.json({ id: chatResponse.value.sessionId }, OK);
  } catch (error) {
    return handleError<CreateChatErrorStatusCodes>(ctx, error);
  }
};
