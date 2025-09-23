import React from "react";

type ButtonProps = {
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  type?: "button" | "submit" | "reset";
  style?: React.CSSProperties;
};

export function Button({ onClick, disabled, children, className = "", type = "button", style }: ButtonProps) {
  const baseClasses =
    "flex items-center justify-center rounded-full bg-black/20 p-1 shadow-md transition duration-300 ease-in-out hover:bg-[#19d347eb]";
  const disabledClasses = disabled ? "cursor-not-allowed opacity-50" : "";
  return (
    <button
      style={style}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${disabledClasses} ${className}`}
    >
      {children}
    </button>
  );
}
