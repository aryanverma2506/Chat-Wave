import React, { useContext, useEffect, useRef, useState } from "react";

import { useHttpClient } from "../../hooks/useHttpClient-hook";
import { UserContext, UserContextType } from "../../context/User/UserContext";
import Button from "../Button/Button";
import Input from "../Input/Input";

interface AuthFormProps extends React.PropsWithChildren {
  isLogin: boolean;
}

const AuthForm: React.FC<AuthFormProps> = (props) => {
  const { isLogin } = props;

  const { sendRequest } = useHttpClient();

  const previewAvatarRef = useRef<HTMLImageElement>(null);

  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [profilePic, setProfilePic] = useState<File | null>(null);

  const { login: loginCtx } = useContext<UserContextType>(UserContext);

  useEffect(() => {
    if (previewAvatarRef.current && profilePic) {
      const avatarStyles = previewAvatarRef.current.style;
      avatarStyles.opacity = "0";
      const fadeInEffect = setInterval(() => {
        if (avatarStyles)
          avatarStyles.opacity = (+avatarStyles.opacity + 0.0015).toString();
        else {
          clearInterval(fadeInEffect);
        }
      }, 0);

      return () => {
        clearInterval(fadeInEffect);
      };
    }
  }, [profilePic]);

  async function submitHandler(event: React.FormEvent) {
    event.preventDefault();
    try {
      const formData = new FormData();
      if (!isLogin) {
        formData.append("name", name!);
        formData.append("profilePic", profilePic!);
      }
      formData.append("email", email!);
      formData.append("password", password!);

      const responseData = await sendRequest({
        url: isLogin ? "/user/login" : "/user/register",
        method: "POST",
        body: formData,
      });
      const expirationTime = new Date(
        new Date().getTime() + responseData.maxAge
      );
      loginCtx(
        responseData.userId,
        responseData.name,
        responseData.profilePic,
        expirationTime
      );
    } catch (error: any) {
      console.log(error.message);
    }
  }

  return (
    <form
      className="flex flex-col items-center justify-center w-64 mx-auto mb-2"
      onSubmit={submitHandler}
    >
      {!isLogin && (
        <>
          <div className="relative w-52 h-52 rounded-full border-4 border-green-500 mb-5">
            <img
              ref={previewAvatarRef}
              className="w-full h-full rounded-full bg-white"
              src={
                profilePic
                  ? URL.createObjectURL(profilePic)
                  : `${process.env.REACT_APP_SERVER_URL}assets/profilePic/default-user-pic.png`
              }
              alt={profilePic ? profilePic.name : "User profile"}
            />
            <Input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              placeholder="No file chosen"
              className="absolute flex items-center justify-center w-8 h-8 text-sm text-green-500 bg-white hover:text-white hover:bg-green-500 border-2 border-green-500 right-5 bottom-2 rounded-full focus:none shadow-2xl"
              callback={setProfilePic}
            >
              <i className="fa-solid fa-camera"></i>
            </Input>
          </div>
          <Input
            type="name"
            required
            placeholder="Name"
            value={name}
            onChange={(e) => e && setName(() => e.target.value)}
            className="block w-full rounded-sm p-2 mb-2 border"
          />
        </>
      )}
      <Input
        type="email"
        required
        placeholder="E-Mail"
        className="block w-full rounded-sm p-2 mb-2 border"
        value={email}
        onChange={(e) => e && setEmail(() => e.target.value)}
      />
      <Input
        type="password"
        required
        placeholder="Password"
        className="block w-full rounded-sm p-2 mb-2 border"
        value={password}
        onChange={(e) => e && setPassword(() => e.target.value)}
      />
      {!isLogin && (
        <Input
          type="password"
          required
          placeholder="Confirm Password"
          className="block w-full rounded-sm p-2 mb-2 border"
          value={confirmPassword}
          onChange={(e) => e && setConfirmPassword(() => e.target.value)}
        />
      )}
      <Button className="bg-green-500 text-white block w-full rounded-sm p-2">
        {isLogin ? "Login" : "Sign Up"}
      </Button>
    </form>
  );
};

export default AuthForm;
