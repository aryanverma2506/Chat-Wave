import React, {
  FormEvent,
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
import Input from "../Input/Input";

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
  const divUnderMessages = useRef<HTMLDivElement>(null);
  const contactListRef = useRef<HTMLUListElement>(null);

  const {
    id,
    username,
    logout: logoutCtx,
  } = useContext<UserContextType>(UserContext);

  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<UserObject>({});
  const [filteredUsers, setFilteredUsers] = useState<UserObject>({});
  const [selectedUserId, setSelectedUserId] = useState<string>();
  const [file, setFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<MessagesStructure[]>([]);
  const [searchInput, setSearchInput] = useState<string>("");

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
      setWebSocket(ws);
      ws.addEventListener("message", messageHandler);
      ws.addEventListener("close", reconnect);
    }

    function reconnect() {
      reconnectTimer = setTimeout(connectToWs, 5000);
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
        setFilteredUsers(() => {
          const filteredUsers: UserObject = { ...allUsers, ...onlineUsers };
          id && delete filteredUsers[id];
          return filteredUsers;
        });
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

  function contactSearchHandler(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setSearchInput(() => event.target.value);
  }

  function searchSubmitHandler(event: FormEvent) {
    event.preventDefault();
    if (searchInput && Object.keys(filteredUsers).length > 0) {
      const firstChild = contactListRef.current
        ?.firstElementChild as HTMLLIElement;
      if (firstChild) {
        firstChild.click();
      }
    }
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
      logoutCtx();
      setWebSocket(() => null);
      setOnlineUsers(() => ({}));
      setFilteredUsers(() => ({}));
      setSelectedUserId(() => undefined);
      setMessages(() => []);
    } catch (error: any) {
      console.log(error.message);
    }
  }

  return (
    <div className="flex h-screen w-full">
      <div className="dark-theme white w-1/5 min-w-max flex flex-col">
        <div className="flex-grow">
          <Logo />
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
              className="dark-theme-2 w-full p-2 pl-4 pr-10 rounded-md text-gray-200 focus:outline-none"
              onChange={contactSearchHandler}
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
          <ul className="list-none" ref={contactListRef}>
            {Object.keys(filteredUsers).map((userId) => {
              if (searchInput) {
                if (
                  filteredUsers[userId].username
                    .toLowerCase()
                    .includes(searchInput.toLowerCase())
                ) {
                  return (
                    <Contact
                      key={userId}
                      userId={userId}
                      online={filteredUsers[userId].online}
                      selectedUserId={selectedUserId}
                      username={filteredUsers[userId].username}
                      onClick={selectContact.bind(null, userId)}
                    />
                  );
                }
              } else {
                return (
                  <Contact
                    key={userId}
                    userId={userId}
                    online={filteredUsers[userId].online}
                    selectedUserId={selectedUserId}
                    username={filteredUsers[userId].username}
                    onClick={selectContact.bind(null, userId)}
                  />
                );
              }
              return <React.Fragment key={userId} />;
            })}
          </ul>
        </div>
        <div className="flex flex-col p-2 text-center items-center justify-center">
          <span className="flex items-center gap-2 mx-auto mb-3 text-green-500">
            <i className="fa-solid fa-circle-user text-2xl"></i>
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
