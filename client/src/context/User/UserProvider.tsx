import React, { useCallback, useEffect, useState } from "react";

import { UserContext } from "./UserContext";
import { useHttpClient } from "../../hooks/useHttpClient-hook";

interface UserProviderProps extends React.PropsWithChildren {}

let logoutTimer: NodeJS.Timeout;

const UserProvider: React.FC<UserProviderProps> = (props) => {
  const [id, setId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  const { sendRequest } = useHttpClient();

  const logout = useCallback(async () => {
    try {
      await sendRequest({ url: "/logout", method: "POST" });
    } catch (error: any) {
      console.log(error);
    }
    localStorage.removeItem("tokenExpirationTime");
    setId(() => null);
    setUsername(() => null);
  }, [sendRequest]);

  const login = useCallback(
    (
      providedId: string | null,
      providedName: string | null,
      tokenExpirationDate?: Date
    ) => {
      if (tokenExpirationDate) {
        localStorage.setItem(
          "tokenExpirationTime",
          tokenExpirationDate.toISOString()
        );
        clearTimeout(logoutTimer);
        setId(() => providedId);
        setUsername(() => providedName);
        logoutTimer = setTimeout(() => {
          logout();
        }, tokenExpirationDate.getTime() - new Date().getTime());
      }
    },
    [logout]
  );

  useEffect(() => {
    async function fetchProfile(): Promise<void> {
      let tokenExpirationDate: Date | undefined;
      if (localStorage.getItem("tokenExpirationTime")) {
        tokenExpirationDate = new Date(
          localStorage.getItem("tokenExpirationTime")!
        );
        if (tokenExpirationDate > new Date()) {
          try {
            const responseData = await sendRequest({ url: "/profile" });
            login(
              responseData.userId,
              responseData.username,
              tokenExpirationDate
            );
          } catch (error: any) {
            console.log(error.message);
          }
        } else {
          logout();
        }
      }
    }

    fetchProfile();
  }, [login, logout, sendRequest]);

  return (
    <UserContext.Provider
      value={{
        id,
        username,
        login,
        logout,
      }}
    >
      {props.children}
    </UserContext.Provider>
  );
};

export default UserProvider;
