import React, { useState } from "react";

import { ChatContext } from "./ChatContext";
import { ChatObject } from "../../models/chat.model";
import { MessagesObject } from "../../models/message.model";

interface ChatProps extends React.PropsWithChildren {}

const ChatProvider: React.FC<ChatProps> = (props) => {
  const [activeChatId, setActiveChatId] = useState<string>("");
  const [messages, setMessages] = useState<MessagesObject>({});
  const [chatList, setChatList] = useState<ChatObject>({});
  const [friends, setFriends] = useState<Set<string>>(new Set<string>());

  return (
    <ChatContext.Provider
      value={{
        activeChatId,
        messages,
        chatList,
        friends,
        setActiveChatId,
        setMessages,
        setChatList,
        setFriends,
      }}
    >
      {props.children}
    </ChatContext.Provider>
  );
};

export default ChatProvider;
