import React from "react";

import UserProvider from "./User/UserProvider";
import ChatProvider from "./Chat/ChatProvider";

const AllContext: React.FC<React.PropsWithChildren> = (props) => {
  return (
    <UserProvider>
      <ChatProvider>{props.children}</ChatProvider>
    </UserProvider>
  );
};

export default AllContext;
