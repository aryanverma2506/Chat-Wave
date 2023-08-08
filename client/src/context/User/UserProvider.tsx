import React, { useCallback, useEffect, useState } from "react";

import { UserContext } from "./UserContext";
import { useHttpClient } from "../../hooks/useHttpClient-hook";

interface UserProviderProps extends React.PropsWithChildren {}

let logoutTimer: NodeJS.Timeout;

const UserProvider: React.FC<UserProviderProps> = (props) => {
  const [id, setId] = useState<string>();
  const [name, setName] = useState<string>();
  const [profilePicUrl, setProfilePicUrl] = useState<string>();

  const { sendRequest } = useHttpClient();

  const logout = useCallback(async () => {
    try {
      await sendRequest({ url: "/user/logout", method: "POST" });
    } catch (error: any) {
      console.log(error);
    }
    localStorage.removeItem("tokenExpirationTime");
    setId(() => undefined);
    setName(() => undefined);
    setProfilePicUrl(() => undefined);
  }, [sendRequest]);

  const login = useCallback(
    (
      providedId?: string,
      providedName?: string,
      providedPicUrl?: string,
      tokenExpirationDate?: Date
    ) => {
      if (tokenExpirationDate) {
        localStorage.setItem(
          "tokenExpirationTime",
          tokenExpirationDate.toISOString()
        );
        clearTimeout(logoutTimer);
        setId(() => providedId);
        setName(() => providedName);
        setProfilePicUrl(() => providedPicUrl);
        logoutTimer = setTimeout(
          logout,
          tokenExpirationDate.getTime() - new Date().getTime()
        );
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
            const responseData = await sendRequest({ url: "/user/profile" });
            login(
              responseData.userId,
              responseData.name,
              responseData.profilePic,
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
        name,
        profilePicUrl,
        login,
        logout,
      }}
    >
      {props.children}
    </UserContext.Provider>
  );
};

export default UserProvider;
