import { DirectChatModel } from "./directChat.model";
import { MessagesModel } from "./message.model";

export interface GroupChatModel {
  readonly _id: string;
  readonly chatId: string;
  readonly chatName: string;
  readonly isGroupChat: true;
  readonly profilePic: string;
  readonly isOnline?: false;
  readonly users: DirectChatModel[];
  readonly latestMessage?: MessagesModel;
  readonly groupAdmins: DirectChatModel[];
}
