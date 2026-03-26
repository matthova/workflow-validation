import { AppRouteHandler } from "@/lib/types";
import { SendMessageRoute } from "./chat.route";
import { handleError } from "@/lib/handle-error";
import { CreateChatErrorStatusCodes } from "./chat.schemas";
import { sendChatMessages } from "./chat.services";

export const handleSendMessage: AppRouteHandler<SendMessageRoute> = async (
  ctx
) => {
  try {
    const { messages } = ctx.req.valid("json");
    return sendChatMessages(ctx, { messages });
  } catch (error) {
    return handleError<CreateChatErrorStatusCodes>(ctx, error);
  }
};
