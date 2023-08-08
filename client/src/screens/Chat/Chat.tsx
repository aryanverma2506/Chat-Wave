import React, { useContext, useEffect, useRef, useState } from "react";
import { DeltaStatic } from "quill";

import Button from "../../components/Button/Button";
import ChatInput from "../../components/ChatInput/ChatInput";
import MessageBox from "../../components/MessageBox/MessageBox";
import ChatListBar from "../../components/ChatListBar/ChatListBar";
import InfoPanel from "../../components/InfoPanel/InfoPanel";
import { useHttpClient } from "../../hooks/useHttpClient-hook";
import { UserContext, UserContextType } from "../../context/User/UserContext";
import { ChatContext, ChatContextType } from "../../context/Chat/ChatContext";
import socket from "../../utils/socket";

import { MessagesObject } from "../../models/message.model";
import { DirectChatModel } from "../../models/directChat.model";
import { ChatObject } from "../../models/chat.model";
import { GroupChatModel } from "../../models/groupChat.model";

const Chat: React.FC = () => {
  const divUnderMessages = useRef<HTMLDivElement>(null);

  const { id, logout: logoutCtx } = useContext<UserContextType>(UserContext);

  const {
    activeChatId: activeChatIdCtx,
    chatList: chatListCtx,
    messages: messagesCtx,
    friends: friendsCtx,
    setActiveChatId: setActiveChatIdCtx,
    setMessages: setMessagesCtx,
    setChatList: setChatListCtx,
  } = useContext<ChatContextType>(ChatContext);

  // const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
  // const [onlineUsers, setOnlineUsers] = useState<UserObject>({});
  const [file, setFile] = useState<File | null>(null);

  const { sendRequest } = useHttpClient();

  useEffect(() => {
    function unloadHandler() {
      socket.emit("before disconnect", id, Array.from(friendsCtx));
      socket.off("friend left");
      socket.disconnect();
    }

    function loadHandler() {
      socket.connect();

      socket.on("friend left", (friendsId: string) => {
        setChatListCtx((prevChatList) => {
          const updatedChatList: ChatObject = {};
          Object.keys(prevChatList).forEach((chatId) => {
            if (prevChatList[chatId].isGroupChat) {
              const updatedUsers = (
                prevChatList[chatId] as GroupChatModel
              ).users.map((user) =>
                friendsId === user._id ? { ...user, isOnline: false } : user
              );
              updatedChatList[chatId] = {
                ...prevChatList[chatId],
                users: updatedUsers,
              } as GroupChatModel;
            } else {
              updatedChatList[chatId] = prevChatList[chatId] as DirectChatModel;
              if (
                friendsId === (prevChatList[chatId] as DirectChatModel).userId
              ) {
                updatedChatList[chatId] = {
                  ...updatedChatList[chatId],
                  isOnline: false,
                } as DirectChatModel;
              }
            }
          });
          return updatedChatList;
        });
      });
    }

    if (id) {
      loadHandler();
      window.addEventListener("unload", unloadHandler);
      window.addEventListener("load", loadHandler);

      return () => {
        unloadHandler();
        window.removeEventListener("unload", unloadHandler);
        window.removeEventListener("load", loadHandler);
      };
    }
  }, [id, friendsCtx, setChatListCtx]);

  useEffect(() => {
    if (id) {
      socket.emit("setup connection", id, Array.from(friendsCtx));
      socket.on("online friends", (friendsIds: string[]) => {
        setChatListCtx((prevChatList) => {
          const updatedChatList: ChatObject = {};
          Object.keys(prevChatList).forEach((chatId) => {
            if (prevChatList[chatId].isGroupChat) {
              const updatedUsers = (
                prevChatList[chatId] as GroupChatModel
              ).users.map((user) => ({
                ...user,
                isOnline: friendsIds.includes(user._id),
              }));
              updatedChatList[chatId] = {
                ...prevChatList[chatId],
                users: updatedUsers,
              } as GroupChatModel;
            } else {
              updatedChatList[chatId] = prevChatList[chatId] as DirectChatModel;
              if (
                friendsIds.includes(
                  (prevChatList[chatId] as DirectChatModel).userId
                )
              ) {
                updatedChatList[chatId] = {
                  ...updatedChatList[chatId],
                  isOnline: true,
                } as DirectChatModel;
              } else {
                updatedChatList[chatId] = {
                  ...updatedChatList[chatId],
                  isOnline: false,
                } as DirectChatModel;
              }
            }
          });
          return updatedChatList;
        });
      });

      socket.on("friend joined", (friendsId: string) => {
        setChatListCtx((prevChatList) => {
          const updatedChatList: ChatObject = {};
          Object.keys(prevChatList).forEach((chatId) => {
            if (prevChatList[chatId].isGroupChat) {
              const updatedUsers = (
                prevChatList[chatId] as GroupChatModel
              ).users.map((user) =>
                friendsId === user._id ? { ...user, isOnline: true } : user
              );
              updatedChatList[chatId] = {
                ...prevChatList[chatId],
                users: updatedUsers,
              } as GroupChatModel;
            } else {
              updatedChatList[chatId] = prevChatList[chatId] as DirectChatModel;
              if (
                friendsId === (prevChatList[chatId] as DirectChatModel).userId
              ) {
                updatedChatList[chatId] = {
                  ...updatedChatList[chatId],
                  isOnline: true,
                } as DirectChatModel;
              }
            }
          });
          return updatedChatList;
        });
      });
      return () => {
        socket.off("online friends");
      };
    }
  }, [id, friendsCtx, setChatListCtx]);

  useEffect(() => {
    if (id && activeChatIdCtx) {
      socket.emit("join chat", activeChatIdCtx);
    }
  }, [id, activeChatIdCtx]);

  useEffect(() => {
    socket.on("message received", (newMessageReceived) => {
      console.log(newMessageReceived);
      setMessagesCtx((prevMessages) => {
        return {
          ...prevMessages,
          [newMessageReceived.chat._id]: [
            ...(prevMessages[newMessageReceived.chat._id] || []),
            {
              ...newMessageReceived,
              messageId: newMessageReceived._id,
            },
          ],
        };
      });
    });

    return () => {
      socket.off("message received");
    };
  });

  useEffect(() => {
    messagesCtx[activeChatIdCtx] &&
      messagesCtx[activeChatIdCtx].length > 0 &&
      divUnderMessages.current?.scrollIntoView({
        behavior: "smooth",
      });
  }, [messagesCtx, activeChatIdCtx]);

  useEffect(() => {
    async function fetchChats() {
      try {
        if (activeChatIdCtx) {
          const responseData = await sendRequest({
            url: `/message/${activeChatIdCtx}`,
          });
          if ("messages" in responseData) {
            const transformedMessage: MessagesObject = {};
            responseData.messages.forEach((message: any) => {
              transformedMessage[message.chat] = [
                ...(transformedMessage[message.chat] || []),
                {
                  ...message,
                  messageId: message._id,
                },
              ];
            });
            setMessagesCtx(() => transformedMessage);
          }
        }
      } catch (error: any) {
        console.log(error);
      }
    }

    fetchChats();
  }, [activeChatIdCtx, setMessagesCtx, sendRequest]);

  async function imageDownloadHandler(imageUrl: string) {
    try {
      const response = await fetch(imageUrl, {
        method: "GET",
        credentials: "include",
        mode: "no-cors",
      });
      const blob = await response.blob();
      const url = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result);
        };
        reader.onerror = () => {
          reject(new Error("Error reading Blob as Data URL."));
        };
        reader.readAsDataURL(blob);
      });
      const link = document.createElement("a");
      link.href = url as string;
      link.setAttribute(
        "download",
        imageUrl.substring(imageUrl.lastIndexOf("/") + 1)
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url as string);
    } catch (error) {
      console.error("Error downloading the image:", error);
    }
  }

  async function sendMessageHandler(
    event: React.FormEvent,
    chatInput: DeltaStatic | undefined,
    urlPreviewData: any | null,
    callback?: () => void
  ) {
    event.preventDefault();
    if (
      file ||
      urlPreviewData ||
      (chatInput?.ops &&
        !(
          chatInput?.ops[0]?.insert?.trim() === "" ||
          /^\s+$/.test(chatInput?.ops[0].insert.trim())
        ))
    ) {
      const formData = new FormData();
      formData.append("chatOrUserId", activeChatIdCtx);
      formData.append("formattedText", JSON.stringify(chatInput?.ops));
      formData.append("urlPreviewData", JSON.stringify(urlPreviewData));
      file && formData.append("file", file);
      const responseData = await sendRequest({
        url: "/message",
        method: "POST",
        body: formData,
      });
      if (activeChatIdCtx !== responseData.chatInstanceId) {
        setActiveChatIdCtx(
          () => responseData.chatInstanceId || activeChatIdCtx
        );
      }
      console.log(responseData);
      id &&
        activeChatIdCtx &&
        setMessagesCtx((prevMessages) => {
          return {
            ...prevMessages,
            [responseData.newMessage.chat._id]: [
              ...(prevMessages[responseData.newMessage.chat._id] || []),
              {
                ...responseData.newMessage,
                messageId: responseData.newMessage._id,
              },
            ],
          };
        });
      socket.emit("new message", responseData.newMessage);
      setFile(() => null);
      callback && callback();
    }
  }

  function logout() {
    logoutCtx();
    setMessagesCtx(() => ({}));
  }

  return (
    <div className="flex h-screen w-full">
      <ChatListBar logout={logout} />
      <div className="flex flex-col dark-theme-2 w-4/5 min-w-max p-3">
        <div className="flex-grow mb-4">
          {!activeChatIdCtx && (
            <div className="flex h-full items-center justify-center">
              <div className="text-gray-400">
                &larr; Choose someone to chat with
              </div>
            </div>
          )}
          {!!activeChatIdCtx && (
            <div className="relative flex flex-col h-full dark-theme-2 overflow-y-auto">
              {file ? (
                <div className="absolute text-gray-200 rounded-t-md flex flex-col items-center h-full w-full p-3 justify-around">
                  <Button
                    className="absolute right-4 top-3"
                    onClick={() => setFile(() => null)}
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </Button>
                  <div className="flex items-center h-5/6">
                    {file.type.startsWith("image") ? (
                      <img
                        className="object-cover max-h-full"
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                      />
                    ) : (
                      <p>Preview not available for this file.</p>
                    )}
                  </div>
                  <p>{file.name}</p>
                </div>
              ) : (
                <div className="absolute flex flex-col w-full gap-2 px-4">
                  {messagesCtx[activeChatIdCtx] &&
                    messagesCtx[activeChatIdCtx].map((message) => (
                      <div
                        key={message.messageId}
                        className={
                          message.sender === id
                            ? "flex items-start sender"
                            : "flex items-start receiver"
                        }
                      >
                        <div
                          className={`relative px-2 py-0.5 my-2 text-sm rounded-xl max-w-xs ${
                            message.sender === id
                              ? "bg-teal-900 text-white"
                              : "bg-black text-white"
                          }`}
                        >
                          <>
                            {message.content.filename && (
                              <figure
                                className="my-3 mx-1 rounded-md figure"
                                onClick={() =>
                                  imageDownloadHandler(
                                    `${process.env.REACT_APP_SERVER_URL}uploads/${message.content.filename}`
                                  )
                                }
                              >
                                <img
                                  src={
                                    message.imageURL
                                      ? message.content.filename
                                      : `${process.env.REACT_APP_SERVER_URL}${message.content.filename}`
                                  }
                                  alt={message.content.filename}
                                />
                                <figcaption>
                                  <i className="fa-solid fa-download"></i>
                                </figcaption>
                              </figure>
                            )}
                            {message.content.formattedText ? (
                              <MessageBox
                                value={message.content.formattedText}
                                previewData={message.content.urlPreviewData}
                              />
                            ) : (
                              ""
                            )}
                          </>
                          <div
                            className={`absolute top-0 w-3 ${
                              message.sender === id ? "right-0" : "left-0"
                            }`}
                          ></div>
                        </div>
                      </div>
                    ))}
                  <div ref={divUnderMessages} />
                </div>
              )}
            </div>
          )}
        </div>
        {!!activeChatIdCtx && (
          <ChatInput
            chatInfo={chatListCtx[activeChatIdCtx]}
            fileChangeHandler={(file) => setFile(() => file)}
            onSubmit={sendMessageHandler}
          />
        )}
      </div>
      {!!activeChatIdCtx && <InfoPanel />}
    </div>
  );
};

export default Chat;
