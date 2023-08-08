import React from "react";

import Avatar from "../Avatar/Avatar";

interface ContactProps extends React.PropsWithChildren {
  isGroupChat: boolean;
  chatId?: string;
  online?: boolean;
  activeChatId?: string;
  name?: string;
  profilePic?: string;
  className?: string;
  onClick: () => void;
}

const Contact: React.FC<ContactProps> = (props) => {
  const {
    isGroupChat,
    chatId,
    online,
    activeChatId,
    profilePic,
    name,
    className,
    onClick,
  } = props;

  if (!chatId || !name) {
    return <></>;
  }

  return (
    <li
      className={`border-b border-gray-500 flex items-center gap-2 cursor-pointer text-white ${
        chatId === activeChatId ? "dark-theme-2" : ""
      } ${className}`}
      onClick={onClick}
    >
      {chatId === activeChatId && (
        <div className="w-1 bg-green-500 h-12 rounded-r-md"></div>
      )}
      <div className="flex gap-2 py-2 pl-4 pr-8 items-center">
        <Avatar
          isGroupChat={isGroupChat}
          online={online}
          userId={chatId}
          name={name}
          profilePic={profilePic}
        />
        <span>{name}</span>
      </div>
    </li>
  );
};

export default Contact;
