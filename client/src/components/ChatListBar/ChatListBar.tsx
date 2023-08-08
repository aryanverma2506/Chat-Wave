import React, { useContext, useEffect, useRef, useState } from "react";

import Logo from "../Logo/Logo";
import Button from "../Button/Button";
import Input from "../Input/Input";
import Contact from "../Contact/Contact";
import { useHttpClient } from "../../hooks/useHttpClient-hook";
import { UserContext, UserContextType } from "../../context/User/UserContext";
import { ChatContext, ChatContextType } from "../../context/Chat/ChatContext";

import {
  DirectChatModel,
  DirectChatObject,
} from "../../models/directChat.model";
import { ChatObject } from "../../models/chat.model";
import CreateGroupDrawer from "../CreateGroupDrawer/CreateGroupDrawer";

interface ChatListBarProps extends React.PropsWithChildren {
  logout: () => void;
}

const ChatListBar: React.FC<ChatListBarProps> = (props) => {
  const chatListRef = useRef<HTMLUListElement>(null);

  const { id, name, profilePicUrl } = useContext<UserContextType>(UserContext);
  const {
    activeChatId: activeChatIdCtx,
    chatList: chatListCtx,
    setActiveChatId: setActiveChatIdCtx,
    setChatList: setChatListCtx,
    setFriends: setFriendsCtx,
  } = useContext<ChatContextType>(ChatContext);

  const [currentOnlineFriends, setCurrentOnlineFriends] =
    useState<DirectChatObject>({});
  const [searchInput, setSearchInput] = useState<string>("");
  const [onlineSearchedUsers, setOnlineSearchedUsers] = useState<
    DirectChatModel[]
  >([]);
  const [searchedChats, setSearchedChats] = useState<ChatObject>({});
  const [showDrawer, setShowDrawer] = useState<boolean>(false);

  const { sendRequest } = useHttpClient();

  useEffect(() => {
    async function fetchChats() {
      try {
        const responseData = await sendRequest({ url: "/chat" });
        const allChats: ChatObject = {};
        const allFriends = new Set<string>();
        responseData.chatList.forEach((chat: any) => {
          if (chat.isGroupChat) {
            chat.chatId = chat._id;
            allChats[chat._id] = chat;
            chat.users.forEach((user: any) => {
              allFriends.add(user._id);
            });
          } else {
            chat.users.map((user: any) => {
              allFriends.add(user._id);
              return (allChats[chat._id] = {
                ...user,
                userId: user._id,
                chatId: chat._id,
                chatName: user.name,
                isGroupChat: false,
                isOnline: false,
              });
            });
          }
        });
        setChatListCtx(() => {
          const chatList: ChatObject = {
            ...allChats,
            ...currentOnlineFriends,
          };
          id && delete chatList[id];
          return chatList;
        });
        setFriendsCtx(() => allFriends);
      } catch (error: any) {
        console.log(error.message);
      }
    }

    fetchChats();
  }, [id, currentOnlineFriends, sendRequest, setChatListCtx, setFriendsCtx]);

  useEffect(() => {
    setSearchedChats(() => chatListCtx);
  }, [chatListCtx]);

  function logout() {
    setCurrentOnlineFriends(() => ({}));
    setChatListCtx(() => ({}));
    props.logout();
  }

  function selectChat(chatId: string) {
    chatId !== id && setActiveChatIdCtx(() => chatId);
  }

  function searchChangeHandler(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setSearchInput(() => event.target.value);
    if (event.target.value) {
      const filteredChats: ChatObject = {};
      for (const key in chatListCtx) {
        if (
          chatListCtx[key].chatName
            .toLowerCase()
            .includes(event.target.value.toLowerCase())
        ) {
          filteredChats[key] = chatListCtx[key];
        }
      }
      setSearchedChats(() => filteredChats);
    } else {
      setSearchedChats(() => chatListCtx);
    }

    if (onlineSearchedUsers.length > 0) {
      setOnlineSearchedUsers(() => []);
    }
  }

  async function searchSubmitHandler(event: React.FormEvent) {
    event.preventDefault();
    console.log(searchInput);
    if (searchInput && Object.keys(searchedChats).length > 0) {
      const firstChild = chatListRef.current?.querySelector(
        "li"
      ) as HTMLLIElement;
      if (firstChild) {
        firstChild.click();
      }
    } else if (searchInput) {
      const responseData = await sendRequest({
        url: `/user?searchUsers=${searchInput}`,
      });
      if (responseData.searchedUsers) {
        setOnlineSearchedUsers(() => responseData.searchedUsers);
      }
    }
  }

  return (
    <aside className="dark-theme white w-1/5 min-w-max flex flex-col">
      <div className="flex-grow relative">
        <CreateGroupDrawer
          showDrawer={showDrawer}
          setShowDrawer={setShowDrawer}
        />
        <div className="flex items-center justify-between text-green-500 px-4">
          <Logo />
          <Button
            className="w-10 h-10 rounded-full"
            onClick={() => setShowDrawer(() => true)}
          >
            <i className="fa-solid fa-users-medical"></i>
          </Button>
        </div>
        <form
          onSubmit={searchSubmitHandler}
          className="relative flex border rounded-md mx-2 mb-2 pl-4 dark-theme-2"
        >
          <Button type="submit" className="left-3 top-2.5 text-green-500">
            <i className="fa-solid fa-magnifying-glass"></i>
          </Button>
          <Input
            type="search"
            value={searchInput}
            placeholder="Search..."
            className="dark-theme-2 w-full p-2 pl-4 pr-10 rounded-md text-gray-200 focus:outline-none"
            onChange={searchChangeHandler}
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
        <ul className="list-none" ref={chatListRef}>
          {onlineSearchedUsers.length > 0 &&
            onlineSearchedUsers.map((contact: any) => (
              <Contact
                key={contact._id}
                isGroupChat={contact.isGroupChat}
                chatId={contact._id}
                online={false}
                activeChatId={activeChatIdCtx}
                name={contact.name}
                profilePic={contact.profilePic}
                onClick={selectChat.bind(null, contact._id)}
              />
            ))}
          {Object.keys(searchedChats).map((chatId) => {
            return (
              <Contact
                key={chatId}
                isGroupChat={searchedChats[chatId].isGroupChat}
                chatId={chatId}
                online={searchedChats[chatId].isOnline}
                activeChatId={activeChatIdCtx}
                name={searchedChats[chatId].chatName}
                profilePic={searchedChats[chatId].profilePic}
                onClick={selectChat.bind(null, chatId)}
              />
            );
          })}
        </ul>
      </div>
      <div className="flex flex-col p-2 text-center items-center justify-center">
        <span className="flex items-center gap-2 mx-auto mb-3 text-green-500">
          <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-green-500 bg-white">
            <img
              src={
                process.env.REACT_APP_SERVER_URL +
                (profilePicUrl
                  ? profilePicUrl
                  : "assets/profilePic/default-user-pic.png")
              }
              alt={name}
              className="h-full rounded-full"
            />
          </div>
          {name}
        </span>
        <Button
          className="w-full text-md bg-green-500 py-1 px-2 text-black font-bold rounded-md"
          onClick={logout}
        >
          Logout
        </Button>
      </div>
    </aside>
  );
};

export default ChatListBar;
