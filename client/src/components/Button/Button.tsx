import React from "react";

interface ButtonProps extends React.PropsWithChildren {
  id?: string | number;
  label?: string;
  type?: "button" | "reset" | "submit";
  value?: string | number;
  disabled?: boolean;
  style?: Object;
  className?: string;
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = (props) => {
  const { id, type, label, disabled, style, className, children, onClick } =
    props;

  return (
    <>
      {label && <label htmlFor={id?.toString()}>{label}</label>}
      <button
        id={id?.toString()}
        type={type}
        disabled={disabled}
        style={style}
        className={className}
        onClick={onClick}
      >
        {children}
      </button>
    </>
  );
};

export default Button;
