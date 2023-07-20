import React from "react";

import UserProvider from "./User/UserProvider";

const AllContext: React.FC<React.PropsWithChildren> = (props) => {
  return <UserProvider>{props.children}</UserProvider>;
};

export default AllContext;
