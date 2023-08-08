import React from "react";

interface AvatarProps extends React.PropsWithChildren {
  isGroupChat: boolean;
  online?: boolean;
  userId?: string;
  name?: string;
  profilePic?: string;
}
const Avatar: React.FC<AvatarProps> = (props) => {
  const { isGroupChat, online, userId, name, profilePic } = props;

  if (!userId || !name) {
    return <></>;
  }

  const colors = [
    "bg-red-200",
    "bg-green-200",
    "bg-blue-200",
    "bg-purple-200",
    "bg-yellow-200",
    "bg-teal-200",
  ];

  const userIdBase10 = parseInt(userId, 16);
  const colorIndex = userIdBase10 % colors.length;
  const color = colors[colorIndex];

  return (
    <div
      className={`w-8 h-8 relative rounded-full flex items-center justify-center opacity-70 text-black ${color}`}
    >
      {profilePic ? (
        <img
          src={process.env.REACT_APP_SERVER_URL + profilePic}
          alt={name}
          className="h-full rounded-full"
        />
      ) : (
        name[0]
      )}
      {!isGroupChat ? (
        online ? (
          <div className="absolute w-3 h-3 bg-green-500 bottom-0 right-0 rounded-full border border-white" />
        ) : (
          <div className="absolute w-3 h-3 bg-gray-600 bottom-0 right-0 rounded-full border border-white" />
        )
      ) : (
        <i className="fa-solid fa-users fa-2xs absolute flex justify-center items-center w-3 h-3 text-green-500 bottom-0 right-0 rounded-full"></i>
      )}
    </div>
  );
};

export default Avatar;
