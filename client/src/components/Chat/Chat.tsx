import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { DeltaOperation, DeltaStatic } from "quill";

import Button from "../Button/Button";
import Logo from "../Logo/Logo";
import { UserContext, UserContextType } from "../../context/User/UserContext";
import { useHttpClient } from "../../hooks/useHttpClient-hook";
import Contact from "../Contact/Contact";
import ChatInput from "../ChatInput/ChatInput";
import MessageBox from "../MessageBox/MessageBox";

interface UserObject {
  [key: string]: { username: string; online: boolean };
}

interface MessagesStructure {
  messageId: string;
  sender: string;
  recipient: string;
  formattedText?: DeltaOperation[] | null;
  urlPreviewData?: any;
  imageURL?: boolean;
  filename?: string;
}

const Chat: React.FC = () => {
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<UserObject | null>(null);
  const [allUsers, setAllUsers] = useState<UserObject | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>();
  const [file, setFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<MessagesStructure[]>([]);

  const divUnderMessages = useRef<HTMLDivElement>(null);

  const { id, username, setId, setUsername } =
    useContext<UserContextType>(UserContext);

  const { sendRequest } = useHttpClient();

  const showOnlineUsers = useCallback(
    (usersArray: { [key: string]: string }[]) => {
      const users: UserObject = {};
      usersArray.forEach(
        (user) =>
          (users[user.userId] = { username: user.username, online: true })
      );
      setOnlineUsers(users);
    },
    []
  );

  const messageHandler = useCallback(
    (event: MessageEvent) => {
      const messageData = JSON.parse(event.data);
      if ("online" in messageData) {
        showOnlineUsers(messageData.online);
      } else if ("text" in messageData) {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            ...messageData,
          },
        ]);
      } else if ("filename" in messageData) {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            ...messageData,
          },
        ]);
      }
    },
    [showOnlineUsers]
  );

  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimer: NodeJS.Timeout;
    function connectToWs() {
      ws = new WebSocket(`${process.env.REACT_APP_WEBSOCKET_URL!}/`);
      setWebSocket(() => ws);
      ws.addEventListener("message", messageHandler);
      ws.addEventListener("close", reconnect);
    }

    function reconnect() {
      reconnectTimer = setTimeout(() => {
        connectToWs();
      }, 5000);
    }

    connectToWs();

    return () => {
      ws.removeEventListener("message", messageHandler);
      ws.removeEventListener("close", reconnect);
      clearTimeout(reconnectTimer);
      ws.close();
      setWebSocket(() => null);
    };
  }, [messageHandler]);

  useEffect(() => {
    messages.length > 0 &&
      divUnderMessages.current?.scrollIntoView({
        behavior: "smooth",
      });
  }, [messages]);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const responseData = await sendRequest({ url: "/" });
        const allUsers: UserObject = {};
        responseData.users.forEach(
          (user: any) =>
            (allUsers[user._id] = { username: user.username, online: false })
        );
        setAllUsers(() => ({ ...allUsers, ...onlineUsers }));
      } catch (error: any) {
        console.log(error.message);
      }
    }

    fetchUsers();
  }, [id, onlineUsers, sendRequest]);

  useEffect(() => {
    async function fetchChats() {
      try {
        if (selectedUserId) {
          const responseData = await sendRequest({
            url: `/messages/${selectedUserId}`,
          });
          if ("messages" in responseData) {
            setMessages(() =>
              responseData.messages.map((message: any) => ({
                ...message,
                messageId: message._id,
              }))
            );
          }
        }
      } catch (error: any) {
        console.log(error);
      }
    }

    fetchChats();
  }, [selectedUserId, sendRequest]);

  function selectContact(userId: string) {
    userId !== id && setSelectedUserId(() => userId);
  }

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

  function sendMessageHandler(
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
      if (file) {
        const reader = new FileReader();
        reader.onload = (event: ProgressEvent<FileReader>) => {
          const uint8Array = new Uint8Array(reader.result as ArrayBuffer);
          const fileData = Array.from(uint8Array);
          webSocket?.send(
            JSON.stringify({
              message: {
                recipient: selectedUserId,
                formattedText: chatInput?.ops,
                urlPreviewData: urlPreviewData,
                file: { name: file.name, data: fileData },
              },
            })
          );
          id &&
            selectedUserId &&
            setMessages((prevMessages) => [
              ...prevMessages,
              {
                messageId: new Date().toISOString() + Math.random().toString(),
                sender: id,
                recipient: selectedUserId,
                formattedText: chatInput?.ops,
                urlPreviewData: urlPreviewData,
                imageURL: true,
                filename: URL.createObjectURL(file),
              },
            ]);
        };

        reader.readAsArrayBuffer(file);
        setFile(() => null);
      } else {
        webSocket?.send(
          JSON.stringify({
            message: {
              recipient: selectedUserId,
              formattedText: chatInput?.ops,
              urlPreviewData: urlPreviewData,
            },
          })
        );
        id &&
          selectedUserId &&
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              messageId: new Date().toISOString() + Math.random().toString(),
              sender: id,
              recipient: selectedUserId,
              urlPreviewData: urlPreviewData,
              formattedText: chatInput?.ops,
            },
          ]);
      }
      callback && callback();
    }
  }

  async function logout() {
    try {
      await sendRequest({ url: "/logout", method: "POST" });
      setId(() => null);
      setUsername(() => null);
      setWebSocket(() => null);
      setOnlineUsers(() => null);
      setAllUsers(() => null);
      setSelectedUserId(() => "");
      setMessages(() => []);
    } catch (error: any) {
      console.log(error.message);
    }
  }

  const filteredUsers: UserObject = {};

  if (allUsers) {
    for (const key in allUsers) {
      if (key !== id) {
        filteredUsers[key] = allUsers[key];
      }
    }
  }

  return (
    <div className="flex h-screen w-full">
      <div className="dark-theme white w-1/5 min-w-max flex flex-col">
        <div className="flex-grow">
          <Logo />
          {Object.keys(filteredUsers).map((userId) => (
            <Contact
              key={userId}
              userId={userId}
              online={filteredUsers[userId].online}
              selectedUserId={selectedUserId}
              username={filteredUsers[userId].username}
              onClick={selectContact.bind(this, userId)}
            />
          ))}
        </div>
        <div className="flex flex-col p-2 text-center items-center justify-center">
          <span className="flex gap-1 mr-2 mb-3 text-green-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6"
            >
              <path
                fillRule="evenodd"
                d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                clipRule="evenodd"
              />
            </svg>
            {username}
          </span>
          <Button
            className="w-full text-md bg-green-500 py-1 px-2 text-black font-bold rounded-md"
            onClick={logout}
          >
            Logout
          </Button>
        </div>
      </div>
      <div className="flex flex-col dark-theme-2 w-4/5 min-w-max p-3">
        <div className="flex-grow mb-4">
          {!selectedUserId && (
            <div className="flex h-full items-center justify-center">
              <div className="text-gray-400">
                &larr; Choose someone to chat with
              </div>
            </div>
          )}
          {!!selectedUserId && (
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
                  {messages.map((message) => (
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
                          {message.filename && (
                            <figure
                              className="my-3 mx-1 rounded-md figure"
                              onClick={() =>
                                imageDownloadHandler(
                                  `${process.env.REACT_APP_SERVER_URL}uploads/${message.filename}`
                                )
                              }
                            >
                              <img
                                src={
                                  message.imageURL
                                    ? message.filename
                                    : `${process.env.REACT_APP_SERVER_URL}uploads/${message.filename}`
                                }
                                alt={message.filename}
                              />
                              <figcaption>
                                <i className="fa-solid fa-download"></i>
                              </figcaption>
                            </figure>
                          )}
                          {message.formattedText ? (
                            <MessageBox
                              value={message.formattedText}
                              previewData={message.urlPreviewData}
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
        {!!selectedUserId && (
          <ChatInput
            users={filteredUsers}
            fileChangeHandler={(file) => setFile(() => file)}
            onSubmit={sendMessageHandler}
          />
        )}
      </div>
    </div>
  );
};

export default Chat;
