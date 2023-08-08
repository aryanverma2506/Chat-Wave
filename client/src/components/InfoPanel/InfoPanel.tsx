import React, { useContext, useEffect, useState } from "react";

import AvatarBig from "../../components/Avatar/AvatarBig";
import Contact from "../../components/Contact/Contact";
import { ChatContext, ChatContextType } from "../../context/Chat/ChatContext";
import { UserContext, UserContextType } from "../../context/User/UserContext";

import {
  DirectChatModel,
  DirectChatObject,
} from "../../models/directChat.model";
import { GroupChatModel } from "../../models/groupChat.model";
import { useHttpClient } from "../../hooks/useHttpClient-hook";

interface InfoPanelProps extends React.PropsWithChildren {}

const InfoPanel: React.FC<InfoPanelProps> = (props) => {
  const { id } = useContext<UserContextType>(UserContext);
  const {
    activeChatId: activeChatIdCtx,
    chatList: chatListCtx,
    setActiveChatId: setActiveChatIdCtx,
  } = useContext<ChatContextType>(ChatContext);

  const [selectedNewUser, setSelectedNewUser] = useState<DirectChatModel>();
  const [groupUsers, setGroupUsers] = useState<DirectChatObject>({});

  const { sendRequest } = useHttpClient();

  useEffect(() => {
    const selectedGroup = activeChatIdCtx
      ? (chatListCtx[activeChatIdCtx] as GroupChatModel)
      : undefined;
    if (
      selectedGroup &&
      selectedGroup.isGroupChat &&
      selectedGroup.users &&
      selectedGroup.users?.length
    ) {
      const filteredUsers: DirectChatObject = {};

      for (const user of selectedGroup.users) {
        filteredUsers[user._id] = user;
      }

      setGroupUsers(() => filteredUsers);
    } else {
      setGroupUsers(() => ({}));
    }
  }, [chatListCtx, activeChatIdCtx]);

  async function selectChat(chatId: string) {
    for (const key in chatListCtx) {
      if (
        !chatListCtx[key].isGroupChat &&
        (chatListCtx[key] as DirectChatModel).userId === chatId
      ) {
        return setActiveChatIdCtx(() => chatListCtx[key].chatId);
      }
    }
    const responseData = await sendRequest({
      url: `/user?searchUsers=${chatId}`,
    });
    console.log(responseData.searchedUsers[0]);
    if (responseData.searchedUsers[0]) {
      setSelectedNewUser(() => responseData.searchedUsers[0]);
    }
    chatId !== id && setActiveChatIdCtx(() => chatId);
  }

  return (
    <aside className="dark-theme white w-2/5 min-w-max flex flex-col">
      <div className="dark-theme-2 m-4 rounded-xl py-10 px-4">
        <AvatarBig
          isGroupChat={
            chatListCtx[activeChatIdCtx]
              ? chatListCtx[activeChatIdCtx].isGroupChat
              : selectedNewUser?.isGroupChat || false
          }
          online={
            chatListCtx[activeChatIdCtx]
              ? chatListCtx[activeChatIdCtx].isOnline
              : selectedNewUser?.isOnline || false
          }
          userId={
            chatListCtx[activeChatIdCtx]
              ? chatListCtx[activeChatIdCtx].chatId
              : selectedNewUser?._id || ""
          }
          name={
            chatListCtx[activeChatIdCtx]
              ? chatListCtx[activeChatIdCtx].chatName
              : selectedNewUser?.name || ""
          }
          profilePic={
            chatListCtx[activeChatIdCtx]
              ? chatListCtx[activeChatIdCtx].profilePic
              : selectedNewUser?.profilePic || ""
          }
        />
      </div>
      {Object.keys(groupUsers).length > 0 && (
        <div className="dark-theme-2 m-4 rounded-xl p-4">
          {Object.keys(groupUsers).map((chatId) => (
            <Contact
              key={chatId}
              isGroupChat={false}
              chatId={chatId}
              online={groupUsers[chatId].isOnline}
              name={groupUsers[chatId].name}
              profilePic={groupUsers[chatId].profilePic}
              className={"text-white"}
              onClick={selectChat.bind(null, groupUsers[chatId]._id)}
            />
          ))}
        </div>
      )}
    </aside>
  );
};

export default InfoPanel;
