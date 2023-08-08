import React, { useRef } from "react";
import { CSSTransition } from "react-transition-group";

import Button from "../Button/Button";

interface DrawerModalProps extends React.PropsWithChildren {
  showDrawer: boolean;
  setShowDrawer: React.Dispatch<React.SetStateAction<boolean>>;
  callbackOnExited?: () => void;
}
const DrawerModal: React.FC<DrawerModalProps> = (props) => {
  const { showDrawer, setShowDrawer, callbackOnExited } = props;

  const nodeRef = useRef(null);

  return (
    <div
      className={`absolute dark-theme h-screen w-full bg-white z-10 p-4 ${
        !showDrawer ? "-left-full" : "left-0"
      } transition-all`}
    >
      <CSSTransition
        in={showDrawer}
        timeout={150}
        nodeRef={nodeRef}
        onExited={callbackOnExited}
        unmountOnExit
      >
        <>
          <div className="flex justify-between text-green-500 pb-2 px-2">
            <Button onClick={() => setShowDrawer(() => false)}>
              <i className="fa-solid fa-arrow-left-long" />
            </Button>
            <Button onClick={() => setShowDrawer(() => false)}>
              <i className="fa-solid fa-xmark" />
            </Button>
          </div>
          {props.children}
        </>
      </CSSTransition>
    </div>
  );
};

export default DrawerModal;
