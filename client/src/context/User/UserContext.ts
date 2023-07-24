import { createContext } from "react";

export interface UserContextType {
  readonly id: string | null;
  readonly username: string | null;
  login: (providedId: string | null, providedName: string | null, tokenExpirationDate?: Date) => void;
  logout: () => void;
}

export const UserContext = createContext<UserContextType>({
  id: "",
  username: "",
  login: (providedId: string | null, providedName: string | null, tokenExpirationDate?: Date) => {},
  logout: () => {},
});
