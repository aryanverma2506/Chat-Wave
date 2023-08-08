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
    <div className="flex flex-col text-center gap-10">
      <div
        className={`m-auto w-64 h-64 relative rounded-full flex items-center justify-center opacity-70 text-black ${color}`}
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
            <div className="absolute w-9 h-9 bg-green-500 bottom-6 right-6 rounded-full border border-white" />
          ) : (
            <div className="absolute w-9 h-9 bg-gray-600 bottom-6 right-6 rounded-full border border-white" />
          )
        ) : (
          <i className="fa-solid fa-users fa-2xl absolute flex justify-center items-center w-20 h-20 text-green-500 bottom-0 right-0 rounded-full"></i>
        )}
      </div>
      <div className="text-white">{name}</div>
    </div>
  );
};

export default Avatar;
