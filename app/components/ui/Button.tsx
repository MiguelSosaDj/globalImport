import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border border-blue-700/10 shadow-sm shadow-blue-600/20 hover:shadow-md hover:shadow-blue-600/30",
  secondary:
    "bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm",
  ghost: "bg-transparent hover:bg-slate-100 text-slate-600 border border-transparent",
  danger:
    "bg-gradient-to-b from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border border-red-700/10 shadow-sm shadow-red-600/20",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "text-xs px-3 py-1.5 rounded-lg",
  md: "text-sm px-4 py-2.5 rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`font-medium transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
