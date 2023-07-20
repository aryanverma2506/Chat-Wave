import { Dispatch, SetStateAction, createContext } from "react";

export interface UserContextType {
  readonly id: string | null;
  readonly username: string | null;
  setId: Dispatch<SetStateAction<string | null>>;
  setUsername: Dispatch<SetStateAction<string | null>>;
}

export const UserContext = createContext<UserContextType>({
  id: "",
  username: "",
  setId: () => {},
  setUsername: () => {},
});
