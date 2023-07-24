import React, { useContext } from "react";

import Chat from "./components/Chat/Chat";
import RegisterAndLoginForm from "./components/RegisterAndLoginForm/RegisterAndLoginForm";
import { UserContext, UserContextType } from "./context/User/UserContext";

const App: React.FC = () => {
  const { username } = useContext<UserContextType>(UserContext);

  if (username) {
    return <Chat />;
  }

  return <RegisterAndLoginForm />;
};

export default App;
