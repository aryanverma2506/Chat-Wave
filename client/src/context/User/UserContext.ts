import { createContext } from "react";

export interface UserContextType {
  readonly id?: string;
  readonly name?: string;
  readonly profilePicUrl?: string;
  login: (
    providedId?: string,
    providedName?: string,
    providedPicUrl?: string,
    tokenExpirationDate?: Date
  ) => void;
  logout: () => void;
}

export const UserContext = createContext<UserContextType>({
  id: "",
  name: "",
  profilePicUrl: "",
  login: (
    providedId?: string,
    providedName?: string,
    providedPicUrl?: string,
    tokenExpirationDate?: Date
  ) => {},
  logout: () => {},
});
