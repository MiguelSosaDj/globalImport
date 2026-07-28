import { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-white border border-slate-200 rounded-2xl shadow-sm shadow-slate-200/60 transition-shadow duration-200 hover:shadow-md hover:shadow-slate-200/70 ${className}`}
      {...props}
    />
  );
}

export function CardHeader({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`px-5 py-4 border-b border-slate-100 ${className}`}
      {...props}
    />
  );
}

export function CardBody({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`p-5 ${className}`} {...props} />;
}
