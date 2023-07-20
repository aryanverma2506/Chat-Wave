import React from "react";

interface AvatarProps extends React.PropsWithChildren {
  online?: boolean;
  userId?: string;
  username?: string;
}
const Avatar: React.FC<AvatarProps> = (props) => {
  const { online, userId, username } = props;

  if (!userId || !username) {
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
      {username[0]}
      {online && (
        <div className="absolute w-3 h-3 bg-green-500 bottom-0 right-0 rounded-full border border-white" />
      )}
      {!online && (
        <div className="absolute w-3 h-3 bg-gray-600 bottom-0 right-0 rounded-full border border-white" />
      )}
    </div>
  );
};

export default Avatar;
