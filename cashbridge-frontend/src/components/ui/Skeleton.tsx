import React from "react";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  variant = "text"
}) => {
  const baseStyle = "animate-pulse bg-slate-700/20 dark:bg-slate-705/30";
  
  const variants = {
    text: "h-3.5 w-full rounded",
    circular: "rounded-full shrink-0",
    rectangular: "rounded-xl"
  };

  return <div className={`${baseStyle} ${variants[variant]} ${className}`} />;
};
