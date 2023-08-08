import React, { useContext } from "react";

import Chat from "./screens/Chat/Chat";
import Authentication from "./screens/Authentication/Authentication";
import { UserContext, UserContextType } from "./context/User/UserContext";

const App: React.FC = () => {
  const { name } = useContext<UserContextType>(UserContext);

  if (name) {
    return <Chat />;
  }

  return <Authentication />;
};

export default App;
