import React, { useEffect, useState } from "react";

import { UserContext } from "./UserContext";
import { useHttpClient } from "../../hooks/useHttpClient-hook";

interface UserProviderProps extends React.PropsWithChildren {}

const UserProvider: React.FC<UserProviderProps> = (props) => {
  const [id, setId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  const { sendRequest } = useHttpClient();

  useEffect(() => {
    async function fetchProfile(): Promise<void> {
      try {
        const responseData = await sendRequest({ url: "/profile" });
        setId(() => responseData.userId);
        setUsername(() => responseData.username);
      } catch (error: any) {
        console.log(error.message);
      }
    }

    fetchProfile();
  }, [sendRequest]);

  return (
    <UserContext.Provider
      value={{
        id,
        username,
        setId,
        setUsername,
      }}
    >
      {props.children}
    </UserContext.Provider>
  );
};

export default UserProvider;
