import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  className = "",
  id,
  type = "text",
  ...props
}) => {
  return (
    <div className="space-y-1.5 w-full">
      <div className="flex justify-between items-center">
        <label htmlFor={id} className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
          {label}
        </label>
        {error && (
          <span className="text-[10px] font-bold text-rose-600 lowercase bg-rose-50 px-1.5 py-0.5 rounded">
            {error}
          </span>
        )}
      </div>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            {icon}
          </div>
        )}
        <input
          id={id}
          type={type}
          className={`w-full bg-white border rounded-xl p-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
            icon ? "pl-11" : "pl-3.5"
          } ${
            error
              ? "border-rose-300 focus:ring-rose-500 focus:border-rose-500 bg-rose-50/10"
              : "border-slate-200 focus:ring-blue-500 focus:border-blue-500"
          } ${className}`}
          {...props}
        />
      </div>
    </div>
  );
};
