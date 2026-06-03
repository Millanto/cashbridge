import React from "react";

interface ButtonProps {
  variant?: "primary" | "secondary" | "danger" | "success" | "outline";
  isLoading?: boolean;
  children?: React.ReactNode;
  className?: string;
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export function Button({
  children,
  variant = "primary",
  isLoading = false,
  className = "",
  disabled,
  onClick,
  type = "button",
  ...props
}: ButtonProps) {
  const baseStyle = "px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer outline-none select-none disabled:opacity-45 disabled:pointer-events-none active:scale-[0.98]";
  
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-xs",
    secondary: "bg-slate-900 hover:bg-slate-800 text-white border-0 shadow-xs",
    danger: "bg-rose-600 hover:bg-rose-700 text-white border-0 shadow-xs",
    success: "bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-xs",
    outline: "bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-1.5 h-3.5 w-3.5 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
