import React from "react";
import { AlertCircle, CheckCircle, Info } from "lucide-react";

interface AlertProps {
  type?: "info" | "success" | "error";
  title?: string;
  message: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = "info",
  title,
  message
}) => {
  const styles = {
    info: "bg-blue-50 border-blue-200 text-blue-800",
    success: "bg-emerald-50 border-emerald-200 text-emerald-800",
    error: "bg-rose-50 border-rose-250 text-rose-800"
  };

  const Icons = {
    info: <Info className="h-4 w-4 text-blue-500 shrink-0" />,
    success: <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
  };

  return (
    <div className={`p-3.5 border rounded-xl flex items-start gap-3 text-xs leading-relaxed ${styles[type]}`}>
      {Icons[type]}
      <div className="min-w-0">
        {title && <span className="font-bold block tracking-tight mb-0.5">{title}</span>}
        <p className="font-medium">{message}</p>
      </div>
    </div>
  );
};
