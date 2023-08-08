import { MessagesModel } from "./message.model";

export interface DirectChatModel {
  readonly _id: string;
  readonly name: string;
  readonly email: string;
  readonly userId: string;
  readonly chatId: string;
  readonly chatName: string;
  readonly isOnline: boolean;
  readonly profilePic: string;
  readonly isGroupChat: false;
  readonly latestMessage?: MessagesModel;
}

export interface DirectChatObject {
  [chatId: string]: DirectChatModel;
}
