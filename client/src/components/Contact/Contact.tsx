import React from "react";

import Avatar from "../Avatar/Avatar";

interface ContactProps extends React.PropsWithChildren {
  userId?: string;
  online?: boolean;
  selectedUserId?: string;
  username?: string;
  className?: string;
  onClick: () => void;
}

const Contact: React.FC<ContactProps> = (props) => {
  const { userId, online, selectedUserId, username, className, onClick } =
    props;

  if (!userId || !username) {
    return <></>;
  }

  return (
    <li
      className={`border-b border-gray-500 flex items-center gap-2 cursor-pointer text-white ${
        userId === selectedUserId ? "dark-theme-2" : ""
      } ${className}`}
      onClick={onClick}
    >
      {userId === selectedUserId && (
        <div className="w-1 bg-green-500 h-12 rounded-r-md"></div>
      )}
      <div className="flex gap-2 py-2 pl-4 pr-8 items-center">
        <Avatar online={online} userId={userId} username={username} />
        <span>{username}</span>
      </div>
    </li>
  );
};

export default Contact;
