import { AppRouteHandler } from "@/lib/types";
import { CreateChatRoute } from "./chat.route";
import { handleError } from "@/lib/handle-error";
import { CreateChatErrorStatusCodes } from "./chat.schemas";
import { OK } from "stoker/http-status-codes";
import { createChat } from "./chat.services";

export const handleChat: AppRouteHandler<CreateChatRoute> = async (ctx) => {
  try {
    const { messages } = ctx.req.valid("json");

    const chatResponse = await createChat(ctx, {
      messages,
    });
    if (chatResponse.isErr()) {
      return handleError<CreateChatErrorStatusCodes>(ctx, chatResponse.error);
    }
    return ctx.json({ runId: chatResponse.value.runId }, OK);
  } catch (error) {
    return handleError<CreateChatErrorStatusCodes>(ctx, error);
  }
};
