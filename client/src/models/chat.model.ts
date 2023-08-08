import { DirectChatModel } from "./directChat.model";
import { GroupChatModel } from "./groupChat.model";

export interface ChatObject {
  [chatId: string]: GroupChatModel | DirectChatModel;
}
