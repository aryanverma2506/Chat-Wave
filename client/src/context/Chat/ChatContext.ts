import { createContext } from "react";

import { ChatObject } from "../../models/chat.model";
import { MessagesObject } from "../../models/message.model";

export interface ChatContextType {
  readonly activeChatId: string;
  readonly messages: MessagesObject;
  readonly chatList: ChatObject;
  readonly friends: Set<string>;
  setActiveChatId: React.Dispatch<React.SetStateAction<string>>;
  setMessages: React.Dispatch<React.SetStateAction<MessagesObject>>;
  setChatList: React.Dispatch<React.SetStateAction<ChatObject>>;
  setFriends: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export const ChatContext = createContext<ChatContextType>({
  activeChatId: "",
  messages: {},
  chatList: {},
  friends: new Set(),
  setActiveChatId: () => {},
  setMessages: () => {},
  setChatList: () => {},
  setFriends: () => {},
});
