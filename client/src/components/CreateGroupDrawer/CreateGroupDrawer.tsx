import React, { useContext, useRef, useState } from "react";

import Input from "../Input/Input";
import Button from "../Button/Button";
import Contact from "../Contact/Contact";
import DrawerModal from "../DrawerModal/DrawerModal";
import { ChatContext, ChatContextType } from "../../context/Chat/ChatContext";
import { useHttpClient } from "../../hooks/useHttpClient-hook";
import { DirectChatModel } from "../../models/directChat.model";

interface CreateGroupDrawerProps extends React.PropsWithChildren {
  showDrawer: boolean;
  setShowDrawer: React.Dispatch<React.SetStateAction<boolean>>;
}

const CreateGroupDrawer: React.FC<CreateGroupDrawerProps> = (props) => {
  const { showDrawer, setShowDrawer } = props;

  const { chatList: chatListCtx, setChatList: setChatListCtx } =
    useContext<ChatContextType>(ChatContext);

  const orderedChatListRef = useRef<HTMLUListElement>(null);

  const { sendRequest } = useHttpClient();

  const [searchInput, setSearchInput] = useState<string>("");
  const [groupName, setGroupName] = useState<string>("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  function clearCreateGroupForm() {
    setSearchInput(() => "");
    setGroupName(() => "");
    setSelectedUsers(() => []);
  }

  function searchHandler(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setSearchInput(() => event.target.value);
  }

  function selectUserHandler(
    chatId: string | undefined,
    event: React.FormEvent | undefined
  ) {
    event?.preventDefault();
    if (chatId) {
      setSelectedUsers((prevUsersIds) => {
        if (prevUsersIds.includes(chatId)) {
          return prevUsersIds.filter((prevUsersId) => prevUsersId !== chatId);
        } else {
          return [...prevUsersIds, chatId];
        }
      });
    } else {
      const firstChild = orderedChatListRef.current?.querySelector(
        "li"
      ) as HTMLLIElement;
      if (firstChild) {
        firstChild.click();
      }
    }
  }

  async function createGroup(event: React.FormEvent) {
    event.preventDefault();
    if (groupName.trim() && selectedUsers.length > 0) {
      try {
        const responseData = await sendRequest({
          url: "/chat/group",
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatName: groupName,
            userIds: selectedUsers,
          }),
        });
        setChatListCtx((prevList) => ({
          [responseData.newGroupInfo._id]: responseData.newGroupInfo,
          ...prevList,
        }));
        setShowDrawer(() => false);
      } catch (error: any) {
        console.log(error.message);
      }
    }
  }

  return (
    <DrawerModal
      showDrawer={showDrawer}
      setShowDrawer={setShowDrawer}
      callbackOnExited={clearCreateGroupForm}
    >
      <form
        onSubmit={selectUserHandler.bind(null, "")}
        className="relative flex border rounded-md mb-2 pl-4 dark-theme-2"
      >
        <Button type="submit" className="left-3 top-2.5 text-green-500">
          <i className="fa-solid fa-magnifying-glass"></i>
        </Button>
        <Input
          type="search"
          value={searchInput}
          placeholder="Search..."
          className="dark-theme-2 w-full p-2 pl-4 pr-10 rounded-md text-gray-200 focus:outline-none"
          onChange={searchHandler}
        />
        {searchInput && (
          <Button
            type="submit"
            className="absolute w-10 h-full top-1/2 transform -translate-y-1/2 text-green-500 right-0"
            onClick={() => setSearchInput(() => "")}
          >
            <i className="fa-regular fa-xmark"></i>
          </Button>
        )}
      </form>
      <form onSubmit={createGroup}>
        <Input
          type="text"
          value={groupName}
          placeholder="Group Name"
          className="dark-theme w-full p-2 pl-4 pr-10 my-5 text-gray-200 focus:outline-none border-b border-green-500"
          onChange={(e) => setGroupName(() => e.target.value)}
        />
        <ul className="list-none" ref={orderedChatListRef}>
          {Object.keys(chatListCtx).map((chatId) => {
            if (!chatListCtx[chatId].isGroupChat) {
              if (searchInput) {
                if (
                  chatListCtx[chatId].chatName
                    .toLowerCase()
                    .includes(searchInput.toLowerCase())
                ) {
                  return (
                    <Contact
                      key={chatId}
                      isGroupChat={chatListCtx[chatId].isGroupChat}
                      chatId={chatId}
                      online={chatListCtx[chatId].isOnline}
                      activeChatId={
                        selectedUsers.includes(
                          (chatListCtx[chatId] as DirectChatModel).userId
                        )
                          ? chatId
                          : ""
                      }
                      name={chatListCtx[chatId].chatName}
                      profilePic={chatListCtx[chatId].profilePic}
                      onClick={selectUserHandler.bind(
                        null,
                        (chatListCtx[chatId] as DirectChatModel).userId,
                        undefined
                      )}
                    />
                  );
                }
              } else {
                return (
                  <Contact
                    key={chatId}
                    isGroupChat={chatListCtx[chatId].isGroupChat}
                    chatId={chatId}
                    online={chatListCtx[chatId].isOnline}
                    activeChatId={
                      selectedUsers.includes(
                        (chatListCtx[chatId] as DirectChatModel).userId
                      )
                        ? chatId
                        : ""
                    }
                    name={chatListCtx[chatId].chatName}
                    profilePic={chatListCtx[chatId].profilePic}
                    onClick={selectUserHandler.bind(
                      null,
                      (chatListCtx[chatId] as DirectChatModel).userId,
                      undefined
                    )}
                  />
                );
              }
            }
            return <React.Fragment key={chatId} />;
          })}
        </ul>
        <div className="absolute flex w-full left-0 bottom-0 pb-10 pt-3 justify-center">
          <Button
            type="submit"
            className="w-12 h-12 bg-green-500 text-white text-2xl rounded-full"
          >
            <i className="fa-solid fa-people-roof"></i>
          </Button>
        </div>
      </form>
    </DrawerModal>
  );
};

export default CreateGroupDrawer;
