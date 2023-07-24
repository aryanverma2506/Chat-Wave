import React, { useContext, useState } from "react";
// import { Link } from "react-router-dom";

import Input from "../Input/Input";
import Button from "../Button/Button";
import { UserContext, UserContextType } from "../../context/User/UserContext";
import { useHttpClient } from "../../hooks/useHttpClient-hook";


const RegisterAndLoginForm: React.FC = () => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoginOrRegister, setIsLoginOrRegister] = useState<string>("login");

  const { login } =
    useContext<UserContextType>(UserContext);

  const { sendRequest } = useHttpClient();

  async function submitHandler(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    try {
      const responseData = await sendRequest({
        url: isLoginOrRegister === "login" ? "/login" : "/register",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });
      const expirationTime = new Date(new Date().getTime() + responseData.maxAge);
      login(responseData.userId, username, expirationTime);
    } catch (error: any) {
      console.log(error.message);
    }
  }

  return (
    <div className="dark-theme-2 h-screen flex items-center">
      <form className="w-64 mx-auto mb-12" onSubmit={submitHandler}>
        <Input
          type="text"
          placeholder="username"
          className="block w-full rounded-sm p-2 mb-2 border"
          value={username}
          onChange={(e) => e && setUsername(e.target.value)}
        />
        <Input
          type="password"
          placeholder="password"
          className="block w-full rounded-sm p-2 mb-2 border"
          value={password}
          onChange={(e) => e && setPassword(e.target.value)}
        />
        <Button className="bg-green-500 text-white block w-full rounded-sm p-2">
          {isLoginOrRegister === "login" ? "Login" : "Register"}
        </Button>
        <div className="text-center text-gray-200 mt-2">
          {isLoginOrRegister === "login" ? (
            <>
              {"Don't have an account? "}
              <br />
              <Button
                type="button"
                className="text-green-500"
                onClick={() => setIsLoginOrRegister("register")}
              >
                Register here
              </Button>
            </>
          ) : (
            <>
              {"Already a member? "}
              <br />
              <Button
                type="button"
                className="text-green-500"
                onClick={() => setIsLoginOrRegister("login")}
              >
                Login here
              </Button>
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default RegisterAndLoginForm;
