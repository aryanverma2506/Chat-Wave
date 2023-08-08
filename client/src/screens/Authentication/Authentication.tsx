import React, { useState } from "react";

import Button from "../../components/Button/Button";
import AuthForm from "../../components/AuthForm/AuthForm";

const Authentication: React.FC = () => {
  const [isLogin, setIsLogin] = useState<boolean>(true);

  return (
    <div className="dark-theme flex items-center h-full min-h-screen w-full min-w-max p-12">
      <div className="dark-theme-2 flex flex-col w-max justify-center p-10 m-auto rounded-xl">
        <AuthForm isLogin={isLogin} />
        <div className="text-center text-gray-200">
          {isLogin ? (
            <>
              {"Don't have an account? "}
              <br />
              <Button
                type="button"
                className="text-green-500"
                onClick={() => setIsLogin(() => false)}
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
                onClick={() => setIsLogin(() => true)}
              >
                Login here
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Authentication;
