import { HTMLAttributes } from "react";

type Tone = "neutral" | "success" | "warning" | "danger" | "primary";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-600 border-slate-200",
  success: "bg-green-50 text-green-700 border-green-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-red-50 text-red-700 border-red-200",
  primary: "bg-blue-50 text-blue-700 border-blue-200",
};

export function Badge({ tone = "neutral", className = "", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${TONE_CLASSES[tone]} ${className}`}
      {...props}
    />
  );
}
